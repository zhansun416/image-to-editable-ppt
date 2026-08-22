[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$PptxPath,
  [Parameter(Mandatory=$true)][string]$OutputDirectory,
  [ValidateRange(640,7680)][int]$Width=1920,
  [ValidateRange(360,4320)][int]$Height=1080
)

$ErrorActionPreference='Stop'
$pptx=(Resolve-Path -LiteralPath $PptxPath).Path
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$app=$null;$presentation=$null
try{
  $app=New-Object -ComObject PowerPoint.Application
  $presentation=$app.Presentations.Open($pptx,$true,$false,$false)
  for($i=1;$i -le $presentation.Slides.Count;$i++){
    $target=Join-Path $OutputDirectory (('slide-{0:D2}.png' -f $i))
    $presentation.Slides.Item($i).Export($target,'PNG',$Width,$Height)
  }
  Get-ChildItem -LiteralPath $OutputDirectory -Filter 'slide-*.png'|Select-Object FullName,Length,LastWriteTime
}finally{if($presentation){$presentation.Close()};if($app){$app.Quit()}}
