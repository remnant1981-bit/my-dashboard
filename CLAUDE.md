# CLAUDE.md — SMG 홈페이지 작업 규칙

SMG(주식회사 에스엠지) 기업 홈페이지. 정적 HTML/CSS/JS, 빌드 없음, GitHub Pages(`main`) → https://www.sungsil.com
운영 인수인계: `docs/joy-handover.md` 참고.

## 구조
- 콘텐츠: `data/site-data.js`(국문, 설정 포함) / `data/site-data-en.js`(영문)
- 렌더링: `js/app.js` + `js/extras.js` · `js/motion.js` · `js/chat.js`, 관리자 `admin.html` + `js/admin.js`
- 영문 페이지 `en/*.html`은 생성물 → 국문 HTML 수정 후 `python3 tools/build_en_pages.py .` 실행
- CSS·JS 수정 후 반드시 `python3 tools/stamp_assets.py` (파일 버전 표시 → 방문자 브라우저가 새 파일을 바로 받음). 모든 생성 스크립트 뒤 마지막에 실행
- 제품 상세 정적 페이지 `product/*.html`, `en/product/*.html`, `sitemap.xml` 제품 항목은 생성물 → 제품 데이터 변경 후 `python3 tools/build_og_images.py` (새 제품·대표사진 변경 시) → `node tools/build_product_pages.js`
- 문의 전송: `js/app.js`의 `SMG.sendInquiry` (Web3Forms → Formspree → 메일앱, 서비스별 12초 제한)
- 로컬 확인: `python3 -m http.server 8000`

## 반드시 지킬 것
- 저장소 공개 상태: 비밀번호·토큰·계정정보를 코드·커밋·PR에 쓰지 말 것
- `CNAME` 수정·삭제 금지, `settings.adminHash` 변경 금지, 제품 `id` 변경 금지
- DNS 관련 안내 시 MX·TXT·`mail`·`*` 레코드는 유지 (회사 메일)
- 변경은 브랜치 + PR로 진행, 병합은 담당자(박장훈) 승인 후
- 국문 콘텐츠 수정 시 영문도 같이 반영, 모바일(390px)·데스크톱 모두 확인
- **운영 중인 사이트: 전면 개편 금지.** 작은 단위로 수정·테스트·PR, 반영 후 실사이트 재확인
- 디자인 스킬(frontend-design, ui-ux-pro-max, hallmark, emil-design-eng, web-design-guidelines)은 **신규 페이지·점검(감사)용**. 운영 중인 사이트의 디자인 전면 변경 제안·적용 금지 — 위 운영 원칙이 우선
- 전체 현황·절차: `docs/operations-manual.md`
- 응답: 한국어, 간결
