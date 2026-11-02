/* SMG 홈페이지 콘텐츠 데이터
 * - 관리자 페이지(admin.html)에서 편집 → [게시용 파일 내보내기]로 이 파일을 교체하면 사이트 전체에 반영됨
 * - 직접 수정 시 JSON 문법(쉼표, 따옴표) 주의
 */
window.SMG_DEFAULT_DATA = {
  "version": 1,
  "updatedAt": "2026-11-02",
  "company": {
    "name": "주식회사 에스엠지",
    "nameEn": "SMG Co., Ltd.",
    "brand": "SMG",
    "brandSub": "SUNGSIL MFG",
    "slogan": "A Higher Degree of Confidence for SMG Products",
    "founded": 1990,
    "ceo": "",
    "bizNo": "",
    "address": "경기도 시흥시 시화벤처로 305 (시화 MTV 3사 204호)",
    "addressEn": "305, Sihwa venture-ro, Siheung-si, Gyeonggi-do, South Korea",
    "tel": "031-504-7766",
    "fax": "031-504-0200",
    "email": "sungsil@sungsil.com",
    "website": "www.sungsil.com",
    "hours": "평일 09:00 – 18:00 (주말·공휴일 휴무)",
    "mapQuery": "경기도 시흥시 시화벤처로 305"
  },
  "settings": {
    "formEndpoint": "",
    "notifyEmail": "sungsil@sungsil.com",
    "catalogPdf": "assets/SMG_Products_Catalogue.pdf",
    "gaId": "",
    "showPopup": false,
    "popupTitle": "",
    "popupBody": ""
  },
  "hero": {
    "eyebrow": "Since 1990 · Sensor & Heater Specialist",
    "title": "극한의 현장에서도\n정확하게 측정하고, 안전하게 가열합니다",
    "subtitle": "온도센서 · 히터 · 메탈척 · 피드스루 · 압력센서\n발전·조선·반도체·방산 현장을 위한 35년 제조 기술력",
    "image": "assets/img/hero.webp",
    "ctaPrimary": "제품 보기",
    "ctaSecondary": "견적 문의"
  },
  "stats": [
    { "value": "1990", "label": "설립연도", "suffix": "" },
    { "value": "35", "label": "제조 업력", "suffix": "년+" },
    { "value": "20", "label": "제품 라인업", "suffix": "종+" },
    { "value": "8", "label": "보유 인증 (방폭·선급·ISO)", "suffix": "종" }
  ],
  "about": {
    "title": "A Higher Degree of Confidence for SMG Products",
    "body": [
      "㈜에스엠지는 1990년 설립 이래 온도센서, 히터, 피드스루 관련 제품을 30여 년 이상 생산해 오고 있습니다. 고객 여러분께 경쟁력 있는 가격의 제품을 공급할 수 있는 생산력과 숙련된 기술 경험을 축적해 왔습니다.",
      "모든 제품은 엄격한 품질관리 시스템 절차에 따라 설계·생산·관리되며, 모든 품질 테스트 요건에 부합하도록 인증실사 제도를 통해 품질경영 시스템 확립에 필요한 프로그램 개발 및 유지에 힘쓰고 있습니다.",
      "온도센서, 히터, 피드스루 등 다양한 제품 생산경험과 우수한 인적자원으로 고객만족을 위한 광범위한 기술 및 연구개발과 내부혁신에 최선을 다하겠습니다."
    ],
    "image": "assets/img/building.webp",
    "values": [
      { "title": "Custom Engineering", "desc": "현장 공정·설치 환경에 맞춘 주문형 설계·제작" },
      { "title": "Certified Safety", "desc": "ATEX · IECEx · KGS · KTL 방폭 및 BV 선급 인증" },
      { "title": "Quality System", "desc": "ISO 9001 · ISO 14001 기반 품질·환경 경영" },
      { "title": "Global Partners", "desc": "GE Partner, WIKA · Honeywell 판매대리점" }
    ]
  },
  "categories": [
    { "id": "temperature", "name": "온도센서", "nameEn": "Temperature Sensor", "desc": "고정자 권선 RTD, 코일엔드·표면 온도센서, 산업용 RTD/TC, 서모스탯, 서모웰", "image": "assets/img/str.webp", "color": "#4b3a63" },
    { "id": "metal-chuck", "name": "메탈척 · 에어히터", "nameEn": "Metal Chuck", "desc": "반도체·디스플레이 장비용 메탈척 히터, 대면적 메탈 히터, 세라믹 몰딩 에어히터", "image": "assets/img/metal-chuck.webp", "color": "#4a4a2c" },
    { "id": "heater", "name": "히터", "nameEn": "Heater", "desc": "Kapton 필름, 투명(Clear view), Mica, Epoxy, Silicone Rubber 면상 히터", "image": "assets/img/hk.webp", "color": "#1f2f57" },
    { "id": "feedthrough", "name": "케이블부싱 · 피드스루", "nameEn": "Cable Bushing · Feedthrough", "desc": "방폭 케이블 부싱, 글라스·세라믹 메탈라이징 피드스루 (ShieldLoc)", "image": "assets/img/gb.webp", "color": "#5a2a26" },
    { "id": "pressure", "name": "압력센서", "nameEn": "Pressure Sensor", "desc": "마이크로퓨즈드 방식 산업용 압력 트랜스미터", "image": "assets/img/spt.webp", "color": "#4b2f6b" }
  ],
  "products": [
    {
      "id": "fx-tx", "category": "temperature", "code": "FX, TX", "name": "Stator Winding RTD", "nameKo": "고정자 권선 온도센서",
      "summary": "모터·발전기 고정자 슬롯 사이에 삽입하여 권선 과열을 감지하는 박형 RTD/TC. 센서 전 길이 감온으로 평균 온도 측정.",
      "images": ["assets/img/fx-sensors.webp", "assets/img/fx-coil.webp", "assets/img/fx-stator.webp"],
      "features": [
        "백금·구리·니켈 소자 적용, 두께가 얇고 무유도성",
        "진동에 강하고 고압에서 견디는 구조",
        "센서 전체 길이 감온 → 국부 측정 오차 방지 (ANSI C50-10-1990 Sec.5.2)",
        "모터당 6개(상당 2개) 설치 권장, 최고 발열부 설치",
        "Class F(155℃) / Class H(180℃), 길이 30 ~ 5,000mm 주문 제작"
      ],
      "applications": "중형·대형 모터, 발전기 등",
      "certs": ["ATEX Ex ia IIC T6…T3 Ga", "ATEX Ex eb IIC Gb", "IECEx Ex eb IIC Gb", "IECEx Ex ia IIC T6…T3 Ga", "KTL Ex e IIC", "KGS Ex ia IIC T6…T3", "BV 18688/C0 BV"],
      "specs": [["Element", "Pt100Ω / Pt1000Ω at 0℃, Cu 10Ω, Ni 120Ω, TC K/J/E/T"], ["Body thickness", "1.3 / 2.0 mm"], ["Body width", "6 (Single) / 11·12 (Dual) mm"], ["Element 수", "Single 2·3·4 wire / Dual 6·8 wire"], ["Leadwire", "Teflon / Silicon shield / Teflon shield"], ["Tolerance", "Class A / Class B"], ["Standard", "IEC 60751, JIS C 1604"]],
      "orderCode": "WTD FX-0-0-0-0-1-0-0-0-3",
      "featured": true
    },
    {
      "id": "btr51", "category": "temperature", "code": "BTR51", "name": "Coil End Temperature Detector", "nameKo": "코일엔드 온도센서",
      "summary": "박막·원통형 소자를 내열 수축튜브로 감싸고 액상 실리콘을 충진한 코일엔드용 센서. 빠른 응답과 우수한 내진동성.",
      "images": ["assets/img/btr51-install.webp"],
      "features": ["Small, rugged RTD's and Thermocouples", "Excellent vibration resistance", "Fast response", "유연·무유도성 소자, 원하는 지점의 정확한 온도 측정"],
      "applications": "대형 모터 및 발전기 코일 엔드",
      "certs": ["ATEX Ex ia IIC T6…T3 Ga", "KGS Ex ia IIC T6…T3", "BV 18688/C0 BV"],
      "specs": [["Element", "PT100B(±0.3%) / PT100A(±0.15%) / PT1000B / TC K·J·E·T"], ["Lead wire", "2·3·4 wire(Single), 4·6·8 wire(Dual)"], ["Insulation", "Teflon / Silicon shield"], ["Lead length", "3M (주문 사양)"]],
      "orderCode": "BTR51 PT100B-3M-3-T-Ai",
      "featured": false
    },
    {
      "id": "std", "category": "temperature", "code": "STD", "name": "Surface Temperature Detector", "nameKo": "표면 온도센서",
      "summary": "배관·탱크·충전지·고압트랜스 등 표면에 부착하여 과열·동결로 인한 손상을 방지하는 소형 표면 온도센서.",
      "images": ["assets/img/std.webp"],
      "features": ["다양한 형태의 표면에 빠르고 쉽게 부착", "길이 방향 평균 온도 측정으로 부분 측정 오차 제거", "곡면 취부 가능, 권선 끝부분 측정 특화 설계", "빠른 감지속도, 소형, 내습성"],
      "applications": "모터 코일엔드, 파이프 배관 표면, 충전용 배터리, 액체·고체 탱크, 항공우주, 군사·의료 장비",
      "certs": [],
      "specs": [["STD30", "PT100, 1×PT1000 / -62 ~ 200℃ / Screw mounting(Ø4)"], ["STD50", "PT100(TFS), PT1000 / -55 ~ 180℃"], ["STD60", "PT100(Drawing type) / -55 ~ 180℃"], ["STD70", "PT100, PT1000 / -55 ~ +260℃"], ["Connection", "Single(2,3,4) / Dual(4,6,8)"]],
      "orderCode": "STD60 PT100-3M-S3",
      "featured": false
    },
    {
      "id": "str", "category": "temperature", "code": "STR", "name": "Industrial Process RTD", "nameKo": "산업용 측온저항체(RTD)",
      "summary": "금속 저항의 온도 변화 특성을 이용한 고정밀 산업용 측온저항체. 방폭·방수·컴팩트·None Head 타입.",
      "images": ["assets/img/str.webp", "assets/img/str-all.webp"],
      "features": ["Quick Response, High Flexibility, High Accuracy", "선단 50mm 제외 외경 5배 이상 벤딩 가능", "측정범위 -200 ~ 650℃", "Weather proof / Explosion proof / Compact·DIN / None Head"],
      "applications": "석유화학·발전·플랜트 공정 배관 및 설비",
      "certs": ["HEAD: IECEx/ATEX(CE)/KGS Ex db eb IIC T6", "NONE HEAD: IECEx/ATEX(CE)/KGS Ex ia IIC T6…T4", "IECEx/ATEX(CE)/KGS Ex eb IIC T6"],
      "specs": [["Diameter", "3.2, 4.8, 6.0, 6.4, 8.0 mm"], ["Element", "Pt100Ω, Pt1000Ω, JPt100Ω at 0℃"], ["Tolerance", "Class A, B (DIN/IEC751-1, BS/EN60751-1, JIS C1604)"], ["Head material", "ALDC(Standard) / 304SS"]],
      "orderCode": "",
      "featured": true
    },
    {
      "id": "stc", "category": "temperature", "code": "STC", "name": "Industrial Process Thermocouples", "nameKo": "산업용 열전대(TC)",
      "summary": "저온부터 초고온까지 측정하는 시스 열전대. 고순도 마그네시아 분말 충진으로 절연성·내압성 우수.",
      "images": ["assets/img/stc.webp"],
      "features": ["일반 산업용 및 방폭 지역용 열전대", "고순도 MgO 충진 시스 구조", "Ungrounded / Grounded / Exposed 접점"],
      "applications": "고온 공정로, 플랜트, 발전 설비, 방폭 위험지역",
      "certs": ["HEAD: IECEx/ATEX(CE)/KGS Ex db eb IIC T6", "NONE HEAD: IECEx/ATEX(CE)/KGS Ex ia IIC T6…T4", "IECEx/ATEX(CE)/KGS Ex eb IIC T6"],
      "specs": [["Diameter", "1.0, 1.6, 2.3, 3.2, 4.8, 6.0, 6.4, 8.0 mm"], ["Element", "ISA R, S, B, K, J, E, T, N, C(W5)"], ["Tolerance", "Class 1, 2 (DIN/IEC584-2, BS/EN60584-2, JIS C1602)"], ["Head material", "ALDC(Standard) / 304SS"]],
      "orderCode": "",
      "featured": false
    },
    {
      "id": "sts", "category": "temperature", "code": "STS", "name": "Industrial Process Thermostats", "nameKo": "바이메탈 온도스위치",
      "summary": "바이메탈 기반 온도 스위치. 설비 과열 시 차단 또는 냉각팬 기동 등 온도 제한 제어.",
      "images": ["assets/img/sts.webp"],
      "features": ["Snap Action, Automatic Reset", "Superior Heat Response", "PBT Resin Case with Epoxy Sealing", "IP45, Normally Closed", "Wire Customization upon Request"],
      "applications": "전동기, 배터리 충전기, 변압기, 전원장치, 히팅패드, OA기기, 솔레노이드, LED 조명",
      "certs": [],
      "specs": [["Setting range", "50 ~ 150℃ (5℃ 단위)"], ["Heat endurance", "Open Temp. +50℃ 연속, 200℃/1min"], ["Dielectric strength", "AC 1500 V, 1min"], ["Service life", "DC 48V/3A, 6,000 Cycle (UL 873)"]],
      "orderCode": "",
      "featured": false
    },
    {
      "id": "stw", "category": "temperature", "code": "STW", "name": "Industrial Process Thermowells", "nameKo": "서모웰",
      "summary": "내열·내식 합금 환봉을 건드릴링 가공한 고강도 서모웰. 현장 조건 기반 공진·강도 자동 계산 설계.",
      "images": ["assets/img/stw.webp"],
      "features": ["Two-Shaft Gun Drilling (최대 2m) + NC 선반 가공", "Kármán 와류 공진 주파수 계산 설계", "Drilled bar stock (Taper/Straight), Flanged type", "옵션: He Leak, PT, Mill Certificate 교차 검증"],
      "applications": "고압·고온·고유속 공정 배관, 부식성 유체",
      "certs": [],
      "specs": [["Round bar O.D.", "25 ~ 55 mm"], ["Hex bar", "27, 32, 35, 38, 41 mm"], ["Material", "304/321/316/347/310/446SS, Inconel, Hastelloy, Monel, Ti, Ta 등"], ["Test", "N₂ 10MPa / 수압 40MPa / RT(X-Ray)"]],
      "orderCode": "",
      "featured": false
    },
    {
      "id": "metal-chuck-heater", "category": "metal-chuck", "code": "MCH", "name": "Metal Chuck Heater", "nameKo": "메탈척 히터",
      "summary": "8~12인치 웨이퍼 공정용 메탈척 히터. MICA 히터 내장으로 기존 시스히터 대비 우수한 온도 안정성.",
      "images": ["assets/img/metal-chuck.webp", "assets/img/metal-chuck-thermal.webp"],
      "features": ["Operation -50 ~ 350℃ (변경 가능)", "Heating rate 20℃/min", "옵션: Anodizing, Suction, Sensor, Plating", "고객 장비 맞춤 설계·제작, 유지보수 가능"],
      "applications": "반도체·디스플레이 공정 장비",
      "certs": [],
      "specs": [["Operation temp", "-50 ~ 350℃ / Changeable"], ["Size", "8\" – 12\" / Changeable"], ["Thickness", "35t / Changeable"], ["Input", "AC, DC"], ["Material", "Aluminum, Oxygen Free Copper, MMC"], ["Heater", "MICA Heater"]],
      "orderCode": "",
      "featured": true
    },
    {
      "id": "metal-heater", "category": "metal-chuck", "code": "MH", "name": "Metal Heater", "nameKo": "대면적 메탈 히터",
      "summary": "최대 750×650 대면적 메탈 히터. 멀티존 제어로 150℃에서 ±10℃ 이내 균일도.",
      "images": ["assets/img/metal-heater.webp", "assets/img/metal-heater-test.webp"],
      "features": ["Up to 150℃", "Multi zone control (5 ~ 9 zone)", "진공 환경 사용 가능", "옵션: Anodizing, Suction, Sensor, Polishing"],
      "applications": "디스플레이·패널 공정, 진공 장비",
      "certs": [],
      "specs": [["Operation temp", "Up to 150℃"], ["Size", "750 × 650"], ["Input", "AC 220V"], ["Uniformity", "±10℃ 이내 (at 150℃)"], ["Heating rate", "20℃/min"]],
      "orderCode": "",
      "featured": false
    },
    {
      "id": "air-heater", "category": "metal-chuck", "code": "AH", "name": "Air Heater", "nameKo": "세라믹 에어히터",
      "summary": "금속 발열선을 세라믹으로 몰딩하여 산화·파티클이 없는 에어히터. 토출 최대 900℃.",
      "images": ["assets/img/air-heater.webp", "assets/img/air-heater-cartridge.webp"],
      "features": ["에어 공급 차단 시에도 단선 없음", "발열선 비노출 → 쇼트·화재 위험 제거", "습도에 강함, ON/OFF 순서 제약 없음", "텅스텐/몰리브덴 발열선"],
      "applications": "항공우주, 섬유, 포장, 반도체·전자, 자동차, 살균, 플라스틱·고무, 인쇄",
      "certs": [],
      "specs": [["Working temp", "토출 Max 900℃"], ["Body", "SUS 304 or Quartz & Ceramic"], ["Rated", "220 Vac, 750W / 1000W"], ["Flow", "20 ~ 50 LPM"], ["Sensor(Opt.)", "Thermocouple Type K"]],
      "orderCode": "",
      "featured": false
    },
    {
      "id": "hk", "category": "heater", "code": "HK", "name": "Kapton Film Heater", "nameKo": "캡톤 필름 히터",
      "summary": "폴리이미드 필름 사이 저항선·에칭포일 열선을 적용한 박형 면상 히터. 유연하여 곡면 부착 가능.",
      "images": ["assets/img/hk.webp"],
      "features": ["내화학성 우수, 전기적 노이즈에 강함", "얇은 두께, 높은 내열성", "균일한 온도 분포 설계", "PSA(양면테이프) 옵션으로 부착 용이"],
      "applications": "방산·항공우주, 의료·광학 장비, 반도체 장비, LCD, CCTV 성에 제거",
      "certs": [],
      "specs": [["Operating temp", "-50 ~ 180℃"], ["Thickness", "0.254mm 이내 (PSA 제외)"], ["Size", "600 × 500mm (그 외 협의)"], ["Input", "DC/AC"], ["Insulation", "AC 500 ~ 1000V (60 sec)"]],
      "orderCode": "",
      "featured": true
    },
    {
      "id": "hc", "category": "heater", "code": "HC", "name": "Clear view Heater", "nameKo": "투명 히터",
      "summary": "미세 열선 패턴을 광학필름 사이에 넣어 빛의 차단 없이 발열. 최소 광투과율 82%.",
      "images": ["assets/img/hc.webp"],
      "features": ["Micro-thin wire heating element", "Optical grade polyester sheet", "빛 차단 없는 김서림 제거"],
      "applications": "김서림 제거, 의료장비, 자동차 백미러, 군용 노트북, 내비게이터, LED·LCD",
      "certs": [],
      "specs": [["Material", "Polyester + Metal"], ["Operating temp", "-55 ~ +80℃"], ["Transparency", "82% min. light transmission"]],
      "orderCode": "HC 1020P 220V 30W",
      "featured": false
    },
    {
      "id": "hm", "category": "heater", "code": "HM, HMC", "name": "Mica Plate Heater", "nameKo": "마이카 플레이트 히터",
      "summary": "마이카 판 사이 스테인리스 박판 발열체를 압착한 고온용 면상 히터. 최대 500℃, 균일도 ±1℃.",
      "images": ["assets/img/hm.webp", "assets/img/hm-layers.webp"],
      "features": ["고온용 주문 제작 설계", "우수한 열전달·균일한 온도 분포", "두께 0.3 ~ 1.5mm, 고속 승·강온", "전기적 내노이즈성 우수"],
      "applications": "반도체 웨이퍼 가열, 의료장비, 군사용 장비, LCD 패널 Aging",
      "certs": [],
      "specs": [["Operating temp", "-50 ~ 500℃"], ["Thickness", "0.8 ~ 2mm"], ["Size", "600 × 500mm (그 외 협의)"], ["Power density", "3W/㎠ (25℃ open air)"], ["Uniformity", "±1℃ (100℃ 기준)"]],
      "orderCode": "HMC 300 A 100V 1KW",
      "featured": false
    },
    {
      "id": "he", "category": "heater", "code": "HE", "name": "Epoxy Plate Heater", "nameKo": "에폭시 플레이트 히터",
      "summary": "에폭시 글라스판 절연 박형 히터(0.4mm 이내). 양면테이프로 히트싱크 면에 간편 부착.",
      "images": ["assets/img/he.webp", "assets/img/he-large.webp"],
      "features": ["Drawing type / Etched foil type", "Flexible epoxy glass insulation", "Very thin plate, fast warm-up", "PSA 옵션, 센서(PT100·NTC·TC) 내장 옵션"],
      "applications": "CCTV 카메라 가열, LCD 모니터 후면 가열 등",
      "certs": [],
      "specs": [["Operating temp", "-50 ~ 120℃"], ["Thickness", "0.4mm 이내"], ["Size", "600 × 500mm (그 외 협의)"], ["Material", "Epoxy Glass Plate"]],
      "orderCode": "HE 0308P 220V 30W",
      "featured": false
    },
    {
      "id": "hs", "category": "heater", "code": "HS", "name": "Silicone Rubber Heater", "nameKo": "실리콘 러버 히터",
      "summary": "실리콘 고무 시트 사이 니크롬 열선을 배선·압축한 1.5mm 박형 패드 히터. 최고 200℃.",
      "images": ["assets/img/hs.webp"],
      "features": ["가열면 전면 균일 발열", "전력밀도 0.2 ~ 0.8W/㎠", "위생·클린 환경 FA용 저온 히터", "금속판 누름 / 실리콘 접착 / 양면테이프 설치"],
      "applications": "동결방지 보온, 배관 히팅 등",
      "certs": [],
      "specs": [["Max temp", "200℃"], ["Thickness", "1.5mm"], ["Power density", "0.2 ~ 0.8 W/㎠"], ["Bending", "최소 R25"]],
      "orderCode": "",
      "featured": false
    },
    {
      "id": "cb", "category": "feedthrough", "code": "CB, CBC", "name": "Cable Bushing", "nameKo": "방폭 케이블 부싱",
      "summary": "내·외부 방폭 제품의 전원선·센서선 등을 연결하는 내화성(Ex d) 방폭 커넥터.",
      "images": ["assets/img/cb.webp"],
      "features": ["Flame-proof enclosure 구조", "M16 ~ M42 다양한 나사 규격", "Brass / SUS 바디"],
      "applications": "발전소, 터미널, 저장탱크, 전동기 등 방폭지역 정션박스",
      "certs": ["ATEX Baseefa 11ATEX 0117X/3", "IECEx BAS 11.0056X", "KGS12-GA2BO-0245X", "EN/IEC 60079-0, 60079-1"],
      "specs": [["Insulation", "Epoxy"], ["Body", "Brass or SUS"], ["Operating temp", "-55 ~ +110℃"], ["Thread", "M16 ~ M42"]],
      "orderCode": "IECEx CB 2406 Ex d",
      "featured": false
    },
    {
      "id": "gb", "category": "feedthrough", "code": "GB", "name": "Glass Bushing / Feedthrough", "nameKo": "글라스 피드스루 (ShieldLoc)",
      "summary": "특수 유리-금속 밀봉으로 고진공·기밀을 유지하는 전원·센서용 피드스루. 극저온 환경 사용 가능.",
      "images": ["assets/img/gb.webp"],
      "features": ["Glass-to-metal hermetic seal", "고진공도 확보, 가스 누출 방지", "극저온(LNG·LH₂) 환경 대응", "전원·RTD/TC 센서 타입 주문 제작"],
      "applications": "LNG선, LH₂선, LNG 터미널, 발전소, 반도체, 배터리 제조, 진공 시스템",
      "certs": ["IECEx KSCP 24.0035U, Ex eb IIC Gb"],
      "specs": [["Type", "Power / Sensor(RTD·TC)"], ["Seal", "Special glass + metal"]],
      "orderCode": "GB-040-012-PW020",
      "featured": true
    },
    {
      "id": "mb", "category": "feedthrough", "code": "MB", "name": "Ceramic Metalizing Bushing", "nameKo": "세라믹 메탈라이징 피드스루",
      "summary": "세라믹 메탈라이징으로 고온에서도 고진공·기밀을 안정적으로 유지하는 전원용 피드스루.",
      "images": ["assets/img/mb.webp"],
      "features": ["Ceramic metalizing seal", "고온 환경 고진공·기밀 유지", "Up to 20 kV, 400 A (전원 타입)"],
      "applications": "LNG선, LH₂선, LNG 터미널, 발전소, 반도체, 배터리 제조, 진공 시스템",
      "certs": [],
      "specs": [["Electrical rating", "Up to 20 kV, 400 A"], ["Type", "Power"]],
      "orderCode": "",
      "featured": false
    },
    {
      "id": "spt", "category": "pressure", "code": "SPT", "name": "Industrial Pressure Transmitter", "nameKo": "산업용 압력 트랜스미터",
      "summary": "마이크로퓨즈드 압력센서와 전용 증폭회로를 적용한 고가성비 압력 트랜스미터. 선형 보정·온도 보상.",
      "images": ["assets/img/spt.webp"],
      "features": ["Micro-fused technology, dry-type structure", "Water hammer 방지, 내균열", "Temperature compensation & linear correction", "자동 생산라인 전수 검사·에이징 스크리닝"],
      "applications": "에너지·수처리, 빌딩 자동화, 냉동 시스템, 정압 급수, 컴프레서",
      "certs": [],
      "specs": [["Power", "DC 12 ~ 28V"], ["Range", "0 ~ 50 / 250 / 500 / 1000 bar"], ["Output", "4 ~ 20mA, 0 ~ 10V 등"], ["Accuracy", "±1%F.S (Opt. ±0.25%F.S)"], ["Overpressure", "≤ 2×F.S"], ["Protection", "IP65 (Opt. IP68)"]],
      "orderCode": "SPT-XXX-X-X-X-X-X-X",
      "featured": false
    }
  ],
  "industries": [
    { "title": "발전 · 전력", "desc": "발전기·대형 모터 권선 온도 감시", "image": "assets/img/fx-stator.webp" },
    { "title": "조선 · LNG/LH₂", "desc": "극저온 피드스루, 선급(BV) 인증 센서", "image": "assets/img/gb.webp" },
    { "title": "석유화학 · 플랜트", "desc": "방폭 RTD/TC, 서모웰, 케이블 부싱", "image": "assets/img/str-all.webp" },
    { "title": "반도체 · 디스플레이", "desc": "메탈척 히터, 마이카·필름 히터", "image": "assets/img/metal-chuck.webp" },
    { "title": "방위산업", "desc": "조준경·LCD 성에 방지, 배터리 결빙 방지 히터", "image": "assets/img/def-tank.webp" }
  ],
  "defense": [
    { "title": "레이저 경보기 성에 제거", "image": "assets/img/def-heli.webp" },
    { "title": "조준경 및 카메라 LCD 성에 방지", "image": "assets/img/def-scope.webp" },
    { "title": "회로 발열용 히터", "image": "assets/img/def-tank.webp" },
    { "title": "FM 무전기 핸드셋 및 전면패널 성에 방지", "image": "assets/img/def-radio.webp" },
    { "title": "어뢰용 추진전지·배터리 결빙 방지", "image": "assets/img/def-torpedo.webp" }
  ],
  "certifications": [
    { "name": "ATEX", "desc": "유럽 방폭 인증 (Ex ia / Ex eb / Ex db)" },
    { "name": "IECEx", "desc": "국제 방폭 인증" },
    { "name": "KGS", "desc": "한국가스안전공사 방폭 인증" },
    { "name": "KTL", "desc": "국내 방폭 인증 (Ex e)" },
    { "name": "BV", "desc": "Bureau Veritas 선급 인증" },
    { "name": "UL", "desc": "RTD UL 인증 (FX type)" },
    { "name": "ISO 9001", "desc": "품질경영시스템" },
    { "name": "ISO 14001", "desc": "환경경영시스템" }
  ],
  "history": [
    { "year": "2024", "items": ["시즈타입 센서 방폭인증 획득 (Ex tb)"] },
    { "year": "2023", "items": ["시즈타입 센서 방폭인증 획득 (Ex db, Ex ia, Ex e)"] },
    { "year": "2021", "items": ["5대발전소 기자재 유자격 등록", "RTD(BTR51) BV 선급인증 획득"] },
    { "year": "2020", "items": ["수출유망중소기업 지정 – 중소벤처기업부", "RTD 국내방폭 인증 획득 (PT100, PT1000) KGS Ex ia (BTR51)", "WIKA 판매대리점 계약, Honeywell 판매대리점 계약"] },
    { "year": "2019", "items": ["GB Series 피드스루 국산화"] },
    { "year": "2018", "items": ["경기도 유망중소기업 선정"] },
    { "year": "2016", "items": ["GE(General Electric) Partner Company", "이노비즈 기술혁신형 중소기업 선정", "한국방위산업진흥회 회원등록"] },
    { "year": "2015", "items": ["㈜에스엠지 신사옥 준공 및 이전 완료", "대형 발전기용 Glass Bushing 개발 완료"] },
    { "year": "2014", "items": ["접착식 Mica Heater, Kapton, 실리콘 히터 특허출원", "드로잉 타입 Kapton Heater 중국 실용신안 취득", "㈜SMG 법인명 변경"] },
    { "year": "2013", "items": ["SUNGSIL, SMG 상표등록 출원, 실리콘 리본 히터 개발"] },
    { "year": "2012", "items": ["TX Type RTD 개발 판매, ISO 9001, ISO 14001 인증 획득"] },
    { "year": "2011", "items": ["RTD ATEX 방폭 인증 획득 (PT100, PT1000)"] },
    { "year": "2010", "items": ["Cable Bushing 개발 및 IECEx, ATEX 방폭 인증 획득"] },
    { "year": "2009", "items": ["가산디지털단지 연구소 및 영업소 설치", "RTD KTL 국내방폭 인증 획득 (PT100, PT1000)"] },
    { "year": "2008", "items": ["Epoxy, Kapton CE 인증 획득, Mica Heater 개발"] },
    { "year": "2007", "items": ["화성 공장 준공 및 이전"] },
    { "year": "2006", "items": ["RTD BV 선급인증 획득"] },
    { "year": "2005", "items": ["성실전자(주) 기술부설연구소 설립"] },
    { "year": "2004", "items": ["클린사업장 선정", "ILLICA Group 업무 제휴 (미국)", "BLUE PETER Series® 브랜드로 미주 공략"] },
    { "year": "2002", "items": ["수출 유망 중소기업 선정"] },
    { "year": "2001", "items": ["RTD UL 인증 취득 (FX type)"] },
    { "year": "1999", "items": ["성실전자 주식회사 법인 전환"] },
    { "year": "1995", "items": ["발전소 발전기용 RTD 출시"] },
    { "year": "1993", "items": ["대형 MOTOR용 RTD 출시"] },
    { "year": "1990", "items": ["성실전자 설립"] }
  ],
  "partners": ["GE", "WIKA", "Honeywell", "ILLICA Group", "BV", "KGS"],
  "news": [
    { "id": "n1", "date": "2026-11-02", "category": "공지", "title": "SMG 공식 홈페이지 리뉴얼 오픈", "body": "㈜에스엠지 홈페이지가 새롭게 리뉴얼되었습니다. 제품 카탈로그, 견적 문의, 자료실 기능을 이용해 보세요.", "pinned": true },
    { "id": "n2", "date": "2024-12-01", "category": "자료", "title": "2024 Products Catalogue 발간", "body": "온도센서·히터·메탈척·피드스루·압력센서 전 제품을 수록한 2024년판 종합 카탈로그를 자료실에서 다운로드하실 수 있습니다.", "pinned": false },
    { "id": "n3", "date": "2024-06-01", "category": "인증", "title": "시즈타입 센서 방폭인증(Ex tb) 획득", "body": "시즈타입 온도센서 제품군이 분진 방폭(Ex tb) 인증을 획득하였습니다.", "pinned": false }
  ],
  "downloads": [
    { "title": "SMG Products Catalogue (2024)", "desc": "전 제품 종합 카탈로그 · PDF 6.3MB", "file": "assets/SMG_Products_Catalogue.pdf", "type": "PDF" }
  ],
  "faq": [
    { "q": "주문 제작(커스터마이징)이 가능한가요?", "a": "네. 대부분의 센서·히터·피드스루는 현장 공정과 설치 환경에 맞춰 길이, 소자, 리드선, 형상, 인증 등급 등을 주문 제작합니다. 도면 또는 사양서를 첨부하여 문의해 주세요." },
    { "q": "견적은 얼마나 걸리나요?", "a": "표준 사양은 영업일 기준 1~2일, 주문 제작품은 사양 검토 후 2~5일 내 회신드립니다." },
    { "q": "방폭 인증 제품의 인증서를 받을 수 있나요?", "a": "ATEX, IECEx, KGS, KTL, BV 등 해당 제품의 인증서 사본을 납품 시 또는 요청 시 제공해 드립니다." },
    { "q": "Ordering Code는 어떻게 구성하나요?", "a": "각 제품 상세의 Sample Code와 카탈로그의 Ordering Code 표를 참고하시거나, 사용 조건을 알려주시면 엔지니어가 코드를 구성해 드립니다." },
    { "q": "해외 납품·수출이 가능한가요?", "a": "가능합니다. 수출유망중소기업으로서 미주·아시아 등 해외 고객사에 납품하고 있습니다. 영문 문의도 환영합니다." }
  ],
  "inquiryTypes": ["견적 요청", "기술 문의", "샘플 요청", "대리점·협력 문의", "기타"]
};
