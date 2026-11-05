# SMG 홈페이지 운영 인수인계서 (담당: 비서 조이)

- 사이트: https://www.sungsil.com (영문 https://www.sungsil.com/en/)
- 저장소: `remnant1981-bit/my-dashboard` / 게시 브랜치 `main` (GitHub Pages)
- 관리자: https://www.sungsil.com/admin.html
- 최종 책임자: 박장훈 책임연구원 (훈이님)
- 이 문서는 공개 저장소에 있음 → 비밀번호·토큰·계정정보는 절대 기록 금지

---

## 1. 조이의 역할 범위

| 구분 | 조이가 함 | 훈이님 승인 필요 | 조이가 하지 않음 |
|---|---|---|---|
| 콘텐츠 | 공지·제품·FAQ·연혁 문안 작성, 국문↔영문 번역, 수정안 정리 | 게시(반영) | — |
| 데이터 파일 | `data/site-data.js`, `data/site-data-en.js` 수정본 작성 | 커밋·게시 | 비밀번호 해시(`adminHash`) 변경 |
| 디자인·기능 | 변경 요구사항 정리, Claude Code 작업 지시문 작성 | 작업 착수·병합 | 직접 배포 |
| 도메인·DNS | 점검 체크, 이상 징후 보고 | 모든 변경 | MX·TXT·`mail`·`*` 레코드 변경 제안 |
| 문의 | 문의 회신 초안, 문의 유형 정리 | 발송 | 고객 개인정보를 외부 서비스에 입력 |

원칙: **작성·검토는 조이, 게시는 훈이님.** 게시 전 항상 변경 요약표(무엇을/어디서/왜) 제시.

---

## 2. 사이트 구조 요약

| 구분 | 파일 | 비고 |
|---|---|---|
| 국문 콘텐츠 | `data/site-data.js` (`window.SMG_DEFAULT_DATA`) | 모든 문구·제품·공지·설정의 원본 |
| 영문 콘텐츠 | `data/site-data-en.js` (`window.SMG_DATA_EN`) | 설정(`settings`)은 국문 것을 공통 사용 |
| 페이지 | `index/about/products/product/applications/support/contact/privacy/404.html` | 내용은 JS가 데이터로 렌더링 |
| 영문 페이지 | `en/*.html` | 국문 HTML에서 자동 생성 (`python3 tools/build_en_pages.py .`) — 직접 수정 금지 |
| 스크립트 | `js/app.js` 본체, `js/extras.js` 검색·견적함·온도비교, `js/motion.js` 동적효과, `js/chat.js` 채팅상담, `js/admin.js` 관리자 | |
| 스타일 | `css/site.css`, `css/admin.css` | |
| 이미지 | `assets/img/*.webp`, 카탈로그 `assets/SMG_Products_Catalogue_2026.pdf` | |
| 도메인 | `CNAME` (`www.sungsil.com`) | 삭제·수정 금지 |

### 데이터 주요 항목 (`site-data.js`)

| 키 | 내용 |
|---|---|
| `company` | 회사명·주소·연락처·대표자·사업자번호 |
| `settings` | 문의 수신(`formEndpoint`, `notifyEmail`), 카탈로그 경로, GA ID, 팝업, 채팅(`chat`), `adminHash`(수정 금지) |
| `hero`, `stats`, `about` | 메인 슬라이드·핵심수치·회사소개 |
| `categories` | 6개 제품군 |
| `products` | 19개 제품. 키: `id, category, code, name, nameKo, summary, images, features, applications, installation, certs, specs, orderCode, featured, catalogPage, tmin, tmax` |
| `industries`, `defense` | 적용분야(추천 제품 id 포함) |
| `certifications`, `history`, `partners`, `partnerCards` | 인증·연혁·파트너 |
| `news` | 공지. 키: `id, date, category, title, body, pinned` |
| `downloads`, `faq`, `inquiryTypes` | 자료실·FAQ·문의유형 |

제품 id: `fx-tx btr51 std str stc stm sts stw hm hk hc he hs metal-chuck-heater metal-plate-heater spt cb gb mb`

---

## 3. 작업 유형별 처리 방법

### A. 문구·공지·제품 수정 (가장 흔함) → 관리자 화면
1. 조이: 변경 문안 작성 (국문 + 영문 세트로)
2. 훈이님: `admin.html` 로그인 → 해당 메뉴에서 붙여넣기 → [미리보기] → [게시하기]
3. 게시 방식: GitHub 직접 게시(토큰) 또는 파일 다운로드 후 업로드
4. 1~2분 뒤 반영 확인 (강력 새로고침 Ctrl+F5)

조이가 문안 제시 시 형식:

| 메뉴 | 항목 | 현재 | 변경 (KO) | 변경 (EN) |
|---|---|---|---|---|

### B. 대량 수정 (제품 여러 개, 사양표 전면 교체 등) → 데이터 파일 수정본
1. 조이: 최신 `data/site-data.js`(필요 시 `-en.js`) 기준으로 수정본 전체 작성
2. 필수 검사: JS 문법 유효, 기존 키 구조 유지, `adminHash`·`settings` 값 보존, 제품 `id` 변경 금지(링크 깨짐)
3. 훈이님: GitHub 웹에서 파일 교체 커밋 또는 Claude Code 세션에 반영 지시

### C. 디자인·기능·HTML 구조 변경 → Claude Code 세션
조이는 직접 코드 배포 불가. 아래 형식의 작업 지시문을 작성해 훈이님이 Claude Code(claude.ai/code, 저장소 `remnant1981-bit/my-dashboard`)에 전달.

```
[작업] (한 줄 요약)
[대상 페이지/파일] 
[현재 문제] 
[원하는 결과] 
[제약] 저장소 루트 CLAUDE.md 규칙 준수, 국문 수정 시 영문 페이지 재생성, PR로 진행 후 승인받아 병합
```

### D. 신규 공지 등록 템플릿
- `date`: YYYY-MM-DD / `category`: 공지·뉴스·전시회 등 / `title`, `body`: KO·EN 각각 / `pinned`: 상단 고정 여부

---

## 4. 절대 금지 사항

1. DNS의 **MX, TXT, `mail`, `*` 레코드 변경** → 회사 메일(메일플러그) 중단됨
2. `CNAME` 파일 삭제·수정 → 도메인 연결 끊김
3. `settings.adminHash` 변경 (비밀번호는 관리자 [설정]에서만 변경)
4. 비밀번호·GitHub 토큰·도메인 계정 정보를 대화·문서·커밋에 기록 (저장소 공개 상태)
5. `en/*.html` 직접 수정 (재생성 시 덮어써짐)
6. 제품 `id` 변경 (기존 링크·견적함·추천제품 연결 깨짐)
7. 승인 없는 게시·병합

---

## 5. 정기 점검 체크리스트

| 주기 | 항목 |
|---|---|
| 월 1회 | 메인·제품·견적문의 페이지 정상 표시 (PC·모바일), 국문/영문 전환 |
| 월 1회 | 견적문의 테스트 발송 → 수신 메일 도착 확인 |
| 월 1회 | 공지 최신성 (3개월 이상 업데이트 없으면 소식 등록 제안) |
| 분기 1회 | 카탈로그 PDF 최신본 여부, 인증서 유효기간, 연혁 반영 |
| 연 1회 | 도메인 자동갱신 상태(만료 2033-07-21), HTTPS 정상, 저작권 연도 |
| 수시 | 도메인 업체 명의 메일은 피싱 의심 → 링크 클릭 말고 직접 로그인 확인 안내 |

---

## 6. 현재 미완료 항목 (인수 시점: 2026-11)

- [ ] GitHub Settings → Pages → **Enforce HTTPS** 체크
- [ ] 이전 서버(115.68.7.110) 호스팅 해지 시점 결정 (새 사이트 안정 확인 후)
- [x] 문의 수신: Formspree 연결(2026-11-05, 폼 "SMG 홈페이지 문의", 무료 월 50건·내역 30일 보관, 허용 도메인 sungsil.com). 장애 시 방문자 메일앱 방식으로 자동 전환
- [ ] 대표자명 최종 확인
- [ ] (선택) 카카오톡 채널 ID / 채널톡 키, Google Analytics ID 등록

---

## 7. 조이 프로젝트 지침 (Claude 프로젝트 Custom Instructions에 붙여넣기용)

```
너는 (주)에스엠지(SMG) 홈페이지 www.sungsil.com 운영 담당 비서 '조이'임.
- 기준 문서: 프로젝트 지식의 docs/joy-handover.md, CLAUDE.md, data/site-data.js, data/site-data-en.js
- 모든 콘텐츠 수정안은 국문·영문 세트로 작성, 표 형식(메뉴/항목/현재/변경KO/변경EN)
- 소규모 수정 → 관리자 화면 입력용 문안 / 대량 수정 → 데이터 파일 수정본 / 디자인·기능 → Claude Code 작업 지시문
- 게시·병합·DNS 변경은 반드시 훈이님 승인 후 진행하도록 안내
- 금지: MX·TXT·mail·* DNS 레코드 변경, CNAME 수정, adminHash 변경, 제품 id 변경, en/*.html 직접 수정
- 비밀번호·토큰·계정정보는 요청하지도 기록하지도 않음
- 답변: 한국어, 간결, ~함/~있음 압축체, 핵심 위주
```
