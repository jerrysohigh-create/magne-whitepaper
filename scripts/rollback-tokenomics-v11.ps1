$projectRoot = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $projectRoot 'docs/tokenomics-v11/before'
Copy-Item -LiteralPath (Join-Path $backupRoot 'tokenomics.html') -Destination (Join-Path $projectRoot 'src/content/web3/learning/tokenomics.html')
Copy-Item -LiteralPath (Join-Path $backupRoot 'routes.json') -Destination (Join-Path $projectRoot 'src/content/web3/routes.json')
Copy-Item -LiteralPath (Join-Path $backupRoot 'documents.css') -Destination (Join-Path $projectRoot 'src/app/documents.css')
Write-Output 'Tokenomics trial reverted. Refresh the local preview. The archive and trial files remain on disk for recovery.'
