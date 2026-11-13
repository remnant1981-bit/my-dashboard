# 본인이 직접 해야 할 일 (순서대로)

1. **[최우선] 소속사 겸업 규정 확인·허가** (`contract_checklist.md` 0번). 완료 전에는 아래 2~6을 진행하지 않는 것을 권장
2. 크몽 판매자 가입 + 본인 인증 + 정산 계좌 등록
3. 숨고 고수 가입
4. 샘플 4종 로컬 실행 확인 후 화면 캡처
   ```bash
   pip install -r samples/requirements.txt -r requirements-dev.txt
   python -m pytest -q tests
   ```
5. `exposure/kmong_detail_page.md`(제목·본문·이미지 구성)와 `listing_kmong.md`로 상품 등록 — 이미지는 `demo/images/`(미리보기·가상 데이터·출처 표기 유지) (가격·문구는 본인 검토 후 수정, 하단 "내부용" 구간은 게시하지 않음)
   - 패키지: 체험 4만 / 8만 / 15만 / 30만. **등록 화면에서 패키지 칸 수를 확인**하고 `listing_kmong.md`의 배치안(4칸 / 3칸 안 A·B) 중 선택
   - 체험 운영 중 기록할 것: 체험·정규 주문 건수, 체험 후 재의뢰 건수 (시뮬레이션 보정용)
6. `listing_soomgo.md`로 프로필 등록, 문의가 오면 `exposure/soomgo_quote_variants.md`의 업종별 응답 사용 (사례형 글 `exposure/case_posts.md`는 선택 게시)
7. 첫 문의가 오면 `templates/quote_and_scope.md` 문진표 발송 → 응답을 이 세션에 전달하면 제작·견적 초안은 내가 처리
8. 세무: `contract_checklist.md` 3번 참고 후 세무사 확인
