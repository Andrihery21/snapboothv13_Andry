// Script pour corriger le problème de double export
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'captures', 'EcranHorizontale1Captures.jsx');

// Lire le contenu du fichier
let content = fs.readFileSync(filePath, 'utf8');

// Vérifier s'il y a un export default au début de la définition de fonction
const hasExportInFunctionDeclaration = content.includes('export default function EcranHorizontale1Captures');

// Si oui, supprimer l'export à la fin du fichier
if (hasExportInFunctionDeclaration) {
  content = content.replace(/};[\r\n]+export default EcranHorizontale1Captures;[\r\n]*$/, '};');
  console.log('Export dupliqué supprimé avec succès.');
} else {
  // Sinon, ajouter export default à la déclaration de fonction
  content = content.replace(/function EcranHorizontale1Captures/, 'export default function EcranHorizontale1Captures');
  content = content.replace(/};[\r\n]+export default EcranHorizontale1Captures;[\r\n]*$/, '};');
  console.log('Export ajouté à la déclaration de fonction.');
}

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(filePath, content);
console.log('Fichier mis à jour avec succès.');
