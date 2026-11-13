# 수익화 프로젝트: 크롤링/업무 자동화 외주

근거: 시장 조사 결과 1순위 D(크롤링/Selenium), 보조 C(엑셀 자동화). 2순위 A(민간 사업계획서·IR)는 현재 보류.
단가 근거: 크몽/숨고 집계 페이지 수치(크롤링 평균 약 30만, 매크로·자동화 평균 15~20만, 집계 시점 2026-11, 추정 포함).
**수주·수익은 보장되지 않음.** 플랫폼 수수료·세금 후 실수령은 `listing_kmong.md` 하단 참고.
패키지: 체험 4만(첫 거래용, 결과 파일만) / 8만 / 15만 / 30만. 체험은 수주가 약 +10~15% 이상 늘어야 이득 (`simulation/RESULTS.md`, 가정 기반).

## 구성
| 경로 | 내용 | 검증 근거 |
|---|---|---|
| `samples/01_web_scraper.py` | 정적 페이지 수집 → CSV/엑셀 (한글·부분실패·delay) | `tests/` 단위 6건 |
| `samples/02_excel_report.py` | 파일 취합 → 요약 보고서 (cp949·잠금파일·재실행 중복 방지·필수컬럼) | `tests/` 단위 7건 |
| `samples/03_scheduled_notify.py` | 주기 확인 + 변경 감지 (HTTP오류 오탐 방지·selector·실패알림 1회) | `tests/` 단위 5건 |
| `samples/04_dynamic_scraper_selenium.py` | JS 동적 페이지 + 페이지 넘김 (필드 선택자 외부화) | `tests/` 로컬서버+실제 Chrome 통합 2건 + 파서 1건 |
| `demo/` | **한글 데이터 데모 2종** (위키백과 표 수집·정제·검증, 지점 매출 취합) + 결과 미리보기 이미지 | 실사이트 실행 + `tests/test_demo.py` 7건 |
| `tools/check_robots.py` | 수주 전 robots.txt 자동 점검 (허용/불허/확인 불가, Crawl-delay, 보수적 판정) | `tests/test_tools.py` 7건 + 실사이트 허용·불허 양쪽 확인 |
| `exposure/` | 노출·전환용 콘텐츠: 크몽 상세페이지 개선안(시장 관찰·제목/키워드·본문·이미지 구성), 숨고 업종별 견적 응답 6종+거절 템플릿, 사례형 글 2편 | 스니펫 근거(크몽 상위 10개), 수치는 데모 직접 실행값 |
| `simulation/` | 수익 몬테카를로 시뮬레이션 + 체험 패키지 비교(손익분기·잠식률 민감도). 입력값은 전부 가정 | `tests/test_simulation.py` 10건 (도입 전 모델과 동일 재현 검사 포함) |
| `sample_output/` | 샘플 실행 결과 (01 실사이트 2페이지 20건, 02 취합) | 깨끗한 venv에서 직접 실행 |
| `templates/` | 견적서·문진표·면책 문구, 납품 가이드, 법적 유의, 알림 구현 예시, **납품 키트(`deliver_kit/`: run.bat·고객용 설명서)** | 문서 (run.bat은 Windows 미검증) |
| `listing_kmong.md` / `listing_soomgo.md` | 상품·프로필 초안 | 본인 검토 필요 |
| `contract_checklist.md` | 겸업 선행조건·계약·세무 | 문서 |
| `CHECKLIST_USER.md` | 본인이 직접 할 일 | 문서 |

## 실행 / 검증
```bash
pip install -r samples/requirements.txt -r requirements-dev.txt
python -m pytest -q tests      # 현재 44건 (데모·도구·시뮬레이션 포함. 샘플 20건은 깨끗한 venv 설치 후 통과 확인). Chrome 없으면 Selenium 통합 2건은 skip
```

## 알려진 제약
- 04 통합 테스트는 로컬에 Chrome이 있어야 실행됨. PATH에 버전이 다른 chromedriver가 있으면 충돌 가능
- 01·04 데모는 공개 연습 사이트(quotes.toscrape.com) 기준. 한글 사이트 포트폴리오는 허용된 공개 데이터로 별도 제작 필요
- 03은 단순 감시 루프. 상시 운영은 OS 스케줄러 등록 필요 (`templates/delivery_guide.md`)
- 샘플 코드 자체는 robots.txt를 확인하지 않음. 수주 전 `tools/check_robots.py`로 점검하는 절차로 대체 (`templates/legal_notes.md`)

## 원칙
- 개인정보/로그인 필요/약관 위반 소지 크롤링은 수주하지 않음
- 소속사 과제의 코드·문서·데이터 재사용 금지
- 정부과제 작성 "대행"은 크몽 정책상 금지 → 하지 않음
- 외부 발송·게시·결제는 본인이 직접 수행 (이 저장소는 초안까지)
- 겸업 허가 확인 전에는 상품 공개 금지
