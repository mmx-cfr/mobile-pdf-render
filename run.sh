#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://www.cfr.org/reports/leapfrogging-chinas-critical-minerals-dominance}"
OUT="${2:-cfr-mobile.pdf}"

# Install deps (first run only)
if [ ! -d "node_modules" ]; then
  npm install
  npx playwright install chromium
fi

node make-mobile-pdf.mjs "$URL" "$OUT"
echo "Done. Output: $OUT"
