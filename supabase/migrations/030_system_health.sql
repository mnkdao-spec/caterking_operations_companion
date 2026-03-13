-- Migration: System Health Monitoring RPC (Corrected)
-- Implementation Plan Phase 2 Task 3

CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_event_count INT;
  v_staff_active INT;
  v_low_stock_count INT;
BEGIN
  -- 1. Gather stats
  SELECT COUNT(*) INTO v_event_count FROM events WHERE status = 'active';
  SELECT COUNT(DISTINCT staff_id) INTO v_staff_active FROM staff_shifts WHERE clock_out IS NULL;
  
  -- Use correct inventory table
  SELECT COUNT(*) INTO v_low_stock_count 
  FROM inventory_items_2026_01_04_14_12
  WHERE current_stock < minimum_stock;

  -- 2. Build JSON
  v_result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'metrics', jsonb_build_object(
      'active_events', v_event_count,
      'staff_clocked_in', v_staff_active,
      'inventory_alerts', v_low_stock_count
    ),
    'services', jsonb_build_object(
      'database', 'online',
      'realtime', 'online',
      'storage', 'online'
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;