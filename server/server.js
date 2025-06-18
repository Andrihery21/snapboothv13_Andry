import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import fetch from 'node-fetch';

// Importer la configuration du serveur
import { SERVER_CONFIG } from '../config/serverConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

const app = express();
const execAsync = promisify(exec);

// Configuration de base
app.use(cors());
app.use(express.json());

// Formats d'image supportés
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo en octets

// Fonction pour obtenir la dernière image
function getLatestImage() {
    const capturesDir = path.join(__dirname, '../photos/captures');
    console.log('Dossier des captures:', capturesDir);
    
    try {
        // Vérifier si le dossier existe
        if (!fs.existsSync(capturesDir)) {
            console.error('Dossier captures non trouvé:', capturesDir);
            return null;
        }

        // Lire tous les fichiers du dossier
        const files = fs.readdirSync(capturesDir)
            .filter(file => {
                const isJpg = file.endsWith('.jpg');
                console.log(`Fichier ${file}: ${isJpg ? 'est un jpg' : 'non jpg'}`);
                return isJpg;
            })
            .map(file => {
                const filePath = path.join(capturesDir, file);
                const stats = fs.statSync(filePath);
                console.log(`Stats pour ${file}:`, {
                    taille: stats.size,
                    date: stats.mtime
                });
                return {
                    name: file,
                    path: filePath,
                    mtime: stats.mtime
                };
            })
            .sort((a, b) => b.mtime - a.mtime);

        if (files.length === 0) {
            console.error('Aucune image trouvée dans:', capturesDir);
            return null;
        }

        const latestImage = files[0];
        console.log('Dernière image trouvée:', {
            nom: latestImage.name,
            chemin: latestImage.path,
            date: latestImage.mtime
        });

        // Vérifier que le fichier existe toujours
        if (!fs.existsSync(latestImage.path)) {
            console.error('Le fichier n\'existe plus:', latestImage.path);
            return null;
        }

        return latestImage;
    } catch (error) {
        console.error('Erreur lors de la recherche de la dernière image:', error);
        return null;
    }
}



// Configuration pour le téléchargement d'images pour les tests
const testUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const testDir = path.join(__dirname, '../tmp/tests');
        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        cb(null, testDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, 'test-image-' + uniqueSuffix + ext);
    }
});

const testUpload = multer({ 
    storage: testUploadStorage,
    limits: { fileSize: MAX_FILE_SIZE }
});

// Route pour appliquer l'effet
app.post('/apply-effect', testUpload.single('image'), async (req, res) => {
    const startTime = Date.now(); // Mesurer le temps de traitement
    
    try {
        let imagePath;
        let isUploadedFile = false;
        let originalFilename = null;
        
        console.log('==== Nouvelle requête de test d\'effet ====');
        console.log('Type d\'effet demandé:', req.body.effectType);
        console.log('ID de l\'effet:', req.body.effectId);
        
        // Si un fichier a été téléchargé, utiliser celui-ci
        if (req.file) {
            imagePath = req.file.path;
            originalFilename = req.file.originalname || 'test-image.jpg';
            isUploadedFile = true;
            console.log('Utilisation de l\'image téléchargée:', imagePath);
            console.log('Taille du fichier:', (req.file.size / 1024).toFixed(2), 'Ko');
        } 
        // Sinon, si un chemin d'image est fourni, l'utiliser
        else if (req.body && req.body.imagePath) {
            imagePath = req.body.imagePath;
            console.log('Utilisation du chemin d\'image fourni:', imagePath);
            // Tenter de récupérer le nom de fichier original
            originalFilename = path.basename(imagePath);
        }
        // Sinon, utiliser la dernière image capturée
        else {
            const latestImage = getLatestImage();
            console.log('Tentative de récupération de la dernière image');

            if (!latestImage) {
                console.error('Aucune image trouvée dans le dossier captures');
                return res.status(404).json({ 
                    success: false, 
                    message: 'Aucune image trouvée dans le dossier captures',
                    processedImageUrl: null,
                    originalImageUrl: null,
                    processingTime: Date.now() - startTime
                });
            }

            imagePath = latestImage.path;
            originalFilename = path.basename(imagePath);
            console.log('Utilisation de la dernière image capturée:', imagePath);
        }

        // Vérifier que le fichier existe
        if (!fs.existsSync(imagePath)) {
            console.error('Le fichier n\'existe pas:', imagePath);
            return res.status(404).json({ 
                success: false, 
                message: 'Fichier image non trouvé' 
            });
        }

        // Vérifier que c'est bien un JPEG ou une image supportée
        const ext = path.extname(imagePath).toLowerCase();
        if (!SUPPORTED_FORMATS.includes(ext)) {
            console.error('Format de fichier non supporté:', ext);
            return res.status(400).json({
                success: false,
                message: `Format de fichier non supporté: ${ext}. Formats supportés: ${SUPPORTED_FORMATS.join(', ')}`
            });
        }

        // Vérifier la taille du fichier
        const stats = fs.statSync(imagePath);
        console.log('Taille du fichier:', {
            bytes: stats.size,
            mb: (stats.size / (1024 * 1024)).toFixed(2)
        });

        if (stats.size > MAX_FILE_SIZE) {
            return res.status(400).json({
                success: false,
                message: `Fichier trop volumineux (${(stats.size / (1024 * 1024)).toFixed(2)} Mo). Maximum: 10 Mo`
            });
        }

        // Vérifier les permissions du fichier
        try {
            // Tester l'accès en lecture
            fs.accessSync(imagePath, fs.constants.R_OK);
            console.log('Le fichier est lisible');
        } catch (error) {
            console.error('Erreur lors de la vérification des permissions:', error);
            return res.status(500).json({
                success: false,
                message: 'Problème de permissions sur le fichier'
            });
        }
        
        // Récupérer les données de l'effet depuis la requête
        const effectId = req.body.effectId || 'default';
        const effectType = req.body.effectType || 'cartoon';
        const apiType = req.body.apiType || 'aiapi';
        const params = req.body.params ? 
            (typeof req.body.params === 'string' ? JSON.parse(req.body.params) : req.body.params) : 
            {};
        
        // Déterminer quelle API utiliser en fonction du type d'effet
        let API_URL, API_KEY;
        
        if (apiType === 'ailab') {
            API_URL = 'https://www.ailabapi.com/api/portrait/effects/portrait-animation';
            API_KEY = process.env.AILAB_API_KEY || 'JnRC3LbXN1xDe0mHCwZmdV8vEQK24TLgU9Pti9MEOHaJyvYtX1I6AnlBcMkjzgap';
        } else {
            // API par défaut
            API_URL = 'https://www.ailabapi.com/api/portrait/effects/portrait-animation';
            API_KEY = process.env.AILAB_API_KEY || 'JnRC3LbXN1xDe0mHCwZmdV8vEQK24TLgU9Pti9MEOHaJyvYtX1I6AnlBcMkjzgap';
        }

        // Définir le chemin de sortie pour l'image traitée
        const processedDir = path.join(__dirname, '../tmp/processed');
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }
        
        const outputFilename = `processed-${Date.now()}-${Math.round(Math.random() * 1E6)}${ext}`;
        const outputPath = path.join(processedDir, outputFilename);
        
        // Définir les paramètres de style en fonction du type d'effet
        let styleParam = 'cartoon';
        if (params && params.style) {
            styleParam = params.style;
        } else if (effectType) {
            // Mapping simple des types d'effets vers les styles de l'API
            const styleMap = {
                'cartoon': 'cartoon',
                'caricature': 'caricature',
                'dessin': 'sketch',
                'univers': 'fantasy'
            };
            styleParam = styleMap[effectType] || 'cartoon';
        }
        
        console.log(`Application de l'effet: ${effectType}, style: ${styleParam}, ID: ${effectId}`);
        
        // Construire la commande curl avec l'image appropriée
        const command = `curl -X POST "${API_URL}" \
            -H "Content-Type: multipart/form-data" \
            -H "X-API-KEY: ${API_KEY}" \
            -F "image=@${imagePath}" \
            -F "style=${styleParam}" \
            -o "${outputPath}"`;

        // Exécuter la commande curl
        try {
            console.log('Exécution de la commande:\n', command);
            
            // Récupérer le type d'effet et l'ID de l'effet
            const { effectType, effectId } = req.body;
            console.log(`Application de l'effet: type=${effectType}, id=${effectId}`);

            if (!effectType || !effectId) {
                console.error('Type d\'effet ou ID manquant');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Type d\'effet et ID requis',
                    processingTime: Date.now() - startTime
                });
            }
            
            // Déterminer le bucket pour ce type d'effet
            let bucket = 'assets';
            switch (effectType) {
                case 'univers':
                    bucket = 'horizontal1';
                    break;
                case 'cartoon':
                    bucket = 'vertical1';
                    break;
                case 'dessin':
                    bucket = 'vertical2';
                    break;
                case 'caricature':
                    bucket = 'vertical3';
                    break;
                case 'props':
                case 'video':
                    bucket = 'assets';
                    break;
                default:
                    bucket = 'assets';
            }
            
            console.log(`Bucket déterminé pour l'effet: ${bucket}`);

            // Vérifier si l'image existe
            if (!fs.existsSync(imagePath)) {
                console.error('Image introuvable:', imagePath);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Image introuvable',
                    processingTime: Date.now() - startTime
                });
            }

            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                console.error('Erreur standard:', stderr);
            }

            if (!stdout) {
                throw new Error('Pas de réponse de l\'API');
            }

            // Vérifier que le fichier de sortie existe
            if (!fs.existsSync(outputPath)) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la génération de l\'image'
                });
            }
            
            // Obtenir l'URL de l'image traitée
            const relativePath = path.relative(path.join(__dirname, '..'), outputPath);
            const processedImageUrl = `/${relativePath.replace(/\\/g, '/')}`;
            
            // Générer des URLs avec domaine pour les images
            const baseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;
            const fullProcessedUrl = `${baseUrl}${processedImageUrl}`;
            const fullOriginalUrl = `${baseUrl}${originalImageUrl}`;
            
            // Calculer le temps de traitement
            const processingTime = Date.now() - startTime;
            console.log(`Traitement terminé en ${processingTime}ms`);
            
            // Répondre avec succès et les URLs des images
            res.json({
                success: true,
                message: 'Effet appliqué avec succès',
                processedImageUrl: fullProcessedUrl,
                originalImageUrl: fullOriginalUrl,
                processingTime,
                bucket
            });
            
            console.log('==== Traitement d\'effet terminé avec succès ====');
        } catch (error) {
            console.error('Erreur lors de l\'application de l\'effet:', error);
            res.status(500).json({
                success: false,
                message: `Erreur inattendue: ${error.message}`,
                processingTime: Date.now() - startTime
            });
        }

    } catch (error) {
        console.error('Erreur lors de l\'application de l\'effet:', error);
        res.status(500).json({
            success: false,
            message: `Erreur inattendue: ${error.message}`,
            processingTime: Date.now() - startTime
        });
    }
});

// Route pour vérifier le statut
app.post('/check-status', async (req, res) => {
    try {
        const { taskId } = req.body;
        if (!taskId) {
            throw new Error('Task ID manquant');
        }

        console.log('Vérification du statut pour taskId:', taskId);

        const API_URL = 'https://www.ailabapi.com/api/task/results';
        const API_KEY = 'JnRC3LbXN1xDe0mHCwZmdV8vEQK24TLgU9Pti9MEOHaJyvYtX1I6AnlBcMkjzgap';

        // Construire la commande curl avec une syntaxe plus robuste
        const curlCommand = [
            'curl',
            '--location', `'${API_URL}'`,
            '--header', `'ailabapi-api-key: ${API_KEY}'`,
            '--header', "'Content-Type: application/json'",
            '--data', `'{"task_id":"${taskId}","task_type":"async"}'`
        ].join(' ');

        const { stdout, stderr } = await execAsync(curlCommand);
        
        if (stderr) {
            console.error('Stderr curl:', stderr);
        }

        if (!stdout) {
            throw new Error('Pas de réponse de l\'API');
        }

        let response;
        try {
            response = JSON.parse(stdout);
            console.log('Réponse API:', response);
        } catch (error) {
            console.error('Erreur lors du parsing de la réponse:', error);
            console.error('Réponse brute:', stdout);
            throw new Error('Réponse API invalide');
        }

        res.json(response);

    } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
});

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const capturesDir = path.join(__dirname, '../photos/captures');
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(capturesDir)) {
            fs.mkdirSync(capturesDir, { recursive: true });
        }
        cb(null, capturesDir);
    },
    filename: function (req, file, cb) {
        const timestamp = new Date().getTime();
        cb(null, `capture_${timestamp}.jpeg`);
    }
});

const upload = multer({ storage: storage });

// Route pour sauvegarder une capture
app.post('/save-capture', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('Aucune image reçue');
        }

        console.log('Capture sauvegardée:', req.file.path);

        res.json({
            success: true,
            filename: req.file.filename,
            path: req.file.path
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la capture:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



app.post('/save-processed', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            throw new Error('URL de l\'image manquante');
        }

        // Créer le dossier processed s'il n'existe pas
        const processedDir = path.join(__dirname, '../photos/processed');
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        let filename = `processed_${timestamp}`;

        // Vérifier si l'URL force un téléchargement
        const headResponse = await fetch(imageUrl, { method: 'HEAD' });
        const contentDisposition = headResponse.headers.get('content-disposition');
        const contentType = headResponse.headers.get('content-type');

        let extension = 'jpg'; // Valeur par défaut
        if (contentType) {
            const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
            extension = extMap[contentType] || 'jpg';
        }

        if (contentDisposition && contentDisposition.includes('attachment')) {
            // Cas d'un lien de téléchargement direct
            console.log('🟢 Détection d’un Direct Download URL');
            const matches = contentDisposition.match(/filename="(.+?)"/);
            if (matches && matches[1]) {
                filename = matches[1]; // Utiliser le vrai nom du fichier si disponible
            }
        } else {
            console.log('🟢 Détection d’un Direct View URL');
        }

        filename = `${filename}.${extension}`;
        const filepath = path.join(processedDir, filename);

        // Options pour éviter d’être bloqué
        const fetchOptions = {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*'
            },
            redirect: 'follow'
        };

        // Télécharger l’image
        const imageResponse = await fetch(imageUrl, fetchOptions);
        if (!imageResponse.ok) {
            throw new Error('Erreur lors du téléchargement de l\'image');
        }

        // Convertir la réponse en buffer
        const buffer = await imageResponse.arrayBuffer();

        // Écrire le fichier
        fs.writeFileSync(filepath, Buffer.from(buffer));

        console.log('✅ Image traitée sauvegardée:', filepath);

        res.json({
            success: true,
            filename: filename,
            path: filepath
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'image traitée:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Servir les fichiers statiques
app.use('/photos', express.static(path.join(__dirname, '../photos')));

// Route racine
app.get('/', (req, res) => {
    res.json({
        message: 'API Selfie Box',
        endpoints: {
            '/': 'Cette page',
            '/apply-effect': 'Appliquer l\'effet 3D Fairy Tale',
            '/check-status': 'Vérifier le statut de l\'effet',
            '/save-capture': 'Sauvegarder une capture',
            '/save-processed': 'Sauvegarder une image traitée',
            '/photos/*': 'Accéder aux images'
        }
    });
});

const PORT = SERVER_CONFIG.PORTS.MAIN;
const HOST = SERVER_CONFIG.HOST;

app.listen(PORT, HOST, () => {
    console.log(`Serveur démarré sur http://${HOST}:${PORT}`);
    console.log('Dossier photos:', path.join(__dirname, '../photos'));
});
