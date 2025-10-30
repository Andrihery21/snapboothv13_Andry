# Debug Gemini Pro API

## 🔍 **Diagnostic de l'erreur 500**

L'erreur 500 indique un problème côté serveur lors de l'appel à l'API Gemini Pro. Voici les étapes de diagnostic :

### 1. **Vérifier les logs du serveur**

Redémarrez votre serveur et regardez les logs quand vous testez Nano Banana. Vous devriez voir :

```
🍌 Traitement avec Google Gemini Pro API
📤 Paramètres reçus: { effectType: 'cartoon', magicalId: 'nano_banana' }
📤 Envoi de la requête vers Google Gemini Pro...
   - Style demandé: cartoon
   - Taille de l'image: 245760 octets
   - Prompt: Transform this image into a vibrant cartoon style...
   - Clé API utilisée: AIzaSyDCidaDrF5opru...
```

### 2. **Erreurs possibles**

#### A. **Erreur d'authentification (401)**
```
❌ Status: 401
❌ Status Text: Unauthorized
❌ Response Data: { "error": { "code": 401, "message": "API key not valid" } }
```
**Solution** : Vérifiez votre clé API Google AI Studio

#### B. **Erreur de quota (429)**
```
❌ Status: 429
❌ Status Text: Too Many Requests
❌ Response Data: { "error": { "code": 429, "message": "Quota exceeded" } }
```
**Solution** : Attendez ou vérifiez vos quotas dans Google AI Studio

#### C. **Erreur de format (400)**
```
❌ Status: 400
❌ Status Text: Bad Request
❌ Response Data: { "error": { "code": 400, "message": "Invalid request" } }
```
**Solution** : Problème avec le format de la requête

#### D. **Erreur de taille d'image (413)**
```
❌ Status: 413
❌ Status Text: Payload Too Large
❌ Response Data: { "error": { "code": 413, "message": "Image too large" } }
```
**Solution** : Réduire la taille de l'image

### 3. **Test de l'API Gemini Pro**

#### Test simple avec curl :
```bash
curl -X POST \
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, how are you?"
      }]
    }]
  }'
```

#### Test avec image (plus complexe) :
```bash
# Convertir votre image en base64 d'abord
base64_image=$(base64 -i your_image.jpg)

curl -X POST \
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d "{
    \"contents\": [{
      \"parts\": [
        {
          \"text\": \"Describe this image\"
        },
        {
          \"inline_data\": {
            \"mime_type\": \"image/jpeg\",
            \"data\": \"$base64_image\"
          }
        }
      ]
    }]
  }"
```

### 4. **Solutions de contournement**

#### A. **Mode simulation (recommandé pour les tests)**
Si l'API Gemini Pro ne fonctionne pas, le code continue avec une simulation :

```javascript
// Le code continue même si Gemini Pro échoue
console.log('🔄 Fallback : continuation sans Gemini Pro...');
// Retourne l'image originale
```

#### B. **Réduire la taille de l'image**
```javascript
// Ajouter une compression d'image avant l'envoi
const sharp = require('sharp');
const compressedImage = await sharp(imageBuffer)
  .resize(1024, 1024, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toBuffer();
```

#### C. **Utiliser un modèle différent**
```javascript
// Essayer avec gemini-1.5-flash au lieu de gemini-1.5-pro
'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
```

### 5. **Configuration recommandée**

#### Variables d'environnement :
```env
# Clé API Google AI Studio
GOOGLE_AI_STUDIO_API_KEY=your-actual-api-key-here

# Configuration du serveur
API_BASE_URL=http://localhost:3001
```

#### Limites à respecter :
- **Taille d'image** : Maximum 20MB
- **Format** : JPEG, PNG, WebP
- **Résolution** : Maximum 2048x2048 pixels
- **Quota** : Vérifiez vos limites dans Google AI Studio

### 6. **Logs de débogage**

Avec les modifications apportées, vous devriez voir des logs détaillés :

```
🍌 Traitement avec Google Gemini Pro API
📤 Paramètres reçus: { effectType: 'cartoon', magicalId: 'nano_banana' }
📤 Envoi de la requête vers Google Gemini Pro...
   - Style demandé: cartoon
   - Taille de l'image: 245760 octets
   - Prompt: Transform this image into a vibrant cartoon style...
   - Clé API utilisée: AIzaSyDCidaDrF5opru...
```

Si erreur :
```
❌ Erreur spécifique Gemini Pro: Request failed with status code 401
❌ Status: 401
❌ Status Text: Unauthorized
❌ Response Data: { "error": { "code": 401, "message": "API key not valid" } }
🔄 Fallback : continuation sans Gemini Pro...
```

### 7. **Prochaines étapes**

1. **Redémarrez votre serveur**
2. **Testez Nano Banana**
3. **Regardez les logs** pour identifier l'erreur exacte
4. **Appliquez la solution** correspondante
5. **Testez à nouveau**

Le système continue de fonctionner même si Gemini Pro échoue, donc vous devriez pouvoir tester l'interface complètement !




