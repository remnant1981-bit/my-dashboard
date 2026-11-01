# 본인이 직접 해야 할 일 (순서대로)

1. **[최우선] 소속사 겸업 규정 확인·허가** (`contract_checklist.md` 0번). 완료 전에는 아래 2~6을 진행하지 않는 것을 권장
2. 크몽 판매자 가입 + 본인 인증 + 정산 계좌 등록
3. 숨고 고수 가입
4. 샘플 4종 로컬 실행 확인 후 화면 캡처
   ```bash
   pip install -r samples/requirements.txt -r requirements-dev.txt
   python -m pytest -q tests
   ```
5. `listing_kmong.md` 로 상품 등록 (가격·문구는 본인 검토 후 수정, 하단 "내부용" 구간은 게시하지 않음)
6. `listing_soomgo.md` 로 프로필/견적 발송
7. 첫 문의가 오면 `templates/quote_and_scope.md` 문진표 발송 → 응답을 이 세션에 전달하면 제작·견적 초안은 내가 처리
8. 세무: `contract_checklist.md` 3번 참고 후 세무사 확인
