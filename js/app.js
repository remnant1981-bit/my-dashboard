/* SMG Corporate Site — common runtime */
(function () {
  'use strict';

  /* ---------- Data ---------- */
  const DRAFT_KEY = 'smg_draft_v1';
  const INQ_KEY = 'smg_inquiries_v1';
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  const params = new URLSearchParams(location.search);
  let preview = false;
  try { preview = params.get('preview') === '1' || sessionStorage.getItem('smg_preview') === '1'; } catch (e) {}
  let D = window.SMG_DEFAULT_DATA;
  if (preview) {
    const d = safeGet(DRAFT_KEY);
    if (d) { try { const x = JSON.parse(d); if ((x.version || 1) >= (D.version || 1)) D = x; } catch (e) {} }
  }
  window.SMG = { data: D, DRAFT_KEY, INQ_KEY, safeGet, safeSet };

  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const telHref = (t) => 'tel:' + String(t || '').replace(/[^0-9+]/g, '');
  const I = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowUR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M7 17L17 7M8 7h9v9"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
  };
  window.SMG.I = I; window.SMG.esc = esc;

  const NAV = [
    { href: 'about.html', label: '회사소개', sub: [['about.html#overview', '기업개요'], ['about.html#history', '연혁'], ['about.html#partners', '글로벌 파트너'], ['about.html#cert', '인증현황'], ['about.html#location', '오시는 길']] },
    { href: 'products.html', label: '제품소개', sub: D.categories.map((c) => ['products.html?cat=' + c.id, c.name]) },
    { href: 'applications.html', label: '적용분야', sub: [['applications.html#industries', '산업별 솔루션']] },
    { href: 'support.html', label: '고객지원', sub: [['support.html#news', '공지사항'], ['support.html#downloads', '자료실'], ['support.html#faq', 'FAQ']] },
    { href: 'contact.html', label: '견적문의', sub: [] }
  ];

  function logo() {
    return `<a class="logo" href="index.html" aria-label="${esc(D.company.name)} 홈"><span class="logo-mark">${esc(D.company.brand)}<sup>®</sup></span><span class="logo-txt"><b>${esc(D.company.name.replace('주식회사 ', ''))}</b><small>${esc(D.company.brandSub)}</small></span></a>`;
  }

  /* ---------- Header / Footer ---------- */
  function renderChrome() {
    const page = document.body.dataset.page;
    const cur = location.pathname.split('/').pop() || 'index.html';
    const hdr = document.createElement('header');
    hdr.className = 'hdr' + (page === 'home' ? '' : ' light');
    hdr.innerHTML = `<div class="container">${logo()}
      <nav aria-label="주 메뉴"><ul class="gnb">${NAV.map((n) => `<li><a href="${n.href}" class="${cur === n.href ? 'on' : ''}">${n.label}</a>${n.sub.length ? `<div class="sub">${n.sub.map((s) => `<a href="${s[0]}">${esc(s[1])}</a>`).join('')}</div>` : ''}</li>`).join('')}</ul></nav>
      <div class="hdr-util"><a class="hdr-tel" href="${telHref(D.company.tel)}">${I.phone}${esc(D.company.tel)}</a>
      <a class="btn btn-primary btn-sm" href="contact.html">견적 문의</a>
      <button class="hamb" aria-label="메뉴 열기" aria-expanded="false"><span></span></button></div></div>`;
    document.body.prepend(hdr);
    const skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = '본문 바로가기';
    document.body.prepend(skip);

    const m = document.createElement('div');
    m.className = 'mnav'; m.setAttribute('aria-hidden', 'true');
    m.innerHTML = `<div class="mnav-top">${logo()}<button class="mnav-close" aria-label="메뉴 닫기">×</button></div>
      ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>${n.sub.length ? `<div class="msub">${n.sub.map((s) => `<a href="${s[0]}">${esc(s[1])}</a>`).join('')}</div>` : ''}`).join('')}
      <div style="margin-top:auto;padding-top:28px"><a class="btn btn-primary" style="width:100%;justify-content:center;border:0;font-size:16px" href="${telHref(D.company.tel)}">${I.phone} ${esc(D.company.tel)}</a></div>`;
    document.body.appendChild(m);
    const hb = $('.hamb', hdr);
    const toggle = (o) => { m.classList.toggle('open', o); hb.setAttribute('aria-expanded', o); m.setAttribute('aria-hidden', !o); document.body.style.overflow = o ? 'hidden' : ''; };
    hb.onclick = () => toggle(true);
    $('.mnav-close', m).onclick = () => toggle(false);
    $$('a', m).forEach((a) => a.addEventListener('click', () => toggle(false)));

    if (page === 'home') {
      const onS = () => hdr.classList.toggle('solid', scrollY > 40);
      addEventListener('scroll', onS, { passive: true }); onS();
    }

    const c = D.company;
    const f = document.createElement('footer');
    f.className = 'ftr';
    f.innerHTML = `<div class="container"><div class="ftr-top">
      <div>${logo()}<p style="max-width:340px">${esc(D.about.title)}<br>1990년 설립 이래 온도센서·히터·피드스루 전문 제조기업</p></div>
      <div><h5>제품</h5><ul>${D.categories.map((x) => `<li><a href="products.html?cat=${x.id}">${esc(x.name)}</a></li>`).join('')}</ul></div>
      <div><h5>회사</h5><ul><li><a href="about.html">회사소개</a></li><li><a href="about.html#history">연혁</a></li><li><a href="applications.html">적용분야</a></li><li><a href="support.html#news">공지사항</a></li><li><a href="support.html#downloads">자료실</a></li></ul></div>
      <div><h5>고객센터</h5><ul><li><a href="${telHref(c.tel)}" style="font-size:22px;font-weight:800;color:#fff">${esc(c.tel)}</a></li><li>FAX ${esc(c.fax)}</li><li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li><li>${esc(c.hours)}</li></ul></div>
      </div><div class="ftr-bot"><address><span>${esc(c.name)}</span>${c.ceo ? `<span>대표 ${esc(c.ceo)}</span>` : ''}${c.bizNo ? `<span>사업자등록번호 ${esc(c.bizNo)}</span>` : ''}<br><span>${esc(c.address)}</span><span>TEL ${esc(c.tel)}</span><span>FAX ${esc(c.fax)}</span></address>
      <div><a href="privacy.html">개인정보처리방침</a> · <a href="admin.html" rel="nofollow">관리자</a><br>© ${new Date().getFullYear()} ${esc(c.nameEn)} All rights reserved.</div></div></div>`;
    document.body.appendChild(f);

    const fab = document.createElement('div');
    fab.className = 'fab';
    fab.innerHTML = `<a class="q" href="contact.html" aria-label="견적 문의">${I.mail}</a><button class="top" aria-label="맨 위로">${I.up}</button>`;
    document.body.appendChild(fab);
    const top = $('.top', fab);
    top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
    addEventListener('scroll', () => top.classList.toggle('show', scrollY > 600), { passive: true });

    if (preview) {
      const b = document.createElement('div');
      b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:500;background:#f59e0b;color:#111;text-align:center;padding:8px;font-weight:700;font-size:14px';
      b.innerHTML = '미리보기 모드 — 관리자 임시저장 내용 표시 중 · <a href="#" style="text-decoration:underline">미리보기 종료</a>';
      b.querySelector('a').onclick = (e) => { e.preventDefault(); try { sessionStorage.removeItem('smg_preview'); } catch (x) {} location.href = location.pathname; };
      document.body.appendChild(b);
    }
  }

  /* ---------- Shared components ---------- */
  function prodCard(p) {
    const cat = D.categories.find((c) => c.id === p.category);
    return `<a class="prod-card" href="product.html?id=${encodeURIComponent(p.id)}">${p.certs && p.certs.length ? '<span class="chip">방폭/선급 인증</span>' : ''}
      <div class="img"><img src="${esc(p.images[0])}" alt="${esc(p.code + ' ' + p.name)}" loading="lazy"></div>
      <div class="body"><span class="tag" style="color:${esc(cat && cat.color || '')}">${esc(cat ? cat.nameEn : '')}</span><h3>${esc(p.code)}</h3><div class="en">${esc(p.nameKo)} · ${esc(p.name)}</div><p>${esc(p.summary)}</p><span class="more">자세히 보기 ${I.arrow}</span></div></a>`;
  }
  window.SMG.prodCard = prodCard;

  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
  }
  window.SMG.toast = toast;

  function lightbox(src) {
    const m = document.createElement('div');
    m.className = 'modal open lightbox';
    m.innerHTML = `<img src="${esc(src)}" alt="">`;
    m.onclick = () => m.remove();
    document.body.appendChild(m);
  }

  function reveal() {
    const els = $$('.rv');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  function countUp() {
    $$('[data-count]').forEach((el) => {
      const end = parseInt(el.dataset.count, 10); if (isNaN(end)) return;
      const io = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io.disconnect();
        const st = performance.now(), dur = 1400, from = end > 1000 ? end - 40 : 0;
        const step = (t) => { const k = Math.min(1, (t - st) / dur); el.firstChild.nodeValue = Math.round(from + (end - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step); });
      io.observe(el);
    });
  }

  function newsList(items) {
    const sorted = items.slice().sort((a, b) => (b.pinned - a.pinned) || String(b.date).localeCompare(a.date));
    return `<div class="news-list">${sorted.map((n) => `<div class="news-row" tabindex="0" role="button" aria-expanded="false"><time>${esc(n.date)}</time><span class="chip">${esc(n.category)}</span><b>${n.pinned ? '<span class="pin">●</span>' : ''}${esc(n.title)}</b>${I.arrow}</div><div class="news-body">${esc(n.body)}</div>`).join('')}</div>`;
  }
  function bindNews(root) {
    $$('.news-row', root).forEach((r) => {
      const t = () => { r.classList.toggle('open'); r.setAttribute('aria-expanded', r.classList.contains('open')); };
      r.onclick = t; r.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } };
    });
  }

  /* ---------- Pages ---------- */
  const P = {};

  P.home = function () {
    const h = D.hero;
    $('#hero').innerHTML = `<div class="hero-bg" style="background-image:url('${esc(h.image)}')"></div><div class="grid-lines"></div>
      <div class="container"><span class="eyebrow">${esc(h.eyebrow)}</span><h1>${esc(h.title)}</h1><p class="lead">${esc(h.subtitle)}</p>
      <div class="hero-cta"><a class="btn btn-primary" href="products.html">${esc(h.ctaPrimary)} ${I.arrow}</a><a class="btn btn-ghost" href="contact.html">${esc(h.ctaSecondary)}</a><a class="btn btn-ghost" href="${esc(D.settings.catalogPdf)}" download>${I.dl} 카탈로그 PDF</a></div>
      <div class="hero-stats">${D.stats.map((s) => `<div><b data-count="${esc(s.value)}">${esc(s.value)}<em>${esc(s.suffix)}</em></b><span>${esc(s.label)}</span></div>`).join('')}</div></div>
      <div class="scroll-ind">SCROLL</div>`;
    $('#cats').innerHTML = D.categories.map((c, i) => `<a class="cat-card rv" href="products.html?cat=${c.id}" style="transition-delay:${i * 60}ms;--cc:${esc(c.color || '#e1251b')}"><span class="arrow">${I.arrowUR}</span><div class="img"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy"></div><div class="body"><span class="no">0${i + 1} — 제품 ${D.products.filter((p) => p.category === c.id).length}종</span><h3><small>${esc(c.nameEn)}</small>${esc(c.name)}</h3><p>${esc(c.desc)}</p></div></a>`).join('');
    const a = D.about;
    $('#about').innerHTML = `<div class="media rv"><img src="${esc(a.image)}" alt="에스엠지 사옥" loading="lazy"><div class="badge"><b>${new Date().getFullYear() - D.company.founded}+</b><span>Years of Manufacturing</span></div></div>
      <div class="prose rv"><span class="eyebrow">About SMG</span><h2 class="sec-title">${esc(a.title)}</h2>${a.body.slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="values">${a.values.map((v) => `<div><b>${esc(v.title)}</b><span>${esc(v.desc)}</span></div>`).join('')}</div>
      <a class="btn btn-dark" style="margin-top:32px" href="about.html">회사소개 자세히 ${I.arrow}</a></div>`;
    $('#industries').innerHTML = D.industries.map((x, i) => `<a class="ind rv" href="applications.html" style="transition-delay:${i * 60}ms"><img src="${esc(x.image)}" alt="" loading="lazy"><div><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></div></a>`).join('');
    const feat = D.products.filter((p) => p.featured).slice(0, 4);
    $('#featured').innerHTML = (feat.length ? feat : D.products.slice(0, 4)).map(prodCard).join('');
    $('#certs').innerHTML = D.certifications.map((c) => `<div><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></div>`).join('');
    $('#partners').innerHTML = `<div class="marq-track">${[...D.partners, ...D.partners, ...D.partners, ...D.partners].map((p) => `<span>${esc(p)}</span>`).join('')}</div>`;
    $('#news').innerHTML = newsList(D.news.slice(0, 4)); bindNews($('#news'));
    if (D.settings.showPopup && D.settings.popupTitle) {
      let hide = false; try { hide = localStorage.getItem('smg_popup_hide') === new Date().toISOString().slice(0, 10); } catch (e) {}
      if (!hide) {
        const m = document.createElement('div'); m.className = 'modal open';
        m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" aria-label="닫기">×</button><span class="chip">NOTICE</span><h3 style="margin-top:12px">${esc(D.settings.popupTitle)}</h3><p style="color:var(--muted);white-space:pre-line">${esc(D.settings.popupBody)}</p><div style="display:flex;justify-content:space-between;margin-top:24px;align-items:center"><label style="font-size:14px;color:var(--muted)"><input type="checkbox" id="pp-today"> 오늘 하루 보지 않기</label><button class="btn btn-dark btn-sm" id="pp-close">닫기</button></div></div>`;
        document.body.appendChild(m);
        const close = () => { if ($('#pp-today').checked) safeSet('smg_popup_hide', new Date().toISOString().slice(0, 10)); m.remove(); };
        $('#pp-close').onclick = close; $('.modal-x', m).onclick = close;
      }
    }
  };

  P.products = function () {
    let cat = params.get('cat') || 'all';
    let q = params.get('q') || '';
    const side = $('#pl-side'), grid = $('#pl-grid'), cnt = $('#pl-count'), inp = $('#pl-q');
    inp.value = q;
    const cats = [{ id: 'all', name: '전체 제품' }, ...D.categories];
    function draw() {
      side.innerHTML = '<h4>CATEGORY</h4>' + cats.map((c) => `<button data-c="${c.id}" class="${cat === c.id ? 'on' : ''}">${esc(c.name)} <span>${c.id === 'all' ? D.products.length : D.products.filter((p) => p.category === c.id).length}</span></button>`).join('');
      const k = q.trim().toLowerCase();
      const list = D.products.filter((p) => (cat === 'all' || p.category === cat) && (!k || [p.code, p.name, p.nameKo, p.summary, p.applications, p.installation, (p.features || []).join(' '), (p.certs || []).join(' ')].join(' ').toLowerCase().includes(k)));
      cnt.innerHTML = `총 <em>${list.length}</em>개 제품`;
      grid.innerHTML = list.length ? list.map(prodCard).join('') : `<div class="empty" style="grid-column:1/-1">검색 결과가 없습니다.<br><a href="contact.html" style="color:var(--red);font-weight:700">찾는 제품을 문의해 주세요 →</a></div>`;
      const cur = D.categories.find((c) => c.id === cat);
      $('#pl-title').textContent = cur ? cur.name : '제품소개';
      $('#pl-desc').textContent = cur ? cur.desc : '온도센서 · 써모웰 · 히터 · 압력 트랜스미터 · 케이블 부싱 · 피드스루 전 제품 라인업';
      $$('button', side).forEach((b) => (b.onclick = () => { cat = b.dataset.c; sync(); draw(); }));
    }
    function sync() { const u = new URLSearchParams(); if (cat !== 'all') u.set('cat', cat); if (q) u.set('q', q); history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : '')); }
    let tm; inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { q = inp.value; sync(); draw(); }, 150); };
    draw();
  };

  P.product = function () {
    const p = D.products.find((x) => x.id === params.get('id')) || D.products[0];
    const cat = D.categories.find((c) => c.id === p.category) || {};
    document.title = `${p.code} ${p.name} | ${D.company.name}`;
    const md = document.querySelector('meta[name=description]'); if (md) md.content = p.summary;
    $('#crumb').innerHTML = `<a href="index.html">HOME</a>/<a href="products.html">제품소개</a>/<a href="products.html?cat=${cat.id}">${esc(cat.name)}</a>`;
    $('#pd-cat').textContent = cat.nameEn || '';
    $('#pd-title').textContent = p.nameKo;
    $('#pd').innerHTML = `<div class="pd-gal"><div class="pd-main" id="pd-main" title="클릭하여 확대"><img src="${esc(p.images[0])}" alt="${esc(p.code)}"></div>
      ${p.images.length > 1 ? `<div class="pd-thumbs">${p.images.map((im, i) => `<button class="${i ? '' : 'on'}" data-src="${esc(im)}" aria-label="이미지 ${i + 1}"><img src="${esc(im)}" alt=""></button>`).join('')}</div>` : ''}</div>
      <div class="pd-info"><span class="chip" style="background:color-mix(in srgb,${esc(cat.color || '#e1251b')} 12%,#fff);color:${esc(cat.color || '#e1251b')}">${esc(cat.name || '')}</span><div class="code" style="margin-top:14px">${esc(p.code)}</div><div class="nm">${esc(p.nameKo)}</div><div class="en">${esc(p.name)}</div>
      <p class="sum">${esc(p.summary)}</p>
      ${p.features && p.features.length ? `<div class="pd-block"><h3>Features</h3><ul class="checks">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
      ${p.applications ? `<div class="pd-block"><h3>Application</h3><p>${esc(p.applications)}</p></div>` : ''}
      ${p.installation ? `<div class="pd-block"><h3>Installation</h3><p>${esc(p.installation)}</p></div>` : ''}
      ${p.notice ? `<div class="pd-block"><h3>Notice</h3><p class="notice">${esc(p.notice)}</p></div>` : ''}
      ${p.specs && p.specs.length ? `<div class="pd-block"><h3>Specification</h3><table class="spec">${p.specs.map((s) => `<tr><th>${esc(s[0])}</th><td>${esc(s[1])}</td></tr>`).join('')}</table></div>` : ''}
      ${p.certs && p.certs.length ? `<div class="pd-block"><h3>Certification</h3><div class="cert-tags">${p.certs.map((c) => `<span>${esc(c)}</span>`).join('')}</div></div>` : ''}
      ${p.orderCode ? `<div class="pd-block"><h3>Sample Ordering Code</h3><div class="code-box"><span>${esc(p.orderCode)}</span><button id="cp">복사</button></div><p style="font-size:13.5px;color:var(--muted);margin-top:8px">세부 Ordering Code 표는 카탈로그 PDF를 참고하세요. 현장 공정에 맞춘 주문 제작이 가능합니다.</p></div>` : ''}
      <div class="pd-actions"><a class="btn btn-primary" href="contact.html?product=${encodeURIComponent(p.code + ' ' + p.name)}">이 제품 견적 문의 ${I.arrow}</a><a class="btn btn-line" href="${esc(D.settings.catalogPdf)}" download>${I.dl} 카탈로그</a><a class="btn btn-line" href="${telHref(D.company.tel)}">${I.phone} 전화 상담</a></div></div>`;
    const main = $('#pd-main img');
    $$('.pd-thumbs button').forEach((b) => (b.onclick = () => { main.src = b.dataset.src; $$('.pd-thumbs button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }));
    $('#pd-main').onclick = () => lightbox(main.src);
    const cp = $('#cp'); if (cp) cp.onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(p.orderCode) : Promise.reject()).then(() => toast('Ordering Code 복사됨'), () => toast(p.orderCode)); };
    const rel = D.products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    $('#related').innerHTML = rel.length ? `<div class="sec-head"><div><span class="eyebrow">Related</span><h2 class="sec-title" style="font-size:32px">같은 카테고리 제품</h2></div></div><div class="prod-grid">${rel.map(prodCard).join('')}</div>` : '';
    // JSON-LD
    const ld = document.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.code + ' ' + p.name, description: p.summary, image: p.images, brand: { '@type': 'Brand', name: 'SMG' }, manufacturer: { '@type': 'Organization', name: D.company.nameEn } });
    document.head.appendChild(ld);
  };

  P.about = function () {
    const a = D.about;
    $('#overview').innerHTML = `<div class="split"><div class="media rv"><img src="${esc(a.image)}" alt="사옥" loading="lazy"><div class="badge"><b>Since ${D.company.founded}</b><span>${esc(D.company.nameEn)}</span></div></div>
      <div class="prose rv"><span class="eyebrow">CEO Message</span><h2 class="sec-title">${esc(a.title)}</h2>${a.body.map((p) => `<p>${esc(p)}</p>`).join('')}<p style="color:var(--text);font-weight:700;margin-top:24px">앞으로도 에스엠지에 변함없는 애정과 성원을 부탁드립니다.</p></div></div>
      <div class="values v4">${a.values.map((v) => `<div class="rv"><b>${esc(v.title)}</b><span>${esc(v.desc)}</span></div>`).join('')}</div>`;
    const c = D.company;
    $('#info').innerHTML = `<table class="spec"><tr><th>회사명</th><td>${esc(c.name)} (${esc(c.nameEn)})</td></tr><tr><th>설립</th><td>${c.founded}년 (성실전자)</td></tr>${c.ceo ? `<tr><th>대표이사</th><td>${esc(c.ceo)}</td></tr>` : ''}<tr><th>주요제품</th><td>온도센서(RTD/TC·멀티 써모커플), 써모웰, 히터(마이카·필름·메탈 척/플레이트), 압력 트랜스미터, 케이블 부싱, 피드스루(ShieldLoc)</td></tr><tr><th>인증</th><td>ISO 9001, ISO 14001, ATEX, IECEx, KCs·KGS, KTL, BV, UL, ASME PTC 19.3</td></tr><tr><th>본사</th><td>${esc(c.address)}</td></tr><tr><th>연락처</th><td>TEL ${esc(c.tel)} · FAX ${esc(c.fax)} · ${esc(c.email)}</td></tr></table>`;
    let lastDec = '';
    $('#history-list').innerHTML = D.history.map((h) => { const dec = String(h.year).slice(0, 3) + "0's"; const d = dec !== lastDec ? `<div class="decade">${dec}</div>` : ''; lastDec = dec; return d + `<div class="hv rv"><b>${esc(h.year)}</b><ul>${h.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`; }).join('');
    const pc = $('#partner-list'); if (pc) pc.innerHTML = (D.partnerCards || []).map((x) => `<div class="pcard rv"><div class="pimg"><img src="${esc(x.image)}" alt="${esc(x.title)}" loading="lazy"></div><div class="pbody"><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></div></div>`).join('');
    $('#cert-list').innerHTML = D.certifications.map((c) => `<div><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></div>`).join('');
    renderMap($('#map'));
    $('#loc-info').innerHTML = `<b style="font-size:18px">${esc(c.address)}</b><p style="color:var(--muted)">${esc(c.addressEn)}</p><p style="margin-top:8px">TEL <a href="${telHref(c.tel)}">${esc(c.tel)}</a> · FAX ${esc(c.fax)} · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`;
  };

  function renderMap(el) {
    if (!el) return;
    const q = encodeURIComponent(D.company.mapQuery || D.company.address);
    el.innerHTML = `<iframe title="오시는 길 지도" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${q}&z=16&output=embed"></iframe>`;
  }

  P.applications = function () {
    $('#ind-list').innerHTML = D.industries.map((x) => `<div class="ind rv"><img src="${esc(x.image)}" alt="" loading="lazy"><div><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></div></div>`).join('');
    const dsec = $('#defense'); if (dsec && !(D.defense || []).length) { dsec.remove(); return; }
    $('#def-list').innerHTML = D.defense.map((x) => `<div class="ind rv" style="aspect-ratio:16/11"><img src="${esc(x.image)}" alt="" loading="lazy"><div><span style="color:#ff8a82;font-weight:700;font-size:12px;letter-spacing:.1em">적용처</span><b>${esc(x.title)}</b></div></div>`).join('');
  };

  P.support = function () {
    $('#news-list').innerHTML = newsList(D.news); bindNews($('#news-list'));
    $('#dl-list').innerHTML = D.downloads.map((d) => `<div class="dl-item"><div class="ic">${esc(d.type)}</div><div><b>${esc(d.title)}</b><span>${esc(d.desc)}</span></div><a class="btn btn-dark btn-sm" href="${esc(d.file)}" download>${I.dl} 다운로드</a></div>`).join('');
    $('#faq-list').innerHTML = D.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  };

  P.contact = function () {
    const c = D.company;
    $('#contact-card').innerHTML = `<span class="eyebrow" style="color:#ff8a82">Contact</span><h3 style="margin-top:12px">기술 상담부터 견적까지<br>전문 엔지니어가 답변드립니다</h3>
      <dl><dt>TEL</dt><dd><a href="${telHref(c.tel)}">${esc(c.tel)}</a></dd><dt>FAX</dt><dd>${esc(c.fax)}</dd><dt>E-MAIL</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd><dt>HOURS</dt><dd>${esc(c.hours)}</dd><dt>ADDRESS</dt><dd style="font-size:15px">${esc(c.address)}</dd></dl>`;
    const sel = $('#f-type'); sel.innerHTML = D.inquiryTypes.map((t) => `<option>${esc(t)}</option>`).join('');
    const pSel = $('#f-product');
    pSel.innerHTML = '<option value="">선택 안 함</option>' + D.categories.map((cat) => `<optgroup label="${esc(cat.name)}">${D.products.filter((p) => p.category === cat.id).map((p) => `<option>${esc(p.code + ' ' + p.name)}</option>`).join('')}</optgroup>`).join('');
    const pre = params.get('product'); if (pre) { if (![...pSel.options].some((o) => o.value === pre)) pSel.add(new Option(pre, pre)); pSel.value = pre; }
    renderMap($('#map'));
    const form = $('#inq-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.website && form.website.value) return; // honeypot
      let ok = true;
      $$('[data-req]', form).forEach((inp) => {
        const f = inp.closest('.field') || inp.closest('.agree');
        let bad = inp.type === 'checkbox' ? !inp.checked : !inp.value.trim();
        if (!bad && inp.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim());
        if (!bad && inp.name === 'phone') bad = !/^[0-9+\-\s()]{8,20}$/.test(inp.value.trim());
        if (f) f.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { toast('필수 항목을 확인해 주세요'); const first = $('.invalid input, .invalid textarea, .invalid select', form); if (first) first.focus(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.website; delete data.agree;
      const rec = Object.assign({ id: 'q' + Date.now(), createdAt: new Date().toISOString(), status: '신규' }, data);
      const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = '전송 중...';
      let sent = false;
      const ep = (D.settings.formEndpoint || '').trim();
      if (ep) {
        try {
          const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _subject: `[홈페이지 문의] ${data.type} - ${data.company}` }, data)) });
          sent = r.ok;
        } catch (err) { sent = false; }
      }
      try { const arr = JSON.parse(safeGet(INQ_KEY) || '[]'); arr.unshift(rec); safeSet(INQ_KEY, JSON.stringify(arr.slice(0, 500))); } catch (err) {}
      btn.disabled = false; btn.innerHTML = '문의 접수하기 ' + I.arrow;
      if (sent) {
        form.reset(); showDone('문의가 정상 접수되었습니다', '담당자가 확인 후 영업일 기준 1~2일 내 회신드리겠습니다.');
      } else {
        const body = `[문의유형] ${data.type}\n[관심제품] ${data.product || '-'}\n[회사명] ${data.company}\n[담당자] ${data.name}\n[연락처] ${data.phone}\n[이메일] ${data.email}\n\n${data.message}`;
        location.href = `mailto:${D.settings.notifyEmail || c.email}?subject=${encodeURIComponent('[홈페이지 문의] ' + data.type + ' - ' + data.company)}&body=${encodeURIComponent(body)}`;
        showDone('메일 앱으로 문의 내용을 전달합니다', `메일 앱이 열리지 않으면 ${c.email} 또는 ${c.tel}로 연락 주세요.`);
      }
    });
    function showDone(t, d) {
      const m = document.createElement('div'); m.className = 'modal open';
      m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" style="text-align:center"><div style="width:64px;height:64px;border-radius:50%;background:var(--red-soft);color:var(--red);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px">✓</div><h3>${esc(t)}</h3><p style="color:var(--muted)">${esc(d)}</p><button class="btn btn-dark" style="margin-top:24px">확인</button></div>`;
      document.body.appendChild(m); $('button', m).onclick = () => m.remove();
    }
  };

  P.privacy = function () {
    $$('[data-co]').forEach((el) => (el.textContent = D.company[el.dataset.co] || ''));
  };

  /* ---------- Boot ---------- */
  function boot() {
    renderChrome();
    const pg = document.body.dataset.page;
    if (P[pg]) P[pg]();
    reveal(); countUp();
    if (D.settings.gaId && /^G-[A-Z0-9]+$/.test(D.settings.gaId)) {
      const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + D.settings.gaId; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', D.settings.gaId);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
