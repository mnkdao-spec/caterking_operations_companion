import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Types matching the database schema
export interface Event {
  id: string;
  name: string;
  client: string;
  guest_count: number;
  venue: string;
  start_time: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  event_id: string;
  course_number: number;
  name: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  course_id: string;
  name: string;
  station: "grill" | "saute" | "garde_manger" | "dessert";
  created_at: string;
}

export interface TableGroup {
  id: string;
  event_id: string;
  name: string;
  guest_count: number;
  table_numbers: number[];
  created_at: string;
}

export interface FiredCourse {
  id: string;
  event_id: string;
  course_id: string;
  table_group_id: string;
  status: "fired" | "in_progress" | "ready" | "served";
  fired_at: string;
  served_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  fired_course_id: string;
  menu_item_id: string;
  quantity: number;
  station: string;
  modifications: string[];
  status: "queued" | "cooking" | "done";
  fired_at: string;
  bumped_at: string | null;
  created_at: string;
  updated_at: string;
}

// Event operations
export const eventsService = {
  async getActiveEvent(): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching active event:", error);
      return null;
    }
    return data || null;
  },

  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return null;
    }
    return data;
  },

  async createEvent(event: Omit<Event, "id" | "created_at" | "updated_at">): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return null;
    }
    return data;
  },
};

// Fired courses operations
export const firedCoursesService = {
  async getFiredCoursesByEvent(eventId: string): Promise<FiredCourse[]> {
    const { data, error } = await supabase
      .from("fired_courses")
      .select("*")
      .eq("event_id", eventId)
      .order("fired_at", { ascending: false });

    if (error) {
      console.error("Error fetching fired courses:", error);
      return [];
    }
    return data || [];
  },

  async fireCourse(
    eventId: string,
    courseId: string,
    tableGroupId: string
  ): Promise<FiredCourse | null> {
    const { data, error } = await supabase
      .from("fired_courses")
      .insert([
        {
          event_id: eventId,
          course_id: courseId,
          table_group_id: tableGroupId,
          status: "fired",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error firing course:", error);
      return null;
    }
    return data;
  },

  async updateCourseStatus(
    courseId: string,
    status: "fired" | "in_progress" | "ready" | "served"
  ): Promise<FiredCourse | null> {
    const { data, error } = await supabase
      .from("fired_courses")
      .update({
        status,
        served_at: status === "served" ? new Date().toISOString() : null,
      })
      .eq("id", courseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating course status:", error);
      return null;
    }
    return data;
  },

  async getReadyCourses(eventId: string): Promise<FiredCourse[]> {
    const { data, error } = await supabase
      .from("fired_courses")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "ready")
      .order("fired_at", { ascending: true });

    if (error) {
      console.error("Error fetching ready courses:", error);
      return [];
    }
    return data || [];
  },
};

// Order items operations
export const orderItemsService = {
  async getOrdersByStation(
    eventId: string,
    station: string
  ): Promise<(OrderItem & { table_group_name: string; course_name: string })[]> {
    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
        *,
        fired_courses (
          table_group_id,
          course_id,
          table_groups (name),
          courses (name)
        )
      `
      )
      .eq("fired_courses.event_id", eventId)
      .eq("station", station)
      .neq("status", "done")
      .order("fired_at", { ascending: true });

    if (error) {
      console.error("Error fetching orders by station:", error);
      return [];
    }

    // Transform the response to flatten the nested data
    return (data || []).map((item: any) => ({
      ...item,
      table_group_name: item.fired_courses?.table_groups?.[0]?.name || "Unknown",
      course_name: item.fired_courses?.courses?.[0]?.name || "Unknown",
    }));
  },

  async bumpItem(itemId: string): Promise<OrderItem | null> {
    const { data, error } = await supabase
      .from("order_items")
      .update({
        status: "done",
        bumped_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      console.error("Error bumping item:", error);
      return null;
    }
    return data;
  },

  async updateItemStatus(
    itemId: string,
    status: "queued" | "cooking" | "done"
  ): Promise<OrderItem | null> {
    const { data, error } = await supabase
      .from("order_items")
      .update({ status })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating item status:", error);
      return null;
    }
    return data;
  },

  async getItemsByFiredCourse(firedCourseId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("fired_course_id", firedCourseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching items by fired course:", error);
      return [];
    }
    return data || [];
  },

  async getItemsByStatus(
    firedCourseId: string,
    status: "queued" | "cooking" | "done"
  ): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("fired_course_id", firedCourseId)
      .eq("status", status);

    if (error) {
      console.error("Error fetching items by status:", error);
      return [];
    }
    return data || [];
  },
};

// Table groups operations
export const tableGroupsService = {
  async getTableGroupsByEvent(eventId: string): Promise<TableGroup[]> {
    const { data, error } = await supabase
      .from("table_groups")
      .select("*")
      .eq("event_id", eventId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching table groups:", error);
      return [];
    }
    return data || [];
  },
};

// Courses operations
export const coursesService = {
  async getCoursesByEvent(eventId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("event_id", eventId)
      .order("course_number", { ascending: true });

    if (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
    return data || [];
  },

  async getCourseWithMenuItems(courseId: string): Promise<(Course & { menu_items: MenuItem[] }) | null> {
    const { data, error } = await supabase
      .from("courses")
      .select(
        `
        *,
        menu_items (*)
      `
      )
      .eq("id", courseId)
      .single();

    if (error) {
      console.error("Error fetching course with menu items:", error);
      return null;
    }
    return data;
  },
};

// Realtime subscriptions
export const realtimeSubscriptions = {
  subscribeToFiredCourses(eventId: string, callback: (course: FiredCourse) => void) {
    const subscription = supabase
      .channel(`fired_courses:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fired_courses",
          filter: `event_id=eq.${eventId}`,
        },
        (payload: any) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  subscribeToOrderItems(firedCourseId: string, callback: (item: OrderItem) => void) {
    const subscription = supabase
      .channel(`order_items:${firedCourseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `fired_course_id=eq.${firedCourseId}`,
        },
        (payload: any) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  subscribeToStationQueue(eventId: string, station: string, callback: (item: OrderItem) => void) {
    const subscription = supabase
      .channel(`station:${eventId}:${station}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `station=eq.${station}`,
        },
        (payload: any) => {
          // Only notify if this item is from the current event
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
};
