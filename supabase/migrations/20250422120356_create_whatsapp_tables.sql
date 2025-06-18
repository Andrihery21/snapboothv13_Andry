-- Create WhatsApp configuration table
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  default_message TEXT DEFAULT 'Voici votre photo de l''événement!',
  api_key TEXT,
  api_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, screen_id)
);

-- Add RLS policies
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_config
CREATE POLICY "Anyone can view whatsapp_config" 
  ON whatsapp_config FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert whatsapp_config" 
  ON whatsapp_config FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update whatsapp_config" 
  ON whatsapp_config FOR UPDATE 
  USING (auth.role() = 'authenticated');
