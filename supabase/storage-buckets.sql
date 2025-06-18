-- Instructions pour configurer le stockage Supabase pour le Photobooth

-- IMPORTANT: Les buckets doivent être créés manuellement via l'interface Supabase
-- Créez les buckets suivants via l'interface Storage de Supabase :

-- 1. assets (bucket général pour les ressources communes)
--    Structure recommandée pour le bucket assets:
--    /sounds       - Pour les sons (beep.mp3, shutter.mp3, success.mp3)
--    /icons        - Pour les icônes et logos de l'application
--    /backgrounds  - Pour les arrière-plans communs
--    /overlays     - Pour les superpositions utilisées dans l'interface admin
--    /fallback     - Dossier de secours pour les écrans sans bucket
--      /horizontal_1  - Sous-dossier pour l'écran horizontal 1
--      /vertical_1    - Sous-dossier pour l'écran vertical 1
--      /vertical_2    - Sous-dossier pour l'écran vertical 2
--      /vertical_3    - Sous-dossier pour l'écran vertical 3

-- 2. horizontal1 (pour l'écran horizontal - Normal et Univers)
-- 3. vertical1 (pour l'écran vertical 1 - Cartoon et Glow Up)
-- 4. vertical2 (pour l'écran vertical 2 - Dessin et Noir et blanc)
-- 5. vertical3 (pour l'écran vertical 3 - Caricatures et Normal)

-- Pour chaque bucket d'écran (horizontal1, vertical1, vertical2, vertical3), créez les dossiers suivants :
-- /frames       - Pour les cadres de capture pendant la prise de photo
-- /templates    - Pour les templates finaux avec emplacement QR code
-- /captures     - Photos originales sans effets
-- /processed    - Photos après application des effets
-- /qrcodes      - QR codes générés pour cet écran

-- Ensuite, configurez les politiques de sécurité via l'interface Supabase :
-- 1. Allez dans la section "Storage" de Supabase
-- 2. Sélectionnez chaque bucket
-- 3. Cliquez sur "Policies"
-- 4. Ajoutez les politiques suivantes pour chaque bucket :

-- Politique 1: Accès en lecture pour tous (y compris les utilisateurs non authentifiés)
-- Nom: "Accès public en lecture"
-- Opération: SELECT
-- Utilisateurs: anon, authenticated
-- Définition: true

-- Politique 2: Accès en écriture pour les utilisateurs authentifiés
-- Nom: "Utilisateurs authentifiés peuvent télécharger des fichiers"
-- Opération: INSERT
-- Utilisateurs: authenticated
-- Définition: true

-- Politique 3: Accès en modification pour les utilisateurs authentifiés
-- Nom: "Utilisateurs authentifiés peuvent mettre à jour des fichiers"
-- Opération: UPDATE
-- Utilisateurs: authenticated
-- Définition: true

-- Politique 4: Accès en suppression pour les utilisateurs authentifiés
-- Nom: "Utilisateurs authentifiés peuvent supprimer des fichiers"
-- Opération: DELETE
-- Utilisateurs: authenticated
-- Définition: true

-- Structure recommandée pour chaque bucket d'écran:
/*
/vertical1 (exemple pour l'écran vertical 1)
  /frames       - Pour les cadres de capture pendant la prise de photo
  /templates    - Pour les templates finaux avec emplacement QR code
  /captures     - Photos originales sans effets
  /processed    - Photos après application des effets
  /qrcodes      - QR codes générés pour cet écran
*/

-- Correspondance entre types d'écran et buckets:
/*
  'horizontal_1' => 'horizontal1' - Normal et Univers
  'vertical_1'   => 'vertical1'   - Cartoon et Glow Up
  'vertical_2'   => 'vertical2'   - Dessin et Noir et blanc
  'vertical_3'   => 'vertical3'   - Caricatures et Normal
*/
