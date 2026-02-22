-- Add new columns to garments table
ALTER TABLE garments ADD COLUMN IF NOT EXISTS allows_offer BOOLEAN DEFAULT FALSE;
ALTER TABLE garments ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;
ALTER TABLE garments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default WhatsApp number if not exists
INSERT INTO settings (key, value)
VALUES ('whatsapp_number', '5491100000000')
ON CONFLICT (key) DO NOTHING;

-- Policies for settings (authenticated can update, anyone can read)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated update to settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);
