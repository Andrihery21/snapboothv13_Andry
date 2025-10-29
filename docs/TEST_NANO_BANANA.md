# Test de l'intégration Nano Banana

## Prérequis

1. **Clé API Nano Banana** : Obtenez votre clé API depuis le portail Nano Banana
2. **Variable d'environnement** : Configurez `NANO_BANANA_API_KEY` dans votre fichier `.env`
3. **Serveur démarré** : Assurez-vous que le serveur est en cours d'exécution

## Test avec curl

### Test basique

```bash
curl -X POST http://localhost:3001/apply-effects \
  -F "magicalId=nano_banana" \
  -F "effectType=cartoon" \
  -F "image=@/chemin/vers/votre/image.jpg"
```

### Test avec différents styles

```bash
# Style cartoon
curl -X POST http://localhost:3001/apply-effects \
  -F "magicalId=nano_banana" \
  -F "effectType=cartoon" \
  -F "image=@test-image.jpg"

# Style sketch
curl -X POST http://localhost:3001/apply-effects \
  -F "magicalId=nano_banana" \
  -F "effectType=sketch" \
  -F "image=@test-image.jpg"

# Style anime
curl -X POST http://localhost:3001/apply-effects \
  -F "magicalId=nano_banana" \
  -F "effectType=anime" \
  -F "image=@test-image.jpg"
```

## Test avec JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testNanoBanana() {
  const formData = new FormData();
  formData.append('magicalId', 'nano_banana');
  formData.append('effectType', 'cartoon');
  formData.append('image', fs.createReadStream('test-image.jpg'));

  try {
    const response = await axios.post('http://localhost:3001/apply-effects', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ Succès:', response.data);
    console.log('URL de l\'image traitée:', response.data.imageUrl);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testNanoBanana();
```

## Test avec fetch (Frontend)

```javascript
async function testNanoBananaFrontend() {
  const formData = new FormData();
  formData.append('magicalId', 'nano_banana');
  formData.append('effectType', 'cartoon');
  
  // Ajouter un fichier depuis un input file
  const fileInput = document.getElementById('imageInput');
  formData.append('image', fileInput.files[0]);

  try {
    const response = await fetch('http://localhost:3001/apply-effects', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Succès:', result);
      console.log('URL de l\'image traitée:', result.imageUrl);
    } else {
      console.error('❌ Erreur:', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
}
```

## Réponses attendues

### Succès

```json
{
  "imageUrl": "https://api.nanobanana.com/result/processed-image-url"
}
```

### Erreur d'authentification

```json
{
  "error": "Nano Banana API : Request failed with status code 401"
}
```

### Erreur de traitement

```json
{
  "error": "Nano Banana API : Request failed with status code 500"
}
```

## Vérification des logs

Lors d'un test réussi, vous devriez voir ces logs dans la console du serveur :

```
🍌 Traitement avec Nano Banana API
📤 Envoi de la requête vers Nano Banana API...
✅ Réponse Nano Banana reçue: { success: true, result_url: "..." }
```

## Dépannage

### Erreur "API key not found"

- Vérifiez que `NANO_BANANA_API_KEY` est définie dans votre fichier `.env`
- Redémarrez le serveur après avoir ajouté la variable d'environnement

### Erreur "Request timeout"

- L'API Nano Banana peut prendre du temps à traiter
- Le timeout est fixé à 30 secondes
- Vérifiez la connectivité réseau

### Erreur "Invalid image format"

- Assurez-vous que l'image est au format JPEG ou PNG
- Vérifiez que le fichier n'est pas corrompu

## Tests de charge

Pour tester la robustesse de l'intégration :

```bash
# Test avec plusieurs requêtes simultanées
for i in {1..5}; do
  curl -X POST http://localhost:3001/apply-effects \
    -F "magicalId=nano_banana" \
    -F "effectType=cartoon" \
    -F "image=@test-image.jpg" &
done
wait
```

## Monitoring

Surveillez les métriques suivantes :

- **Temps de réponse** : Doit être inférieur à 30 secondes
- **Taux de succès** : Doit être supérieur à 95%
- **Utilisation mémoire** : Vérifiez que les fichiers temporaires sont bien nettoyés
- **Logs d'erreur** : Surveillez les erreurs `❌ Erreur Nano Banana`

