#!/usr/bin/env node
/* 제품별 정적 페이지 생성기 (검색엔진·링크 미리보기용)
 *
 * 실행: node tools/build_product_pages.js      (저장소 루트에서)
 * 순서: (국문 HTML 수정 시) python3 tools/build_en_pages.py . → (새 제품·대표사진 변경 시) python3 tools/build_og_images.py → node tools/build_product_pages.js
 *
 * 생성물: product/<id>.html (국문), en/product/<id>.html (영문), sitemap.xml 제품 항목
 * - 제목·설명·OG 이미지·canonical·hreflang·구조화데이터·본문 요약이 HTML에 직접 들어감
 * - 방문자 화면은 기존처럼 js/app.js가 최신 데이터로 다시 그림 (body data-pid 사용)
 * - 관리자 화면에서 제품을 추가·수정한 뒤에는 이 스크립트를 다시 실행해야 검색 정보가 갱신됨
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.sungsil.com/';
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(read('data/site-data.js'), ctx);
vm.runInContext(read('data/site-data-en.js'), ctx);
const KO = ctx.window.SMG_DEFAULT_DATA, EN = ctx.window.SMG_DATA_EN;

const LANGS = [
  { lang: 'ko', D: KO, tpl: read('product.html'), dir: 'product/', base: '../', name: (p) => p.nameKo || p.name, catName: (c) => c.name, h: { feat: '주요 특징', app: '적용 분야', spec: '사양', cert: '인증', quote: '이 제품 견적 문의', back: '전체 제품 보기' } },
  { lang: 'en', D: EN, tpl: read('en/product.html'), dir: 'en/product/', base: '../../', name: (p) => p.name, catName: (c) => c.nameEn || c.name, h: { feat: 'Features', app: 'Applications', spec: 'Specification', cert: 'Certification', quote: 'Request a quote', back: 'All products' } },
];

function page(L, p) {
  const D = L.D, cat = D.categories.find((c) => c.id === p.category) || {};
  const nm = L.name(p), company = D.company.name || 'SMG';
  const title = `${p.code} ${nm} | ${company}`;
  const desc = clip(`${p.code} ${nm} — ${p.summary}`, 155);
  const koUrl = `${SITE}product/${p.id}.html`, enUrl = `${SITE}en/product/${p.id}.html`, url = L.lang === 'ko' ? koUrl : enUrl;
  // 링크 미리보기용 JPG(1200×630, assets/og/<id>.jpg) 우선 — 카카오톡 등은 WebP 미지원 가능
  const og = `assets/og/${p.id}.jpg`;
  const img = fs.existsSync(path.join(ROOT, og)) ? SITE + og : p.images && p.images[0] ? SITE + p.images[0] : SITE + 'assets/og-image.jpg';
  const pre = L.lang === 'ko' ? '' : 'en/';
  let s = L.tpl;
  // head: base + hreflang + canonical
  s = s.replace(/<base href="[^"]*">\n?/, '').replace(/<link rel="(alternate" hreflang="[^"]+|canonical)" href="[^"]*">\n?/g, '');
  s = s.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n<base href="${L.base}">\n<link rel="alternate" hreflang="ko" href="${koUrl}">\n<link rel="alternate" hreflang="en" href="${enUrl}">\n<link rel="alternate" hreflang="x-default" href="${koUrl}">\n<link rel="canonical" href="${url}">`);
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  s = s.replace(/(<meta name="description" content=")[^"]*/, (m, a) => a + esc(desc));
  s = s.replace(/(<meta property="og:title" content=")[^"]*/, (m, a) => a + esc(title));
  s = s.replace(/(<meta property="og:description" content=")[^"]*/, (m, a) => a + esc(desc));
  s = s.replace(/(<meta property="og:image" content=")[^"]*/, (m, a) => a + esc(img));
  s = s.replace(/<meta property="og:type" content="website">/, `<meta property="og:type" content="website">\n<meta property="og:url" content="${url}">`);
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: `${p.code} ${nm}`, description: p.summary, image: (p.images || []).map((x) => SITE + x), sku: p.code, category: L.catName(cat), url, brand: { '@type': 'Brand', name: 'SMG' }, manufacturer: { '@type': 'Organization', name: D.company.nameEn || 'SMG Co., Ltd.', url: SITE } };
  s = s.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n</head>`);
  // body: product id + static snapshot (app.js replaces it with the live render)
  s = s.replace('<body data-page="product">', `<body data-page="product" data-pid="${esc(p.id)}">`);
  s = s.replace('<span class="eyebrow" id="pd-cat"></span><h1 id="pd-title"></h1>', `<span class="eyebrow" id="pd-cat">${esc(cat.nameEn || '')}</span><h1 id="pd-title">${esc(nm)}</h1>`);
  const block = (h, inner) => (inner ? `<div class="pd-block"><h3>${h}</h3>${inner}</div>` : '');
  const snap = `<div class="pd-gal"><div class="pd-main"><img src="${esc(p.images[0])}" alt="${esc(p.code + ' ' + nm)}"></div></div>
<div class="pd-info"><span class="chip">${esc(L.catName(cat))}</span><div class="code">${esc(p.code)}</div><h2>${esc(nm)}</h2><p class="sum">${esc(p.summary)}</p>
${block(L.h.feat, p.features && p.features.length ? `<ul class="checks">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '')}
${block(L.h.app, p.applications ? `<p>${esc(p.applications)}</p>` : '')}
${block(L.h.spec, p.specs && p.specs.length ? `<table class="spec">${p.specs.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table>` : '')}
${block(L.h.cert, p.certs && p.certs.length ? `<div class="cert-tags">${p.certs.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : '')}
<div class="pd-actions"><a class="btn btn-primary" href="${pre}contact.html?product=${encodeURIComponent(p.code + ' ' + p.name)}">${L.h.quote}</a> <a class="btn" href="${pre}products.html">${L.h.back}</a></div></div>`;
  s = s.replace('<div class="pd" id="pd"></div>', `<div class="pd" id="pd">${snap}</div>`);
  return s;
}

let n = 0;
const ids = new Set(KO.products.map((p) => p.id));
for (const L of LANGS) {
  // remove pages of products that no longer exist
  const dir = path.join(ROOT, L.dir);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith('.html') && !ids.has(f.slice(0, -5))) fs.unlinkSync(path.join(dir, f));
  for (const p of L.D.products) { if (!ids.has(p.id)) continue; write(L.dir + p.id + '.html', page(L, p)); n++; }
}

// sitemap: replace product entries
const today = new Date().toISOString().slice(0, 10);
let sm = read('sitemap.xml').replace(/\s*<url><loc>[^<]*(\/product\/|product\.html\?id=)[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
const alt = (id) => `<xhtml:link rel="alternate" hreflang="ko" href="${SITE}product/${id}.html"/><xhtml:link rel="alternate" hreflang="en" href="${SITE}en/product/${id}.html"/>`;
const rows = KO.products.map((p) => `  <url><loc>${SITE}product/${p.id}.html</loc><lastmod>${today}</lastmod>${alt(p.id)}</url>\n  <url><loc>${SITE}en/product/${p.id}.html</loc><lastmod>${today}</lastmod>${alt(p.id)}</url>`).join('\n');
sm = sm.replace('</urlset>', rows + '\n</urlset>');
write('sitemap.xml', sm);
console.log(`product pages: ${n}, sitemap urls: ${(sm.match(/<url>/g) || []).length}`);
