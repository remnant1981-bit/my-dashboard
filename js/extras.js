/* SMG Corporate Site — extras: search, quote list, temperature comparison, datasheet tools, hero slideshow */
(function () {
  'use strict';
  function run(pg) {
    const S = window.SMG; if (!S || S.extrasDone) return; S.extrasDone = true;
    const D = S.data, t = S.t, L = S.L, esc = S.esc, EN = S.EN;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const svg = (p, w = 20) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${w}" height="${w}" aria-hidden="true">${p}</svg>`;
    const IC = {
      search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
      quote: svg('<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>'),
      plus: svg('<path d="M12 5v14M5 12h14"/>', 18), check: svg('<path d="M5 12l5 5L20 7"/>', 18),
      print: svg('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>', 18),
      book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>', 18),
      link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>', 18),
      x: svg('<path d="M18 6L6 18M6 6l12 12"/>', 16),
      chart: svg('<path d="M3 3v18h18"/><path d="M7 15h4M7 10h9M7 5h6"/>', 18), list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', 18)
    };
    const prodBy = (id) => D.products.find((p) => p.id === id);
    const catOf = (p) => D.categories.find((c) => c.id === p.category) || {};
    const pname = (p) => (EN ? p.name : p.nameKo);

    /* ---------- Quote list (견적함) ---------- */
    const QK = 'smg_quote_v1';
    const getQ = () => { try { return (JSON.parse(localStorage.getItem(QK) || '[]') || []).filter((x) => prodBy(x.id)); } catch (e) { return []; } };
    const setQ = (a) => { try { localStorage.setItem(QK, JSON.stringify(a)); } catch (e) {} badge(); document.dispatchEvent(new CustomEvent('smg:quote')); };
    const inQ = (id) => getQ().some((x) => x.id === id);
    const toggleQ = (id) => { const a = getQ(); const i = a.findIndex((x) => x.id === id); if (i >= 0) { a.splice(i, 1); S.toast(t('견적함에서 뺐습니다', 'Removed from quote list')); } else { a.push({ id, qty: 1 }); S.toast(t('견적함에 담았습니다 · 견적 문의에서 한 번에 요청하세요', 'Added to quote list · request all at once on the Contact page')); } setQ(a); };
    S.quote = { getQ, setQ, inQ, toggleQ };
    function badge() {
      const n = getQ().length;
      $$('.qcount').forEach((e) => { e.textContent = n; e.hidden = !n; });
    }

    /* ---------- Header: search + quote buttons ---------- */
    const util = $('.hdr .hdr-util');
    if (util) {
      util.insertAdjacentHTML('afterbegin', `<button class="icon-btn" type="button" id="hs-open" aria-label="${t('제품 검색', 'Search products')}" title="${t('제품 검색', 'Search')} ( / )">${IC.search}</button><a class="icon-btn qbtn" href="${L('contact.html')}#quote" aria-label="${t('견적함', 'Quote list')}" title="${t('견적함', 'Quote list')}">${IC.quote}<em class="qcount" hidden></em></a>`);
      $('#hs-open').onclick = openSearch;
    }
    const mq = $('#mbar-q'); if (mq) mq.insertAdjacentHTML('beforeend', '<em class="qcount" hidden></em>');
    badge();
    addEventListener('storage', (e) => { if (e.key === QK) badge(); });
    addEventListener('keydown', (e) => { if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });

    /* ---------- Search overlay ---------- */
    function openSearch() {
      if ($('.search-ov')) return;
      const m = document.createElement('div'); m.className = 'search-ov'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', t('제품 검색', 'Product search'));
      m.innerHTML = `<div class="so-box"><div class="so-in">${IC.search}<input type="search" autocomplete="off" placeholder="${t('모델명·제품명·인증·적용분야 (예: PT100, ATEX, LNG)', 'Model, name, certification, application (e.g. PT100, ATEX, LNG)')}" aria-label="${t('검색어', 'Search term')}"><button type="button" class="so-x" aria-label="${t('닫기', 'Close')}">${IC.x}</button></div><div class="so-res" role="listbox"></div><div class="so-foot"><span>${t('인기 검색', 'Popular')}:</span>${['PT100', 'ATEX', 'LNG', 'Kapton', '-253', 'Thermowell'].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}</div></div>`;
      document.body.appendChild(m); document.body.style.overflow = 'hidden';
      const inp = $('input', m), res = $('.so-res', m);
      const close = () => { m.remove(); document.body.style.overflow = ''; removeEventListener('keydown', key); };
      const key = (e) => { if (e.key === 'Escape') close(); };
      addEventListener('keydown', key);
      m.addEventListener('mousedown', (e) => { if (e.target === m) close(); });
      $('.so-x', m).onclick = close;
      $$('.so-foot button', m).forEach((b) => (b.onclick = () => { inp.value = b.dataset.k; draw(); inp.focus(); }));
      const draw = () => {
        const k = inp.value.trim().toLowerCase();
        if (!k) { res.innerHTML = ''; return; }
        const hit = D.products.filter((p) => [p.code, p.name, p.nameKo, p.summary, p.applications, (p.certs || []).join(' '), (p.features || []).join(' '), catOf(p).name].join(' ').toLowerCase().includes(k));
        res.innerHTML = hit.length ? hit.slice(0, 8).map((p) => `<a role="option" href="${L('product/' + encodeURIComponent(p.id) + '.html')}"><img src="${esc(S.img ? S.img.thumbSrc(p.images[0]) : p.images[0])}" alt="" loading="lazy"><span><b>${esc(p.code)}</b> ${esc(pname(p))}<small>${esc(catOf(p).name || '')}</small></span></a>`).join('') + (hit.length > 8 ? `<a class="so-all" href="${L('products.html?q=' + encodeURIComponent(inp.value.trim()))}">${t(`검색 결과 ${hit.length}건 모두 보기 →`, `See all ${hit.length} results →`)}</a>` : '')
          : `<div class="so-empty">${t('일치하는 제품이 없습니다.', 'No matching products.')} <a href="${L('contact.html')}">${t('찾는 제품을 문의해 주세요 →', 'Ask us →')}</a></div>`;
      };
      inp.oninput = draw;
      inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.value.trim()) location.href = L('products.html?q=' + encodeURIComponent(inp.value.trim())); };
      setTimeout(() => inp.focus(), 30);
    }
    S.openSearch = openSearch;

    /* ---------- Hero slideshow ---------- */
    if (pg === 'home') {
      const bgs = $$('#hero .hero-bg'), dots = $$('#hero .hero-dots button');
      if (bgs.length > 1) {
        let i = 0, tm;
        const show = (k) => { i = (k + bgs.length) % bgs.length; bgs.forEach((b, j) => b.classList.toggle('on', j === i)); dots.forEach((d, j) => d.classList.toggle('on', j === i)); };
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const loop = () => { clearInterval(tm); if (!reduce) tm = setInterval(() => show(i + 1), 6000); };
        dots.forEach((d, j) => (d.onclick = () => { show(j); loop(); }));
        document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(tm) : loop()));
        loop();
      }
    }

    /* ---------- Products: temperature comparison view ---------- */
    if (pg === 'products') {
      const head = $('.pl-head'), grid = $('#pl-grid');
      const sw = document.createElement('div'); sw.className = 'view-sw'; sw.setAttribute('role', 'tablist');
      sw.innerHTML = `<button type="button" data-v="list" class="on" role="tab">${IC.list}<span>${t('목록', 'List')}</span></button><button type="button" data-v="cmp" role="tab">${IC.chart}<span>${t('온도 범위 비교', 'Temperature range')}</span></button>`;
      head.insertAdjacentElement('afterend', sw);
      const cmp = document.createElement('div'); cmp.id = 'pl-cmp'; cmp.hidden = true; grid.insertAdjacentElement('afterend', cmp);
      const qp = new URLSearchParams(location.search); let view = qp.get('view') === 'cmp' ? 'cmp' : 'list', T = /^-?\d{1,4}$/.test(qp.get('t') || '') ? qp.get('t') : '';
      const f = (x) => Math.sign(x) * Math.log10(1 + Math.abs(x) / 25);
      const lo = f(-273), hi = f(2300), pos = (x) => ((f(x) - lo) / (hi - lo)) * 100;
      const ticks = [-253, -100, 0, 100, 300, 1000, 2200];
      function drawCmp() {
        // 카드 링크에서 제품 id 추출: product/<id>.html (정적) 또는 product.html?id=<id> (구형)
        const ids = $$('a.prod-card', grid).map((a) => { const h = a.getAttribute('href') || ''; const m = h.match(/product\/([^/?#]+)\.html/); return m ? decodeURIComponent(m[1]) : new URLSearchParams(h.split('?')[1]).get('id'); });
        const list = ids.map(prodBy).filter(Boolean);
        const Tn = T === '' ? null : Number(T);
        const ranged = list.filter((p) => typeof p.tmin === 'number'), none = list.filter((p) => typeof p.tmin !== 'number');
        const ok = (p) => Tn === null || (Tn >= p.tmin && Tn <= p.tmax);
        const match = ranged.filter(ok).length;
        // 입력창은 한 번만 만들고(재생성 시 커서가 앞으로 가 뒷자리부터 입력되는 문제 방지) 안내문·차트만 갱신
        if (!$('.cmp-t input', cmp)) {
          cmp.innerHTML = `<div class="cmp-top"><label class="cmp-t"><span>${t('필요한 사용 온도', 'Required operating temperature')}</span><input type="text" inputmode="numeric" pattern="-?[0-9]*" maxlength="5" autocomplete="off" placeholder="${t('예: -196', 'e.g. -196')}" value="${esc(T)}"><em>℃</em></label><p class="cmp-note"></p></div><div class="cmp-body"></div>`;
          const inp = $('.cmp-t input', cmp);
          inp.addEventListener('input', () => { const v = inp.value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, ''); if (v !== inp.value) { const c = inp.selectionStart; inp.value = v; try { inp.setSelectionRange(c - 1, c - 1); } catch (e) {} } T = /^-?\d{1,4}$/.test(v) ? v : ''; drawCmp(); });
        }
        $('.cmp-note', cmp).innerHTML = Tn === null ? t('온도를 입력하면 해당 온도에서 사용 가능한 제품만 강조됩니다.', 'Enter a temperature to highlight products rated for it.') : t(`${Tn}℃ 사용 가능 제품 <b>${match}</b>종`, `<b>${match}</b> products rated for ${Tn}℃`);
        $('.cmp-body', cmp).innerHTML = `<div class="cmp-chart" role="table" aria-label="${t('제품별 사용 온도 범위', 'Operating temperature range by product')}">
            <div class="cmp-axis" aria-hidden="true"><span class="cmp-lab"></span><div class="cmp-track">${ticks.map((x) => `<i style="left:${pos(x)}%"><b>${x}</b></i>`).join('')}${Tn !== null ? `<u class="cmp-mark" style="left:${pos(Tn)}%"><b>${Tn}℃</b></u>` : ''}</div><span class="cmp-act"></span></div>
            ${ranged.sort((a, b) => a.tmin - b.tmin).map((p) => { const c = catOf(p).color || '#e1251b'; const q = inQ(p.id); return `<div class="cmp-row ${ok(p) ? '' : 'dim'}" role="row"><a class="cmp-lab" role="rowheader" href="${L('product/' + encodeURIComponent(p.id) + '.html')}"><b>${esc(p.code)}</b><small>${esc(pname(p))}</small></a><div class="cmp-track" role="cell"><span class="cmp-bar" style="left:${pos(p.tmin)}%;width:${pos(p.tmax) - pos(p.tmin)}%;background:${esc(c)}"></span>${Tn !== null ? `<u class="cmp-mark" style="left:${pos(Tn)}%"></u>` : ''}<em class="cmp-val">${p.tmin} ~ ${p.tmax}℃</em></div><button type="button" class="cmp-act qadd ${q ? 'on' : ''}" data-id="${esc(p.id)}" aria-pressed="${q}" aria-label="${t('견적함 담기', 'Add to quote')}: ${esc(p.code)}">${q ? IC.check : IC.plus}</button></div>`; }).join('')}
          </div>
          ${none.length ? `<p class="cmp-none">${t('온도 범위 비교 대상 아님', 'Not temperature-rated')}: ${none.map((p) => `<a href="${L('product/' + encodeURIComponent(p.id) + '.html')}">${esc(p.code)}</a>`).join(', ')}</p>` : ''}
          <p class="cmp-src">${t('※ 카탈로그 사양 기준 작동 온도 범위(로그 스케일). 모델·옵션에 따라 다를 수 있습니다.', '※ Operating ranges per catalogue specifications (log scale). May vary by model and option.')}</p>`;
        $$('.qadd', cmp).forEach((b) => (b.onclick = () => { toggleQ(b.dataset.id); drawCmp(); }));
      }
      function setView(v) {
        view = v; $$('button', sw).forEach((b) => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
        grid.hidden = v === 'cmp'; cmp.hidden = v !== 'cmp'; if (v === 'cmp') drawCmp();
        const u = new URL(location.href); if (v === 'cmp') u.searchParams.set('view', 'cmp'); else u.searchParams.delete('view'); history.replaceState(null, '', u.pathname + u.search);
      }
      $$('button', sw).forEach((b) => (b.onclick = () => setView(b.dataset.v)));
      new MutationObserver(() => { if (view === 'cmp') drawCmp(); }).observe(grid, { childList: true });
      // keep view param when category/search changes (app.js rewrites the URL)
      const rs = history.replaceState.bind(history);
      history.replaceState = (st, ti, url) => { if (view === 'cmp' && typeof url === 'string' && !/view=cmp/.test(url)) url += (url.includes('?') ? '&' : '?') + 'view=cmp'; return rs(st, ti, url); };
      setView(view);
    }

    /* ---------- Product detail: quote / catalog page / print / share ---------- */
    if (pg === 'product') {
      const p = prodBy(document.body.dataset.pid || new URLSearchParams(location.search).get('id')) || D.products[0];
      const acts = $('.pd-actions');
      const tools = document.createElement('div'); tools.className = 'pd-tools';
      const pdf = D.settings.catalogPdf + (p.catalogPage ? '#page=' + p.catalogPage : '');
      const draw = () => {
        const q = inQ(p.id);
        tools.innerHTML = `<button type="button" class="tool qadd ${q ? 'on' : ''}" aria-pressed="${q}">${q ? IC.check : IC.plus}<span>${q ? t('견적함에 담김', 'In quote list') : t('견적함 담기', 'Add to quote')}</span></button>${p.catalogPage ? `<a class="tool" href="${esc(pdf)}" target="_blank" rel="noopener">${IC.book}<span>${t(`카탈로그 p.${p.catalogPage}`, `Catalog p.${p.catalogPage}`)}</span></a>` : ''}<button type="button" class="tool" data-a="print">${IC.print}<span>${t('사양서 인쇄', 'Print datasheet')}</span></button><button type="button" class="tool" data-a="share">${IC.link}<span>${t('링크 공유', 'Share link')}</span></button>`;
        $('.qadd', tools).onclick = () => { toggleQ(p.id); draw(); };
        $('[data-a=print]', tools).onclick = () => print();
        $('[data-a=share]', tools).onclick = async () => {
          const url = location.href.split('#')[0].replace(/[?&]preview=1/, '');
          if (navigator.share && matchMedia('(pointer:coarse)').matches) { try { await navigator.share({ title: document.title, url }); return; } catch (e) { return; } }
          try { await navigator.clipboard.writeText(url); S.toast(t('링크를 복사했습니다', 'Link copied')); } catch (e) { S.toast(url); }
        };
      };
      draw();
      if (acts) acts.insertAdjacentElement('afterend', tools);
      document.addEventListener('smg:quote', draw);
      // print-only datasheet header
      const c = D.company;
      document.body.insertAdjacentHTML('afterbegin', `<div class="print-head"><img src="assets/logo-mark.svg" alt="SMG"><div><b>${esc(c.name)}</b><span>${esc(c.address)}</span><span>TEL ${esc(c.tel)} · FAX ${esc(c.fax)} · ${esc(c.email)} · ${esc(c.website)}</span></div><div class="ph-meta">${t('제품 사양서', 'Product Datasheet')}<br>${new Date().toISOString().slice(0, 10)}</div></div>`);
      // breadcrumb structured data
      const cat = catOf(p); const base = location.href.split('?')[0].replace(/[^/]*$/, '');
      const ld = document.createElement('script'); ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: base + 'index.html' },
        { '@type': 'ListItem', position: 2, name: t('제품소개', 'Products'), item: base + 'products.html' },
        { '@type': 'ListItem', position: 3, name: cat.name, item: base + 'products.html?cat=' + cat.id },
        { '@type': 'ListItem', position: 4, name: p.code + ' ' + pname(p) }] });
      document.head.appendChild(ld);
    }

    /* ---------- Contact: quote list in the form ---------- */
    if (pg === 'contact') {
      const form = $('#inq-form'); if (!form) return;
      const box = document.createElement('div'); box.className = 'qbox field full'; box.id = 'quote';
      const hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = 'items'; form.appendChild(hidden);
      const grid = $('.form-grid', form); grid.insertAdjacentElement('afterbegin', box);
      const draw = () => {
        const a = getQ();
        hidden.value = a.map((x) => { const p = prodBy(x.id); return `- ${p.code} ${p.name} × ${x.qty}`; }).join('\n');
        if (!a.length) { box.innerHTML = `<div class="qbox-empty">${IC.quote}<span>${t('제품 상세 페이지에서 <b>견적함 담기</b>를 누르면 여러 제품을 한 번에 견적 요청할 수 있습니다.', 'Use <b>Add to quote</b> on product pages to request several products at once.')}</span><a href="${L('products.html')}">${t('제품 보기 →', 'Browse products →')}</a></div>`; return; }
        box.innerHTML = `<div class="qbox-h"><b>${IC.quote} ${t('견적 요청 품목', 'Quote items')} <em>${a.length}</em></b><button type="button" class="qclear">${t('전체 비우기', 'Clear all')}</button></div><ul>${a.map((x) => { const p = prodBy(x.id); return `<li><img src="${esc(S.img ? S.img.thumbSrc(p.images[0]) : p.images[0])}" alt="" loading="lazy"><a href="${L('product/' + encodeURIComponent(p.id) + '.html')}"><b>${esc(p.code)}</b><small>${esc(pname(p))}</small></a><label>${t('수량', 'Qty')}<input type="number" min="1" max="99999" value="${x.qty}" data-id="${esc(p.id)}" inputmode="numeric"></label><button type="button" class="qrm" data-id="${esc(p.id)}" aria-label="${t('삭제', 'Remove')}">${IC.x}</button></li>`; }).join('')}</ul><p class="qbox-n">${t('품목과 수량이 문의 내용에 함께 전달됩니다.', 'Items and quantities are sent with your inquiry.')}</p>`;
        $$('.qrm', box).forEach((b) => (b.onclick = () => { setQ(getQ().filter((x) => x.id !== b.dataset.id)); }));
        $$('input[type=number]', box).forEach((i) => (i.onchange = () => { const a2 = getQ(); const it = a2.find((x) => x.id === i.dataset.id); if (it) it.qty = Math.max(1, Math.min(99999, parseInt(i.value, 10) || 1)); setQ(a2); }));
        const cl = $('.qclear', box); if (cl) cl.onclick = () => { if (confirm(t('견적함을 비울까요?', 'Clear the quote list?'))) setQ([]); };
      };
      document.addEventListener('smg:quote', draw); draw();
      if (location.hash === '#quote') setTimeout(() => box.scrollIntoView({ block: 'center' }), 200);
      // when the product of interest is chosen and list is empty, nothing else changes; the select remains available
    }
  }
  window.SMG_EXTRAS = run;
  if (window.SMG && window.SMG.booted) run(document.body.dataset.page);
})();
