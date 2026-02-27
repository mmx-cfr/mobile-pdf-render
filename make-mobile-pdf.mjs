import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

const url=process.argv[2];
if(!url){console.error("Usage: node make-mobile-pdf.mjs <url> [out.pdf]");process.exit(1);}
const outPath=process.argv[3]||"mobile.pdf";

const viewport={width:590,height:764};

const PRINT_CSS=`
@media print {
  #page-content ~ * { display:none !important; }
  button[aria-label="Share this content"] { display:none !important; }
  [aria-label="Share this content"] { display:none !important; }
  .fixed.bottom-site-margin { display:none !important; }
  .fixed.top-0 { display:none !important; }
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
}`;

(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({
  viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true,
  userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
 });

 await page.goto(url,{waitUntil:"networkidle",timeout:90000});
 await page.addStyleTag({content:PRINT_CSS});

 await page.evaluate(async()=>{
  await new Promise(r=>setTimeout(r,500));
  const step=900;
  for(let i=0;i<80;i++){
    window.scrollBy(0,step);
    await new Promise(r=>setTimeout(r,150));
    if(window.scrollY+window.innerHeight>=document.body.scrollHeight-5) break;
  }
  window.scrollTo(0,0);
  await new Promise(r=>setTimeout(r,500));
 });

 const title=await page.title();


  

 const coverPage=await browser.newPage({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const coverUrl="file://"+path.resolve("./cover.html")+`?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;



 await page.evaluate((logoSvg) => {
  // 1) Remove footer(s)
  document.querySelectorAll("footer").forEach((f) => f.remove());

  // 2) Append centered logo at the very end of #page-content (fallback to body)
  const host = document.querySelector("#page-content") || document.body;

  const wrap = document.createElement("div");
  wrap.setAttribute("data-pdf-added-logo", "true");
  wrap.style.cssText = `
    display:flex;
    justify-content:center;
    align-items:center;
    padding:24px 0 8px;
    page-break-inside:avoid;
  `;

  // Keep logo at a sane size
  const logo = document.createElement("div");
  logo.style.cssText = "width:220px; max-width:70%;";
  logo.innerHTML = logoSvg;

  wrap.appendChild(logo);
  host.appendChild(wrap);
}, `
<svg viewBox="0 0 466 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M368.069 16.4279H375.224L377.019 21.006H380.472L371.75 0L362.973 21.006H366.245L368.069 16.4279ZM371.641 7.34676L374.075 13.5071H369.195L371.641 7.34676ZM67.321 8.37492C67.868 8.94353 79.9783 21.8134 79.9783 21.8134V1.29484H76.9252V13.9952C76.3847 13.4193 64.2764 0.551322 64.2764 0.551322V21.0041H67.321V8.37492ZM9.97795 18.4756C12.1147 18.4756 14.045 17.5612 15.5542 15.7416L17.3556 18.024C15.4733 20.2765 12.868 21.4458 9.57129 21.4458C3.97679 21.4458 0 17.3603 0 11.2439C0 5.41413 4.17758 1.04346 9.61803 1.04346C12.6546 1.04346 15.0471 2.01974 16.901 4.09269L14.8173 6.3166C13.293 4.70785 11.578 4.0182 9.58266 4.0182C5.99485 4.0182 3.32262 6.93776 3.32262 11.1475C3.32262 15.7576 6.16912 18.4756 9.97795 18.4756ZM142.835 11.1309C139.436 11.1309 136.965 14.2007 136.874 17.5792C136.823 19.5157 137.83 21.1684 140.354 21.1684C144.294 21.1684 146.375 17.506 146.445 14.7766C146.513 12.6465 145.229 11.1309 142.835 11.1309ZM142.906 18.4224C142.259 19.6707 141.515 20.3996 140.518 20.3996C139.601 20.3996 139.22 19.692 139.263 18.4217C139.343 16.0189 140.76 11.8691 142.9 11.8691C143.673 11.8691 144.186 12.4323 144.149 13.7272C144.115 14.9642 143.651 16.9906 142.906 18.4224ZM165.348 16.2697C165.348 15.439 164.94 14.8983 164.34 14.8983C163.82 14.8983 163.465 15.306 163.465 15.8174C163.465 16.1237 163.592 16.3251 163.727 16.5397C163.881 16.784 164.046 17.0454 164.046 17.498C164.044 17.8479 163.913 18.201 163.634 18.5355C163.234 18.9372 162.671 19.2298 161.004 19.2298H156.959C156.491 19.2298 156.36 19.0217 156.556 18.4337C156.756 17.8299 156.981 17.1904 157.198 16.5725C157.635 15.3302 158.041 14.1747 158.154 13.5702C158.38 12.3818 157.892 11.2812 156.461 11.2812C154.208 11.2812 152.74 13.3494 150.761 17.2779H150.647C150.647 17.2779 152.083 13.7425 152.083 12.578C152.083 11.7533 151.61 11.2965 150.761 11.2965C149.463 11.2965 148.134 12.7197 147.561 13.5077L147.96 13.9147C148.221 13.5702 148.617 13.1606 148.91 12.9218C149.427 12.4982 149.949 12.5654 149.794 13.4738C149.594 14.6483 148.084 18.8413 147.269 20.9795H149.621C152.036 15.8859 153.806 12.6066 155.215 12.6066C155.623 12.6066 155.836 12.8726 155.836 13.3268C155.836 13.8964 155.345 15.3126 154.848 16.743C154.548 17.6089 154.245 18.481 154.049 19.1725C153.743 20.2592 153.813 20.9795 154.719 20.9795H159.222C161.091 20.9795 162.593 20.0604 163.242 19.5709C164.534 18.6465 165.348 17.3803 165.348 16.2697ZM100.273 15.7822C98.7635 17.6005 96.9943 18.461 94.5795 18.461C90.6078 18.461 87.9242 15.7429 87.9242 11.1348C87.9242 6.92512 90.606 3.99226 94.1944 3.99226C96.189 3.99226 97.9047 4.68259 99.4277 6.29132L101.49 4.09601C99.6986 2.01243 97.2561 1.04346 94.2197 1.04346C88.6276 1.04346 84.5991 5.41413 84.5991 11.2433C84.5991 17.3603 88.4628 21.4458 94.1724 21.4458C97.6193 21.4458 100.192 20.3304 102.074 18.0772L100.273 15.7822ZM58.6881 15.3605C57.9659 18.7497 55.4167 21.2749 50.9978 21.2749C46.4901 21.2749 43.8835 18.7502 43.1453 15.3619C42.9995 14.6902 42.9262 13.7465 42.9262 12.8746V1.29484H46.0632V12.7795C46.0632 16.4087 47.9203 18.3047 51.0244 18.3047C54.0357 18.3047 55.7634 16.4685 55.7634 12.7795V1.29484H58.9017V12.8746C58.9017 13.7119 58.8302 14.6888 58.6881 15.3605ZM109.761 21.0048H106.51V1.29484H109.761V21.0048ZM126.754 18.1617H118.499V1.29484H115.241V21.0034H126.754V18.1617ZM29.1748 0.889165C23.5815 0.889165 19.3668 5.30174 19.3724 11.2193C19.3668 17.1356 23.4099 21.5495 29.1748 21.5495C34.9393 21.5495 38.9791 17.1356 38.9772 11.2193C38.9791 5.30174 34.7682 0.889165 29.1748 0.889165ZM22.6621 11.222C22.6621 6.81605 25.5788 3.81071 29.1748 3.81071C32.7709 3.81071 35.6862 6.81605 35.6862 11.222C35.6862 15.6299 32.9154 18.6373 29.1748 18.6373C25.4348 18.6373 22.6621 15.6299 22.6621 11.222Z" fill="currentColor"></path>
</svg>
`);

  
 await coverPage.goto(coverUrl,{waitUntil:"networkidle"});

 await coverPage.pdf({path:"cover.pdf",printBackground:true,width:`${viewport.width}px`,margin:{top:"20px",right:"20px",bottom:"20px",left:"20px"}});
 await page.pdf({path:"content.pdf",printBackground:true,width:`${viewport.width}px`,margin:{top:"20px",right:"20px",bottom:"20px",left:"20px"}});

 const merged=await PDFDocument.create();
 for(const f of ["cover.pdf","content.pdf"]){
  const bytes=fs.readFileSync(f);
  const doc=await PDFDocument.load(bytes);
  const pages=await merged.copyPages(doc,doc.getPageIndices());
  pages.forEach(p=>merged.addPage(p));
 }
 fs.writeFileSync(outPath,await merged.save());
 await browser.close();
 console.log("Saved:",outPath);
})();
