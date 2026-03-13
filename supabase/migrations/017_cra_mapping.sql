-- Migration 017: CRA Category Mapping & Reporting
-- Purpose: Map internal categories to CRA Form T2125 lines
-- Date: 2026-01-30

CREATE OR REPLACE VIEW cra_mapped_ledger AS
SELECT 
    transaction_date,
    amount,
    tax_amount as hst,
    (amount - tax_amount) as net_amount,
    description,
    category,
    CASE 
        WHEN category = 'food_cost' THEN 'Line 8521 - Purchases'
        WHEN category = 'labor' THEN 'Line 8340 - Salaries, wages and benefits'
        WHEN category = 'licensing' THEN 'Line 8760 - Business taxes, licences and dues'
        WHEN category = 'equipment' THEN 'Line 9270 - Other expenses (Capital)'
        WHEN category = 'utility' THEN 'Line 9220 - Utilities'
        WHEN category = 'marketing' THEN 'Line 8521 - Advertising'
        WHEN category = 'rent' THEN 'Line 8910 - Rent'
        WHEN category = 'insurance' THEN 'Line 8690 - Insurance'
        WHEN category = 'sales' THEN 'Part 1 - Business Income'
        ELSE 'Line 9270 - Other business expenses'
    END as cra_line
FROM financial_ledger;

-- Updated summary function for the report generator
CREATE OR REPLACE FUNCTION get_cra_report_data(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'period', jsonb_build_object('start', p_start_date, 'end', p_end_date),
        'income', (SELECT COALESCE(SUM(net_amount), 0) FROM cra_mapped_ledger WHERE net_amount > 0 AND transaction_date BETWEEN p_start_date AND p_end_date),
        'total_hst_collected', (SELECT COALESCE(SUM(hst), 0) FROM cra_mapped_ledger WHERE hst > 0 AND transaction_date BETWEEN p_start_date AND p_end_date),
        'expenses_by_line', (
            SELECT jsonb_object_agg(cra_line, total_net)
            FROM (
                SELECT cra_line, SUM(ABS(net_amount)) as total_net
                FROM cra_mapped_ledger
                WHERE net_amount < 0 AND transaction_date BETWEEN p_start_date AND p_end_date
                GROUP BY cra_line
            ) s
        ),
        'total_itcs', (SELECT COALESCE(SUM(ABS(hst)), 0) FROM cra_mapped_ledger WHERE hst < 0 AND transaction_date BETWEEN p_start_date AND p_end_date)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
