-- Create invoice_templates table for recurring invoice templates
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(50) NOT NULL DEFAULT 'monthly', -- weekly, monthly, quarterly, annually
  next_generation_date DATE NOT NULL,
  last_generated_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create invoice_template_items table for line items in templates
CREATE TABLE IF NOT EXISTS invoice_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES invoice_templates(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  item_type VARCHAR(50) NOT NULL DEFAULT 'service', -- service, labor, menu_item, charge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_templates_client_id ON invoice_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_is_active ON invoice_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_next_generation ON invoice_templates(next_generation_date);
CREATE INDEX IF NOT EXISTS idx_invoice_template_items_template_id ON invoice_template_items(template_id);

-- Enable RLS
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_template_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_templates
CREATE POLICY "Users can view their organization's invoice templates"
  ON invoice_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can create invoice templates"
  ON invoice_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update invoice templates"
  ON invoice_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete invoice templates"
  ON invoice_templates FOR DELETE
  USING (true);

-- RLS policies for invoice_template_items
CREATE POLICY "Users can view template items"
  ON invoice_template_items FOR SELECT
  USING (true);

CREATE POLICY "Users can create template items"
  ON invoice_template_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update template items"
  ON invoice_template_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete template items"
  ON invoice_template_items FOR DELETE
  USING (true);

-- Create function to calculate next generation date
CREATE OR REPLACE FUNCTION calculate_next_generation_date(
  p_date DATE,
  p_frequency VARCHAR
) RETURNS DATE AS $$
BEGIN
  CASE p_frequency
    WHEN 'weekly' THEN
      RETURN p_date + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN p_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN p_date + INTERVAL '3 months';
    WHEN 'annually' THEN
      RETURN p_date + INTERVAL '1 year';
    ELSE
      RETURN p_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate invoices from templates
CREATE OR REPLACE FUNCTION generate_invoices_from_templates()
RETURNS TABLE(invoice_id UUID, template_id UUID, client_id UUID) AS $$
DECLARE
  template_rec RECORD;
  new_invoice_id UUID;
  template_item RECORD;
  subtotal NUMERIC;
  tax_amount NUMERIC;
  total_amount NUMERIC;
BEGIN
  -- Find all active templates with generation date today or earlier
  FOR template_rec IN
    SELECT * FROM invoice_templates
    WHERE is_active = true
    AND next_generation_date <= CURRENT_DATE
  LOOP
    -- Calculate totals from template items
    SELECT COALESCE(SUM(quantity * unit_price), 0) INTO subtotal
    FROM invoice_template_items
    WHERE template_id = template_rec.id;
    
    tax_amount := subtotal * 0.08; -- 8% tax
    total_amount := subtotal + tax_amount;
    
    -- Create new invoice from template
    INSERT INTO invoices (
      client_id,
      client_name,
      client_email,
      client_phone,
      invoice_number,
      invoice_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      labor_costs_total,
      status,
      notes,
      created_at
    )
    SELECT
      template_rec.client_id,
      c.name,
      c.email,
      c.phone,
      'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(CAST(NEXTVAL('invoice_number_seq') AS TEXT), 4, '0'),
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      subtotal,
      tax_amount,
      total_amount,
      0,
      'draft',
      template_rec.notes,
      CURRENT_TIMESTAMP
    FROM clients c
    WHERE c.id = template_rec.client_id
    RETURNING id INTO new_invoice_id;
    
    -- Copy template items to invoice items
    FOR template_item IN
      SELECT * FROM invoice_template_items
      WHERE template_id = template_rec.id
    LOOP
      INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_price
      )
      VALUES (
        new_invoice_id,
        template_item.description,
        template_item.quantity,
        template_item.unit_price,
        template_item.quantity * template_item.unit_price
      );
    END LOOP;
    
    -- Update template with new generation date
    UPDATE invoice_templates
    SET
      last_generated_date = CURRENT_DATE,
      next_generation_date = calculate_next_generation_date(CURRENT_DATE, template_rec.frequency),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = template_rec.id;
    
    RETURN QUERY SELECT new_invoice_id, template_rec.id, template_rec.client_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
