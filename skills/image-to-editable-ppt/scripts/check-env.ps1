[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$skillRoot = Split-Path -Parent $PSScriptRoot
$runtimeDist = if ($env:PPTXGENJS_DIST) { $env:PPTXGENJS_DIST } else { Join-Path $skillRoot 'runtime\node_modules\pptxgenjs\dist\pptxgen.cjs.js' }
$svgRoot = if ($env:I2EP_SVG_LIBRARY) { $env:I2EP_SVG_LIBRARY } else { Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex\svg-library' }

function Test-PowerPointCom {
  $app = $null
  try { $app = New-Object -ComObject PowerPoint.Application; return $true }
  catch { return $false }
  finally { if ($app) { $app.Quit() } }
}

[pscustomobject]@{
  Node = [bool](Get-Command node -ErrorAction SilentlyContinue)
  Npm = [bool](Get-Command npm -ErrorAction SilentlyContinue)
  Python = [bool](Get-Command python -ErrorAction SilentlyContinue)
  PowerPointCom = Test-PowerPointCom
  PptxGenJsDist = $runtimeDist
  PptxGenJsAvailable = Test-Path -LiteralPath $runtimeDist
  SvgLibrary = $svgRoot
  SvgLibraryAvailable = Test-Path -LiteralPath $svgRoot
  MathTypeConfigured = [bool]$env:MATHTYPE_EXE
} | Format-List
