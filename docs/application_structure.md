# Documentation de l'Architecture de l'Application SNAPBOOTH

Ce document décrit l'architecture globale de l'application SNAPBOOTH, ses composants, pages, et l'interaction entre ces éléments.

## Structure Générale

L'application est organisée selon une architecture modulaire avec les répertoires principaux suivants :

```
src/
├── components/       # Composants réutilisables
├── config/           # Fichiers de configuration
├── lib/              # Bibliothèques et utilitaires
├── pages/            # Pages principales de l'application
├── services/         # Services pour les API externes, etc.
├── store/            # Gestion de l'état global
├── styles/           # Styles CSS globaux
└── utils/            # Fonctions utilitaires
```

## Pages Principales

Les pages servent de points d'entrée pour les différentes fonctionnalités de l'application.

| Page | Fichier | Description |
|------|---------|-------------|
| Login | `Login.jsx` | Page d'authentification |
| Sélection d'événement | `EventSelection.jsx` | Permet aux utilisateurs de choisir un événement |
| Gestionnaire de photos | `PhotoGrid.jsx` | Affiche et gère la galerie de photos |
| Configuration des effets | `EffectsConfig.jsx` | Interface pour configurer les effets disponibles |
| Dashboard Admin | `AdminDashboard.jsx` | Tableau de bord principal pour les administrateurs |
| Sélecteur d'événement Admin | `AdminEventSelector.jsx` | Interface pour gérer les événements (admin) |
| Gestionnaire de photos d'événement | `EventPhotosManager.jsx` | Gestion des photos par événement |
| Guide de design | `DesignSystem.jsx` | Documentation des éléments d'interface utilisateur |

## Composants

### Composants d'administration (`components/admin/`)

Ces composants sont utilisés dans les interfaces d'administration.

| Composant | Description |
|-----------|-------------|
| AdminEcran.jsx | Gestion et configuration des écrans |
| AdminEffect.jsx | Interface pour gérer les effets disponibles pour chaque écran |
| ScreenConfigProvider.jsx | Fournit le contexte de configuration des écrans |

### Composants de capture (`components/captures/`)

Gèrent la capture et la transformation des photos.

| Composant | Description |
|-----------|-------------|
| CameraCapture.jsx | Gestion de la capture photo via webcam |
| EffectProcessor.jsx | Application des effets aux photos capturées |
| PhotoPreview.jsx | Aperçu des photos avant et après traitement |

### Composants d'effets (`components/effects/`)

Définissent les différents types d'effets disponibles dans l'application.

| Composant | Description |
|-----------|-------------|
| EffectCartoon.jsx | Effets de style cartoon/bande dessinée |
| EffectDessin.jsx | Effets de style dessin |
| EffectUnivers.jsx | Effets de style univers spécifique |
| EffectCaricature.jsx | Effets de style caricature |
| AdminEffect.jsx | Interface d'administration pour gérer tous les effets (tous types) |

### Composants UI (`components/ui/`)

Composants d'interface utilisateur réutilisables.

| Composant | Description |
|-----------|-------------|
| Button.jsx | Composant bouton standardisé |
| Card.jsx | Carte pour afficher des informations |
| Modal.jsx | Fenêtre modale réutilisable |
| Loader.jsx | Indicateur de chargement |
| Notification.jsx | Système de notifications |

## Services (`services/`)

Services qui connectent l'application aux API externes.

| Service | Description |
|---------|-------------|
| AIApiService.js | Service pour l'API IA principale (AIAPI) |
| LightXService.js | Service pour l'API LightX (caricatures) |
| SupabaseService.js | Service pour les interactions avec Supabase |

## Librairies (`lib/`)

Contient des utilitaires et configurations pour les services externes.

| Fichier | Description |
|---------|-------------|
| supabase.js | Configuration de la connexion à Supabase |
| storageUtils.js | Utilitaires pour la gestion du stockage |
| apiUtils.js | Fonctions utilitaires pour les appels API |
| notifications.js | Système de notification global |

## Flux de Données

### Capture et Traitement d'Images

1. L'utilisateur sélectionne un événement (`EventSelection.jsx`)
2. Choisit un écran basé sur l'événement sélectionné
3. Capture une image via `CameraCapture.jsx`
4. Sélectionne un effet depuis le composant correspondant (`EffectCartoon.jsx`, etc.)
5. L'image est envoyée à l'API appropriée via le service correspondant
6. Le résultat est affiché dans `PhotoPreview.jsx`
7. L'image traitée est sauvegardée dans Supabase Storage
8. Les métadonnées sont enregistrées dans la table `photos`

### Gestion des Effets

1. L'administrateur accède à `AdminDashboard.jsx`
2. Navigue vers la gestion des effets dans `AdminEffect.jsx`
3. Peut ajouter, modifier ou supprimer des effets
4. Les effets sont stockés dans la table `effects` avec leur type et API associée
5. Les ressources visuelles sont stockées dans le bucket `effects` de Supabase Storage

## Types d'Effets et APIs

L'application gère deux APIs pour les effets visuels :

1. **AIAPI** (valeur `api_type` = 'aiapi') :
   - Principalement utilisée pour les effets de type cartoon, dessin et univers
   - Transformations artistiques générales

2. **LightX** (valeur `api_type` = 'lightx') :
   - Principalement utilisée pour les effets de type caricature
   - Specialisée dans les transformations de visage et caricatures

## Écrans et Types d'Effets

Chaque écran est associé à un type d'effet spécifique :

| Écran | ID | Type d'effet |
|-------|----|----|
| Univers | 1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e | univers |
| Cartoon | 2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a | cartoon |
| Dessin | 3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b | dessin |
| Caricature | 4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c | caricature |
| Props | 5d2b1e0a-9f7e-8d6c-7b5a-2c1d0e9f8a7b | props |
| Video | 6e3c2f1b-0a8f-9e7d-8c6b-3d2e1f0a9b8c | video |

## États et gestion globale

L'application utilise un système de gestion d'état basé sur React Context, principalement via :

- `ScreenConfigProvider.jsx` pour la configuration des écrans
- Contextes locaux pour la gestion des états spécifiques aux composants

## Workflow de développement

Pour étendre ou modifier l'application :

1. **Ajout d'un nouveau type d'effet** :
   - Créer un composant dans `/src/components/effects/`
   - Ajouter le type dans `AdminEffect.jsx`
   - Créer un écran associé via l'interface d'administration
   - Ajouter les effets en base de données

2. **Modification de la structure des effets** :
   - Modifier le schéma dans `database_schema.md`
   - Créer un script de migration SQL
   - Mettre à jour les composants qui utilisent ces effets

## Notes de Maintenance

### Structure des fichiers d'effet

Chaque composant d'effet (comme `EffectCartoon.jsx`) :
1. Récupère les effets de son type depuis Supabase
2. Affiche les options disponibles à l'utilisateur
3. Envoie l'effet sélectionné au composant parent via le callback `onSelect`

### Nommage des Composants

- Les composants préfixés par `Admin` sont réservés à l'interface d'administration
- Les composants d'effet suivent la convention `Effect[TypeEffect].jsx`

## Bonnes Pratiques

1. Toujours utiliser le type d'API approprié selon le type d'effet
2. Maintenir la cohérence des schémas de base de données
3. Documenter les modifications importantes
4. Tester les modifications sur un environnement de développement avant de les déployer en production
