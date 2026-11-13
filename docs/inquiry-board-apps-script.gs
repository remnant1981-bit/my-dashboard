/**
 * SMG 홈페이지 문의 접수 게시판 — Google Apps Script (구글 시트 "SMG 홈페이지 문의 접수"에 붙여 사용)
 * 설정 방법: docs/inquiry-board-setup.md
 *
 * 탭 구성
 *  - 현황        : 수식으로 자동 계산 (견적·기술 문의 회신 대응 / 자료 다운로드 잠재 거래처)
 *  - 문의        : 견적문의 폼·채팅·자료 다운로드 신청. 열은 "머리글 이름"으로 찾으므로 열 순서를 바꿔도 됨
 *  - 다운로드 이력 : 카탈로그·자료 파일을 받을 때마다 한 줄 (연락처를 남긴 다운로드는 "구분 = 연락처 남김")
 *  - 관심 업체    : 문의·다운로드한 회사별 자동 정리 + 홈페이지·회사 정보 자동 채움 (사내 입력: 직급·직책·등급·영업 담당·메모)
 *  - 변경 로그    : 문의·다운로드 이력·관심 업체 탭에서 사람이 고친 내용과 관리자 화면의 상태 변경 기록
 *  - 설정        : 영업 담당자·직급·소속 팀, 제품 분류 → 담당 팀, 팀별 알림 메일(알림 팀·알림 메일)
 *
 * 회신 기한 관리 (입력 부담 최소화)
 *  - 사내 담당에 이름을 넣으면 "접수 확인" 시각이 자동 기록됨 (= 담당자가 문의를 인지함)
 *  - 진행 단계(견적 검토·견적 발송·협의 중·수주·실주·보류)는 선택 입력. 바꿀 때마다 변경 로그에 이력이 남음
 *  - 새 문의: 담당 팀 알림 메일로 즉시 안내 / 평일 아침: 담당 미지정·오늘 기한·기한 초과 건을 팀별로 메일 (installTriggers 1회 실행)
 * 모든 탭은 "머리글 이름"으로 열을 찾으므로 열 순서를 바꿔도 됨 (머리글 글자는 바꾸지 말 것)
 *
 * 조회 비밀키(TOKEN)는 "프로젝트 설정 → 스크립트 속성"의 TOKEN 에 저장 (저장소·대화에 적지 말 것)
 */
const NOTIFY_EMAIL = '';                      // (선택) 접수 때마다 알림 받을 메일
const SHEET = '문의', DL_SHEET = '다운로드 이력', CL_SHEET = '관심 업체', LOG_SHEET = '변경 로그';
// 홈페이지에서 들어오는 값 → 문의 탭 머리글
const FIELDS = { time: '접수일시', status: '상태', source: '경로', type: '유형', company: '회사명', name: '담당자', title: '직급·직책', phone: '연락처', email: '이메일', product: '관심제품', qty: '수량/납기', items: '견적품목', message: '내용', lang: '언어', page: '페이지', subject: '제목', category: '제품 분류' };
// 홈페이지 제품 카테고리 id → 시트 표기 (설정 탭 "제품 분류 → 담당 팀" 표와 같은 이름)
const CAT = { temperature: '온도센서', thermowell: '써모웰', heater: '히터', pressure: '압력 트랜스미터', 'cable-bushing': '케이블 부싱', feedthrough: '피드스루' };
function catName_(v) { return String(v || '').split(',').map((x) => CAT[x.trim()] || x.trim()).filter(Boolean).join(', '); }
const KEYS = Object.keys(FIELDS), LABELS = KEYS.map((k) => FIELDS[k]);
const H = { owner: '사내 담당', memo: '처리 메모', replied: '회신일', next: '다음 조치일', updated: '최종 업데이트', ack: '접수 확인', stage: '진행 단계', due: '회신 기한', team: '담당 팀' };
const SET_SHEET = '설정', REMIND_HOUR = 9; // 평일 아침 알림 시각(시)
const DL_LABELS = ['일시', '회사명', '담당자', '연락처', '이메일', '자료명', '구분', '후속 상태', '사내 담당', '메모', '받은 페이지', '언어', '유입 경로', '파일'];
const CL_LABELS = ['회사명', '구분', '홈페이지', '회사 정보', '고객 담당자', '직급·직책', '연락처', '이메일', '문의 수', '자료 다운로드 수', '최근 문의 유형', '관심제품', '첫 접촉일', '최근 접촉일', '등급', '영업 담당', '메모', '키'];
// 무료 메일 주소는 회사 홈페이지를 알 수 없으므로 제외
const FREE_MAIL = /@(gmail|naver|daum|hanmail|nate|kakao|hotmail|outlook|live|yahoo|icloud|me|korea|empas|paran|chol|dreamwiz)\./i;
const LOG_LABELS = ['일시', '시트', '셀', '회사명', '항목', '이전 값', '새 값', '수정자', '경로'];

function token_() { const p = PropertiesService.getScriptProperties().getProperty('TOKEN'); return p && p.length >= 12 ? p : ''; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clean_(v, max) { // 수식 주입 방지 + 길이 제한
  let s = v == null ? '' : String(v).slice(0, max || 5000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function header_(sh, labels, color) {
  sh.getRange(1, 1, 1, labels.length).setValues([labels]).setFontWeight('bold').setFontColor('#ffffff').setBackground(color || '#14213d')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sh.setFrozenRows(1); sh.setRowHeight(1, 40);
}
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_() { let sh = ss_().getSheetByName(SHEET); if (!sh) { sh = ss_().insertSheet(SHEET); header_(sh, LABELS); } return sh; }
// 머리글 이름 → 열 번호(1부터). 없으면 0
function cols_(sh) { const m = {}; sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].forEach((v, i) => { const k = String(v).trim(); if (k && !m[k]) m[k] = i + 1; }); return m; }
// 다음 빈 행: 접수일시 열 기준 (수식 열의 빈 결과에 영향받지 않음)
function nextRowBy_(sh, c, label) { const col = c[label] || 1, n = sh.getLastRow(); if (n < 2) return 2; let last = 1; sh.getRange(2, col, n - 1, 1).getValues().forEach((r, i) => { if (r[0] !== '' && r[0] !== null) last = i + 2; }); return last + 1; }
function nextRow_(sh, c) { const col = c[FIELDS.time] || 1, n = sh.getLastRow(); if (n < 2) return 2; const v = sh.getRange(2, col, n - 1, 1).getValues(); let last = 1; v.forEach((r, i) => { if (r[0] !== '' && r[0] !== null) last = i + 2; }); return last + 1; }
function rowObj_(sh, c, r) { const vals = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0]; const o = {}; Object.keys(c).forEach((k) => { o[k] = vals[c[k] - 1]; }); return o; }

function dlSheet_() { let sh = ss_().getSheetByName(DL_SHEET); if (!sh) { sh = ss_().insertSheet(DL_SHEET); header_(sh, DL_LABELS, '#175cd3'); } return sh; }
function clSheet_() { let sh = ss_().getSheetByName(CL_SHEET); if (!sh) { sh = ss_().insertSheet(CL_SHEET); header_(sh, CL_LABELS, '#067647'); } return sh; }
// 머리글 이름으로 한 행 쓰기 (수식 열·없는 열은 건너뜀)
function writeRow_(sh, c, r, obj) { Object.keys(obj).forEach((h) => { const col = c[h]; if (col && obj[h] !== undefined) sh.getRange(r, col).setValue(obj[h]); }); }
function logSheet_() { let sh = ss_().getSheetByName(LOG_SHEET); if (!sh) { sh = ss_().insertSheet(LOG_SHEET); header_(sh, LOG_LABELS, '#667085'); } return sh; }
function log_(sheet, a1, company, item, before, after, who, via) {
  try { logSheet_().appendRow([new Date(), sheet, a1, clean_(company, 200), item, clean_(before, 500), clean_(after, 500), who || '', via]); } catch (err) {}
}

// 회사 식별 키: 공백·법인 표기 제거 후 소문자
// ── 알림 메일 ──
function notifyAdmin_() { return NOTIFY_EMAIL || PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || ''; }
function teamMails_() { // 설정 탭 "알림 팀"·"알림 메일" 표 → { 영업1팀: 'a@x.com,b@x.com' }
  const sh = ss_().getSheetByName(SET_SHEET), m = {}; if (!sh || sh.getLastRow() < 2) return m;
  const c = cols_(sh), t = c['알림 팀'], e = c['알림 메일']; if (!t || !e) return m;
  // 한 칸에 여러 메일(쉼표·세미콜론·줄바꿈 구분) 또는 같은 팀을 여러 줄로 적어도 모두 합침 (중복 제거)
  sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues().forEach((v) => {
    const k = String(v[t - 1]).trim(); if (!k) return;
    String(v[e - 1]).split(/[,;\s]+/).map((x) => x.trim()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).forEach((x) => {
      const l = m[k] ? m[k].split(',') : []; if (l.indexOf(x) < 0) l.push(x); m[k] = l.join(',');
    });
  });
  return m;
}
function fmtD_(d) { return d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), 'MM-dd(E)') : String(d || ''); }
function mail_(to, subject, body) { if (!to) return; try { MailApp.sendEmail({ to: to, subject: String(subject).slice(0, 200), body: body }); } catch (err) {} }
function rowLink_(r) { return ss_().getUrl() + '#gid=' + sheet_().getSheetId() + '&range=A' + r; }
function stampAck_(sh, c, r, o) { // 사내 담당이 처음 들어오면 접수 확인 시각 기록
  if (c[H.ack] && o[H.owner] && !o[H.ack]) sh.getRange(r, c[H.ack]).setValue(new Date());
}

function key_(company) { return String(company || '').replace(/\(주\)|㈜|주식회사|\(유\)|유한회사|co\.?,?\s*ltd\.?|inc\.?|corp\.?|corporation/gi, '').replace(/[\s.,·\-_()]/g, '').toLowerCase(); }
// 관심 업체 갱신: 회사명이 있을 때만. kind = 'inquiry' | 'download'. 새 회사면 true 반환
function upsertClient_(d, kind, when) {
  const k = key_(d.company); if (!k) return false;
  const sh = clSheet_(), c = cols_(sh), t = when || new Date(), kc = c['키'];
  const n = sh.getLastRow(), keys = n > 1 && kc ? sh.getRange(2, kc, n - 1, 1).getValues().map((r) => r[0]) : [];
  const idx = keys.indexOf(k);
  if (idx < 0) {
    let r = 2; if (n > 1) { const a = sh.getRange(2, c['회사명'], n - 1, 1).getValues(); a.forEach((x, i) => { if (x[0] !== '') r = i + 3; }); }
    const email = String(d.email || ''), dom = !FREE_MAIL.test(email) && email.indexOf('@') > 0 ? email.split('@')[1].toLowerCase() : '';
    writeRow_(sh, c, r, { '회사명': clean_(d.company, 200), '고객 담당자': clean_(d.name, 100), '직급·직책': clean_(d.title, 60), '연락처': clean_(d.phone, 50), '이메일': clean_(email, 200),
      '홈페이지': dom ? 'https://' + (dom.split('.').length === 2 || /\.(co|or|go|ac|ne)\.kr$/.test(dom) && dom.split('.').length === 3 ? 'www.' : '') + dom : '',
      '문의 수': kind === 'inquiry' ? 1 : 0, '자료 다운로드 수': kind === 'download' ? 1 : 0, '최근 문의 유형': kind === 'inquiry' ? clean_(d.type, 60) : '',
      '관심제품': clean_(d.product, 200), '첫 접촉일': t, '최근 접촉일': t, '키': k });
    return r;
  }
  const r = idx + 2, o = rowObj_(sh, c, r), up = {};
  if (d.name) up['고객 담당자'] = clean_(d.name, 100);
  if (d.title) up['직급·직책'] = clean_(d.title, 60);
  if (d.phone) up['연락처'] = clean_(d.phone, 50);
  if (d.email) up['이메일'] = clean_(d.email, 200);
  if (!o['첫 접촉일'] || t < o['첫 접촉일']) up['첫 접촉일'] = t;
  if (!o['최근 접촉일'] || t > o['최근 접촉일']) up['최근 접촉일'] = t;
  if (kind === 'inquiry') { up['문의 수'] = (Number(o['문의 수']) || 0) + 1; if (d.type) up['최근 문의 유형'] = clean_(d.type, 60); }
  if (kind === 'download') up['자료 다운로드 수'] = (Number(o['자료 다운로드 수']) || 0) + 1;
  if (d.product) up['관심제품'] = clean_(d.product, 200);
  writeRow_(sh, c, r, up);
  return false;
}
// 홈페이지 첫 화면의 제목·설명으로 "회사 정보" 채우기 (비어 있을 때만)
function enrich_(r) {
  try {
    const sh = clSheet_(), c = cols_(sh), o = rowObj_(sh, c, r), url = String(o['홈페이지'] || '');
    if (!url || o['회사 정보']) return;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: false });
    if (res.getResponseCode() >= 400) { sh.getRange(r, c['홈페이지']).setNote('홈페이지 확인 필요 (응답 ' + res.getResponseCode() + ')'); return; }
    const raw = res.getBlob(); let html = raw.getDataAsString('UTF-8');
    if (/charset=["']?euc-kr/i.test(html) || html.indexOf('\uFFFD') >= 0) html = raw.getDataAsString('EUC-KR');
    const pick = (re) => { const m = html.match(re); return m ? m[1].replace(/\s+/g, ' ').trim() : ''; };
    const title = pick(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const desc = pick(/<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]*content=["']([^"']{1,400})/i) || pick(/<meta[^>]+content=["']([^"']{1,400})["'][^>]*(?:name|property)=["'](?:og:)?description/i);
    const info = [title, desc].filter(Boolean).join(' — ').slice(0, 300);
    if (info) sh.getRange(r, c['회사 정보']).setValue(clean_(info, 300) + ' (자동)');
  } catch (err) {}
}
/** 한 번만 실행 가능: 회사 정보가 빈 관심 업체를 홈페이지에서 채움 */
function enrichAll() { const sh = clSheet_(); for (let r = 2; r <= sh.getLastRow(); r++) enrich_(r); }

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false }); }
  if (d.website || d.botcheck) return json_({ ok: true }); // 스팸 봇 차단용 숨은 칸
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let newRow = 0, inq = null;
  try {
    const now = new Date();
    if (d.kind === 'download') { // 자료 다운로드 이력 (연락처 없이도 기록)
      if (!d.file) return json_({ ok: false });
      const dl = dlSheet_(), c = cols_(dl), r = nextRowBy_(dl, c, '일시'), who = !!(d.company || d.email);
      writeRow_(dl, c, r, { '일시': now, '회사명': clean_(d.company, 200), '담당자': clean_(d.name, 100), '연락처': clean_(d.phone, 50), '이메일': clean_(d.email, 200),
        '자료명': clean_(d.title, 200), '구분': who ? '연락처 남김' : '익명', '후속 상태': who ? '미연락' : '', '받은 페이지': clean_(d.page, 200), '언어': clean_(d.lang, 5), '유입 경로': clean_(d.ref, 300), '파일': clean_(d.file, 300) });
      newRow = upsertClient_(d, 'download', now);
    } else {
      if (!d.company && !d.email && !d.message) return json_({ ok: false });
      if (d.source === 'download') return json_({ ok: true }); // 다운로드 신청은 위 "다운로드 이력"으로만 기록 (문의 탭은 견적·기술 문의 전용)
      const sh = sheet_(), c = cols_(sh), r = nextRow_(sh, c);
      KEYS.forEach((k) => {
        const col = c[FIELDS[k]]; if (!col) return;
        sh.getRange(r, col).setValue(k === 'time' ? now : k === 'status' ? '신규' : k === 'source' ? clean_(d.source || 'form') : k === 'category' ? clean_(catName_(d.category), 100) : clean_(d[k]));
      });
      if (c[H.updated]) sh.getRange(r, c[H.updated]).setValue(now);
      newRow = upsertClient_(d, 'inquiry', now);
      inq = { sh: sh, c: c, r: r };
    }
  } finally { lock.releaseLock(); }
  if (inq) { try { newInquiryMail_(inq.sh, inq.c, inq.r); } catch (err) {} } // 담당 팀·관리자 알림
  if (newRow) enrich_(newRow); // 새 업체: 홈페이지 정보 채우기 (잠금 해제 후)
  return json_({ ok: true });
}

// 상태 변경 규칙 (시트 직접 수정·관리자 화면 공통). 문제가 없으면 빈 문자열
function statusRule_(o, st) {
  if (st === '처리중' && !o[H.owner]) return '처리중으로 바꾸기 전에 "사내 담당"을 입력하세요';
  if (st === '완료') {
    const miss = [H.owner, H.memo, H.replied].filter((h) => !o[h]);
    if (miss.length) return '완료 전에 ' + miss.map((h) => '"' + h + '"').join('·') + '을(를) 입력하세요';
  }
  return '';
}

function doGet(e) {
  const p = (e && e.parameter) || {}, tk = token_();
  if (!tk || p.token !== tk) return json_({ ok: false, error: '비밀키 불일치' });
  const sh = sheet_(), c = cols_(sh);
  if (p.action === 'status') {
    const r = parseInt(p.row, 10), st = String(p.status || '');
    if (!(r >= 2 && r <= sh.getLastRow()) || ['신규', '처리중', '완료'].indexOf(st) < 0) return json_({ ok: false, error: '잘못된 요청' });
    const o = rowObj_(sh, c, r), err = statusRule_(o, st);
    if (err) return json_({ ok: false, error: err + ' (구글 시트에서 입력)' });
    sh.getRange(r, c[FIELDS.status]).setValue(st);
    stampAck_(sh, c, r, o);
    if (c[H.updated]) sh.getRange(r, c[H.updated]).setValue(new Date());
    log_(SHEET, sh.getRange(r, c[FIELDS.status]).getA1Notation(), o[FIELDS.company], FIELDS.status, o[FIELDS.status], st, '', '관리자 화면');
    return json_({ ok: true });
  }
  const n = nextRow_(sh, c) - 2;
  const all = n > 0 ? sh.getRange(2, 1, n, sh.getLastColumn()).getValues() : [];
  const extra = { owner: H.owner, memo: H.memo, replied: H.replied, next: H.next, due: '회신 기한', check: '확인 필요', ack: H.ack, stage: H.stage, team: H.team };
  const rows = all.map((v, i) => {
    const o = { row: i + 2 };
    KEYS.concat(Object.keys(extra)).forEach((k) => { const col = c[FIELDS[k] || extra[k]]; if (!col) return; const x = v[col - 1]; o[k] = x instanceof Date ? x.toISOString() : x; });
    return o;
  }).reverse().slice(0, 500);
  return json_({ ok: true, rows: rows, sheetUrl: ss_().getUrl() });
}

/** 시트를 사람이 고칠 때: 변경 로그 기록, 최종 업데이트 시각, 상태 변경 규칙 검사 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet(), name = sh.getName();
  if ([SHEET, CL_SHEET, DL_SHEET].indexOf(name) < 0 || e.range.getRow() < 2) return;
  const who = (e.user && e.user.getEmail && e.user.getEmail()) || '';
  const multi = e.range.getNumRows() > 1 || e.range.getNumColumns() > 1;
  const head = sh.getRange(1, e.range.getColumn(), 1, 1).getValue();
  if (name !== SHEET) {
    const cc = cols_(sh), company = cc['회사명'] ? sh.getRange(e.range.getRow(), cc['회사명']).getValue() : '';
    log_(name, e.range.getA1Notation(), company, multi ? '(여러 칸)' : head, multi ? '' : e.oldValue, multi ? '' : e.value, who, '시트 직접 수정');
    return;
  }
  const c = cols_(sh), r = e.range.getRow(), o = rowObj_(sh, c, r);
  if (!multi && head === FIELDS.status && e.value) {
    const err = statusRule_(o, e.value);
    if (err) {
      e.range.setValue(e.oldValue || '신규');
      ss_().toast(err, '입력 필요 — 상태를 되돌렸습니다', 10);
      log_(name, e.range.getA1Notation(), o[FIELDS.company], '상태 변경 거부', e.oldValue, e.value, who, err);
      return;
    }
  }
  log_(name, e.range.getA1Notation(), o[FIELDS.company], multi ? '(여러 칸)' : head, multi ? '' : e.oldValue, multi ? '' : e.value, who, '시트 직접 수정');
  if (!multi && head === H.owner) stampAck_(sh, c, r, o);
  if (c[H.updated] && e.range.getColumn() !== c[H.updated]) sh.getRange(r, c[H.updated], e.range.getNumRows(), 1).setValue(new Date());
}

/**
 * 필요할 때 실행: "문의"·"다운로드 이력"으로 관심 업체의 문의 수·다운로드 수·접촉일을 다시 계산 (소급 반영).
 * 회사 행이 없으면 추가하고, 홈페이지·회사 정보·직급·등급·영업 담당·메모 등 직접 입력한 칸은 그대로 둠.
 */
function rebuildClients() {
  const sh = clSheet_(), c = cols_(sh), n = sh.getLastRow();
  if (n > 1) ['문의 수', '자료 다운로드 수'].forEach((h) => { if (c[h]) sh.getRange(2, c[h], n - 1, 1).setValue(0); });
  const items = [], q = sheet_(), qc = cols_(q), qn = nextRow_(q, qc) - 2;
  if (qn > 0) q.getRange(2, 1, qn, q.getLastColumn()).getValues().forEach((v) => {
    const o = {}; KEYS.forEach((k) => { const col = qc[FIELDS[k]]; o[k] = col ? v[col - 1] : ''; });
    const t = o.time instanceof Date ? o.time : new Date(o.time);
    if (o.source !== 'test' && o.source !== 'download' && !isNaN(t)) items.push({ d: o, kind: 'inquiry', t: t });
  });
  const dl = dlSheet_(), dc = cols_(dl), dn = nextRowBy_(dl, dc, '일시') - 2;
  if (dn > 0) dl.getRange(2, 1, dn, dl.getLastColumn()).getValues().forEach((v) => {
    const g = (h) => (dc[h] ? v[dc[h] - 1] : '');
    if (g('회사명')) items.push({ d: { company: g('회사명'), name: g('담당자'), phone: g('연락처'), email: g('이메일') }, kind: 'download', t: new Date(g('일시')) });
  });
  items.sort((a, b) => a.t - b.t).forEach((it) => upsertClient_(it.d, it.kind, it.t));
}

// ── 새 문의 알림: 담당 팀(설정 탭 알림 메일) + 관리자(NOTIFY_EMAIL) ──
function newInquiryMail_(sh, c, r) {
  SpreadsheetApp.flush(); // 담당 팀·회신 기한 수식 계산
  const o = rowObj_(sh, c, r), team = String(o[H.team] || ''), mails = teamMails_();
  const to = [mails[team], notifyAdmin_()].filter(Boolean).join(',');
  if (!to) return;
  const body = ['홈페이지 견적·기술 문의가 접수되었습니다.', '',
    '담당 팀: ' + (team || '(미지정 — 설정 탭 제품 분류 표 확인)'), '회신 기한: ' + fmtD_(o[H.due]),
    '회사명: ' + (o[FIELDS.company] || ''), '고객 담당자: ' + (o[FIELDS.name] || '') + (o[FIELDS.title] ? ' ' + o[FIELDS.title] : ''),
    '제품 분류: ' + (o[FIELDS.category] || ''), '관심제품: ' + (o[FIELDS.product] || ''), '', '내용:', String(o[FIELDS.message] || '').slice(0, 1500), '',
    '▶ 담당자는 시트 "사내 담당"에 이름을 넣어 주세요 (접수 확인 시각 자동 기록)', rowLink_(r)].join('\n');
  mail_(to, '[견적 문의] ' + (o[FIELDS.company] || '') + ' — ' + (team || '담당 팀 미지정') + ' · 회신 기한 ' + fmtD_(o[H.due]), body);
}

// ── 평일 아침 알림: 담당 미지정·오늘 기한·기한 초과 (팀별 + 관리자 전체) ──
function remindItems_() {
  const sh = sheet_(), c = cols_(sh), n = nextRow_(sh, c) - 2; if (n < 1) return [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return sh.getRange(2, 1, n, sh.getLastColumn()).getValues().map((v, i) => {
    const g = (h) => (c[h] ? v[c[h] - 1] : '');
    if (!g(FIELDS.time) || g(FIELDS.source) === 'download' || g(FIELDS.status) === '완료' || g(H.replied)) return null;
    const due = g(H.due), d = due instanceof Date ? new Date(due.getFullYear(), due.getMonth(), due.getDate()) : null;
    const kind = d && d < today ? '⛔ 기한 초과' : d && +d === +today ? '⚠ 오늘 기한' : !g(H.owner) ? '담당 미지정' : '';
    if (!kind) return null;
    return { kind: kind, row: i + 2, team: String(g(H.team) || '(팀 미지정)'), company: g(FIELDS.company), due: fmtD_(due), owner: g(H.owner) || '미지정', stage: g(H.stage) || '' };
  }).filter(Boolean);
}
function remindBody_(items) {
  const order = ['⛔ 기한 초과', '⚠ 오늘 기한', '담당 미지정'];
  return order.map((k) => { const l = items.filter((x) => x.kind === k); if (!l.length) return '';
    return '■ ' + k + ' (' + l.length + '건)\n' + l.map((x) => ' - ' + x.company + ' | 회신 기한 ' + x.due + ' | ' + x.team + ' | 사내 담당 ' + x.owner + (x.stage ? ' | ' + x.stage : '') + '\n   ' + rowLink_(x.row)).join('\n'); })
    .filter(Boolean).join('\n\n') + '\n\n회신 후 "회신일"을 넣으면 목록에서 빠집니다. 진행 단계 입력은 선택입니다.';
}
function dailyReminder() {
  const day = new Date().getDay(); if (day === 0 || day === 6) return; // 주말 제외
  const items = remindItems_(); if (!items.length) return;
  const mails = teamMails_(), teams = {};
  items.forEach((x) => { (teams[x.team] = teams[x.team] || []).push(x); });
  Object.keys(teams).forEach((t) => { if (mails[t]) mail_(mails[t], '[회신 기한 알림] ' + t + ' ' + teams[t].length + '건', remindBody_(teams[t])); });
  mail_(notifyAdmin_(), '[회신 기한 알림] 전체 ' + items.length + '건', remindBody_(items));
}
/** 처음 한 번 실행: 평일 아침 알림 예약 (다시 실행해도 중복 생성 안 됨) */
function installTriggers() {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'dailyReminder').forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyReminder').timeBased().everyDays(1).atHour(REMIND_HOUR).create();
}
