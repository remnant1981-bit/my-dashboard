// =========================================================
// 도면 BOM 뷰어
// - 도면(PDF/이미지) 위 벌룬(부품 번호) 클릭 → BOM 정보 표시
// - 모든 파일은 브라우저 안에서만 처리 (서버 업로드 없음)
// =========================================================

const LIBS = {
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
};

// 헤더 자동 인식 패턴
const COL = {
  item: /^(도면\s*item|item|no\.?|번호|품번|balloon|벌룬)$/i,
  name: /품명|품목|parts?|name|description/i,
  spec: /사양|규격|spec/i,
  qty: /수량|q'?ty/i,
  status: /수량\s*확인|확인|상태|status|신뢰도/i,
  bomRef: /^(매칭\s*)?bom\s*no\.?$/i
};

const state = {
  project: emptyProject(),
  selected: null,
  scale: 1,
  tx: 0,
  ty: 0,
  edit: false,
  pdfPage: null
};

function emptyProject() {
  return {
    name: '',
    drawingNo: '',
    image: null,          // dataURL
    width: 0,
    height: 0,
    hotspots: [],         // { item, x, y, r }  x,y,r = 도면 폭/높이 대비 %
    columns: [],          // 주 BOM 컬럼명
    extraTitle: '',       // 연계 시트명
    extraColumns: [],
    rows: []              // { item, data:{}, extra:[{}] }
  };
}

const $ = id => document.getElementById(id);
const els = {
  viewport: $('viewport'), canvas: $('canvas'), img: $('drawingImg'),
  layer: $('hotspotLayer'), empty: $('emptyMsg'), zoomLabel: $('zoomLabel'),
  detail: $('detailCard'), head: $('bomHead'), body: $('bomBody'),
  count: $('bomCount'), search: $('bomSearch'), summary: $('summary')
};

// ---------------------------------------------------------
// 유틸
// ---------------------------------------------------------
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function normItem(v) {
  return String(v ?? '').trim().replace(/\s+/g, '').toUpperCase();
}

function itemSortKey(item) {
  return item.split('-').map(s => String(parseInt(s, 10) || 0).padStart(4, '0') + s).join('-');
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove('show'), 3000);
}

const loadedScripts = {};
function loadScript(src) {
  if (!loadedScripts[src]) {
    loadedScripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('라이브러리 로드 실패: ' + src));
      document.head.appendChild(s);
    });
  }
  return loadedScripts[src];
}

function readFile(file, as) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    if (as === 'buffer') r.readAsArrayBuffer(file);
    else if (as === 'dataurl') r.readAsDataURL(file);
    else r.readAsText(file, 'utf-8');
  });
}

function classifyStatus(v) {
  const s = String(v ?? '');
  if (!s) return '';
  if (/불일치|NG|미확인|누락/i.test(s)) return 'bad';
  if (/필요|보류|참고/.test(s)) return 'warn';
  if (/일치|OK|확정/i.test(s)) return 'ok';
  return '';
}

// ---------------------------------------------------------
// 저장 (IndexedDB — 도면 이미지가 커서 localStorage 대신 사용)
// ---------------------------------------------------------
const DB = {
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('smg-bom-viewer', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async get(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction('kv').objectStore('kv').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async set(key, val) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(val, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
};

let saveTimer = null;
function saveProject() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    DB.set('project', state.project).catch(() => showToast('⚠️ 브라우저 저장 실패 — 프로젝트 저장(JSON) 이용'));
  }, 400);
}

// ---------------------------------------------------------
// 도면 로드
// ---------------------------------------------------------
async function loadDrawingFile(file) {
  state.pdfPage = null;
  $('autoDetectBtn').disabled = true;

  if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
    showToast('📐 PDF 렌더링 중...');
    await loadScript(LIBS.pdfjs);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
    const buf = await readFile(file, 'buffer');
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    // 긴 변 약 4000px 로 렌더 (A1 도면도 확대 시 판독 가능)
    const scale = Math.min(4000 / Math.max(base.width, base.height), 4);
    const viewport = page.getViewport({ scale });
    const cv = document.createElement('canvas');
    cv.width = Math.round(viewport.width);
    cv.height = Math.round(viewport.height);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    setDrawing(cv.toDataURL('image/png'), cv.width, cv.height);
    state.pdfPage = page;
    $('autoDetectBtn').disabled = false;
    state.project.name = file.name.replace(/\.pdf$/i, '');
    state.project.drawingNo = '';

    // 새 도면이므로 기존 벌룬 위치는 폐기하고 자동 인식 결과로 대체
    state.project.hotspots = await detectBalloons(page);
    showToast(state.project.hotspots.length
      ? `🎯 벌룬 ${state.project.hotspots.length}개 자동 인식·배치 완료`
      : '📐 도면 로드 완료 — 인식된 벌룬 없음, 벌룬 편집으로 위치 지정');
  } else {
    const url = await readFile(file, 'dataurl');
    const size = await imageSize(url);
    setDrawing(url, size.w, size.h);
    state.project.hotspots = [];
    state.project.name = file.name.replace(/\.[^.]+$/, '');
    state.project.drawingNo = '';
    showToast('📐 도면 로드 완료 — 벌룬 편집으로 번호 위치 지정');
  }
  state.selected = null;
  syncMeta();
  renderAll();
  fitView();
  saveProject();
}

function imageSize(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve({ w: im.naturalWidth || 1000, h: im.naturalHeight || 700 });
    im.onerror = reject;
    im.src = url;
  });
}

function setDrawing(url, w, h) {
  Object.assign(state.project, { image: url, width: w, height: h });
}

// ---------------------------------------------------------
// PDF 벌룬 자동 인식: 원(베지어 4분할) 안에 들어있는 번호 텍스트 매칭
// ---------------------------------------------------------
async function detectBalloons(page) {
  const { OPS, Util } = window.pdfjsLib;
  const vp = page.getViewport({ scale: 1 });
  const [ops, text] = await Promise.all([page.getOperatorList(), page.getTextContent()]);

  // 1) 원 추출
  const circles = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === OPS.save) stack.push(ctm.slice());
    else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args);
    else if (fn === OPS.constructPath) collectCircles(args[0], args[1], ctm, OPS, circles);
  }

  // 2) 텍스트 조각(문자 단위로 쪼개진 CAD 텍스트 포함)
  const pieces = text.items
    .filter(t => t.str && t.str.trim())
    .map(t => {
      const [, , , , e, f] = t.transform;
      const h = t.height || Math.hypot(t.transform[2], t.transform[3]);
      return { str: t.str.trim(), x: e + t.width / 2, y: f + h / 2, left: e };
    });

  // 3) 원 내부 텍스트 결합 → 벌룬 번호
  const out = [];
  const seen = new Set();
  for (const c of circles) {
    const inside = pieces
      .filter(p => Math.hypot(p.x - c.x, p.y - c.y) < c.r * 0.85)
      .sort((a, b) => a.left - b.left);
    const label = normItem(inside.map(p => p.str).join(''));
    if (!/^\d{1,3}(-\d{1,2})?[A-Z]?$/.test(label)) continue;
    const key = `${label}@${Math.round(c.x)},${Math.round(c.y)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const [vx, vy] = vp.convertToViewportPoint(c.x, c.y);
    out.push({
      item: label,
      x: +(vx / vp.width * 100).toFixed(3),
      y: +(vy / vp.height * 100).toFixed(3),
      r: +(c.r / vp.width * 100).toFixed(3)
    });
  }
  return out;
}

function collectCircles(opList, coords, ctm, OPS, circles) {
  const { Util } = window.pdfjsLib;
  let ci = 0;
  let pts = [];
  let curves = 0;
  let lines = 0;
  const flush = () => {
    if (curves >= 4 && lines === 0 && pts.length) {
      const xs = pts.map(p => p[0]);
      const ys = pts.map(p => p[1]);
      const w = Math.max(...xs) - Math.min(...xs);
      const h = Math.max(...ys) - Math.min(...ys);
      if (w > 6 && w < 60 && Math.abs(w - h) < Math.max(1.5, w * 0.08)) {
        circles.push({ x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2, r: w / 2 });
      }
    }
    pts = [];
    curves = 0;
    lines = 0;
  };
  const add = (x, y) => pts.push(Util.applyTransform([x, y], ctm));

  for (const op of opList) {
    switch (op) {
      case OPS.moveTo:
        flush();
        add(coords[ci++], coords[ci++]);
        break;
      case OPS.lineTo:
        lines++;
        add(coords[ci++], coords[ci++]);
        break;
      case OPS.curveTo:
        curves++;
        add(coords[ci++], coords[ci++]);
        add(coords[ci++], coords[ci++]);
        add(coords[ci++], coords[ci++]);
        break;
      case OPS.curveTo2:
      case OPS.curveTo3:
        curves++;
        add(coords[ci++], coords[ci++]);
        add(coords[ci++], coords[ci++]);
        break;
      case OPS.rectangle:
        lines += 4;
        ci += 4;
        break;
      case OPS.closePath:
        break;
    }
  }
  flush();
}

// ---------------------------------------------------------
// BOM 로드 (xlsx / csv)
// - 시트 헤더 자동 인식, '도면 Item' 시트가 있으면 이를 주 BOM 으로 사용
// - 주 BOM 에 'BOM No' 참조 컬럼이 있고 다른 시트에 'BOM No' 가 있으면 자동 연계
// ---------------------------------------------------------
async function loadBomFile(file) {
  let sheets;
  if (/\.csv$/i.test(file.name)) {
    sheets = [{ name: file.name, rows: parseCSV(await readFile(file, 'text')) }];
  } else {
    showToast('📋 엑셀 분석 중...');
    await loadScript(LIBS.xlsx);
    const wb = window.XLSX.read(await readFile(file, 'buffer'), { type: 'array' });
    sheets = wb.SheetNames.map(name => ({
      name,
      rows: window.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' })
    }));
  }

  const tables = sheets.map(s => toTable(s)).filter(Boolean);
  if (!tables.length) {
    showToast('⚠️ 번호(No/Item) 컬럼을 찾지 못함');
    return;
  }

  const primary = tables.find(t => /도면/.test(t.itemCol)) || tables[0];
  const p = state.project;
  p.columns = primary.columns;
  p.rows = primary.rows.map(r => ({ item: normItem(r[primary.itemCol]), data: r, extra: [] }));
  p.extraTitle = '';
  p.extraColumns = [];

  const refCol = primary.columns.find(c => c !== primary.itemCol && COL.bomRef.test(c));
  const detail = refCol && tables.find(t => t !== primary && COL.bomRef.test(t.itemCol));
  if (detail) {
    const index = new Map();
    detail.rows.forEach(r => {
      const k = normItem(r[detail.itemCol]);
      if (!index.has(k)) index.set(k, []);
      index.get(k).push(r);
    });
    p.extraTitle = detail.name;
    p.extraColumns = detail.columns;
    p.rows.forEach(row => {
      String(row.data[refCol] ?? '').split(/[,+/\s]+/).filter(Boolean).forEach(ref => {
        (index.get(normItem(ref)) || []).forEach(d => row.extra.push(d));
      });
    });
  }

  state.selected = null;
  renderAll();
  saveProject();
  const placed = new Set(p.hotspots.map(h => h.item));
  const n = p.rows.filter(r => placed.has(r.item)).length;
  showToast(`📋 BOM ${p.rows.length}행 로드 (도면 벌룬 매칭 ${n})${detail ? ` · '${detail.name}' 연계` : ''}`);
}

function toTable({ name, rows }) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const header = rows[i].map(h => String(h ?? '').replace(/\s+/g, ' ').trim());
    const idx = header.findIndex(h => COL.item.test(h) || COL.bomRef.test(h));
    if (idx < 0) continue;
    const columns = header.map((h, j) => h || `열${j + 1}`);
    const itemCol = columns[idx];
    const data = [];
    for (let r = i + 1; r < rows.length; r++) {
      const v = String(rows[r][idx] ?? '').trim();
      if (!v || !/^\d/.test(v)) continue;          // 소제목·합계 행 제외
      const obj = {};
      columns.forEach((c, j) => { obj[c] = String(rows[r][j] ?? '').trim(); });
      data.push(obj);
    }
    if (data.length) return { name, columns, itemCol, rows: data };
  }
  return null;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ---------------------------------------------------------
// 렌더링
// ---------------------------------------------------------
function findCol(re, cols = state.project.columns) {
  return cols.find(c => re.test(c) && !COL.item.test(c));
}

function rowByItem(item) {
  return state.project.rows.find(r => r.item === item);
}

function renderAll() {
  renderDrawing();
  renderHotspots();
  renderTable();
  renderDetail();
}

function renderDrawing() {
  const p = state.project;
  if (p.image) {
    els.img.src = p.image;
    els.img.style.width = p.width + 'px';
    els.img.style.height = p.height + 'px';
    els.canvas.style.width = p.width + 'px';
    els.canvas.style.height = p.height + 'px';
    els.canvas.hidden = false;
    els.empty.hidden = true;
  } else {
    els.canvas.hidden = true;
    els.empty.hidden = false;
  }
}

function renderHotspots() {
  const p = state.project;
  const statusCol = findCol(COL.status);
  const defaultR = medianR();
  els.layer.innerHTML = '';
  p.hotspots.forEach((h, i) => {
    const row = rowByItem(h.item);
    const el = document.createElement('div');
    const r = (h.r || defaultR) / 100 * p.width;
    const st = row && statusCol ? classifyStatus(row.data[statusCol]) : '';
    el.className = 'hotspot' +
      (state.selected === h.item ? ' selected' : '') +
      (p.rows.length && !row ? ' orphan' : '') +
      (st ? ' st-' + st : '');
    el.style.left = h.x + '%';
    el.style.top = h.y + '%';
    el.style.width = el.style.height = (r * 2.3) + 'px';
    el.dataset.index = i;
    el.style.fontSize = r + 'px';
    el.textContent = h.item;
    const name = row ? row.data[findCol(COL.name)] : '';
    el.dataset.tip = h.item + (name ? ' · ' + name : (p.rows.length ? ' · BOM 없음' : ''));
    els.layer.appendChild(el);
  });
}

function medianR() {
  const rs = state.project.hotspots.map(h => h.r).filter(Boolean).sort((a, b) => a - b);
  return rs.length ? rs[Math.floor(rs.length / 2)] : 0.8;
}

function renderTable() {
  const p = state.project;
  const nameCol = findCol(COL.name);
  const specCol = findCol(COL.spec);
  const qtyCol = findCol(COL.qty);
  const statusCol = findCol(COL.status);
  const placed = new Set(p.hotspots.map(h => h.item));
  const q = els.search.value.trim().toLowerCase();

  els.head.innerHTML = `<tr><th>No.</th><th>${esc(nameCol || '품명')}</th>` +
    (qtyCol ? `<th>수량</th>` : '') +
    (statusCol ? `<th>${esc(statusCol)}</th>` : '') + `<th>도면</th></tr>`;

  const rows = p.rows.filter(r => !q ||
    [r.item, ...Object.values(r.data), ...r.extra.flatMap(Object.values)]
      .some(v => String(v).toLowerCase().includes(q)));

  els.body.innerHTML = rows.map(r => {
    const st = statusCol ? r.data[statusCol] : '';
    return `<tr data-item="${esc(r.item)}" class="${state.selected === r.item ? 'selected' : ''}">
      <td class="no">${esc(r.item)}</td>
      <td><div class="nm">${esc(r.data[nameCol] || '')}</div>${specCol ? `<div class="sp">${esc(r.data[specCol] || '')}</div>` : ''}</td>
      ${qtyCol ? `<td class="qty">${esc(r.data[qtyCol] || '')}</td>` : ''}
      ${statusCol ? `<td>${st ? `<span class="badge st-${classifyStatus(st) || 'none'}">${esc(st)}</span>` : ''}</td>` : ''}
      <td>${placed.has(r.item) ? '<span class="badge st-ok">●</span>' : '<span class="badge st-warn">미배치</span>'}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" class="empty-row">${p.rows.length ? '검색 결과 없음' : 'BOM 파일(xlsx/csv)을 불러오세요'}</td></tr>`;

  els.count.textContent = p.rows.length;

  // 요약
  const items = new Set(p.rows.map(r => r.item));
  const placedRows = p.rows.filter(r => placed.has(r.item)).length;
  const orphan = [...placed].filter(i => !items.has(i)).length;
  const stCount = { bad: 0, warn: 0 };
  if (statusCol) p.rows.forEach(r => { const s = classifyStatus(r.data[statusCol]); if (s in stCount) stCount[s]++; });
  els.summary.innerHTML = p.rows.length ? [
    `<span class="chip">도면 배치 ${placedRows}/${p.rows.length}</span>`,
    orphan ? `<span class="chip warn">BOM 없는 벌룬 ${orphan}</span>` : '',
    stCount.bad ? `<span class="chip bad">불일치 ${stCount.bad}</span>` : '',
    stCount.warn ? `<span class="chip warn">확인 필요 ${stCount.warn}</span>` : ''
  ].join('') : '';
}

function renderDetail() {
  const item = state.selected;
  if (!item) {
    els.detail.innerHTML = `<div class="detail-empty">도면의 부품 번호(벌룬)를 클릭하면<br>BOM 정보가 표시됨</div>`;
    return;
  }
  const row = rowByItem(item);
  const p = state.project;
  const count = p.hotspots.filter(h => h.item === item).length;
  if (!row) {
    els.detail.innerHTML = `<div class="detail-head"><div class="detail-balloon">${esc(item)}</div>
      <div><div class="detail-title">BOM 정보 없음</div><div class="detail-sub">도면 벌룬 ${count}곳</div></div></div>`;
    return;
  }
  const nameCol = findCol(COL.name);
  const dl = (obj, cols, skip) => `<dl class="detail-grid">${cols
    .filter(c => !skip.includes(c) && String(obj[c] ?? '') !== '')
    .map(c => `<dt>${esc(c)}</dt><dd class="${COL.status.test(c) ? 'st-text-' + classifyStatus(obj[c]) : ''}">${esc(obj[c])}</dd>`)
    .join('')}</dl>`;

  let html = `<div class="detail-head">
      <div class="detail-balloon">${esc(item)}</div>
      <div>
        <div class="detail-title">${esc(row.data[nameCol] || '')}</div>
        <div class="detail-sub">도면 벌룬 ${count}곳${count ? ' · <a href="#" id="locateBtn">위치 보기</a>' : ''}</div>
      </div>
    </div>
    <div class="detail-body">
    ${dl(row.data, p.columns, [nameCol, p.columns.find(c => COL.item.test(c))])}`;
  row.extra.forEach(ex => {
    html += `<h3 class="detail-section">${esc(p.extraTitle)} · ${esc(ex[p.extraColumns[0]] || '')}</h3>${dl(ex, p.extraColumns, [])}`;
  });
  html += '</div>';
  els.detail.innerHTML = html;
  const locate = $('locateBtn');
  if (locate) locate.onclick = e => { e.preventDefault(); focusItem(item); };
}

function select(item, { scrollRow = true, locate = false } = {}) {
  state.selected = item;
  renderHotspots();
  renderTable();
  renderDetail();
  if (scrollRow) {
    const tr = els.body.querySelector(`tr[data-item="${CSS.escape(item)}"]`);
    if (tr) tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  if (locate) focusItem(item);
}

// ---------------------------------------------------------
// 줌 / 팬
// ---------------------------------------------------------
function applyTransform() {
  els.canvas.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
  els.zoomLabel.textContent = Math.round(state.scale * 100) + '%';
}

function fitView() {
  const p = state.project;
  if (!p.image) return;
  const vw = els.viewport.clientWidth;
  const vh = els.viewport.clientHeight;
  state.scale = Math.min(vw / p.width, vh / p.height) * 0.97;
  state.tx = (vw - p.width * state.scale) / 2;
  state.ty = (vh - p.height * state.scale) / 2;
  applyTransform();
}

function zoomAt(factor, cx, cy) {
  const ns = Math.min(Math.max(state.scale * factor, 0.05), 8);
  const f = ns / state.scale;
  state.tx = cx - (cx - state.tx) * f;
  state.ty = cy - (cy - state.ty) * f;
  state.scale = ns;
  applyTransform();
}

function focusItem(item) {
  const p = state.project;
  const hs = p.hotspots.filter(h => h.item === item);
  if (!hs.length) return;
  const h = hs[0];
  const vw = els.viewport.clientWidth;
  const vh = els.viewport.clientHeight;
  const minScale = Math.min(vw / p.width, vh / p.height) * 2.5;
  if (state.scale < minScale) state.scale = minScale;
  state.tx = vw / 2 - h.x / 100 * p.width * state.scale;
  state.ty = vh / 2 - h.y / 100 * p.height * state.scale;
  els.canvas.style.transition = 'transform 0.35s ease';
  applyTransform();
  setTimeout(() => { els.canvas.style.transition = ''; }, 380);
}

function toDrawingPct(clientX, clientY) {
  const rect = els.viewport.getBoundingClientRect();
  const x = (clientX - rect.left - state.tx) / state.scale;
  const y = (clientY - rect.top - state.ty) / state.scale;
  return { x: x / state.project.width * 100, y: y / state.project.height * 100 };
}

// 포인터: 팬 / 벌룬 클릭 / 편집(추가·이동·삭제)
let drag = null;
els.viewport.addEventListener('pointerdown', e => {
  if (!state.project.image || e.button !== 0) return;
  const hs = e.target.closest('.hotspot');
  drag = {
    x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty, moved: false,
    hotspot: hs ? +hs.dataset.index : null, el: hs
  };
  els.viewport.setPointerCapture(e.pointerId);
});

els.viewport.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 4) return;
  drag.moved = true;
  if (state.edit && drag.hotspot !== null) {
    const pt = toDrawingPct(e.clientX, e.clientY);
    const h = state.project.hotspots[drag.hotspot];
    h.x = +pt.x.toFixed(3);
    h.y = +pt.y.toFixed(3);
    drag.el.style.left = h.x + '%';
    drag.el.style.top = h.y + '%';
    drag.el.classList.add('dragging');
  } else {
    els.viewport.classList.add('panning');
    state.tx = drag.tx + dx;
    state.ty = drag.ty + dy;
    applyTransform();
  }
});

els.viewport.addEventListener('pointerup', e => {
  if (!drag) return;
  const d = drag;
  drag = null;
  els.viewport.classList.remove('panning');
  const p = state.project;

  if (d.moved) {
    if (state.edit && d.hotspot !== null) { renderHotspots(); saveProject(); }
    return;
  }
  if (d.hotspot !== null) {
    const h = p.hotspots[d.hotspot];
    if (state.edit) {
      if (confirm(`벌룬 [${h.item}] 삭제?`)) {
        p.hotspots.splice(d.hotspot, 1);
        renderHotspots();
        renderTable();
        saveProject();
      }
    } else {
      select(h.item);
    }
    return;
  }
  if (state.edit) {
    const placed = new Set(p.hotspots.map(h => h.item));
    const next = p.rows.find(r => !placed.has(r.item));
    const item = prompt('부품 번호(벌룬) 입력', next ? next.item : '');
    if (!item || !item.trim()) return;
    const pt = toDrawingPct(e.clientX, e.clientY);
    p.hotspots.push({ item: normItem(item), x: +pt.x.toFixed(3), y: +pt.y.toFixed(3), r: medianR() });
    renderHotspots();
    renderTable();
    saveProject();
  }
});

els.viewport.addEventListener('wheel', e => {
  if (!state.project.image) return;
  e.preventDefault();
  const rect = els.viewport.getBoundingClientRect();
  zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top);
}, { passive: false });

// 벌룬 툴팁 (줌 배율과 무관하게 화면 크기 고정)
const tip = document.createElement('div');
tip.className = 'hotspot-tip';
tip.hidden = true;
document.body.appendChild(tip);
els.layer.addEventListener('pointerover', e => {
  const hs = e.target.closest('.hotspot');
  if (!hs || drag) return;
  const rc = hs.getBoundingClientRect();
  tip.textContent = hs.dataset.tip;
  tip.style.left = (rc.left + rc.width / 2) + 'px';
  tip.style.top = (rc.top - 6) + 'px';
  tip.hidden = false;
});
els.layer.addEventListener('pointerout', () => { tip.hidden = true; });
els.viewport.addEventListener('wheel', () => { tip.hidden = true; }, { passive: true });

function zoomCenter(f) {
  zoomAt(f, els.viewport.clientWidth / 2, els.viewport.clientHeight / 2);
}

// ---------------------------------------------------------
// 프로젝트 저장/열기, 샘플
// ---------------------------------------------------------
function exportProject() {
  const p = state.project;
  const blob = new Blob([JSON.stringify(p)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(p.drawingNo || p.name || 'bom-project').replace(/[\\/:*?"<>|]/g, '_')}.bom.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProject(file) {
  try {
    const data = JSON.parse(await readFile(file, 'text'));
    if (!Array.isArray(data.hotspots) || !Array.isArray(data.rows)) throw new Error();
    state.project = Object.assign(emptyProject(), data);
    state.selected = null;
    state.pdfPage = null;
    $('autoDetectBtn').disabled = true;
    syncMeta();
    renderAll();
    fitView();
    saveProject();
    showToast('📂 프로젝트 열기 완료');
  } catch {
    showToast('⚠️ 올바른 프로젝트 파일이 아님');
  }
}

function syncMeta() {
  $('projectName').value = state.project.name || '';
  $('drawingNo').value = state.project.drawingNo || '';
}

function loadSample() {
  const svg = sampleSVG();
  state.project = Object.assign(emptyProject(), {
    name: '샘플 — 극저온 펌프 ASSY',
    drawingNo: 'SAMPLE-001',
    image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.markup),
    width: 1000,
    height: 700,
    hotspots: svg.balloons.map(b => ({ item: b.item, x: b.bx / 10, y: b.by / 7, r: 1.4 })),
    columns: ['No', '품명', '사양', '수량', '비고'],
    rows: [
      ['1', '토출 플랜지', 'DN50 PN16 / STS316L', '1', ''],
      ['2', '모터 하우징', 'AL6061-T6', '1', ''],
      ['3', '상부 베어링', '6206 극저온 볼베어링', '1', ''],
      ['4', '메인 샤프트', 'Inconel 718, ø30', '1', ''],
      ['5', '하부 베어링', '6206 극저온 볼베어링', '1', ''],
      ['6', '임펠러', 'Ti-6Al-4V, ø180', '1', '동적 밸런싱 G2.5'],
      ['7', '디퓨저 케이싱', 'AL6061-T6', '1', ''],
      ['8', '인듀서', 'Ti-6Al-4V, ø90', '1', ''],
      ['9', '흡입 스트레이너', '100 mesh / STS316L', '1', ''],
      ['10', '전원 피드스루', '3상 440V', '1', '방폭 인증']
    ].map(v => ({ item: v[0], data: { No: v[0], 품명: v[1], 사양: v[2], 수량: v[3], 비고: v[4] }, extra: [] }))
  });
  state.selected = null;
  state.pdfPage = null;
  $('autoDetectBtn').disabled = true;
  syncMeta();
  renderAll();
  fitView();
  saveProject();
}

function sampleSVG() {
  const balloons = [
    { item: '1', bx: 150, by: 90, tx: 300, ty: 150 },
    { item: '2', bx: 820, by: 140, tx: 640, ty: 200 },
    { item: '3', bx: 180, by: 230, tx: 485, ty: 150 },
    { item: '4', bx: 820, by: 280, tx: 505, ty: 300 },
    { item: '5', bx: 180, by: 330, tx: 485, ty: 330 },
    { item: '6', bx: 820, by: 420, tx: 560, ty: 435 },
    { item: '7', bx: 180, by: 430, tx: 370, ty: 450 },
    { item: '8', bx: 820, by: 540, tx: 530, ty: 555 },
    { item: '9', bx: 180, by: 600, tx: 450, ty: 615 },
    { item: '10', bx: 820, by: 60, tx: 600, ty: 110 }
  ];
  const s = 'stroke="#111" stroke-width="2" fill="none"';
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <rect width="1000" height="700" fill="#fff"/>
  <rect x="10" y="10" width="980" height="680" ${s}/>
  <path d="M300 150 L300 120 L220 120 L220 100 M200 100 h40 M200 140 h40" ${s}/>
  <rect x="350" y="120" width="300" height="210" ${s}/>
  <path d="M300 150 h50" stroke="#111" stroke-width="6" fill="none"/>
  <rect x="470" y="135" width="60" height="30" ${s}/>
  <rect x="470" y="315" width="60" height="30" ${s}/>
  <line x1="500" y1="100" x2="500" y2="580" stroke="#111" stroke-width="3" stroke-dasharray="20 6 4 6"/>
  <rect x="360" y="360" width="280" height="160" ${s}/>
  <path d="M430 470 L570 470 L545 410 L455 410 Z" ${s}/>
  <path d="M470 530 L530 530 L520 580 L480 580 Z" ${s}/>
  <rect x="440" y="590" width="120" height="50"  stroke="#111" stroke-width="2" fill="none" stroke-dasharray="6 4"/>
  <rect x="580" y="90" width="40" height="30" ${s}/>
  ${balloons.map(b => `<line x1="${b.tx}" y1="${b.ty}" x2="${b.bx}" y2="${b.by}" stroke="#111" stroke-width="1.2"/>
  <circle cx="${b.bx}" cy="${b.by}" r="14" fill="#fff" stroke="#111" stroke-width="1.5"/>
  <text x="${b.bx}" y="${b.by + 5}" font-size="14" font-family="Arial" text-anchor="middle">${b.item}</text>`).join('')}
  <text x="40" y="670" font-size="16" font-family="Arial">SAMPLE — CRYOGENIC PUMP ASSY (DEMO)</text>
</svg>`;
  return { markup, balloons };
}

// ---------------------------------------------------------
// 이벤트 바인딩
// ---------------------------------------------------------
function bindFile(id, handler) {
  $(id).addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      await handler(f);
    } catch (err) {
      console.error(err);
      showToast('⚠️ ' + (err.message || '파일 처리 실패'));
    }
  });
}

bindFile('drawingFile', loadDrawingFile);
bindFile('bomFile', loadBomFile);
bindFile('projectFile', importProject);

$('exportBtn').onclick = exportProject;
$('sampleBtn').onclick = () => {
  if (!state.project.image || confirm('현재 작업을 샘플로 대체할까요? (먼저 프로젝트 저장 권장)')) loadSample();
};
$('zoomIn').onclick = () => zoomCenter(1.25);
$('zoomOut').onclick = () => zoomCenter(1 / 1.25);
$('zoomFit').onclick = fitView;
$('editToggle').onclick = () => {
  state.edit = !state.edit;
  $('editToggle').classList.toggle('active', state.edit);
  document.body.classList.toggle('edit-mode', state.edit);
};
$('autoDetectBtn').onclick = async () => {
  if (!state.pdfPage) return;
  const found = await detectBalloons(state.pdfPage);
  if (!found.length) { showToast('⚠️ 인식된 벌룬 없음'); return; }
  if (state.project.hotspots.length && !confirm(`벌룬 ${found.length}개 인식됨. 기존 위치를 대체할까요?`)) return;
  state.project.hotspots = found;
  renderHotspots();
  renderTable();
  saveProject();
  showToast(`🎯 벌룬 ${found.length}개 자동 배치 완료`);
};
$('projectName').oninput = e => { state.project.name = e.target.value; saveProject(); };
$('drawingNo').oninput = e => { state.project.drawingNo = e.target.value; saveProject(); };
els.search.oninput = renderTable;
els.body.addEventListener('click', e => {
  const tr = e.target.closest('tr[data-item]');
  if (tr) select(tr.dataset.item, { scrollRow: false, locate: true });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.selected) select(null);
});
window.addEventListener('resize', () => { if (state.project.image) fitView(); });

// 초기화: 저장된 작업 복원, 없으면 샘플
(async () => {
  let saved = null;
  try { saved = await DB.get('project'); } catch { /* 저장소 사용 불가 시 무시 */ }
  if (saved && (saved.image || saved.rows?.length)) {
    state.project = Object.assign(emptyProject(), saved);
    syncMeta();
    renderAll();
    fitView();
  } else {
    loadSample();
  }
})();
