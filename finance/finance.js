/* 금융 관리 — 대출 상환 스케줄 · 중도상환 시뮬레이터 · 고정지출. 데이터는 localStorage 전용(서버 전송 없음). */
(function () {
  'use strict';
  var KEY = 'smg-finance-v1';
  var $ = function (s) { return document.querySelector(s); };
  var state = load();
  var mask = false;

  /* ---------- 저장 ---------- */
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || ''); if (d && Array.isArray(d.loans)) return { loans: d.loans, exps: d.exps || [] }; } catch (e) {}
    return { loans: [], exps: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { alert('브라우저 저장소에 저장하지 못함. 백업 파일을 내려받아 보관하세요.'); } }
  function uid() { return Math.random().toString(36).slice(2, 10); }

  /* ---------- 유틸 ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function amt(n) { return '<span class="amt">' + won(n) + '</span>'; }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(y, m, d) { return y + '-' + p2(m) + '-' + p2(d); }
  function today() { var t = new Date(); return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate()); }
  function addMonths(start, k, day) {
    var y = +start.slice(0, 4), m = +start.slice(5, 7) - 1 + k;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    var dim = new Date(y, m + 1, 0).getDate();
    return ymd(y, m + 1, Math.min(day, dim));
  }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }

  /* ---------- 상환 스케줄 엔진 ----------
     type: equal(원리금균등) | principal(원금균등) | bullet(만기일시), grace: 거치기간(개월, 이자만 납부)
     prepays: [{date, amount, mode:'term'(기간단축)|'payment'(상환액감소)}] */
  function pmtEqual(bal, r, n) {
    if (n <= 0) return bal;
    return r === 0 ? Math.round(bal / n) : Math.round(bal * r / (1 - Math.pow(1 + r, -n)));
  }
  function schedule(L, prepays) {
    var n = L.term, g = Math.min(L.grace || 0, n - 1), r = L.rate / 1200, bal = L.principal, rows = [];
    var pre = (prepays || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }), pi = 0;
    var pmt = pmtEqual(bal, r, n - g), unit = Math.round(bal / Math.max(1, n - g));
    var chg = (L.rates || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }), prevDate = L.start;
    for (var k = 1; k <= n && bal > 0; k++) {
      var date = addMonths(L.start, k, L.payDay);
      var rk = L.rate; chg.forEach(function (c) { if (c.date <= prevDate) rk = c.rate; });
      if (rk / 1200 !== r) { r = rk / 1200; if (L.type === 'equal') pmt = pmtEqual(bal, r, Math.max(1, n - Math.max(k - 1, g))); }
      prevDate = date;
      var interest = Math.round(bal * r), prin;
      if (L.type === 'bullet') prin = 0;
      else if (k <= g) prin = 0;
      else if (L.type === 'principal') prin = Math.min(bal, unit);
      else prin = Math.min(bal, Math.max(0, pmt - interest));
      if (k === n) prin = bal;
      bal -= prin;
      var row = { k: k, date: date, interest: interest, principal: prin, prepay: 0, balance: bal };
      while (pi < pre.length && pre[pi].date <= date) {
        var a = Math.min(pre[pi].amount, bal);
        if (a > 0) {
          bal -= a; row.prepay += a; row.balance = bal;
          if (bal > 0 && pre[pi].mode === 'payment') {
            var left = n - k, am = Math.max(1, left - Math.max(0, g - k));
            pmt = pmtEqual(bal, r, am); unit = Math.round(bal / am);
          }
        }
        pi++;
      }
      rows.push(row);
    }
    return rows;
  }
  function sum(rows, f) { return rows.reduce(function (s, x) { return s + x[f]; }, 0); }
  function status(L) {
    var rows = schedule(L, L.prepays), t = today(), paid = rows.filter(function (r) { return r.date <= t; });
    var bal = paid.length ? paid[paid.length - 1].balance : L.principal;
    var next = rows.filter(function (r) { return r.date > t; })[0];
    return { rows: rows, bal: bal, next: next, paidCnt: paid.length, paidInt: sum(paid, 'interest'), totalInt: sum(rows, 'interest'), remInt: sum(rows.filter(function (r) { return r.date > t; }), 'interest') };
  }
  var TYPE = { equal: '원리금균등', principal: '원금균등', bullet: '만기일시' };

  /* ---------- 렌더 ---------- */
  function render() {
    var open = [];
    document.querySelectorAll('.loan').forEach(function (c) { c.querySelectorAll('details').forEach(function (d, i) { if (d.open) open.push(c.dataset.id + ':' + i); }); });
    document.body.classList.toggle('mask', mask);
    var t = today(), sts = state.loans.map(function (L) { return { L: L, s: status(L) }; });
    var totalBal = 0, remInt = 0, paidInt = 0, actInt = 0, hasAct = false, monthPay = 0, curYM = t.slice(0, 7);
    sts.forEach(function (x) {
      totalBal += x.s.bal; remInt += x.s.remInt; paidInt += x.s.paidInt;
      (x.L.actuals || []).forEach(function (a) { if (a.interest != null) { actInt += a.interest; hasAct = true; } });
      x.s.rows.forEach(function (r) { if (r.date.slice(0, 7) === curYM) monthPay += r.interest + r.principal; });
    });
    var fixedMonth = state.exps.reduce(function (s, e) { return s + (e.cycle === 'year' ? e.amount / 12 : e.amount); }, 0);
    $('#summary').innerHTML =
      '<div class="card hl"><span>총 대출 잔액</span><b>' + amt(totalBal) + '</b></div>' +
      '<div class="card"><span>이번 달 대출 상환액</span><b>' + amt(monthPay) + '</b></div>' +
      '<div class="card hl"><span>지금까지 낸 이자</span><b>' + amt(paidInt) + '</b></div>' +
      (hasAct ? '<div class="card hl"><span>실제 낸 이자(기록)</span><b>' + amt(actInt) + '</b></div>' : '') +
      '<div class="card"><span>남은 이자 합계</span><b>' + amt(remInt) + '</b></div>' +
      '<div class="card"><span>월 고정지출(연납 월환산)</span><b>' + amt(fixedMonth) + '</b></div>';

    /* 12개월 예상 */
    var bars = [], max = 1, sy = +t.slice(0, 4), sm = +t.slice(5, 7);
    for (var i = 0; i < 12; i++) {
      var y = sy + Math.floor((sm - 1 + i) / 12), m = (sm - 1 + i) % 12 + 1, ym = y + '-' + p2(m), v = 0;
      sts.forEach(function (x) { x.s.rows.forEach(function (r) { if (r.date.slice(0, 7) === ym) v += r.interest + r.principal; }); });
      state.exps.forEach(function (e) { if (e.cycle !== 'year' || +e.month === m) v += e.amount; });
      bars.push({ m: m, v: v }); max = Math.max(max, v);
    }
    $('#forecast').innerHTML = (state.loans.length || state.exps.length) ?
      '<div class="fc">' + bars.map(function (b) {
        return '<div><em class="amt">' + (b.v >= 10000 ? Math.round(b.v / 10000).toLocaleString('ko-KR') + '만' : Math.round(b.v)) + '</em><i style="height:' + Math.max(2, b.v / max * 100) + '%"></i>' + b.m + '월</div>';
      }).join('') + '</div><p class="hint">대출 원리금 + 고정지출 합계 (중도상환 제외)</p>' : '<p class="empty">대출 또는 고정지출을 추가하면 표시됨</p>';

    $('#loan-cnt').textContent = state.loans.length ? state.loans.length + '건' : '';
    $('#loans').innerHTML = sts.length ? sts.map(loanCard).join('') : '<p class="empty">등록된 대출 없음 — 우측 상단 “+ 대출 추가”</p>';
    open.forEach(function (k) { var p = k.split(':'), c = document.querySelector('.loan[data-id="' + p[0] + '"]'); if (c && c.querySelectorAll('details')[+p[1]]) c.querySelectorAll('details')[+p[1]].open = true; });
    $('#exps').innerHTML = state.exps.length ? '<div class="list">' + state.exps.map(function (e) {
      return '<div class="item"><div><b>' + esc(e.name) + '</b> <small>' + (e.cycle === 'year' ? '연 1회 · ' + e.month + '월' : '매월') + '</small></div><div><b>' + amt(e.amount) +
        '</b> <button class="b b-line b-sm" data-act="edit-exp" data-id="' + e.id + '">수정</button></div></div>';
    }).join('') + '</div>' : '<p class="empty">보험료·리스료·구독 등 고정지출을 추가</p>';
  }

  function actualsHtml(L, s) {
    var A = (L.actuals || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var tot = 0, intr = 0, allInt = A.length > 0, months = {};
    A.forEach(function (a) { tot += a.amount; months[a.date.slice(0, 7)] = 1; if (a.interest == null) allInt = false; else intr += a.interest; });
    var cmp = '';
    if (A.length) {
      var sch = sum(s.rows.filter(function (r) { return months[r.date.slice(0, 7)]; }), 'interest');
      cmp = '<div class="out">실제 납부 합계 <b>' + amt(tot) + '</b> (' + A.length + '회)' + (allInt ?
        '<br>실제 낸 이자 <b>' + amt(intr) + '</b> vs 스케줄 이자(기록한 달 기준) ' + amt(sch) + '<br><b>' + (intr > sch ? '스케줄보다 ' + won(intr - sch) + ' 더 냄' : intr < sch ? '스케줄보다 ' + won(sch - intr) + ' 덜 냄' : '스케줄과 동일') + '</b>' :
        '<br class="hint">이자 칸을 모두 입력하면 스케줄과 비교됨') + '</div>';
    }
    return '<details><summary>실제 납부 기록 (' + A.length + '건)</summary><div class="sim">' +
      '<label class="f">납부일<input type="date" data-a="date" value="' + today() + '"></label>' +
      '<label class="f">납부 총액(원)<input type="number" min="0" data-a="amount" inputmode="numeric"></label>' +
      '<label class="f">그 중 이자(원, 선택)<input type="number" min="0" data-a="interest" inputmode="numeric"></label>' +
      '<button class="b b-pri" data-act="add-act" data-id="' + L.id + '">기록 추가</button></div>' + cmp +
      (A.length ? '<div class="tw"><table><thead><tr><th>납부일</th><th>납부액</th><th>이자</th><th></th></tr></thead><tbody>' + A.map(function (a) {
        return '<tr><td>' + a.date + '</td><td>' + amt(a.amount) + '</td><td>' + (a.interest == null ? '-' : amt(a.interest)) + '</td><td><a href="#" data-act="del-act" data-id="' + L.id + '" data-d="' + a.date + '" data-m="' + a.amount + '">삭제</a></td></tr>';
      }).join('') + '</tbody></table></div>' : '') + '</details>';
  }

  function curRate(L) {
    var t = today(), r = L.rate;
    (L.rates || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (c) { if (c.date <= t) r = c.rate; });
    return r;
  }
  function ratesHtml(L) {
    var R = (L.rates || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return '<details><summary>금리 변경 이력 (' + R.length + '건)</summary><div class="sim">' +
      '<label class="f">적용 시작일<input type="date" data-c="date" value="' + today() + '"></label>' +
      '<label class="f">변경 금리(연 %)<input type="number" min="0" step="0.01" data-c="rate" inputmode="decimal"></label>' +
      '<button class="b b-pri" data-act="add-rate" data-id="' + L.id + '">추가</button></div>' +
      '<p class="hint">초기 금리 ' + L.rate + '% → 각 적용 시작일 이후 납부 기간부터 새 금리 적용. 원리금균등은 금리 변경 시 월 납부액을 남은 기간 기준으로 재계산함.</p>' +
      (R.length ? '<div class="tw"><table><thead><tr><th>적용 시작일</th><th>금리</th><th></th></tr></thead><tbody>' + R.map(function (c) {
        return '<tr><td>' + c.date + '</td><td>' + c.rate + '%</td><td><a href="#" data-act="del-rate" data-id="' + L.id + '" data-d="' + c.date + '" data-m="' + c.rate + '">삭제</a></td></tr>';
      }).join('') + '</tbody></table></div>' : '') + '</details>';
  }

  function loanCard(x) {
    var L = x.L, s = x.s, pct = Math.min(100, Math.round((1 - s.bal / L.principal) * 100));
    var end = s.rows.length ? s.rows[s.rows.length - 1].date : '-';
    var pre = (L.prepays || []).map(function (p, i) {
      return '<span>' + p.date + ' ' + amt(p.amount) + ' (' + (p.mode === 'term' ? '기간단축' : '상환액감소') + ') <a href="#" data-act="del-pre" data-id="' + L.id + '" data-i="' + i + '">삭제</a></span>';
    }).join('');
    return '<article class="loan" data-id="' + L.id + '">' +
      '<div class="loan-h"><div><b>' + esc(L.name) + '</b><span class="tag">' + TYPE[L.type] + '</span>' + (s.bal <= 0 ? '<span class="tag done">완납</span>' : '') +
      '<div class="hint">' + esc(L.lender) + ' · 연 ' + L.rate + '%' + ((L.rates || []).length ? ' → 현재 ' + curRate(L) + '%' : '') + ' · ' + L.term + '개월' + (L.grace ? ' (거치 ' + L.grace + ')' : '') + ' · 매월 ' + L.payDay + '일</div></div>' +
      '<div class="row"><button class="b b-line b-sm" data-act="edit-loan" data-id="' + L.id + '">수정</button></div></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="kv"><div><span>잔액</span><b>' + amt(s.bal) + '</b></div><div><span>상환율</span><b>' + pct + '% (' + s.paidCnt + '/' + s.rows.length + '회)</b></div>' +
      '<div><span>다음 납부</span><b>' + (s.next ? s.next.date.slice(5) + ' ' + amt(s.next.interest + s.next.principal) : '-') + '</b></div>' +
      '<div><span>지금까지 낸 이자</span><b>' + amt(s.paidInt) + '</b></div><div><span>남은 이자</span><b>' + amt(s.remInt) + '</b></div><div><span>만기</span><b>' + end + '</b></div><div><span>총 이자</span><b>' + amt(s.totalInt) + '</b></div></div>' +
      (pre ? '<div class="pre">중도상환 기록: ' + pre + '</div>' : '') +
      '<details><summary>중도상환 시뮬레이터</summary><div class="sim">' +
      '<label class="f">상환 금액(원)<input type="number" min="0" step="10000" data-s="amt" inputmode="numeric"></label>' +
      '<label class="f">상환일<input type="date" data-s="date" value="' + today() + '"></label>' +
      '<label class="f">방식<select data-s="mode"><option value="term">기간 단축</option><option value="payment">월 상환액 감소</option></select></label>' +
      '<label class="f">수수료율(%)<input type="number" min="0" step="0.1" value="0" data-s="fee" inputmode="decimal"></label>' +
      '<button class="b b-pri" data-act="sim" data-id="' + L.id + '">계산</button><div class="out" hidden></div></div></details>' +
      actualsHtml(L, s) + ratesHtml(L) +
      '<details><summary>금리 대환(갈아타기) 비교</summary><div class="sim">' +
      '<label class="f">새 금리(연 %)<input type="number" min="0" step="0.01" data-r="rate" inputmode="decimal"></label>' +
      '<label class="f">대환 비용(원, 중도상환수수료 등)<input type="number" min="0" step="10000" value="0" data-r="fee" inputmode="numeric"></label>' +
      '<button class="b b-pri" data-act="refi" data-id="' + L.id + '">비교</button><div class="out" hidden></div></div></details>' +
      '<details><summary>상환 스케줄 (' + s.rows.length + '회)</summary><div class="tw"><table><thead><tr><th>회차</th><th>납부일</th><th>납부액</th><th>원금</th><th>이자</th><th>중도상환</th><th>잔액</th></tr></thead><tbody>' +
      s.rows.map(function (r) {
        var cls = r.date <= today() ? 'past' : (s.next && s.next.k === r.k ? 'next' : '');
        return '<tr class="' + cls + '"><td>' + r.k + '</td><td>' + r.date + '</td><td>' + amt(r.interest + r.principal) + '</td><td>' + amt(r.principal) + '</td><td>' + amt(r.interest) + '</td><td>' + (r.prepay ? amt(r.prepay) : '-') + '</td><td>' + amt(r.balance) + '</td></tr>';
      }).join('') + '</tbody></table></div></details></article>';
  }

  /* ---------- 폼 ---------- */
  var dlg = $('#dlg');
  function openForm(html, onSubmit) {
    dlg.innerHTML = html;
    var f = dlg.querySelector('form');
    f.addEventListener('submit', function (e) { e.preventDefault(); if (onSubmit(new FormData(f)) !== false) dlg.close(); });
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
    dlg.showModal();
  }
  function field(label, name, val, extra) { return '<label class="f">' + label + '<input name="' + name + '" value="' + esc(val) + '" ' + (extra || '') + '></label>'; }
  function loanForm(id) {
    var L = state.loans.filter(function (x) { return x.id === id; })[0] || { name: '', lender: '', principal: '', rate: '', term: '', grace: 0, type: 'equal', start: today(), payDay: 25 };
    openForm('<form><h3>' + (id ? '대출 수정' : '대출 추가') + '</h3>' +
      field('대출명', 'name', L.name, 'required placeholder="예: 시설자금 대출"') + field('금융기관', 'lender', L.lender, 'placeholder="예: OO은행"') +
      '<div class="g2">' + field('대출 원금(원)', 'principal', L.principal, 'type="number" min="1" required inputmode="numeric"') + field('연 이율(%)', 'rate', L.rate, 'type="number" min="0" step="0.01" required inputmode="decimal"') + '</div>' +
      '<div class="g2">' + field('대출 기간(개월)', 'term', L.term, 'type="number" min="1" max="600" required inputmode="numeric"') + field('거치 기간(개월)', 'grace', L.grace, 'type="number" min="0" inputmode="numeric"') + '</div>' +
      '<label class="f">상환 방식<select name="type">' + Object.keys(TYPE).map(function (k) { return '<option value="' + k + '"' + (L.type === k ? ' selected' : '') + '>' + TYPE[k] + '</option>'; }).join('') + '</select></label>' +
      '<div class="g2">' + field('대출 실행일', 'start', L.start, 'type="date" required') + field('매월 납부일', 'payDay', L.payDay, 'type="number" min="1" max="31" required inputmode="numeric"') + '</div>' +
      '<div class="dact">' + (id ? '<button type="button" class="b b-del" data-del>삭제</button>' : '') + '<button type="button" class="b b-line" data-close>취소</button><button class="b b-pri">저장</button></div></form>',
      function (fd) {
        var o = { id: L.id || uid(), name: fd.get('name').trim(), lender: fd.get('lender').trim(), principal: num(fd.get('principal')), rate: num(fd.get('rate')), term: Math.round(num(fd.get('term'))),
          grace: Math.round(num(fd.get('grace'))), type: fd.get('type'), start: fd.get('start'), payDay: Math.min(31, Math.max(1, Math.round(num(fd.get('payDay'))))), prepays: L.prepays || [], actuals: L.actuals || [], rates: L.rates || [] };
        if (!o.name || o.principal <= 0 || o.term < 1) return false;
        if (id) state.loans = state.loans.map(function (x) { return x.id === id ? o : x; }); else state.loans.push(o);
        save(); render();
      });
    var d = dlg.querySelector('[data-del]');
    if (d) d.addEventListener('click', function () { if (confirm('이 대출을 삭제할까요?')) { state.loans = state.loans.filter(function (x) { return x.id !== id; }); save(); render(); dlg.close(); } });
  }
  function expForm(id) {
    var E = state.exps.filter(function (x) { return x.id === id; })[0] || { name: '', amount: '', cycle: 'month', month: 1 };
    openForm('<form><h3>' + (id ? '고정지출 수정' : '고정지출 추가') + '</h3>' + field('항목', 'name', E.name, 'required placeholder="예: 화재보험"') +
      '<div class="g2">' + field('금액(원)', 'amount', E.amount, 'type="number" min="0" required inputmode="numeric"') +
      '<label class="f">주기<select name="cycle"><option value="month"' + (E.cycle === 'month' ? ' selected' : '') + '>매월</option><option value="year"' + (E.cycle === 'year' ? ' selected' : '') + '>연 1회</option></select></label></div>' +
      field('연 1회인 경우 납부 월(1~12)', 'month', E.month, 'type="number" min="1" max="12"') +
      '<div class="dact">' + (id ? '<button type="button" class="b b-del" data-del>삭제</button>' : '') + '<button type="button" class="b b-line" data-close>취소</button><button class="b b-pri">저장</button></div></form>',
      function (fd) {
        var o = { id: E.id || uid(), name: fd.get('name').trim(), amount: num(fd.get('amount')), cycle: fd.get('cycle'), month: Math.min(12, Math.max(1, Math.round(num(fd.get('month'))) || 1)) };
        if (!o.name) return false;
        if (id) state.exps = state.exps.map(function (x) { return x.id === id ? o : x; }); else state.exps.push(o);
        save(); render();
      });
    var d = dlg.querySelector('[data-del]');
    if (d) d.addEventListener('click', function () { state.exps = state.exps.filter(function (x) { return x.id !== id; }); save(); render(); dlg.close(); });
  }

  /* ---------- 시뮬레이터 ---------- */
  function simulate(card) {
    var L = state.loans.filter(function (x) { return x.id === card.dataset.id; })[0], v = function (n) { return card.querySelector('[data-s=' + n + ']').value; };
    var a = num(v('amt')), date = v('date'), mode = v('mode'), fee = num(v('fee')), out = card.querySelector('.out');
    out.hidden = false;
    if (a <= 0 || !date) { out.textContent = '상환 금액과 상환일을 입력'; return; }
    var base = schedule(L, L.prepays), np = (L.prepays || []).concat([{ date: date, amount: a, mode: mode }]), alt = schedule(L, np);
    var saved = sum(base, 'interest') - sum(alt, 'interest'), feeAmt = Math.round(a * fee / 100), nextOld = base.filter(function (r) { return r.date > date; })[0], nextNew = alt.filter(function (r) { return r.date > date; })[0];
    out.innerHTML = '이자 절감 <b>' + amt(saved) + '</b> − 수수료 ' + amt(feeAmt) + ' = 순이익 <b>' + amt(saved - feeAmt) + '</b><br>' +
      '만기 ' + base[base.length - 1].date + ' → <b>' + (alt.length ? alt[alt.length - 1].date : date) + '</b> (' + (base.length - alt.length) + '개월 단축)' +
      (nextOld && nextNew ? '<br>다음 월 납부액 ' + amt(nextOld.interest + nextOld.principal) + ' → <b>' + amt(nextNew.interest + nextNew.principal) + '</b>' : '') +
      '<div class="row" style="margin-top:8px"><button class="b b-line b-sm" data-act="rec-pre" data-id="' + L.id + '">이 중도상환을 기록에 반영</button></div>';
    out.dataset.pre = JSON.stringify({ date: date, amount: a, mode: mode });
  }

  function refi(card) {
    var L = state.loans.filter(function (x) { return x.id === card.dataset.id; })[0], st = status(L), out = card.querySelector('[data-act=refi]').parentElement.querySelector('.out');
    var v = function (n) { return num(card.querySelector('[data-r=' + n + ']').value); }, rate = v('rate'), fee = v('fee'), left = st.rows.length - st.paidCnt;
    out.hidden = false;
    if (st.bal <= 0 || left < 1) { out.textContent = '이미 완납'; return; }
    if (!card.querySelector('[data-r=rate]').value) { out.textContent = '새 금리를 입력'; return; }
    var alt = schedule({ principal: st.bal, rate: rate, term: left, grace: 0, type: L.type, start: today(), payDay: L.payDay }, []);
    var ni = sum(alt, 'interest'), gain = st.remInt - ni - fee;
    out.innerHTML = '현재 조건 남은 이자 ' + amt(st.remInt) + ' → 새 금리 ' + amt(ni) + '<br>비용 ' + amt(fee) + ' 차감 후 <b>' + (gain >= 0 ? '절감 ' : '손해 ') + amt(Math.abs(gain)) + '</b>' +
      '<br>잔액 ' + amt(st.bal) + ' · 남은 ' + left + '개월 기준 (같은 상환방식, 거치 없음 가정)';
  }

  /* ---------- 이벤트 ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var act = t.dataset.act, id = t.dataset.id;
    if (act === 'edit-loan') loanForm(id);
    else if (act === 'edit-exp') expForm(id);
    else if (act === 'add-rate') {
      var Lr = state.loans.filter(function (x) { return x.id === id; })[0], g = function (n) { return t.closest('.sim').querySelector('[data-c=' + n + ']').value; };
      if (!g('date') || g('rate') === '') { alert('적용 시작일과 금리를 입력'); return; }
      Lr.rates = (Lr.rates || []).filter(function (c) { return c.date !== g('date'); }).concat([{ date: g('date'), rate: num(g('rate')) }]); save(); render();
    } else if (act === 'del-rate') {
      e.preventDefault(); var Lq = state.loans.filter(function (x) { return x.id === id; })[0];
      if (confirm('금리 변경 이력을 삭제할까요?')) { Lq.rates = Lq.rates.filter(function (c) { return !(c.date === t.dataset.d && c.rate === +t.dataset.m); }); save(); render(); }
    } else if (act === 'add-act') {
      var Lx = state.loans.filter(function (x) { return x.id === id; })[0], q = function (n) { return t.closest('.sim').querySelector('[data-a=' + n + ']').value; };
      var am = num(q('amount')); if (!q('date') || am <= 0) { alert('납부일과 납부 총액을 입력'); return; }
      Lx.actuals = (Lx.actuals || []).concat([{ date: q('date'), amount: am, interest: q('interest') === '' ? null : num(q('interest')) }]); save(); render();
    } else if (act === 'del-act') {
      e.preventDefault(); var Ly = state.loans.filter(function (x) { return x.id === id; })[0];
      if (confirm('납부 기록을 삭제할까요?')) { var i = Ly.actuals.findIndex(function (a) { return a.date === t.dataset.d && a.amount === +t.dataset.m; }); if (i >= 0) Ly.actuals.splice(i, 1); save(); render(); }
    } else if (act === 'refi') refi(t.closest('.loan'));
    else if (act === 'sim') simulate(t.closest('.loan'));
    else if (act === 'rec-pre') {
      var L = state.loans.filter(function (x) { return x.id === id; })[0], p = JSON.parse(t.closest('.out').dataset.pre);
      L.prepays = (L.prepays || []).concat([p]); save(); render();
    } else if (act === 'del-pre') {
      e.preventDefault(); var L2 = state.loans.filter(function (x) { return x.id === id; })[0];
      if (confirm('중도상환 기록을 삭제할까요?')) { L2.prepays.splice(+t.dataset.i, 1); save(); render(); }
    }
  });
  $('#btn-add-loan').addEventListener('click', function () { loanForm(); });
  $('#btn-add-exp').addEventListener('click', function () { expForm(); });
  $('#btn-mask').addEventListener('click', function () { mask = !mask; this.textContent = mask ? '👁 금액 표시' : '👁 금액 숨김'; render(); });
  $('#btn-export').addEventListener('click', function () {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }));
    a.download = 'finance-backup-' + today() + '.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $('#btn-csv').addEventListener('click', function () {
    if (!state.loans.length) { alert('내보낼 대출이 없음'); return; }
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var out = [['대출명', '금융기관', '구분', '회차', '날짜', '납부액', '원금', '이자', '중도상환', '잔액'].join(',')];
    state.loans.forEach(function (L) {
      schedule(L, L.prepays).forEach(function (r) {
        out.push([L.name, L.lender, '스케줄', r.k, r.date, r.interest + r.principal, r.principal, r.interest, r.prepay, r.balance].map(q).join(','));
      });
      (L.actuals || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (a) {
        out.push([L.name, L.lender, '실제납부', '', a.date, a.amount, '', a.interest == null ? '' : a.interest, '', ''].map(q).join(','));
      });
    });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + out.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'finance-' + today() + '.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $('#file-import').addEventListener('change', function () {
    var f = this.files[0], inp = this; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result); if (!d || !Array.isArray(d.loans)) throw 0;
        if (!confirm('현재 데이터를 백업 파일 내용으로 교체할까요?')) return;
        state = { loans: d.loans.map(clean), exps: (d.exps || []).map(function (x) { return { id: String(x.id || uid()), name: String(x.name || ''), amount: num(x.amount), cycle: x.cycle === 'year' ? 'year' : 'month', month: Math.min(12, Math.max(1, +x.month || 1)) }; }) };
        save(); render();
      } catch (e) { alert('올바른 백업 파일이 아님'); }
      inp.value = '';
    };
    r.readAsText(f);
  });
  function clean(x) {
    return { id: String(x.id || uid()), name: String(x.name || ''), lender: String(x.lender || ''), principal: Math.max(1, num(x.principal)), rate: Math.max(0, num(x.rate)), term: Math.min(600, Math.max(1, Math.round(num(x.term)))),
      grace: Math.max(0, Math.round(num(x.grace))), type: TYPE[x.type] ? x.type : 'equal', start: /^\d{4}-\d{2}-\d{2}$/.test(x.start) ? x.start : today(), payDay: Math.min(31, Math.max(1, Math.round(num(x.payDay)) || 1)),
      prepays: (x.prepays || []).map(function (p) { return { date: String(p.date), amount: num(p.amount), mode: p.mode === 'payment' ? 'payment' : 'term' }; }),
      rates: (x.rates || []).map(function (c) { return { date: String(c.date), rate: Math.max(0, num(c.rate)) }; }),
      actuals: (x.actuals || []).map(function (a) { return { date: String(a.date), amount: num(a.amount), interest: a.interest == null ? null : num(a.interest) }; }) };
  }
  $('#btn-sample').addEventListener('click', function () {
    if (state.loans.length && !confirm('예시 데이터를 추가할까요? (기존 데이터는 유지)')) return;
    var y = new Date().getFullYear() - 1;
    state.loans.push({ id: uid(), name: '예시 시설자금', lender: '예시은행', principal: 300000000, rate: 4.5, term: 120, grace: 12, type: 'equal', start: y + '-03-15', payDay: 25, prepays: [] });
    state.exps.push({ id: uid(), name: '예시 화재보험', amount: 1200000, cycle: 'year', month: 6 });
    save(); render();
  });
  $('#btn-reset').addEventListener('click', function () { if (confirm('저장된 모든 데이터를 삭제할까요? (되돌릴 수 없음)')) { state = { loans: [], exps: [] }; save(); render(); } });

  render();
  window.__fin = { schedule: schedule, addMonths: addMonths };
})();
