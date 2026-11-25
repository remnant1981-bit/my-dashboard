# 납품 가이드 (의뢰인에게 함께 전달)

## 납품물
- 소스코드 (.py), requirements.txt, 실행 파일(`run.bat`)
- 사용 설명서 (아래 양식)
- 샘플 결과 파일 1개 (`sample_output/`)
- 설정은 코드 밖(옵션/설정 파일)으로 분리: URL, 선택자(`--fields`), 주기, 출력 경로

## 사용 설명서 양식
1. 파이썬 설치 (python.org, "Add to PATH" 체크) / 미설치 고객은 원격 지원 옵션(별도 협의)
2. 설치: `pip install -r requirements.txt`
3. 실행: `python main.py --옵션 값` 또는 `run.bat` 더블클릭
4. 결과 위치와 컬럼 설명
5. 자주 나는 오류
   - 대상 사이트 구조 변경: 선택자 수정 필요 → 별도 협의
   - 접속 차단/속도 제한: `--delay` 값을 늘려 재시도 (01 샘플은 `--delay` 지원)
   - Chrome 관련(04): Chrome 최신 버전 필요. 구버전 chromedriver가 PATH에 있으면 삭제 (Selenium 4.6+ 는 자동 매칭)
6. 약관·robots.txt 준수 (templates/legal_notes.md): 제작자는 수주 전 확인을 수행하고, 범위를 벗어난 사용은 이용자 책임

## 납품 키트
`templates/deliver_kit/`에 `run.bat`(Windows 실행 파일)과 고객용 `README_납품용.md`(채워서 전달) 양식이 있음. **`run.bat`은 Windows에서 아직 검증하지 못했으므로 납품 전 깨끗한 PC에서 확인할 것.**

## run.bat 예시 (Windows)
```bat
@echo off
cd /d %~dp0
python 01_web_scraper.py --pages 3 --delay 1.0 --out result.xlsx
pause
```

## 정기 실행 (Windows 작업 스케줄러)
1. 작업 스케줄러 → 기본 작업 만들기 → 트리거(매일/반복 간격) 지정
2. 동작: 프로그램 시작 → `python` / 인수 `C:\경로\01_web_scraper.py --out C:\경로\result.xlsx` / 시작 위치 `C:\경로`
3. 상시 감시형(03)은 `--interval` 로 반복하되, PC 재부팅 시 자동 재시작을 위해 "로그온 시 실행" 트리거 추가
4. 알림 연동: templates/notify_examples.md

## 납품 전 자체 검증 체크리스트
- [ ] 깨끗한 가상환경에서 `pip install` 후 실행 성공
- [ ] 샘플 결과와 실제 화면 대조 (건수/값 일치)
- [ ] 실패 케이스 확인 (네트워크 끊김, 빈 페이지, 요소 누락)
- [ ] 한글 사이트/한글 파일(cp949 CSV 포함)로 확인
- [ ] 개인정보/계정정보가 코드에 하드코딩되지 않음 (환경변수 사용)
- [ ] 요청 delay, User-Agent 설정 포함
- [ ] 고객 데이터·계정 정보 납품 후 파기 (보관 필요 시 계약서에 명시)
