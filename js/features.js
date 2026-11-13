/* SMG Corporate Site — features: company video, download lead form, certificate originals, spec comparison, cases (reference) page */
(function () {
  'use strict';
  function start() {
    const S = window.SMG; if (!S || S.featuresDone) return; S.featuresDone = true;
    const D = S.data, t = S.t, esc = S.esc, L = S.L, EN = S.EN, st = D.settings || {};
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const page = document.body.dataset.page;
    const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    const pname = (p) => (EN ? p.name : p.nameKo || p.name);
    const catOf = (p) => D.categories.find((c) => c.id === p.category) || {};
    const prodBy = (id) => D.products.find((p) => p.id === id);
    const pHref = (p) => L('product/' + encodeURIComponent(p.id) + '.html');
    const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
    const modal = (html, cls) => {
      const m = document.createElement('div'); m.className = 'modal open ' + (cls || '');
      m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" type="button" aria-label="${t('닫기', 'Close')}">×</button>${html}</div>`;
      document.body.appendChild(m);
      const close = () => { m.remove(); document.removeEventListener('keydown', onk); };
      const onk = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onk);
      $('.modal-x', m).onclick = close; m.addEventListener('click', (e) => { if (e.target === m) close(); });
      return { m, close };
    };

    /* ---------- 1. Company / factory video (YouTube, loads only on click) ---------- */
    const ytId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); return m ? m[1] : ''; };
    const vid = ytId((EN && st.videoUrlEn) || st.videoUrl); // 영문 페이지는 영문 영상이 있으면 그것을, 없으면 국문 영상을 사용
    const anchor = page === 'about' ? ($('#overview') && $('#overview').closest('section')) : null;
    // 메인 화면: 히어로 우측의 작은 카드 (모바일은 버튼 아래). 누르면 큰 플레이어가 레이어로 열림
    const heroBox = page === 'home' && st.videoOnHome ? $('#hero .container') : null;
    if (vid && heroBox) {
      const title = (EN ? st.videoTitleEn : st.videoTitle) || t('SMG 회사·공장 소개', 'SMG company & factory');
      const card = document.createElement('button'); card.type = 'button'; card.className = 'hero-video'; card.setAttribute('aria-label', t('영상 재생', 'Play video') + ': ' + title);
      card.innerHTML = `<span class="hv-thumb"><img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" width="480" height="360" decoding="async"><svg class="hv-play" viewBox="0 0 68 48" aria-hidden="true"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#e1251b"/><path d="M27 34l18-10-18-10z" fill="#fff"/></svg></span><span class="hv-cap"><b>${esc(title)}</b><small>${t('눌러서 재생', 'Click to play')}</small></span>`;
      const cta = $('.hero-cta', heroBox);
      if (cta) cta.after(card); else heroBox.appendChild(card);
      card.onclick = () => modal(`<div class="yt on"><iframe src="https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`, 'yt-modal');
    }
    if (vid && anchor) {
      const title = (EN ? st.videoTitleEn : st.videoTitle) || t('SMG 회사·공장 소개', 'SMG company & factory');
      const sec = document.createElement('section'); sec.className = 'sec video-sec';
      sec.innerHTML = `<div class="container"><div class="sec-head"><div><span class="eyebrow">Video</span><h2 class="sec-title">${esc(title)}</h2></div></div>
        <div class="yt" data-id="${vid}"><img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="${esc(title)}" loading="lazy" decoding="async"><button type="button" class="yt-play" aria-label="${t('영상 재생', 'Play video')}"><svg viewBox="0 0 68 48" aria-hidden="true"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#e1251b"/><path d="M45 24 27 14v20z" fill="#fff"/></svg></button></div></div>`;
      anchor.after(sec);
      $('.yt', sec).onclick = function () { this.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`; this.classList.add('on'); };
    }

    /* ---------- 2. Download lead form (자료 다운로드 시 연락처) ---------- */
    const gate = st.downloadGate || 'off';
    if (gate !== 'off') {
      const files = new Set((D.downloads || []).map((d) => String(d.file || '').split('#')[0]).filter((f) => f && !/^data:/.test(f)));
      if (st.catalogPdf) files.add(String(st.catalogPdf).split('#')[0]);
      const titleOf = (href) => { const d = (D.downloads || []).find((x) => String(x.file || '').split('#')[0] === href); return d ? d.title : href === String(st.catalogPdf).split('#')[0] ? 'SMG Products Catalogue' : href.split('/').pop(); };
      document.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.dataset.gateOk || ss.get('smg_dl_ok')) return;
        const raw = a.getAttribute('href') || '', href = raw.split('#')[0];
        if (!files.has(href)) return;
        e.preventDefault(); e.stopPropagation();
        const go = () => { ss.set('smg_dl_ok', '1'); a.dataset.gateOk = '1'; a.click(); delete a.dataset.gateOk; };
        const title = titleOf(href);
        const { m, close } = modal(`<span class="chip">Download</span><h3 style="margin-top:12px">${esc(title)}</h3>
          <p class="dg-desc">${t('자료를 받으시는 분의 정보를 남겨주시면 제품 업데이트·기술 자료를 안내해 드립니다.', 'Leave your details and we will keep you updated with product and technical information.')}</p>
          <form class="dg-form" novalidate><input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
            <label>${t('회사명', 'Company')}<span class="req">*</span><input name="company" required autocomplete="organization"></label>
            <label>${t('성함', 'Name')}<span class="req">*</span><input name="name" required autocomplete="name"></label>
            <label>${t('이메일', 'Email')}<span class="req">*</span><input name="email" type="email" required autocomplete="email"></label>
            <label>${t('연락처 (선택)', 'Phone (optional)')}<input name="phone" type="tel" autocomplete="tel"></label>
            <label class="dg-agree"><input type="checkbox" name="agree" required> <span>${t('[필수] 개인정보 수집·이용 동의 — 항목: 회사명·성함·이메일·연락처 / 목적: 자료 제공 기록 및 제품·기술 정보 안내 / 보유: 3년', '[Required] I consent to the collection of company, name, email and phone to record this download and receive product information (retained 3 years).')} <a href="${L('privacy.html')}" target="_blank" rel="noopener">${t('전문', 'Policy')}</a></span></label>
            <p class="dg-err" hidden></p>
            <div class="dg-act">${gate === 'optional' ? `<button type="button" class="btn btn-line btn-sm dg-skip">${t('건너뛰고 받기', 'Skip & download')}</button>` : ''}<button class="btn btn-primary btn-sm">${t('정보 남기고 받기', 'Submit & download')}</button></div></form>`, 'dg-modal');
        const f = $('form', m);
        if ($('.dg-skip', m)) $('.dg-skip', m).onclick = () => { close(); go(); };
        f.onsubmit = (ev) => {
          ev.preventDefault();
          const d = Object.fromEntries(new FormData(f).entries());
          const err = !d.company.trim() || !d.name.trim() ? t('회사명과 성함을 입력해 주세요', 'Please enter company and name') : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) ? t('이메일을 확인해 주세요', 'Please check your email') : !d.agree ? t('개인정보 수집·이용에 동의해 주세요', 'Please agree to the privacy terms') : '';
          if (err) { const p = $('.dg-err', m); p.textContent = err; p.hidden = false; return; }
          if (!d.website && S.sendInquiry) S.sendInquiry(`[${t('자료 다운로드', 'Download')}] ${title} - ${d.company}`, { type: t('자료 다운로드', 'Download'), source: 'download', company: d.company.trim(), name: d.name.trim(), email: d.email.trim(), phone: (d.phone || '').trim(), message: `${t('다운로드 자료', 'File')}: ${title}\n${href}` });
          if (!d.website) ss.set('smg_dl_who', JSON.stringify({ company: d.company.trim(), name: d.name.trim(), email: d.email.trim() })); // 같은 방문 중 다운로드 이력에 회사명 표시
          close(); S.toast(t('감사합니다. 다운로드를 시작합니다.', 'Thank you. Your download is starting.')); go();
        };
        setTimeout(() => { const i = $('input[name=company]', m); if (i) i.focus(); }, 50);
      }, true);
    }

    /* ---------- 3. Certificate originals + validity ---------- */
    const certs = D.certifications || [];
    ['#certs', '#cert-list'].forEach((sel) => {
      const box = $(sel); if (!box) return;
      Array.from(box.children).forEach((el, i) => {
        const c = certs[i]; if (!c) return;
        const extra = [];
        if (c.certNo) extra.push(`<small class="ct-no">No. ${esc(c.certNo)}</small>`);
        if (c.validUntil) extra.push(c.validUntil >= today ? `<small class="ct-valid">${t('유효기간', 'Valid until')} ${esc(c.validUntil)}</small>` : `<small class="ct-valid exp">${t('갱신 확인 중', 'Renewal in progress')}</small>`);
        if (c.file) extra.push(`<button type="button" class="ct-view" data-ci="${i}">${S.I.dl || ''}${t('인증서 원본 보기', 'View certificate')}</button>`);
        if (extra.length) el.insertAdjacentHTML('beforeend', `<div class="ct-extra">${extra.join('')}</div>`);
      });
      box.addEventListener('click', (e) => {
        const b = e.target.closest('.ct-view'); if (!b) return;
        const c = certs[+b.dataset.ci]; const f = String(c.file || '');
        if (/\.pdf($|[?#])/i.test(f) || /^data:application\/pdf/.test(f) || /^https?:/i.test(f) && !/\.(png|jpe?g|webp|gif)($|\?)/i.test(f)) window.open(f, '_blank', 'noopener');
        else S.lightbox(f, [f]);
      });
    });

    /* ---------- 4. Spec comparison (compare.html?ids=a,b,c) ---------- */
    const cmpLink = (ids) => L('compare.html' + (ids && ids.length ? '?ids=' + ids.map(encodeURIComponent).join(',') : ''));
    if (page === 'product') {
      const tools = $('.pd-tools'); const pid = document.body.dataset.pid || new URLSearchParams(location.search).get('id');
      if (tools && pid) tools.insertAdjacentHTML('beforeend', `<a class="tool" href="${cmpLink([pid])}">${'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v18M16 3v18M3 8h5M16 16h5"/></svg>'}<span>${t('사양 비교', 'Compare specs')}</span></a>`);
    }
    if (page === 'products') {
      const sw = $('.view-sw') || $('[role=tablist]');
      if (sw) sw.insertAdjacentHTML('afterend', `<a class="cmp-entry" href="${cmpLink([])}">${t('제품 사양 비교', 'Compare specs')} →</a>`);
    }
    if (page === 'compare') {
      const root = $('#compare');
      let ids = (new URLSearchParams(location.search).get('ids') || '').split(',').map((x) => decodeURIComponent(x.trim())).filter((x) => prodBy(x)).slice(0, 3);
      const opts = (sel) => `<option value="">${t('— 제품 선택 —', '— Select a product —')}</option>` + D.categories.map((c) => `<optgroup label="${esc(EN ? c.nameEn || c.name : c.name)}">${D.products.filter((p) => p.category === c.id).map((p) => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.code)} · ${esc(pname(p))}</option>`).join('')}</optgroup>`).join('');
      const draw = () => {
        history.replaceState(null, '', location.pathname + (ids.length ? '?ids=' + ids.map(encodeURIComponent).join(',') : ''));
        const ps = ids.map(prodBy).filter(Boolean);
        const slots = [0, 1, 2].map((i) => `<label class="cp-slot"><span>${t('제품', 'Product')} ${i + 1}</span><select data-slot="${i}">${opts(ids[i] || '')}</select></label>`).join('');
        let table = `<p class="cp-empty">${t('비교할 제품을 2개 이상 선택하세요.', 'Select two or more products to compare.')}</p>`;
        if (ps.length) {
          const specKeys = []; ps.forEach((p) => (p.specs || []).forEach((r) => { if (r && r[0] && specKeys.indexOf(r[0]) < 0) specKeys.push(r[0]); }));
          const row = (label, cells, diff) => `<tr class="${diff ? 'diff' : ''}"><th scope="row">${label}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
          const same = (arr) => arr.every((x) => x === arr[0]);
          const tr = (p) => (typeof p.tmin === 'number' ? `${p.tmin} ~ ${p.tmax}℃` : '-');
          const rows = [
            row('', ps.map((p) => `<a href="${pHref(p)}" class="cp-head"><img src="${esc(S.img ? S.img.thumbSrc(p.images[0]) : p.images[0])}" alt="" loading="lazy"><b>${esc(p.code)}</b><span>${esc(pname(p))}</span></a>`)),
            row(t('카테고리', 'Category'), ps.map((p) => esc(EN ? catOf(p).nameEn || catOf(p).name : catOf(p).name))),
            row(t('사용 온도', 'Temperature'), ps.map(tr), ps.length > 1 && !same(ps.map(tr))),
            row(t('개요', 'Summary'), ps.map((p) => esc(p.summary || '-'))),
            ...specKeys.map((k) => { const v = ps.map((p) => { const r = (p.specs || []).find((x) => x[0] === k); return r ? r[1] : '-'; }); return row(esc(k), v.map(esc), ps.length > 1 && !same(v)); }),
            row(t('인증', 'Certification'), ps.map((p) => (p.certs && p.certs.length ? p.certs.map((c) => `<span class="cp-tag">${esc(c)}</span>`).join('') : '-'))),
            row(t('적용 분야', 'Applications'), ps.map((p) => esc(p.applications || '-'))),
            row('', ps.map((p) => `<a class="btn btn-dark btn-sm" href="${pHref(p)}">${t('상세 보기', 'Details')}</a> <a class="btn btn-line btn-sm" href="${L('contact.html?product=' + encodeURIComponent(p.code + ' ' + p.name))}">${t('견적 문의', 'Quote')}</a>`)),
          ];
          table = `<div class="cp-scroll"><table class="cp-table cols-${ps.length}">${rows.join('')}</table></div><p class="cp-note">${t('※ 색으로 표시된 줄은 제품 간 값이 다른 항목입니다. 상세 사양은 카탈로그·상담으로 확인해 주세요.', '※ Highlighted rows differ between products. Please confirm details with the catalogue or our engineers.')}</p>`;
        }
        root.innerHTML = `<div class="cp-slots">${slots}</div>${table}`;
        $$('select[data-slot]', root).forEach((s) => (s.onchange = () => { const i = +s.dataset.slot; const next = ids.slice(); next[i] = s.value; ids = next.filter((x, k, a) => x && a.indexOf(x) === k).slice(0, 3); draw(); }));
      };
      draw();
    }

    /* ---------- 5. Cases / references (hidden until settings.casesEnabled) ---------- */
    if (page === 'cases') {
      const root = $('#cases'); const on = !!st.casesEnabled || !!S.preview;
      if (!st.casesEnabled) { const mr = document.createElement('meta'); mr.name = 'robots'; mr.content = 'noindex,nofollow'; document.head.appendChild(mr); }
      if (!on) { root.innerHTML = `<p class="cs-empty">${t('준비 중인 페이지입니다.', 'This page is coming soon.')}</p><div class="nt-actions"><a class="btn btn-dark" href="${L('index.html')}">${t('홈으로', 'Home')}</a></div>`; return; }
      const list = (D.cases || []).filter((c) => !c.hidden);
      if (S.preview && !st.casesEnabled) root.insertAdjacentHTML('beforebegin', `<div class="cs-preview">${t('미리보기: 아직 공개되지 않은 페이지입니다 (관리자 [설정]에서 공개)', 'Preview: not public yet')}</div>`);
      const inds = [...new Set(list.map((c) => c.industry).filter(Boolean))];
      let f = '';
      const draw = () => {
        const xs = list.filter((c) => !f || c.industry === f);
        root.innerHTML = (inds.length > 1 ? `<div class="cs-filter">${['', ...inds].map((x) => `<button type="button" class="${x === f ? 'on' : ''}" data-f="${esc(x)}">${x ? esc(x) : t('전체', 'All')}</button>`).join('')}</div>` : '') +
          (xs.length ? `<div class="cs-grid">${xs.map((c) => `<article class="cs-card" tabindex="0" data-cid="${esc(c.id)}">${c.images && c.images[0] ? `<div class="cs-img"><img ${S.img ? S.img.rimg(c.images[0], '(max-width:640px) 90vw, 400px') : `src="${esc(c.images[0])}"`} alt="" loading="lazy" decoding="async"></div>` : ''}<div class="cs-body"><div class="cs-meta">${c.industry ? `<span class="chip">${esc(c.industry)}</span>` : ''}${c.year ? `<time>${esc(c.year)}</time>` : ''}</div><h3>${esc(c.title)}</h3>${c.client && c.clientPublic ? `<p class="cs-client">${esc(c.client)}</p>` : ''}<p>${esc(c.summary || '')}</p></div></article>`).join('')}</div>` : `<p class="cs-empty">${t('등록된 사례가 없습니다.', 'No cases yet.')}</p>`);
        $$('.cs-filter button', root).forEach((b) => (b.onclick = () => { f = b.dataset.f; draw(); }));
        $$('.cs-card', root).forEach((card) => { const open = () => { const c = list.find((x) => x.id === card.dataset.cid); if (!c) return;
          const ps = (c.products || []).map(prodBy).filter(Boolean);
          modal(`<div class="cs-meta">${c.industry ? `<span class="chip">${esc(c.industry)}</span>` : ''}${c.year ? `<time>${esc(c.year)}</time>` : ''}</div><h3>${esc(c.title)}</h3>${c.client && c.clientPublic ? `<p class="cs-client">${esc(c.client)}</p>` : ''}${(c.images || []).map((im) => `<img class="cs-photo" src="${esc(im)}" alt="" loading="lazy">`).join('')}<p class="cs-text">${esc(c.body || c.summary || '')}</p>${ps.length ? `<div class="cs-prods"><b>${t('적용 제품', 'Products')}</b>${ps.map((p) => `<a href="${pHref(p)}">${esc(p.code)} ${esc(pname(p))}</a>`).join('')}</div>` : ''}`, 'cs-modal'); };
          card.onclick = open; card.onkeydown = (e) => { if (e.key === 'Enter') open(); }; });
      };
      draw();
    }
  }
  const tryStart = () => { if (window.SMG && window.SMG.booted) start(); else setTimeout(tryStart, 30); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryStart); else tryStart();
})();
