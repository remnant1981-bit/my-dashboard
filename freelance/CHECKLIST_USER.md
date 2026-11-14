# 본인이 직접 해야 할 일 (순서대로)

1. **[최우선] 소속사 겸업 규정 확인·허가** (`contract_checklist.md` 0번). 완료 전에는 아래 2~6을 진행하지 않는 것을 권장
2. 크몽 판매자 가입 + 본인 인증 + 정산 계좌 등록
3. 숨고 고수 가입
4. 샘플 4종 로컬 실행 확인 후 화면 캡처
   ```bash
   pip install -r samples/requirements.txt -r requirements-dev.txt
   python -m pytest -q tests
   ```
5. **`listing_final_kmong.md`를 항목 순서대로 붙여 넣어** 상품 등록 (근거·대안은 `exposure/kmong_detail_page.md`, `listing_kmong.md`) — 이미지는 `demo/images/`(미리보기·가상 데이터·출처 표기 유지) (가격·문구는 본인 검토 후 수정, 하단 "내부용" 구간은 게시하지 않음)
   - 패키지는 **안 A 확정**: STANDARD 칸 = 체험 4만 / DELUXE 15만 / PREMIUM 30만 (8만원은 견적). 붙여 넣을 문구는 `listing_final_kmong.md` (상품 2도 같은 규칙, 범위·작업일은 제안값이라 검토 필요)
   - 등록 후 크몽 [판매 관리 > 수익 관리 > 수익금 계산기]로 실제 수수료 확인 (문서의 21.67%는 공식 정책 기준 계산값)
   - **등록일부터 `tracking/log.csv`에 문의·수주·완료·리뷰를 한 줄씩 기록** (양식·규칙: `tracking/README.md`, 개인정보·의뢰 내용은 적지 않음)
   - 2~4주 뒤 `python simulation/calibrate.py tracking/log.csv --start <등록일>`로 실측 기반 예측 확인 (문의 20건·4주 전에는 방향만 참고)
6. **`listing_final_soomgo.md`를 붙여 넣어** 숨고 프로필·서비스 등록 (필수 인증 서비스 해당 여부·카테고리는 등록 화면에서 확인)
   - 숨고는 거래 수수료가 없고 **견적이 열람될 때마다 캐시가 차감됨** → 견적 화면의 실제 비용을 확인하고 같은 문서 5번 기준으로 보낼지 결정
   - 차감된 견적 비용은 `tracking/log.csv`에 `견적비용` 행으로 기록 (업종별 문구: `exposure/soomgo_quote_variants.md`)
7. 첫 문의가 오면 `templates/quote_and_scope.md` 문진표 발송 → 응답을 이 세션에 전달하면 제작·견적 초안은 내가 처리
8. 세무: `contract_checklist.md` 3번 참고 후 세무사 확인
