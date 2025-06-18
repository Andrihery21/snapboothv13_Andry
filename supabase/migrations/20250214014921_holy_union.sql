/*
  # Configuration des templates d'email

  1. Nouvelle Table
    - `email_templates`
      - `id` (uuid, clé primaire)
      - `type` (text, unique)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Activation de RLS
    - Politiques pour les administrateurs uniquement
*/

-- Création de la table des templates d'email
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Les administrateurs peuvent lire les templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les administrateurs peuvent modifier les templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insertion du template par défaut
INSERT INTO email_templates (type, content)
VALUES (
  'photo_share',
  'Bonjour,

Voici votre photo prise lors de l''événement {{event}}.

Vous pouvez la télécharger en cliquant sur ce lien : {{photo_url}}

Cordialement,
L''équipe SNAP BOOTH'
)
ON CONFLICT (type) DO NOTHING;

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();