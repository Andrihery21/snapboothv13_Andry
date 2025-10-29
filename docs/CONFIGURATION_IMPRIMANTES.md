# Configuration des Imprimantes pour Snapbooth V13

## Vue d'ensemble

Le système d'impression de Snapbooth V13 est optimisé pour les imprimantes photo professionnelles avec un format de papier par défaut de **10x15 cm (4x6 inches)**.

## Imprimantes recommandées

- **DNP DS620** - Imprimante à sublimation thermique
- **Mitsubishi DX1N** - Imprimante à sublimation thermique

## Configuration dans Chrome

### 1. Définir une imprimante par défaut dans Windows

1. Ouvrez **Paramètres Windows** → **Périphériques** → **Imprimantes et scanners**
2. Cliquez sur l'imprimante DNP DS620 ou DX1N
3. Cliquez sur **Gérer**
4. Cliquez sur **Définir par défaut**

### 2. Configuration de Chrome pour l'impression

1. Ouvrez Chrome et allez dans **chrome://settings/printing**
2. Dans la section "Imprimantes", vérifiez que votre imprimante DNP ou DX1N apparaît
3. Chrome utilisera automatiquement l'imprimante par défaut du système

### 3. Paramètres d'impression recommandés

Lorsque la boîte de dialogue d'impression s'ouvre :

- **Destination** : DNP DS620 ou Mitsubishi DX1N
- **Format de papier** : 4x6" (10x15 cm)
- **Orientation** : Portrait
- **Marges** : Aucune
- **Échelle** : Ajuster à la page

## Fonctionnement du système

### Impression d'une photo unique

Lorsque vous cliquez sur le bouton **Imprimer** (icône imprimante) :

1. Une nouvelle fenêtre s'ouvre avec la photo optimisée
2. La boîte de dialogue d'impression de Chrome s'ouvre automatiquement
3. Le format de papier est pré-configuré à 10x15 cm (4x6")
4. Sélectionnez votre imprimante (DNP 620 ou DX1N)
5. Cliquez sur **Imprimer**

### Impression de toutes les photos

Le bouton **Tout imprimer** :

1. Crée un document avec toutes les photos
2. Chaque photo est sur une page séparée
3. Format optimisé pour 10x15 cm
4. Ouvre automatiquement la boîte de dialogue d'impression

## Code technique

### Format de papier CSS

```css
@page {
  size: 4in 6in; /* 10cm x 15cm */
  margin: 0;
}
```

### Déclenchement automatique de l'impression

```javascript
printWindow.onload = () => {
  setTimeout(() => {
    printWindow.print();
  }, 500);
};
```

## Dépannage

### L'imprimante n'apparaît pas

1. Vérifiez que l'imprimante est allumée et connectée
2. Vérifiez que les pilotes sont installés
3. Redémarrez Chrome
4. Vérifiez dans **chrome://devices** que l'imprimante est détectée

### Le format de papier n'est pas correct

1. Vérifiez les paramètres de l'imprimante dans Windows
2. Assurez-vous que le format 4x6" (10x15 cm) est disponible
3. Configurez ce format comme format par défaut dans les propriétés de l'imprimante

### L'impression ne se déclenche pas automatiquement

1. Vérifiez que les pop-ups ne sont pas bloquées dans Chrome
2. Autorisez les pop-ups pour votre application Snapbooth
3. Vérifiez la console JavaScript pour les erreurs

## Support des imprimantes

### DNP DS620

- **Résolution** : 300 dpi
- **Formats supportés** : 10x15 cm, 13x18 cm, 15x20 cm
- **Vitesse** : ~60 impressions/heure (10x15 cm)
- **Connexion** : USB, Ethernet

### Mitsubishi DX1N

- **Résolution** : 300 dpi
- **Formats supportés** : 10x15 cm, 13x18 cm, 15x20 cm, 15x23 cm
- **Vitesse** : ~400 impressions/heure (10x15 cm)
- **Connexion** : USB, Ethernet

## Notes importantes

⚠️ **Attention** : 
- Chrome ne peut pas forcer la sélection d'une imprimante spécifique pour des raisons de sécurité
- L'utilisateur doit sélectionner manuellement l'imprimante DNP 620 ou DX1N dans la boîte de dialogue
- Pour automatiser complètement, configurez l'imprimante comme imprimante par défaut du système

💡 **Astuce** :
- Pour une expérience optimale, configurez l'imprimante DNP ou DX1N comme imprimante par défaut
- Désactivez les autres imprimantes si elles ne sont pas nécessaires
- Utilisez une connexion Ethernet pour plus de stabilité

## Fichiers modifiés

- `src/components/captures/EcranImpression.jsx` - Composant d'impression principal
  - `handlePrintPhoto()` - Impression d'une photo unique
  - `handlePrintAll()` - Impression de toutes les photos
