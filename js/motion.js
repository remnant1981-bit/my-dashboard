/* SMG Corporate Site — motion layer (progress bar, hero intro, temperature spectrum, spotlight, tilt, parallax, timeline) */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  function start() {
    const S = window.SMG; if (!S || S.motionDone) return; S.motionDone = true;
    const D = S.data, t = S.t, L = S.L, esc = S.esc, EN = S.EN;
    const pg = document.body.dataset.page;
    document.documentElement.classList.add('js-motion');

    /* 1. Scroll progress bar */
    const bar = document.createElement('div'); bar.className = 'scroll-prog'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    /* 6. Parallax targets */
    const par = reduce ? [] : $$('.split .media img, .sub-bg, #about .media img').map((el) => ({ el, k: el.classList.contains('sub-bg') ? 0.25 : 0.08 }));
    /* 7. History progress line */
    const hist = $('.history-v'); if (hist) hist.insertAdjacentHTML('afterbegin', '<span class="hv-fill" aria-hidden="true"></span>');
    const hfill = hist && $('.hv-fill', hist);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
        par.forEach(({ el, k }) => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const c = (r.top + r.height / 2 - innerHeight / 2) * -k; el.style.transform = `translate3d(0,${c.toFixed(1)}px,0) scale(${el.classList.contains('sub-bg') ? 1 : 1.12})`; });
        if (hfill) { const r = hist.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / r.height)); hfill.style.transform = `scaleY(${p})`; }
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

    /* 2. Hero intro: line-by-line rise + Ken Burns per slide */
    if (pg === 'home') {
      const h1 = $('#hero h1');
      if (h1 && !reduce) {
        const lines = h1.textContent.split('\n');
        h1.innerHTML = lines.map((l, i) => `<span class="hl"><span style="animation-delay:${0.15 + i * 0.12}s">${esc(l)}</span></span>`).join('');
        h1.setAttribute('aria-label', lines.join(' '));
        $$('#hero .eyebrow, #hero .lead, #hero .hero-cta, #hero .hero-stats').forEach((e, i) => { e.classList.add('h-in'); e.style.animationDelay = (i === 0 ? 0 : 0.45 + i * 0.12) + 's'; });
      }
    }

    /* 3. Temperature spectrum (home, signature interactive) */
    if (pg === 'home' && D.products.some((p) => typeof p.tmin === 'number')) {
      const host = $('#about') && $('#about').closest('section');
      const sec = document.createElement('section'); sec.className = 'sec spec-sec'; sec.id = 'spectrum';
      const MIN = -253, MAX = 2200;
      const f = (x) => Math.sign(x) * Math.log10(1 + Math.abs(x) / 25);
      const lo = f(-273), hi = f(2300); const pos = (x) => ((f(x) - lo) / (hi - lo)) * 100;
      const inv = (p) => { const v = lo + (p / 100) * (hi - lo); return Math.sign(v) * (Math.pow(10, Math.abs(v)) - 1) * 25; };
      const marks = [
        { x: -253, l: t('LH₂ · LN₂ · LNG 극저온', 'Cryogenic LH₂ · LN₂ · LNG'), a: 'l' }, { x: 25, l: t('상온', 'Room temp.') },
        { x: 400, l: t('반도체 공정', 'Semiconductor') }, { x: 2200, l: t('초고온 열전대', 'Ultra-high TC'), a: 'r' }
      ];
      const ticks = [-200, -100, 0, 100, 300, 1000];
      const rated = D.products.filter((p) => typeof p.tmin === 'number');
      sec.innerHTML = `<div class="container"><div class="sec-head rv"><div><span class="eyebrow">Temperature Coverage</span><h2 class="sec-title">${t('-253℃ 극저온부터<br>2,200℃ 초고온까지', 'From -253℃ cryogenic<br>to 2,200℃ ultra-high')}</h2></div><p class="sec-desc">${t('액화수소 피드스루부터 초고온 열전대까지, SMG 제품이 커버하는 온도 영역입니다. 띠 위에 마우스를 올리거나 터치해 해당 온도에서 사용 가능한 제품을 확인하세요.', 'The temperature range covered by SMG — from liquid-hydrogen feedthroughs to ultra-high-temperature thermocouples. Hover or tap the band to see which products are rated for that temperature.')}</p></div>
        <div class="spec rv" role="group" aria-label="${t('온도 스펙트럼', 'Temperature spectrum')}">
          <div class="spec-read" aria-live="polite"><b class="spec-num">-253</b><em>℃</em><span class="spec-cnt"></span></div>
          <div class="spec-band" tabindex="0" aria-label="${t('온도 선택 (좌우 화살표)', 'Select temperature (arrow keys)')}">
            <div class="spec-grad"></div><div class="spec-glow"></div>
            ${marks.map((m) => `<span class="spec-mk ${m.a ? 'al-' + m.a : ''}" style="left:${pos(m.x)}%" data-x="${m.x}"><i></i><b>${m.x.toLocaleString()}℃</b><small>${esc(m.l)}</small></span>`).join('')}
            <div class="spec-cur" aria-hidden="true"><i></i></div>
          </div>
          <div class="spec-axis" aria-hidden="true">${ticks.map((x) => `<span style="left:${pos(x)}%">${x}</span>`).join('')}</div>
          <div class="spec-prods"></div>
          <a class="btn btn-line spec-go" href="${L('products.html?view=cmp')}">${t('온도 범위로 제품 비교하기', 'Compare products by temperature')} ${S.I.arrow}</a>
        </div></div>`;
      if (host) host.insertAdjacentElement('beforebegin', sec); else $('#main').appendChild(sec);
      const band = $('.spec-band', sec), cur = $('.spec-cur', sec), num = $('.spec-num', sec), cnt = $('.spec-cnt', sec), prods = $('.spec-prods', sec), go = $('.spec-go', sec);
      let T = MIN, last = '';
      const render = (x, sweep) => {
        T = Math.round(Math.max(MIN, Math.min(MAX, x)));
        const p = pos(T); cur.style.left = p + '%'; sec.style.setProperty('--sp', p + '%');
        num.textContent = T.toLocaleString(EN ? 'en-US' : 'ko-KR');
        $$('.spec-mk', sec).forEach((m) => m.classList.toggle('pass', Number(m.dataset.x) <= T));
        const hit = rated.filter((q) => T >= q.tmin && T <= q.tmax);
        cnt.innerHTML = t(`사용 가능 제품 <b>${hit.length}</b>종`, `<b>${hit.length}</b> products rated`);
        const key = hit.map((q) => q.id).join();
        if (key !== last) {
          last = key;
          prods.innerHTML = hit.length ? hit.map((q, i) => `<a href="${L('product.html?id=' + encodeURIComponent(q.id))}" style="--d:${sweep ? 0 : i * 25}ms"><b>${esc(q.code)}</b>${esc(EN ? q.name : q.nameKo)}</a>`).join('') : `<span class="spec-none">${t('해당 온도는 맞춤 설계로 검토해 드립니다 →', 'Custom design available for this temperature →')} <a href="${L('contact.html')}">${t('문의', 'Contact')}</a></span>`;
        }
        go.href = L('products.html?view=cmp&t=' + T);
      };
      const fromEvent = (e) => { const r = band.getBoundingClientRect(); const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; return inv(Math.max(0, Math.min(100, (cx / r.width) * 100))); };
      let user = false, anim = 0;
      const stop = () => { user = true; cancelAnimationFrame(anim); sec.classList.add('live'); };
      band.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) { stop(); render(fromEvent(e)); } });
      band.addEventListener('pointerdown', (e) => { stop(); render(fromEvent(e)); });
      band.addEventListener('touchmove', (e) => { stop(); render(fromEvent(e)); }, { passive: true });
      band.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); stop(); const step = Math.abs(T) < 100 ? 5 : Math.abs(T) < 500 ? 25 : 100; render(T + (e.key === 'ArrowRight' ? step : -step)); } });
      // auto sweep once when entering the viewport
      const sweep = () => {
        if (reduce) { render(-196); return; }
        const t0 = performance.now(), dur = 3600, p0 = pos(MIN), p1 = pos(400);
        const stepF = (n) => { if (user) return; const k = Math.min(1, (n - t0) / dur); const e = 1 - Math.pow(1 - k, 3); render(inv(p0 + (p1 - p0) * e), true); if (k < 1) anim = requestAnimationFrame(stepF); else sec.classList.add('live'); };
        anim = requestAnimationFrame(stepF);
      };
      render(MIN, true);
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); setTimeout(sweep, 350); } }, { threshold: 0.35 });
      io.observe(band);
    }

    /* 4. Spotlight + 5. tilt (desktop pointers only) */
    if (fine && !reduce) {
      $$('.cat-card, .prod-card, .cert-grid > div, .values > div, .pcard, .ind-row').forEach((el) => el.classList.add('spot'));
      document.addEventListener('pointermove', (e) => {
        const el = e.target.closest && e.target.closest('.spot'); if (!el) return;
        const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        if (el.classList.contains('cat-card')) { const rx = ((e.clientY - r.top) / r.height - 0.5) * -5, ry = ((e.clientX - r.left) / r.width - 0.5) * 6; el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`; }
      }, { passive: true });
      $$('.cat-card').forEach((el) => el.addEventListener('pointerleave', () => { el.style.transform = ''; }));
    }

    /* 8. Section title reveal underline + stagger children */
    $$('.cat-grid, .cert-grid, .ind-grid, .values').forEach((g) => { Array.from(g.children).forEach((c, i) => { if (!c.style.transitionDelay) c.style.transitionDelay = Math.min(i, 8) * 55 + 'ms'; }); });
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } }), { threshold: 0.1 });
      $$('.sec-title, .eyebrow').forEach((e) => { if (!e.closest('#hero')) { e.classList.add('rv-t'); io2.observe(e); } });
      $$('#spectrum .rv').forEach((e) => io2.observe(e));
    }
  }
  // run after the main runtime has rendered
  const tryStart = () => { if (window.SMG && window.SMG.booted) start(); else setTimeout(tryStart, 30); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryStart); else tryStart();
})();
