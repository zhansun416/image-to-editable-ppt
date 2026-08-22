#!/usr/bin/env bash
set -euo pipefail

skill_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$skill_root/scripts/setup-dependencies.mjs" "$@"
