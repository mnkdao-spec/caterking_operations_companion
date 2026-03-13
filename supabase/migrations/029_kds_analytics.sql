-- Migration: KDS Analytics and Efficiency Reporting
-- Implementation Plan Phase 3 Task 2

CREATE OR REPLACE FUNCTION get_kds_efficiency_metrics()
RETURNS TABLE(
  station_type TEXT,
  avg_prep_minutes NUMERIC,
  total_completed INT,
  ontime_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH station_stats AS (
    SELECT 
      oi.station_type,
      EXTRACT(EPOCH FROM (oi.completed_at - fc.fired_at)) / 60 as prep_minutes,
      CASE 
        WHEN (EXTRACT(EPOCH FROM (oi.completed_at - fc.fired_at)) / 60) <= COALESCE(mi.target_prep_time, 15) THEN 1
        ELSE 0
      END as is_ontime
    FROM order_items oi
    JOIN fired_courses fc ON oi.fired_course_id = fc.id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.status = 'completed'
    AND oi.completed_at IS NOT NULL
  )
  SELECT 
    ss.station_type,
    ROUND(AVG(ss.prep_minutes)::numeric, 1) as avg_prep_minutes,
    COUNT(*)::int as total_completed,
    ROUND((SUM(ss.is_ontime)::numeric / COUNT(*)) * 100, 1) as ontime_percentage
  FROM station_stats ss
  GROUP BY ss.station_type;
END;
$$ LANGUAGE plpgsql;
