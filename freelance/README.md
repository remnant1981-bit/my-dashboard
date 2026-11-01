# 수익화 프로젝트: 크롤링/업무 자동화 외주

근거: 시장 조사 결과 1순위 D(크롤링/Selenium), 보조 C(엑셀 자동화). 2순위 A(민간 사업계획서·IR).
단가 근거(크몽/숨고 집계): 크롤링 평균 30만 / 매크로·자동화 평균 15~20만 → 3~5건으로 100만원 (수주 보장 아님, 추정).

## 폴더
| 경로 | 내용 | 검증 |
|---|---|---|
| `samples/01_web_scraper.py` | 정적 페이지 수집 → CSV/엑셀 | 실사이트 10건 수집 + 단위테스트 |
| `samples/02_excel_report.py` | 파일 취합 → 요약 보고서 | 단위테스트 |
| `samples/03_scheduled_notify.py` | 주기 실행 + 변경 감지 알림 | 로컬 서버 실동작 + 단위테스트 |
| `samples/04_dynamic_scraper_selenium.py` | JS 동적 페이지 수집 (Selenium) | 로컬 지연 렌더링 페이지 2건 수집 |
| `tests/` | pytest 6건 | `python -m pytest -q tests` |
| `templates/` | 견적서·요구사항 문진표·납품 가이드 | - |
| `listing_kmong.md` / `listing_soomgo.md` | 상품·프로필 초안 | 본인 검토 필요 |
| `contract_checklist.md` | 계약·리스크 | - |
| `CHECKLIST_USER.md` | 본인이 직접 할 일 | - |

## 실행
```bash
pip install -r samples/requirements.txt -r requirements-dev.txt
python -m pytest -q tests
```

## 알려진 제약
- 04는 Chrome과 chromedriver 버전이 맞아야 함 (Selenium 4.6+ 는 자동 매칭, PATH에 구버전 드라이버가 있으면 충돌 가능)
- 01/04의 실사이트 데모는 공개 연습용 사이트(quotes.toscrape.com) 대상
- 수익·수주는 보장되지 않음

## 원칙
- 개인정보/로그인 필요/약관 위반 소지 크롤링은 수주하지 않음
- 소속사 과제의 코드·문서·데이터 재사용 금지
- 정부과제 작성 "대행"은 크몽 정책상 금지 → 하지 않음
- 외부 발송·게시·결제는 본인이 직접 수행 (이 저장소는 초안까지)
