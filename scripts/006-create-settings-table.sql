-- Create settings table for storing site configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on settings" ON settings
  FOR SELECT USING (true);

-- Allow all operations (for admin)
CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default animation settings
INSERT INTO settings (key, value) VALUES (
  'animation',
  '{
    "springIntensity": "medium",
    "openDuration": 600,
    "closeDuration": 450,
    "enabled": true
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
