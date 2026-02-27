# Mobile PDF Generator (Playwright)

This folder generates a **multi-page PDF** of a webpage rendered in a **mobile viewport** (iPhone-ish), preserving CSS styles and web fonts as rendered by Chromium.

## Quick start

1) Install Node.js (18+ recommended)

2) In this folder:

```bash
npm install
npx playwright install chromium
```

3) Generate a PDF:

```bash
node make-mobile-pdf.mjs "https://www.cfr.org/reports/leapfrogging-chinas-critical-minerals-dominance" "cfr-mobile.pdf"
```

Or use the convenience script (Mac/Linux):

```bash
chmod +x run.sh
./run.sh
```

## Notes

- Fonts/styles are preserved **as long as the page can load them** in headless Chromium.
- If you see repeated sticky headers in the PDF, open `make-mobile-pdf.mjs` and uncomment the optional CSS block that disables sticky positioning.
- If the URL requires login, we can add cookie/session loading.

Generated on 2026-02-25.
