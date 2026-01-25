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
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { supabase } from './lib/supabase.js';
// import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { sendPhotoEmail, downloadImageAsBuffer } from './services/emailService.js';
import PDFDocument from 'pdfkit';
import pkg from 'pdf-to-printer';
const { print: printPDF } = pkg;



// Importer la configuration du serveur
import { SERVER_CONFIG } from '../config/serverConfig.js';
// const supabaseUrl = 'https://azafzikvwdartavmpwsc.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YWZ6aWt2d2RhcnRhdm1wd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjM1NDMsImV4cCI6MjA1NTAzOTU0M30.MNV4la2gg_gwetjzx5ALYvZzEOU2_JW01kfdVk-ub40';
// const supabase = createClient(supabaseUrl, supabaseAnonKey);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

const app = express();
const execAsync = promisify(exec);
const uploaded = multer({ storage: multer.memoryStorage() });

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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.post('/apply-effects', uploaded.single('image'), async (req, res) => {
  const { effectType, magicalId } = req.body;
  console.log("Fichier reçu :", req.file);
  console.log("Body reçu :", req.body);
  
  // Log détaillé des paramètres pour l'appel API
  console.log("==== PARAMÈTRES POUR L'APPEL API ====");
  console.log("effectType:", effectType);
  console.log("magicalId:", magicalId);
  console.log("Taille de l'image:", req.file?.size, "octets");
  console.log("Type MIME:", req.file?.mimetype);
  console.log("=====================================");
  
  const imageBuffer = req.file?.buffer;

  if (!imageBuffer) return res.status(400).json({ error: 'Image manquante.' });

  try {
    let processedImageUrl = null;

    // ---------------------- LightX (Caricature) ----------------------
    if (magicalId === 'caricature') {

       // Étape 1 : Télécharger l'image vers le bucket Supabase
      const bucketName = 'before.lightx';
      const fileKey = `${uuidv4()}.jpg`; // Générer un nom de fichier unique

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileKey, imageBuffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erreur lors du téléchargement vers Supabase:', uploadError);
        return res.status(500).json({ error: 'Erreur lors du téléchargement de l\'image' });
      }

      // Étape 2 : Obtenir l'URL publique de l'image
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileKey);

      const imageUrl = publicUrlData.publicUrl;
      console.log(`Image téléchargée avec succès. URL Supabase: ${imageUrl}`);
      
      // Récupérer styleImageUrl depuis le body (chargé côté client depuis params_array.reference_image_url)
      const styleImageUrlFromBody = (req.body && (req.body.reference_image_url || req.body.styleImageUrl)) || "";
      console.log("LightX: styleImageUrl reçu:", styleImageUrlFromBody);

      const response = await axios.post(
        'https://api.lightxeditor.com/external/api/v1/caricature',
        {
          imageUrl: imageUrl, // Vrai URL 
          styleImageUrl: styleImageUrlFromBody,
          textPrompt: effectType,
        },
        {
          headers: {
            'x-api-key': '5c3f8ca0cbb94ee191ffe9ec4c86d8f1_6740bbef11114053828a6346ebfdd5f5_andoraitools',
            'Content-Type': 'application/json'
          },
        }
      );

      const orderId = response.data.body.orderId;

      // Polling
      for (let attempt = 0; attempt < 10; attempt++) {
        const status = await axios.post(
          'https://api.lightxeditor.com/external/api/v1/order-status',
          { orderId },
          {
            headers: {
              'x-api-key': '5c3f8ca0cbb94ee191ffe9ec4c86d8f1_6740bbef11114053828a6346ebfdd5f5_andoraitools',
              'Content-Type': 'application/json'
            },
          }
        );

        const outputUrl = status.data.body.output;
        if (outputUrl) {
          processedImageUrl = outputUrl;
          break;
        }

        await delay(5000);
      }

      if (!processedImageUrl) throw new Error("Échec génération image LightX.");
    }

   // ---------------------- AILab Anime Generator ----------------------
    else if ((magicalId === 'univers' && effectType !== 'animation3d') || (magicalId === 'sketch' && effectType === '0')) {
      // Créer un fichier temporaire
      const tempFilePath = path.join(tmpdir(), `temp_image_${Date.now()}.jpg`);
      writeFileSync(tempFilePath, imageBuffer);
      
      try {
        const formData = new FormData();
        formData.append('index', effectType);
        formData.append('image', createReadStream(tempFilePath));
        formData.append('task_type', 'async');

        const animeRes = await axios.post(
          'https://www.ailabapi.com/api/image/effects/ai-anime-generator',
          formData,
          {
            headers: {
              'ailabapi-api-key': 'process.env.AILAB_API_KEY',
              ...formData.getHeaders(),
            },
          }
        );
        
        // Nettoyer le fichier temporaire
        fs.unlinkSync(tempFilePath);
        
        const taskID = animeRes.data.task_id;

      for (let attempt = 0; attempt < 20; attempt++) {
        const poll = await axios.get('https://www.ailabapi.com/api/common/query-async-task-result', {
          params: { task_id: taskID },
          headers: {
            'ailabapi-api-key': process.env.AILAB_API_KEY,
          },
        });

        if (poll.data.task_status === 2) {
          processedImageUrl = poll.data.data.result_url;
          break;
        }

        await delay(500);
      }

      if (!processedImageUrl) throw new Error("AILab Anime : Image non générée.");
      } catch (error) {
        // Nettoyer le fichier temporaire en cas d'erreur
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw error;
      }
    }

    // ---------------------- Flux Kontext (BFL) ----------------------
    else if (magicalId === 'fluxcontext_1') {
      const base64 = imageBuffer.toString('base64');

      const payload = {
        prompt: effectType,
        input_image: base64,
      };

      const postRes = await axios.post(
        'https://api.bfl.ai/v1/flux-kontext-pro',
        payload,
        {
          headers: {
            'accept': 'application/json',
            'x-key': process.env.VITE_BFL_FLUX_KONTEXT_KEY || 'ec4d3364-698e-4b95-947c-73b51e96873e',
            'Content-Type': 'application/json',
          },
        }
      );

      const pollingUrl = postRes.data.polling_url;

      let finalImageUrl = null;
      for (let attempt = 0; attempt < 100; attempt++) {
        const pollRes = await axios.get(pollingUrl, {
          headers: {
            'x-key': process.env.VITE_BFL_FLUX_KONTEXT_KEY || 'ec4d3364-698e-4b95-947c-73b51e96873e',
            'accept': 'application/json',
          },
        });

        if (pollRes.data.status === "Ready" && pollRes.data.result?.sample) {
          finalImageUrl = pollRes.data.result.sample;
          processedImageUrl = `https://corsproxy.io/?${encodeURIComponent(finalImageUrl)}`;
          break;
        } else if (["Error", "Failed"].includes(pollRes.data.status)) {
          throw new Error("Échec BFL Kontext : " + pollRes.data.detail);
        }

        await delay(500);
      }

      if (!processedImageUrl) throw new Error("BFL Kontext : Image non générée.");
    }

    // ---------------------- Google Gemini Pro API (Nano Banana) ----------------------
    else if (magicalId === 'nano_banana') {
      console.log('🍌 Traitement avec Google Gemini Pro API');
      console.log('📤 Paramètres reçus:', { effectType, magicalId });
      
      // Créer un fichier temporaire
      const tempFilePath = path.join(tmpdir(), `temp_image_${Date.now()}.jpg`);
      writeFileSync(tempFilePath, imageBuffer);
      
      try {
        // Convertir l'image en base64 pour Gemini
        const base64Image = imageBuffer.toString('base64');
        
        // Définir le prompt selon le type d'effet
        let prompt = '';
        switch (effectType) {
          case 'cartoon':
            prompt = 'Transform this image into a vibrant cartoon style with bold colors, clean lines, and animated character features. Make it look like a professional animation still.';
            break;
          case 'anime':
            prompt = 'Convert this image to anime/manga style with large expressive eyes, detailed hair, and vibrant colors typical of Japanese animation.';
            break;
          case 'sketch':
            prompt = 'Transform this image into a detailed pencil sketch with shading and artistic line work, like a professional drawing.';
            break;
          case 'painting':
            prompt = 'Convert this image into a digital painting with artistic brushstrokes, rich colors, and painterly texture.';
            break;
          default:
            prompt = 'Apply a creative artistic transformation to this image, making it visually striking and unique while maintaining the subject\'s identity.';
        }
        
        console.log('📤 Envoi de la requête vers Google Gemini Pro...');
        console.log('   - Style demandé:', effectType || 'default');
        console.log('   - Taille de l\'image:', imageBuffer.length, 'octets');
        console.log('   - Prompt:', prompt);
        console.log('   - Clé API utilisée:', (process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.NANO_BANANA_API_KEY || 'AIzaSyDCidaDrF5oprualS0AZi-2KHrFhHKQhtQ').substring(0, 20) + '...');
        
        let geminiResponse = null;
        let geminiText = '';
        
        try {
          // Appel à l'API Google Gemini Pro avec le nouveau modèle
          geminiResponse = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
            {
              contents: [{
                parts: [
                  {
                    text: prompt
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Image
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseModalities: ['TEXT', 'IMAGE']
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.NANO_BANANA_API_KEY || 'AIzaSyDCidaDrF5oprualS0AZi-2KHrFhHKQhtQ'
              },
              timeout: 60000, // 60 secondes de timeout
            }
          );
          
          console.log('✅ Réponse Gemini Pro reçue');
          console.log('📝 Données de réponse:', JSON.stringify(geminiResponse.data, null, 2));
          
          // Extraire le texte de la réponse
          if (geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            geminiText = geminiResponse.data.candidates[0].content.parts[0].text;
            console.log('📝 Texte généré par Gemini:', geminiText);
          }
          
        } catch (geminiError) {
          console.error('❌ Erreur spécifique Gemini Pro:', geminiError.message);
          console.error('❌ Status:', geminiError.response?.status);
          console.error('❌ Status Text:', geminiError.response?.statusText);
          console.error('❌ Response Data:', geminiError.response?.data);
          
          // Fallback : continuer sans Gemini Pro
          console.log('🔄 Fallback : continuation sans Gemini Pro...');
        }
        
        // Traiter la réponse de Gemini Pro
        const processedDir = path.join(__dirname, '../tmp/processed');
        if (!fs.existsSync(processedDir)) {
          fs.mkdirSync(processedDir, { recursive: true });
        }
        
        let outputPath;
        let outputFilename;
        
        // Vérifier si Gemini a généré une image
        if (geminiResponse && geminiResponse.data?.candidates?.[0]?.content?.parts) {
          const parts = geminiResponse.data.candidates[0].content.parts;
          const imagePart = parts.find(part => part.inlineData);
          
          if (imagePart && imagePart.inlineData) {
            console.log('🎨 Image générée par Gemini détectée !');
            outputFilename = `gemini-generated-${Date.now()}-${Math.round(Math.random() * 1E6)}.${imagePart.inlineData.mimeType?.split('/')[1] || 'jpg'}`;
            outputPath = path.join(processedDir, outputFilename);
            
            // Sauvegarder l'image générée par Gemini
            const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
            fs.writeFileSync(outputPath, imageBuffer);
            console.log('✅ Image générée par Gemini sauvegardée:', outputPath);
          } else {
            console.log('📝 Gemini a retourné du texte uniquement, utilisation de l\'image originale');
            outputFilename = `gemini-text-${Date.now()}-${Math.round(Math.random() * 1E6)}.jpg`;
            outputPath = path.join(processedDir, outputFilename);
            fs.copyFileSync(tempFilePath, outputPath);
          }
        } else {
          console.log('🔄 Aucune réponse de Gemini, utilisation de l\'image originale');
          outputFilename = `gemini-fallback-${Date.now()}-${Math.round(Math.random() * 1E6)}.jpg`;
          outputPath = path.join(processedDir, outputFilename);
          fs.copyFileSync(tempFilePath, outputPath);
        }
        
        // Nettoyer le fichier temporaire
        fs.unlinkSync(tempFilePath);
        
        // Obtenir l'URL de l'image traitée
        const relativePath = path.relative(path.join(__dirname, '..'), outputPath);
        const relativeUrl = `/${relativePath.replace(/\\/g, '/')}`;
        
        // Générer l'URL complète
        const baseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;
        processedImageUrl = `${baseUrl}${relativeUrl}`;
        
        console.log('✅ Traitement Gemini Pro terminé:', processedImageUrl);
        if (geminiText) {
          console.log('📝 Réponse Gemini:', geminiText);
        } else {
          console.log('📝 Aucune réponse texte de Gemini');
        }
        
      } catch (error) {
        // Nettoyer le fichier temporaire en cas d'erreur
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        console.error('❌ Erreur Gemini Pro:', error.message);
        console.error('❌ Détails de l\'erreur:', error.response?.data);
        throw new Error(`Google Gemini Pro API : ${error.message}`);
      }
    }

      // ---------------------- AILab Background Removal ----------------------
    else if (magicalId === 'bg_removal') {
      console.log('🖼️ Traitement avec AILab Background Removal API');
      
      // Créer un fichier temporaire
      const tempFilePath = path.join(tmpdir(), `temp_bg_removal_${Date.now()}.jpg`);
      writeFileSync(tempFilePath, imageBuffer);
      
      try {
        // Créer FormData pour l'appel API AILab
        const formData = new FormData();
        formData.append('image', fs.createReadStream(tempFilePath), {
          filename: 'image.jpg',
          contentType: 'image/jpeg'
        });
       // formData.append('return_form', 'url'); // Retourner l'URL de l'image traitée

        console.log('📤 Envoi à AILab Background Removal API...');
        console.log('🔑 Clé API utilisée:', process.env.AILAB_API_KEY ? 'Variable d\'env' : 'Clé par défaut');
        console.log('📁 Fichier temporaire:', tempFilePath);
        console.log('📏 Taille du buffer:', imageBuffer.length, 'octets');
        
        const response = await axios.post(
          'https://www.ailabapi.com/api/cutout/general/universal-background-removal',
          formData,
          {
            headers: {
              'ailabapi-api-key': 'gS7zL4BO3JthbYvCNI0ynFAOwzTgC2hmslTtk5L4eayDnHlBiKjPqZQPi8mZU8cV',
              ...formData.getHeaders(),
            },
            timeout: 60000 // 60 secondes de timeout
          }
        );

        console.log('✅ Réponse AILab Background Removal reçue');
        console.log('📝 Données de réponse:', JSON.stringify(response.data, null, 2));

        // Vérifier la réponse
        if (response.data.error_code !== 0) {
          throw new Error(response.data.error_msg || 'AILab Background Removal : Erreur inconnue');
        }

        // Extraire l'URL de l'image traitée
        processedImageUrl = response.data.data.image_url;
        
        if (!processedImageUrl) {
          throw new Error('AILab Background Removal : URL de l\'image manquante dans la réponse');
        }

        console.log('✅ Background removal appliqué avec succès, URL:', processedImageUrl);

      } catch (error) {
        console.error('❌ Erreur AILab Background Removal:', error.message);
        console.error('❌ Détails de l\'erreur:', error.response?.data || error);
        
        // Nettoyer le fichier temporaire en cas d'erreur
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        // Si c'est une erreur API, la propager avec plus de détails
        if (error.response?.data) {
          throw new Error(`AILab API Error: ${error.response.data.error_msg || error.response.data.message || 'Erreur inconnue'} (Code: ${error.response.data.error_code || error.response.status})`);
        }
        
        throw error;
      } finally {
        // Nettoyer le fichier temporaire
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }

    // ---------------------- AILab Portrait ----------------------
    else {
     // Créer un fichier temporaire
      const tempFilePath = path.join(tmpdir(), `temp_image_${Date.now()}.jpg`);
      writeFileSync(tempFilePath, imageBuffer);
      
      try {
        const formData = new FormData();
        formData.append('type', effectType);
        formData.append('image', createReadStream(tempFilePath));

        const portraitRes = await axios.post(
          'https://www.ailabapi.com/api/portrait/effects/portrait-animation',
          formData,
          {
            headers: {
              'ailabapi-api-key': '24icb7sh83knhMutmqEQ4xSmdOBy5pxd831eaUMPH7JB0vTqIWArVYNNlLFKOPVU', 
              ...formData.getHeaders(),
            },
          }
        );
        
        // Nettoyer le fichier temporaire
        fs.unlinkSync(tempFilePath);

        if (portraitRes.data.error_code !== 0) {
          throw new Error(portraitRes.data.error_msg || 'AILab Portrait : Erreur inconnue');
        }

        processedImageUrl = portraitRes.data.data.image_url;
      } catch (error) {
        // Nettoyer le fichier temporaire en cas d'erreur
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw error;
      }
    } 

    // Réponse finale
    return res.json({ imageUrl: processedImageUrl });

  } catch (err) {
    console.error('Erreur lors du traitement de l’effet IA :', err);
    return res.status(500).json({ error: err.message || 'Erreur interne serveur' });
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

// Route pour envoyer un email avec la photo
app.post('/send-photo-email', async (req, res) => {
    try {
        const { email, photoUrl, recipientName } = req.body;

        console.log('📧 Requête d\'envoi d\'email reçue');
        console.log('Email:', email);
        console.log('Photo URL:', photoUrl);
        console.log('Recipient Name:', recipientName);

        if (!email || !photoUrl) {
            console.error('❌ Paramètres manquants');
            return res.status(400).json({
                success: false,
                error: 'Email et URL de la photo sont requis'
            });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('❌ Email invalide:', email);
            return res.status(400).json({
                success: false,
                error: 'Adresse email invalide'
            });
        }

        console.log('📧 Envoi d\'email à:', email);
        console.log('📷 URL de la photo:', photoUrl);

        // Télécharger l'image pour l'attacher à l'email
        let photoBuffer = null;
        try {
            console.log('⬇️ Téléchargement de l\'image...');
            photoBuffer = await downloadImageAsBuffer(photoUrl);
            console.log('✅ Image téléchargée, taille:', photoBuffer.length, 'octets');
        } catch (error) {
            console.warn('⚠️ Impossible de télécharger l\'image pour la pièce jointe:', error.message);
            console.warn('L\'email sera envoyé avec l\'URL uniquement');
            // On continue sans pièce jointe, juste avec l'URL dans le template
        }

        // Envoyer l'email via Brevo
        console.log('📤 Appel du service d\'envoi d\'email...');
        const result = await sendPhotoEmail(email, recipientName, photoUrl, photoBuffer);

        console.log('✅ Email envoyé avec succès');
        res.json(result);

    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.error || error.message || 'Erreur lors de l\'envoi de l\'email'
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
            '/send-photo-email': 'Envoyer une photo par email',
            '/print-photo': 'Impression silencieuse PDF A5',
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

// Impression silencieuse d'une image en PDF A5 vers une imprimante donnée
app.post('/print-photo', async (req, res) => {
  try {
    const { photoUrl, printerName = 'DNP DS620', copies = 1, paperSize = 'A5', landscape = false } = req.body || {};

    if (!photoUrl) {
      return res.status(400).json({ success: false, error: 'photoUrl requis' });
    }

    // Télécharger l'image
    const response = await fetch(photoUrl);
    if (!response.ok) {
      return res.status(400).json({ success: false, error: 'Téléchargement image échoué' });
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    // Préparer fichiers temporaires
    const tempDir = path.join(tmpdir());
    const imgPath = path.join(tempDir, `print_${Date.now()}.jpg`);
    const pdfPath = path.join(tempDir, `print_${Date.now()}.pdf`);
    fs.writeFileSync(imgPath, buffer);

    try {
      // Générer un PDF A5
      await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: paperSize, layout: landscape ? 'landscape' : 'portrait', margin: 0 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);
        // Remplir toute la page en conservant les proportions
        try {
          const pageWidth = doc.page.width;
          const pageHeight = doc.page.height;
          doc.image(imgPath, 0, 0, { width: pageWidth, height: pageHeight, align: 'center', valign: 'center' });
        } catch (e) {
          // fallback simple
          doc.image(imgPath, 0, 0, { fit: [doc.page.width, doc.page.height], align: 'center', valign: 'center' });
        }
        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Envoyer à l'imprimante sans dialogue
      for (let i = 0; i < Math.max(1, Number(copies)); i++) {
        await printPDF(pdfPath, {
          printer: printerName,
          paperSize,
          win32: []
        });
      }

      return res.json({ success: true });
    } finally {
      // Nettoyer
      try { fs.existsSync(imgPath) && fs.unlinkSync(imgPath); } catch {}
      try { fs.existsSync(pdfPath) && fs.unlinkSync(pdfPath); } catch {}
    }
  } catch (error) {
    console.error('Erreur impression:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erreur impression' });
  }
});

// Statut imprimante physique (DNP DS620)
app.get('/printer-status', async (req, res) => {
  try {
    const { printerName = 'DNP DS620' } = req.query;
    // PowerShell pour lister toutes les imprimantes et leur statut
    const { exec } = require('child_process');
    exec(`powershell -Command "Get-Printer | Select-Object Name, PrinterStatus | ConvertTo-Json"`, (err, stdout, stderr) => {
      if (err || !stdout) {
        res.status(500).json({ status: 'Déconnecté', error: 'Impossible de lire la liste des imprimantes.' });
        return;
      }
      let printers = [];
      try {
        printers = JSON.parse(stdout);
      } catch (e) {}
      let found = false;
      let ready = false;
      if (Array.isArray(printers)) {
        for(const p of printers) {
          if ((p.Name || '').trim().toLowerCase() === printerName.trim().toLowerCase()) {
            found = true;
            ready = (p.PrinterStatus === 3); // 3 = Prêt
            break;
          }
        }
      } else if (printers && printers.Name) {
        if ((printers.Name || '').trim().toLowerCase() === printerName.trim().toLowerCase()) {
          found = true;
          ready = (printers.PrinterStatus === 3);
        }
      }
      res.json({
        status: found ? (ready ? 'Prêt' : 'Indisponible') : 'Déconnecté',
        found,
        raw: printers
      });
    });
  } catch(e) {
    res.status(500).json({ status: 'Déconnecté', error: 'Erreur interne statut imprimante.' });
  }
});
