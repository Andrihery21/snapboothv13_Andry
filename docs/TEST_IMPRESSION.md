# Guide de test - Système d'impression Snapbooth V13

## Prérequis

Avant de commencer les tests, assurez-vous que :

- [ ] L'imprimante DNP DS620 ou Mitsubishi DX1N est connectée et allumée
- [ ] Les pilotes de l'imprimante sont installés
- [ ] L'imprimante est visible dans Windows (Paramètres → Imprimantes)
- [ ] Du papier photo 10x15 cm est chargé dans l'imprimante
- [ ] Chrome est à jour (version 90+)

## Configuration préalable

### Étape 1 : Configurer l'imprimante par défaut (Recommandé)

1. Ouvrir **Paramètres Windows**
2. Aller dans **Périphériques** → **Imprimantes et scanners**
3. Cliquer sur **DNP DS620** ou **Mitsubishi DX1N**
4. Cliquer sur **Gérer**
5. Cliquer sur **Définir par défaut**

### Étape 2 : Vérifier le format de papier

1. Dans les propriétés de l'imprimante
2. Aller dans **Préférences d'impression**
3. Vérifier que le format **4x6"** ou **10x15 cm** est disponible
4. Le définir comme format par défaut

## Tests fonctionnels

### Test 1 : Impression d'une photo unique

**Objectif** : Vérifier que l'impression d'une seule photo fonctionne correctement

**Étapes :**

1. Ouvrir l'application Snapbooth V13
2. Naviguer vers l'écran d'impression (`/ecran-impression?event=XXX`)
3. Attendre le chargement des photos
4. Cliquer sur l'icône **Imprimer** (imprimante) d'une photo

**Résultats attendus :**

- [ ] Une nouvelle fenêtre s'ouvre immédiatement
- [ ] La photo s'affiche dans la nouvelle fenêtre
- [ ] La boîte de dialogue d'impression de Chrome s'ouvre automatiquement (après ~500ms)
- [ ] Le format de papier affiché est **4x6"** ou **10x15 cm**
- [ ] L'imprimante par défaut (DNP 620 ou DX1N) est pré-sélectionnée
- [ ] L'orientation est **Portrait**
- [ ] Les marges sont à **0** ou **Aucune**

**Actions :**

5. Vérifier les paramètres dans la boîte de dialogue
6. Cliquer sur **Imprimer**
7. Vérifier que l'impression démarre

**Résultat final :**

- [ ] La photo est imprimée au format 10x15 cm
- [ ] La photo occupe toute la surface du papier
- [ ] Pas de marges blanches excessives
- [ ] La qualité est bonne

---

### Test 2 : Impression de toutes les photos

**Objectif** : Vérifier que l'impression multiple fonctionne

**Étapes :**

1. Sur l'écran d'impression avec plusieurs photos (au moins 3)
2. Cliquer sur le bouton **Tout imprimer** (en haut à droite)

**Résultats attendus :**

- [ ] Une nouvelle fenêtre s'ouvre avec toutes les photos
- [ ] Chaque photo est sur une page séparée
- [ ] La boîte de dialogue d'impression s'ouvre automatiquement
- [ ] Le nombre de pages correspond au nombre de photos
- [ ] Le format est 4x6" pour chaque page

**Actions :**

3. Dans l'aperçu d'impression, naviguer entre les pages
4. Vérifier que chaque photo est bien centrée
5. Cliquer sur **Imprimer**

**Résultat final :**

- [ ] Toutes les photos sont imprimées
- [ ] Chaque photo est au format 10x15 cm
- [ ] Pas de pages blanches entre les photos
- [ ] L'ordre des photos est respecté

---

### Test 3 : Sélection manuelle de l'imprimante

**Objectif** : Vérifier le fonctionnement quand l'imprimante n'est pas par défaut

**Prérequis :**

- Configurer une autre imprimante comme imprimante par défaut (ex: imprimante PDF)

**Étapes :**

1. Cliquer sur **Imprimer** sur une photo
2. La boîte de dialogue s'ouvre avec l'imprimante par défaut (PDF)
3. Cliquer sur **Destination**
4. Sélectionner **DNP DS620** ou **Mitsubishi DX1N**

**Résultats attendus :**

- [ ] L'imprimante change dans la liste
- [ ] Le format 4x6" est toujours sélectionné
- [ ] L'aperçu se met à jour
- [ ] Les paramètres sont corrects

**Actions :**

5. Imprimer la photo
6. Cliquer à nouveau sur **Imprimer** sur une autre photo

**Résultat final :**

- [ ] Chrome mémorise le choix de l'imprimante
- [ ] La prochaine impression pré-sélectionne DNP/DX1N
- [ ] Pas besoin de re-sélectionner l'imprimante à chaque fois

---

### Test 4 : Impression depuis la vue détaillée

**Objectif** : Vérifier l'impression depuis la modal de visualisation

**Étapes :**

1. Cliquer sur une photo pour l'ouvrir en grand (modal)
2. Cliquer sur le bouton **Imprimer** dans la modal

**Résultats attendus :**

- [ ] Même comportement que le test 1
- [ ] La boîte de dialogue d'impression s'ouvre
- [ ] Format 10x15 cm pré-configuré
- [ ] L'impression fonctionne correctement

---

### Test 5 : Gestion des erreurs

**Objectif** : Vérifier la robustesse du système

**Scénarios à tester :**

#### 5.1 : Imprimante hors ligne

1. Éteindre l'imprimante
2. Tenter d'imprimer une photo
3. **Résultat attendu** : Message d'erreur de Chrome, pas de crash de l'application

#### 5.2 : Pas de papier

1. Retirer le papier de l'imprimante
2. Lancer une impression
3. **Résultat attendu** : Message d'erreur de l'imprimante, possibilité de réessayer

#### 5.3 : Annulation de l'impression

1. Cliquer sur **Imprimer**
2. Dans la boîte de dialogue, cliquer sur **Annuler**
3. **Résultat attendu** : La fenêtre d'impression se ferme, retour à l'écran normal

#### 5.4 : Pop-ups bloquées

1. Bloquer les pop-ups dans Chrome pour le site
2. Tenter d'imprimer
3. **Résultat attendu** : Message de Chrome demandant d'autoriser les pop-ups

---

## Tests de performance

### Test 6 : Impression rapide successive

**Objectif** : Vérifier la stabilité avec plusieurs impressions rapides

**Étapes :**

1. Cliquer sur **Imprimer** sur 5 photos différentes rapidement (sans attendre)
2. Observer le comportement

**Résultats attendus :**

- [ ] Chaque clic ouvre une nouvelle fenêtre d'impression
- [ ] Pas de conflit entre les fenêtres
- [ ] Toutes les boîtes de dialogue s'ouvrent correctement
- [ ] Pas de ralentissement de l'application

---

### Test 7 : Impression avec images haute résolution

**Objectif** : Vérifier les performances avec de grandes images

**Étapes :**

1. Uploader des photos haute résolution (> 5 MB)
2. Tenter de les imprimer

**Résultats attendus :**

- [ ] Le chargement peut prendre quelques secondes
- [ ] La boîte de dialogue s'ouvre après le chargement complet
- [ ] L'aperçu d'impression affiche l'image correctement
- [ ] L'impression fonctionne sans erreur

---

## Tests de compatibilité

### Test 8 : Différents navigateurs

**Objectif** : Vérifier la compatibilité multi-navigateurs

**Navigateurs à tester :**

- [ ] **Chrome** (version 90+) - Navigateur principal
- [ ] **Edge** (Chromium) - Devrait fonctionner de la même manière
- [ ] **Firefox** - Peut avoir des différences dans la boîte de dialogue
- [ ] **Safari** (si disponible) - Comportement différent possible

**Note** : Le système est optimisé pour Chrome. Les autres navigateurs peuvent avoir des variations.

---

## Checklist de validation finale

Avant de considérer le système comme validé :

- [ ] Test 1 réussi : Impression photo unique
- [ ] Test 2 réussi : Impression multiple
- [ ] Test 3 réussi : Sélection manuelle imprimante
- [ ] Test 4 réussi : Impression depuis modal
- [ ] Test 5 réussi : Gestion des erreurs
- [ ] Test 6 réussi : Impressions successives
- [ ] Test 7 réussi : Images haute résolution
- [ ] Format 10x15 cm respecté dans tous les cas
- [ ] Pas de bugs ou crashes constatés
- [ ] Performance acceptable (< 1 seconde pour ouvrir la boîte de dialogue)

---

## Problèmes connus et solutions

### Problème : La boîte de dialogue ne s'ouvre pas automatiquement

**Cause** : Pop-ups bloquées par Chrome

**Solution** :
1. Cliquer sur l'icône de pop-up bloquée dans la barre d'adresse
2. Autoriser les pop-ups pour ce site
3. Réessayer

### Problème : Le format n'est pas 10x15 cm

**Cause** : L'imprimante ne supporte pas ce format ou il n'est pas configuré

**Solution** :
1. Vérifier les propriétés de l'imprimante dans Windows
2. Installer/mettre à jour les pilotes de l'imprimante
3. Configurer le format 4x6" dans les préférences d'impression

### Problème : L'imprimante n'apparaît pas dans la liste

**Cause** : Imprimante non détectée par Chrome

**Solution** :
1. Vérifier que l'imprimante est allumée et connectée
2. Redémarrer Chrome
3. Vérifier dans `chrome://devices`
4. Réinstaller les pilotes si nécessaire

---

## Rapport de test

Après avoir effectué tous les tests, remplir ce rapport :

**Date du test** : _______________

**Testeur** : _______________

**Configuration** :
- OS : Windows ___ (version)
- Chrome : Version ___
- Imprimante : DNP DS620 / Mitsubishi DX1N (cocher)

**Résultats** :
- Tests réussis : ___ / 8
- Tests échoués : ___ / 8
- Bugs critiques : ___
- Bugs mineurs : ___

**Commentaires** :
_______________________________________________
_______________________________________________
_______________________________________________

**Validation** : ✅ Approuvé / ❌ À corriger

---

**Dernière mise à jour** : 21 octobre 2025
