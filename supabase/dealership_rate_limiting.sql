-- Trigger function to rate limit dealership applications (max 1 per email or phone every 24 hours)
CREATE OR REPLACE FUNCTION check_dealership_rate_limit() 
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dealership_applications 
    WHERE (
      (email = NEW.email AND email IS NOT NULL AND NEW.email <> '')
      OR (phone = NEW.phone)
    )
    AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_SUBMISSION: An application with this email or phone number was already submitted in the last 24 hours.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind trigger to dealership_applications table
DROP TRIGGER IF EXISTS trg_check_dealership_rate_limit ON dealership_applications;
CREATE TRIGGER trg_check_dealership_rate_limit
  BEFORE INSERT ON dealership_applications
  FOR EACH ROW
  EXECUTE FUNCTION check_dealership_rate_limit();
