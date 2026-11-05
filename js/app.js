/* SMG Corporate Site — common runtime */
(function () {
  'use strict';

  /* ---------- Data ---------- */
  const EN = document.documentElement.lang === 'en';
  const t = (ko, en) => (EN ? en : ko);
  const L = (p) => (EN ? 'en/' : '') + p; // page links (en pages use <base href="../">)
  const DRAFT_KEY = EN ? 'smg_draft_en_v1' : 'smg_draft_v1';
  const INQ_KEY = 'smg_inquiries_v1';
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  const params = new URLSearchParams(location.search);
  let preview = false;
  try { preview = params.get('preview') === '1' || sessionStorage.getItem('smg_preview') === '1'; } catch (e) {}
  const KO_DATA = window.SMG_DEFAULT_DATA;
  let D = EN && window.SMG_DATA_EN ? window.SMG_DATA_EN : KO_DATA;
  if (preview) {
    const d = safeGet(DRAFT_KEY);
    if (d) { try { const x = JSON.parse(d); if ((x.version || 1) >= (D.version || 1)) D = x; } catch (e) {} }
  }
  // 문의 수신·카탈로그 등 운영 설정은 국문 데이터(관리자 [설정])를 공통으로 사용
  if (EN) D = Object.assign({}, D, { settings: KO_DATA.settings });
  const dispName = (p) => (EN ? p.name : p.nameKo);
  /* 문의 전송: 1순위 settings.formEndpoint(Formspree 등) → 실패(한도 초과·장애) 시 2순위 Web3Forms(settings.formBackupKey) */
  async function postJSON(url, body) {
    try {
      // 서비스가 응답하지 않을 때 방문자가 무한정 기다리지 않도록 12초 제한 → 다음 순위로 전환
      const ac = typeof AbortController === 'function' ? new AbortController() : null; const tm = ac && setTimeout(() => ac.abort(), 12000);
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined });
      if (tm) clearTimeout(tm);
      let j = null; try { j = await r.clone().json(); } catch (x) { j = null; }
      // 공통 성공 판정: HTTP 성공 + 응답 본문의 실패 플래그 없음 (미인증·한도초과는 success:false / errors)
      return r.ok && !(j && (j.success === false || j.success === 'false' || j.ok === false || (Array.isArray(j.errors) && j.errors.length)));
    } catch (e) { return false; }
  }
  async function sendInquiry(subject, data) {
    const st = D.settings || {}, ep = (st.formEndpoint || '').trim(), key = (st.formBackupKey || '').trim();
    const viaEndpoint = () => ep && postJSON(ep, Object.assign({ _subject: subject, subject, _replyto: data.email || undefined, _template: 'table', _captcha: 'false' }, data));
    const viaWeb3 = () => key && postJSON('https://api.web3forms.com/submit', Object.assign({}, data, { access_key: key, subject, from_name: EN ? 'SMG Website' : 'SMG 홈페이지', replyto: data.email || undefined }));
    // 전송 순서: settings.formPrimary = 'web3forms'(기본: Web3Forms → Formspree) | 'endpoint'(Formspree → Web3Forms)
    const order = st.formPrimary === 'endpoint' ? [['endpoint', viaEndpoint], ['web3forms', viaWeb3]] : [['web3forms', viaWeb3], ['endpoint', viaEndpoint]];
    // 점검용: contact.html?backuptest=1 이면 1순위를 건너뛰고 2순위로만 전송
    if (params.get('backuptest') === '1') order.shift();
    for (const [name, fn] of order) { if (await fn()) return name; }
    return '';
  }
  window.SMG = { data: D, DRAFT_KEY, INQ_KEY, safeGet, safeSet, EN, L, sendInquiry };

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
    { href: 'about.html', label: t('회사소개', 'Company'), sub: [['about.html#overview', t('기업개요', 'Overview')], ['about.html#history', t('연혁', 'History')], ['about.html#partners', t('글로벌 파트너', 'Global Partners')], ['about.html#cert', t('인증현황', 'Certifications')], ['about.html#location', t('오시는 길', 'Location')]] },
    { href: 'products.html', label: t('제품소개', 'Products'), sub: D.categories.map((c) => ['products.html?cat=' + c.id, c.name]) },
    { href: 'applications.html', label: t('적용분야', 'Applications'), sub: [['applications.html#industries', t('산업별 솔루션', 'Industries')]] },
    { href: 'support.html', label: t('고객지원', 'Support'), sub: [['support.html#news', t('공지사항', 'News')], ['support.html#downloads', t('자료실', 'Downloads')], ['support.html#faq', 'FAQ']] },
    { href: 'contact.html', label: t('견적문의', 'Contact'), sub: [] }
  ];
  const langHref = () => { const pid = document.body.dataset.pid; const f = pid ? 'product/' + pid + '.html' : (location.pathname.split('/').pop() || 'index.html') + location.search; return EN ? f : 'en/' + f; };
  const langSw = (cls) => `<a class="lang ${cls || ''}" href="${langHref()}" hreflang="${EN ? 'ko' : 'en'}" lang="${EN ? 'ko' : 'en'}" aria-label="${EN ? '한국어' : 'English'}"><b class="${EN ? '' : 'on'}">KO</b><i></i><b class="${EN ? 'on' : ''}">EN</b></a>`;

  function logo() {
    return `<a class="logo" href="${L('index.html')}" aria-label="${esc(D.company.name)} ${t('홈', 'Home')}"><img class="logo-img" src="assets/logo-mark.svg" alt="${esc(D.company.brand)}" width="72" height="34"><span class="logo-txt"><b>${esc(D.company.name.replace('주식회사 ', ''))}</b><small>${esc(D.company.brandSub)}</small></span></a>`;
  }

  /* ---------- Header / Footer ---------- */
  function renderChrome() {
    const page = document.body.dataset.page;
    const cur = page === 'product' ? 'products.html' : (location.pathname.split('/').pop() || 'index.html');
    const hdr = document.createElement('header');
    hdr.className = 'hdr' + (page === 'home' ? '' : ' light');
    hdr.innerHTML = `<div class="container">${logo()}
      <nav aria-label="${t('주 메뉴', 'Main menu')}"><ul class="gnb">${NAV.map((n) => `<li><a href="${L(n.href)}" class="${cur === n.href ? 'on' : ''}">${n.label}</a>${n.sub.length ? `<div class="sub">${n.sub.map((s) => `<a href="${L(s[0])}">${esc(s[1])}</a>`).join('')}</div>` : ''}</li>`).join('')}</ul></nav>
      <div class="hdr-util"><a class="hdr-tel" href="${telHref(D.company.tel)}">${I.phone}${esc(D.company.tel)}</a>
      ${langSw()}
      <a class="btn btn-primary btn-sm" href="${L('contact.html')}">${t('견적 문의', 'Get a Quote')}</a>
      <button class="hamb" aria-label="${t('메뉴 열기', 'Open menu')}" aria-expanded="false"><span></span></button></div></div>`;
    document.body.prepend(hdr);
    const skip = document.createElement('a'); skip.className = 'skip'; skip.href = location.pathname + location.search + '#main'; skip.textContent = t('본문 바로가기', 'Skip to content');
    document.body.prepend(skip);

    const m = document.createElement('div');
    m.className = 'mnav'; m.setAttribute('aria-hidden', 'true');
    m.innerHTML = `<div class="mnav-top">${logo()}<div style="display:flex;align-items:center;gap:8px">${langSw('dark')}<button class="mnav-close" aria-label="${t('메뉴 닫기', 'Close menu')}">×</button></div></div>
      ${NAV.map((n) => n.sub.length ? `<div class="mgrp"><div class="mrow"><a href="${L(n.href)}">${n.label}</a><button class="mtog" aria-label="${n.label} ${t('하위 메뉴', 'submenu')}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button></div><div class="msub">${n.sub.map((s) => `<a href="${L(s[0])}">${esc(s[1])}</a>`).join('')}</div></div>` : `<a href="${L(n.href)}">${n.label}</a>`).join('')}
      <div style="margin-top:auto;padding-top:28px"><a class="btn btn-primary" style="width:100%;justify-content:center;border:0;font-size:16px" href="${telHref(D.company.tel)}">${I.phone} ${esc(D.company.tel)}</a></div>`;
    document.body.appendChild(m);
    const hb = $('.hamb', hdr);
    const toggle = (o) => { m.classList.toggle('open', o); hb.setAttribute('aria-expanded', o); m.setAttribute('aria-hidden', !o); document.body.style.overflow = o ? 'hidden' : ''; };
    hb.onclick = () => toggle(true);
    $('.mnav-close', m).onclick = () => toggle(false);
    $$('a', m).forEach((a) => a.addEventListener('click', () => toggle(false)));
    $$('.mtog', m).forEach((t) => (t.onclick = () => { const g = t.closest('.mgrp'); const o = !g.classList.contains('open'); $$('.mgrp', m).forEach((x) => { x.classList.remove('open'); $('.mtog', x).setAttribute('aria-expanded', 'false'); }); g.classList.toggle('open', o); t.setAttribute('aria-expanded', o); }));
    const curGrp = $$('.mgrp', m).find((g) => $('.mrow a', g).getAttribute('href') === L(cur)); if (curGrp) curGrp.classList.add('open');

    if (page === 'home') {
      const onS = () => hdr.classList.toggle('solid', scrollY > 40);
      addEventListener('scroll', onS, { passive: true }); onS();
    }

    const c = D.company;
    const f = document.createElement('footer');
    f.className = 'ftr';
    f.innerHTML = `<div class="container"><div class="ftr-top">
      <div>${logo()}<p style="max-width:340px">${esc(D.about.title)}<br>${t('1990년 설립 이래 온도센서·히터·피드스루 전문 제조기업', 'Specialist manufacturer of temperature sensors, heaters and feedthroughs since 1990')}</p></div>
      <div><h5>${t('제품', 'Products')}</h5><ul>${D.categories.map((x) => `<li><a href="${L('products.html?cat=' + x.id)}">${esc(x.name)}</a></li>`).join('')}</ul></div>
      <div><h5>${t('회사', 'Company')}</h5><ul><li><a href="${L('about.html')}">${t('회사소개', 'About SMG')}</a></li><li><a href="${L('about.html#history')}">${t('연혁', 'History')}</a></li><li><a href="${L('applications.html')}">${t('적용분야', 'Applications')}</a></li><li><a href="${L('support.html#news')}">${t('공지사항', 'News')}</a></li><li><a href="${L('support.html#downloads')}">${t('자료실', 'Downloads')}</a></li></ul></div>
      <div><h5>${t('고객센터', 'Contact')}</h5><ul><li><a href="${telHref(c.tel)}" style="font-size:22px;font-weight:800;color:#fff">${esc(c.tel)}</a></li><li>FAX ${esc(c.fax)}</li><li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li><li>${esc(c.hours)}</li></ul></div>
      </div><div class="ftr-bot"><address><span>${esc(c.name)}</span>${c.ceo ? `<span>${t('대표', 'CEO')} ${esc(c.ceo)}</span>` : ''}${c.bizNo ? `<span>${t('사업자등록번호', 'Business Reg. No.')} ${esc(c.bizNo)}</span>` : ''}<br><span>${esc(c.address)}</span><span>TEL ${esc(c.tel)}</span><span>FAX ${esc(c.fax)}</span></address>
      <div><a href="${L('privacy.html')}">${t('개인정보처리방침', 'Privacy Policy')}</a> · <a href="admin.html" rel="nofollow">${t('관리자', 'Admin')}</a><br>© ${new Date().getFullYear()} ${esc(c.nameEn)} All rights reserved.</div></div></div>`;
    document.body.appendChild(f);

    const fab = document.createElement('div');
    const mbar = document.createElement('nav');
    mbar.className = 'mbar'; mbar.setAttribute('aria-label', t('빠른 메뉴', 'Quick actions'));
    mbar.innerHTML = `<a href="${telHref(D.company.tel)}">${I.phone}${t('전화', 'Call')}</a><a href="${esc(D.settings.catalogPdf)}" download>${I.dl}${t('카탈로그', 'Catalog')}</a><a class="pri" href="${L('contact.html')}" id="mbar-q">${I.mail}${t('견적 문의', 'Get a Quote')}</a>`;
    if (page !== 'contact') document.body.appendChild(mbar); else document.body.classList.add('no-mbar');
    fab.className = 'fab';
    fab.innerHTML = `<a class="q" href="${L('contact.html')}" aria-label="${t('견적 문의', 'Get a Quote')}">${I.mail}</a><button class="top" aria-label="${t('맨 위로', 'Back to top')}">${I.up}</button>`;
    document.body.appendChild(fab);
    const top = $('.top', fab);
    top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
    addEventListener('scroll', () => top.classList.toggle('show', scrollY > 600), { passive: true });

    if (preview) {
      const b = document.createElement('div');
      b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:500;background:#f59e0b;color:#111;text-align:center;padding:8px;font-weight:700;font-size:14px';
      b.innerHTML = t('미리보기 모드 — 관리자 임시저장 내용 표시 중', 'Preview mode — showing unpublished admin draft') + ' · <a href="#" style="text-decoration:underline">' + t('미리보기 종료', 'Exit preview') + '</a>';
      b.querySelector('a').onclick = (e) => { e.preventDefault(); try { sessionStorage.removeItem('smg_preview'); } catch (x) {} location.href = location.pathname; };
      document.body.appendChild(b);
    }
  }

  /* ---------- Shared components ---------- */
  function prodCard(p) {
    const cat = D.categories.find((c) => c.id === p.category);
    return `<a class="prod-card" href="${L('product/' + encodeURIComponent(p.id) + '.html')}">${p.certs && p.certs.length ? `<span class="chip">${t('방폭/선급 인증', 'Ex / Marine certified')}</span>` : ''}
      <div class="img"><img src="${esc(p.images[0])}" alt="${esc(p.code + ' ' + p.name)}" loading="lazy"></div>
      <div class="body"><span class="tag" style="color:${esc(cat && cat.color || '')}">${esc(cat ? cat.nameEn : '')}</span><h3>${esc(p.code)}</h3><div class="en">${EN ? esc(p.name) : `${esc(p.nameKo)} · ${esc(p.name)}`}</div><p>${esc(p.summary)}</p><span class="more">${t('자세히 보기', 'View details')} ${I.arrow}</span></div></a>`;
  }
  window.SMG.prodCard = prodCard;

  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
  }
  window.SMG.toast = toast; window.SMG.t = t; window.SMG.telHref = telHref;

  function lightbox(src, list) {
    list = list && list.length ? list : [src]; let i = Math.max(0, list.indexOf(src));
    const m = document.createElement('div');
    m.className = 'modal open lightbox'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<button class="lb-x" aria-label="${t('닫기', 'Close')}">×</button>${list.length > 1 ? `<button class="lb-nav prev" aria-label="${t('이전', 'Previous')}">‹</button><button class="lb-nav next" aria-label="${t('다음', 'Next')}">›</button><div class="lb-count"></div>` : ''}<img src="" alt="">`;
    const img = $('img', m), cnt = $('.lb-count', m);
    const show = (k) => { i = (k + list.length) % list.length; img.src = list[i]; if (cnt) cnt.textContent = (i + 1) + ' / ' + list.length; };
    const close = () => { m.remove(); removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); };
    m.onclick = (e) => { if (e.target.closest('.lb-nav')) { show(i + (e.target.closest('.next') ? 1 : -1)); return; } if (e.target === img && list.length > 1) return; close(); };
    let sx = 0; m.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    m.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); }, { passive: true });
    addEventListener('keydown', key); show(i); document.body.appendChild(m); $('.lb-x', m).focus();
  }
  window.SMG.lightbox = lightbox;

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
    const slides = (h.images && h.images.length ? h.images : [h.image]).filter(Boolean);
    $('#hero').innerHTML = `${slides.map((s, i) => `<div class="hero-bg${i ? '' : ' on'}" style="background-image:url('${esc(s)}')"></div>`).join('')}<div class="grid-lines"></div>${slides.length > 1 ? `<div class="hero-dots" role="tablist" aria-label="${t('메인 이미지', 'Hero images')}">${slides.map((_, i) => `<button class="${i ? '' : 'on'}" aria-label="${i + 1}"><i></i></button>`).join('')}</div>` : ''}
      <div class="container"><span class="eyebrow">${esc(h.eyebrow)}</span><h1>${esc(h.title)}</h1><p class="lead">${esc(h.subtitle)}</p>
      <div class="hero-cta"><a class="btn btn-primary" href="${L('products.html')}">${esc(h.ctaPrimary)} ${I.arrow}</a><a class="btn btn-ghost" href="${L('contact.html')}">${esc(h.ctaSecondary)}</a><a class="btn btn-ghost" href="${esc(D.settings.catalogPdf)}" download>${I.dl} ${t('카탈로그 PDF', 'Catalog PDF')}</a></div>
      <div class="hero-stats">${D.stats.map((s) => `<div><b data-count="${esc(s.value)}">${esc(s.value)}<em>${esc(s.suffix)}</em></b><span>${esc(s.label)}</span></div>`).join('')}</div></div>
      <div class="scroll-ind">SCROLL</div>`;
    $('#cats').innerHTML = D.categories.map((c, i) => `<a class="cat-card rv" href="${L('products.html?cat=' + c.id)}" style="transition-delay:${i * 60}ms;--cc:${esc(c.color || '#e1251b')}"><span class="arrow">${I.arrowUR}</span><div class="img"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy"></div><div class="body"><span class="no">0${i + 1} — ${t('제품 ', '')}${D.products.filter((p) => p.category === c.id).length}${t('종', ' products')}</span><h3>${EN ? '' : `<small>${esc(c.nameEn)}</small>`}${esc(c.name)}</h3><p>${esc(c.desc)}</p></div></a>`).join('');
    const a = D.about;
    $('#about').innerHTML = `<div class="media rv"><img src="${esc(a.image)}" alt="${t('에스엠지 사옥', 'SMG headquarters')}" loading="lazy"><div class="badge"><b>${new Date().getFullYear() - D.company.founded}+</b><span>Years of Manufacturing</span></div></div>
      <div class="prose rv"><span class="eyebrow">About SMG</span><h2 class="sec-title">${esc(a.title)}</h2>${a.body.slice(0, 2).map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="values">${a.values.map((v) => `<div><b>${esc(v.title)}</b><span>${esc(v.desc)}</span></div>`).join('')}</div>
      <a class="btn btn-dark" style="margin-top:32px" href="${L('about.html')}">${t('회사소개 자세히', 'More about SMG')} ${I.arrow}</a></div>`;
    $('#industries').innerHTML = D.industries.map((x, i) => `<a class="ind rv" href="${L('applications.html')}" style="transition-delay:${i * 60}ms"><img src="${esc(x.image)}" alt="" loading="lazy"><div><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></div></a>`).join('');
    const feat = D.products.filter((p) => p.featured).slice(0, 4);
    $('#featured').innerHTML = (feat.length ? feat : D.products.slice(0, 4)).map(prodCard).join('');
    $('#certs').innerHTML = D.certifications.map((c) => `<div><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></div>`).join('');
    $('#partners').innerHTML = `<div class="marq-track">${[...D.partners, ...D.partners, ...D.partners, ...D.partners].map((p) => `<span>${esc(p)}</span>`).join('')}</div>`;
    $('#news').innerHTML = newsList(D.news.slice(0, 4)); bindNews($('#news'));
    if (D.settings.showPopup && D.settings.popupTitle) {
      let hide = false; try { hide = localStorage.getItem('smg_popup_hide') === new Date().toISOString().slice(0, 10); } catch (e) {}
      if (!hide) {
        const m = document.createElement('div'); m.className = 'modal open';
        m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" aria-label="${t('닫기', 'Close')}">×</button><span class="chip">NOTICE</span><h3 style="margin-top:12px">${esc(D.settings.popupTitle)}</h3><p style="color:var(--muted);white-space:pre-line">${esc(D.settings.popupBody)}</p><div style="display:flex;justify-content:space-between;margin-top:24px;align-items:center"><label style="font-size:14px;color:var(--muted)"><input type="checkbox" id="pp-today"> ${t('오늘 하루 보지 않기', "Don't show today")}</label><button class="btn btn-dark btn-sm" id="pp-close">${t('닫기', 'Close')}</button></div></div>`;
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
    const cats = [{ id: 'all', name: t('전체 제품', 'All products') }, ...D.categories];
    function draw() {
      side.innerHTML = '<h4>CATEGORY</h4>' + cats.map((c) => `<button data-c="${c.id}" class="${cat === c.id ? 'on' : ''}">${esc(c.name)} <span>${c.id === 'all' ? D.products.length : D.products.filter((p) => p.category === c.id).length}</span></button>`).join('');
      const k = q.trim().toLowerCase();
      const list = D.products.filter((p) => (cat === 'all' || p.category === cat) && (!k || [p.code, p.name, p.nameKo, p.summary, p.applications, p.installation, (p.features || []).join(' '), (p.certs || []).join(' ')].join(' ').toLowerCase().includes(k)));
      cnt.innerHTML = t(`총 <em>${list.length}</em>개 제품`, `<em>${list.length}</em> products`);
      grid.innerHTML = list.length ? list.map(prodCard).join('') : `<div class="empty" style="grid-column:1/-1">${t('검색 결과가 없습니다.', 'No products found.')}<br><a href="${L('contact.html')}" style="color:var(--red);font-weight:700">${t('찾는 제품을 문의해 주세요 →', 'Ask us about the product you need →')}</a></div>`;
      const cur = D.categories.find((c) => c.id === cat);
      $('#pl-title').textContent = cur ? cur.name : t('제품소개', 'Products');
      $('#pl-desc').textContent = cur ? cur.desc : t('온도센서 · 써모웰 · 히터 · 압력 트랜스미터 · 케이블 부싱 · 피드스루 전 제품 라인업', 'Temperature sensors · Thermowells · Heaters · Pressure transmitters · Cable bushings · Feedthroughs');
      document.title = (cur ? cur.name + ' | ' : '') + t('제품소개 | SMG 주식회사 에스엠지', 'Products | SMG Co., Ltd.');
      $$('button', side).forEach((b) => (b.onclick = () => { cat = b.dataset.c; sync(); draw(); }));
      const on = $('button.on', side); if (on && side.scrollWidth > side.clientWidth) side.scrollLeft = on.offsetLeft - 16;
    }
    function sync() { const u = new URLSearchParams(); if (cat !== 'all') u.set('cat', cat); if (q) u.set('q', q); history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : '')); }
    let tm; inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { q = inp.value; sync(); draw(); }, 150); };
    draw();
  };

  P.product = function () {
    const p = D.products.find((x) => x.id === (document.body.dataset.pid || params.get('id'))) || D.products[0];
    const cat = D.categories.find((c) => c.id === p.category) || {};
    document.title = `${p.code} ${dispName(p)} | ${D.company.name}`;
    const md = document.querySelector('meta[name=description]'); if (md) md.content = p.summary;
    $('#crumb').innerHTML = `<a href="${L('index.html')}">HOME</a>/<a href="${L('products.html')}">${t('제품소개', 'Products')}</a>/<a href="${L('products.html?cat=' + cat.id)}">${esc(cat.name)}</a>`;
    $('#pd-cat').textContent = cat.nameEn || '';
    $('#pd-title').textContent = dispName(p);
    $('#pd').innerHTML = `<div class="pd-gal"><div class="pd-main" id="pd-main" title="${t('클릭하여 확대', 'Click to enlarge')}"><img src="${esc(p.images[0])}" alt="${esc(p.code)}"></div>
      ${p.images.length > 1 ? `<div class="pd-thumbs">${p.images.map((im, i) => `<button class="${i ? '' : 'on'}" data-src="${esc(im)}" aria-label="${t('이미지', 'Image')} ${i + 1}"><img src="${esc(im)}" alt=""></button>`).join('')}</div>` : ''}</div>
      <div class="pd-info"><span class="chip" style="background:color-mix(in srgb,${esc(cat.color || '#e1251b')} 12%,#fff);color:${esc(cat.color || '#e1251b')}">${esc(cat.name || '')}</span><div class="code" style="margin-top:14px">${esc(p.code)}</div><div class="nm">${esc(dispName(p))}</div>${EN ? '' : `<div class="en">${esc(p.name)}</div>`}
      <p class="sum">${esc(p.summary)}</p>
      ${p.features && p.features.length ? `<div class="pd-block"><h3>Features</h3><ul class="checks">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
      ${p.applications ? `<div class="pd-block"><h3>Application</h3><p>${esc(p.applications)}</p></div>` : ''}
      ${p.installation ? `<div class="pd-block"><h3>Installation</h3><p>${esc(p.installation)}</p></div>` : ''}
      ${p.notice ? `<div class="pd-block"><h3>Notice</h3><p class="notice">${esc(p.notice)}</p></div>` : ''}
      ${p.specs && p.specs.length ? `<div class="pd-block"><h3>Specification</h3><table class="spec">${p.specs.map((s) => `<tr><th>${esc(s[0])}</th><td>${esc(s[1])}</td></tr>`).join('')}</table></div>` : ''}
      ${p.certs && p.certs.length ? `<div class="pd-block"><h3>Certification</h3><div class="cert-tags">${p.certs.map((c) => `<span>${esc(c)}</span>`).join('')}</div></div>` : ''}
      ${p.orderCode ? `<div class="pd-block"><h3>Sample Ordering Code</h3><div class="code-box"><span>${esc(p.orderCode)}</span><button id="cp">${t('복사', 'Copy')}</button></div><p style="font-size:13.5px;color:var(--muted);margin-top:8px">${t('세부 Ordering Code 표는 카탈로그 PDF를 참고하세요. 현장 공정에 맞춘 주문 제작이 가능합니다.', 'See the catalog PDF for full ordering codes. Custom configurations are available.')}</p></div>` : ''}
      <div class="pd-actions"><a class="btn btn-primary" href="${L('contact.html?product=' + encodeURIComponent(p.code + ' ' + p.name))}">${t('이 제품 견적 문의', 'Request a quote for this product')} ${I.arrow}</a><a class="btn btn-line" href="${esc(D.settings.catalogPdf)}" download>${I.dl} ${t('카탈로그', 'Catalog')}</a><a class="btn btn-line" href="${telHref(D.company.tel)}">${I.phone} ${t('전화 상담', 'Call us')}</a></div></div>`;
    const main = $('#pd-main img');
    $$('.pd-thumbs button').forEach((b) => (b.onclick = () => { main.src = b.dataset.src; $$('.pd-thumbs button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }));
    $('#pd-main').onclick = () => lightbox(main.getAttribute('src'), p.images);
    const mq = $('#mbar-q'); if (mq) mq.href = L('contact.html?product=' + encodeURIComponent(p.code + ' ' + p.name));
    if (p.images.length > 1) {
      let idx = 0; const thumbs = $$('.pd-thumbs button');
      $('.pd-gal').insertAdjacentHTML('beforeend', `<div class="pd-dots" aria-hidden="true">${p.images.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>`);
      const dots = $$('.pd-dots i');
      const show = (i) => { idx = (i + p.images.length) % p.images.length; main.src = p.images[idx]; thumbs.forEach((x, k) => x.classList.toggle('on', k === idx)); dots.forEach((x, k) => x.classList.toggle('on', k === idx)); };
      thumbs.forEach((b, k) => (b.onclick = () => show(k)));
      let sx = 0, sy = 0, moved = false; const el = $('#pd-main');
      el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; moved = false; }, { passive: true });
      el.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { moved = true; show(idx + (dx < 0 ? 1 : -1)); } }, { passive: true });
      el.onclick = () => { if (!moved) lightbox(main.getAttribute('src'), p.images); moved = false; };
    }
    const cp = $('#cp'); if (cp) cp.onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(p.orderCode) : Promise.reject()).then(() => toast(t('Ordering Code 복사됨', 'Ordering code copied')), () => toast(p.orderCode)); };
    const rel = D.products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    $('#related').innerHTML = rel.length ? `<div class="sec-head"><div><span class="eyebrow">Related</span><h2 class="sec-title" style="font-size:32px">${t('같은 카테고리 제품', 'Related products')}</h2></div></div><div class="prod-grid">${rel.map(prodCard).join('')}</div>` : '';
    // JSON-LD
    if (!document.querySelector('link[rel=canonical]')) { const cn = document.createElement('link'); cn.rel = 'canonical'; cn.href = 'https://www.sungsil.com/' + (EN ? 'en/' : '') + 'product/' + encodeURIComponent(p.id) + '.html'; document.head.appendChild(cn); }
    if (!document.body.dataset.pid) {
    const ld = document.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.code + ' ' + p.name, description: p.summary, image: p.images, brand: { '@type': 'Brand', name: 'SMG' }, manufacturer: { '@type': 'Organization', name: D.company.nameEn } });
    document.head.appendChild(ld);
    }
  };

  P.about = function () {
    const a = D.about;
    $('#overview').innerHTML = `<div class="split"><div class="media rv"><img src="${esc(a.image)}" alt="${t('사옥', 'Headquarters')}" loading="lazy"><div class="badge"><b>Since ${D.company.founded}</b><span>${esc(D.company.nameEn)}</span></div></div>
      <div class="prose rv"><span class="eyebrow">CEO Message</span><h2 class="sec-title">${esc(a.title)}</h2>${a.body.map((p) => `<p>${esc(p)}</p>`).join('')}<p style="color:var(--text);font-weight:700;margin-top:24px">${t('앞으로도 에스엠지에 변함없는 애정과 성원을 부탁드립니다.', 'We sincerely appreciate your continued support of SMG.')}</p></div></div>
      <div class="values v4">${a.values.map((v) => `<div class="rv"><b>${esc(v.title)}</b><span>${esc(v.desc)}</span></div>`).join('')}</div>`;
    const c = D.company;
    $('#info').innerHTML = `<table class="spec"><tr><th>${t('회사명', 'Company')}</th><td>${EN ? esc(c.name) : `${esc(c.name)} (${esc(c.nameEn)})`}</td></tr><tr><th>${t('설립', 'Founded')}</th><td>${t(c.founded + '년 (성실전자)', c.founded + ' (as Sungsil Electronics)')}</td></tr>${c.ceo ? `<tr><th>${t('대표이사', 'CEO')}</th><td>${esc(c.ceo)}</td></tr>` : ''}<tr><th>${t('주요제품', 'Products')}</th><td>${t('온도센서(RTD/TC·멀티 써모커플), 써모웰, 히터(마이카·필름·메탈 척/플레이트), 압력 트랜스미터, 케이블 부싱, 피드스루(ShieldLoc)', 'Temperature sensors (RTD/TC, multi-point TC), thermowells, heaters (mica, film, metal chuck/plate), pressure transmitters, cable bushings, feedthroughs (ShieldLoc)')}</td></tr><tr><th>${t('인증', 'Certifications')}</th><td>ISO 9001, ISO 14001, ATEX, IECEx, KCs·KGS, KTL, BV, UL, ASME PTC 19.3</td></tr><tr><th>${t('본사', 'Head office')}</th><td>${esc(c.address)}</td></tr><tr><th>${t('연락처', 'Contact')}</th><td>TEL ${esc(c.tel)} · FAX ${esc(c.fax)} · ${esc(c.email)}</td></tr></table>`;
    let lastDec = '';
    $('#history-list').innerHTML = D.history.map((h) => { const dec = String(h.year).slice(0, 3) + "0's"; const d = dec !== lastDec ? `<div class="decade">${dec}</div>` : ''; lastDec = dec; return d + `<div class="hv rv"><b>${esc(h.year)}</b><ul>${h.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`; }).join('');
    const pc = $('#partner-list'); if (pc) pc.innerHTML = (D.partnerCards || []).map((x) => `<div class="pcard rv"><div class="pimg"><img src="${esc(x.image)}" alt="${esc(x.title)}" loading="lazy"></div><div class="pbody"><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></div></div>`).join('');
    $('#cert-list').innerHTML = D.certifications.map((c) => `<div><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></div>`).join('');
    renderMap($('#map'));
    $('#loc-info').innerHTML = `<b style="font-size:18px">${esc(c.address)}</b>${EN ? '' : `<p style="color:var(--muted)">${esc(c.addressEn)}</p>`}<p style="margin-top:8px">TEL <a href="${telHref(c.tel)}">${esc(c.tel)}</a> · FAX ${esc(c.fax)} · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`;
  };

  function renderMap(el) {
    if (!el) return;
    const q = encodeURIComponent(D.company.mapQuery || D.company.address);
    el.innerHTML = `<iframe title="${t('오시는 길 지도', 'Map')}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${q}&z=16&hl=${EN ? 'en' : 'ko'}&output=embed"></iframe>`;
  }

  P.applications = function () {
    $('#ind-list').innerHTML = D.industries.map((x) => { const ps = (x.products || []).map((id) => D.products.find((p) => p.id === id)).filter(Boolean); return `<article class="ind-row rv"><div class="ind-img"><img src="${esc(x.image)}" alt="${esc(x.title)}" loading="lazy"></div><div class="ind-body"><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p>${ps.length ? `<div class="ind-prods"><span>${t('추천 제품', 'Recommended products')}</span>${ps.map((p) => `<a href="${L('product/' + encodeURIComponent(p.id) + '.html')}"><b>${esc(p.code)}</b>${esc(dispName(p))}</a>`).join('')}</div>` : ''}</div></article>`; }).join('');
    const dsec = $('#defense'); if (dsec && !(D.defense || []).length) { dsec.remove(); return; }
    $('#def-list').innerHTML = D.defense.map((x) => `<div class="ind rv" style="aspect-ratio:16/11"><img src="${esc(x.image)}" alt="" loading="lazy"><div><span style="color:#ff8a82;font-weight:700;font-size:12px;letter-spacing:.1em">${t('적용처', 'Application')}</span><b>${esc(x.title)}</b></div></div>`).join('');
  };

  P.support = function () {
    $('#news-list').innerHTML = newsList(D.news); bindNews($('#news-list'));
    $('#dl-list').innerHTML = D.downloads.map((d) => `<div class="dl-item"><div class="ic">${esc(d.type)}</div><div><b>${esc(d.title)}</b><span>${esc(d.desc)}</span></div><a class="btn btn-dark btn-sm" href="${esc(d.file)}" download>${I.dl} ${t('다운로드', 'Download')}</a></div>`).join('');
    $('#faq-list').innerHTML = D.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  };

  P.contact = function () {
    const c = D.company;
    $('#contact-card').innerHTML = `<span class="eyebrow" style="color:#ff8a82">Contact</span><h3 style="margin-top:12px">${t('기술 상담부터 견적까지<br>전문 엔지니어가 답변드립니다', 'From technical consultation to quotation,<br>our engineers will respond')}</h3>
      <dl><dt>TEL</dt><dd><a href="${telHref(c.tel)}">${esc(c.tel)}</a></dd><dt>FAX</dt><dd>${esc(c.fax)}</dd><dt>E-MAIL</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd><dt>HOURS</dt><dd>${esc(c.hours)}</dd><dt>ADDRESS</dt><dd style="font-size:15px">${esc(c.address)}</dd></dl>`;
    const sel = $('#f-type'); sel.innerHTML = D.inquiryTypes.map((t) => `<option>${esc(t)}</option>`).join('');
    const pSel = $('#f-product');
    pSel.innerHTML = `<option value="">${t('선택 안 함', 'Not specified')}</option>` + D.categories.map((cat) => `<optgroup label="${esc(cat.name)}">${D.products.filter((p) => p.category === cat.id).map((p) => `<option>${esc(p.code + ' ' + p.name)}</option>`).join('')}</optgroup>`).join('');
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
      if (!ok) { toast(t('필수 항목을 확인해 주세요', 'Please check the required fields')); const first = $('.invalid input, .invalid textarea, .invalid select', form); if (first) first.focus(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.website; delete data.agree;
      const rec = Object.assign({ id: 'q' + Date.now(), createdAt: new Date().toISOString(), status: '신규', lang: EN ? 'EN' : 'KO' }, data);
      const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = t('전송 중...', 'Sending...');
      const sent = !!(await sendInquiry(`[${t('홈페이지 문의', 'Website Inquiry · EN')}] ${data.type} - ${data.company}`, Object.assign({ lang: EN ? 'EN' : 'KO' }, data)));
      try { const arr = JSON.parse(safeGet(INQ_KEY) || '[]'); arr.unshift(rec); safeSet(INQ_KEY, JSON.stringify(arr.slice(0, 500))); } catch (err) {}
      btn.disabled = false; btn.innerHTML = t('문의 접수하기 ', 'Submit inquiry ') + I.arrow;
      if (sent) {
        form.reset(); showDone(t('문의가 정상 접수되었습니다', 'Your inquiry has been submitted'), t('담당자가 확인 후 영업일 기준 1~2일 내 회신드리겠습니다.', 'Our team will reply within 1–2 business days.'));
      } else {
        const body = EN ? `[Type] ${data.type}\n[Product] ${data.product || '-'}\n[Company] ${data.company}\n[Name] ${data.name}\n[Phone] ${data.phone}\n[Email] ${data.email}\n[Qty/Lead time] ${data.qty || '-'}${data.items ? '\n[Items]\n' + data.items : ''}\n\n${data.message}` : `[문의유형] ${data.type}\n[관심제품] ${data.product || '-'}\n[회사명] ${data.company}\n[담당자] ${data.name}\n[연락처] ${data.phone}\n[이메일] ${data.email}\n[수량/납기] ${data.qty || '-'}${data.items ? '\n[견적 품목]\n' + data.items : ''}\n\n${data.message}`;
        location.href = `mailto:${D.settings.notifyEmail || c.email}?subject=${encodeURIComponent(t('[홈페이지 문의] ', '[Website Inquiry · EN] ') + data.type + ' - ' + data.company)}&body=${encodeURIComponent(body)}`;
        showDone(t('메일 앱으로 문의 내용을 전달합니다', 'Opening your email app'), t(`메일 앱이 열리지 않으면 ${c.email} 또는 ${c.tel}로 연락 주세요.`, `If your email app does not open, please contact ${c.email} or ${c.tel}.`));
      }
    });
    function showDone(title, desc) {
      const m = document.createElement('div'); m.className = 'modal open';
      m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" style="text-align:center"><div style="width:64px;height:64px;border-radius:50%;background:var(--red-soft);color:var(--red);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px">✓</div><h3>${esc(title)}</h3><p style="color:var(--muted)">${esc(desc)}</p><button class="btn btn-dark" style="margin-top:24px">${t('확인', 'OK')}</button></div>`;
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
    if (typeof window.SMG_EXTRAS === 'function') window.SMG_EXTRAS(pg);
    window.SMG.booted = true;
    reveal(); countUp();
    if (D.settings.gaId && /^G-[A-Z0-9]+$/.test(D.settings.gaId)) {
      const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + D.settings.gaId; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', D.settings.gaId);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
