[CmdletBinding()]
param(
  [switch]$WithOcr,
  [switch]$WithInpaint,
  [switch]$SkipNode
)

$ErrorActionPreference = 'Stop'
$skillRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $skillRoot 'runtime'

if (-not $SkipNode) {
  $npm = Get-Command npm -ErrorAction Stop
  & $npm.Source install --prefix $runtime --omit=dev --ignore-scripts
  if ($LASTEXITCODE -ne 0) { throw 'Core npm dependency installation failed.' }
}

if ($WithOcr -or $WithInpaint) {
  $python = Get-Command python -ErrorAction Stop
  $requirements = @()
  if ($WithOcr) { $requirements += (Join-Path $runtime 'requirements-ocr.txt') }
  if ($WithInpaint) { $requirements += (Join-Path $runtime 'requirements-inpaint.txt') }
  foreach ($file in $requirements) {
    & $python.Source -m pip install -r $file
    if ($LASTEXITCODE -ne 0) { throw "Optional Python dependency installation failed: $file" }
  }
}

[pscustomobject]@{ Runtime=$runtime; CoreNodeInstalled=(-not $SkipNode); OcrInstalled=[bool]$WithOcr; InpaintInstalled=[bool]$WithInpaint } | Format-List
