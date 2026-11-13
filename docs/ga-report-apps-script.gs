/**
 * SMG 홈페이지 방문 통계 → 구글 시트 자동 기록 (Google Analytics 4)
 * 설정 방법: docs/ga-report-setup.md
 *
 * 매일 한 번 실행되어 아래 시트를 갱신한다.
 *  - 일별        : 날짜별 사용자·세션·페이지뷰·평균 머문 시간·참여율 (누적 기록)
 *  - 이벤트_일별 : 날짜별 이벤트 횟수 (문의 접수·다운로드·전화 클릭·영상 재생 등, 누적 기록)
 *  - 페이지_28일 : 최근 28일 페이지별 조회·사용자·평균 머문 시간
 *  - 유입_28일   : 최근 28일 유입 경로
 *  - 국가_28일 / 기기_28일
 */
const PROPERTY_ID = '493032076';      // GA4 속성 ID (관리 → 속성 설정에서 확인)
const START_DATE = '2026-11-05';      // 리뉴얼 홈페이지 공개일 (이 날짜부터 기록)
const TZ = 'Asia/Seoul';

function runDaily() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  appendDaily_(ss, '일별', ['date'],
    ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'engagementRate', 'bounceRate'],
    ['날짜', '사용자', '신규 사용자', '세션', '페이지뷰', '평균 세션 시간(초)', '참여율', '이탈률']);
  appendDaily_(ss, '이벤트_일별', ['date', 'eventName'], ['eventCount', 'totalUsers'], ['날짜', '이벤트', '횟수', '사용자']);
  replace28_(ss, '페이지_28일', ['pagePath'], ['screenPageViews', 'activeUsers', 'userEngagementDuration'], ['페이지', '조회수', '사용자', '총 참여 시간(초)'], 200);
  replace28_(ss, '유입_28일', ['sessionDefaultChannelGroup', 'sessionSource'], ['sessions', 'activeUsers', 'engagementRate'], ['채널', '출처', '세션', '사용자', '참여율'], 100);
  replace28_(ss, '국가_28일', ['country'], ['activeUsers', 'sessions'], ['국가', '사용자', '세션'], 50);
  replace28_(ss, '기기_28일', ['deviceCategory'], ['activeUsers', 'sessions', 'averageSessionDuration'], ['기기', '사용자', '세션', '평균 세션 시간(초)'], 10);
  ss.getSheetByName('일별').getRange('J1').setValue('마지막 갱신: ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'));
}

/** 처음 한 번 실행: 매일 오전 7시대에 runDaily 가 돌도록 예약 */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'runDaily') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('runDaily').timeBased().everyDays(1).atHour(7).inTimezone(TZ).create();
  runDaily();
}

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
