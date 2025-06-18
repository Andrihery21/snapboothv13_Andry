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



// Route pour appliquer l'effet
app.post('/apply-effect', async (req, res) => {
    try {
        // Obtenir la dernière image
        const latestImage = getLatestImage();
        console.log('Tentative de récupération de la dernière image');

        if (!latestImage) {
            console.error('Aucune image trouvée dans le dossier');
            throw new Error('Aucune image trouvée dans le dossier');
        }

        // Vérifier que le fichier existe
        if (!fs.existsSync(latestImage.path)) {
            console.error('Le fichier n\'existe pas:', latestImage.path);
            throw new Error('Fichier image non trouvé');
        }

        // Vérifier que c'est bien un JPEG
        const ext = path.extname(latestImage.path).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg') {
            console.error('Format de fichier non supporté:', ext);
            throw new Error('L\'API nécessite une image au format JPEG');
        }

        // Vérifier la taille du fichier
        const stats = fs.statSync(latestImage.path);
        console.log('Taille du fichier:', {
            bytes: stats.size,
            mb: (stats.size / (1024 * 1024)).toFixed(2)
        });

        if (stats.size > MAX_FILE_SIZE) {
            throw new Error(`Fichier trop volumineux (${(stats.size / (1024 * 1024)).toFixed(2)} Mo). Maximum: 10 Mo`);
        }

        // Vérifier les permissions du fichier
        try {
            console.log('Permissions du fichier:', {
                mode: stats.mode.toString(8),
                uid: stats.uid,
                gid: stats.gid,
                readable: stats.mode & fs.constants.S_IRUSR,
                writable: stats.mode & fs.constants.S_IWUSR
            });

            // Tester l'accès en lecture
            fs.accessSync(latestImage.path, fs.constants.R_OK);
            console.log('Le fichier est lisible');

        } catch (error) {
            console.error('Erreur lors de la vérification des permissions:', error);
            throw new Error('Problème de permissions sur le fichier');
        }

        const API_URL = 'https://www.ailabapi.com/api/portrait/effects/portrait-animation';
        const API_KEY = 'JnRC3LbXN1xDe0mHCwZmdV8vEQK24TLgU9Pti9MEOHaJyvYtX1I6AnlBcMkjzgap';

        // Convertir le chemin en format compatible avec curl (utiliser des slashes avant)
        const curlPath = latestImage.path.replace(/\\/g, '/');
        console.log('Chemin pour curl:', curlPath);

        // Construire la commande curl qui fonctionne
        const curlCommand = [
            'curl',
            '--location',
            'https://www.ailabapi.com/api/portrait/effects/portrait-animation',
            '--header',
            `ailabapi-api-key: ${API_KEY}`,
            '--form',
            'task_type=async',
            '--form',
            `image=@"${curlPath}"`,
            '--form',
            'index=1',
            '--verbose'
        ].join(' ');

        console.log('Exécution de curl:', curlCommand);

        const { stdout, stderr } = await execAsync(curlCommand);
        
        // En mode verbose, stderr contient les informations de debug
        // et n'indique pas nécessairement une erreur
        if (stderr) {
            console.log('Informations curl (stderr):', stderr);
        }

        if (!stdout) {
            throw new Error('Pas de réponse de l\'API');
        }

        let response;
        try {
            response = JSON.parse(stdout);
            console.log('Réponse API:', response);

            if (!response.task_id) {
                throw new Error('Pas de task_id dans la réponse');
            }

            // Vérifier si l'API indique une erreur
            if (response.error_code !== 0) {
                throw new Error(`Erreur API: ${response.error_detail?.message || 'Erreur inconnue'}`);
            }

        } catch (error) {
            console.error('Erreur lors du parsing de la réponse:', error);
            console.error('Réponse brute:', stdout);
            throw new Error('Réponse API invalide');
        }

        res.json(response);

    } catch (error) {
        console.error('Erreur complète:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
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
