# SMG 도면 BOM 뷰어 — 데스크톱 앱

웹 뷰어(`../bom.html`)를 Electron으로 감싼 오프라인 실행파일. PDF·엑셀 라이브러리 내장, 인터넷 불필요.

## 실행 (Windows)
1. `SMG-BOM-Viewer-win32-x64.zip` 압축 해제
2. 폴더 안 `SMG-BOM-Viewer.exe` 실행 (설치 불필요, 폴더째 이동 가능)
3. 처음 실행 시 SmartScreen 경고 → `추가 정보` → `실행`

## 빌드
```bash
cd desktop
npm install
npm run build:win     # → dist/SMG-BOM-Viewer-win32-x64/
npm start             # 개발 실행
```
`npm run prepare-web` 이 상위 폴더의 웹 소스를 `app/`으로 복사하고 CDN 라이브러리를 `app/vendor/`로 대체함.
