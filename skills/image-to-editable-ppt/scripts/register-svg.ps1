[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$SourceSvg,
  [Parameter(Mandatory=$true)][string]$Role,
  [Parameter(Mandatory=$true)][string[]]$Tags,
  [string]$SourceUrl,
  [string]$SourceLabel='user-supplied',
  [string]$DownloadStatus='not-applicable',
  [string]$License='unknown-review',
  [string]$LibraryRoot = $(if ($env:I2EP_SVG_LIBRARY) { $env:I2EP_SVG_LIBRARY } else { Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex\svg-library' })
)

$ErrorActionPreference='Stop'
$source=(Resolve-Path -LiteralPath $SourceSvg).Path
if([IO.Path]::GetExtension($source).ToLowerInvariant() -ne '.svg'){ throw 'SourceSvg must be an SVG.' }
[xml](Get-Content -Raw -LiteralPath $source) | Out-Null
$icons=Join-Path $LibraryRoot 'icons'; $manifestPath=Join-Path $LibraryRoot 'library.json'; New-Item -ItemType Directory -Force -Path $icons | Out-Null
if(Test-Path -LiteralPath $manifestPath){$manifest=Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json}else{$manifest=[pscustomobject]@{libraryVersion=1;root='.';updatedAt='';entries=@()}}
$hash=(Get-FileHash -Algorithm SHA256 -LiteralPath $source).Hash.ToLowerInvariant(); $safeRole=($Role.ToLowerInvariant() -replace '[^a-z0-9-]+','-').Trim('-'); $name="$safeRole-$($hash.Substring(0,8)).svg"; $target=Join-Path $icons $name
if((Test-Path -LiteralPath $target) -and ((Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToLowerInvariant() -ne $hash)){throw "Refusing to overwrite different SVG: $target"}
if(-not(Test-Path -LiteralPath $target)){Copy-Item -LiteralPath $source -Destination $target}
$entries=@($manifest.entries)
if(-not($entries | Where-Object {$_.sha256 -eq $hash})){$entries += [pscustomobject]@{file=$name;path=(Join-Path 'icons' $name);sha256=$hash;tags=$Tags;category='presentation-reference';sourceLabel=$SourceLabel;sourceUrl=$SourceUrl;extractionMethod=if($DownloadStatus -eq 'fallback-inline'){'inline-rendered-svg'}else{'file-copy'};downloadStatus=$DownloadStatus;license=$License;role=$Role;addedAt=(Get-Date).ToUniversalTime().ToString('o')};$manifest.entries=@($entries);$manifest.updatedAt=(Get-Date).ToUniversalTime().ToString('o');$manifest|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $manifestPath -Encoding utf8}
[pscustomobject]@{File=$target;Sha256=$hash;Registered=$true}|Format-List
