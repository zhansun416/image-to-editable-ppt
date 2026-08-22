[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$MathmlFile,
  [Parameter(Mandatory=$true)][string]$OutputDirectory,
  [string]$BaseName='formula',
  [string]$MathTypeTool=$env:MATHTYPE_WORD_WPS_TOOL
)

$ErrorActionPreference='Stop'
if(-not $MathTypeTool){throw 'Set MATHTYPE_WORD_WPS_TOOL to the local mathtype_word_wps.py path before using formula export.'}
if(-not(Test-Path -LiteralPath $MathTypeTool)){throw "MathType tool not found: $MathTypeTool"}
if(-not(Test-Path -LiteralPath $MathmlFile)){throw "MathML source not found: $MathmlFile"}
New-Item -ItemType Directory -Force -Path $OutputDirectory|Out-Null
$python=(Get-Command python -ErrorAction Stop).Source
$mtef=Join-Path $OutputDirectory "$BaseName.mtef"
& $python $MathTypeTool native-bridge-mtef --mathml-file $MathmlFile --output-mtef $mtef
if($LASTEXITCODE -ne 0){throw 'MathType MTEF generation failed.'}
& $python $MathTypeTool make-wmf --mathml-file $MathmlFile --output-dir $OutputDirectory --base-name $BaseName
if($LASTEXITCODE -ne 0){throw 'MathType vector preview generation failed.'}
Get-ChildItem -LiteralPath $OutputDirectory|Where-Object{$_.Name -like "$BaseName.*"}|Select-Object FullName,Length
