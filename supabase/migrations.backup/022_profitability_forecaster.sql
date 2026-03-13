-- Migration 022: Profitability Forecaster Engine
-- Purpose: Calculate 30-day projected cash flow and net margins
-- Date: 2026-01-30

CREATE OR REPLACE FUNCTION get_30_day_forecast()
RETURNS JSONB AS $$
DECLARE
    v_projected_revenue DECIMAL(12, 2);
    v_projected_labor DECIMAL(12, 2);
    v_projected_food_cost DECIMAL(12, 2);
    v_avg_food_cost_ratio DECIMAL(5, 2);
    result JSONB;
BEGIN
    -- 1. Calculate Average Food Cost Ratio from the last 90 days of ledger data
    -- (Total Food Expense / Total Sales)
    SELECT 
        COALESCE(ABS(SUM(CASE WHEN category = 'food_cost' THEN amount ELSE 0 END)) / 
        NULLIF(SUM(CASE WHEN category = 'sales' THEN amount ELSE 0 END), 0), 0.35) -- Default to 35% if no data
    INTO v_avg_food_cost_ratio
    FROM financial_ledger
    WHERE transaction_date > NOW() - INTERVAL '90 days';

    -- 2. Projected Revenue (Sum of budgets for confirmed events in the next 30 days)
    SELECT COALESCE(SUM(budget), 0)
    INTO v_projected_revenue
    FROM events
    WHERE status = 'confirmed' 
      AND event_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days');

    -- 3. Projected Labor (Sum of pay_amount for assignments in the next 30 days)
    SELECT COALESCE(SUM(pay_amount), 0)
    INTO v_projected_labor
    FROM staff_assignments sa
    JOIN events e ON sa.event_id = e.id
    WHERE e.status = 'confirmed'
      AND e.event_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days');

    -- 4. Projected Food Cost (Revenue * historical ratio)
    v_projected_food_cost := v_projected_revenue * v_avg_food_cost_ratio;

    -- 5. Construct Result
    SELECT jsonb_build_object(
        'period', 'Next 30 Days',
        'revenue', v_projected_revenue,
        'expenses', jsonb_build_object(
            'labor', v_projected_labor,
            'food', v_projected_food_cost,
            'overhead', (v_projected_revenue * 0.10) -- Estimating 10% for fixed overhead
        ),
        'net_profit', (v_projected_revenue - v_projected_labor - v_projected_food_cost - (v_projected_revenue * 0.10)),
        'margin_percent', CASE WHEN v_projected_revenue > 0 
            THEN ((v_projected_revenue - v_projected_labor - v_projected_food_cost - (v_projected_revenue * 0.10)) / v_projected_revenue * 100)
            ELSE 0 END,
        'event_count', (SELECT COUNT(*) FROM events WHERE status = 'confirmed' AND event_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days'))
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
