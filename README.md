# SMG 주식회사 에스엠지 — 기업 홈페이지

2024 Products Catalogue를 바탕으로 만든 정적 기업 홈페이지와 관리자(CMS)입니다.
서버나 DB 없이 어떤 호스팅(GitHub Pages, Netlify, Cloudflare Pages, 일반 웹호스팅)에도 그대로 올려서 운영할 수 있습니다.

## 구성

| 페이지 | 파일 | 내용 |
|---|---|---|
| 메인 | `index.html` | 히어로, 핵심 수치, 제품 라인업, 회사소개, 적용분야, 주요 제품, 인증, 파트너, 소식, CTA, 팝업 |
| 회사소개 | `about.html` | CEO 인사말, 기업정보, 연혁(1990~2024), 인증현황, 오시는 길(지도) |
| 제품목록 | `products.html` | 카테고리 필터, 통합 검색(모델·인증·적용분야), URL 공유(`?cat=`, `?q=`) |
| 제품상세 | `product.html?id=…` | 갤러리·확대, 특징, 사양표, 인증, Ordering Code 복사, 제품 견적 문의, 관련 제품 |
| 적용분야 | `applications.html` | 산업별 솔루션, 방산부품 적용처 |
| 고객지원 | `support.html` | 공지사항, 자료실(카탈로그 PDF), FAQ |
| 견적문의 | `contact.html` | 검증 포함 문의 폼, 개인정보 동의, 스팸 방지, 지도 |
| 기타 | `privacy.html`, `404.html`, `robots.txt`, `sitemap.xml` | 개인정보처리방침, 오류 페이지, SEO |
| **관리자** | `admin.html` | 콘텐츠 관리(CMS) |

- 모든 콘텐츠는 `data/site-data.js` 한 파일에 들어 있습니다.
- 제품 이미지는 `assets/img/*.webp`(카탈로그에서 추출), 카탈로그 원본은 `assets/SMG_Products_Catalogue.pdf`입니다.
- 이전 연구소 대시보드는 `dashboard/`로 옮겨 그대로 두었습니다.

## 관리자 사용법 (`/admin.html`)

1. 초기 비밀번호 **`smg1234!`**로 로그인합니다. 로그인한 뒤 **[설정]에서 바로 변경**하세요.
2. 왼쪽 메뉴에서 제품·공지·자료실·FAQ·연혁·회사정보·메인 화면 등을 편집합니다. 편집 내용은 브라우저에 자동으로 임시저장됩니다.
   - 제품: 사진 업로드(자동 WebP 압축)·대표 사진 지정, 특징/사양/인증 행 추가·순서 변경, 복제, 메인 노출을 설정할 수 있습니다.
3. **[미리보기]**를 누르면 실제 사이트에서 임시저장 내용을 확인할 수 있습니다. 방문자에게는 보이지 않습니다.
4. **[게시하기]**는 두 가지 방식 중 하나를 고릅니다.
   - **GitHub 직접 게시**: Fine-grained token(해당 저장소 Contents Read & Write)을 입력하면 `data/site-data.js`가 커밋되고, 1~2분 뒤 사이트에 반영됩니다.
   - **파일 다운로드**: `site-data.js`를 내려받아 서버의 `data/` 폴더에 덮어씁니다(FTP 호스팅용).
5. **문의 관리**: 상태(신규/처리중/완료) 변경, 상세 보기, 메일 회신, 엑셀(CSV) 다운로드를 지원합니다.
6. **게시 · 백업**: 전체 콘텐츠를 JSON으로 백업·복원할 수 있고, 임시저장분을 폐기할 수도 있습니다.

## 배포 전 체크리스트

- [ ] **문의 메일 수신 설정**: [설정] → 폼 수신 주소에 Formspree 같은 서비스의 Endpoint를 등록합니다. 등록하지 않으면 방문자의 메일 앱으로 `sungsil@sungsil.com`에 발송되는 방식으로 동작합니다.
  - 문의 관리 화면에는 **같은 브라우저에서 접수된 건만** 보입니다. 실제 운영에서는 Endpoint를 연결해 메일로 받아야 합니다.
- [ ] **관리자 비밀번호 변경**, 그리고 호스팅 단에서 `admin.html` 접근 제한(Cloudflare Access, Basic Auth 등)을 권장합니다. 정적 사이트의 비밀번호 잠금은 간이 보호입니다.
- [ ] [회사 정보]에 **대표자명·사업자등록번호** 입력(푸터 표시)
- [ ] 실제 도메인으로 `sitemap.xml`, `robots.txt`의 `https://www.sungsil.com` 확인·수정
- [ ] (선택) [설정]에 Google Analytics 측정 ID 입력

## GitHub Pages로 배포

1. 이 브랜치를 `main`에 병합합니다.
2. 저장소 **Settings → Pages → Source: Deploy from a branch → `main` / root**를 선택합니다.
3. 커스텀 도메인을 쓰려면 같은 화면의 Custom domain에 입력하고 DNS를 연결합니다.

## 로컬 미리보기

```bash
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 엽니다.

## 기술 메모

- 순수 HTML/CSS/JS로 작성했습니다(빌드 도구·프레임워크 없음). 폰트는 Pretendard(CDN)를 씁니다.
- 반응형(모바일 390px~데스크톱), 접근성(본문 바로가기·키보드 조작·포커스 표시·reduced-motion), Open Graph와 Schema.org(Organization·Product) 메타데이터를 적용했습니다.
