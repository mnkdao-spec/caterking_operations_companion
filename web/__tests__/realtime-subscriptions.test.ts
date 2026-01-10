import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock Supabase with factory function
vi.mock("@/lib/supabase", () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback) => {
      callback("SUBSCRIBED");
      return mockChannel;
    }),
  };

  return {
    supabase: {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
    },
    __mockChannel: mockChannel,
  };
});

import { useRealtimeSubscription, useRealtimeSubscriptions } from "@/hooks/use-realtime-subscription";
import { supabase } from "@/lib/supabase";

// Get the mock channel for assertions
const mockChannel = (supabase as any).channel();

describe("useRealtimeSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a subscription channel for a table", () => {
    const onInsert = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();

    renderHook(() =>
      useRealtimeSubscription({
        table: "clients",
        onInsert,
        onUpdate,
        onDelete,
      })
    );

    expect(supabase.channel).toHaveBeenCalledWith("clients_changes");
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "*",
        schema: "public",
        table: "clients",
      }),
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("should call onInsert when INSERT event occurs", () => {
    const onInsert = vi.fn();
    let changeHandler: any;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    renderHook(() =>
      useRealtimeSubscription({
        table: "clients",
        onInsert,
      })
    );

    const payload = {
      eventType: "INSERT",
      new: { id: "1", name: "Test Client" },
    };

    changeHandler(payload);
    expect(onInsert).toHaveBeenCalledWith(payload);
  });

  it("should call onUpdate when UPDATE event occurs", () => {
    const onUpdate = vi.fn();
    let changeHandler: any;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    renderHook(() =>
      useRealtimeSubscription({
        table: "clients",
        onUpdate,
      })
    );

    const payload = {
      eventType: "UPDATE",
      new: { id: "1", name: "Updated Client" },
      old: { id: "1", name: "Old Client" },
    };

    changeHandler(payload);
    expect(onUpdate).toHaveBeenCalledWith(payload);
  });

  it("should call onDelete when DELETE event occurs", () => {
    const onDelete = vi.fn();
    let changeHandler: any;

    mockChannel.on.mockImplementation((event, config, handler) => {
      changeHandler = handler;
      return mockChannel;
    });

    renderHook(() =>
      useRealtimeSubscription({
        table: "clients",
        onDelete,
      })
    );

    const payload = {
      eventType: "DELETE",
      old: { id: "1", name: "Deleted Client" },
    };

    changeHandler(payload);
    expect(onDelete).toHaveBeenCalledWith(payload);
  });

  it("should not subscribe when enabled is false", () => {
    vi.clearAllMocks();
    
    renderHook(() =>
      useRealtimeSubscription({
        table: "clients",
        enabled: false,
      })
    );

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it("should cleanup subscription on unmount", () => {
    const { unmount } = renderHook(() =>
      useRealtimeSubscription({
        table: "clients",
      })
    );

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});

describe("useRealtimeSubscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create multiple subscriptions", () => {
    const onInsert1 = vi.fn();
    const onInsert2 = vi.fn();

    renderHook(() =>
      useRealtimeSubscriptions([
        { table: "clients", onInsert: onInsert1 },
        { table: "staff", onInsert: onInsert2 },
      ])
    );

    expect(supabase.channel).toHaveBeenCalledWith("clients_changes");
    expect(supabase.channel).toHaveBeenCalledWith("staff_changes");
    expect(supabase.channel).toHaveBeenCalledTimes(2);
  });
});
