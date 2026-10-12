// 웹 소스(../)를 app/ 으로 복사하고 CDN 라이브러리를 로컬 vendor/ 로 대체 → 완전 오프라인 동작
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', 'app');
const NM = path.join(__dirname, '..', 'node_modules');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'vendor'), { recursive: true });

for (const f of ['index.html', 'bom.html', 'css', 'js']) {
  fs.cpSync(path.join(ROOT, f), path.join(OUT, f), { recursive: true });
}

const vendor = {
  pdfjs: ['pdfjs-dist/build/pdf.min.js', 'pdf.min.js'],
  pdfWorker: ['pdfjs-dist/build/pdf.worker.min.js', 'pdf.worker.min.js'],
  xlsx: ['xlsx/dist/xlsx.full.min.js', 'xlsx.full.min.js']
};
const libs = {};
for (const [key, [src, name]] of Object.entries(vendor)) {
  fs.copyFileSync(path.join(NM, src), path.join(OUT, 'vendor', name));
  libs[key] = 'vendor/' + name;
}

const bomHtml = path.join(OUT, 'bom.html');
const html = fs.readFileSync(bomHtml, 'utf8').replace(
  '<script src="js/bom.js"></script>',
  `<script>window.BOM_LIBS = ${JSON.stringify(libs)};</script>\n  <script src="js/bom.js"></script>`
);
fs.writeFileSync(bomHtml, html);
console.log('app/ 준비 완료:', Object.values(libs).join(', '));
