// Ce script explique comment résoudre le problème des doublons d'interface

/*
PROBLÈME : Les filtres de type "univers" apparaissent en double dans l'interface

CAUSE :
Deux composants différents chargent les mêmes données :
- EffectUnivers.jsx : Composant spécifique pour les filtres "univers"
- FilterGallery.jsx : Composant générique qui peut charger tous les types de filtres

SOLUTIONS (choisir une des trois options) :

1. Solution recommandée : Normaliser l'utilisation des composants
   - N'utiliser que FilterGallery.jsx pour afficher tous les types de filtres
   - Remplacer tous les usages de EffectUnivers, EffectCartoon, etc. par FilterGallery avec le type approprié
   - Cette approche est la plus propre et évite les doublons de code

2. Alternative : Ne pas afficher les deux composants en même temps
   - S'assurer que l'application n'affiche jamais EffectUnivers et FilterGallery (avec type="univers") simultanément
   - Utiliser une condition pour choisir quel composant afficher

3. Alternative : Modifier le composant EffectUnivers pour qu'il étende FilterGallery
   - Faire de EffectUnivers un wrapper autour de FilterGallery pour réutiliser la logique

IMPLÉMENTATION DE LA SOLUTION 1 (recommandée) :

1. Identifier où EffectUnivers est utilisé et le remplacer par FilterGallery :

   Avant :
   ```jsx
   import EffectUnivers from '../components/effects/EffectUnivers';
   
   // ...
   
   <EffectUnivers onSelect={handleSelectEffect} />
   ```

   Après :
   ```jsx
   import FilterGallery from '../components/filters/FilterGallery';
   
   // ...
   
   <FilterGallery type="univers" onSelect={handleSelectEffect} />
   ```

2. Répéter pour tous les autres composants similaires (EffectCartoon, EffectDessin, etc.)

3. Vous pouvez conserver les fichiers originaux des composants pour référence future,
   mais ne les importez plus dans votre application
*/
