[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$Query,
  [string]$LibraryRoot = $(if ($env:I2EP_SVG_LIBRARY) { $env:I2EP_SVG_LIBRARY } else { Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex\svg-library' }),
  [int]$Limit = 12
)

$ErrorActionPreference = 'Stop'
$manifestPath=Join-Path $LibraryRoot 'library.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "SVG library manifest not found: $manifestPath" }
$terms=$Query.ToLowerInvariant().Split([char[]]' ,;/|') | Where-Object { $_ }
$entries=@((Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json).entries)
$matches=foreach($entry in $entries){
  $haystack=(@($entry.file,$entry.path,$entry.category,$entry.sourceLabel)+@($entry.tags)) -join ' '
  $score=0; foreach($term in $terms){ if($haystack.ToLowerInvariant().Contains($term)){ $score++ } }
  if($score -gt 0){ [pscustomobject]@{ Score=$score; File=$entry.file; Path=$entry.path; Tags=@($entry.tags)-join ', '; Source=$entry.sourceUrl; License=$entry.license; Sha256=$entry.sha256 } }
}
$matches | Sort-Object @{Expression='Score';Descending=$true},File | Select-Object -First $Limit | Format-Table -AutoSize
