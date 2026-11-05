"""
Usage: python3 tools/build_en_pages.py .   (run after editing Korean page HTML to refresh en/*.html)
Generate /en/*.html from Korean pages: translate static text, rewrite links, add <base href="../">."""
import re, sys, os
root = sys.argv[1]
os.makedirs(f'{root}/en', exist_ok=True)
T = {
 # index
 'ATEX · IECEx · KCs · KTL 방폭 인증, BV 선급, ASME PTC 19.3 설계 기준과 ISO 품질·환경 경영 시스템을 기반으로 위험지역에서도 안전한 제품을 공급합니다.': 'Backed by ATEX · IECEx · KCs · KTL explosion-proof certifications, BV marine classification, ASME PTC 19.3 design standards and ISO quality & environmental management, we supply products that are safe even in hazardous areas.',
 'SMG 소식': 'News', 'SMG 제품 라인업': 'SMG product line-up', 'SMG의 기술': 'critical industrial equipment',
 '견적 문의하기': 'Request a quote', '글로벌 방폭·선급 인증으로': 'Reliability proven by global', '입증된 신뢰성': 'explosion-proof & marine certifications',
 '도면 한 장이면 충분합니다.': 'Just send us a drawing.', '맞춤형 센서·히터를 제작해 드립니다.': 'We build custom sensors and heaters.',
 '발전기 권선 감시부터 -253℃ LNG·LH₂ 극저온 피드스루, 반도체 메탈 척 히터, 방산·항공우주 히터까지.': 'From generator winding monitoring to -253℃ LNG · LH₂ cryogenic feedthroughs, semiconductor metal chuck heaters and defense & aerospace heaters.',
 '사양 검토부터 도면 협의, 인증 대응까지 엔지니어가 직접 답변드립니다.': 'Our engineers support you from specification review and drawings to certification.',
 '산업 핵심 설비에 적용되는': 'Engineered for', '전체 보기': 'View all', '전체 제품 보기': 'All products', '제품 더 보기': 'More products',
 '좌우로 넘겨보세요 →': 'Swipe to see more →', '주요 제품': 'Featured products', '카탈로그 다운로드': 'Download catalog', '현장이 요구하는 정밀함,': 'Precision demanded by the field —',
 # about
 '1990년 성실전자로 시작해 35년간 온도센서·히터·피드스루 한 길을 걸어온 전문 제조기업입니다.': 'Founded in 1990 as Sungsil Electronics, SMG has specialized in temperature sensors, heaters and feedthroughs for 35 years.',
 '35년의 기술 축적': '35 years of expertise',
 'Honeywell Process Solutions 공식 인증 대리점(APAC), WIKA 판매대리점, REXA 파트너로서 글로벌 계측·제어 솔루션을 함께 공급합니다.': 'As an authorized Honeywell Process Solutions distributor (APAC), WIKA distributor and REXA partner, we supply global measurement and control solutions.',
 '글로벌 파트너십': 'Global partnerships', '기업 정보': 'Company information', '기업개요': 'Overview',
 '방폭(ATEX·IECEx·KCs·KTL), 선급(BV), ASME PTC 19.3, UL 및 ISO 9001·14001': 'Explosion-proof (ATEX · IECEx · KCs · KTL), marine (BV), ASME PTC 19.3, UL and ISO 9001 · 14001',
 '연혁': 'History', '오시는 길': 'Location', '인증 현황': 'Certifications', '인증현황': 'Certifications', '파트너': 'Partners', '회사소개': 'About SMG', '회사소개 메뉴': 'Company menu',
 # products
 '길이·소자·리드선·인증 등급까지 현장 공정에 맞춰 주문 제작합니다.': 'Length, element, lead wire and certification grade — made to order for your process.',
 '맞춤 제작 문의': 'Custom request', '원하는 사양이 목록에 없나요?': "Can't find the specification you need?", '제품소개': 'Products',
 '카탈로그 PDF 다운로드 →': 'Download catalog PDF →', '모델명, 제품명, 인증, 적용분야로 검색 (예: PT100, ATEX, LNG)': 'Search by model, name, certification or application (e.g. PT100, ATEX, LNG)',
 '제품 검색': 'Product search', '카테고리': 'Categories',
 # applications
 '기술 상담 요청': 'Ask an engineer', '발전·조선(LNG/LH₂)·플랜트·반도체·방산·항공우주 등 산업 핵심 설비의 안전과 품질을 책임집니다.': 'Ensuring the safety and quality of core equipment in power, shipbuilding (LNG/LH₂), plants, semiconductors, defense and aerospace.',
 '방산부품(히터) 납품 실적': 'Defense heater references', '사용 환경을 알려주시면 최적의 사양을 제안드립니다.': 'Tell us your operating conditions and we will propose the optimal specification.',
 '산업별 솔루션': 'Industries', '우리 설비에 맞는 제품이 궁금하신가요?': 'Looking for the right product for your equipment?', '적용분야': 'Applications',
 '한국방위산업진흥회 회원사로서 조준경·LCD·무전기 성에 방지, 배터리 결빙 방지용 히터를 공급합니다.': 'As a member of the Korea Defense Industry Association, we supply anti-frost and anti-freeze heaters for defense equipment.',
 # support
 '고객지원': 'Support', '공지사항': 'News', '공지사항과 기술 자료, 자주 묻는 질문을 확인하세요.': 'News, technical documents and frequently asked questions.', '자료실': 'Downloads', '자주 묻는 질문': 'Frequently asked questions', '고객지원 메뉴': 'Support menu',
 # contact
 '[필수] 개인정보 수집·이용 동의': '[Required] Consent to collection and use of personal information', '견적 · 기술 문의': 'Quotation · Technical Inquiry', '견적문의': 'Contact',
 '관심 제품': 'Product of interest', '담당자명': 'Your name', '담당자명을 입력해 주세요': 'Please enter your name', '문의 내용': 'Message', '문의 내용을 입력해 주세요': 'Please enter your message',
 '문의 유형': 'Inquiry type', '문의 접수하기': 'Submit inquiry', '문의를 남겨주시면 담당 엔지니어가 빠르게 회신드립니다.': 'Leave your inquiry and our engineers will reply promptly.',
 '수집항목: 회사명, 담당자명, 연락처, 이메일 / 목적: 문의 응대 및 견적 회신 / 보유기간: 문의 처리 후 3년.': 'Items: company, name, phone, email / Purpose: responding to inquiries and quotations / Retention: 3 years after handling.',
 '연락처': 'Phone', '예상 수량 / 납기': 'Expected quantity / lead time', '올바른 연락처를 입력해 주세요': 'Please enter a valid phone number', '올바른 이메일을 입력해 주세요': 'Please enter a valid email',
 '이메일': 'Email', '전문 보기': 'Read policy', '회사명': 'Company', '회사명을 입력해 주세요': 'Please enter your company name',
 '사용 환경(온도·압력·매체), 요구 사양, 인증 필요 여부 등을 적어주시면 더 정확한 답변이 가능합니다.': 'Operating conditions (temperature, pressure, medium), required specifications and certification needs help us answer accurately.',
 '예) 50EA / 2027년 1월': 'e.g. 50 pcs / January 2027', '010-0000-0000': '+1 555 123 4567',
 # 404
 '문의하기': 'Contact us', '요청하신 페이지를 찾을 수 없습니다. 주소를 확인하시거나 아래 버튼을 이용해 주세요.': 'The page you requested could not be found. Please check the address or use the buttons below.', '제품 보기': 'View products', '홈으로': 'Home',
 '개인정보처리방침': 'Privacy Policy',
}
META = {
 'index': ('SMG Co., Ltd. | Temperature Sensors · Heaters · Feedthroughs Manufacturer', 'Since 1990, SMG manufactures temperature sensors (RTD/TC), thermowells, heaters, pressure transmitters, explosion-proof cable bushings and cryogenic feedthroughs for power, shipbuilding (LNG/LH₂), semiconductor and defense industries.'),
 'about': ('About SMG | SMG Co., Ltd.', 'SMG Co., Ltd. company overview, message, history, global partners, certifications and location.'),
 'products': ('Products | SMG Co., Ltd.', 'Temperature sensors (RTD/TC), thermowells, heaters, pressure transmitters, cable bushings and feedthroughs.'),
 'product': ('Product details | SMG Co., Ltd.', 'SMG product specifications, installation and certifications.'),
 'applications': ('Applications | SMG Co., Ltd.', 'Power generation, shipbuilding LNG/LH₂, petrochemical, semiconductor & display, defense and aerospace applications.'),
 'support': ('Support | SMG Co., Ltd.', 'News, catalog downloads and FAQ.'),
 'notice': ('News | SMG Co., Ltd.', 'News and announcements from SMG Co., Ltd.'),
 'contact': ('Contact | SMG Co., Ltd.', 'Online inquiry for quotations, technical consultation and samples.'),
 'privacy': ('Privacy Policy | SMG Co., Ltd.', 'SMG Co., Ltd. privacy policy.'),
 '404': ('Page not found | SMG Co., Ltd.', 'Page not found.'),
}
PRIVACY_EN = '''<main id="main"><section class="sec"><div class="container prose" style="max-width:860px">
<p><b data-co="name"></b> (the "Company") protects the personal information of data subjects in accordance with the Personal Information Protection Act of Korea and discloses this privacy policy.</p>
<h3 style="margin-top:36px">1. Information we collect</h3><p>When you submit a quotation or technical inquiry, we collect your company name, name, phone number, email and message.</p>
<h3 style="margin-top:28px">2. Purpose of use</h3><p>Used only to respond to inquiries, send quotations and provide technical consultation.</p>
<h3 style="margin-top:28px">3. Retention period</h3><p>Retained for 3 years after the inquiry is handled and destroyed without delay thereafter, unless retention is required by law.</p>
<h3 style="margin-top:28px">4. Disclosure to third parties</h3><p>We do not provide personal information to third parties except with your consent or as required by law.</p>
<h3 style="margin-top:28px">4-1. Outsourcing</h3><p>To forward website inquiries to our staff by email, we may use external form delivery and chat services (Web3Forms, with Formspree as backup; optionally KakaoTalk Channel, Channel Talk). The service provider does not use personal information for any other purpose.</p>
<h3 style="margin-top:28px">5. Your rights</h3><p>You may request access, correction, deletion or suspension of processing of your personal information at any time via the contact below.</p>
<h3 style="margin-top:28px">5-1. Cookies and visitor statistics</h3><p>We may use web analytics tools such as Google Analytics and Naver Analytics to understand how our website is used. These tools use cookies to collect information that does not directly identify you, such as visit time, pages viewed, browser and device type, and approximate location. You can refuse cookies in your browser settings without any restriction on using this website.</p>
<h3 style="margin-top:28px">6. Contact</h3><p>Email: <span data-co="email"></span> · Phone: <span data-co="tel"></span></p>
<p style="margin-top:36px;font-size:14px">Effective date: November 2, 2026</p></div></section></main>'''
SITE = 'https://www.sungsil.com/'
PAGES = ['index', 'about', 'products', 'product', 'applications', 'support', 'notice', 'contact', 'privacy', '404']
for name in PAGES:
    s = open(f'{root}/{name}.html', encoding='utf-8').read()
    s = re.sub(r'<link rel="(alternate" hreflang="[^"]+|canonical)" href="[^"]*">\n', '', s)
    title, desc = META[name]
    s = s.replace('<html lang="ko">', '<html lang="en">')
    s = re.sub(r'<title>[^<]*</title>', f'<title>{title}</title>', s)
    s = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + desc, s)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title, s)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + desc, s)
    s = s.replace('content="SMG 주식회사 에스엠지"', 'content="SMG Co., Ltd."')
    if name == 'privacy':
        s = re.sub(r'<main id="main">.*</main>', lambda m: PRIVACY_EN, s, flags=re.S)
    # static text and attribute translation (longest first)
    for k in sorted(T, key=len, reverse=True):
        s = s.replace('>' + k + '<', '>' + T[k] + '<').replace('"' + k + '"', '"' + T[k] + '"')
        s = re.sub(r'>(\s*)' + re.escape(k) + r'(\s*)<', lambda m: '>' + m.group(1) + T[k] + m.group(2) + '<', s)
    # links: page links → en/, in-page anchors → en/<page>#id, assets unchanged
    page_file = f'{name}.html'
    def fix(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r'(https?:|mailto:|tel:|data:|assets/|css/|js/|data/|admin\.html)', url): return m.group(0)
        if url.startswith('#'): return f'{attr}="en/{page_file}{url}"'
        if re.match(r'[a-z0-9-]+\.html', url): return f'{attr}="en/{url}"'
        return m.group(0)
    head, body = s.split('<body', 1)
    body = re.sub(r'(href)="([^"]*)"', fix, body)
    s = head + '<body' + body
    canon = '' if name in ('product', 'notice', '404') else f'<link rel="canonical" href="{SITE}en/{page_file}">\n'
    hreflang = (f'<base href="../">\n<link rel="alternate" hreflang="ko" href="{SITE}{page_file}">\n<link rel="alternate" hreflang="en" href="{SITE}en/{page_file}">\n<link rel="alternate" hreflang="x-default" href="{SITE}{page_file}">\n' + canon)
    s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + hreflang, 1)
    s = s.replace('<script src="data/site-data.js"></script>', '<script src="data/site-data.js"></script>\n<script src="data/site-data-en.js"></script>')
    # English structured data (search engines show this, so no Korean on EN pages)
    s = s.replace('"name":"주식회사 에스엠지","alternateName":["SMG Co., Ltd.","SUNGSIL MFG"]', '"name":"SMG Co., Ltd.","alternateName":["주식회사 에스엠지","SUNGSIL MFG"]')
    s = s.replace('"streetAddress":"시화벤처로 305 (시화 MTV 3사 204호)","addressLocality":"시흥시","addressRegion":"경기도"', '"streetAddress":"305, Sihwa venture-ro (Sihwa MTV 3sa #204)","addressLocality":"Siheung-si","addressRegion":"Gyeonggi-do"')
    left = [x for x in re.findall(r'>([^<>]*[가-힣][^<>]*)<', s[s.index('<body'):])]
    open(f'{root}/en/{page_file}', 'w', encoding='utf-8').write(s)
    print(name, 'untranslated:', left[:5])
# hreflang on Korean pages
for name in PAGES:
    p = f'{root}/{name}.html'; s = open(p, encoding='utf-8').read()
    s = re.sub(r'<link rel="(alternate" hreflang="[^"]+|canonical)" href="[^"]*">\n', '', s)
    canon = '' if name in ('product', 'notice', '404') else f'\n<link rel="canonical" href="{SITE}{name}.html">'
    s = s.replace('<meta charset="UTF-8">', f'<meta charset="UTF-8">\n<link rel="alternate" hreflang="ko" href="{SITE}{name}.html">\n<link rel="alternate" hreflang="en" href="{SITE}en/{name}.html">\n<link rel="alternate" hreflang="x-default" href="{SITE}{name}.html">' + canon, 1)
    open(p, 'w', encoding='utf-8').write(s)
# home page canonical = site root (matches sitemap.xml)
import glob
for f in glob.glob(f'{root}/*.html') + glob.glob(f'{root}/en/*.html'):
    t = open(f, encoding='utf-8').read(); u = t.replace(f'"{SITE}index.html"', f'"{SITE}"')
    if u != t: open(f, 'w', encoding='utf-8').write(u)
