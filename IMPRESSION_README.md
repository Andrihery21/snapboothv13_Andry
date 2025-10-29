# 🖨️ Système d'impression Snapbooth V13

## 📋 Vue d'ensemble

Le système d'impression de Snapbooth V13 a été optimisé pour offrir une expérience d'impression rapide et efficace avec les imprimantes photo professionnelles **DNP DS620** et **Mitsubishi DX1N**.

## ✨ Fonctionnalités principales

### 1. Impression automatique
- **Un seul clic** sur l'icône imprimante
- **Ouverture automatique** de l'interface d'impression de Chrome
- **Format pré-configuré** à 10x15 cm (4x6 inches)

### 2. Format de papier optimisé
- Taille par défaut : **10 x 15 cm** (format photo standard)
- Marges : **0** (utilisation complète du papier)
- Orientation : **Portrait**

### 3. Imprimantes supportées
- ✅ **DNP DS620** - Imprimante à sublimation thermique
- ✅ **Mitsubishi DX1N** - Imprimante à sublimation thermique

## 🚀 Utilisation

### Impression d'une photo unique

1. Ouvrir l'écran d'impression
2. Cliquer sur l'icône **🖨️ Imprimer** d'une photo
3. La boîte de dialogue d'impression s'ouvre automatiquement
4. Vérifier que l'imprimante DNP 620 ou DX1N est sélectionnée
5. Cliquer sur **Imprimer**

### Impression de toutes les photos

1. Cliquer sur le bouton **Tout imprimer** (en haut à droite)
2. Vérifier l'aperçu des photos
3. Cliquer sur **Imprimer**

## ⚙️ Configuration

### Configuration rapide (Recommandée)

Pour une expérience optimale, configurez l'imprimante DNP 620 ou DX1N comme **imprimante par défaut** :

1. **Windows** → **Paramètres** → **Périphériques** → **Imprimantes et scanners**
2. Sélectionner **DNP DS620** ou **Mitsubishi DX1N**
3. Cliquer sur **Gérer** → **Définir par défaut**

### Configuration du format de papier

1. Propriétés de l'imprimante → **Préférences d'impression**
2. Sélectionner le format **4x6"** ou **10x15 cm**
3. Enregistrer comme format par défaut

## 📁 Fichiers modifiés

### Code source
- **`src/components/captures/EcranImpression.jsx`**
  - Fonction `handlePrintPhoto()` - Impression d'une photo
  - Fonction `handlePrintAll()` - Impression de toutes les photos

### Documentation
- **`docs/CONFIGURATION_IMPRIMANTES.md`** - Guide de configuration détaillé
- **`docs/IMPRESSION_MODIFICATIONS.md`** - Détails techniques des modifications
- **`docs/TEST_IMPRESSION.md`** - Guide de test complet

## 🔧 Détails techniques

### Format CSS utilisé

```css
@page {
  size: 4in 6in; /* 10cm x 15cm */
  margin: 0;
}
```

### Déclenchement automatique

```javascript
printWindow.onload = () => {
  setTimeout(() => {
    printWindow.print();
  }, 500);
};
```

## ⚠️ Limitations importantes

### Sélection automatique de l'imprimante

**Chrome ne permet PAS de sélectionner automatiquement une imprimante spécifique** pour des raisons de sécurité.

**Solutions :**
1. ✅ Configurer l'imprimante comme imprimante par défaut du système (recommandé)
2. ✅ Sélectionner manuellement l'imprimante (Chrome mémorise le choix)

### Compatibilité navigateurs

- ✅ **Chrome** (version 90+) - Pleinement supporté
- ✅ **Edge** (Chromium) - Pleinement supporté
- ⚠️ **Firefox** - Supporté avec variations mineures
- ⚠️ **Safari** - Comportement différent possible

## 📊 Spécifications des imprimantes

### DNP DS620

| Caractéristique | Valeur |
|----------------|--------|
| Résolution | 300 dpi |
| Formats supportés | 10x15 cm, 13x18 cm, 15x20 cm |
| Vitesse | ~60 impressions/heure (10x15 cm) |
| Connexion | USB, Ethernet |

### Mitsubishi DX1N

| Caractéristique | Valeur |
|----------------|--------|
| Résolution | 300 dpi |
| Formats supportés | 10x15 cm, 13x18 cm, 15x20 cm, 15x23 cm |
| Vitesse | ~400 impressions/heure (10x15 cm) |
| Connexion | USB, Ethernet |

## 🐛 Dépannage

### L'interface d'impression ne s'ouvre pas

**Cause** : Pop-ups bloquées

**Solution** :
1. Autoriser les pop-ups pour l'application Snapbooth
2. Icône dans la barre d'adresse → Autoriser

### Le format n'est pas 10x15 cm

**Cause** : Format non supporté par l'imprimante

**Solution** :
1. Vérifier les propriétés de l'imprimante
2. Mettre à jour les pilotes
3. Configurer le format 4x6" manuellement

### L'imprimante n'apparaît pas

**Cause** : Imprimante non détectée

**Solution** :
1. Vérifier que l'imprimante est allumée
2. Vérifier la connexion USB/Ethernet
3. Redémarrer Chrome
4. Vérifier dans `chrome://devices`

## 📝 Tests

Avant de déployer en production, effectuer les tests suivants :

- [ ] Test d'impression d'une photo unique
- [ ] Test d'impression de toutes les photos
- [ ] Test avec imprimante par défaut
- [ ] Test avec sélection manuelle
- [ ] Test de gestion des erreurs
- [ ] Test de performance (impressions successives)

Voir **`docs/TEST_IMPRESSION.md`** pour le guide de test complet.

## 💡 Astuces

### Pour une expérience optimale

1. **Configurer l'imprimante par défaut** - Évite de sélectionner l'imprimante à chaque fois
2. **Désactiver les autres imprimantes** - Si elles ne sont pas nécessaires
3. **Utiliser une connexion Ethernet** - Plus stable que USB pour les impressions multiples
4. **Garder les pilotes à jour** - Assure la compatibilité et les performances

### Raccourcis utiles

- **Ctrl + P** - Ouvrir l'impression (après avoir sélectionné une photo)
- **Échap** - Fermer la boîte de dialogue d'impression
- **Entrée** - Lancer l'impression (dans la boîte de dialogue)

## 🔮 Améliorations futures possibles

1. **Prévisualisation avant impression**
   - Aperçu de la photo au format 10x15 cm
   - Ajustements (recadrage, rotation)

2. **Gestion des files d'impression**
   - Queue d'impression pour plusieurs photos
   - Statut en temps réel

3. **Profils d'impression**
   - Sauvegarder des profils pour différentes imprimantes
   - Basculer rapidement entre DNP 620 et DX1N

4. **Impression directe via API**
   - Utiliser les API natives des imprimantes
   - Contourner les limitations de Chrome

## 📞 Support

Pour toute question ou problème :

1. Consulter la documentation dans `docs/`
2. Vérifier les logs dans la console Chrome (F12)
3. Vérifier les logs de l'application (Logger)

## 📄 Licence

Ce système fait partie de Snapbooth V13.

---

**Version** : 1.0  
**Date** : 21 octobre 2025  
**Auteur** : Équipe Snapbooth  
**Statut** : ✅ Production Ready
