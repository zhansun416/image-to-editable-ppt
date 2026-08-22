#!/usr/bin/env bash
set -euo pipefail
[[ $# -ge 2 ]] || { echo "Usage: render-ppt.sh <deck.pptx> <output-dir>" >&2; exit 2; }
pptx="$1"; output="$2"; mkdir -p "$output"
soffice_bin="${SOFFICE_BIN:-}"
if [[ -z "$soffice_bin" ]]; then
  if command -v soffice >/dev/null 2>&1; then soffice_bin="$(command -v soffice)"
  elif [[ -x "/Applications/LibreOffice.app/Contents/MacOS/soffice" ]]; then soffice_bin="/Applications/LibreOffice.app/Contents/MacOS/soffice"
  else echo "LibreOffice soffice is required for macOS/Linux rendering. Set SOFFICE_BIN if needed." >&2; exit 1; fi
fi
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
"$soffice_bin" --headless --convert-to pdf --outdir "$tmp" "$pptx" >/dev/null
pdf="$tmp/$(basename "${pptx%.*}").pdf"
[[ -f "$pdf" ]] || { echo "LibreOffice did not produce a PDF." >&2; exit 1; }
if command -v pdftoppm >/dev/null 2>&1; then
  pdftoppm -png -r 150 "$pdf" "$output/slide" >/dev/null
  echo "Rendered PNG pages in $output"
else
  cp "$pdf" "$output/render.pdf"
  echo "Created $output/render.pdf. Install Poppler (pdftoppm) for PNG pages."
fi
