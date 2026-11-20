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
 *  - 회신 기한이 지났는데 회신일이 비어 있으면: 담당 팀 + 관리자에게 즉시 1회 메일 (1시간마다 확인, 08~19시. 팀 알림은 설정 탭에서 끌 수 있음)
 *  - 월요일 아침: 연락처를 남겼는데 "미연락"인 자료 다운로드 목록을 관리자에게 메일
 *  - 같은 내용 10분 내 재접수는 1건만 기록, 1시간에 새 문의 알림이 상한(기본 15건)을 넘으면 팀 알림을 멈추고 관리자에게 1회 경고 (스팸 대비)
 *  - 권한 관리 탭: 시트 공유(편집자·뷰어) 현황을 1시간마다 자동 갱신, 부여·해제·변경은 변경 로그에 기록
 *  - 운영 값(관리자 메일·알림 시각·기한 초과 알림 시간대·알림 상한)·진행 단계·회신 기한 영업일·휴무일은 설정 탭에서 직접 변경 (코드 수정 불필요)
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
const NA_STAGE = /^해당 없음/; // 진행 단계 "해당 없음(영업 제안·스팸)" → 상태 완료, 알림·지표 제외
const REPLIED_STAGES = ['견적 발송', '협의 중', '수주', '실주']; // 기본값. 설정 탭 "진행 단계·회신으로 봄" 표가 있으면 그 표를 따름
const H = { owner: '사내 담당', memo: '처리 메모', replied: '회신일', next: '다음 조치일', updated: '최종 업데이트', ack: '접수 확인', stage: '진행 단계', due: '회신 기한', team: '담당 팀' };
const SET_SHEET = '설정';
// 아래 값은 기본값. 설정 탭 "운영 설정 · 값" 표에 같은 항목이 있으면 그 값을 씀 (코드 수정 없이 시트에서 변경)
const REMIND_HOUR = 9, WATCH_FROM = 8, WATCH_TO = 19, MAIL_CAP = 15, DUP_SEC = 600;
const CFG = { admin: '관리자 메일', remind: '아침 알림 시각(시)', from: '기한 초과 알림 시작(시)', to: '기한 초과 알림 종료(시)', cap: '1시간 알림 상한(건)', overTeam: '기한 초과 시 담당 팀에도 알림', dlMail: '다운로드 알림 메일', sender: '알림 발신자 이름', mkt: '마케팅 지표 시트 주소' };
const DL_LABELS = ['일시', '회사명', '담당자', '연락처', '이메일', '자료명', '구분', '후속 상태', '사내 담당', '메모', '받은 페이지', '언어', '유입 경로', '파일', '관심 제품', '담당 팀'];
const CL_LABELS = ['회사명', '구분', '홈페이지', '회사 정보', '고객 담당자', '직급·직책', '연락처', '이메일', '문의 수', '자료 다운로드 수', '최근 문의 유형', '관심제품', '첫 접촉일', '최근 접촉일', '등급', '영업 담당', '메모', '키', '담당 팀'];
// 무료 메일 주소는 회사 홈페이지를 알 수 없으므로 제외
const FREE_MAIL = /@(gmail|naver|daum|hanmail|nate|kakao|hotmail|outlook|live|yahoo|icloud|me|korea|empas|paran|chol|dreamwiz)\./i;
const LOG_LABELS = ['일시', '시트', '셀', '회사명', '항목', '이전 값', '새 값', '수정자', '경로'];
const ACL_SHEET = '권한 관리', ACL_LABELS = ['구글 계정', '이름', '소속', '권한', '상태', '부여 확인일', '해제 확인일', '메모'];

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
function aclSheet_() { let sh = ss_().getSheetByName(ACL_SHEET); if (!sh) { sh = ss_().insertSheet(ACL_SHEET); header_(sh, ACL_LABELS, '#7a2e8e'); } return sh; }
function logSheet_() { let sh = ss_().getSheetByName(LOG_SHEET); if (!sh) { sh = ss_().insertSheet(LOG_SHEET); header_(sh, LOG_LABELS, '#667085'); } return sh; }
function log_(sheet, a1, company, item, before, after, who, via) {
  try { logSheet_().appendRow([new Date(), sheet, a1, clean_(company, 200), item, clean_(before, 500), clean_(after, 500), who || '', via]); } catch (err) {}
}

// 회사 식별 키: 공백·법인 표기 제거 후 소문자
// ── 알림 메일 ──
// 담당 팀 칸에 여러 팀(쉼표·/·· 구분)을 적으면 공동 담당 → 팀 이름 목록
function teamsOf_(s) { return String(s || '').split(/\s*[,/·]\s*/).map((x) => x.trim()).filter(Boolean); }
// ── 설정 탭 운영 설정 (사람이 시트에서 바꾸는 값) ──
function cfg_() { // 매번 시트에서 읽음 (바꾼 값이 바로 반영)
  const m = {};
  try {
    const sh = ss_().getSheetByName(SET_SHEET);
    if (sh && sh.getLastRow() > 1) { const c = cols_(sh), k = c['운영 설정'], v = c['값'];
      if (k && v) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues().forEach((r) => { const key = String(r[k - 1]).trim(); if (key) m[key] = r[v - 1]; }); }
  } catch (err) {}
  return m;
}
function cfgNum_(key, def, lo, hi) { const raw = cfg_()[key], n = Number(raw); return String(raw === undefined ? '' : raw).trim() !== '' && isFinite(n) && n >= lo && n <= hi ? Math.floor(n) : def; }
function repliedStages_() { // 설정 탭 "진행 단계" 표에서 "회신으로 봄" 체크된 단계
  try {
    const sh = ss_().getSheetByName(SET_SHEET), c = cols_(sh), s = c['진행 단계'], f = c['회신으로 봄'];
    if (s && f && sh.getLastRow() > 1) { const l = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues().filter((r) => String(r[s - 1]).trim() && r[f - 1] === true).map((r) => String(r[s - 1]).trim()); if (l.length) return l; }
  } catch (err) {}
  return REPLIED_STAGES;
}
// 설정 탭 "제품 분류 → 담당 팀" 표로 관심 제품(쉼표 구분)의 담당 팀 찾기 (공동 담당 포함). 없으면 "제품 미선택 문의 담당 팀"
function catTeams_(names) {
  const want = String(names || '').split(/\s*,\s*/).filter(Boolean), out = [];
  try {
    const sh = ss_().getSheetByName(SET_SHEET), c = cols_(sh), k = c['제품 분류'], t1 = c['담당 팀'], t2 = c['담당 팀 2'];
    if (k && t1 && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues().forEach((r) => {
      if (want.indexOf(String(r[k - 1]).trim()) >= 0) [r[t1 - 1], t2 ? r[t2 - 1] : ''].forEach((x) => { x = String(x || '').trim(); if (x && out.indexOf(x) < 0) out.push(x); });
    });
  } catch (err) {}
  return out.join(', ') || String(cfg_()['제품 미선택 문의 담당 팀'] || '').trim();
}
// 관심 업체 "담당 팀": 비어 있을 때만 채움 (사람이 바꾼 값 유지)
function clTeam_(company, team) {
  try {
    const k = key_(company); if (!k || !team) return;
    const sh = clSheet_(), c = cols_(sh); if (!c['담당 팀'] || !c['키'] || sh.getLastRow() < 2) return;
    const keys = sh.getRange(2, c['키'], sh.getLastRow() - 1, 1).getValues().map((r) => r[0]), i = keys.indexOf(k);
    if (i >= 0 && !String(sh.getRange(i + 2, c['담당 팀']).getValue()).trim()) sh.getRange(i + 2, c['담당 팀']).setValue(team);
  } catch (err) {}
}
function notifyAdmin_() {
  const v = String(cfg_()[CFG.admin] || '').split(/[,;\s]+/).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).join(',');
  return v || NOTIFY_EMAIL || PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || '';
}
function teamMails_() { // 설정 탭 "알림 팀"·"알림 사용"·"알림 메일 1~5" 표 → { 영업1팀: 'a@x.com,b@x.com' }
  const sh = ss_().getSheetByName(SET_SHEET), m = {}; if (!sh || sh.getLastRow() < 2) return m;
  const c = cols_(sh), t = c['알림 팀'], use = c['알림 사용'];
  const es = Object.keys(c).filter((h) => /^알림 메일/.test(h)).map((h) => c[h]); if (!t || !es.length) return m;
  // "알림 메일", "알림 메일 1~5" 열 모두 읽음. 한 칸에 여러 메일(쉼표·세미콜론·줄바꿈)·같은 팀 여러 줄도 합침 (중복 제거)
  // "알림 사용" 열이 있으면 체크된 줄만 발송 (체크 해제 = 보류)
  sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues().forEach((v) => {
    const k = String(v[t - 1]).trim(); if (!k) return;
    if (use && v[use - 1] !== true) return;
    es.forEach((e) => String(v[e - 1]).split(/[,;\s]+/).map((x) => x.trim()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).forEach((x) => {
      const l = m[k] ? m[k].split(',') : []; if (l.indexOf(x) < 0) l.push(x); m[k] = l.join(',');
    }));
  });
  return m;
}
function fmtD_(d) { return d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), 'MM-dd(E)') : String(d || ''); }
// 알림 메일 보낸 사람 이름 (발신 주소는 시트 소유 계정으로 고정됨). 설정 탭 운영 설정 "알림 발신자 이름"으로 변경 가능
function mail_(to, subject, body) {
  if (!to) return false;
  let name = 'SMG 홈페이지 문의'; try { name = String(cfg_()[CFG.sender] || '').trim() || name; } catch (err) {}
  try { MailApp.sendEmail({ to: to, subject: String(subject).slice(0, 200), body: body, name: name }); return true; } catch (err) { return false; }
}
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
  let newRow = 0, inq = null, dlNote = null;
  try {
    const now = new Date();
    if (d.kind === 'download') { // 자료 다운로드 이력 (연락처 없이도 기록)
      if (!d.file) return json_({ ok: false });
      d.product = catName_(d.product); const team = d.product ? catTeams_(d.product) : '';
      const dl = dlSheet_(), c = cols_(dl), r = nextRowBy_(dl, c, '일시'), who = !!(d.company || d.email);
      writeRow_(dl, c, r, { '일시': now, '회사명': clean_(d.company, 200), '담당자': clean_(d.name, 100), '연락처': clean_(d.phone, 50), '이메일': clean_(d.email, 200),
        '자료명': clean_(d.title, 200), '구분': who ? '연락처 남김' : '익명', '후속 상태': who ? '미연락' : '', '받은 페이지': clean_(d.page, 200), '언어': clean_(d.lang, 5), '유입 경로': clean_(d.ref, 300), '파일': clean_(d.file, 300), '관심 제품': clean_(d.product, 200), '담당 팀': team });
      newRow = upsertClient_(Object.assign({}, d, { title: '' }), 'download', now); // title = 자료명 (직급·직책 아님)
      clTeam_(d.company, team);
      if (who) dlNote = { d: Object.assign({ team: team }, d), r: r, sh: dl };
    } else {
      if (!d.company && !d.email && !d.message) return json_({ ok: false });
      if (d.source === 'download') return json_({ ok: true }); // 다운로드 신청은 위 "다운로드 이력"으로만 기록 (문의 탭은 견적·기술 문의 전용)
      if (isDup_(d)) return json_({ ok: true, dup: true }); // 같은 내용 연속 접수(새로고침·스팸) 1건만
      const sh = sheet_(), c = cols_(sh), r = nextRow_(sh, c);
      KEYS.forEach((k) => {
        const col = c[FIELDS[k]]; if (!col) return;
        sh.getRange(r, col).setValue(k === 'time' ? now : k === 'status' ? '신규' : k === 'source' ? clean_(d.source || 'form') : k === 'category' ? clean_(catName_(d.category), 100) : clean_(d[k]));
      });
      if (c[H.updated]) sh.getRange(r, c[H.updated]).setValue(now);
      newRow = upsertClient_(d, 'inquiry', now); clTeam_(d.company, catTeams_(catName_(d.category)));
      inq = { sh: sh, c: c, r: r };
    }
  } finally { lock.releaseLock(); }
  if (inq) { try { newInquiryMail_(inq.sh, inq.c, inq.r); } catch (err) {} } // 담당 팀·관리자 알림
  if (dlNote) { try { downloadMail_(dlNote); } catch (err) {} } // 연락처 남긴 자료 다운로드 → 관리자 알림
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
  if (!multi && head === FIELDS.category && String(e.value || '') !== String(e.oldValue || '') && o[FIELDS.status] !== '완료') e.range.setNote(REASSIGN_NOTE + ' (' + (e.oldValue || '없음') + ' → ' + (e.value || '없음') + ')');
  if (!multi && e.value && head === H.stage && NA_STAGE.test(e.value)) { closeNA_(sh, c, r, o, who); return; }
  if (!multi && e.value && (head === H.replied || head === H.stage)) autoReplied_(sh, c, r, o, who, head === H.stage && repliedStages_().indexOf(e.value) >= 0);
  if (c[H.updated] && e.range.getColumn() !== c[H.updated]) sh.getRange(r, c[H.updated], e.range.getNumRows(), 1).setValue(new Date());
}

// 진행 자동화: 진행 단계를 고르거나 회신일을 넣으면 상태 "신규" → "처리중" (사내 담당이 있을 때)
//  + 회신으로 보는 단계(설정 탭 "회신으로 봄" 체크: 견적 발송·협의 중·수주·실주)면 회신일이 비어 있을 때 오늘 날짜 → 회신 기한 알림에서 빠짐
// "해당 없음(영업 제안·스팸)": 고객 회신 대상 아님 → 상태 완료(규칙 예외), 처리 메모 자동, 회신 기한 알림·지표에서 제외
function closeNA_(sh, c, r, o, who) {
  if (c[H.memo] && !o[H.memo]) sh.getRange(r, c[H.memo]).setValue('해당 없음 처리 (영업 제안·스팸 등)');
  if (o[FIELDS.status] !== '완료') { sh.getRange(r, c[FIELDS.status]).setValue('완료'); log_(SHEET, sh.getRange(r, c[FIELDS.status]).getA1Notation(), o[FIELDS.company], FIELDS.status, o[FIELDS.status], '완료', who, '자동 (해당 없음)'); }
  ss_().toast('해당 없음으로 처리했습니다 (상태 완료, 알림·지표 제외).', '진행 처리', 6);
}
function autoReplied_(sh, c, r, o, who, fillReply) {
  const done = [];
  if (fillReply && c[H.replied] && !o[H.replied]) { const d = new Date(); d.setHours(0, 0, 0, 0); sh.getRange(r, c[H.replied]).setValue(d); log_(SHEET, sh.getRange(r, c[H.replied]).getA1Notation(), o[FIELDS.company], H.replied, '', fmtD_(d), who, '자동 (진행 단계: ' + o[H.stage] + ')'); done.push('회신일 오늘'); }
  if (o[FIELDS.status] === '신규' && o[H.owner]) { sh.getRange(r, c[FIELDS.status]).setValue('처리중'); log_(SHEET, sh.getRange(r, c[FIELDS.status]).getA1Notation(), o[FIELDS.company], FIELDS.status, '신규', '처리중', who, '자동 (진행 단계·회신)'); done.push('상태 처리중'); }
  if (done.length) ss_().toast(done.join(' · ') + ' 으로 자동 변경했습니다.' + (fillReply ? ' 회신일이 다르면 직접 고쳐 주세요.' : ''), '진행 처리', 6);
  else if (!o[H.owner] && o[FIELDS.status] === '신규') ss_().toast('"사내 담당"을 입력하면 상태가 처리중으로 바뀝니다.', '진행 처리', 6);
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
    if (g('회사명')) items.push({ d: { company: g('회사명'), name: g('담당자'), phone: g('연락처'), email: g('이메일'), product: g('관심 제품') }, kind: 'download', t: new Date(g('일시')) });
  });
  items.sort((a, b) => a.t - b.t).forEach((it) => upsertClient_(it.d, it.kind, it.t));
}

// ── 스팸·중복 대비 ──
function cache_() { try { return CacheService.getScriptCache(); } catch (err) { return null; } }
function isDup_(d) {
  const cc = cache_(); if (!cc) return false;
  const raw = [d.company, d.email, d.phone, d.message].map((x) => String(x || '').trim().toLowerCase()).join('|');
  const key = 'dup_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw, Utilities.Charset.UTF_8));
  if (cc.get(key)) return true;
  cc.put(key, '1', DUP_SEC); return false;
}
function overCap_() { // 1시간(마지막 알림 기준) 동안 새 문의 알림 수가 상한을 넘으면 true
  const cc = cache_(); if (!cc) return false;
  const n = (Number(cc.get('mail_n')) || 0) + 1, cap = cfgNum_(CFG.cap, MAIL_CAP, 1, 1000); cc.put('mail_n', String(n), 3600);
  if (n === cap + 1) mail_(notifyAdmin_(), '[주의] 1시간 동안 새 문의 ' + cap + '건 초과 — 팀 알림 일시 중단',
    '짧은 시간에 문의가 몰려 담당 팀 알림 메일을 잠시 멈췄습니다. 스팸일 수 있으니 시트 "문의" 탭을 확인해 주세요.\n접수 기록은 계속 저장되며, 1시간 동안 새 문의가 없으면 알림이 다시 나갑니다.\n' + ss_().getUrl());
  return n > cap;
}

// ── 자료 다운로드(연락처 남김) 알림 → 관리자. 설정 탭 "다운로드 알림 메일" = 아니오 이면 끔 ──
function downloadMail_(x) {
  if (/^(아니오|아니요|no|off|미사용|x)$/i.test(String(cfg_()[CFG.dlMail] || '').trim())) return;
  const to = notifyAdmin_(); if (!to) return;
  const d = x.d, link = ss_().getUrl() + '#gid=' + x.sh.getSheetId() + '&range=A' + x.r;
  mail_(to, '[자료 다운로드] ' + (d.company || '') + ' — ' + (d.title || d.file || ''),
    ['홈페이지에서 연락처를 남기고 자료를 받았습니다.', '', '회사명: ' + (d.company || ''), '담당자: ' + (d.name || ''), '이메일: ' + (d.email || ''), '연락처: ' + (d.phone || ''),
     '자료: ' + (d.title || d.file || ''), '관심 제품: ' + (d.product || ''), '담당 팀: ' + (d.team || ''), '받은 페이지: ' + (d.page || ''), '', '▶ 후속 연락 후 "다운로드 이력" 탭의 후속 상태를 바꿔 주세요', link].join('\n'));
}

// ── 새 문의 알림: 담당 팀(설정 탭 알림 메일) + 관리자(NOTIFY_EMAIL) ──
function newInquiryMail_(sh, c, r, reassign) {
  if (overCap_()) return;
  SpreadsheetApp.flush(); // 담당 팀·회신 기한 수식 계산
  const o = rowObj_(sh, c, r), team = String(o[H.team] || ''), mails = teamMails_();
  const to = teamsOf_(team).map((t) => mails[t]).concat(notifyAdmin_()).filter(Boolean).join(',');
  if (!to) return;
  const body = [reassign ? '제품 분류가 바뀌어 담당 팀이 재배정된 문의입니다. (' + reassign + ')' : '홈페이지 견적·기술 문의가 접수되었습니다.', '',
    '담당 팀: ' + (team || '(미지정 — 설정 탭 제품 분류 표 확인)'), '회신 기한: ' + fmtD_(o[H.due]),
    '회사명: ' + (o[FIELDS.company] || ''), '고객 담당자: ' + (o[FIELDS.name] || '') + (o[FIELDS.title] ? ' ' + o[FIELDS.title] : ''),
    '제품 분류: ' + (o[FIELDS.category] || ''), '관심제품: ' + (o[FIELDS.product] || ''), '', '내용:', String(o[FIELDS.message] || '').slice(0, 1500), '',
    '▶ 담당자는 시트 "사내 담당"에 이름을 넣어 주세요 (접수 확인 시각 자동 기록)', rowLink_(r)].join('\n');
  mail_(to, (reassign ? '[담당 재배정] ' : '[견적 문의] ') + (o[FIELDS.company] || '') + ' — ' + (team || '담당 팀 미지정') + ' · 회신 기한 ' + fmtD_(o[H.due]), body);
}

// 문의 탭 "제품 분류"를 사람이 바꾸면 onEdit가 메모로 표시 → 1시간마다 새 담당 팀(+관리자)에 재배정 알림 (메일은 단순 onEdit에서 못 보냄)
const REASSIGN_NOTE = '담당 재배정 알림 대기';
function reassignWatch_() {
  const sh = sheet_(), c = cols_(sh), col = c[FIELDS.category], n = nextRow_(sh, c) - 2; if (!col || n < 1) return;
  const notes = sh.getRange(2, col, n, 1).getNotes();
  notes.forEach((x, i) => {
    const s = String(x[0] || ''); if (s.indexOf(REASSIGN_NOTE) !== 0) return;
    const r = i + 2; newInquiryMail_(sh, c, r, s.slice(REASSIGN_NOTE.length).replace(/^\s*\(|\)\s*$/g, '') || '제품 분류 변경');
    sh.getRange(r, col).setNote('담당 재배정 알림 발송 ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM-dd HH:mm'));
  });
}

// ── 평일 아침 알림: 담당 미지정·오늘 기한·기한 초과 (팀별 + 관리자 전체) ──
function remindItems_() {
  const sh = sheet_(), c = cols_(sh), n = nextRow_(sh, c) - 2; if (n < 1) return [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return sh.getRange(2, 1, n, sh.getLastColumn()).getValues().map((v, i) => {
    const g = (h) => (c[h] ? v[c[h] - 1] : '');
    if (!g(FIELDS.time) || g(FIELDS.source) === 'download' || g(FIELDS.status) === '완료' || g(H.replied) || NA_STAGE.test(String(g(H.stage)))) return null;
    const due = g(H.due), d = due instanceof Date ? new Date(due.getFullYear(), due.getMonth(), due.getDate()) : null;
    const kind = d && d < today ? '⛔ 기한 초과' : d && +d === +today ? '⚠ 오늘 기한' : !g(H.owner) ? '담당 미지정' : '';
    if (!kind) return null;
    return { kind: kind, row: i + 2, at: g(FIELDS.time), team: String(g(H.team) || '(팀 미지정)'), company: g(FIELDS.company), due: fmtD_(due), owner: g(H.owner) || '미지정', stage: g(H.stage) || '' };
  }).filter(Boolean);
}
function remindBody_(items) {
  const order = ['⛔ 기한 초과', '⚠ 오늘 기한', '담당 미지정'];
  return order.map((k) => { const l = items.filter((x) => x.kind === k); if (!l.length) return '';
    return '■ ' + k + ' (' + l.length + '건)\n' + l.map((x) => ' - ' + x.company + ' | 회신 기한 ' + x.due + ' | ' + x.team + ' | 사내 담당 ' + x.owner + (x.stage ? ' | ' + x.stage : '') + '\n   ' + rowLink_(x.row)).join('\n'); })
    .filter(Boolean).join('\n\n') + '\n\n회신 후 "회신일"을 넣으면 목록에서 빠집니다. 진행 단계 입력은 선택입니다.';
}
// ── 월요일 아침: 연락처 남긴 "미연락" 다운로드 → 관리자 ──
function downloadFollowupMail_() {
  const to = notifyAdmin_(); if (!to) return;
  const sh = dlSheet_(), c = cols_(sh), n = nextRowBy_(sh, c, '일시') - 2; if (n < 1) return;
  const g = (v, h) => (c[h] ? v[c[h] - 1] : '');
  const list = sh.getRange(2, 1, n, sh.getLastColumn()).getValues().map((v, i) => ({ v: v, row: i + 2 }))
    .filter((x) => g(x.v, '구분') === '연락처 남김' && g(x.v, '후속 상태') === '미연락');
  if (!list.length) return;
  const link = (r) => ss_().getUrl() + '#gid=' + sh.getSheetId() + '&range=A' + r;
  const body = list.map((x) => ' - ' + fmtD_(g(x.v, '일시')) + ' | ' + g(x.v, '회사명') + ' | ' + g(x.v, '담당자') + ' | ' + g(x.v, '이메일') + ' | ' + g(x.v, '자료명') + '\n   ' + link(x.row)).join('\n');
  mail_(to, '[다운로드 후속] 미연락 ' + list.length + '건', '연락처를 남기고 자료를 받았지만 아직 연락하지 않은 업체입니다. 연락 후 "후속 상태"를 바꿔 주세요.\n\n' + body);
}
// ── 업데이트 확인 요청 (독촉 아님): 처리 중인 문의의 진행 상황이 시트에 최신인지 확인 부탁 ──
// ① 다음 조치일 지남 ② 같은 상태로 오래 머묾(설정 탭 진행 단계 표 "확인 요청(일)", 단계 미입력은 7일) ③ 회신 후 진행 단계 미입력
// 기준 = 마지막 수정(최종 업데이트). 같은 건은 3일에 한 번만 포함. 사람이 행을 고치면 자동으로 빠짐
const NUDGE_EVERY = 3, NUDGE_NOSTAGE = 7;
function stageDays_() {
  const m = {};
  try {
    const sh = ss_().getSheetByName(SET_SHEET), c = cols_(sh), s = c['진행 단계'], d = c['확인 요청(일)'];
    if (s && d && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues().forEach((r) => { const k = String(r[s - 1]).trim(), n = Number(r[d - 1]); if (k && String(r[d - 1]).trim() !== '' && n > 0) m[k] = n; });
  } catch (err) {}
  return m;
}
function nudgeItems_() {
  const sh = sheet_(), c = cols_(sh), n = nextRow_(sh, c) - 2; if (n < 1) return [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = stageDays_(), p = PropertiesService.getScriptProperties();
  let sent = {}; try { sent = JSON.parse(p.getProperty('NUDGE_SENT') || '{}'); } catch (err) {}
  const day0 = (d) => (d instanceof Date ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null), gap = (d) => Math.floor((today - d) / 86400000);
  const out = [], keep = {};
  sh.getRange(2, 1, n, sh.getLastColumn()).getValues().forEach((v, i) => {
    const g = (h) => (c[h] ? v[c[h] - 1] : '');
    if (!g(FIELDS.time) || g(FIELDS.source) === 'download' || g(FIELDS.status) === '완료' || NA_STAGE.test(String(g(H.stage)))) return;
    const stage = String(g(H.stage) || '').trim(), next = day0(g(H.next)), upd = day0(g(H.updated) || g(FIELDS.time)), why = [];
    if (next && next < today) why.push('다음 조치일(' + fmtD_(g(H.next)) + ') 지남');
    const lim = stage ? days[stage] : NUDGE_NOSTAGE;
    if (upd && lim && gap(upd) >= lim) why.push((stage ? '"' + stage + '" 상태' : '진행 단계 미입력') + ' ' + gap(upd) + '일째 변동 없음');
    if (g(H.replied) && !stage) why.push('회신일은 있으나 진행 단계 미입력');
    if (!why.length) return;
    const key = (g(FIELDS.time) instanceof Date ? g(FIELDS.time).getTime() : String(g(FIELDS.time))) + '|' + g(FIELDS.company), last = sent[key] ? new Date(sent[key]) : null;
    if (last && gap(last) < NUDGE_EVERY) { keep[key] = sent[key]; return; }
    keep[key] = today.toISOString();
    out.push({ row: i + 2, team: String(g(H.team) || '(팀 미지정)'), company: g(FIELDS.company), owner: g(H.owner) || '미지정', stage: stage || '미입력', why: why.join(', ') });
  });
  p.setProperty('NUDGE_SENT', JSON.stringify(keep));
  return out;
}
function nudgeBody_(items) {
  return ['확인 부탁드립니다. (독촉 메일이 아닙니다)', '아래 문의의 진행 상황이 시트에 최신으로 반영되어 있는지 확인해 주시고, 변동이 있으면 업데이트해 주세요.', '진행 단계·처리 메모를 수정하면 목록에서 빠집니다. 변동이 없다면 처리 메모에 "진행 상황 동일"만 남겨 주셔도 됩니다. 다음 조치일이 지난 건은 다음 조치일을 새로 넣어 주세요.', '',
    items.map((x) => ' - ' + x.company + ' | ' + x.team + ' | 사내 담당 ' + x.owner + ' | 진행 단계 ' + x.stage + '\n   확인 사유: ' + x.why + '\n   ' + rowLink_(x.row)).join('\n')].join('\n');
}
function nudgeMail_() {
  const items = nudgeItems_(); if (!items.length) return;
  const mails = teamMails_(), teams = {};
  items.forEach((x) => teamsOf_(x.team).forEach((t) => { (teams[t] = teams[t] || []).push(x); }));
  Object.keys(teams).forEach((t) => { if (mails[t]) mail_(mails[t], '[업데이트 확인 요청] ' + t + ' ' + teams[t].length + '건', nudgeBody_(teams[t])); });
  mail_(notifyAdmin_(), '[업데이트 확인 요청] 전체 ' + items.length + '건', nudgeBody_(items));
}
function dailyReminder() {
  const day = new Date().getDay(); if (day === 0 || day === 6) return; // 주말 제외
  if (day === 1) { try { downloadFollowupMail_(); } catch (err) {} }
  try { nudgeMail_(); } catch (err) {}
  const items = remindItems_(); if (!items.length) return;
  const mails = teamMails_(), teams = {};
  items.forEach((x) => teamsOf_(x.team).forEach((t) => { (teams[t] = teams[t] || []).push(x); })); // 공동 담당(예: 영업1팀, 부설연구소)은 각 팀에 모두
  Object.keys(teams).forEach((t) => { if (mails[t]) mail_(mails[t], '[회신 기한 알림] ' + t + ' ' + teams[t].length + '건', remindBody_(teams[t])); });
  mail_(notifyAdmin_(), '[회신 기한 알림] 전체 ' + items.length + '건', remindBody_(items));
}
// ── 기한 초과 즉시 알림: 회신 기한이 지난 미회신 건 → 관리자에게 건별 1회 ──
function overdueKey_(x) { return (x.at instanceof Date ? x.at.getTime() : String(x.at)) + '|' + x.company; }
function overdueWatch() {
  const h = new Date().getHours(); if (h < cfgNum_(CFG.from, WATCH_FROM, 0, 23) || h > cfgNum_(CFG.to, WATCH_TO, 0, 23)) return;
  const to = notifyAdmin_(), teamOn = !/^(아니오|아니요|no|off|미사용|x)$/i.test(String(cfg_()[CFG.overTeam] || '').trim());
  const p = PropertiesService.getScriptProperties();
  let sent = []; try { sent = JSON.parse(p.getProperty('OVERDUE_SENT') || '[]'); } catch (err) {}
  const items = remindItems_().filter((x) => x.kind === '⛔ 기한 초과');
  const fresh = items.filter((x) => sent.indexOf(overdueKey_(x)) < 0);
  if (fresh.length) {
    const nm = (l) => l.slice(0, 3).map((x) => x.company).join(', ') + (l.length > 3 ? ' 외 ' + (l.length - 3) + '건' : '');
    const head = '회신 기한이 지났는데 "회신일"이 비어 있는 건입니다. 고객 회신 후 "진행 단계"를 선택하거나 "회신일"을 입력해 주세요.\n\n';
    let ok = false, tried = false;
    if (teamOn) { // 담당 팀(공동 담당 포함)에도 팀별로
      const mails = teamMails_(), teams = {};
      fresh.forEach((x) => teamsOf_(x.team).forEach((t) => { (teams[t] = teams[t] || []).push(x); }));
      Object.keys(teams).forEach((t) => { if (!mails[t]) return; tried = true; if (mail_(mails[t], '[⛔ 회신 기한 초과] ' + t + ' · ' + nm(teams[t]), head + remindBody_(teams[t]))) ok = true; });
    }
    if (to) { tried = true; if (mail_(to, '[⛔ 회신 기한 초과] ' + nm(fresh), head + remindBody_(fresh))) ok = true; }
    if (!tried) return; // 받을 사람이 없으면 기록하지 않음 (설정 후 다시 알림)
    if (!ok) return; // 발송 실패 → 다음 확인 때 다시 시도
  }
  p.setProperty('OVERDUE_SENT', JSON.stringify(items.map(overdueKey_))); // 지금 초과 중인 건만 보관 (회신되면 자동 정리)
}
// ── 1시간마다 실행: 기한 초과 확인 + 설정 탭 "아침 알림 시각"이 되면 하루 1번 아침 알림 ──
// 정기 점검: 진행 단계·사내 담당이 있는데 상태가 "신규"로 남은 행 → "처리중" (여러 칸 붙여넣기·배포 전 입력 등 자동 처리가 빠진 경우 보정)
function syncStatus_() {
  const sh = sheet_(), c = cols_(sh), n = nextRow_(sh, c) - 2; if (n < 1 || !c[FIELDS.status] || !c[H.owner] || !c[H.stage]) return 0;
  let k = 0;
  sh.getRange(2, 1, n, sh.getLastColumn()).getValues().forEach((v, i) => {
    if (v[c[FIELDS.status] - 1] === '신규' && String(v[c[H.owner] - 1]).trim() && String(v[c[H.stage] - 1]).trim() && v[c[FIELDS.source] - 1] !== 'download') {
      const r = i + 2; sh.getRange(r, c[FIELDS.status]).setValue('처리중'); k++;
      log_(SHEET, sh.getRange(r, c[FIELDS.status]).getA1Notation(), v[c[FIELDS.company] - 1], FIELDS.status, '신규', '처리중', '', '자동 (정기 점검: 진행 단계 입력됨)');
    }
  });
  return k;
}
// ── 시트 접근 권한 현황·이력: 1시간마다 공유 목록을 읽어 "권한 관리" 탭 갱신, 바뀐 내용은 변경 로그에 기록 ──
//  (부여·해제한 사람은 구글이 알려주지 않으므로 "메모" 칸에 직접 적음. 확인일 = 시스템이 감지한 시각, 최대 1시간 차이)
function syncAccess_() {
  const ss = ss_(), own = String((ss.getOwner() && ss.getOwner().getEmail()) || '').toLowerCase(), cur = {};
  ss.getEditors().forEach((u) => { const e = String(u.getEmail() || '').toLowerCase(); if (e) cur[e] = e === own ? '소유자' : '편집자'; });
  // getViewers()는 구글 채팅방·그룹 공유가 있으면 서버 오류가 날 수 있음 → 실패 시 뷰어는 건드리지 않고 편집자만 갱신
  let viewersOk = true;
  try { ss.getViewers().forEach((u) => { const e = String(u.getEmail() || '').toLowerCase(); if (e && !cur[e]) cur[e] = '뷰어'; }); } catch (err) { viewersOk = false; }
  const sh = aclSheet_(), c = cols_(sh), now = new Date(), seen = {};
  let n = sh.getLastRow(); let k = 0;
  const vals = n > 1 ? sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues() : [];
  const lg = (r, email, item, before, after) => { k++; log_(ACL_SHEET, sh.getRange(r, c['구글 계정']).getA1Notation(), email, item, before, after, '', '자동 (권한 점검)'); };
  vals.forEach((v, i) => {
    const r = i + 2, e = String(v[c['구글 계정'] - 1] || '').trim().toLowerCase(); if (!e) return; seen[e] = 1;
    const st = v[c['상태'] - 1], role = v[c['권한'] - 1];
    if (!cur[e] && !viewersOk) return; // 뷰어 목록을 못 읽은 경우: 편집자→뷰어 변경일 수 있으므로 해제 판정 안 함
    if (cur[e]) {
      if (st !== '사용 중') { writeRow_(sh, c, r, { '상태': '사용 중', '권한': cur[e], '부여 확인일': now, '해제 확인일': '' }); lg(r, e, '권한 부여', st || '', cur[e]); }
      else if (role !== cur[e]) { writeRow_(sh, c, r, { '권한': cur[e] }); lg(r, e, '권한 변경', role, cur[e]); }
    } else if (st === '사용 중') { writeRow_(sh, c, r, { '상태': '해제', '해제 확인일': now }); lg(r, e, '권한 해제', role, '해제'); }
  });
  Object.keys(cur).filter((e) => !seen[e]).forEach((e) => { n = nextRowBy_(sh, c, '구글 계정'); writeRow_(sh, c, n, { '구글 계정': e, '권한': cur[e], '상태': '사용 중', '부여 확인일': now }); lg(n, e, '권한 부여', '', cur[e]); });
  return k;
}
/** 필요할 때 실행: 권한 현황 즉시 갱신 */
function 권한점검() { return syncAccess_(); }
// ── 마케팅 지표 시트로 월별 실제 영업 수치 보내기: 문의(해당 없음 제외)·자료 다운로드(개인정보 동의·연락처 남김) ──
//  설정 탭 운영 설정 "마케팅 지표 시트 주소"(시트 주소 또는 ID)가 있을 때만. 대상 시트 "영업_월별" 탭을 통째로 새로 씀
function pushMarketing_() {
  const raw = String(cfg_()[CFG.mkt] || '').trim(); if (!raw) return;
  const id = (raw.match(/\/d\/([\w-]{20,})/) || [])[1] || raw;
  const m = {}, mon = (d) => (d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM') : String(d).slice(0, 7));
  const get = (k) => (m[k] = m[k] || [k, 0, 0]);
  const sh = sheet_(), c = cols_(sh), n = nextRow_(sh, c) - 2;
  if (n > 0) sh.getRange(2, 1, n, sh.getLastColumn()).getValues().forEach((v) => {
    const t = v[c[FIELDS.time] - 1]; if (!t || v[c[FIELDS.source] - 1] === 'download' || NA_STAGE.test(String(c[H.stage] ? v[c[H.stage] - 1] : ''))) return;
    get(mon(t))[1]++;
  });
  const dl = dlSheet_(), dc = cols_(dl), dn = nextRowBy_(dl, dc, '일시') - 2;
  if (dn > 0) dl.getRange(2, 1, dn, dl.getLastColumn()).getValues().forEach((v) => {
    const t = v[dc['일시'] - 1]; if (!t || v[dc['구분'] - 1] !== '연락처 남김') return; get(mon(t))[2]++;
  });
  const out = SpreadsheetApp.openById(id); let ts = out.getSheetByName('영업_월별'); if (!ts) ts = out.insertSheet('영업_월별');
  const rows = [['월', '문의 접수(실제)', '자료 다운로드(동의)']].concat(Object.keys(m).sort().map((k) => m[k]));
  ts.clearContents(); ts.getRange(1, 1, rows.length, 3).setValues(rows); ts.getRange(1, 1, 1, 3).setFontWeight('bold');
  ts.getRange(1, 5).setValue('문의 접수 시트에서 1시간마다 자동 기록 (수정 금지). 마지막: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'));
}
function hourlyJob() {
  try { pushMarketing_(); } catch (err) {}
  try { syncAccess_(); } catch (err) {}
  try { syncStatus_(); } catch (err) {}
  try { overdueWatch(); } catch (err) {}
  try { reassignWatch_(); } catch (err) {}
  const now = new Date(), p = PropertiesService.getScriptProperties(), today = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const h = now.getHours(), rh = cfgNum_(CFG.remind, REMIND_HOUR, 0, 23);
  if (h >= rh && h <= rh + 2 && p.getProperty('LAST_DAILY') !== today) { p.setProperty('LAST_DAILY', today); dailyReminder(); }
}
/** 처음 한 번 실행(코드 교체 후 다시 1번): 1시간마다 hourlyJob 예약. 알림 시각은 설정 탭에서 바꿈 (다시 실행해도 중복 생성 안 됨) */
function installTriggers() {
  ScriptApp.getProjectTriggers().filter((t) => ['dailyReminder', 'overdueWatch', 'hourlyJob'].indexOf(t.getHandlerFunction()) >= 0).forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('hourlyJob').timeBased().everyHours(1).create();
}
