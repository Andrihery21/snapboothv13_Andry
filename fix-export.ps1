# Script pour ajouter l'export par défaut à la fin du fichier
$filePath = "c:\Users\cegli\Downloads\SNAPBOOTH_V10\src\components\captures\EcranHorizontale1Captures.jsx"
$content = Get-Content -Path $filePath -Raw
$newContent = $content + "`nexport default EcranHorizontale1Captures;`n"
Set-Content -Path $filePath -Value $newContent
Write-Host "Export par défaut ajouté avec succès!"
