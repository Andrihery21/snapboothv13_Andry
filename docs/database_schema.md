# Documentation de la Base de Données SNAPBOOTH

Ce document décrit la structure de la base de données Supabase utilisée dans le projet SNAPBOOTH, y compris les tables, colonnes, relations et exemples d'utilisation.

## Tables Principales

### Table `events`

Cette table stocke les informations sur les événements.

| Colonne      | Type      | Description                 | Nullable | Par défaut |
|--------------|-----------|----------------------------|----------|------------|
| id           | UUID      | Identifiant unique          | Non      | uuid_generate_v4() |
| name         | VARCHAR   | Nom de l'événement         | Non      |            |
| date         | DATE      | Date de l'événement        | Oui      |            |
| location     | VARCHAR   | Lieu de l'événement        | Oui      |            |
| description  | TEXT      | Description de l'événement | Oui      |            |
| created_at   | TIMESTAMP | Date de création           | Non      | now()      |
| updated_at   | TIMESTAMP | Date de dernière mise à jour | Non     | now()      |

**Exemple d'utilisation**:
```javascript
// Créer un nouvel événement
const { data, error } = await supabase
  .from('events')
  .insert({
    name: 'Soirée Gala 2025',
    date: '2025-05-15',
    location: 'Paris',
    description: 'Soirée annuelle de gala'
  });
```

### Table `screens`

Cette table stocke les configurations des écrans.

| Colonne      | Type      | Description                | Nullable | Par défaut |
|--------------|-----------|----------------------------|----------|------------|
| id           | UUID      | Identifiant unique         | Non      | uuid_generate_v4() |
| name         | VARCHAR   | Nom de l'écran            | Non      |            |
| type         | VARCHAR   | Type d'écran (horizontal/vertical) | Non |        |
| orientation  | VARCHAR   | Orientation (paysage/portrait) | Non |          |
| ratio        | VARCHAR   | Ratio d'aspect (16:9 ou 9:16) | Non |          |
| screen_key   | VARCHAR   | Clé d'écran (horizontal1, vertical1, etc.) | Non |  |
| config       | JSONB     | Configuration (capture_params, appearance_params, advanced_params) | Oui | {} |
| created_at   | TIMESTAMP | Date de création           | Non      | now()      |
| updated_at   | TIMESTAMP | Date de dernière mise à jour | Non    | now()      |

**Exemple d'utilisation**:
```javascript
// Récupérer un écran par sa clé
const { data, error } = await supabase
  .from('screens')
  .select('*')
  .eq('screen_key', 'vertical1')
  .single();
```

**Identifiants connus**:
- Écran Univers (horizontal1): `1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e`
- Écran Cartoon (vertical1): `2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a`
- Écran Dessin (vertical2): `3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b`
- Écran Caricature (vertical3): `4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c`
- Écran Props: `5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b`
- Écran Video: `6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c`

### Table `event_screens`

Cette table établit la relation entre les événements et les écrans.

| Colonne      | Type      | Description                | Nullable | Par défaut |
|--------------|-----------|----------------------------|----------|------------|
| id           | UUID      | Identifiant unique         | Non      | uuid_generate_v4() |
| event_id     | UUID      | Référence à l'événement    | Non      |            |
| screen_id    | UUID      | Référence à l'écran        | Non      |            |
| is_active    | BOOLEAN   | Indique si l'écran est actif pour l'événement | Non | true |
| created_at   | TIMESTAMP | Date de création           | Non      | now()      |
| updated_at   | TIMESTAMP | Date de dernière mise à jour | Non    | now()      |

**Clés étrangères**:
- `event_id` référence `events.id`
- `screen_id` référence `screens.id`

**Exemple d'utilisation**:
```javascript
// Associer un écran à un événement
const { data, error } = await supabase
  .from('event_screens')
  .insert({
    event_id: 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8',
    screen_id: '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',
    is_active: true
  });
```

### Table `effects`

Cette table stocke les effets disponibles pour les écrans.

| Colonne      | Type      | Description                | Nullable | Par défaut |
|--------------|-----------|----------------------------|----------|------------|
| id           | UUID      | Identifiant unique         | Non      | uuid_generate_v4() |
| name         | VARCHAR   | Nom de l'effet            | Non      |            |
| type         | VARCHAR   | Type d'effet (cartoon, dessin, univers, caricature, props, video) | Non |  |
| screen_id    | UUID      | Référence à l'écran associé | Non    |            |
| preview_url  | TEXT      | URL de l'image de prévisualisation | Oui |         |
| template_url | TEXT      | URL du template            | Oui      |            |
| icon_url     | TEXT      | URL de l'icône             | Oui      |            |
| description  | TEXT      | Description de l'effet     | Oui      |            |
| provider     | VARCHAR   | Fournisseur de l'effet    | Oui      | 'AILab'    |
| params       | JSONB     | Paramètres spécifiques à l'effet | Oui | {}       |
| is_active    | BOOLEAN   | Indique si l'effet est actif | Non   | true       |
| api_type     | VARCHAR   | Type d'API (aiapi ou lightx) | Non   | 'aiapi'    |
| created_at   | TIMESTAMP | Date de création           | Non      | now()      |
| updated_at   | TIMESTAMP | Date de dernière mise à jour | Non    | now()      |

**Clés étrangères**:
- `screen_id` référence `screens.id`

**Exemple d'utilisation**:
```javascript
// Récupérer tous les effets de type 'cartoon' actifs
const { data, error } = await supabase
  .from('effects')
  .select('*')
  .eq('type', 'cartoon')
  .eq('is_active', true);
```

### Table `photos`

Cette table stocke les informations sur les photos prises.

| Colonne        | Type      | Description                | Nullable | Par défaut |
|----------------|-----------|----------------------------|----------|------------|
| id             | UUID      | Identifiant unique         | Non      | uuid_generate_v4() |
| event_id       | UUID      | Référence à l'événement    | Non      |            |
| screen_id      | UUID      | Référence à l'écran        | Non      |            |
| original_path  | TEXT      | Chemin vers la photo originale | Oui  |            |
| processed_path | TEXT      | Chemin vers la photo traitée | Oui    |            |
| qrcode_path    | TEXT      | Chemin vers le QR code généré | Oui   |            |
| effect_applied | VARCHAR   | Effet appliqué             | Oui      |            |
| is_shared      | BOOLEAN   | Indique si la photo a été partagée | Non | false   |
| created_at     | TIMESTAMP | Date de création           | Non      | now()      |
| updated_at     | TIMESTAMP | Date de dernière mise à jour | Non    | now()      |

**Clés étrangères**:
- `event_id` référence `events.id`
- `screen_id` référence `screens.id`

**Exemple d'utilisation**:
```javascript
// Enregistrer une nouvelle photo
const { data, error } = await supabase
  .from('photos')
  .insert({
    event_id: 'f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8',
    screen_id: '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',
    original_path: 'photos/original/photo_123.jpg',
    processed_path: 'photos/processed/photo_123_cartoon.jpg',
    qrcode_path: 'photos/qrcodes/qr_123.png',
    effect_applied: 'Japanese Manga (I)',
    is_shared: false
  });
```

## Diagramme des Relations

```
events 1──┐
          │
          ├──N event_screens N──┐
          │                     │
          │                     │
photos N──┘                     │
                                │
                                ├── screens 1──┐
                                               │
                                               ├──N effects
```

## Storage Buckets

Le projet utilise également plusieurs buckets Supabase Storage pour stocker les fichiers :

### Bucket `assets`

Stocke les ressources statiques de l'application (images, logos, etc.).

### Bucket `effects`

Stocke les ressources liées aux effets, organisées en sous-dossiers :

- `previews/` - Images de prévisualisation des effets
  - `previews/cartoon/`
  - `previews/dessin/`
  - `previews/univers/`
  - `previews/caricature/`
  - `previews/props/`
  - `previews/video/`

- `templates/` - Templates/modèles des effets
  - `templates/cartoon/`
  - `templates/dessin/`
  - `templates/univers/`
  - `templates/caricature/`
  - `templates/props/`
  - `templates/video/`

### Bucket `photos`

Stocke les photos prises par les utilisateurs, organisées en sous-dossiers :

- `original/` - Photos originales
- `processed/` - Photos traitées avec des effets
- `qrcodes/` - QR codes générés pour le partage

## APIs Externes

L'application utilise deux APIs externes pour appliquer des effets aux images :

### AIAPI

Utilisée principalement pour les effets de type cartoon, dessin et univers.

### LightX

Utilisée principalement pour les effets de type caricature.

## Notes sur les Migrations

Lors de modifications futures du schéma, il est recommandé de :

1. Créer un script SQL dans le dossier `scripts/` avec un nom descriptif
2. Tester le script sur une base de données de développement
3. Documenter les modifications dans ce document
4. Appliquer les modifications sur la base de données de production

## Identifiants Importants

- **ID de l'événement de démonstration** : `f5a7b3c1-9d8e-4f6e-7e5d-a3b2c1d0e9f8`
