/* SMG Corporate Site — chat inquiry widget
 * - Guided chat (works immediately): product finder, FAQ answers, conversational quote/technical inquiry
 * - Live chat services (optional, set in admin [설정]): KakaoTalk Channel 1:1 chat, Channel Talk messenger
 */
(function () {
  'use strict';
  function start() {
    const S = window.SMG; if (!S || S.chatDone) return; S.chatDone = true;
    const D = S.data, t = S.t, L = S.L, esc = S.esc, EN = S.EN;
    const C = Object.assign({ enabled: true, kakaoChannel: '', channelTalkKey: '', hoursStart: '08:30', hoursEnd: '17:30', hoursEndFri: '16:30', greeting: '' }, D.settings.chat || {});
    if (C.enabled === false) return;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const svg = (p, w = 22) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${w}" height="${w}" aria-hidden="true">${p}</svg>`;
    const IC = {
      chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>'),
      x: svg('<path d="M18 6L6 18M6 6l12 12"/>', 18), send: svg('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>', 18),
      kakao: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.7c-.1.3.3.6.6.4l4.3-2.9c.5.1.9.1 1.4.1 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></svg>',
      reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', 16)
    };
    /* ---------- business hours (KST) ---------- */
    const kst = () => { const n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 540) * 60000); };
    const hm = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
    const isOpen = () => { const k = kst(); const d = k.getDay(), mins = k.getHours() * 60 + k.getMinutes(); return d >= 1 && d <= 5 && mins >= hm(C.hoursStart) && mins < hm(d === 5 ? (C.hoursEndFri || C.hoursEnd) : C.hoursEnd); };
    const fri = C.hoursEndFri && C.hoursEndFri !== C.hoursEnd;
    const hoursKo = fri ? `월–목 ${C.hoursStart}–${C.hoursEnd} · 금 ${C.hoursStart}–${C.hoursEndFri}` : `평일 ${C.hoursStart}–${C.hoursEnd}`;
    const hoursEn = fri ? `Mon–Thu ${C.hoursStart}–${C.hoursEnd} · Fri ${C.hoursStart}–${C.hoursEndFri} KST` : `Mon–Fri ${C.hoursStart}–${C.hoursEnd} KST`;
    const statusText = () => isOpen() ? t(`지금 상담 가능 · ${hoursKo}`, `Online now · ${hoursEn}`) : t(`운영시간 외 · 남겨주시면 다음 영업일에 회신드립니다`, `Offline · we'll reply next business day`);

    /* ---------- Channel Talk (optional live messenger) ---------- */
    let channelReady = false;
    if (C.channelTalkKey && /^[\w-]{8,}$/.test(C.channelTalkKey)) {
      (function () { const w = window; if (w.ChannelIO) return; const ch = function () { ch.c(arguments); }; ch.q = []; ch.c = function (a) { ch.q.push(a); }; w.ChannelIO = ch;
        const s = document.createElement('script'); s.async = true; s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js'; document.head.appendChild(s); })();
      window.ChannelIO('boot', { pluginKey: C.channelTalkKey, hideChannelButtonOnBoot: true, language: EN ? 'en' : 'ko' }, () => { channelReady = true; });
    }
    const kakaoUrl = C.kakaoChannel ? `https://pf.kakao.com/${encodeURIComponent(C.kakaoChannel.replace(/^https?:\/\/pf\.kakao\.com\//, '').replace(/\/.*$/, ''))}/chat` : '';

    /* ---------- launcher ---------- */
    const fabQ = $('.fab .q');
    const launcher = document.createElement('button'); launcher.type = 'button'; launcher.className = 'chat-launch';
    launcher.setAttribute('aria-label', t('채팅 상담 열기', 'Open chat')); launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = `${IC.chat}<span class="cl-dot ${isOpen() ? 'on' : ''}" aria-hidden="true"></span><span class="cl-tip">${t('채팅 상담', 'Chat with us')}</span>`;
    if (fabQ) fabQ.replaceWith(launcher); else document.body.appendChild(launcher);
    // mobile bar: swap catalog → chat
    const mb = $('.mbar'); if (mb) { const cat = mb.children[1]; const b = document.createElement('button'); b.type = 'button'; b.className = 'mchat'; b.innerHTML = `${IC.chat.replace('width="22" height="22"', 'width="18" height="18"')}${t('채팅', 'Chat')}`; if (cat) cat.replaceWith(b); b.onclick = () => openChat(); }
    launcher.onclick = () => (panel && panel.classList.contains('open') ? closeChat() : openChat());

    /* ---------- panel ---------- */
    let panel, log, input, form;
    const SKEY = 'smg_chat_v1' + (EN ? '_en' : '');
    let state = { msgs: [], flow: null, data: {} };
    try { state = Object.assign(state, JSON.parse(sessionStorage.getItem(SKEY) || '{}')); } catch (e) {}
    const persist = () => { try { sessionStorage.setItem(SKEY, JSON.stringify(state)); } catch (e) {} };
    function build() {
      panel = document.createElement('div'); panel.className = 'chat-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-label', t('채팅 상담', 'Chat'));
      panel.innerHTML = `<header class="cp-h"><img src="assets/logo-mark.svg" alt="SMG"><div><b>${t('SMG 상담', 'SMG Support')}</b><span class="cp-st ${isOpen() ? 'on' : ''}">${esc(statusText())}</span></div><button type="button" class="cp-reset" title="${t('새 대화', 'New chat')}" aria-label="${t('새 대화', 'New chat')}">${IC.reset}</button><button type="button" class="cp-x" aria-label="${t('닫기', 'Close')}">${IC.x}</button></header>
        ${kakaoUrl || C.channelTalkKey ? `<div class="cp-live">${kakaoUrl ? `<a class="cp-kakao" href="${esc(kakaoUrl)}" target="_blank" rel="noopener">${IC.kakao}${t('카카오톡 상담', 'KakaoTalk chat')}</a>` : ''}${C.channelTalkKey ? `<button type="button" class="cp-ch">${IC.chat.replace('width="22" height="22"', 'width="18" height="18"')}${t('상담원 실시간 채팅', 'Live agent chat')}</button>` : ''}</div>` : ''}
        <div class="cp-log" role="log" aria-live="polite"></div>
        <div class="cp-quick" role="group" aria-label="${t('빠른 선택', 'Quick replies')}"></div>
        <form class="cp-in" autocomplete="off"><input type="text" maxlength="1000" placeholder="${t('메시지를 입력하세요', 'Type a message')}" aria-label="${t('메시지', 'Message')}"><button type="submit" aria-label="${t('보내기', 'Send')}">${IC.send}</button></form>
        <div class="cp-foot">${t('상담 내용은 문의 응대 목적으로만 사용됩니다.', 'Messages are used only to respond to your inquiry.')} <a href="${L('privacy.html')}" target="_blank">${t('개인정보처리방침', 'Privacy')}</a></div>`;
      document.body.appendChild(panel);
      log = $('.cp-log', panel); input = $('.cp-in input', panel); form = $('.cp-in', panel);
      $('.cp-x', panel).onclick = closeChat;
      $('.cp-reset', panel).onclick = () => { state = { msgs: [], flow: null, data: {} }; persist(); log.innerHTML = ''; greet(); };
      const chb = $('.cp-ch', panel); if (chb) chb.onclick = () => { if (window.ChannelIO) { window.ChannelIO('showMessenger'); closeChat(); } };
      form.onsubmit = (e) => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ''; onUser(v); };
      panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChat(); });
      if (state.msgs.length) { state.msgs.forEach((m) => paint(m, false)); renderQuick(state.lastQuick || mainMenu()); } else greet();
    }
    function openChat() {
      if (!panel) build();
      panel.classList.add('open'); launcher.setAttribute('aria-expanded', 'true'); launcher.classList.add('active');
      document.body.classList.add('chat-open');
      setTimeout(() => { if (matchMedia('(pointer:fine)').matches) input.focus(); log.scrollTop = log.scrollHeight; }, 60);
    }
    function closeChat() { if (!panel) return; panel.classList.remove('open'); launcher.setAttribute('aria-expanded', 'false'); launcher.classList.remove('active'); document.body.classList.remove('chat-open'); launcher.focus(); }
    S.openChat = openChat;

    /* ---------- messages ---------- */
    function paint(m, anim = true) {
      const el = document.createElement('div'); el.className = 'cm ' + m.who + (anim ? ' new' : '');
      el.innerHTML = m.who === 'bot' ? `<img src="assets/favicon.svg" alt="" class="cm-av"><div class="cm-b">${m.html}</div>` : `<div class="cm-b">${esc(m.text)}</div>`;
      log.appendChild(el); log.scrollTop = log.scrollHeight;
      $$('[data-go]', el).forEach((b) => (b.onclick = () => onQuick(b.dataset.go)));
    }
    function bot(html, quick, delay = 380) {
      const typing = document.createElement('div'); typing.className = 'cm bot typing'; typing.innerHTML = '<img src="assets/favicon.svg" alt="" class="cm-av"><div class="cm-b"><i></i><i></i><i></i></div>';
      log.appendChild(typing); log.scrollTop = log.scrollHeight; renderQuick([]);
      return new Promise((res) => setTimeout(() => { typing.remove(); const m = { who: 'bot', html }; state.msgs.push(m); paint(m); if (quick) renderQuick(quick); persist(); res(); }, delay));
    }
    function me(text) { const m = { who: 'me', text }; state.msgs.push(m); paint(m); persist(); }
    function renderQuick(q) {
      state.lastQuick = q; persist();
      const box = $('.cp-quick', panel); box.innerHTML = q.map((x) => `<button type="button" data-q="${esc(x[0])}">${esc(x[1])}</button>`).join('');
      $$('button', box).forEach((b) => (b.onclick = () => { const item = q.find((x) => x[0] === b.dataset.q); me(item[1]); onQuick(item[0]); }));
    }
    const mainMenu = () => [['quote', t('견적 요청', 'Request a quote')], ['tech', t('기술 문의', 'Technical question')], ['find', t('제품 찾기', 'Find a product')], ['faq', t('자주 묻는 질문', 'FAQ')], ['call', t('전화 연결', 'Call us')]];
    function greet() {
      const g = C.greeting || t(`안녕하세요, <b>SMG(주식회사 에스엠지)</b>입니다.<br>온도센서·히터·피드스루 관련 무엇이든 물어보세요.`, `Hello, this is <b>SMG Co., Ltd.</b><br>Ask us anything about temperature sensors, heaters and feedthroughs.`);
      bot(`${g}<div class="cm-st ${isOpen() ? 'on' : ''}">${esc(statusText())}</div>`, mainMenu(), 250);
    }

    /* ---------- product / FAQ matching ---------- */
    const norm = (s) => String(s || '').toLowerCase();
    function findProducts(q) {
      const k = norm(q).split(/\s+/).filter((w) => w.length > 1);
      const num = (q.match(/-?\d{2,4}/) || [])[0];
      let hit = D.products.map((p) => { const hay = norm([p.code, p.name, p.nameKo, p.summary, p.applications, (p.certs || []).join(' '), (p.features || []).join(' ')].join(' ')); let sc = 0; k.forEach((w) => { if (hay.includes(w)) sc += norm(p.code).includes(w) ? 3 : 1; }); if (num && typeof p.tmin === 'number' && +num >= p.tmin && +num <= p.tmax && /℃|도|°|temp|온도/i.test(q)) sc += 2; return { p, sc }; }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
      return hit.slice(0, 4).map((x) => x.p);
    }
    function findFaq(q) {
      const k = norm(q).split(/\s+/).filter((w) => w.length > 1);
      let best = null, bs = 0; (D.faq || []).forEach((f) => { const hay = norm(f.q + ' ' + f.a); let sc = 0; k.forEach((w) => { if (hay.includes(w)) sc++; }); if (sc > bs) { bs = sc; best = f; } });
      return bs >= 2 ? best : null;
    }
    const prodHtml = (ps) => `<div class="cm-prods">${ps.map((p) => `<a href="${L('product/' + encodeURIComponent(p.id) + '.html')}"><img src="${esc(S.img ? S.img.thumbSrc(p.images[0]) : p.images[0])}" alt="" loading="lazy"><span><b>${esc(p.code)}</b>${esc(EN ? p.name : p.nameKo)}${typeof p.tmin === 'number' ? `<small>${p.tmin} ~ ${p.tmax}℃</small>` : ''}</span></a>`).join('')}</div>`;

    /* ---------- inquiry flow ---------- */
    const STEPS = [
      ['company', () => t('회사명을 알려주세요.', 'What is your company name?')],
      ['name', () => t('담당자 성함을 알려주세요.', 'May I have your name?')],
      ['contact', () => t('회신 받으실 <b>이메일 또는 전화번호</b>를 입력해 주세요.', 'Please enter your <b>email or phone number</b> for our reply.')],
      ['message', () => { const q = S.quote ? S.quote.getQ() : []; return t('문의 내용을 자세히 적어주세요. (사용 환경·온도·수량·납기 등)', 'Please describe your request (conditions, temperature, quantity, lead time).') + (q.length ? `<div class="cm-note">${t(`견적함의 ${q.length}개 품목이 함께 전달됩니다.`, `${q.length} item(s) from your quote list will be included.`)}</div>` : ''); }]
    ];
    function startFlow(kind) {
      state.flow = { kind, step: 0 }; state.data = { type: kind === 'quote' ? D.inquiryTypes[0] : (D.inquiryTypes[1] || D.inquiryTypes[0]) }; persist();
      bot(t('네, 바로 접수해 드리겠습니다. 몇 가지만 여쭤볼게요.', 'Sure, let me take your request. Just a few questions.') + '<br>' + STEPS[0][1](), [['cancel', t('취소', 'Cancel')]]);
    }
    async function flowInput(v) {
      const f = state.flow, key = STEPS[f.step][0];
      if (key === 'contact') {
        const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), isTel = /^[0-9+\-\s()]{8,20}$/.test(v);
        if (!isMail && !isTel) { await bot(t('이메일(예: name@company.com) 또는 전화번호(예: 010-1234-5678) 형식으로 입력해 주세요.', 'Please enter a valid email (name@company.com) or phone number.'), [['cancel', t('취소', 'Cancel')]]); return; }
        if (isMail) state.data.email = v; else state.data.phone = v;
      } else state.data[key] = v.slice(0, 1000);
      f.step++; persist();
      if (f.step < STEPS.length) { await bot(STEPS[f.step][1](), [['cancel', t('취소', 'Cancel')]]); return; }
      const d = state.data;
      await bot(`${t('아래 내용으로 접수할까요?', 'Shall I submit the following?')}<dl class="cm-sum"><dt>${t('유형', 'Type')}</dt><dd>${esc(d.type)}</dd><dt>${t('회사', 'Company')}</dt><dd>${esc(d.company)}</dd><dt>${t('담당자', 'Name')}</dt><dd>${esc(d.name)}</dd><dt>${t('연락처', 'Contact')}</dt><dd>${esc(d.email || d.phone)}</dd><dt>${t('내용', 'Message')}</dt><dd>${esc(d.message)}</dd></dl><div class="cm-note">${t('[필수] 개인정보(회사명·성함·연락처) 수집·이용에 동의합니다. 목적: 문의 응대 / 보유: 처리 후 3년', '[Required] I consent to the collection of company, name and contact for responding to this inquiry (retained 3 years).')}</div>`, [['submit', t('동의하고 접수', 'Agree & submit')], ['cancel', t('취소', 'Cancel')]]);
    }
    async function submit() {
      const d = state.data, q = S.quote ? S.quote.getQ() : [];
      const items = q.map((x) => { const p = D.products.find((y) => y.id === x.id); return p ? `- ${p.code} ${p.name} × ${x.qty}` : ''; }).filter(Boolean).join('\n');
      const rec = { id: 'q' + Date.now(), createdAt: new Date().toISOString(), status: '신규', lang: EN ? 'EN' : 'KO', source: 'chat', type: d.type, product: '', company: d.company, name: d.name, phone: d.phone || '', email: d.email || '', qty: '', message: d.message, items };
      const subject = `[${t('채팅 문의', 'Chat Inquiry · EN')}] ${d.type} - ${d.company}`;
      const sent = !!(S.sendInquiry && await S.sendInquiry(subject, rec));
      try { const arr = JSON.parse(localStorage.getItem(S.INQ_KEY) || '[]'); arr.unshift(rec); localStorage.setItem(S.INQ_KEY, JSON.stringify(arr.slice(0, 500))); } catch (e) {}
      state.flow = null; persist();
      if (sent) await bot(t(`<b>접수되었습니다.</b> 담당자가 확인 후 ${isOpen() ? '곧' : '다음 영업일에'} 회신드리겠습니다. 감사합니다.`, `<b>Submitted.</b> Our team will reply ${isOpen() ? 'shortly' : 'on the next business day'}. Thank you.`), mainMenu());
      else {
        const body = `[${t('유형', 'Type')}] ${d.type}\n[${t('회사', 'Company')}] ${d.company}\n[${t('담당자', 'Name')}] ${d.name}\n[${t('연락처', 'Contact')}] ${d.email || d.phone}${items ? '\n[' + t('견적 품목', 'Items') + ']\n' + items : ''}\n\n${d.message}`;
        const href = `mailto:${D.settings.notifyEmail || D.company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        await bot(t(`메일 앱으로 내용을 전달합니다. 열리지 않으면 아래 버튼을 눌러주세요.<div class="cm-acts"><a class="cm-btn" href="${esc(href)}">메일로 보내기</a><a class="cm-btn line" href="${S.telHref(D.company.tel)}">전화 ${esc(D.company.tel)}</a></div>`, `Opening your email app. If it doesn't open, use the buttons below.<div class="cm-acts"><a class="cm-btn" href="${esc(href)}">Send by email</a><a class="cm-btn line" href="${S.telHref(D.company.tel)}">Call ${esc(D.company.tel)}</a></div>`), mainMenu());
        location.href = href;
      }
    }

    /* ---------- intents ---------- */
    async function onQuick(k) {
      if (k === 'cancel') { state.flow = null; persist(); return bot(t('취소했습니다. 다른 도움이 필요하신가요?', 'Cancelled. Anything else I can help with?'), mainMenu()); }
      if (k === 'submit') return submit();
      if (k === 'quote' || k === 'tech') return startFlow(k);
      if (k === 'find') { state.flow = { kind: 'find' }; persist(); return bot(t('찾으시는 제품의 <b>모델명·용도·사용온도</b>를 입력해 주세요.<br>예: <i>LNG 피드스루</i>, <i>-196도</i>, <i>PT100</i>', 'Type a <b>model, application or temperature</b>.<br>e.g. <i>LNG feedthrough</i>, <i>-196 temp</i>, <i>PT100</i>'), [['menu', t('처음으로', 'Main menu')]]); }
      if (k === 'faq') return bot(t('자주 묻는 질문입니다.', 'Frequently asked questions:'), (D.faq || []).slice(0, 5).map((f, i) => ['faq' + i, f.q]).concat([['menu', t('처음으로', 'Main menu')]]));
      if (/^faq\d+$/.test(k)) { const f = D.faq[+k.slice(3)]; return bot(esc(f.a), [['quote', t('견적 요청', 'Request a quote')], ['faq', t('다른 질문', 'Other questions')], ['menu', t('처음으로', 'Main menu')]]); }
      if (k === 'call') return bot(t(`대표전화 <a href="${S.telHref(D.company.tel)}"><b>${esc(D.company.tel)}</b></a> (${hoursKo})<br>이메일 <a href="mailto:${esc(D.company.email)}">${esc(D.company.email)}</a>`, `Phone <a href="${S.telHref(D.company.tel)}"><b>${esc(D.company.tel)}</b></a> (${hoursEn})<br>Email <a href="mailto:${esc(D.company.email)}">${esc(D.company.email)}</a>`), mainMenu());
      if (k === 'menu') { state.flow = null; persist(); return bot(t('무엇을 도와드릴까요?', 'How can I help you?'), mainMenu()); }
    }
    async function onUser(v) {
      me(v);
      if (state.flow && (state.flow.kind === 'quote' || state.flow.kind === 'tech')) return flowInput(v);
      const ps = findProducts(v);
      if (state.flow && state.flow.kind === 'find') {
        if (ps.length) return bot(t('이 제품들을 확인해 보세요.', 'Take a look at these products:') + prodHtml(ps), [['quote', t('이 제품 견적 요청', 'Request a quote')], ['find', t('다시 찾기', 'Search again')], ['menu', t('처음으로', 'Main menu')]]);
        return bot(t('일치하는 제품을 찾지 못했습니다. 맞춤 제작이 가능하니 담당자에게 남겨주세요.', "I couldn't find a match. We do custom designs — leave a request for our engineers."), [['tech', t('담당자에게 문의', 'Ask an engineer')], ['find', t('다시 찾기', 'Search again')]]);
      }
      if (/견적|가격|단가|quote|price|quotation/i.test(v)) return startFlow('quote');
      if (/전화|연락처|번호|call|phone/i.test(v)) return onQuick('call');
      const f = findFaq(v);
      if (f) return bot(`<b>${esc(f.q)}</b><br>${esc(f.a)}`, [['quote', t('견적 요청', 'Request a quote')], ['tech', t('담당자에게 문의', 'Ask an engineer')], ['menu', t('처음으로', 'Main menu')]]);
      if (ps.length) return bot(t('관련 제품입니다.', 'Related products:') + prodHtml(ps), [['quote', t('견적 요청', 'Request a quote')], ['tech', t('기술 문의 남기기', 'Leave a technical question')], ['menu', t('처음으로', 'Main menu')]]);
      return bot(t('정확한 답변을 위해 담당 엔지니어에게 전달해 드릴게요.', "I'll pass this to our engineers for an accurate answer."), [['tech', t('문의 남기기', 'Leave a request')], ['call', t('전화 연결', 'Call us')], ['menu', t('처음으로', 'Main menu')]]);
    }
    // deep link: ?chat=1 opens the chat
    if (/[?&]chat=1/.test(location.search)) setTimeout(openChat, 400);
  }
  const tryStart = () => { if (window.SMG && window.SMG.booted) start(); else setTimeout(tryStart, 30); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryStart); else tryStart();
})();
