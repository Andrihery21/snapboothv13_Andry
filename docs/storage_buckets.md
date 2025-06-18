# Documentation des Buckets de Stockage SNAPBOOTH

Ce document décrit en détail la structure des buckets de stockage Supabase utilisés dans l'application SNAPBOOTH, leur organisation, les politiques d'accès, et les bonnes pratiques pour leur utilisation.

## Vue d'ensemble des Buckets

L'application SNAPBOOTH utilise plusieurs buckets Supabase Storage pour organiser différents types de fichiers :

| Bucket | Description | Contenu |
|--------|-------------|---------|
| `assets` | Ressources statiques | Images de l'interface, logos, etc. |
| `effects` | Ressources liées aux effets | Prévisualisations et templates pour les effets |
| `photos` | Photos des utilisateurs | Photos originales et traitées |
| `temp` | Fichiers temporaires | Fichiers intermédiaires durant le traitement |

## Structure des Buckets

### Bucket `assets`

```
assets/
├── branding/           # Logos et éléments de marque
│   ├── logos/          # Différentes versions du logo
│   └── backgrounds/    # Arrières-plans personnalisés
├── icons/              # Icônes de l'interface utilisateur
├── ui/                 # Images utilisées dans l'interface
└── sponsors/           # Logos et matériel des sponsors
```

**Politiques d'accès** :
- Public en lecture (images accessibles publiquement)
- Écriture limitée aux administrateurs

### Bucket `effects`

```
effects/
├── previews/           # Images de prévisualisation des effets
│   ├── cartoon/        # Prévisualisations pour les effets cartoon
│   ├── dessin/         # Prévisualisations pour les effets dessin
│   ├── univers/        # Prévisualisations pour les effets univers
│   ├── caricature/     # Prévisualisations pour les effets caricature
│   ├── props/          # Prévisualisations pour les effets props
│   └── video/          # Prévisualisations pour les effets video
├── templates/          # Templates pour les effets
│   ├── cartoon/        # Templates pour les effets cartoon
│   ├── dessin/         # Templates pour les effets dessin
│   ├── univers/        # Templates pour les effets univers
│   ├── caricature/     # Templates pour les effets caricature
│   ├── props/          # Templates pour les effets props
│   └── video/          # Templates pour les effets video
└── icons/              # Icônes spécifiques aux effets
```

**Politiques d'accès** :
- Public en lecture (images accessibles publiquement)
- Écriture limitée aux administrateurs
- RLS (Row Level Security) activé

### Bucket `photos`

```
photos/
├── original/           # Photos originales capturées
│   ├── event_id1/      # Organisé par ID d'événement
│   │   ├── screen_id1/ # Puis par écran
│   │   └── screen_id2/
│   └── event_id2/
├── processed/          # Photos après application des effets
│   ├── event_id1/
│   │   ├── screen_id1/
│   │   └── screen_id2/
│   └── event_id2/
├── qrcodes/            # QR codes générés pour le partage
│   ├── event_id1/
│   └── event_id2/
└── thumbnails/         # Miniatures pour l'affichage en grille
    ├── event_id1/
    └── event_id2/
```

**Politiques d'accès** :
- Accès limité par événement (les utilisateurs ne peuvent voir que les photos de leurs événements)
- Les photos originales ne sont accessibles qu'aux administrateurs
- Les photos traitées sont accessibles aux membres de l'événement
- RLS (Row Level Security) activé avec des politiques basées sur l'ID de l'événement

### Bucket `temp`

```
temp/
├── uploads/            # Fichiers temporaires pendant l'upload
├── processing/         # Fichiers en cours de traitement
└── expired/            # Zone pour les fichiers expirés avant suppression
```

**Politiques d'accès** :
- Accès privé (uniquement pour l'application)
- Nettoyage automatique après 24h

## Conventions de Nommage des Fichiers

### Photos Originales
```
{event_id}_{screen_id}_{timestamp}_{random_id}.{extension}
```
Exemple : `f5a7b3c1_2a9e8f7b_1713872461_a7b3c1.jpg`

### Photos Traitées
```
{event_id}_{screen_id}_{timestamp}_{effect_id}_{random_id}.{extension}
```
Exemple : `f5a7b3c1_2a9e8f7b_1713872461_cartoon_a7b3c1.jpg`

### QR Codes
```
qr_{photo_id}.png
```
Exemple : `qr_123e4567-e89b-12d3-a456-426614174000.png`

## Gestion des Buckets

### Création et initialisation

Les buckets sont créés et initialisés via le script `initStorage.js` dans le dossier `scripts/`. Ce script configure également les politiques d'accès et les dossiers requis.

```javascript
// Exemple d'initialisation (extrait de initStorage.js)
const setupStorageBuckets = async () => {
  // Créer les buckets s'ils n'existent pas
  await supabase.storage.createBucket('assets', { public: true });
  await supabase.storage.createBucket('effects', { public: true });
  await supabase.storage.createBucket('photos', { public: false });
  await supabase.storage.createBucket('temp', { public: false });
  
  // Configurer les politiques...
}
```

### Politiques de Sécurité (RLS)

Les politiques RLS pour les buckets de stockage sont configurées comme suit :

#### Bucket `photos`
```sql
-- Exemple de politique RLS pour le bucket photos
CREATE POLICY "Les utilisateurs peuvent voir les photos de leurs événements" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'photos' AND 
  EXISTS (
    SELECT 1 FROM event_users eu 
    WHERE 
      eu.user_id = auth.uid() AND 
      eu.event_id::text = (storage.foldername(name))[1]
  )
);
```

## Intégration avec les Composants

### Upload d'Image d'Effet (`AdminEffect.jsx`)

```javascript
// Exemple d'upload d'image d'effet
const uploadEffectImage = async (file, effectType, effectId, category) => {
  const path = `${category}/${effectType}/${effectId}.jpg`;
  const { data, error } = await supabase.storage
    .from('effects')
    .upload(path, file, { upsert: true });
    
  if (error) throw error;
  
  // Construction de l'URL publique
  const { publicURL } = supabase.storage
    .from('effects')
    .getPublicUrl(path);
    
  return publicURL;
};
```

### Récupération de Photos d'Événement (`EventPhotosManager.jsx`)

```javascript
// Exemple de récupération de photos
const getEventPhotos = async (eventId) => {
  const { data, error } = await supabase.storage
    .from('photos')
    .list(`processed/${eventId}`);
    
  if (error) throw error;
  
  // Transformer les données pour obtenir les URLs publiques
  const photoUrls = data.map(item => ({
    name: item.name,
    url: supabase.storage
      .from('photos')
      .getPublicUrl(`processed/${eventId}/${item.name}`).publicURL
  }));
  
  return photoUrls;
};
```

## Gestion des Liens Expirés

Les URLs publiques générées par Supabase Storage peuvent être configurées pour expirer après un certain temps pour les buckets non publics. Voici comment gérer cette expiration :

```javascript
// Générer une URL signée avec expiration
const getSignedUrl = async (bucket, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // Expire après 1 heure
    
  if (error) throw error;
  
  return data.signedUrl;
};
```

## Bonnes Pratiques

1. **Performance**
   - Utiliser des thumbnails pour les galeries
   - Compresser les images avant l'upload
   - Utiliser le bon format d'image selon le cas d'usage (WebP pour le web)

2. **Sécurité**
   - Ne jamais exposer directement les chemins complets des buckets privés
   - Implémenter une vérification côté serveur pour les permissions
   - Utiliser des URLs signées pour les accès temporaires

3. **Organisation**
   - Maintenir la structure de dossiers cohérente
   - Nettoyer régulièrement le bucket `temp`
   - Documenter tout changement de structure

4. **Migrations**
   - Créer un script pour migrer les fichiers lors de changements structurels
   - Tester les migrations sur un environnement de développement
   - Sauvegarder les fichiers avant toute migration majeure

## Limites et Quotas

- **Taille maximale par fichier** : 50 MB
- **Types de fichiers autorisés** :
  - Images : jpg, jpeg, png, gif, webp, svg
  - Documents : pdf (pour les QR codes imprimables)
  - Vidéos : mp4 (uniquement pour les effets vidéo)

## Surveillance et Maintenance

### Outils de Surveillance
- Script de vérification d'intégrité: `scripts/checkStorageIntegrity.js`
- Script de nettoyage: `scripts/cleanTempStorage.js`

### Tâches de Maintenance Régulières
- Nettoyage des fichiers temporaires (quotidien)
- Vérification de l'intégrité des buckets (hebdomadaire)
- Sauvegarde des buckets (mensuelle)
