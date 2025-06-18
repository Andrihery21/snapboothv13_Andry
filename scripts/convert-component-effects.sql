-- Script pour convertir tous les effets des composants frontend en enregistrements dans la base de données
-- Ce script va insérer tous les effets définis dans les composants EffectCartoon, EffectDessin, etc.

-- Correspondance des types aux écrans :
-- Type cartoon -> Écran Cartoon (2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a)
-- Type dessin -> Écran Dessin (3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b)
-- Type univers -> Écran Univers (1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e)
-- Type caricature -> Écran Caricature (4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c)
-- Type props -> Écran Props (5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b)
-- Type video -> Écran Video (6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c)

-- 1. Effets du composant EffectCartoon (écran Cartoon)
INSERT INTO effects (id, name, type, screen_id, icon_url, is_active, preview_url, template_url)
VALUES
  ('jpcartoon', 'Japanese Manga (I)', 'cartoon', '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Japanese%20manga%201.webp', 
   true, 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Japanese%20manga%201.webp',
   ''),
   
  ('hongkong', 'Hong Kong-style comic style', 'cartoon', '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Hong%20Kong-style%20comic%20style.webp', 
   true, 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Hong%20Kong-style%20comic%20style.webp',
   ''),
   
  ('classic_cartoon', 'Retro Cartoon', 'cartoon', '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Retro%20Cartoon.webp', 
   true, 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-Retro%20Cartoon.webp',
   ''),
   
  ('handdrawn', 'Hand-painted', 'cartoon', '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-handdrawn.webp', 
   true, 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-handdrawn.webp',
   ''),
   
  ('amcartoon', 'American Manga', 'cartoon', '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a', 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-American%20manga.webp', 
   true, 
   'https://azafzikvwdartavmpwsc.supabase.co/storage/v1/object/public/assets/Cartoon/Cartoon%20yourself-American%20manga.webp',
   '')
   
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    type = excluded.type,
    screen_id = excluded.screen_id,
    icon_url = excluded.icon_url,
    is_active = excluded.is_active,
    preview_url = excluded.preview_url,
    template_url = excluded.template_url;

-- 2. Effets du composant EffectDessin (écran Dessin)
INSERT INTO effects (id, name, type, screen_id, icon_url, is_active, preview_url, template_url)
VALUES
  ('anime', 'Japanese Manga (II)', 'dessin', '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130120365x947590826747246600/Cartoon%20yourself-Japanese%20manga%202.png',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130120365x947590826747246600/Cartoon%20yourself-Japanese%20manga%202.png',
   ''),
   
  ('claborate', 'Chinese Brushwork', 'dessin', '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130154070x692047786667617400/Cartoon%20yourself-%20Chinese%20fine%20brushwork%20painting.png',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130154070x692047786667617400/Cartoon%20yourself-%20Chinese%20fine%20brushwork%20painting.png',
   ''),
   
  ('sketch', 'Pencil Drawing (I)', 'dessin', '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564526017x784742993887914200/Cartoon%20yourself-Pencil%20drawing.png',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564526017x784742993887914200/Cartoon%20yourself-Pencil%20drawing.png',
   '')
   
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    type = excluded.type,
    screen_id = excluded.screen_id,
    icon_url = excluded.icon_url,
    is_active = excluded.is_active,
    preview_url = excluded.preview_url,
    template_url = excluded.template_url;

-- 3. Effets du composant EffectUnivers (écran Univers)
INSERT INTO effects (id, name, type, screen_id, icon_url, is_active, preview_url, template_url)
VALUES
  ('animation3d', '3D Animation', 'univers', '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130290754x925359529669461600/Cartoon%20yourself-Animation%203D.png',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738130290754x925359529669461600/Cartoon%20yourself-Animation%203D.png',
   ''),
   
  ('future', 'Future Tech', 'univers', '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564961243x558145837457536300/4-%20AI%20Image%20anime%20generator%20-%204%20Future%20Technology..jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738564961243x558145837457536300/4-%20AI%20Image%20anime%20generator%20-%204%20Future%20Technology..jpg',
   ''),
   
  ('chinese_trad', 'Traditional Chinese', 'univers', '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565037951x922301476010605700/5-%20AI%20Image%20anime%20generator%20-%205%20Traditional%20Chinese%20Painting%20Style.jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565037951x922301476010605700/5-%20AI%20Image%20anime%20generator%20-%205%20Traditional%20Chinese%20Painting%20Style.jpg',
   ''),
   
  ('general_battle', 'General in Battle', 'univers', '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565115416x952288200492438900/6%20-%20AI%20Image%20anime%20generator%20-%206%20General%20in%20a%20Hundred%20Battles..jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1738565115416x952288200492438900/6%20-%20AI%20Image%20anime%20generator%20-%206%20General%20in%20a%20Hundred%20Battles..jpg',
   '')
   
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    type = excluded.type,
    screen_id = excluded.screen_id,
    icon_url = excluded.icon_url,
    is_active = excluded.is_active,
    preview_url = excluded.preview_url,
    template_url = excluded.template_url;

-- 4. Effets du composant EffectCaricature (écran Caricature)
INSERT INTO effects (id, name, type, screen_id, icon_url, is_active, preview_url, template_url)
VALUES
  ('samurai', 'Samurai', 'caricature', '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739126125629x627173688556666400/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20Samurai.jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739126125629x627173688556666400/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20Samurai.jpg',
   ''),
   
  ('doctor', 'Doctor', 'caricature', '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125311981x859935082600382700/LightX%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20doctor.jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125311981x859935082600382700/LightX%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20doctor.jpg',
   ''),
   
  ('politician', 'Politician', 'caricature', '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125474597x287225342642065200/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20politician.jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125474597x287225342642065200/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20politician.jpg',
   ''),
   
  ('firefighter', 'Fire fighter', 'caricature', '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125667741x318419791472486240/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20firefighter%20%282%29.jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125667741x318419791472486240/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20firefighter%20%282%29.jpg',
   ''),
   
  ('chef', 'Chef', 'caricature', '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125929014x892874969854078300/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20chef.jpg',
   true,
   'https://445b1d92398484ce075b47fd4b139c09.cdn.bubble.io/f1739125929014x892874969854078300/Light%20X%20-%20big%20head%2Csmall%20body%2Cchibi%20caricature%20of%20chef.jpg',
   '')
   
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    type = excluded.type,
    screen_id = excluded.screen_id,
    icon_url = excluded.icon_url,
    is_active = excluded.is_active,
    preview_url = excluded.preview_url,
    template_url = excluded.template_url;

-- 5. Vérification
SELECT type, screen_id, 
  CASE
    WHEN screen_id = '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e' THEN 'Écran Univers'
    WHEN screen_id = '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a' THEN 'Écran Cartoon'
    WHEN screen_id = '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b' THEN 'Écran Dessin'
    WHEN screen_id = '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c' THEN 'Écran Caricature'
    WHEN screen_id = '5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b' THEN 'Écran Props'
    WHEN screen_id = '6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c' THEN 'Écran Video'
    ELSE 'Non associé'
  END as screen_name,
  COUNT(*) as effects_count,
  json_agg(name) as effect_names
FROM effects
GROUP BY type, screen_id, screen_name
ORDER BY type;
