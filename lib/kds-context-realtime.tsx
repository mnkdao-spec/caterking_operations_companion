import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  firedCoursesService,
  orderItemsService,
  tableGroupsService,
  coursesService,
  eventsService,
  realtimeSubscriptions,
  type Event,
  type FiredCourse,
  type OrderItem,
  type TableGroup,
  type Course,
} from "./supabase-kds";

export type StationType = "expo" | "grill" | "saute" | "garde_manger" | "dessert" | "plating";

export interface StationQueue {
  stationType: StationType;
  items: (OrderItem & { tableGroup: string; tableNumber: number; courseName: string })[];
}

interface KDSRealtimeContextType {
  // State
  currentEvent: Event | null;
  firedCourses: FiredCourse[];
  isLoading: boolean;
  error: string | null;

  // Event management
  loadEvent: (eventId?: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;

  // Course operations
  fireCourse: (tableGroupId: string, courseNumber: number) => Promise<void>;
  markCourseServed: (courseId: string) => Promise<void>;

  // Station operations
  getStationQueue: (station: StationType) => StationQueue;
  bumpItem: (itemId: string) => Promise<void>;

  // Plating operations
  getPlatingQueue: () => FiredCourse[];
  markCoursePlated: (courseId: string) => Promise<void>;

  // Subscriptions
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
}

const KDSRealtimeContext = createContext<KDSRealtimeContextType | null>(null);

export function KDSRealtimeProvider({ children }: { children: ReactNode }) {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [firedCourses, setFiredCourses] = useState<FiredCourse[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Array<() => void>>([]);

  // Load event and related data
  const loadEvent = useCallback(async (eventId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let event: Event | null = null;

      if (eventId) {
        event = await eventsService.getEventById(eventId);
      } else {
        event = await eventsService.getActiveEvent();
      }

      if (!event) {
        setError("No active event found");
        setCurrentEvent(null);
        return;
      }

      setCurrentEvent(event);

      // Load related data
      const [firedCoursesData, tableGroupsData, coursesData] = await Promise.all([
        firedCoursesService.getFiredCoursesByEvent(event.id),
        tableGroupsService.getTableGroupsByEvent(event.id),
        coursesService.getCoursesByEvent(event.id),
      ]);

      setFiredCourses(firedCoursesData);
      setTableGroups(tableGroupsData);
      setCourses(coursesData);

      // Load all order items for this event
      const allOrderItems: OrderItem[] = [];
      for (const firedCourse of firedCoursesData) {
        const items = await orderItemsService.getItemsByFiredCourse(firedCourse.id);
        allOrderItems.push(...items);
      }
      setOrderItems(allOrderItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load event";
      setError(errorMessage);
      console.error("Error loading event:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fire a course
  const fireCourse = useCallback(
    async (tableGroupId: string, courseNumber: number) => {
      if (!currentEvent) return;

      try {
        const course = courses.find((c) => c.course_number === courseNumber);
        if (!course) {
          setError("Course not found");
          return;
        }

        const newFiredCourse = await firedCoursesService.fireCourse(
          currentEvent.id,
          course.id,
          tableGroupId
        );

        if (newFiredCourse) {
          setFiredCourses((prev) => [...prev, newFiredCourse]);

          // Create order items for this fired course
          const courseData = await coursesService.getCourseWithMenuItems(course.id);
          if (courseData) {
            const tableGroup = tableGroups.find((tg) => tg.id === tableGroupId);
            if (tableGroup) {
              const itemsPerStation: Record<string, number> = {};
              courseData.menu_items.forEach((item) => {
                itemsPerStation[item.station] =
                  (itemsPerStation[item.station] || 0) +
                  Math.ceil(tableGroup.guest_count / courseData.menu_items.length);
              });
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fire course";
        setError(errorMessage);
        console.error("Error firing course:", err);
      }
    },
    [currentEvent, courses, tableGroups]
  );

  // Mark course as served
  const markCourseServed = useCallback(async (courseId: string) => {
    try {
      const updated = await firedCoursesService.updateCourseStatus(courseId, "served");
      if (updated) {
        setFiredCourses((prev) =>
          prev.map((course) => (course.id === courseId ? updated : course))
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mark course as served";
      setError(errorMessage);
      console.error("Error marking course as served:", err);
    }
  }, []);

  // Get station queue
  const getStationQueue = useCallback((station: StationType): StationQueue => {
    const stationItems = orderItems
      .filter((item) => item.station === station && item.status !== "done")
      .sort((a, b) => new Date(a.fired_at).getTime() - new Date(b.fired_at).getTime());

    // Enrich with table group and course info
    const enrichedItems = stationItems.map((item) => {
      const firedCourse = firedCourses.find((fc) => fc.id === item.fired_course_id);
      const tableGroup = tableGroups.find((tg) => tg.id === firedCourse?.table_group_id);
      const course = courses.find((c) => c.id === firedCourse?.course_id);

      return {
        ...item,
        tableGroup: tableGroup?.name || "Unknown",
        tableNumber: tableGroup?.table_numbers[0] || 0,
        courseName: course?.name || "Unknown",
      };
    });

    return { stationType: station, items: enrichedItems };
  }, [orderItems, firedCourses, tableGroups, courses]);

  // Bump item
  const bumpItem = useCallback(async (itemId: string) => {
    try {
      const updated = await orderItemsService.bumpItem(itemId);
      if (updated) {
        setOrderItems((prev) =>
          prev.map((item) => (item.id === itemId ? updated : item))
        );

        // Check if all items in the fired course are done
        const item = orderItems.find((i) => i.id === itemId);
        if (item) {
          const courseItems = orderItems.filter(
            (i) => i.fired_course_id === item.fired_course_id
          );
          const allDone = courseItems.every((i) => i.status === "done" || i.id === itemId);

          if (allDone) {
            // Update fired course status to ready
            await firedCoursesService.updateCourseStatus(item.fired_course_id, "ready");
            setFiredCourses((prev) =>
              prev.map((fc) =>
                fc.id === item.fired_course_id ? { ...fc, status: "ready" } : fc
              )
            );
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to bump item";
      setError(errorMessage);
      console.error("Error bumping item:", err);
    }
  }, [orderItems]);

  // Get plating queue
  const getPlatingQueue = useCallback((): FiredCourse[] => {
    return firedCourses.filter(
      (course) => course.status === "ready" || course.status === "in_progress"
    );
  }, [firedCourses]);

  // Mark course as plated
  const markCoursePlated = useCallback(async (courseId: string) => {
    try {
      const updated = await firedCoursesService.updateCourseStatus(courseId, "served");
      if (updated) {
        setFiredCourses((prev) =>
          prev.map((course) => (course.id === courseId ? updated : course))
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mark course as plated";
      setError(errorMessage);
      console.error("Error marking course as plated:", err);
    }
  }, []);

  // Subscribe to realtime updates
  const subscribeToUpdates = useCallback(() => {
    if (!currentEvent) return;

    const newSubscriptions: Array<() => void> = [];

    // Subscribe to fired courses changes
    const unsubscribeFiredCourses = realtimeSubscriptions.subscribeToFiredCourses(
      currentEvent.id,
      (course: FiredCourse) => {
        setFiredCourses((prev) => {
          const exists = prev.find((fc) => fc.id === course.id);
          if (exists) {
            return prev.map((fc) => (fc.id === course.id ? course : fc));
          }
          return [...prev, course];
        });
      }
    );
    newSubscriptions.push(unsubscribeFiredCourses);

    // Subscribe to order items changes
    const unsubscribeOrderItems = realtimeSubscriptions.subscribeToStationQueue(
      currentEvent.id,
      "*", // Subscribe to all stations
      (item: OrderItem) => {
        setOrderItems((prev) => {
          const exists = prev.find((oi) => oi.id === item.id);
          if (exists) {
            return prev.map((oi) => (oi.id === item.id ? item : oi));
          }
          return [...prev, item];
        });
      }
    );
    newSubscriptions.push(unsubscribeOrderItems);

    setSubscriptions(newSubscriptions);
  }, [currentEvent]);

  // Unsubscribe from realtime updates
  const unsubscribeFromUpdates = useCallback(() => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    setSubscriptions([]);
  }, [subscriptions]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromUpdates();
    };
  }, [unsubscribeFromUpdates]);

  const value: KDSRealtimeContextType = {
    currentEvent,
    firedCourses,
    isLoading,
    error,
    loadEvent,
    setCurrentEvent,
    fireCourse,
    markCourseServed,
    getStationQueue,
    bumpItem,
    getPlatingQueue,
    markCoursePlated,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  };

  return (
    <KDSRealtimeContext.Provider value={value}>{children}</KDSRealtimeContext.Provider>
  );
}

export function useKDSRealtime() {
  const context = useContext(KDSRealtimeContext);
  if (!context) {
    throw new Error("useKDSRealtime must be used within a KDSRealtimeProvider");
  }
  return context;
}
