-- Migration: Storage Trigger for OCR
-- Implementation Plan Phase 3 Task 3

-- Function to fire the OCR Edge Function
CREATE OR REPLACE FUNCTION public.handle_po_upload()
RETURNS TRIGGER AS $$
DECLARE
  v_po_id UUID;
BEGIN
  -- 1. Only proceed for the purchase-orders bucket
  IF NEW.bucket_id = 'purchase-orders' THEN
    -- 2. Extract po_id from file path (assuming invoices/{supplier_id}/{po_id}_{timestamp}.jpg)
    -- We can also use metadata if the client provides it
    BEGIN
      v_po_id := (regexp_matches(NEW.name, '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1]::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_po_id := NULL;
    END;

    -- 3. Invoke the Edge Function via net.http_post (Supabase specific)
    -- Note: In a local environment, this requires the pg_net extension
    PERFORM
      net.http_post(
        url := current_setting('app.settings.edge_function_url') || '/process-invoice-ocr',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'bucket_id', NEW.bucket_id,
          'object_name', NEW.name,
          'po_id', v_po_id
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on storage.objects
DROP TRIGGER IF EXISTS tr_po_upload ON storage.objects;
CREATE TRIGGER tr_po_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_po_upload();
