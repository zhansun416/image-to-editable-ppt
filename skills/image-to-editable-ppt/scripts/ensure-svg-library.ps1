[CmdletBinding()]
param([string]$LibraryRoot = $(if ($env:I2EP_SVG_LIBRARY) { $env:I2EP_SVG_LIBRARY } else { Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex\svg-library' }))

$ErrorActionPreference = 'Stop'
$skillRoot = Split-Path -Parent $PSScriptRoot
$seedRoot = Join-Path $skillRoot 'assets\svg-library-seed\icons'
$icons = Join-Path $LibraryRoot 'icons'
$manifestPath = Join-Path $LibraryRoot 'library.json'
New-Item -ItemType Directory -Force -Path $icons | Out-Null
if (Test-Path -LiteralPath $manifestPath) { $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json } else { $manifest = [pscustomobject]@{ libraryVersion=1; root='.'; updatedAt=''; entries=@() } }
$entries = @($manifest.entries)
Get-ChildItem -LiteralPath $seedRoot -Filter '*.svg' | ForEach-Object {
  [xml](Get-Content -Raw -LiteralPath $_.FullName) | Out-Null
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
  $target = Join-Path $icons $_.Name
  if (-not (Test-Path -LiteralPath $target)) { Copy-Item -LiteralPath $_.FullName -Destination $target }
  if (-not ($entries | Where-Object { $_.sha256 -eq $hash })) {
    $entries += [pscustomobject]@{ file=$_.Name; path=(Join-Path 'icons' $_.Name); sha256=$hash; tags=@($_.BaseName -split '-'); category='basic-geometry'; sourceLabel='generated-basic'; sourceUrl=$null; extractionMethod='local-seed'; downloadStatus='not-applicable'; license='CC0-equivalent-local'; addedAt=(Get-Date).ToUniversalTime().ToString('o') }
  }
}
$manifest.entries=@($entries); $manifest.updatedAt=(Get-Date).ToUniversalTime().ToString('o')
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
[pscustomobject]@{ Library=$LibraryRoot; Entries=@($manifest.entries).Count } | Format-List
