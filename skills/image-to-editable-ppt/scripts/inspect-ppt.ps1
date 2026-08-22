[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$PptxPath)

$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$resolved=(Resolve-Path -LiteralPath $PptxPath).Path
$archive=[System.IO.Compression.ZipFile]::OpenRead($resolved)
try{
  $entries=@($archive.Entries)
  $slides=@($entries|Where-Object{$_.FullName -match '^ppt/slides/slide\d+\.xml$'}).Count
  $charts=@($entries|Where-Object{$_.FullName -match '^ppt/charts/chart\d+\.xml$'}).Count
  $media=@($entries|Where-Object{$_.FullName -match '^ppt/media/'}).Count
  if(-not($entries.FullName -contains '[Content_Types].xml') -or $slides -lt 1){throw 'PPTX package is missing required content or slides.'}
  [pscustomobject]@{Pptx=$resolved;Slides=$slides;Charts=$charts;MediaAssets=$media;PackageIntegrity='passed'}|Format-List
}finally{$archive.Dispose()}
