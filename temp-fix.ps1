# Script pour corriger le fichier EcranHorizontale1Captures.jsx
$content = Get-Content -Path "c:\Users\cegli\Downloads\SNAPBOOTH_V10\src\components\captures\EcranHorizontale1Captures.jsx" -Raw
$content = $content -replace "};(\r?\n+)export default EcranHorizontale1Captures;", "};"
$content = $content -replace "};\\n\\nexport default EcranHorizontale1Captures;", "};"
Set-Content -Path "c:\Users\cegli\Downloads\SNAPBOOTH_V10\src\components\captures\EcranHorizontale1Captures.jsx" -Value $content -NoNewline
Add-Content -Path "c:\Users\cegli\Downloads\SNAPBOOTH_V10\src\components\captures\EcranHorizontale1Captures.jsx" -Value "`n"
Write-Host "Fichier corrigé avec succès!"
