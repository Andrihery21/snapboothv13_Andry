/*
  # Email Templates System

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `template_name` (text, unique)
      - `template_body` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_templates` table
    - Add policies for authenticated users to read templates
    - Add policies for admin users to modify templates

  3. Default Data
    - Insert default photo sharing template
*/

-- Create the email templates table first
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  template_body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can modify templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert default template
DO $$
BEGIN
  INSERT INTO email_templates (template_name, template_body)
  VALUES (
    'photo_share',
    'Bonjour,

Voici votre photo prise lors de l''événement {{event}}.

Vous pouvez la télécharger en cliquant sur ce lien : {{photo_url}}

Cordialement,
L''équipe SNAP BOOTH'
  )
  ON CONFLICT (template_name) DO NOTHING;
END
$$;

-- Create trigger for automatic updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();