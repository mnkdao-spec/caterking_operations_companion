import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { storage } from "./storage";

// Types
export type StationType = "expo" | "grill" | "saute" | "garde_manger" | "dessert" | "plating";
export type OrderStatus = "queued" | "cooking" | "done";
export type CourseStatus = "pending" | "fired" | "in_progress" | "ready" | "served";

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  station: StationType;
  modifications: string[];
  status: OrderStatus;
  firedAt?: Date;
  bumpedAt?: Date;
}

export interface FiredCourse {
  id: string;
  eventId: string;
  tableGroup: string;
  tableNumber: number;
  courseNumber: number;
  courseName: string;
  items: OrderItem[];
  firedAt: Date;
  status: CourseStatus;
}

export interface Event {
  id: string;
  name: string;
  client: string;
  guestCount: number;
  venue: string;
  startTime: Date;
  courses: {
    number: number;
    name: string;
    menuItems: { id: string; name: string; station: StationType }[];
  }[];
  tableGroups: {
    id: string;
    name: string;
    tables: number[];
    guestCount: number;
  }[];
}

export interface StationQueue {
  stationType: StationType;
  items: (OrderItem & { tableGroup: string; tableNumber: number; courseName: string })[];
}

interface KDSContextType {
  // Current event
  currentEvent: Event | null;
  setCurrentEvent: (event: Event | null) => void;

  // Fired courses
  firedCourses: FiredCourse[];
  fireCourse: (tableGroupId: string, courseNumber: number) => void;
  markCourseServed: (courseId: string) => void;

  // Station queues
  getStationQueue: (station: StationType) => StationQueue;
  bumpItem: (itemId: string) => void;

  // Plating
  getPlatingQueue: () => FiredCourse[];
  markCoursePlated: (courseId: string) => void;

  // Real-time simulation
  simulateIncomingOrder: () => void;
}

const KDSContext = createContext<KDSContextType | null>(null);

// Mock event data
const MOCK_EVENT: Event = {
  id: "evt-1",
  name: "Johnson Wedding Reception",
  client: "Johnson Family",
  guestCount: 120,
  venue: "Grand Ballroom, Hilton Hotel",
  startTime: new Date(),
  courses: [
    {
      number: 1,
      name: "Appetizers",
      menuItems: [
        { id: "m1", name: "Bruschetta", station: "garde_manger" },
        { id: "m2", name: "Stuffed Mushrooms", station: "saute" },
      ],
    },
    {
      number: 2,
      name: "Salads",
      menuItems: [
        { id: "m3", name: "Caesar Salad", station: "garde_manger" },
        { id: "m4", name: "Caprese", station: "garde_manger" },
      ],
    },
    {
      number: 3,
      name: "Main Course",
      menuItems: [
        { id: "m5", name: "Ribeye Steak", station: "grill" },
        { id: "m6", name: "Grilled Salmon", station: "grill" },
        { id: "m7", name: "Mushroom Risotto", station: "saute" },
        { id: "m8", name: "Roasted Chicken", station: "grill" },
      ],
    },
    {
      number: 4,
      name: "Dessert",
      menuItems: [
        { id: "m9", name: "Chocolate Lava Cake", station: "dessert" },
        { id: "m10", name: "Tiramisu", station: "dessert" },
      ],
    },
  ],
  tableGroups: [
    { id: "tg1", name: "Tables 1-4", tables: [1, 2, 3, 4], guestCount: 32 },
    { id: "tg2", name: "Tables 5-8", tables: [5, 6, 7, 8], guestCount: 28 },
    { id: "tg3", name: "Tables 9-12", tables: [9, 10, 11, 12], guestCount: 36 },
    { id: "tg4", name: "Head Table", tables: [0], guestCount: 24 },
  ],
};

export function KDSProvider({ children }: { children: ReactNode }) {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [firedCourses, setFiredCourses] = useState<FiredCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from storage on mount
  useEffect(() => {
    loadKDSData();
  }, []);

  // Save data to storage whenever it changes
  useEffect(() => {
    if (!loading && currentEvent) {
      saveKDSData();
    }
  }, [currentEvent, firedCourses, loading]);

  const loadKDSData = async () => {
    try {
      setLoading(true);
      const storedFiredCourses = await storage.load<FiredCourse[]>("FIRED_COURSES");
      if (storedFiredCourses) {
        setFiredCourses(storedFiredCourses);
      }
      // Use mock event for now
      setCurrentEvent(MOCK_EVENT);
    } catch (error) {
      console.error("Error loading KDS data:", error);
      setCurrentEvent(MOCK_EVENT);
    } finally {
      setLoading(false);
    }
  };

  const saveKDSData = async () => {
    try {
      await storage.save("FIRED_COURSES", firedCourses);
    } catch (error) {
      console.error("Error saving KDS data:", error);
    }
  };

  // Fire a course for a table group
  const fireCourse = useCallback((tableGroupId: string, courseNumber: number) => {
    if (!currentEvent) return;

    const tableGroup = currentEvent.tableGroups.find((tg) => tg.id === tableGroupId);
    const course = currentEvent.courses.find((c) => c.number === courseNumber);

    if (!tableGroup || !course) return;

    const newCourse: FiredCourse = {
      id: `fc-${Date.now()}`,
      eventId: currentEvent.id,
      tableGroup: tableGroup.name,
      tableNumber: tableGroup.tables[0],
      courseNumber: course.number,
      courseName: course.name,
      firedAt: new Date(),
      status: "fired",
      items: course.menuItems.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        menuItemId: item.id,
        name: item.name,
        quantity: Math.ceil(tableGroup.guestCount / course.menuItems.length),
        station: item.station,
        modifications: [],
        status: "queued" as OrderStatus,
        firedAt: new Date(),
      })),
    };

    setFiredCourses((prev) => [...prev, newCourse]);
  }, [currentEvent]);

  // Mark a course as served
  const markCourseServed = useCallback((courseId: string) => {
    setFiredCourses((prev) =>
      prev.map((course) =>
        course.id === courseId ? { ...course, status: "served" as CourseStatus } : course
      )
    );
  }, []);

  // Get queue for a specific station
  const getStationQueue = useCallback((station: StationType): StationQueue => {
    const items: (OrderItem & { tableGroup: string; tableNumber: number; courseName: string })[] = [];

    firedCourses
      .filter((course) => course.status !== "served")
      .forEach((course) => {
        course.items
          .filter((item) => item.station === station && item.status !== "done")
          .forEach((item) => {
            items.push({
              ...item,
              tableGroup: course.tableGroup,
              tableNumber: course.tableNumber,
              courseName: course.courseName,
            });
          });
      });

    // Sort by fired time (oldest first)
    items.sort((a, b) => (a.firedAt?.getTime() || 0) - (b.firedAt?.getTime() || 0));

    return { stationType: station, items };
  }, [firedCourses]);

  // Bump an item (mark as done)
  const bumpItem = useCallback((itemId: string) => {
    setFiredCourses((prev) =>
      prev.map((course) => {
        const updatedItems = course.items.map((item) =>
          item.id === itemId
            ? { ...item, status: "done" as OrderStatus, bumpedAt: new Date() }
            : item
        );

        // Check if all items are done
        const allDone = updatedItems.every((item) => item.status === "done");

        return {
          ...course,
          items: updatedItems,
          status: allDone ? ("ready" as CourseStatus) : course.status,
        };
      })
    );
  }, []);

  // Get plating queue (courses with all items ready)
  const getPlatingQueue = useCallback((): FiredCourse[] => {
    return firedCourses.filter(
      (course) => course.status === "ready" || course.status === "in_progress"
    );
  }, [firedCourses]);

  // Mark course as plated
  const markCoursePlated = useCallback((courseId: string) => {
    setFiredCourses((prev) =>
      prev.map((course) =>
        course.id === courseId ? { ...course, status: "served" as CourseStatus } : course
      )
    );
  }, []);

  // Simulate incoming orders for demo purposes
  const simulateIncomingOrder = useCallback(() => {
    if (!currentEvent) return;

    const randomTableGroup =
      currentEvent.tableGroups[Math.floor(Math.random() * currentEvent.tableGroups.length)];
    const randomCourse =
      currentEvent.courses[Math.floor(Math.random() * currentEvent.courses.length)];

    fireCourse(randomTableGroup.id, randomCourse.number);
  }, [currentEvent, fireCourse]);

  const value: KDSContextType = {
    currentEvent,
    setCurrentEvent,
    firedCourses,
    fireCourse,
    markCourseServed,
    getStationQueue,
    bumpItem,
    getPlatingQueue,
    markCoursePlated,
    simulateIncomingOrder,
  };

  return <KDSContext.Provider value={value}>{children}</KDSContext.Provider>;
}

export function useKDS() {
  const context = useContext(KDSContext);
  if (!context) {
    throw new Error("useKDS must be used within a KDSProvider");
  }
  return context;
}

// Helper hook to get elapsed time
export function useElapsedTime(startTime: Date | undefined) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 60000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}
