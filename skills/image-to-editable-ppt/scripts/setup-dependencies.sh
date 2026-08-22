#!/usr/bin/env bash
set -euo pipefail

with_ocr=false
with_inpaint=false
skip_node=false
for arg in "$@"; do
  case "$arg" in
    --with-ocr) with_ocr=true ;;
    --with-inpaint) with_inpaint=true ;;
    --skip-node) skip_node=true ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

skill_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runtime="$skill_root/runtime"
if [[ "$skip_node" == false ]]; then
  command -v npm >/dev/null || { echo "npm is required for core installation." >&2; exit 1; }
  npm install --prefix "$runtime" --omit=dev --ignore-scripts
fi
if [[ "$with_ocr" == true || "$with_inpaint" == true ]]; then
  command -v python3 >/dev/null || { echo "python3 is required for optional extras." >&2; exit 1; }
  [[ "$with_ocr" == true ]] && python3 -m pip install -r "$runtime/requirements-ocr.txt"
  [[ "$with_inpaint" == true ]] && python3 -m pip install -r "$runtime/requirements-inpaint.txt"
fi
printf 'runtime=%s\ncore_node_installed=%s\nocr_installed=%s\ninpaint_installed=%s\n' "$runtime" "$([[ "$skip_node" == false ]] && echo true || echo false)" "$with_ocr" "$with_inpaint"
