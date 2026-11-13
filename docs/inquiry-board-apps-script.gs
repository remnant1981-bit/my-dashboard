/**
 * SMG 홈페이지 문의 접수 게시판 — Google Apps Script (구글 시트 "SMG 홈페이지 문의 접수"에 붙여 사용)
 * 설정 방법: docs/inquiry-board-setup.md
 *
 * 탭 구성
 *  - 문의        : 견적문의 폼·채팅·자료 다운로드 신청 (관리자 [문의 관리] 게시판과 연동)
 *  - 다운로드 이력 : 카탈로그·자료 파일을 받을 때마다 한 줄 (연락처를 남긴 경우 회사명 포함)
 *  - 거래처      : 문의·다운로드에서 회사별로 자동 정리 (사내 입력 칸: 등급·영업 담당·메모)
 *
 * 조회 비밀키(TOKEN)는 코드가 아니라 "프로젝트 설정 → 스크립트 속성"의 TOKEN 에 저장한다.
 * (코드를 새 버전으로 바꿔 붙여도 비밀키가 지워지지 않음. 저장소·대화에 비밀키를 적지 말 것)
 */
const NOTIFY_EMAIL = '';                      // (선택) 접수 때마다 알림 받을 메일
const SHEET = '문의', DL_SHEET = '다운로드 이력', CL_SHEET = '거래처';
const KEYS = ['time', 'status', 'source', 'type', 'company', 'name', 'phone', 'email', 'product', 'qty', 'items', 'message', 'lang', 'page', 'subject'];
const LABELS = ['접수일시', '상태', '경로', '유형', '회사명', '담당자', '연락처', '이메일', '관심제품', '수량/납기', '견적품목', '내용', '언어', '페이지', '제목'];
const DL_LABELS = ['일시', '자료명', '파일', '회사명', '담당자', '이메일', '받은 페이지', '언어', '유입 경로'];
const CL_LABELS = ['회사명', '담당자', '연락처', '이메일', '첫 접촉일', '최근 접촉일', '문의 수', '자료 다운로드 수', '최근 문의 유형', '관심제품', '등급', '영업 담당', '메모', '키'];
const CL_AUTO = 10; // 1~10열은 자동 갱신, 11~13열(등급·영업 담당·메모)은 사내 입력, 14열은 내부 키(숨김)

function token_() {
  const p = PropertiesService.getScriptProperties().getProperty('TOKEN');
  return p && p.length >= 12 ? p : '';
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
// 수식 주입 방지 + 길이 제한
function clean_(v, max) {
  let s = v == null ? '' : String(v).slice(0, max || 5000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function header_(sh, labels, color) {
  sh.appendRow(labels);
  sh.getRange(1, 1, 1, labels.length).setFontWeight('bold').setFontColor('#ffffff').setBackground(color || '#14213d')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sh.setFrozenRows(1); sh.setRowHeight(1, 40);
}
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); header_(sh, LABELS); }
  return sh;
}
function dlSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(DL_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DL_SHEET); header_(sh, DL_LABELS, '#175cd3');
    [130, 200, 220, 160, 90, 180, 140, 50, 220].forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm');
    sh.setTabColor('#175cd3');
    sh.getRange(1, 1, sh.getMaxRows(), DL_LABELS.length).createFilter();
  }
  return sh;
}
function clSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CL_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CL_SHEET); header_(sh, CL_LABELS, '#067647');
    sh.getRange(1, CL_AUTO + 1, 1, 3).setBackground('#fef0c7').setFontColor('#93370d');
    [170, 90, 120, 190, 100, 100, 70, 90, 120, 160, 70, 90, 260, 60].forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.getRange('E2:F').setNumberFormat('yyyy-mm-dd');
    sh.getRange('G2:H').setHorizontalAlignment('center');
    sh.getRange('K2:K').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['A (주요)', 'B (일반)', 'C (잠재)'], true).setAllowInvalid(true).build());
    sh.hideColumns(14); sh.setFrozenColumns(1); sh.setTabColor('#067647');
    sh.getRange(1, 1, sh.getMaxRows(), 13).createFilter();
  }
  return sh;
}
// 회사 식별 키: 공백·법인 표기 제거 후 소문자
function key_(company) {
  return String(company || '').replace(/\(주\)|㈜|주식회사|\(유\)|유한회사|co\.?,?\s*ltd\.?|inc\.?|corp\.?|corporation/gi, '').replace(/[\s.,·\-_()]/g, '').toLowerCase();
}
// 거래처 갱신: 회사명이 있을 때만. kind = 'inquiry' | 'download'
function upsertClient_(d, kind, when) {
  const k = key_(d.company); if (!k) return;
  const sh = clSheet_(), last = sh.getLastRow();
  const keys = last > 1 ? sh.getRange(2, 14, last - 1, 1).getValues().map((r) => r[0]) : [];
  const idx = keys.indexOf(k);
  const t = when || new Date();
  if (idx < 0) {
    sh.appendRow([clean_(d.company, 200), clean_(d.name, 100), clean_(d.phone, 50), clean_(d.email, 200), t, t,
      kind === 'inquiry' ? 1 : 0, kind === 'download' ? 1 : 0, kind === 'inquiry' ? clean_(d.type, 60) : '', clean_(d.product, 200), '', '', '', k]);
    return;
  }
  const r = idx + 2, row = sh.getRange(r, 1, 1, CL_AUTO).getValues()[0];
  if (d.name) row[1] = clean_(d.name, 100);
  if (d.phone) row[2] = clean_(d.phone, 50);
  if (d.email) row[3] = clean_(d.email, 200);
  if (!row[4] || t < row[4]) row[4] = t;
  if (!row[5] || t > row[5]) row[5] = t;
  if (kind === 'inquiry') { row[6] = (Number(row[6]) || 0) + 1; if (d.type) row[8] = clean_(d.type, 60); }
  if (kind === 'download') row[7] = (Number(row[7]) || 0) + 1;
  if (d.product) row[9] = clean_(d.product, 200);
  sh.getRange(r, 1, 1, CL_AUTO).setValues([row]);
}

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false }); }
  if (d.website || d.botcheck) return json_({ ok: true }); // 스팸 봇 차단용 숨은 칸
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (d.kind === 'download') { // 자료 다운로드 이력 (연락처 없이도 기록)
      if (!d.file) return json_({ ok: false });
      const now = new Date();
      dlSheet_().appendRow([now, clean_(d.title, 200), clean_(d.file, 300), clean_(d.company, 200), clean_(d.name, 100), clean_(d.email, 200), clean_(d.page, 200), clean_(d.lang, 5), clean_(d.ref, 300)]);
      upsertClient_(d, 'download', now);
      return json_({ ok: true });
    }
    if (!d.company && !d.email && !d.message) return json_({ ok: false });
    const now = new Date();
    const row = KEYS.map((k) => (k === 'time' ? now : k === 'status' ? '신규' : k === 'source' ? clean_(d.source || 'form') : clean_(d[k])));
    sheet_().appendRow(row);
    if (d.source !== 'download') upsertClient_(d, 'inquiry', now); // 다운로드 신청은 다운로드 이력 쪽에서 집계
  } finally { lock.releaseLock(); }
  if (NOTIFY_EMAIL) {
    try { MailApp.sendEmail(NOTIFY_EMAIL, String(d.subject || '[홈페이지 문의]').slice(0, 200), KEYS.slice(2).map((k, i) => LABELS[i + 2] + ': ' + (d[k] || '')).join('\n')); } catch (err) {}
  }
  return json_({ ok: true });
}

function doGet(e) {
  const p = (e && e.parameter) || {}, tk = token_();
  if (!tk || p.token !== tk) return json_({ ok: false, error: '비밀키 불일치' });
  const sh = sheet_();
  if (p.action === 'status') {
    const r = parseInt(p.row, 10), st = String(p.status || '');
    if (!(r >= 2 && r <= sh.getLastRow()) || ['신규', '처리중', '완료'].indexOf(st) < 0) return json_({ ok: false, error: '잘못된 요청' });
    sh.getRange(r, KEYS.indexOf('status') + 1).setValue(st);
    return json_({ ok: true });
  }
  const n = sh.getLastRow() - 1;
  const vals = n > 0 ? sh.getRange(2, 1, n, KEYS.length).getValues() : [];
  const rows = vals.map((v, i) => { const o = { row: i + 2 }; KEYS.forEach((k, j) => { o[k] = v[j] instanceof Date ? v[j].toISOString() : v[j]; }); return o; }).reverse().slice(0, 500);
  return json_({ ok: true, rows: rows, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() });
}

/**
 * 한 번만 실행: 지금까지 쌓인 "문의"·"다운로드 이력"으로 거래처 탭을 다시 계산 (소급 반영).
 * 사내 입력 칸(등급·영업 담당·메모)은 회사명이 같으면 그대로 유지됨.
 */
function rebuildClients() {
  const sh = clSheet_(), last = sh.getLastRow();
  const keep = {};
  if (last > 1) sh.getRange(2, 1, last - 1, 14).getValues().forEach((r) => { if (r[13]) keep[r[13]] = [r[10], r[11], r[12]]; });
  if (last > 1) sh.getRange(2, 1, last - 1, 14).clearContent();
  const q = sheet_(), qn = q.getLastRow() - 1;
  const items = [];
  const dl = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DL_SHEET);
  const dlRows = dl && dl.getLastRow() > 1 ? dl.getRange(2, 1, dl.getLastRow() - 1, DL_LABELS.length).getValues() : [];
  // 다운로드 이력 탭이 생기기 전의 다운로드 신청(문의 탭, 경로 download)은 다운로드로 집계
  const dlStart = dlRows.length ? Math.min.apply(null, dlRows.map((v) => new Date(v[0]).getTime())) : Infinity;
  if (qn > 0) q.getRange(2, 1, qn, KEYS.length).getValues().forEach((v) => {
    const o = {}; KEYS.forEach((k, j) => { o[k] = v[j]; });
    const t = o.time instanceof Date ? o.time : new Date(o.time);
    if (o.source === 'test' || isNaN(t)) return;
    if (o.source === 'download') { if (t.getTime() < dlStart) items.push({ d: o, kind: 'download', t: t }); }
    else items.push({ d: o, kind: 'inquiry', t: t });
  });
  dlRows.forEach((v) => { if (v[3]) items.push({ d: { company: v[3], name: v[4], email: v[5] }, kind: 'download', t: new Date(v[0]) }); });
  items.sort((a, b) => a.t - b.t).forEach((it) => upsertClient_(it.d, it.kind, it.t));
  const n = sh.getLastRow() - 1;
  if (n > 0) {
    const ks = sh.getRange(2, 14, n, 1).getValues();
    const manual = ks.map((r) => keep[r[0]] || ['', '', '']);
    sh.getRange(2, 11, n, 3).setValues(manual);
  }
}
