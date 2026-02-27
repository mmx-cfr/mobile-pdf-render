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
