/* SMG CMS — 정적 사이트용 관리자 (브라우저 내 편집 → 게시 파일 생성 / GitHub 직접 게시) */
(function () {
  'use strict';
  const DRAFT_KEY = 'smg_draft_v1', INQ_KEY = 'smg_inquiries_v1', GH_KEY = 'smg_gh_cfg', AUTH_KEY = 'smg_admin_auth';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { toast('브라우저 저장 공간이 부족합니다. 이미지 용량을 줄여주세요.'); return false; } }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const PUBLISHED = window.SMG_DEFAULT_DATA;
  let D;
  try { D = JSON.parse(ls.get(DRAFT_KEY)) || clone(PUBLISHED); } catch (e) { D = clone(PUBLISHED); }
  // 게시본 데이터 구조가 새 버전이면(카탈로그 개편 등) 이전 임시저장본은 폐기
  if ((D.version || 1) < (PUBLISHED.version || 1)) { D = clone(PUBLISHED); try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
  // schema migration: ensure all keys exist
  Object.keys(PUBLISHED).forEach((k) => { if (D[k] === undefined) D[k] = clone(PUBLISHED[k]); });
  Object.keys(PUBLISHED.settings).forEach((k) => { if (D.settings[k] === undefined) D.settings[k] = PUBLISHED.settings[k]; });

  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800); }
  function dirtyState() { return JSON.stringify(D) !== JSON.stringify(PUBLISHED); }
  function save() {
    D.updatedAt = new Date().toISOString().slice(0, 10);
    ls.set(DRAFT_KEY, JSON.stringify(D));
    const s = $('#save-state'); const d = dirtyState();
    s.textContent = d ? '임시저장됨 · 미게시 변경사항 있음' : '게시본과 동일'; s.classList.toggle('dirty', d);
  }

  /* ---------- Auth (정적 사이트용 간이 잠금) ---------- */
  async function sha(s) {
    if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); }
    let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'x' + h;
  }
  async function expectedHash() { return D.settings.adminHash || (await sha('smg1234!')); }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = (await sha($('#pw').value)) === (await expectedHash());
    if (!ok) { toast('비밀번호가 올바르지 않습니다'); $('#pw').select(); return; }
    try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (x) {}
    start();
  });
  let authed = false; try { authed = sessionStorage.getItem(AUTH_KEY) === '1'; } catch (e) {}
  if (authed) start();

  /* ---------- Menu ---------- */
  const MENU = [
    ['grp', '개요'], ['dash', '대시보드'], ['inq', '문의 관리'],
    ['grp', '콘텐츠'], ['products', '제품 관리'], ['categories', '제품 카테고리'], ['news', '공지사항'], ['downloads', '자료실'], ['faq', 'FAQ'],
    ['grp', '사이트 정보'], ['home', '메인 화면'], ['company', '회사 정보'], ['about', '회사소개 · 인증'], ['history', '연혁'], ['apps', '적용분야 · 파트너'],
    ['grp', '시스템'], ['settings', '설정'], ['publish', '게시 · 백업']
  ];
  let cur = 'dash';
  function inquiries() { try { return JSON.parse(ls.get(INQ_KEY) || '[]'); } catch (e) { return []; } }
  function drawMenu() {
    const n = inquiries().filter((q) => q.status === '신규').length;
    $('#menu').innerHTML = MENU.map(([k, l]) => k === 'grp' ? `<div class="grp">${l}</div>` : `<button data-k="${k}" class="${cur === k ? 'on' : ''}">${l}${k === 'inq' && n ? `<span class="cnt">${n}</span>` : ''}</button>`).join('');
    $$('#menu button').forEach((b) => (b.onclick = () => { go(b.dataset.k); $('.side').classList.remove('open'); }));
  }
  function go(k) { cur = k; drawMenu(); const v = VIEWS[k]; $('#page-title').textContent = MENU.find((m) => m[0] === k)[1]; $('#content').innerHTML = ''; v($('#content')); scrollTo(0, 0); try { history.replaceState(null, '', '#' + k); } catch (e) {} }

  function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    drawMenu(); save();
    const h = location.hash.slice(1); go(VIEWS[h] ? h : 'dash');
    $('#logout').onclick = () => { try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {} location.reload(); };
    $('#menu-btn').onclick = () => $('.side').classList.toggle('open');
    $('#btn-preview').onclick = () => { try { sessionStorage.setItem('smg_preview', '1'); } catch (e) {} window.open('index.html?preview=1', '_blank'); };
    $('#btn-publish').onclick = () => go('publish');
    addEventListener('beforeunload', (e) => { if (dirtyState()) { e.preventDefault(); e.returnValue = ''; } });
  }

  /* ---------- Field renderer ---------- */
  // field: {k, label, type, full, opts, hint}
  function fieldHTML(f, val) {
    const id = 'f_' + f.k;
    const lab = `<span>${esc(f.label)}</span>`;
    const hint = f.hint ? `<small>${esc(f.hint)}</small>` : '';
    const cls = 'f' + (f.full ? ' full' : '');
    switch (f.type) {
      case 'textarea': return `<label class="${cls}">${lab}<textarea data-k="${f.k}" rows="${f.rows || 4}">${esc(val)}</textarea>${hint}</label>`;
      case 'select': return `<label class="${cls}">${lab}<select data-k="${f.k}">${f.opts().map((o) => `<option value="${esc(o[0])}" ${o[0] === val ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>${hint}</label>`;
      case 'check': return `<label class="${cls} chk"><input type="checkbox" data-k="${f.k}" ${val ? 'checked' : ''}> ${esc(f.label)}</label>`;
      case 'list': return `<div class="${cls}">${lab}<div data-list="${f.k}">${(val || []).map((v) => listRow(v)).join('')}</div><button type="button" class="b b-line b-sm" data-add="${f.k}" style="justify-self:start">+ 항목 추가</button>${hint}</div>`;
      case 'pairs': return `<div class="${cls}">${lab}<div data-pairs="${f.k}">${(val || []).map((v) => pairRow(v)).join('')}</div><button type="button" class="b b-line b-sm" data-addp="${f.k}" style="justify-self:start">+ 행 추가</button>${hint}</div>`;
      case 'images': return `<div class="${cls}">${lab}<div class="imgs" data-imgs="${f.k}">${imgsInner(val || [], true)}</div><small>첫 번째 이미지가 대표 이미지입니다. 업로드 시 자동으로 최대 1400px WebP로 압축됩니다. 이미지를 클릭하면 대표로 지정됩니다.</small></div>`;
      case 'image': return `<div class="${cls}">${lab}<div class="imgs" data-img="${f.k}">${imgsInner(val ? [val] : [], false)}</div><input data-k="${f.k}" value="${esc(val && val.startsWith('data:') ? '(업로드 이미지)' : val)}" placeholder="assets/img/파일명.webp" ${val && val.startsWith('data:') ? 'readonly' : ''}>${hint}</div>`;
      case 'file': return `<div class="${cls}">${lab}<div style="display:flex;gap:8px"><input data-k="${f.k}" value="${esc(val)}" placeholder="assets/파일명.pdf 또는 https://..." style="flex:1"><label class="b b-line">파일 선택<input type="file" data-file="${f.k}" hidden></label></div><small>권장: 파일을 저장소 assets 폴더에 올리고 경로를 입력. 2MB 이하 파일은 직접 첨부 가능.</small></div>`;
      default: return `<label class="${cls}">${lab}<input type="${f.type || 'text'}" data-k="${f.k}" value="${esc(val)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>${hint}</label>`;
    }
  }
  const listRow = (v) => `<div class="li-row"><div class="mv"><button type="button" data-up>▲</button><button type="button" data-down>▼</button></div><input value="${esc(v)}"><button type="button" class="b b-del b-sm" data-rm>삭제</button></div>`;
  const pairRow = (v) => `<div class="li-row"><div class="mv"><button type="button" data-up>▲</button><button type="button" data-down>▼</button></div><input value="${esc(v[0])}" placeholder="항목" style="flex:.6"><input value="${esc(v[1])}" placeholder="값"><button type="button" class="b b-del b-sm" data-rm>삭제</button></div>`;
  function imgsInner(arr, multi) {
    return arr.map((src, i) => `<div class="im" data-src="${esc(src)}" ${multi ? 'title="클릭: 대표 이미지로"' : ''}><img src="${esc(src)}" alt="">${multi && i === 0 ? '<span class="first">대표</span>' : ''}<button type="button" data-rmimg aria-label="삭제">×</button></div>`).join('') + ((multi || !arr.length) ? `<label>＋<br>이미지 업로드<input type="file" accept="image/*" ${multi ? 'multiple' : ''} hidden></label>` : '');
  }
  function bindFields(root) {
    root.addEventListener('click', (e) => {
      const t = e.target;
      if (t.dataset.add !== undefined) { $(`[data-list="${t.dataset.add}"]`, root).insertAdjacentHTML('beforeend', listRow('')); }
      if (t.dataset.addp !== undefined) { $(`[data-pairs="${t.dataset.addp}"]`, root).insertAdjacentHTML('beforeend', pairRow(['', ''])); }
      if (t.hasAttribute('data-rm')) t.closest('.li-row').remove();
      if (t.hasAttribute('data-up')) { const r = t.closest('.li-row'); if (r.previousElementSibling) r.parentNode.insertBefore(r, r.previousElementSibling); }
      if (t.hasAttribute('data-down')) { const r = t.closest('.li-row'); if (r.nextElementSibling) r.parentNode.insertBefore(r.nextElementSibling, r); }
      if (t.hasAttribute('data-rmimg')) { const box = t.closest('.imgs'); t.closest('.im').remove(); if (box.dataset.img) { box.innerHTML = imgsInner([], false); const inp = $(`input[data-k="${box.dataset.img}"]`, root); inp.value = ''; inp.readOnly = false; } else refreshFirst(box); }
      const im = t.closest('.imgs[data-imgs] .im'); if (im && !t.hasAttribute('data-rmimg')) { im.parentNode.prepend(im); refreshFirst(im.parentNode); }
    });
    root.addEventListener('change', async (e) => {
      const t = e.target;
      if (t.type === 'file' && t.closest('.imgs')) {
        const box = t.closest('.imgs');
        for (const file of t.files) {
          const url = await compress(file); if (!url) continue;
          if (box.dataset.img) { box.innerHTML = imgsInner([url], false); const inp = $(`input[data-k="${box.dataset.img}"]`, root); inp.value = '(업로드 이미지)'; inp.readOnly = true; }
          else { box.querySelector('label').insertAdjacentHTML('beforebegin', `<div class="im" data-src="${url}"><img src="${url}" alt=""><button type="button" data-rmimg>×</button></div>`); refreshFirst(box); }
        }
      }
      if (t.dataset.file) {
        const file = t.files[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast('2MB 초과 파일은 assets 폴더에 업로드 후 경로를 입력하세요'); return; }
        const r = new FileReader(); r.onload = () => { $(`input[data-k="${t.dataset.file}"]`, root).value = r.result; toast('파일 첨부됨'); }; r.readAsDataURL(file);
      }
    });
    root.addEventListener('input', (e) => { const t = e.target; if (t.dataset.k && t.closest('.f') && t.closest('.f').querySelector('[data-img]') && !t.readOnly) { const box = t.closest('.f').querySelector('[data-img]'); box.innerHTML = imgsInner(t.value ? [t.value] : [], false); } });
  }
  function refreshFirst(box) { $$('.first', box).forEach((x) => x.remove()); const f = $('.im', box); if (f) f.insertAdjacentHTML('beforeend', '<span class="first">대표</span>'); }
  function compress(file) {
    return new Promise((res) => {
      if (!file.type.startsWith('image/')) { toast('이미지 파일만 가능합니다'); return res(null); }
      const r = new FileReader();
      r.onload = () => { const img = new Image(); img.onload = () => {
        const max = 1400, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        let u = c.toDataURL('image/webp', 0.82); if (!u.startsWith('data:image/webp')) u = c.toDataURL('image/jpeg', 0.85);
        res(u);
      }; img.onerror = () => res(null); img.src = r.result; };
      r.readAsDataURL(file);
    });
  }
  function readFields(root, fields, target) {
    fields.forEach((f) => {
      if (f.type === 'list') target[f.k] = $$(`[data-list="${f.k}"] .li-row input`, root).map((i) => i.value.trim()).filter(Boolean);
      else if (f.type === 'pairs') target[f.k] = $$(`[data-pairs="${f.k}"] .li-row`, root).map((r) => $$('input', r).map((i) => i.value.trim())).filter((p) => p[0] || p[1]);
      else if (f.type === 'images') target[f.k] = $$(`[data-imgs="${f.k}"] .im`, root).map((i) => i.dataset.src);
      else if (f.type === 'image') { const im = $(`[data-img="${f.k}"] .im`, root); target[f.k] = im ? im.dataset.src : ($(`input[data-k="${f.k}"]`, root).value.trim()); }
      else if (f.type === 'check') target[f.k] = $(`[data-k="${f.k}"]`, root).checked;
      else if (f.type === 'number') target[f.k] = Number($(`[data-k="${f.k}"]`, root).value) || 0;
      else { const el = $(`[data-k="${f.k}"]`, root); if (el) target[f.k] = el.value.trim(); }
    });
    return target;
  }

  /* ---------- Drawer (항목 편집) ---------- */
  function drawer(title, fields, obj, onSave, onDelete) {
    const bg = document.createElement('div'); bg.className = 'drawer-bg';
    bg.innerHTML = `<div class="drawer" role="dialog" aria-modal="true"><header><h3>${esc(title)}</h3><button class="b b-ghost" data-x>✕</button></header><div class="body"><div class="fg">${fields.map((f) => fieldHTML(f, obj[f.k])).join('')}</div></div><footer>${onDelete ? '<button class="b b-del" data-del style="margin-right:auto">삭제</button>' : ''}<button class="b b-line" data-x>취소</button><button class="b b-pri" data-save>저장</button></footer></div>`;
    document.body.appendChild(bg);
    const body = $('.body', bg); bindFields(body);
    const close = () => bg.remove();
    $$('[data-x]', bg).forEach((b) => (b.onclick = close));
    bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
    $('[data-save]', bg).onclick = () => { const o = readFields(body, fields, clone(obj)); const err = onSave(o); if (err) { toast(err); return; } close(); };
    if (onDelete) $('[data-del]', bg).onclick = () => { if (confirm('정말 삭제하시겠습니까?')) { onDelete(); close(); } };
    const first = $('input,textarea,select', body); if (first) first.focus();
  }

  /* ---------- Generic collection view ---------- */
  function collection(el, cfg) {
    const arr = cfg.get();
    let q = '', fc = '';
    el.innerHTML = `<div class="card"><div class="card-head"><div><h2>${esc(cfg.title)}</h2><div class="desc" style="margin:0">${esc(cfg.desc || '')}</div></div><div class="toolbar"><input type="search" placeholder="검색" data-q>${cfg.filter ? `<select data-fc><option value="">전체</option>${cfg.filter.opts().map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>` : ''}<button class="b b-pri" data-new>+ 새 항목</button></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr>${cfg.sortable !== false ? '<th style="width:60px">순서</th>' : ''}${cfg.cols.map((c) => `<th>${esc(c[1])}</th>`).join('')}<th style="text-align:right">관리</th></tr></thead><tbody></tbody></table></div></div>`;
    const tb = $('tbody', el);
    function draw() {
      const k = q.toLowerCase();
      tb.innerHTML = arr.map((o, i) => ({ o, i })).filter(({ o }) => (!k || JSON.stringify(o).toLowerCase().includes(k)) && (!fc || o[cfg.filter.k] === fc)).map(({ o, i }) => `<tr>${cfg.sortable !== false ? `<td><button class="b b-ghost b-sm" data-up="${i}" title="위로">▲</button><button class="b b-ghost b-sm" data-down="${i}" title="아래로">▼</button></td>` : ''}${cfg.cols.map((c) => `<td>${c[2] ? c[2](o) : esc(o[c[0]])}</td>`).join('')}<td><div class="act"><button class="b b-line b-sm" data-ed="${i}">편집</button>${cfg.extra ? cfg.extra(o, i) : ''}<button class="b b-del b-sm" data-rm="${i}">삭제</button></div></td></tr>`).join('') || `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:40px">항목이 없습니다</td></tr>`;
    }
    draw();
    $('[data-q]', el).oninput = (e) => { q = e.target.value; draw(); };
    if (cfg.filter) $('[data-fc]', el).onchange = (e) => { fc = e.target.value; draw(); };
    const commit = () => { save(); draw(); };
    $('[data-new]', el).onclick = () => drawer('새 ' + cfg.item, cfg.fields, cfg.blank(), (o) => { const e = cfg.validate && cfg.validate(o, -1); if (e) return e; arr.unshift(o); commit(); toast('추가되었습니다'); });
    tb.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.ed !== undefined) { const i = +d.ed; drawer(cfg.item + ' 편집', cfg.fields, arr[i], (o) => { const er = cfg.validate && cfg.validate(o, i); if (er) return er; arr[i] = o; commit(); toast('저장되었습니다'); }, () => { arr.splice(i, 1); commit(); }); }
      if (d.rm !== undefined) { if (confirm('삭제하시겠습니까?')) { arr.splice(+d.rm, 1); commit(); toast('삭제되었습니다'); } }
      if (d.up !== undefined) { const i = +d.up; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; commit(); } }
      if (d.down !== undefined) { const i = +d.down; if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; commit(); } }
      if (d.dup !== undefined) { const c = clone(arr[+d.dup]); c.id = c.id + '-copy'; arr.splice(+d.dup + 1, 0, c); commit(); toast('복제되었습니다'); }
    };
  }

  /* ---------- Single-object form view ---------- */
  function formCard(el, title, desc, fields, target, after) {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = `<h2>${esc(title)}</h2><div class="desc">${esc(desc || '')}</div><div class="fg">${fields.map((f) => fieldHTML(f, target[f.k])).join('')}</div><div style="margin-top:18px;display:flex;justify-content:flex-end"><button class="b b-pri" data-s>변경사항 저장</button></div>`;
    el.appendChild(c); bindFields(c);
    $('[data-s]', c).onclick = () => { readFields(c, fields, target); if (after) after(); save(); toast('저장되었습니다 (게시 전 임시저장)'); };
    return c;
  }

  const catOpts = () => D.categories.map((c) => [c.id, c.name]);
  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const thumb = (src) => src ? `<img src="${esc(src)}" alt="">` : '';

  /* ---------- Views ---------- */
  const VIEWS = {
    dash(el) {
      const inq = inquiries(); const nNew = inq.filter((q) => q.status === '신규').length;
      el.innerHTML = `${dirtyState() ? '<div class="note warn"><b>미게시 변경사항이 있습니다.</b> 편집 내용은 이 브라우저에만 임시저장되어 있으며, [게시하기]를 해야 방문자에게 반영됩니다.</div>' : ''}
        <div class="kpis"><div class="kpi"><span>등록 제품</span><b>${D.products.length}</b></div><div class="kpi"><span>카테고리</span><b>${D.categories.length}</b></div><div class="kpi"><span>공지사항</span><b>${D.news.length}</b></div><div class="kpi"><span>신규 문의</span><b style="color:${nNew ? 'var(--red)' : 'inherit'}">${nNew}</b></div></div>
        <div class="card"><h2>빠른 작업</h2><div class="desc">자주 쓰는 관리 기능</div><div class="quick">
        <button data-go="products"><b>제품 등록·수정</b><span>사진, 사양, 인증, 주문코드</span></button>
        <button data-go="news"><b>공지사항 작성</b><span>뉴스·인증 취득 소식</span></button>
        <button data-go="inq"><b>문의 확인</b><span>견적·기술 문의 처리</span></button>
        <button data-go="home"><b>메인 화면 수정</b><span>대표 문구, 이미지, 수치</span></button>
        <button data-go="downloads"><b>자료실 관리</b><span>카탈로그·인증서 파일</span></button>
        <button data-go="publish"><b>게시하기</b><span>변경사항을 사이트에 반영</span></button></div></div>
        <div class="card"><h2>최근 문의</h2><div class="desc">이 브라우저에 접수된 최근 문의 5건 (외부 폼 서비스 연동 시 메일함에서도 확인)</div>${inq.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>접수일</th><th>유형</th><th>회사</th><th>담당자</th><th>상태</th></tr></thead><tbody>${inq.slice(0, 5).map((q) => `<tr><td>${esc(q.createdAt.slice(0, 10))}</td><td>${esc(q.type)}</td><td>${esc(q.company)}</td><td>${esc(q.name)}</td><td>${statusBadge(q.status)}</td></tr>`).join('')}</tbody></table></div>` : '<p style="color:var(--muted)">접수된 문의가 없습니다.</p>'}</div>
        <div class="card"><h2>운영 가이드</h2><ol class="steps"><li>왼쪽 메뉴에서 콘텐츠를 편집하면 <b>자동 임시저장</b>됩니다.</li><li>상단 <b>[미리보기]</b>로 실제 화면을 확인합니다.</li><li><b>[게시하기]</b> → GitHub 직접 게시 또는 <code>site-data.js</code> 파일을 내려받아 서버의 <code>data/</code> 폴더에 덮어씁니다.</li><li>문의 메일 수신은 [설정]에서 폼 수신 주소(Formspree 등)를 등록하세요.</li></ol></div>`;
      $$('[data-go]', el).forEach((b) => (b.onclick = () => go(b.dataset.go)));
    },

    inq(el) {
      const all = inquiries(); let fs = '';
      el.innerHTML = `<div class="note">홈페이지 문의는 <b>[설정] → 폼 수신 주소</b>로 실시간 전송(메일 수신)되며, 동일 브라우저에서 접수된 건은 여기에도 기록됩니다. 폼 수신 주소가 없으면 방문자의 메일 앱으로 대표 메일에 발송됩니다.</div>
      <div class="card"><div class="card-head"><div><h2>문의 목록</h2><div class="desc" style="margin:0">총 ${all.length}건</div></div><div class="toolbar"><select data-fs><option value="">전체 상태</option><option>신규</option><option>처리중</option><option>완료</option></select><button class="b b-line" data-csv>엑셀(CSV) 다운로드</button></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>접수일시</th><th>유형</th><th>관심제품</th><th>회사 / 담당자</th><th>연락처</th><th>상태</th><th style="text-align:right">관리</th></tr></thead><tbody></tbody></table></div></div>`;
      const tb = $('tbody', el);
      const persist = () => { ls.set(INQ_KEY, JSON.stringify(all)); drawMenu(); };
      function draw() {
        tb.innerHTML = all.map((q, i) => ({ q, i })).filter(({ q }) => !fs || q.status === fs).map(({ q, i }) => `<tr><td>${esc(q.createdAt.replace('T', ' ').slice(0, 16))}</td><td>${esc(q.type)}</td><td>${esc(q.product || '-')}</td><td><b>${esc(q.company)}</b><br>${esc(q.name)}</td><td>${esc(q.phone)}<br><a href="mailto:${esc(q.email)}">${esc(q.email)}</a></td><td><select data-st="${i}">${['신규', '처리중', '완료'].map((s) => `<option ${s === q.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><div class="act"><button class="b b-line b-sm" data-v="${i}">보기</button><a class="b b-dark b-sm" href="mailto:${esc(q.email)}?subject=${encodeURIComponent('[SMG] 문의 회신: ' + q.type)}">회신</a><button class="b b-del b-sm" data-rm="${i}">삭제</button></div></td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:40px">문의가 없습니다</td></tr>';
      }
      draw();
      $('[data-fs]', el).onchange = (e) => { fs = e.target.value; draw(); };
      tb.onchange = (e) => { if (e.target.dataset.st) { all[+e.target.dataset.st].status = e.target.value; persist(); toast('상태 변경됨'); } };
      tb.onclick = (e) => { const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.rm) { if (confirm('삭제하시겠습니까?')) { all.splice(+b.dataset.rm, 1); persist(); draw(); } }
        if (b.dataset.v) { const q = all[+b.dataset.v]; const bg = document.createElement('div'); bg.className = 'drawer-bg'; bg.innerHTML = `<div class="drawer"><header><h3>${esc(q.type)} · ${esc(q.company)}</h3><button class="b b-ghost" data-x>✕</button></header><div class="body"><table class="tbl">${[['접수일시', q.createdAt.replace('T', ' ').slice(0, 19)], ['관심제품', q.product || '-'], ['회사명', q.company], ['담당자', q.name], ['연락처', q.phone], ['이메일', q.email], ['수량/납기', q.qty || '-']].map((r) => `<tr><th>${r[0]}</th><td>${esc(r[1])}</td></tr>`).join('')}</table><h4 style="margin-top:20px">문의 내용</h4><div class="inq-detail">${esc(q.message)}</div></div><footer><a class="b b-pri" href="mailto:${esc(q.email)}?subject=${encodeURIComponent('[SMG] 문의 회신: ' + q.type)}">메일 회신</a><a class="b b-line" href="tel:${esc(q.phone)}">전화</a></footer></div>`; document.body.appendChild(bg); $('[data-x]', bg).onclick = () => bg.remove(); bg.onmousedown = (ev) => { if (ev.target === bg) bg.remove(); }; if (q.status === '신규') { q.status = '처리중'; persist(); draw(); } }
      };
      $('[data-csv]', el).onclick = () => {
        const cols = ['createdAt', 'status', 'type', 'product', 'company', 'name', 'phone', 'email', 'qty', 'message'];
        const head = ['접수일시', '상태', '유형', '관심제품', '회사명', '담당자', '연락처', '이메일', '수량/납기', '내용'];
        const csv = [head, ...all.map((q) => cols.map((c) => q[c] || ''))].map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
        download('﻿' + csv, `SMG_문의목록_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
      };
    },

    products(el) {
      collection(el, {
        title: '제품 관리', desc: '제품을 추가·수정·삭제하고 순서를 변경합니다. ▲▼로 표시 순서 조정.', item: '제품', get: () => D.products,
        filter: { k: 'category', opts: catOpts },
        cols: [['img', '사진', (o) => thumb(o.images && o.images[0])], ['code', '모델', (o) => `<b>${esc(o.code)}</b><br><span style="color:var(--muted);font-size:12.5px">${esc(o.name)}</span>`], ['nameKo', '제품명'], ['category', '카테고리', (o) => esc((D.categories.find((c) => c.id === o.category) || {}).name || o.category)], ['featured', '메인노출', (o) => o.featured ? '<span class="badge green">노출</span>' : '<span class="badge">-</span>'], ['link', '보기', (o) => `<a href="product.html?id=${encodeURIComponent(o.id)}&preview=1" target="_blank">↗</a>`]],
        extra: (o, i) => `<button class="b b-line b-sm" data-dup="${i}">복제</button>`,
        fields: [
          { k: 'code', label: '모델명 (예: FX, TX)' }, { k: 'category', label: '카테고리', type: 'select', opts: catOpts },
          { k: 'nameKo', label: '제품명 (국문)' }, { k: 'name', label: '제품명 (영문)' },
          { k: 'id', label: '고유 ID (URL용, 영문/숫자/-)', hint: '비워두면 모델명으로 자동 생성' }, { k: 'orderCode', label: 'Sample Ordering Code' },
          { k: 'summary', label: '한 줄 요약', type: 'textarea', full: true, rows: 2 },
          { k: 'images', label: '제품 이미지', type: 'images', full: true },
          { k: 'features', label: '주요 특징', type: 'list', full: true },
          { k: 'applications', label: '적용 분야', type: 'textarea', full: true, rows: 2 },
          { k: 'installation', label: '설치 방법', type: 'textarea', full: true, rows: 3 },
          { k: 'notice', label: '주의사항 (선택)', type: 'textarea', full: true, rows: 2, hint: '입력 시 상세 페이지에 주황색 박스로 표시' },
          { k: 'specs', label: '사양 (항목 / 값)', type: 'pairs', full: true },
          { k: 'certs', label: '인증', type: 'list', full: true },
          { k: 'featured', label: '메인 화면 "주요 제품"에 노출', type: 'check', full: true }
        ],
        blank: () => ({ id: '', category: D.categories[0] ? D.categories[0].id : '', code: '', name: '', nameKo: '', summary: '', images: [], features: [], applications: '', installation: '', notice: '', certs: [], specs: [], orderCode: '', featured: false }),
        validate: (o, i) => {
          if (!o.code) return '모델명을 입력하세요';
          o.id = slug(o.id || o.code) || ('p' + Date.now());
          if (D.products.some((p, j) => p.id === o.id && j !== i)) return '이미 사용 중인 ID입니다: ' + o.id;
          if (!o.images.length) return '이미지를 1개 이상 등록하세요';
        }
      });
    },

    categories(el) {
      collection(el, {
        title: '제품 카테고리', desc: '제품 분류. ID 변경 시 해당 제품들의 카테고리도 함께 변경됩니다.', item: '카테고리', get: () => D.categories,
        cols: [['image', '이미지', (o) => thumb(o.image)], ['name', '이름', (o) => `<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${esc(o.color || '#ccc')};margin-right:6px"></span><b>${esc(o.name)}</b><br><span style="color:var(--muted)">${esc(o.nameEn)}</span>`], ['id', 'ID'], ['cnt', '제품 수', (o) => D.products.filter((p) => p.category === o.id).length]],
        fields: [{ k: 'name', label: '이름 (국문)' }, { k: 'nameEn', label: '이름 (영문)' }, { k: 'id', label: 'ID (영문)', hint: '예: temperature' }, { k: 'color', label: '대표 색상', type: 'color', hint: '카드 상단 라인·라벨 색상' }, { k: 'desc', label: '설명', type: 'textarea', full: true, rows: 2 }, { k: 'image', label: '대표 이미지', type: 'image', full: true }],
        blank: () => ({ id: '', name: '', nameEn: '', desc: '', image: '', color: '#e1251b' }),
        validate: (o, i) => { if (!o.name) return '이름을 입력하세요'; o.id = slug(o.id || o.nameEn) || ('c' + Date.now()); if (D.categories.some((c, j) => c.id === o.id && j !== i)) return '중복 ID'; if (i >= 0 && D.categories[i].id !== o.id) D.products.forEach((p) => { if (p.category === D.categories[i].id) p.category = o.id; }); }
      });
    },

    news(el) {
      collection(el, {
        title: '공지사항', desc: '고정(📌) 글은 항상 맨 위에 표시. 나머지는 날짜 최신순 자동 정렬.', item: '공지', get: () => D.news, sortable: false,
        cols: [['date', '날짜'], ['category', '분류', (o) => `<span class="badge red">${esc(o.category)}</span>`], ['title', '제목', (o) => (o.pinned ? '📌 ' : '') + esc(o.title)]],
        fields: [{ k: 'title', label: '제목', full: true }, { k: 'date', label: '날짜', type: 'date' }, { k: 'category', label: '분류', hint: '예: 공지, 인증, 자료, 전시회' }, { k: 'body', label: '내용', type: 'textarea', full: true, rows: 10 }, { k: 'pinned', label: '상단 고정', type: 'check' }],
        blank: () => ({ id: 'n' + Date.now(), date: new Date().toISOString().slice(0, 10), category: '공지', title: '', body: '', pinned: false }),
        validate: (o) => { if (!o.title) return '제목을 입력하세요'; }
      });
    },

    downloads(el) {
      collection(el, {
        title: '자료실', desc: '카탈로그, 인증서, 도면 등 다운로드 파일', item: '자료', get: () => D.downloads,
        cols: [['type', '형식', (o) => `<span class="badge">${esc(o.type)}</span>`], ['title', '제목'], ['file', '파일', (o) => o.file && o.file.startsWith('data:') ? '(첨부파일)' : `<a href="${esc(o.file)}" target="_blank">${esc(o.file)}</a>`]],
        fields: [{ k: 'title', label: '제목', full: true }, { k: 'desc', label: '설명', full: true }, { k: 'type', label: '형식', hint: 'PDF, DWG, ZIP 등' }, { k: 'file', label: '파일', type: 'file', full: true }],
        blank: () => ({ title: '', desc: '', file: '', type: 'PDF' }),
        validate: (o) => { if (!o.title || !o.file) return '제목과 파일을 입력하세요'; }
      });
    },

    faq(el) {
      collection(el, { title: 'FAQ', item: 'FAQ', get: () => D.faq, cols: [['q', '질문'], ['a', '답변', (o) => esc(o.a.slice(0, 60)) + (o.a.length > 60 ? '…' : '')]],
        fields: [{ k: 'q', label: '질문', full: true }, { k: 'a', label: '답변', type: 'textarea', full: true, rows: 6 }], blank: () => ({ q: '', a: '' }), validate: (o) => { if (!o.q) return '질문을 입력하세요'; } });
    },

    history(el) {
      collection(el, { title: '연혁', desc: '연도 내림차순으로 정렬하세요 (▲▼)', item: '연혁', get: () => D.history, cols: [['year', '연도', (o) => `<b>${esc(o.year)}</b>`], ['items', '내용', (o) => o.items.map(esc).join('<br>')]],
        fields: [{ k: 'year', label: '연도' }, { k: 'items', label: '내용', type: 'list', full: true }], blank: () => ({ year: String(new Date().getFullYear()), items: [] }), validate: (o) => { if (!o.year) return '연도를 입력하세요'; } });
    },

    apps(el) {
      const a = document.createElement('div'), b = document.createElement('div'), c = document.createElement('div'), p = document.createElement('div'); el.append(a, p, b, c);
      if (!D.partnerCards) D.partnerCards = [];
      collection(p, { title: '글로벌 파트너 카드 (회사소개)', item: '파트너', get: () => D.partnerCards, cols: [['image', '이미지', (o) => thumb(o.image)], ['title', '제목'], ['desc', '설명']], fields: [{ k: 'title', label: '제목', full: true }, { k: 'desc', label: '설명', type: 'textarea', full: true, rows: 2 }, { k: 'image', label: '이미지 (인증서 등)', type: 'image', full: true }], blank: () => ({ title: '', desc: '', image: '' }) });
      collection(a, { title: '산업별 적용분야', item: '적용분야', get: () => D.industries, cols: [['image', '이미지', (o) => thumb(o.image)], ['title', '제목'], ['desc', '설명']], fields: [{ k: 'title', label: '제목' }, { k: 'desc', label: '설명' }, { k: 'image', label: '이미지', type: 'image', full: true }], blank: () => ({ title: '', desc: '', image: '' }) });
      collection(b, { title: '방산부품 적용처', desc: '비워두면 적용분야 페이지에서 방산 섹션이 자동으로 숨겨집니다.', item: '방산 적용처', get: () => D.defense, cols: [['image', '이미지', (o) => thumb(o.image)], ['title', '적용처']], fields: [{ k: 'title', label: '적용처', full: true }, { k: 'image', label: '이미지', type: 'image', full: true }], blank: () => ({ title: '', image: '' }) });
      formCard(c, '파트너 (메인 하단 롤링)', '한 줄에 하나씩', [{ k: 'partners', label: '파트너명', type: 'list', full: true }], D);
    },

    home(el) {
      formCard(el, '메인 비주얼', '홈페이지 첫 화면 대표 문구와 배경 이미지', [
        { k: 'eyebrow', label: '상단 소제목', full: true }, { k: 'title', label: '메인 타이틀', type: 'textarea', full: true, rows: 2, hint: '줄바꿈이 그대로 반영됩니다' },
        { k: 'subtitle', label: '서브 문구', type: 'textarea', full: true, rows: 2 }, { k: 'ctaPrimary', label: '버튼1 문구' }, { k: 'ctaSecondary', label: '버튼2 문구' },
        { k: 'image', label: '배경 이미지 (가로형 권장)', type: 'image', full: true }], D.hero);
      const c = document.createElement('div'); c.className = 'card'; el.appendChild(c);
      const drawStats = () => {
        c.innerHTML = `<h2>핵심 수치</h2><div class="desc">메인 비주얼 하단 숫자 (숫자는 카운트업 애니메이션)</div>${D.stats.map((s, i) => `<div class="fg" style="grid-template-columns:1fr 1fr 2fr auto;align-items:end;margin-bottom:10px"><label class="f"><span>숫자</span><input data-i="${i}" data-f="value" value="${esc(s.value)}"></label><label class="f"><span>단위</span><input data-i="${i}" data-f="suffix" value="${esc(s.suffix)}"></label><label class="f"><span>설명</span><input data-i="${i}" data-f="label" value="${esc(s.label)}"></label><button class="b b-del" data-rm="${i}">삭제</button></div>`).join('')}<div style="display:flex;gap:8px;justify-content:flex-end"><button class="b b-line" data-add>+ 추가</button><button class="b b-pri" data-s>저장</button></div>`;
        $('[data-add]', c).onclick = () => { D.stats.push({ value: '0', suffix: '', label: '' }); drawStats(); };
        $$('[data-rm]', c).forEach((b) => (b.onclick = () => { D.stats.splice(+b.dataset.rm, 1); save(); drawStats(); }));
        $('[data-s]', c).onclick = () => { $$('input[data-i]', c).forEach((i) => (D.stats[+i.dataset.i][i.dataset.f] = i.value.trim())); save(); toast('저장되었습니다'); };
      };
      drawStats();
    },

    company(el) {
      formCard(el, '회사 기본 정보', '헤더·푸터·문의 페이지·지도에 자동 반영', [
        { k: 'name', label: '회사명 (국문)' }, { k: 'nameEn', label: '회사명 (영문)' }, { k: 'brand', label: '로고 텍스트' }, { k: 'brandSub', label: '로고 하단 텍스트' },
        { k: 'ceo', label: '대표자명', hint: '입력 시 푸터에 표시' }, { k: 'bizNo', label: '사업자등록번호', hint: '입력 시 푸터에 표시 (전자상거래 표시 권장)' },
        { k: 'founded', label: '설립연도', type: 'number' }, { k: 'website', label: '웹사이트' },
        { k: 'tel', label: '대표전화' }, { k: 'fax', label: '팩스' }, { k: 'email', label: '대표 이메일' }, { k: 'hours', label: '운영시간' },
        { k: 'address', label: '주소 (국문)', full: true }, { k: 'addressEn', label: '주소 (영문)', full: true }, { k: 'mapQuery', label: '지도 검색어', full: true, hint: '지도에 표시할 주소/장소명' }], D.company);
    },

    about(el) {
      const a = D.about;
      formCard(el, '회사소개 / CEO 인사말', '', [{ k: 'title', label: '타이틀', full: true }, { k: 'body', label: '본문 문단', type: 'list', full: true, hint: '문단별로 입력' }, { k: 'image', label: '대표 이미지', type: 'image', full: true }], a);
      const v = document.createElement('div'); const ce = document.createElement('div'); el.append(v, ce);
      collection(v, { title: '핵심 가치 (4개 권장)', item: '가치', get: () => a.values, cols: [['title', '제목'], ['desc', '설명']], fields: [{ k: 'title', label: '제목' }, { k: 'desc', label: '설명' }], blank: () => ({ title: '', desc: '' }) });
      collection(ce, { title: '인증 현황', item: '인증', get: () => D.certifications, cols: [['name', '인증명', (o) => `<b>${esc(o.name)}</b>`], ['desc', '설명']], fields: [{ k: 'name', label: '인증명' }, { k: 'desc', label: '설명' }], blank: () => ({ name: '', desc: '' }) });
    },

    settings(el) {
      const s = D.settings;
      formCard(el, '문의 폼 수신', '방문자 문의를 메일로 받기 위한 설정', [
        { k: 'formEndpoint', label: '폼 수신 주소 (Endpoint URL)', full: true, ph: 'https://formspree.io/f/xxxxxxx', hint: 'Formspree·Getform·Web3Forms 등 JSON POST를 받는 서비스 주소. 비워두면 방문자 메일 앱으로 발송.' },
        { k: 'notifyEmail', label: '문의 수신 이메일 (메일 앱 방식)', full: true }], s);
      formCard(el, '메인 팝업', '홈페이지 첫 화면 공지 팝업 ("오늘 하루 보지 않기" 지원)', [{ k: 'showPopup', label: '팝업 사용', type: 'check', full: true }, { k: 'popupTitle', label: '팝업 제목', full: true }, { k: 'popupBody', label: '팝업 내용', type: 'textarea', full: true }], s);
      formCard(el, '기타', '', [{ k: 'catalogPdf', label: '대표 카탈로그 PDF 경로', full: true }, { k: 'gaId', label: 'Google Analytics 측정 ID', ph: 'G-XXXXXXXXXX', full: true }], s);
      const c = document.createElement('div'); c.className = 'card'; el.appendChild(c);
      c.innerHTML = `<h2>관리자 비밀번호 변경</h2><div class="desc">변경 후 [게시하기]해야 다른 기기에도 적용됩니다.</div><div class="fg"><label class="f"><span>새 비밀번호 (8자 이상)</span><input type="password" id="np1" autocomplete="new-password"></label><label class="f"><span>새 비밀번호 확인</span><input type="password" id="np2" autocomplete="new-password"></label></div><div style="margin-top:14px;display:flex;justify-content:flex-end"><button class="b b-pri" id="npb">변경</button></div><div class="note warn" style="margin:16px 0 0">정적 호스팅 특성상 이 잠금은 간이 보호입니다. 실제 운영 시 호스팅의 접근 제한(예: Netlify/Cloudflare Access, 서버 Basic Auth)으로 <code>admin.html</code>을 추가 보호하세요.</div>`;
      $('#npb').onclick = async () => { const a = $('#np1').value, b = $('#np2').value; if (a.length < 8) return toast('8자 이상 입력하세요'); if (a !== b) return toast('비밀번호가 일치하지 않습니다'); s.adminHash = await sha(a); save(); toast('비밀번호가 변경되었습니다'); $('#np1').value = $('#np2').value = ''; };
    },

    publish(el) {
      let gh = {}; try { gh = JSON.parse(ls.get(GH_KEY) || '{}'); } catch (e) {}
      const changed = dirtyState();
      el.innerHTML = `<div class="note ${changed ? 'warn' : ''}">${changed ? '<b>미게시 변경사항이 있습니다.</b> 아래 방법 중 하나로 게시하세요.' : '현재 임시저장 내용이 게시본과 동일합니다.'}</div>
      <div class="card"><h2>방법 1. GitHub 직접 게시 (권장)</h2><div class="desc">GitHub Pages/Netlify/Vercel 등 저장소 연동 호스팅 사용 시, 버튼 한 번으로 <code>data/site-data.js</code>를 커밋하여 1~2분 내 사이트에 반영됩니다.</div>
        <div class="fg"><label class="f"><span>저장소 (owner/repo)</span><input id="gh-repo" value="${esc(gh.repo || 'remnant1981-bit/my-dashboard')}"></label><label class="f"><span>브랜치</span><input id="gh-br" value="${esc(gh.branch || 'main')}"></label>
        <label class="f full"><span>GitHub Personal Access Token</span><input id="gh-tok" type="password" placeholder="github_pat_... (Contents: Read & Write 권한)" autocomplete="off"><small>토큰은 저장되지 않으며 이 창을 닫으면 사라집니다. GitHub → Settings → Developer settings → Fine-grained tokens에서 해당 저장소 Contents 쓰기 권한으로 발급.</small></label></div>
        <div style="margin-top:14px;display:flex;justify-content:flex-end"><button class="b b-pri" id="gh-go">GitHub에 게시</button></div></div>
      <div class="card"><h2>방법 2. 파일 내려받아 업로드</h2><div class="desc">일반 웹호스팅(FTP) 사용 시: 파일을 내려받아 서버의 <code>data/site-data.js</code>에 덮어쓰기.</div><button class="b b-dark" id="dl-js">site-data.js 내려받기</button></div>
      <div class="card"><h2>백업 · 복원</h2><div class="desc">전체 콘텐츠를 JSON으로 백업하거나 복원합니다.</div><div class="toolbar"><button class="b b-line" id="bk">백업(JSON) 다운로드</button><label class="b b-line">백업 파일 복원<input type="file" id="rs" accept=".json,application/json" hidden></label><button class="b b-del" id="rv">임시저장 폐기 (게시본으로 되돌리기)</button></div></div>`;
      $('#dl-js').onclick = () => { download(buildJS(), 'site-data.js', 'text/javascript;charset=utf-8'); toast('다운로드 완료 → 서버 data 폴더에 업로드하세요'); };
      $('#bk').onclick = () => download(JSON.stringify(D, null, 2), `SMG_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      $('#rs').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); if (!o.products || !o.company) throw 0; D = o; save(); toast('복원되었습니다'); go('dash'); } catch (x) { toast('올바른 백업 파일이 아닙니다'); } }; r.readAsText(f); };
      $('#rv').onclick = () => { if (!confirm('임시저장된 모든 편집 내용을 폐기하고 현재 게시본으로 되돌립니다. 계속할까요?')) return; ls.del(DRAFT_KEY); D = clone(PUBLISHED); save(); toast('게시본으로 되돌렸습니다'); go('publish'); };
      $('#gh-go').onclick = async () => {
        const repo = $('#gh-repo').value.trim(), br = $('#gh-br').value.trim(), tok = $('#gh-tok').value.trim();
        if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !br || !tok) return toast('저장소, 브랜치, 토큰을 확인하세요');
        ls.set(GH_KEY, JSON.stringify({ repo, branch: br }));
        const btn = $('#gh-go'); btn.disabled = true; btn.textContent = '게시 중...';
        const api = `https://api.github.com/repos/${repo}/contents/data/site-data.js`;
        const H = { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json' };
        try {
          let sha0; const g = await fetch(api + '?ref=' + encodeURIComponent(br), { headers: H }); if (g.ok) sha0 = (await g.json()).sha; else if (g.status !== 404) throw new Error('조회 실패 (' + g.status + ')');
          const content = btoa(unescape(encodeURIComponent(buildJS())));
          const p = await fetch(api, { method: 'PUT', headers: H, body: JSON.stringify({ message: 'CMS: 홈페이지 콘텐츠 업데이트 (' + new Date().toLocaleString('ko-KR') + ')', content, branch: br, sha: sha0 }) });
          if (!p.ok) { const j = await p.json().catch(() => ({})); throw new Error((j.message || '') + ' (' + p.status + ')'); }
          toast('게시 완료! 1~2분 후 사이트에 반영됩니다');
          btn.textContent = '게시 완료 ✓';
        } catch (err) { toast('게시 실패: ' + err.message); btn.textContent = 'GitHub에 게시'; }
        btn.disabled = false;
      };
    }
  };

  function statusBadge(s) { return `<span class="badge ${s === '신규' ? 'red' : s === '완료' ? 'green' : 'amber'}">${esc(s)}</span>`; }
  function buildJS() {
    return `/* SMG 홈페이지 콘텐츠 데이터 — 관리자(admin.html)에서 생성 · ${new Date().toISOString()} */\nwindow.SMG_DEFAULT_DATA = ${JSON.stringify(D, null, 2)};\n`;
  }
  function download(text, name, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
})();
