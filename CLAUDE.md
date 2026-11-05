# CLAUDE.md — SMG 홈페이지 작업 규칙

SMG(주식회사 에스엠지) 기업 홈페이지. 정적 HTML/CSS/JS, 빌드 없음, GitHub Pages(`main`) → https://www.sungsil.com
운영 인수인계: `docs/joy-handover.md` 참고.

## 구조
- 콘텐츠: `data/site-data.js`(국문, 설정 포함) / `data/site-data-en.js`(영문)
- 렌더링: `js/app.js` + `js/extras.js` · `js/motion.js` · `js/chat.js`, 관리자 `admin.html` + `js/admin.js`
- 영문 페이지 `en/*.html`은 생성물 → 국문 HTML 수정 후 `python3 tools/build_en_pages.py .` 실행
- 로컬 확인: `python3 -m http.server 8000`

## 반드시 지킬 것
- 저장소 공개 상태: 비밀번호·토큰·계정정보를 코드·커밋·PR에 쓰지 말 것
- `CNAME` 수정·삭제 금지, `settings.adminHash` 변경 금지, 제품 `id` 변경 금지
- DNS 관련 안내 시 MX·TXT·`mail`·`*` 레코드는 유지 (회사 메일)
- 변경은 브랜치 + PR로 진행, 병합은 담당자(박장훈) 승인 후
- 국문 콘텐츠 수정 시 영문도 같이 반영, 모바일(390px)·데스크톱 모두 확인
- 응답: 한국어, 간결
