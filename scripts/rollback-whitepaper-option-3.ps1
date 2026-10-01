$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$snapshot = Join-Path $workspace 'docs/redesign-plan/before-option-3'
$saved = Join-Path $workspace ('docs/redesign-plan/before-rollback-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$files = @(
  @{ Source = 'src/app/page.tsx'; Target = 'src/app/(en)/page.tsx' },
  @{ Source = 'src/app/layout.tsx'; Target = 'src/app/(en)/layout.tsx' },
  @{ Source = 'src/app/[...slug]/page.tsx'; Target = 'src/app/(en)/[...slug]/page.tsx' },
  @{ Source = 'design-qa.md'; Target = 'design-qa.md' }
)
foreach ($file in $files) {
  $from = [IO.Path]::GetFullPath((Join-Path $snapshot $file.Source))
  $target = [IO.Path]::GetFullPath((Join-Path $workspace $file.Target))
  if (-not $target.StartsWith($workspace + [IO.Path]::DirectorySeparatorChar)) { throw 'Target outside workspace' }
  if (-not (Test-Path -LiteralPath $from)) { throw "Missing snapshot: $from" }
  if (-not (Test-Path -LiteralPath $target)) { throw "Missing current file: $target" }
}
foreach ($file in $files) {
  $target = Join-Path $workspace $file.Target
  $saveFile = Join-Path $saved $file.Target
  New-Item -ItemType Directory -Path (Split-Path $saveFile) -Force | Out-Null
  Copy-Item -LiteralPath $target -Destination $saveFile
  $content = [IO.File]::ReadAllText((Join-Path $snapshot $file.Source))
  if ($file.Source -eq 'src/app/layout.tsx') { $content = $content.Replace('import "./', 'import "../') }
  [IO.File]::WriteAllText($target, $content)
}
Write-Output 'Previous English homepage and article shell restored. Chinese /tc/ pages, current content and archive files remain available; no content was deleted.'
