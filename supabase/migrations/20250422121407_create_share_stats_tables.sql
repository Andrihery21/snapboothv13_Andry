-- Table pour stocker les partages (email, whatsapp, etc.)
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  method TEXT NOT NULL, -- 'email', 'whatsapp', etc.
  recipient TEXT, -- email ou numéro de téléphone
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Table pour stocker les QR codes générés
CREATE TABLE IF NOT EXISTS qrcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  scanned_count INTEGER DEFAULT 0,
  downloaded_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scanned_at TIMESTAMP WITH TIME ZONE
);

-- Table pour stocker les paramètres des QR codes
CREATE TABLE IF NOT EXISTS qrcode_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  size INTEGER DEFAULT 200,
  foreground TEXT DEFAULT '#000000',
  background TEXT DEFAULT '#ffffff',
  include_screen_logo BOOLEAN DEFAULT true,
  include_event_name BOOLEAN DEFAULT true,
  corner_radius INTEGER DEFAULT 0,
  error_correction TEXT DEFAULT 'M',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, screen_id)
);

-- Table pour stocker les paramètres email
CREATE TABLE IF NOT EXISTS email_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  hide_input BOOLEAN DEFAULT false,
  from_email TEXT DEFAULT 'no-reply@mail.fotoshare.co',
  subject TEXT DEFAULT 'Voici votre photo',
  template TEXT DEFAULT '<h2>Voici votre photo</h2>{image}<br>{share_icons}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, screen_id)
);

-- Créer des index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS shares_event_id_idx ON shares(event_id);
CREATE INDEX IF NOT EXISTS shares_screen_id_idx ON shares(screen_id);
CREATE INDEX IF NOT EXISTS shares_photo_id_idx ON shares(photo_id);
CREATE INDEX IF NOT EXISTS shares_method_idx ON shares(method);
CREATE INDEX IF NOT EXISTS shares_status_idx ON shares(status);
CREATE INDEX IF NOT EXISTS shares_created_at_idx ON shares(created_at);

CREATE INDEX IF NOT EXISTS qrcodes_event_id_idx ON qrcodes(event_id);
CREATE INDEX IF NOT EXISTS qrcodes_screen_id_idx ON qrcodes(screen_id);
CREATE INDEX IF NOT EXISTS qrcodes_photo_id_idx ON qrcodes(photo_id);
CREATE INDEX IF NOT EXISTS qrcodes_created_at_idx ON qrcodes(created_at);

-- Activer RLS (Row Level Security) pour les tables
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE qrcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qrcode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS pour les tables
-- Shares
CREATE POLICY "Anyone can view shares" 
  ON shares FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert shares" 
  ON shares FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shares" 
  ON shares FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- QR Codes
CREATE POLICY "Anyone can view qrcodes" 
  ON qrcodes FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert qrcodes" 
  ON qrcodes FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update qrcodes" 
  ON qrcodes FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- QR Code Settings
CREATE POLICY "Anyone can view qrcode_settings" 
  ON qrcode_settings FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert qrcode_settings" 
  ON qrcode_settings FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update qrcode_settings" 
  ON qrcode_settings FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Email Config
CREATE POLICY "Anyone can view email_config" 
  ON email_config FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert email_config" 
  ON email_config FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update email_config" 
  ON email_config FOR UPDATE 
  USING (auth.role() = 'authenticated');
