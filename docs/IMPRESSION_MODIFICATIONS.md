# Modifications du système d'impression - Snapbooth V13

## Résumé des modifications

Le fichier `EcranImpression.jsx` a été modifié pour optimiser l'impression des photos avec les paramètres suivants :

### ✅ Fonctionnalités implémentées

1. **Ouverture automatique de l'interface d'impression Chrome**
   - Dès qu'on clique sur l'icône imprimer, la boîte de dialogue d'impression s'ouvre automatiquement
   - Délai de 500ms pour assurer le chargement complet de l'image

2. **Format de papier par défaut : 10x15 cm (4x6 inches)**
   - Configuré via CSS `@page { size: 4in 6in; }`
   - Optimisé pour les imprimantes photo professionnelles
   - Marges à zéro pour utiliser toute la surface du papier

3. **Support des imprimantes recommandées**
   - DNP DS620
   - Mitsubishi DX1N

## Fichiers modifiés

### `src/components/captures/EcranImpression.jsx`

#### Fonction `handlePrintPhoto(photo)`

**Avant :**
```javascript
const handlePrintPhoto = (photo) => {
  logger.info('Impression de la photo', { photoId: photo.id });
  const printWindow = window.open(photo.url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
```

**Après :**
```javascript
const handlePrintPhoto = (photo) => {
  logger.info('Impression de la photo', { photoId: photo.id });
  
  // Créer une page d'impression optimisée
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Impression Photo</title>
          <style>
            @page {
              size: 4in 6in; /* 10cm x 15cm */
              margin: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            
            @media print {
              body {
                width: 4in;
                height: 6in;
              }
            }
          </style>
        </head>
        <body>
          <img src="${photo.url}" alt="Photo à imprimer" onload="window.print();" />
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Déclencher l'impression automatiquement
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};
```

#### Fonction `handlePrintAll()`

Même logique appliquée pour l'impression de toutes les photos avec :
- Format 10x15 cm pour chaque page
- Saut de page entre chaque photo
- Ouverture automatique de la boîte de dialogue d'impression

## Limitations techniques

### ⚠️ Sélection automatique de l'imprimante

**Chrome ne permet PAS de sélectionner automatiquement une imprimante spécifique** pour des raisons de sécurité.

**Solutions de contournement :**

1. **Méthode recommandée** : Configurer l'imprimante DNP 620 ou DX1N comme imprimante par défaut du système Windows
   - Windows → Paramètres → Périphériques → Imprimantes et scanners
   - Sélectionner l'imprimante → Gérer → Définir par défaut

2. **Alternative** : L'utilisateur sélectionne manuellement l'imprimante dans la boîte de dialogue
   - Chrome mémorise le dernier choix d'imprimante
   - Après la première sélection, elle sera pré-sélectionnée pour les impressions suivantes

## Avantages de la nouvelle implémentation

✅ **Expérience utilisateur améliorée**
- Un seul clic pour imprimer
- Interface d'impression s'ouvre immédiatement
- Format de papier pré-configuré

✅ **Optimisation pour les imprimantes photo**
- Format 10x15 cm standard pour les photos
- Pas de marges, utilisation complète du papier
- Compatible avec DNP DS620 et Mitsubishi DX1N

✅ **Code maintenable**
- Documentation claire dans le code
- Commentaires explicatifs
- Structure HTML/CSS propre

## Tests recommandés

### Test 1 : Impression d'une photo unique
1. Ouvrir l'écran d'impression
2. Cliquer sur l'icône imprimante d'une photo
3. Vérifier que la boîte de dialogue d'impression s'ouvre automatiquement
4. Vérifier que le format est 4x6" (10x15 cm)
5. Sélectionner l'imprimante DNP 620 ou DX1N
6. Imprimer

### Test 2 : Impression de toutes les photos
1. Cliquer sur "Tout imprimer"
2. Vérifier que toutes les photos sont dans le document
3. Vérifier que chaque photo est sur une page séparée
4. Vérifier le format 10x15 cm
5. Imprimer

### Test 3 : Imprimante par défaut
1. Configurer DNP 620 comme imprimante par défaut
2. Cliquer sur imprimer
3. Vérifier que DNP 620 est pré-sélectionnée
4. Imprimer sans changer de paramètres

## Documentation complémentaire

Voir `CONFIGURATION_IMPRIMANTES.md` pour :
- Guide de configuration détaillé
- Spécifications des imprimantes
- Dépannage
- Astuces d'optimisation

## Prochaines améliorations possibles

💡 **Idées pour le futur :**

1. **Prévisualisation avant impression**
   - Afficher un aperçu de la photo au format 10x15 cm
   - Permettre des ajustements (recadrage, rotation)

2. **Gestion des files d'impression**
   - Queue d'impression pour plusieurs photos
   - Statut de l'impression en temps réel

3. **Profils d'impression**
   - Sauvegarder des profils pour différentes imprimantes
   - Basculer rapidement entre DNP 620 et DX1N

4. **Impression directe via API**
   - Utiliser les API natives des imprimantes (si disponibles)
   - Contourner la limitation de Chrome

## Support

Pour toute question ou problème :
- Consulter `CONFIGURATION_IMPRIMANTES.md`
- Vérifier les logs dans la console Chrome (F12)
- Vérifier les logs de l'application (Logger)

---

**Date de modification** : 21 octobre 2025  
**Fichier modifié** : `src/components/captures/EcranImpression.jsx`  
**Version** : Snapbooth V13
