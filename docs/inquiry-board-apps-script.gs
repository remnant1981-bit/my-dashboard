/**
 * SMG 홈페이지 문의 접수 게시판 — Google Apps Script (구글 시트에 붙여넣어 사용)
 * 설정 방법: docs/inquiry-board-setup.md
 *
 * - 홈페이지(견적문의 폼·채팅·자료 다운로드)에서 보낸 문의를 이 시트의 "문의" 탭에 한 줄씩 저장
 * - 관리자 화면 [문의 관리]에서 조회 비밀키(TOKEN)로 목록 조회·상태 변경
 * - 아래 TOKEN 값은 반드시 본인만 아는 값으로 바꾸고, 저장소·대화에 적지 말 것
 */
const TOKEN = 'CHANGE_ME_TO_A_LONG_SECRET';   // ← 조회 비밀키 (영문·숫자 16자 이상 권장)
const NOTIFY_EMAIL = '';                      // ← (선택) 접수 때마다 알림 받을 메일. 예: 'sungsil@sungsil.com'
const SHEET = '문의';
const KEYS = ['time', 'status', 'source', 'type', 'company', 'name', 'phone', 'email', 'product', 'qty', 'items', 'message', 'lang', 'page', 'subject'];
const LABELS = ['접수일시', '상태', '경로', '유형', '회사명', '담당자', '연락처', '이메일', '관심제품', '수량/납기', '견적품목', '내용', '언어', '페이지', '제목'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(LABELS); sh.setFrozenRows(1); }
  return sh;
}
// 수식 주입 방지 + 길이 제한
function clean_(v) {
  let s = v == null ? '' : String(v).slice(0, 5000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false }); }
  if (d.website || d.botcheck) return json_({ ok: true }); // 스팸 봇 차단용 숨은 칸
  if (!d.company && !d.email && !d.message) return json_({ ok: false });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const row = KEYS.map((k) => (k === 'time' ? new Date() : k === 'status' ? '신규' : k === 'source' ? clean_(d.source || 'form') : clean_(d[k])));
    sheet_().appendRow(row);
  } finally { lock.releaseLock(); }
  if (NOTIFY_EMAIL) {
    try { MailApp.sendEmail(NOTIFY_EMAIL, String(d.subject || '[홈페이지 문의]').slice(0, 200), KEYS.slice(2).map((k, i) => LABELS[i + 2] + ': ' + (d[k] || '')).join('\n')); } catch (err) {}
  }
  return json_({ ok: true });
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!TOKEN || TOKEN.indexOf('CHANGE_ME') === 0 || p.token !== TOKEN) return json_({ ok: false, error: '비밀키 불일치' });
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
