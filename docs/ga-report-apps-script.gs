/**
 * SMG 홈페이지 마케팅 지표 → 구글 시트 자동 기록 (Google Analytics 4 + Search Console)
 * 설정 방법: docs/ga-report-setup.md
 *
 * 매일 한 번 실행되어 아래 탭을 갱신한다.
 *  [방문]  일별 · 이벤트_일별 · 페이지_28일 · 유입_28일 · 국가_28일 · 기기_28일   (Google Analytics 4)
 *  [검색]  검색_일별(노출수·클릭수·CTR·평균 순위) · 검색어_28일 · 검색페이지_28일 (Google Search Console)
 *  [요약]  월별 요약 : 월별 방문자·페이지뷰·문의·다운로드·검색 노출·클릭·평균 순위·키워드 노출 수
 *  [순위]  키워드 탭의 키워드별 순위를 매월 1일 자동 측정 → 키워드_순위 탭에 누적 (모두 무료)
 *          - 구글: Search Console 실제 평균 게재 순위(최근 28일)
 *          - 네이버: 네이버 검색 API(웹문서) 결과 100건 중 sungsil.com 순위 (developers.naver.com 무료 키 필요)
 * 매월 1일에는 지난달 요약을 관리자 메일로 보냄 (REPORT_TO)
 */
const PROPERTY_ID = '493032076';               // GA4 속성 ID (관리 → 속성 설정에서 확인)
const SC_SITE = 'https://www.sungsil.com/';     // Search Console 속성 (URL 접두어 속성. 도메인 속성이면 'sc-domain:sungsil.com')
const START_DATE = '2026-11-05';                // 리뉴얼 홈페이지 공개일 (이 날짜부터 기록)
const TZ = 'Asia/Seoul';
const REPORT_TO = '';                           // 월간 요약 메일 받을 주소. 비우면 스크립트 속성 REPORT_TO 사용, 둘 다 없으면 메일 안 보냄

function runDaily() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), errs = [];
  const step = (name, fn) => { try { fn(); } catch (e) { errs.push(name + ': ' + e.message); } };
  step('GA 일별', () => appendDaily_(ss, '일별', ['date'],
    ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'engagementRate', 'bounceRate'],
    ['날짜', '사용자', '신규 사용자', '세션', '페이지뷰', '평균 세션 시간(초)', '참여율', '이탈률']));
  step('GA 이벤트', () => appendDaily_(ss, '이벤트_일별', ['date', 'eventName'], ['eventCount', 'totalUsers'], ['날짜', '이벤트', '횟수', '사용자']));
  step('GA 페이지', () => replace28_(ss, '페이지_28일', ['pagePath'], ['screenPageViews', 'activeUsers', 'userEngagementDuration'], ['페이지', '조회수', '사용자', '총 참여 시간(초)'], 200));
  step('GA 유입', () => replace28_(ss, '유입_28일', ['sessionDefaultChannelGroup', 'sessionSource'], ['sessions', 'activeUsers', 'engagementRate'], ['채널', '출처', '세션', '사용자', '참여율'], 100));
  step('GA 국가', () => replace28_(ss, '국가_28일', ['country'], ['activeUsers', 'sessions'], ['국가', '사용자', '세션'], 50));
  step('GA 기기', () => replace28_(ss, '기기_28일', ['deviceCategory'], ['activeUsers', 'sessions', 'averageSessionDuration'], ['기기', '사용자', '세션', '평균 세션 시간(초)'], 10));
  step('검색 일별', () => scDaily_(ss));
  step('검색어', () => scTop_(ss, '검색어_28일', 'query', '검색어'));
  step('검색 페이지', () => scTop_(ss, '검색페이지_28일', 'page', '페이지'));
  if (new Date().getDate() === 1) step('키워드 순위', () => measureRanks_(ss));
  step('월별 요약', () => monthly_(ss));
  const note = '마지막 갱신: ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm') + (errs.length ? ' · 오류: ' + errs.join(' / ') : '');
  sheet_(ss, '월별 요약', SUM_HEAD).getRange('A1').setNote(note);
  if (new Date().getDate() === 1) { try { monthlyMail_(ss); } catch (e) {} }
}

/** 처음 한 번 실행: 매일 오전 7시대에 runDaily 가 돌도록 예약 */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'runDaily') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('runDaily').timeBased().everyDays(1).atHour(7).inTimezone(TZ).create();
  runDaily();
}

// ── Google Analytics 4 ──
function report_(dims, mets, startDate, endDate, limit) {
  const req = {
    dateRanges: [{ startDate: startDate, endDate: endDate }],
    dimensions: dims.map(function (d) { return { name: d }; }),
    metrics: mets.map(function (m) { return { name: m }; }),
    limit: limit || 10000,
  };
  const res = AnalyticsData.Properties.runReport(req, 'properties/' + PROPERTY_ID);
  return (res.rows || []).map(function (r) {
    return r.dimensionValues.map(function (v) { return v.value; }).concat(r.metricValues.map(function (v) { return Number(v.value); }));
  });
}

function sheet_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(header); sh.getRange(1, 1, 1, header.length).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}

/** 날짜 기준 누적: 공개일~어제까지 다시 받아 통째로 갱신 (GA 수치는 며칠간 보정되므로 덮어씀) */
function appendDaily_(ss, name, dims, mets, header) {
  const sh = sheet_(ss, name, header);
  const rows = report_(dims, mets, START_DATE, 'yesterday').map(function (r) {
    r[0] = r[0].slice(0, 4) + '-' + r[0].slice(4, 6) + '-' + r[0].slice(6, 8); return r;
  }).sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : String(a[1]).localeCompare(String(b[1])); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, header.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
}

/** 최근 28일 순위표: 매번 새로 씀 */
function replace28_(ss, name, dims, mets, header, limit) {
  const sh = sheet_(ss, name, header);
  const rows = report_(dims, mets, '28daysAgo', 'yesterday', limit).sort(function (a, b) { return b[dims.length] - a[dims.length]; });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, header.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
}

// ── Google Search Console (검색 노출수·클릭수·평균 순위). 수치는 2~3일 늦게 확정됨 ──
function ymd_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
function daysAgo_(n) { const d = new Date(); d.setDate(d.getDate() - n); return ymd_(d); }
function sc_(body) {
  const res = UrlFetchApp.fetch('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(SC_SITE) + '/searchAnalytics/query', {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
  });
  if (res.getResponseCode() !== 200) throw new Error('Search Console ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 150));
  return JSON.parse(res.getContentText()).rows || [];
}
function scDaily_(ss) {
  const head = ['날짜', '노출수', '클릭수', 'CTR', '평균 순위'], sh = sheet_(ss, '검색_일별', head);
  const rows = sc_({ startDate: START_DATE, endDate: daysAgo_(2), dimensions: ['date'], rowLimit: 1000 })
    .map(function (r) { return [r.keys[0], r.impressions, r.clicks, r.ctr, Math.round(r.position * 10) / 10]; })
    .sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, head.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows);
}
function scTop_(ss, name, dim, label) {
  const head = [label, '노출수', '클릭수', 'CTR', '평균 순위'], sh = sheet_(ss, name, head);
  const rows = sc_({ startDate: daysAgo_(30), endDate: daysAgo_(2), dimensions: [dim], rowLimit: 200 })
    .map(function (r) { return [r.keys[0], r.impressions, r.clicks, r.ctr, Math.round(r.position * 10) / 10]; })
    .sort(function (a, b) { return b[1] - a[1]; });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, head.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows);
}

// ── 키워드 순위 (무료): 키워드 탭(구분 | 키워드 | 사용) → 키워드_순위 탭(측정일 | 엔진 | 구분 | 키워드 | 순위 | 노출 URL | 비고) ──
const KW_HEAD = ['측정일', '엔진', '구분', '키워드', '순위', '노출 URL', '비고'];
/** 필요할 때 실행: 키워드 순위 즉시 측정 (평소에는 매월 1일 자동) */
function 순위측정() { measureRanks_(SpreadsheetApp.getActiveSpreadsheet()); monthly_(SpreadsheetApp.getActiveSpreadsheet()); }
function measureRanks_(ss) {
  const ks = ss.getSheetByName('키워드'); if (!ks || ks.getLastRow() < 2) return;
  const list = ks.getRange(2, 1, ks.getLastRow() - 1, 3).getValues().filter((r) => String(r[1]).trim() && r[2] !== false);
  const out = sheet_(ss, '키워드_순위', KW_HEAD), today = ymd_(new Date()), p = PropertiesService.getScriptProperties();
  const nid = p.getProperty('NAVER_ID'), nsec = p.getProperty('NAVER_SECRET'), rows = [];
  // 네이버 검색 API: 기존 개발자센터 키(기본) 또는 NAVER API HUB(네이버클라우드) 키. 스크립트 속성 NAVER_MODE = hub 이면 HUB 방식
  // HUB 주소·헤더는 2026-11 공개 자료 기준 [추정] → 다르면 스크립트 속성 NAVER_URL 에 {q} 자리표시 포함 주소를 넣어 덮어씀
  const hub = /^hub$/i.test(String(p.getProperty('NAVER_MODE') || '').trim());
  const naverUrl = p.getProperty('NAVER_URL') || (hub ? 'https://naverapihub.apigw.ntruss.com/search/v1/webkr?format=json&display=100&start=1&query={q}'
    : 'https://openapi.naver.com/v1/search/webkr.json?display=100&start=1&query={q}');
  const naverHead = hub ? { 'X-NCP-APIGW-API-KEY-ID': nid, 'X-NCP-APIGW-API-KEY': nsec } : { 'X-Naver-Client-Id': nid, 'X-Naver-Client-Secret': nsec };
  list.forEach((r) => {
    const g = r[0], k = String(r[1]).trim();
    // 구글: 서치콘솔 최근 28일, 검색어가 정확히 같은 경우의 평균 순위
    try {
      const sc = sc_({ startDate: daysAgo_(30), endDate: daysAgo_(2), dimensions: ['query'], rowLimit: 1,
        dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'equals', expression: k }] }] })[0];
      rows.push([today, '구글(서치콘솔)', g, k, sc ? Math.round(sc.position * 10) / 10 : '', '', sc ? '노출 ' + sc.impressions + '회 · 클릭 ' + sc.clicks + '회' : '최근 28일 노출 없음']);
    } catch (e) { rows.push([today, '구글(서치콘솔)', g, k, '', '', '오류: ' + e.message.slice(0, 80)]); }
    // 네이버: 검색 API 웹문서 100건
    if (!nid || !nsec) return;
    try {
      const res = UrlFetchApp.fetch(naverUrl.replace('{q}', encodeURIComponent(k)), { headers: naverHead, muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) throw new Error('네이버 API ' + res.getResponseCode());
      const items = JSON.parse(res.getContentText()).items || [], i = items.findIndex((it) => /sungsil\.com/i.test(it.link || ''));
      rows.push([today, '네이버(검색 API 웹문서)', g, k, i >= 0 ? i + 1 : '', i >= 0 ? String(items[i].link).replace(/^https?:\/\/(www\.)?sungsil\.com/i, '') || '/' : '', i >= 0 ? '' : '100위 밖']);
    } catch (e) { rows.push([today, '네이버(검색 API 웹문서)', g, k, '', '', '오류: ' + e.message.slice(0, 80)]); }
    Utilities.sleep(150);
  });
  if (rows.length) out.getRange(out.getLastRow() + 1, 1, rows.length, KW_HEAD.length).setValues(rows);
}

// ── 월별 요약 (방문 + 검색 + 영업 행동 + 키워드 노출) ──
const SUM_HEAD = ['월', '사용자', '신규 사용자', '세션', '페이지뷰', '평균 세션 시간(초)', '문의 접수', '자료 다운로드 클릭', '전화 클릭',
  '구글 노출수', '구글 클릭수', '구글 CTR', '구글 평균 순위', '구글 1페이지 키워드', '네이버 1페이지 키워드', '측정 키워드 수'];
function monthly_(ss) {
  const m = {}, get = (k) => (m[k] = m[k] || { u: 0, nu: 0, s: 0, pv: 0, dur: 0, lead: 0, dl: 0, tel: 0, imp: 0, clk: 0, posw: 0, g1: '', n1: '', kw: '' });
  const rows = (name) => { const sh = ss.getSheetByName(name); return sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues() : []; };
  const mon = (d) => (d instanceof Date ? ymd_(d) : String(d)).slice(0, 7);
  rows('일별').forEach((r) => { if (!r[0]) return; const x = get(mon(r[0])); x.u += +r[1] || 0; x.nu += +r[2] || 0; x.s += +r[3] || 0; x.pv += +r[4] || 0; x.dur += (+r[5] || 0) * (+r[3] || 0); });
  rows('이벤트_일별').forEach((r) => { if (!r[0]) return; const x = get(mon(r[0])), n = +r[2] || 0;
    if (r[1] === 'generate_lead') x.lead += n; else if (r[1] === 'download_click') x.dl += n; else if (r[1] === 'tel_click') x.tel += n; });
  rows('검색_일별').forEach((r) => { if (!r[0]) return; const x = get(mon(r[0])); x.imp += +r[1] || 0; x.clk += +r[2] || 0; x.posw += (+r[4] || 0) * (+r[1] || 0); });
  // 키워드_순위: 측정일 | 엔진 | 구분 | 키워드 | 순위(숫자, 미노출은 빈칸) | 노출 URL | 비고  → 월별 1페이지(10위 이내) 키워드 수
  const kw = {};
  rows('키워드_순위').forEach((r) => { if (!r[0] || !r[3]) return; const k = mon(r[0]); kw[k] = kw[k] || { g: 0, n: 0, set: {} };
    kw[k].set[r[3]] = 1; const rk = Number(r[4]); if (rk >= 1 && rk <= 10) { if (/구글|google/i.test(r[1])) kw[k].g++; else if (/네이버|naver/i.test(r[1])) kw[k].n++; } });
  Object.keys(kw).forEach((k) => { const x = get(k); x.g1 = kw[k].g; x.n1 = kw[k].n; x.kw = Object.keys(kw[k].set).length; });
  const out = Object.keys(m).sort().map((k) => { const x = m[k];
    return [k, x.u, x.nu, x.s, x.pv, x.s ? Math.round(x.dur / x.s) : '', x.lead, x.dl, x.tel, x.imp, x.clk, x.imp ? Math.round(x.clk / x.imp * 1000) / 1000 : '', x.imp ? Math.round(x.posw / x.imp * 10) / 10 : '', x.g1, x.n1, x.kw]; });
  const sh = sheet_(ss, '월별 요약', SUM_HEAD);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, SUM_HEAD.length).clearContent();
  if (out.length) sh.getRange(2, 1, out.length, SUM_HEAD.length).setValues(out);
  ss.setActiveSheet(sh); ss.moveActiveSheet(1);
}
/** 매월 1일: 지난달 vs 전전달 요약 메일 */
function monthlyMail_(ss) {
  const to = REPORT_TO || PropertiesService.getScriptProperties().getProperty('REPORT_TO'); if (!to) return;
  const sh = ss.getSheetByName('월별 요약'); if (!sh || sh.getLastRow() < 2) return;
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, SUM_HEAD.length).getValues();
  const d = new Date(); d.setDate(0); const last = ymd_(d).slice(0, 7); d.setDate(0); const prev = ymd_(d).slice(0, 7);
  const a = v.find((r) => r[0] === last), b = v.find((r) => r[0] === prev); if (!a) return;
  const line = (i) => ' - ' + SUM_HEAD[i] + ': ' + a[i] + (b && b[i] !== '' && a[i] !== '' ? ' (전월 ' + b[i] + ')' : '');
  MailApp.sendEmail(to, '[홈페이지 월간 지표] ' + last, ['SMG 홈페이지 ' + last + ' 지표 요약입니다.', ''].concat([1, 4, 6, 7, 9, 10, 12, 13, 14].map(line))
    .concat(['', '※ 구글 평균 순위는 숫자가 작을수록 좋음. 네이버 검색 노출수는 서치어드바이저에서 별도 확인', ss.getUrl()]).join('\n'));
}
