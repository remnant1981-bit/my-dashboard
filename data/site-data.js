/* SMG 홈페이지 콘텐츠 데이터 (2026 Products Catalogue 기준)
 * - 관리자 페이지(admin.html)에서 편집 → [게시하기]로 이 파일을 교체하면 사이트 전체에 반영됨
 * - 직접 수정 시 JSON 문법(쉼표, 따옴표) 주의
 */
window.SMG_DEFAULT_DATA = {
  "version": 3,
  "updatedAt": "2026-11-03",
  "company": {
    "name": "주식회사 에스엠지",
    "nameEn": "SMG Co., Ltd.",
    "brand": "SMG",
    "brandSub": "SUNGSIL MFG",
    "slogan": "A Higher Degree of Confidence for SMG Products",
    "founded": 1990,
    "ceo": "방서연, 변예만",
    "bizNo": "139-81-39520",
    "address": "경기도 시흥시 시화벤처로 305 (시화 MTV 3사 204호)",
    "addressEn": "305, Sihwa venture-ro, Siheung-si, Gyeonggi-do, South Korea",
    "tel": "031-504-7766",
    "fax": "031-504-0200",
    "email": "sungsil@sungsil.com",
    "website": "www.sungsil.com",
    "hours": "월–목 08:30 – 17:30 · 금 08:30 – 16:30 (주말·공휴일 휴무)",
    "mapQuery": "경기도 시흥시 시화벤처로 305"
  },
  "settings": {
    "formEndpoint": "",
    "notifyEmail": "sungsil@sungsil.com",
    "catalogPdf": "assets/SMG_Products_Catalogue_2026.pdf",
    "gaId": "",
    "showPopup": false,
    "popupTitle": "",
    "popupBody": "",
    "chat": {
      "enabled": true,
      "kakaoChannel": "",
      "channelTalkKey": "",
      "hoursStart": "08:30",
      "hoursEnd": "17:30",
      "hoursEndFri": "16:30",
      "greeting": ""
    },
    "adminHash": "bc95e941d8ee82f89c78f8d1cc961ba5bc1f644b3d47293c21d27a506bc660c8"
  },
  "hero": {
    "eyebrow": "Since 1990 · Sensor · Heater · Feedthrough",
    "title": "발전기에서 LNG선까지,\n극한 환경을 측정하고 가열합니다",
    "subtitle": "온도센서 · 써모웰 · 히터 · 압력 트랜스미터 · 케이블 부싱 · 피드스루\n35년 제조 기술력과 글로벌 방폭 인증으로 설비의 안전을 지킵니다",
    "image": "assets/img/hero.webp",
    "ctaPrimary": "제품 보기",
    "ctaSecondary": "견적 문의",
    "images": [
      "assets/img/cover-ship.webp",
      "assets/img/cover-motor.webp",
      "assets/img/cover-plant.webp",
      "assets/img/back-wafer.webp"
    ]
  },
  "stats": [
    {
      "value": "1990",
      "label": "설립연도",
      "suffix": ""
    },
    {
      "value": "35",
      "label": "제조 업력",
      "suffix": "년+"
    },
    {
      "value": "19",
      "label": "제품 라인업",
      "suffix": "종"
    },
    {
      "value": "-253",
      "label": "극저온 피드스루 사용온도",
      "suffix": "℃"
    }
  ],
  "about": {
    "title": "A Higher Degree of Confidence for SMG Products",
    "body": [
      "㈜에스엠지는 1990년에 설립한 이래 온도센서, 히터, 피드스루 관련 제품을 30여 년 이상 생산해 오고 있습니다. 그리고 고객 여러분께 경쟁력 있는 가격의 제품을 공급할 수 있는 제품 생산력과 숙련된 기술경험을 축적해 오고 있습니다.",
      "저희 에스엠지는 고객 여러분께 보다 나은 기술적 솔루션을 제공하기 위한 끊임없는 노력과 헌신 그리고 기술개발을 사업의 주요 목표로 삼고 있습니다.",
      "모든 제품은 엄격한 품질관리 시스템 절차에 따라 설계, 생산, 관리되며 모든 품질 테스트 요건에 부합될 수 있도록 인증실사 제도를 통해 품질경영 시스템 확립에 필요한 프로그램 개발 및 유지에 힘쓰고 있습니다.",
      "온도센서, 히터, 피드스루 등 다양화된 제품 생산경험과 우수한 인적자원 그리고 최고의 임직원들로 구성된 저희 에스엠지는 고객만족을 위한 광범위한 기술 및 연구개발과 내부혁신에 최선을 다할 것입니다."
    ],
    "image": "assets/img/building.webp",
    "values": [
      {
        "title": "Custom Engineering",
        "desc": "현장 공정·설치 환경에 맞춘 주문형 설계·제작"
      },
      {
        "title": "Certified Safety",
        "desc": "ATEX · IECEx · KCs · KTL 방폭, BV 선급 인증"
      },
      {
        "title": "Cryogenic Technology",
        "desc": "LNG·LH₂ 극저온 피드스루 국산화 개발"
      },
      {
        "title": "Global Partners",
        "desc": "Honeywell 공식 대리점(APAC), WIKA, REXA"
      }
    ]
  },
  "categories": [
    {
      "id": "temperature",
      "name": "온도센서",
      "nameEn": "Temperature Sensor",
      "desc": "고정자 권선 RTD, 코일엔드·표면 온도센서, 산업용 RTD·열전대, 멀티 써모커플, 서모스탯",
      "image": "assets/img/str.webp",
      "color": "#d71f26"
    },
    {
      "id": "thermowell",
      "name": "써모웰",
      "nameEn": "Thermowell",
      "desc": "ASME PTC 19.3 TW-2016 기준 설계, 건드릴링 일체형 보호관",
      "image": "assets/img/stw.webp",
      "color": "#15a39a"
    },
    {
      "id": "heater",
      "name": "히터",
      "nameEn": "Heater",
      "desc": "마이카·캡톤·투명·에폭시·실리콘 히터, 메탈 척·메탈 플레이트 히터",
      "image": "assets/img/hk.webp",
      "color": "#1f4fa3"
    },
    {
      "id": "pressure",
      "name": "압력 트랜스미터",
      "nameEn": "Pressure Transmitter",
      "desc": "피에조 저항식 산업용 압력 트랜스미터 (차압·고정밀·디스플레이형)",
      "image": "assets/img/spt.webp",
      "color": "#b08a3c"
    },
    {
      "id": "cable-bushing",
      "name": "케이블 부싱",
      "nameEn": "Cable Bushing",
      "desc": "방폭 정션박스용 내압방폭(Ex d) 케이블 부싱, -55℃ 저온형",
      "image": "assets/img/cb.webp",
      "color": "#e8692a"
    },
    {
      "id": "feedthrough",
      "name": "피드스루",
      "nameEn": "Feedthrough",
      "desc": "ShieldLoc 유리·세라믹 금속 밀봉 피드스루, LNG·LH₂ 극저온 대응",
      "image": "assets/img/gb.webp",
      "color": "#7b3fa0"
    }
  ],
  "products": [
    {
      "id": "fx-tx",
      "category": "temperature",
      "code": "FX, TX",
      "name": "Stator Winding RTD",
      "nameKo": "고정자 권선 온도센서",
      "summary": "모터·발전기 고정자 슬롯 사이에 삽입해 권선 과열을 감시하는 박형 RTD. 센서 전 길이가 감온부라 평균 온도를 측정합니다.",
      "images": [
        "assets/img/fx.webp"
      ],
      "features": [
        "백금·구리·니켈 소자 적용, 두께가 얇고 무유도성",
        "진동에 강하고 고압에서 견디는 구조",
        "센서 길이 전체가 감온부 → 국부 측정 오차 방지 (ANSI C50-10-1990, Sec. 5.2)",
        "Gas/Air type, Slot type(대형 발전기) · Chip type, Drawing type(중대형 모터)",
        "FX(Single·Dual), TX(Single·Dual) 타입, 다양한 주문형 제작"
      ],
      "applications": "중형·대형 모터, 발전기, 기타 회전기기 등 온도 감시 및 과열 보호용",
      "installation": "중대형 모터와 발전기의 슬롯 사이에 설치합니다. 모터당 6~9개 센서 설치를 권장하며 상당 2~3개씩 배치하고, 최적의 성능을 위해 열이 가장 많이 발생하는 권선부에 위치시킵니다.",
      "certs": [
        "Ex eb IIC Gb · IECEx LCIE 15.0042U",
        "Ex eb IIC Gb · LCIE 13 ATEX 3081U",
        "Ex e II · 09-KA2BO-0011 U",
        "Ex ia IIC T6 to T3 Ga · IECEx LCIE 19.0032X",
        "Ex ia IIC T6 to T3 Ga · LCIE 11 ATEX 3098 X / 03",
        "Ex ia IIC T6 to T3 · 20-GA2BO-0375X",
        "Ex ia IIC T6 to T3 Ga · IECEx KSCP 25.0046X",
        "Ex ia IIC T6 to T3 Ga · KSCP 25ATEX0032X",
        "Marine · BV 18688/D0 BV"
      ],
      "specs": [
        [
          "감온소자",
          "Pt100, Pt1000, Ni100, Cu10 (주문형 가능)"
        ],
        [
          "정밀도",
          "Class A / B (IEC 60751 기준)"
        ],
        [
          "측정 범위",
          "-55℃ ~ +180℃"
        ],
        [
          "절연 내전압",
          "2kV 이상"
        ],
        [
          "외피 재질",
          "Glass fiber, Epoxy, PTFE 등"
        ],
        [
          "리드선",
          "실리콘, 테플론, 유리섬유 절연선 (길이 주문 제작 가능)"
        ],
        [
          "형상",
          "Flat Type / Semi-Rigid Type / Custom Slot Size"
        ]
      ],
      "orderCode": "",
      "featured": true,
      "catalogPage": 4,
      "tmin": -55,
      "tmax": 180
    },
    {
      "id": "btr51",
      "category": "temperature",
      "code": "BTR51",
      "name": "Coil End Temperature Detector",
      "nameKo": "코일엔드 온도센서",
      "summary": "박막·원통형 센서 소자를 내열성 수축튜브로 감싸고 실리콘을 충진한 구조. 응답속도가 빠르고 진동에 강합니다.",
      "images": [
        "assets/img/btr51.webp"
      ],
      "features": [
        "Small, rugged RTD's and Thermocouples",
        "Excellent vibration resistance",
        "Fast response",
        "RTD 및 Thermocouple 소자로 작고 견고한 형태, 신뢰성 높은 온도 검출"
      ],
      "applications": "모터 및 발전기 Coil end 온도 감지용. 특히 진동이 심하거나 제한된 공간 내 온도 검출이 필요한 산업용 설비에 적합",
      "installation": "중대형 모터 및 발전기의 권선 끝부분에 설치합니다. 열이 가장 많이 발생하는 권선부 근처에 위치시키며, 실리콘 충진으로 절연 성능이 우수하고 진동에도 견고하게 유지됩니다.",
      "certs": [
        "ATEX Ex ia IIC T6…T3 Ga · LCIE 12 ATEX 3065X/01",
        "KGS Ex ia IIC T6…T3 · 20-GA2BO-0354X",
        "Marine · BV 66331/A0 BV"
      ],
      "specs": [
        [
          "감온소자",
          "Pt100, Pt1000, Ni100, Cu10 (주문형 가능)"
        ],
        [
          "정밀도",
          "Class A / B (IEC 60751 기준)"
        ],
        [
          "측정 범위",
          "-55℃ ~ +180℃"
        ],
        [
          "외피 재질",
          "Heat Shrink Tube + Liquid Silicon"
        ],
        [
          "절연 저항",
          "2kV 이상"
        ],
        [
          "리드선",
          "실리콘, 테플론, 유리섬유 절연선 (길이 주문 제작 가능)"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 6,
      "tmin": -55,
      "tmax": 180
    },
    {
      "id": "std",
      "category": "temperature",
      "code": "STD",
      "name": "Surface Temperature Detector",
      "nameKo": "표면 온도센서",
      "summary": "배관·탱크·충전지·고압 트랜스 등의 표면 온도를 측정하고 내부 액체 및 코일의 과열·동결 손상을 방지하는 센서.",
      "images": [
        "assets/img/std.webp",
        "assets/img/std-chip.webp",
        "assets/img/std-types.webp"
      ],
      "features": [
        "내부에 백금 RTD 또는 써모커플 내장, 빠른 감지속도",
        "소형·내습 구조, 다양한 표면에 신속하게 부착",
        "길이 전체 평균 온도 측정 → 국부 측정 오차 제거",
        "곡면 부착 가능, 모터·발전기 권선 온도 측정에 최적화",
        "Chip type · Drawing type · 고온용(Mica / PI)"
      ],
      "applications": "모터 코일 엔드, 바이오 및 반도체 장비, 배터리, 압력용기, 항공우주, 방산, 의료장비 등 제한된 공간의 온도 측정. 과열 방지, 냉각 효율 제어, 장비 내 열 분포 모니터링",
      "installation": "다양한 설치 방식에 적합하도록 설계되었습니다. 설치 중 반복 굴곡을 피하고 설계 범위를 초과하여 휘지 않도록 합니다. 리드선은 센서 본체에 장력이 걸리지 않도록 고정하고, 열 손실을 줄이기 위해 감지 표면을 따라 짧게 배치합니다.",
      "certs": [],
      "specs": [
        [
          "감온소자",
          "Pt100 / Pt1000 / Thermocouple (K, J, T)"
        ],
        [
          "동작 온도",
          "-55℃ ~ +265℃ (최대 온도)"
        ],
        [
          "설치 환경",
          "다양한 표면에 설치 가능"
        ],
        [
          "재질",
          "SUS / 폴리이미드 / 에폭시 (모델별 상이)"
        ],
        [
          "절연 저항",
          "≥ 100 MΩ @ 500 VDC"
        ],
        [
          "리드선",
          "실리콘 / 테플론 / 유리섬유 절연, 길이 주문 제작"
        ],
        [
          "모델",
          "STD30(Chip) · STD50, 70(Chip) · STD60(Drawing)"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 8,
      "tmin": -55,
      "tmax": 265
    },
    {
      "id": "str",
      "category": "temperature",
      "code": "STR",
      "name": "Industrial Process RTD",
      "nameKo": "산업용 측온저항체(RTD)",
      "summary": "금속 도체의 전기저항 변화를 이용한 고정밀 측온저항체. 끝단 30mm 직선부를 제외하고 외경의 5배까지 굽힘이 가능합니다.",
      "images": [
        "assets/img/str.webp",
        "assets/img/str-conn.webp"
      ],
      "features": [
        "열전대 대비 정확한 온도 측정",
        "끝단 감지부 외 유연한 굽힘 → 배관 커브·협소 구간 설치 용이",
        "Explosion proof / Weather proof (IP68) 헤드",
        "Bolt · Movable · DIN Conn · Compact 타입",
        "통전 잠금(Energization Lockout) 센서 — 테플론 라이닝/피팅"
      ],
      "applications": "배관 및 공정 라인 내부 온도 측정, 발전소·화학 플랜트·반도체 장비 온도 모니터링, 압력 용기·열교환기·냉각 시스템 온도 제어, 제약·식품 설비 위생 등급 프로세스 라인",
      "installation": "끝단 감지부 30mm를 제외하고 유연하게 굽힐 수 있어 배관 커브나 협소한 구간에도 손쉽게 설치됩니다. 설치 시 감지부가 직접 유체 흐름과 접촉하도록 배치하고, 리드선은 장력 및 꼬임이 발생하지 않도록 고정합니다.",
      "certs": [
        "HEAD · IECEx / ATEX(CE) / KCs Ex db eb IIC T6",
        "HEAD · KCs Ex tb IIIC T100℃ Db IP66",
        "NONE HEAD · IECEx / ATEX(CE) / KCs Ex ia IIC T6…T4",
        "NONE HEAD · IECEx / ATEX(CE) / KCs Ex eb IIC T6"
      ],
      "specs": [
        [
          "감온소자",
          "Pt100 / Pt1000 (Class AA, A, B, DIN/IEC 60751)"
        ],
        [
          "온도범위",
          "-200℃ ~ +650℃"
        ],
        [
          "외피 재질",
          "SUS304 / SUS316 / Teflon Lining / Coating (옵션)"
        ],
        [
          "절연저항",
          "5MΩ 이상 @ 500VDC (Sensor O.D에 따라 다름)"
        ],
        [
          "굽힘 반경",
          "외경의 5배 이상"
        ],
        [
          "리드선",
          "테프론 절연, 실리콘 또는 유리섬유 피복, 기타(주문생산 가능)"
        ]
      ],
      "orderCode": "",
      "featured": true,
      "catalogPage": 10,
      "tmin": -200,
      "tmax": 650
    },
    {
      "id": "stc",
      "category": "temperature",
      "code": "STC",
      "name": "Industrial Process Thermocouples",
      "nameKo": "산업용 열전대(TC)",
      "summary": "귀금속·비금속 도선으로 -200℃ 저온부터 +2200℃ 초고온까지 측정하는 산업용 열전대. MgO 충진 시스 구조로 절연·내압성 우수.",
      "images": [
        "assets/img/stc.webp",
        "assets/img/stc-cables.webp"
      ],
      "features": [
        "온도 측정 범위 -200℃(저온) ~ +2200℃(초고온)",
        "산업용부터 폭발 위험 지역용 방폭형까지 다양한 제작",
        "고순도 산화마그네슘(MgO) 충진 시스 구조",
        "반도체(Metal Chuck)용 · 산업용(Quick Conn) · 반응기용(Up to Points)"
      ],
      "applications": "발전소·제철소·화학 플랜트 등 고온 산업 설비, 가스 터빈·보일러·소각로·반도체 공정, 폭발 위험 지역 및 특수 환경 온도 모니터링",
      "installation": "다양한 설치 방식으로 적용할 수 있으며, 보호관 손상 방지와 정확한 감지를 위해 적절한 위치 선정과 고정이 필요합니다. 고온·고압 환경에서는 반드시 전용 피팅과 고정 장치를 사용해야 합니다.",
      "certs": [
        "HEAD · IECEx / ATEX(CE) / KCs Ex db eb IIC T6",
        "HEAD · KCs Ex tb IIIC T100℃ Db IP66",
        "NONE HEAD · IECEx / ATEX(CE) / KCs Ex ia IIC T6…T4",
        "NONE HEAD · IECEx / ATEX(CE) / KCs Ex eb IIC T6"
      ],
      "specs": [
        [
          "열전대 종류",
          "K, E, T, N, R, S, B Type"
        ],
        [
          "온도 측정 범위",
          "-200℃ ~ +2200℃ (타입별 상이)"
        ],
        [
          "보호관 재질",
          "SUS304, SUS316, SUS321, SUS310, SUS347, INCONEL600, Ceramic 등"
        ],
        [
          "절연재",
          "MgO(산화마그네슘) 충진 구조 (Sheathed Type)"
        ],
        [
          "외경",
          "Ø0.5 ~ Ø12.7mm (기타 주문 제작 가능)"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 12,
      "tmin": -200,
      "tmax": 2200
    },
    {
      "id": "stm",
      "category": "temperature",
      "code": "STM",
      "name": "Industrial Process Multi Thermocouples",
      "nameKo": "멀티 써모커플",
      "summary": "여러 측정점을 하나로 결합해 2~29개 지점의 온도를 동시에 수집하는 멀티 써모커플. 플레이트·웨이퍼·시스 타입.",
      "images": [
        "assets/img/stm.webp"
      ],
      "features": [
        "2점 ~ 29점 다점 동시 측정 (고객 요구 맞춤)",
        "MgO 충진 시스 구조로 우수한 절연성·내압성",
        "AL / MICA / PI Plate Type · WAFER Type · SHEATH Type",
        "산업용부터 방폭형까지 제작"
      ],
      "applications": "발전소·제철소·화학 플랜트 등 고온 산업 설비, 가스 터빈·보일러·소각로, 반도체 공정 및 배터리 패키징, 폭발 위험 지역 및 특수 환경 온도 모니터링",
      "installation": "설치가 간편하며 감지 대상 부위에 밀착시켜 사용합니다. 열전달 효율을 높이기 위해 평면 접촉면을 확보하고, 진동이나 충격에 의한 접점 손상이 발생하지 않도록 주의합니다.",
      "certs": [],
      "specs": [
        [
          "정격 전류",
          "AC 250V / 5A, DC 24V / 2A"
        ],
        [
          "작동 온도 범위",
          "-40℃ ~ +200℃ (주문사양 가능)"
        ],
        [
          "센서 타입",
          "R, K, E, T Type"
        ],
        [
          "허용 오차",
          "Class 1 / 2 (DIN/IEC584-2, BS/EN60584-2, JIS C1602)"
        ],
        [
          "Body 재질",
          "SUS, AL, MICA, PI (주문 사양 가능)"
        ]
      ],
      "orderCode": "",
      "featured": true,
      "catalogPage": 14,
      "tmin": -40,
      "tmax": 200
    },
    {
      "id": "sts",
      "category": "temperature",
      "code": "STS",
      "name": "Industrial Process Thermostats",
      "nameKo": "바이메탈 서모스탯",
      "summary": "바이메탈 원리의 보호용 온도 스위치. 과열 시 전원을 차단하거나 냉각 팬을 작동시켜 장비를 보호합니다.",
      "images": [
        "assets/img/sts.webp",
        "assets/img/sts-cable.webp"
      ],
      "features": [
        "바이메탈(Bimetal) 기반의 안정된 작동 특성",
        "Normally Closed(기본) / Normally Open(선택)",
        "IP45 방수 (제조사 보증)",
        "THREAD · TUBE · THREAD_Connector 타입"
      ],
      "applications": "전동기·배터리 충전기·변압기 등 산업용 장비 온도 제어, 전원 공급 장치·히팅 패드·형광등·안정기 보호, OA기기·솔레노이드·LED 조명 등 전자기기",
      "installation": "설치가 간편하며 감지 대상 부위에 밀착시켜 사용합니다. 열전달 효율을 위해 평면 접촉면을 확보하고, 진동이나 충격에 의한 접점 손상이 발생하지 않도록 주의합니다.",
      "certs": [],
      "specs": [
        [
          "정격 전류",
          "AC 250V / 5A, DC 24V / 2A"
        ],
        [
          "작동 온도 범위",
          "40℃ ~ 150℃ (주문 사양 가능)"
        ],
        [
          "접점 형태",
          "Normally Closed (기본) / Normally Open (선택 가능)"
        ],
        [
          "허용 오차",
          "±5K"
        ],
        [
          "센서부 재질",
          "SUS, Cu (주문생산 가능)"
        ],
        [
          "방수 등급",
          "IP45 제조사 보증"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 16,
      "tmin": 40,
      "tmax": 150
    },
    {
      "id": "stw",
      "category": "thermowell",
      "code": "STW",
      "name": "Industrial Process Thermowells",
      "nameKo": "써모웰",
      "summary": "내열·내식 합금 봉재를 건드릴링 가공한 보호관. 카르만 와류·공진을 자동 계산해 설계하며 최대 2m까지 일체 가공합니다.",
      "images": [
        "assets/img/stw.webp"
      ],
      "features": [
        "2m 길이까지 가공 가능한 이중축 건드릴링(Gun Drilling) + 정밀 NC 선반",
        "카르만 와류(Kármán Vortex)·공진 기반 기계적 강도 자동 계산 설계",
        "Flanged(STW DF) · Socket Weld(STW DW) · Hex Thread(STW DH) · Pipe Hex Thread(STW PH)",
        "옵션: 헬륨 누설 시험, 침투 탐상(PT), Mill Certificate 교차 검증"
      ],
      "applications": "발전소·제철소·화학 플랜트·정유 공정 등 고온·고압 환경의 온도센서 보호. LNG·수소 탱크, 압력용기, 열교환기 및 배관 시스템",
      "installation": "프로세스 라인 또는 탱크 벽면에 플랜지형, 나사형, 용접형으로 설치됩니다. 진동 및 공진 주파수를 고려해 삽입 길이와 재질을 선택하고, 정확한 측정을 위해 센서가 써모웰 내부 끝단까지 밀착되도록 설치합니다.",
      "certs": [
        "설계/제작 기준 · ASME PTC 19.3 TW-2016"
      ],
      "specs": [
        [
          "원형 봉 (외경)",
          "25 ~ 55 mm (25, 26, 28, 30 … 50, 55)"
        ],
        [
          "육각 봉",
          "27, 32, 35, 38, 41 mm"
        ],
        [
          "스테인리스강",
          "304SS, 321SS, 316SS/LSS, 347SS, 310SS, 446SS, 253MA"
        ],
        [
          "인코넬 / 하스텔로이",
          "Inconel 600, 601, 625, 825 / Hast-C, Hast-X, Hast-C276"
        ],
        [
          "기타 재질",
          "Monel600, 황동, HCF, 50Co-30Cr, 청동, 티타늄, 탄탈럼, 몰리브데넘"
        ],
        [
          "시험·검사",
          "N₂ 압력 10 MPa · 수압 40 MPa · X-선(RT) (요청 시)"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 18
    },
    {
      "id": "hm",
      "category": "heater",
      "code": "HM, HMC",
      "name": "Mica Plate Heater",
      "nameKo": "마이카 플레이트 히터",
      "summary": "내열·절연성이 뛰어난 마이카 절연재로 만든 면상 발열체. 고온에서도 안정적이며 균일한 온도 분포(±1℃)를 제공합니다.",
      "images": [
        "assets/img/hm.webp",
        "assets/img/hm-layers.webp",
        "assets/img/hm-plate.webp"
      ],
      "features": [
        "얇은 두께와 우수한 전기적 특성",
        "다양한 형상·크기로 가공 가능",
        "순간 최대 500℃ (클램핑 기준)",
        "진공 압착 또는 클램핑 방식 부착"
      ],
      "applications": "반도체 생산관련 장비, 의료·미용·바이오·배터리, 방위산업(레이저·광학장비 등), LCD 패널 열처리 장비",
      "installation": "히터는 피가열체 표면에 진공 압착 또는 클램핑 방식으로 부착합니다. 균일한 온도 분포와 안정적인 열전달을 위해 정밀한 체결과 접촉 면적 확보가 필요하며, 전기 단자 및 리드와이어는 설치 환경에 따라 수평 또는 수직으로 인출할 수 있습니다.",
      "certs": [],
      "specs": [
        [
          "운용 온도",
          "-60 ~ 400℃"
        ],
        [
          "두께",
          "0.8mm ~ 2mm"
        ],
        [
          "제작 크기",
          "600mm × 500mm (그 외 크기 협의 가능)"
        ],
        [
          "순간 최대 온도",
          "500℃ (클램핑 기준 히터 표면 온도)"
        ],
        [
          "전력 밀도",
          "25℃ 개방 공기 조건 3W/㎠ (그 외 사양 협의)"
        ],
        [
          "온도 균일도",
          "±1℃ (100℃ 기준, 표면 재질에 따라 달라짐)"
        ],
        [
          "발열체 재질",
          "Austenitic Stainless 박판(에칭 패턴) 또는 인코넬"
        ],
        [
          "내전압 / 절연저항",
          "AC 1000V (60초) / 200MΩ (500V)"
        ],
        [
          "저항 허용오차",
          "상온 기준 ±10%"
        ],
        [
          "단자 처리 / 옵션",
          "브레이징, 리드와이어 수평·수직 인출 / 커넥터 연결"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 20,
      "tmin": -60,
      "tmax": 400
    },
    {
      "id": "hk",
      "category": "heater",
      "code": "HK",
      "name": "Kapton Film Heater",
      "nameKo": "캡톤 필름 히터",
      "summary": "폴리이미드(Kapton) 필름 사이에 저항선·에칭 포일을 삽입한 0.254mm 이하 초박형 필름 히터. 곡면 부착과 맞춤 형상 제작.",
      "images": [
        "assets/img/hk.webp",
        "assets/img/hk-types.webp"
      ],
      "features": [
        "얇고 유연한 구조, 우수한 내열성·전기 절연",
        "다양한 크기와 형태로 맞춤 제작",
        "PSA(양면 테이프) 옵션으로 간편 부착",
        "고온 및 케미컬 환경에서도 안정적 성능"
      ],
      "applications": "반도체 장비 및 진공 챔버 내 온도 제어, 의료·실험 장비 온도 유지, 항공·방산 전자부품 예열, 배터리·광학·정밀기기 저온 히터, 소형 센서 및 계측기 보온",
      "installation": "평면 또는 곡면에 직접 부착하며 PSA(양면 접착 테이프)로 간편하게 설치합니다. 설치 표면을 깨끗하게 유지하고 공기층이 생기지 않도록 주의하며, 센서·컨트롤러와 함께 사용하면 보다 정밀한 발열 제어가 가능합니다.",
      "certs": [],
      "specs": [
        [
          "사용 온도 범위",
          "-50℃ ~ +160℃ (PSA 제외 시)"
        ],
        [
          "두께",
          "0.254mm 이하"
        ],
        [
          "순간 최대 온도",
          "200℃ (상세 사양 협의 가능)"
        ],
        [
          "사용 전압",
          "DC/AC (상세 사양 협의)"
        ],
        [
          "재질",
          "Polyimide Film (선택: PET, FEP, PTFE 등)"
        ],
        [
          "생산 크기",
          "600mm × 500mm (그 외 협의 가능)"
        ],
        [
          "절연 내전압",
          "AC 500V~1000V / 절연저항 1000Ω (500Vdc)"
        ],
        [
          "전력밀도",
          "1W/cm² @25℃ (방열판 부착 시 1~1.5T 조건)"
        ]
      ],
      "orderCode": "",
      "featured": true,
      "catalogPage": 22,
      "tmin": -50,
      "tmax": 160
    },
    {
      "id": "hc",
      "category": "heater",
      "code": "HC",
      "name": "Clear View Heater",
      "nameKo": "투명 히터",
      "summary": "초박형 금속 열선을 광학 등급 폴리에스터 필름 사이에 패턴화한 투명 히터. 빛을 차단하지 않으며 가시광선 투과율 82% 이상.",
      "images": [
        "assets/img/hc.webp",
        "assets/img/hc-types.webp"
      ],
      "features": [
        "빛 차단 없는 안정적 발열",
        "김서림 방지 및 투명 패널 가열",
        "원형·사각·링형 등 맞춤 형상",
        "PSA(압력 민감 접착제) 옵션"
      ],
      "applications": "김서림 제거용 히터(자동차 백미러, 카메라 렌즈 등), 의료기기 및 의료용 히터, 군용 노트북 및 내비게이션, LED·LCD·PDA 등 전자기기 패널, 투명 패널 및 디스플레이 열 제어",
      "installation": "광학 필름 구조로 되어 있어 다양한 투명 기판이나 패널 표면에 직접 부착할 수 있습니다. PSA를 통해 간편하게 부착·설치하며, 전원 및 제어 장치와 연결하여 사용합니다.",
      "certs": [],
      "specs": [
        [
          "히터 재질",
          "폴리에스터 + 금속"
        ],
        [
          "사용 온도 범위",
          "-55℃ ~ +80℃"
        ],
        [
          "투명도",
          "최소 82% 가시광선 투과율"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 24,
      "tmin": -55,
      "tmax": 80
    },
    {
      "id": "he",
      "category": "heater",
      "code": "HE",
      "name": "Epoxy Plate Heater",
      "nameKo": "에폭시 플레이트 히터",
      "summary": "에폭시 글라스 절연 구조의 0.4mm 이하 초박형 히터. 에칭 포일·와이어 발열체로 균일한 열 분포, PSA로 손쉬운 장착.",
      "images": [
        "assets/img/he.webp",
        "assets/img/he-large.webp",
        "assets/img/he-pattern.webp"
      ],
      "features": [
        "에칭 포일 또는 와이어 타입 내부 발열체",
        "내열성·기계적 안정성 우수",
        "빠른 발열 응답, 높은 신뢰성",
        "옵션: PSA 부착형, 커넥터형, 센서 내장형(PT100·NTC·TC·Thermo Start)"
      ],
      "applications": "CCTV 카메라용, LCD 모니터 후면, 방위산업용, 기타 다양한 산업용 히팅 장비",
      "installation": "접착식 구조로 간편하게 부착할 수 있습니다. 대형 HE Type 히터도 제작 가능합니다.",
      "certs": [],
      "specs": [
        [
          "사용 온도 범위",
          "-50 ~ 120℃"
        ],
        [
          "두께",
          "0.4mm 이하 (PSA 제외)"
        ],
        [
          "표준 제작 크기",
          "600mm × 500mm (그 외 협의 제작)"
        ],
        [
          "재질",
          "에폭시 글라스판 (Epoxy Glass Plate)"
        ],
        [
          "사용 전압",
          "DC / AC (상세 협의 가능)"
        ],
        [
          "최대 사용 온도",
          "120℃ (그 이상은 별도 협의)"
        ],
        [
          "최대 전력 밀도",
          "25℃ 공기 중 0.65 W/cm² (4 W/in²)"
        ],
        [
          "절연 내전압 / 저항",
          "AC 500V ~ 1000V (60초) / 1000Ω (500 VDC)"
        ],
        [
          "저항 허용오차",
          "상온 기준 ±10%"
        ],
        [
          "단자 처리",
          "고온 납땜 (리드선 인출 방향 협의 가능)"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 26,
      "tmin": -50,
      "tmax": 120
    },
    {
      "id": "hs",
      "category": "heater",
      "code": "HS",
      "name": "Silicone Rubber Heater",
      "nameKo": "실리콘 러버 히터",
      "summary": "실리콘 고무 시트 2장 사이에 니크롬 발열선을 내장해 압축 성형한 약 1.5mm 패드형 히터. 최대 200℃, 0.2~0.8 W/cm².",
      "images": [
        "assets/img/hs.webp"
      ],
      "features": [
        "균일한 면 발열",
        "내열·내습성 우수, 위생적이고 청정한 FA 환경용",
        "크기·전압·전력 맞춤 제작",
        "금속판 누름식 / 실리콘 접착식 / 양면테이프 부착식"
      ],
      "applications": "동결방지용 보온 시스템, 배관·밸브 및 용기 히팅, 실험실·반도체 장비·의료기기 등 균일한 열원이 필요한 장비",
      "installation": "금속판 누름식(허용 내면 압력 15 kg/cm²), 실리콘 접착식(내열 실리콘제 도포, 최고 180℃), 양면테이프 부착식(3M PSA, 최고 150℃)으로 설치합니다.",
      "notice": "전력밀도 0.5W/㎠ 이상인 히터는 대기 중에 가열하지 마십시오(이상 발열로 인한 단선 및 발화 가능성). 벤딩반경은 최소 R25 이상이며 휘거나 접어서 사용할 수 없습니다. 리드선 부분은 물·오일 등 액체 및 습기에 닿지 않도록 하고, 수중·증기·부식성 가스 환경에서는 사용할 수 없습니다.",
      "certs": [],
      "specs": [
        [
          "사용 온도",
          "-50 ~ 200℃"
        ],
        [
          "두께",
          "약 1.5mm"
        ],
        [
          "재질",
          "실리콘 러버 시트 / 니크롬 발열선 내장"
        ],
        [
          "전력 밀도",
          "0.2 ~ 0.8 W/cm²"
        ],
        [
          "형태",
          "맞춤 제작 가능 (크기, 전압, 전력 등)"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 28,
      "tmin": -50,
      "tmax": 200
    },
    {
      "id": "metal-chuck-heater",
      "category": "heater",
      "code": "MCH",
      "name": "Metal Chuck Heater",
      "nameKo": "메탈 척 히터",
      "summary": "반도체·디스플레이·진공 장비에서 웨이퍼나 기판을 고정하는 핵심 부품. 표면 평탄도 ≤5㎛, 균일도 ±3℃ 이내 조정.",
      "images": [
        "assets/img/mch.webp",
        "assets/img/mch-3d.webp",
        "assets/img/mch-thermal.webp",
        "assets/img/mch-test.webp",
        "assets/img/mch-chart.webp"
      ],
      "features": [
        "내장형 히팅 엘리먼트로 빠른 열 응답·균일한 온도 분포",
        "고온에서도 안정적인 구조 강도와 절연 특성",
        "SUS, Inconel, Cu, Ti 등 고내열 금속 적용",
        "전도형(Conductive) · 절연형(Insulated) · 냉각형 · 히팅형",
        "고진공 환경에서도 안정적인 접촉 및 열전달"
      ],
      "applications": "반도체·디스플레이·진공 장비의 웨이퍼·기판 고정 및 가열",
      "installation": "장비의 챔버 내부에 기계적 고정 또는 볼트 체결 방식으로 설치됩니다. 냉각 라인, 센서, 전극 등의 연결 시 밀폐성과 절연 성능이 유지되도록 주의해야 합니다.",
      "certs": [],
      "specs": [
        [
          "재질",
          "SUS304, Inconel, Aluminum, OFC(무산소동) 등"
        ],
        [
          "표면 평탄도",
          "≤ 5 ㎛ (Ø300 기준)"
        ],
        [
          "사용 온도 범위",
          "-60℃ ~ +400℃ (냉각/히팅형 사양별 상이)"
        ],
        [
          "구조 형식",
          "전도형 / 절연형 / 냉각형 / 히팅형"
        ],
        [
          "전원 입력",
          "사용자 지정 사양 (히팅존별 제어 가능)"
        ],
        [
          "커넥터 인터페이스",
          "전원, 센서 통합 가능"
        ],
        [
          "온도 균일도",
          "±3℃ 이내 조정 가능 (챔버 환경 기준)"
        ]
      ],
      "orderCode": "",
      "featured": true,
      "catalogPage": 30,
      "tmin": -60,
      "tmax": 400
    },
    {
      "id": "metal-plate-heater",
      "category": "heater",
      "code": "MPH",
      "name": "Metal Plate Heater",
      "nameKo": "메탈 플레이트 히터",
      "summary": "고정밀 가공 금속 베이스에 히팅 엘리먼트와 열센서를 내장해 웨이퍼·기판을 균일하게 가열하는 대면적 히터.",
      "images": [
        "assets/img/mph.webp",
        "assets/img/mph-layers.webp",
        "assets/img/mph-uniform.webp",
        "assets/img/mph-test.webp",
        "assets/img/mph-dist.webp"
      ],
      "features": [
        "균일한 온도 분포와 빠른 응답 특성",
        "고진공·고온 환경에서 높은 평탄도·내열성",
        "전도형(Conductive) 및 절연형(Insulated) 구조",
        "냉각라인·온도센서·전극 통합 설계, 장비 맞춤 사양",
        "8층 적층 구조: 메탈 베이스 · 그라파이트 · 마이카 · 1T 마이카히터 · 내열 실리콘"
      ],
      "applications": "반도체 웨이퍼 가열 장비, 디스플레이 제조 장비, 진공 챔버 및 플라즈마 시스템, 레이저·정밀 가공 장비, 기타 균일한 열 분포가 요구되는 산업용 장비",
      "installation": "장비 챔버 내부에 기계적 체결 또는 볼트 고정 방식으로 설치됩니다. 전원 라인, 센서 라인, 냉각 라인 연결 시 밀폐성과 절연 성능이 유지되도록 주의해야 합니다.",
      "certs": [],
      "specs": [
        [
          "재질",
          "SUS304, Inconel, Aluminum, OFC(무산소동) 등"
        ],
        [
          "표면 평탄도",
          "≤ 5 ㎛ (Ø300 기준)"
        ],
        [
          "사용 온도 범위",
          "-60℃ ~ +400℃ (냉각/히팅형 사양별 상이)"
        ],
        [
          "구조 형식",
          "전도형 / 절연형 / 냉각형 / 히팅형"
        ],
        [
          "전원 입력",
          "사용자 지정 사양 (히팅존별 제어 가능)"
        ],
        [
          "커넥터 인터페이스",
          "전원, 센서 통합 가능"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 32,
      "tmin": -60,
      "tmax": 400
    },
    {
      "id": "spt",
      "category": "pressure",
      "code": "SPT",
      "name": "Industrial Pressure Transmitter",
      "nameKo": "산업용 압력 트랜스미터",
      "summary": "고안정성 피에조 저항 센서와 특수 회로, 고강도 스테인리스 하우징을 통합한 압력 트랜스미터. 본질안전·방폭 사양 제공.",
      "images": [
        "assets/img/spt.webp",
        "assets/img/spt-types.webp"
      ],
      "features": [
        "고안정성 피에조 저항(piezoresistive) 센서, 표준화된 출력",
        "다양한 나사산 포트와 전기 연결 옵션",
        "가혹한 환경에서도 안정적인 내구성",
        "Differential · High Precision · Display · Basic · Compact 타입",
        "Angular Connector A / M12×1(4-pin) Plug / Cable Type"
      ],
      "applications": "산업 자동화 설비 및 공정제어, 반도체 자동화 설비, 냉동 및 압축기 제어 시스템, 자동차 및 모빌리티",
      "installation": "표준 규격 나사산 구조로 다양한 배관 환경에 빠르고 간편하게 설치됩니다. 진동과 충격이 적은 유체 흐름의 수직 방향에 장착하는 것을 권장하며, 전용 개스킷이나 테이프를 사용해 토크 규격에 맞게 체결하면 누수 없이 오래 안정적으로 사용할 수 있습니다.",
      "certs": [],
      "specs": [
        [
          "Process Connection",
          "G1/4 B, G3/8 B, G1/2 B, M20×1.5 (EN 837)"
        ],
        [
          "NPT",
          "NPT1/8, NPT1/4, NPT1/2 (ANSI/ASME B1.20.1)"
        ],
        [
          "기타 규격",
          "7/16-20 UNF-74°Taper (SAE J514 E), G1/4 (ISO 1179-1), G1/8 B"
        ],
        [
          "무게",
          "Angular ≤135g · M12 Plug ≤95g · Cable ≤160g"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 34
    },
    {
      "id": "cb",
      "category": "cable-bushing",
      "code": "CB, CBC",
      "name": "Cable Bushing",
      "nameKo": "방폭 케이블 부싱",
      "summary": "방폭 장비 내외부의 전원선·센서선·신호 케이블을 안전하게 연결하는 내압방폭(Flame-proof) 커넥터. CBC는 -55℃ 저온 특화.",
      "images": [
        "assets/img/cb.webp",
        "assets/img/cb-multi.webp"
      ],
      "features": [
        "고내열성 절연 구조와 정밀 밀폐 설계",
        "CBC 모델: -55℃까지 견디는 저온 환경 특화 사양",
        "다양한 케이블 직경·재질 맞춤 제작",
        "나사 체결(Screw-mounted) 방식"
      ],
      "applications": "방폭 지역 내 정션박스(Junction Box) 내부 배선, 전동기 및 산업 장비의 전원 공급선·센서선 연결, 발전소·터미널·저장탱크 및 기타 위험 환경 인터페이스",
      "installation": "나사 체결(Screw-mounted) 방식으로 설치하며, 설치 공간 및 케이블 직경에 따라 맞춤 적용이 가능합니다.",
      "certs": [
        "ATEX Baseefa 11ATEX 0117X/3",
        "IECEx BAS 11.0056X",
        "KGS12-GA2B0-0245X",
        "KSCP 25ATEX0005X",
        "IECEx KSCP 25.0006X",
        "EN/IEC 60079-0 · 60079-1 (Ex d)"
      ],
      "specs": [
        [
          "재질",
          "황동(Brass) 또는 스테인리스 스틸(SUS) (요청 사양 선택)"
        ],
        [
          "사용 온도 범위",
          "CB: -25℃ ~ +110℃ / CBC: -55℃ ~ +110℃"
        ],
        [
          "적용 규격",
          "EN/IEC 60079-0, EN/IEC 60079-1"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 36,
      "tmin": -55,
      "tmax": 110
    },
    {
      "id": "gb",
      "category": "feedthrough",
      "code": "GB",
      "name": "Glass Bushing / Feedthrough",
      "nameKo": "글라스 피드스루 (ShieldLoc)",
      "summary": "유리-금속 밀봉(Glass to Metal Seal)으로 고진공·고기밀을 유지하는 전원·센서용 피드스루. -253℃ 액화수소 환경까지 대응.",
      "images": [
        "assets/img/gb.webp",
        "assets/img/gb-flange.webp"
      ],
      "features": [
        "특수 유리-금속 밀봉 구조, 고진공·고기밀",
        "극저온(LNG, LH₂) 환경 대응",
        "전류용량·핀 배열·절연재·금속 재질 맞춤 설계",
        "나사 체결 / 용접(Weld-in) / 플랜지(Flange) 타입"
      ],
      "applications": "LNG / 액화수소(LH₂) 탱크 및 터미널, 발전소·진공 시스템·진공 펌프, 반도체 및 배터리 제조 설비, 가스 및 극저온 장비용 센서 피드스루, 전원 및 신호 전달용 밀폐 연결부",
      "installation": "나사 체결(Threaded), 용접(Weld-in), 플랜지(Flange) 타입으로 설치하며, 장비 구조 및 기밀 요구 조건에 따른 맞춤 설치를 지원합니다. 사양은 사용 환경 및 고객 요구에 따라 다르게 적용될 수 있습니다.",
      "certs": [
        "IECEx KSCP 24.0035U · Ex eb IIC Gb (Increased Safety)"
      ],
      "specs": [
        [
          "밀봉 구조",
          "유리-금속 밀봉"
        ],
        [
          "사용 온도",
          "-253℃ ~ +100℃"
        ],
        [
          "내압 강도",
          "≤ 100 bar"
        ],
        [
          "진공 누설률",
          "Up to 1.0 × 10⁻¹⁰ atm·cc/sec"
        ],
        [
          "전기 정격",
          "≤ 20 kV, 400 A (전원용) / ≤ 3.0 kV (센서용)"
        ],
        [
          "절연 저항",
          "≥ 1000 MΩ (at 1,000 VDC)"
        ],
        [
          "재질",
          "Stainless Steel, Inconel, Nickel Alloy 등"
        ],
        [
          "핀 수",
          "1핀 ~ 다핀 (Custom 가능)"
        ]
      ],
      "orderCode": "",
      "featured": true,
      "catalogPage": 38,
      "tmin": -253,
      "tmax": 100
    },
    {
      "id": "mb",
      "category": "feedthrough",
      "code": "MB",
      "name": "Ceramic Metalizing Bushing",
      "nameKo": "세라믹 메탈라이징 피드스루 (ShieldLoc)",
      "summary": "세라믹 메탈라이징으로 -196℃ ~ +450℃에서 진공도와 기밀성을 안정적으로 유지하는 전원용 피드스루.",
      "images": [
        "assets/img/mb.webp"
      ],
      "features": [
        "세라믹-금속 밀봉(Ceramic-to-Metal Seal)",
        "고온에서도 높은 진공도와 기밀성 유지",
        "≤ 20kV, 400A 전원 공급",
        "용접 / 플랜지 / 나사 체결 방식 맞춤 제작"
      ],
      "applications": "LNG선·LH₂(액화수소)선·LNG 터미널 등 가스 운송 및 저장 설비, 발전소·반도체·배터리 제조 설비, 진공 시스템 및 초고온 환경 장비의 전원 공급",
      "installation": "용접(Weld-in), 플랜지(Flange), 또는 나사 체결(Threaded) 방식으로 설치되며, 장비 챔버 또는 하우징의 구조와 기밀 요구 조건에 따라 맞춤형 설치 구조를 제공합니다.",
      "certs": [],
      "specs": [
        [
          "밀봉 구조",
          "세라믹-금속 밀봉"
        ],
        [
          "사용 온도",
          "-196℃ ~ +450℃"
        ],
        [
          "내압 강도",
          "≤ 40 bar"
        ],
        [
          "진공 누설률",
          "Up to 1.0 × 10⁻¹⁰ atm·cc/sec"
        ],
        [
          "전기 정격",
          "≤ 20kV, 400A (전원용)"
        ],
        [
          "절연 저항",
          "≥ 1000 MΩ (at 1,000 VDC)"
        ],
        [
          "재질",
          "Stainless Steel, Inconel, Nickel Alloy 등"
        ],
        [
          "핀 수",
          "1핀 ~ 다핀 (Custom 가능)"
        ]
      ],
      "orderCode": "",
      "featured": false,
      "catalogPage": 40,
      "tmin": -196,
      "tmax": 450
    }
  ],
  "industries": [
    {
      "title": "발전 · 전력",
      "desc": "발전기·대형 모터 권선 및 코일엔드 온도 감시",
      "image": "assets/img/cover-motor.webp",
      "products": [
        "fx-tx",
        "btr51",
        "std",
        "str"
      ]
    },
    {
      "title": "조선 · LNG/LH₂",
      "desc": "-253℃ 극저온 피드스루, 저온형 케이블 부싱",
      "image": "assets/img/cover-ship.webp",
      "products": [
        "gb",
        "mb",
        "cb",
        "stw"
      ]
    },
    {
      "title": "석유화학 · 플랜트",
      "desc": "방폭 RTD/TC, 써모웰, 압력 트랜스미터",
      "image": "assets/img/back-plant.webp",
      "products": [
        "str",
        "stc",
        "stw",
        "spt",
        "cb"
      ]
    },
    {
      "title": "반도체 · 디스플레이",
      "desc": "메탈 척·플레이트 히터, 멀티 써모커플",
      "image": "assets/img/back-wafer.webp",
      "products": [
        "metal-chuck-heater",
        "metal-plate-heater",
        "stm",
        "hm",
        "hk"
      ]
    },
    {
      "title": "방위산업",
      "desc": "광학·레이저 장비용 히터, 군용 장비 투명 히터",
      "image": "assets/img/back-tank.webp",
      "products": [
        "hk",
        "hc",
        "he",
        "hm"
      ]
    },
    {
      "title": "항공우주",
      "desc": "전자부품 예열용 필름 히터, 표면 온도센서",
      "image": "assets/img/back-satellite.webp",
      "products": [
        "hk",
        "std",
        "he"
      ]
    }
  ],
  "defense": [],
  "certifications": [
    {
      "name": "ATEX",
      "desc": "유럽 방폭 인증 (Ex ia / Ex eb / Ex db / Ex d)"
    },
    {
      "name": "IECEx",
      "desc": "국제 방폭 인증 (LCIE · BAS · KSCP)"
    },
    {
      "name": "KCs · KGS",
      "desc": "국내 방폭 인증 (Ex ia / Ex e / Ex tb)"
    },
    {
      "name": "KTL",
      "desc": "국내 방폭 인증 (Ex e)"
    },
    {
      "name": "BV",
      "desc": "Bureau Veritas 선급 인증 (FX/TX, BTR51)"
    },
    {
      "name": "ASME PTC 19.3",
      "desc": "써모웰 설계·제작 기준 (TW-2016)"
    },
    {
      "name": "UL",
      "desc": "RTD UL 인증 (FX type)"
    },
    {
      "name": "ISO 9001 · 14001",
      "desc": "품질·환경 경영시스템"
    }
  ],
  "history": [
    {
      "year": "2024",
      "items": [
        "시즈타입 센서 방폭인증 획득 (Ex tb)",
        "극저온용(LNG, LN₂) 피드스루 방폭인증 획득 (IECEx Ex e)"
      ]
    },
    {
      "year": "2023",
      "items": [
        "시즈타입 센서 방폭인증 획득 (Ex db, Ex ia, Ex e)",
        "LNG선 펌프 전원용 극저온 피드스루 국산화 개발 완료"
      ]
    },
    {
      "year": "2021",
      "items": [
        "5대발전소 기자재 유자격 등록",
        "RTD (BTR51) BV 선급인증 획득"
      ]
    },
    {
      "year": "2020",
      "items": [
        "수출유망중소기업 지정 – 중소벤처기업부",
        "RTD 국내방폭 인증 획득 (PT100, PT1000) KGS Ex ia (BTR51)",
        "WIKA 판매대리점 계약, Honeywell 판매대리점 계약"
      ]
    },
    {
      "year": "2019",
      "items": [
        "GB Series 피드스루 국산화"
      ]
    },
    {
      "year": "2018",
      "items": [
        "경기도 유망중소기업 선정"
      ]
    },
    {
      "year": "2016",
      "items": [
        "GE(General Electric) Partner Company",
        "이노비즈 기술혁신형 중소기업 선정",
        "한국방위산업진흥회 회원등록"
      ]
    },
    {
      "year": "2015",
      "items": [
        "㈜에스엠지 신사옥 준공 및 이전 완료",
        "대형 발전기용 Glass Bushing 개발 완료"
      ]
    },
    {
      "year": "2014",
      "items": [
        "접착식 Mica Heater, Kapton, 실리콘 히터 특허출원 진행",
        "드로잉 타입 Kapton Heater 중국 실용신안 취득",
        "㈜SMG 법인명 변경"
      ]
    },
    {
      "year": "2013",
      "items": [
        "SUNGSIL, SMG 상표등록 출원, 실리콘 리본 히터 개발"
      ]
    },
    {
      "year": "2012",
      "items": [
        "TX Type RTD 개발 판매, ISO 9001, ISO 14001 인증 획득"
      ]
    },
    {
      "year": "2011",
      "items": [
        "RTD ATEX 방폭 인증 획득 (PT100, PT1000)"
      ]
    },
    {
      "year": "2010",
      "items": [
        "Cable Bushing 개발 및 IECEx, ATEX 방폭 인증 획득"
      ]
    },
    {
      "year": "2009",
      "items": [
        "가산디지털단지 연구소 및 영업소 설치",
        "RTD KTL 국내방폭 인증 획득 (PT100, PT1000)"
      ]
    },
    {
      "year": "2008",
      "items": [
        "Epoxy, Kapton CE 인증 획득, Mica Heater 개발"
      ]
    },
    {
      "year": "2007",
      "items": [
        "화성 공장 준공 및 이전"
      ]
    },
    {
      "year": "2006",
      "items": [
        "RTD BV 선급인증 획득"
      ]
    },
    {
      "year": "2005",
      "items": [
        "성실전자(주) 기술부설연구소 설립"
      ]
    },
    {
      "year": "2004",
      "items": [
        "클린사업장 선정",
        "ILLICA Group 업무 제휴 (미국)",
        "BLUE PETER Series® 브랜드로 미주 공략"
      ]
    },
    {
      "year": "2002",
      "items": [
        "수출 유망 중소기업 선정"
      ]
    },
    {
      "year": "2001",
      "items": [
        "RTD UL 인증 취득 (FX type)"
      ]
    },
    {
      "year": "1999",
      "items": [
        "성실전자 주식회사 법인 전환"
      ]
    },
    {
      "year": "1995",
      "items": [
        "발전소 발전기용 RTD 출시"
      ]
    },
    {
      "year": "1993",
      "items": [
        "대형 MOTOR용 RTD 출시"
      ]
    },
    {
      "year": "1990",
      "items": [
        "성실전자 설립"
      ]
    }
  ],
  "partners": [
    "Honeywell",
    "WIKA",
    "REXA",
    "GE",
    "ILLICA Group",
    "Bureau Veritas"
  ],
  "partnerCards": [
    {
      "title": "Honeywell Authorized Distributor",
      "desc": "Honeywell Process Solutions(HPS) Channel Partner — Asia Pacific(APAC) 공식 인증 대리점",
      "image": "assets/img/honeywell.webp"
    },
    {
      "title": "REXA Partner",
      "desc": "미국 REXA 파트너사 — 4 Manley Street, West Bridgewater, MA 02379, US (www.rexa.com)",
      "image": "assets/img/rexa.webp"
    }
  ],
  "news": [
    {
      "id": "n4",
      "date": "2026-11-03",
      "category": "자료",
      "title": "2026 Products Catalogue 발간",
      "body": "STM 멀티 써모커플, 메탈 플레이트 히터 등 신규 제품과 최신 사양·인증 정보를 반영한 2026년판 종합 카탈로그를 자료실에서 다운로드하실 수 있습니다.",
      "pinned": true
    },
    {
      "id": "n1",
      "date": "2026-11-02",
      "category": "공지",
      "title": "SMG 공식 홈페이지 리뉴얼 오픈",
      "body": "㈜에스엠지 홈페이지가 새롭게 리뉴얼되었습니다. 제품 카탈로그, 견적 문의, 자료실 기능을 이용해 보세요.",
      "pinned": false
    },
    {
      "id": "n3",
      "date": "2024-12-01",
      "category": "인증",
      "title": "극저온용(LNG, LN₂) 피드스루 방폭인증 획득",
      "body": "극저온 환경용 피드스루가 IECEx Ex e 방폭인증을 획득하였습니다. 아울러 시즈타입 센서가 분진 방폭(Ex tb) 인증을 획득하였습니다.",
      "pinned": false
    },
    {
      "id": "n2",
      "date": "2023-12-01",
      "category": "기술",
      "title": "LNG선 펌프 전원용 극저온 피드스루 국산화 개발 완료",
      "body": "LNG선 펌프 전원 공급용 극저온 피드스루의 국산화 개발을 완료하였습니다.",
      "pinned": false
    }
  ],
  "downloads": [
    {
      "title": "SMG Products Catalogue (2026)",
      "desc": "온도센서·써모웰·히터·압력 트랜스미터·케이블 부싱·피드스루 전 제품 종합 카탈로그 · PDF 9.4MB",
      "file": "assets/SMG_Products_Catalogue_2026.pdf",
      "type": "PDF"
    }
  ],
  "faq": [
    {
      "q": "주문 제작(커스터마이징)이 가능한가요?",
      "a": "네. 대부분의 센서·히터·피드스루는 현장 공정과 설치 환경에 맞춰 길이, 소자, 리드선, 형상, 핀 수, 인증 등급 등을 주문 제작합니다. 도면 또는 사양서를 첨부하여 문의해 주세요."
    },
    {
      "q": "견적은 얼마나 걸리나요?",
      "a": "표준 사양은 영업일 기준 1~2일, 주문 제작품은 사양 검토 후 2~5일 내 회신드립니다."
    },
    {
      "q": "방폭 인증 제품의 인증서를 받을 수 있나요?",
      "a": "ATEX, IECEx, KCs(KGS), KTL, BV 등 해당 제품의 인증서 사본을 납품 시 또는 요청 시 제공해 드립니다. 각 제품 상세 페이지에서 인증번호를 확인하실 수 있습니다."
    },
    {
      "q": "극저온(LNG·LH₂) 환경용 제품이 있나요?",
      "a": "GB 글라스 피드스루는 -253℃, MB 세라믹 피드스루는 -196℃, CBC 케이블 부싱은 -55℃까지 대응합니다. 써모웰도 LNG·수소 탱크에 적용됩니다."
    },
    {
      "q": "해외 납품·수출이 가능한가요?",
      "a": "가능합니다. 수출유망중소기업으로서 해외 고객사에 납품하고 있으며, Honeywell 공식 대리점(APAC)으로 활동하고 있습니다. 영문 문의도 환영합니다."
    }
  ],
  "inquiryTypes": [
    "견적 요청",
    "기술 문의",
    "샘플 요청",
    "대리점·협력 문의",
    "기타"
  ]
};
