import { chromium } from "playwright";
import fs from "fs";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node make-mobile-pdf.mjs <url> [out.pdf]");
  process.exit(1);
}

const outPath = process.argv[3] || "mobile-view.pdf";

// iPhone 13-ish viewport
const viewport = { width: 390, height: 844 };

const extraCss = `
  /* Keep colors/backgrounds when printing */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  /* Optional: remove sticky UI that can repeat on every page.
     Uncomment if needed:
  header, [data-sticky], .sticky, .is-sticky, .site-header { position: static !important; }
  */
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });

  // Load page (networkidle helps ensure fonts/CSS load)
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });

  // Apply print-friendly tweaks (optional)
  await page.addStyleTag({ content: extraCss });

  // Trigger lazy-load content by scrolling
  await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const step = 900;
    const maxScrolls = 80; // safety cap
    for (let i = 0; i < maxScrolls; i++) {
      window.scrollBy(0, step);
      await new Promise((r) => setTimeout(r, 180));
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 5) break;
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 600));
  });

  // Multi-page PDF at mobile width
  await page.pdf({
    path: outPath,
    printBackground: true,
    preferCSSPageSize: true,
    width: `${viewport.width}px`,
    margin: { top: "16px", right: "16px", bottom: "16px", left: "16px" },
  });

  await browser.close();

  if (!fs.existsSync(outPath)) {
    console.error("PDF did not write. Check permissions.");
    process.exit(2);
  }

  console.log(`Saved: ${outPath}`);
})();
