-- Dealership Applications Table
-- Stores inquiries and registration applications for dealerships and partnerships

CREATE TABLE IF NOT EXISTS dealership_applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  business_name TEXT,
  gst_no TEXT,
  location TEXT NOT NULL,
  experience TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE dealership_applications ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert access
CREATE POLICY "Public users can submit dealership applications"
  ON dealership_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users (admin) to read/write applications
CREATE POLICY "Authenticated users can select dealership applications"
  ON dealership_applications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update dealership applications"
  ON dealership_applications
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete dealership applications"
  ON dealership_applications
  FOR DELETE
  TO authenticated
  USING (true);

-- Index for ordering by creation time
CREATE INDEX IF NOT EXISTS idx_dealership_apps_created_at ON dealership_applications(created_at DESC);
