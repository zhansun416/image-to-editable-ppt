[CmdletBinding()]
param(
  [switch]$WithOcr,
  [switch]$WithInpaint,
  [switch]$SkipNode
)

$ErrorActionPreference = 'Stop'
$skillRoot = Join-Path $PSScriptRoot '..\skills\image-to-editable-ppt'
& (Join-Path $skillRoot 'scripts\setup-dependencies.ps1') -WithOcr:$WithOcr -WithInpaint:$WithInpaint -SkipNode:$SkipNode
