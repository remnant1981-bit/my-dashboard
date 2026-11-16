"""크몽 등록 최종본의 '붙여 넣을 문구'가 크몽 등록 가이드에 어긋나지 않는지 검사.
근거: 크몽 전문가센터 '용역 서비스 등록 가이드'(2026.01.19) —
  가격을 예측할 수 없는 문구 금지, 절대적 표현 금지, 조건 없는 보증 금지, 외부 연락 채널 금지.
이 테스트는 문구 수준의 검사일 뿐이며, 크몽 심사 통과를 보장하지 않음.
"""
import re
from pathlib import Path

import pytest

LISTING = Path(__file__).resolve().parent.parent / "listing_final_kmong.md"
PACKAGE_ROW = re.compile(r"^\| (STANDARD|DELUXE|PREMIUM|수집 프로그램·소스코드 제공|취합 프로그램·소스코드 제공) \|")

BANNED = {
    "절대적 표현": ["최대", "최고", "최초", "제일", "유일"],
    "가격을 예측할 수 없는 문구": ["견적", "별도 협의", "협의 후", "문의 주", "문의주", "일단 문의"],
    "조건 없는 보증": ["100%", "무제한", "무조건"],
}
CONTACT = re.compile(r"https?://|www\.|@|\d{2,3}-\d{3,4}-\d{4}|카카오톡|카톡|오픈채팅|텔레그램|인스타")


def paste_lines():
    """상품 1 이후의 인용 블록(> ...)과 패키지·옵션 표 행 = 등록 화면에 붙여 넣는 문구."""
    lines, started = [], False
    for no, line in enumerate(LISTING.read_text(encoding="utf-8").splitlines(), start=1):
        if line.startswith("## 상품 1"):
            started = True
        if not started:
            continue
        if line.startswith(">") or PACKAGE_ROW.match(line):
            lines.append((no, line))
    return lines


def test_paste_text_is_found():
    lines = paste_lines()
    assert len(lines) > 40
    assert sum(1 for _, l in lines if PACKAGE_ROW.match(l)) == 8  # 상품 2개 x (패키지 3칸 + 옵션 1개)


@pytest.mark.parametrize("rule,words", BANNED.items())
def test_no_banned_wording(rule, words):
    hits = [(no, w, line.strip()[:60]) for no, line in paste_lines() for w in words if w in line]
    assert not hits, f"{rule} 위반: {hits}"


def test_no_external_contact_channels():
    hits = [(no, line.strip()[:60]) for no, line in paste_lines() if CONTACT.search(line)]
    assert not hits, f"외부 연락 채널로 보이는 문구: {hits}"


def test_packages_have_fixed_price_days_and_revisions():
    rows = [l for _, l in paste_lines() if re.match(r"^\| (STANDARD|DELUXE|PREMIUM) \|", l)]
    assert len(rows) == 6
    for row in rows:
        cells = [c.strip() for c in row.strip("|").split("|")]
        assert re.fullmatch(r"[\d,]+원", cells[3]), row  # 가격은 고정 금액 ('~', '부터' 없음)
        assert re.fullmatch(r"\d+일", cells[4]) and re.fullmatch(r"\d+회", cells[5]), row


def test_trial_plus_addon_equals_old_standard_price():
    text = LISTING.read_text(encoding="utf-8")
    assert text.count("| 40,000원 | 1일 |") == 2  # 상품별 프로그램 제공 옵션
    assert text.count("합계 80,000원") >= 3


def test_warranty_states_scope_and_period():
    joined = "\n".join(l for _, l in paste_lines())
    assert "납품 후 7일간은 납품 범위 안의 오류를 무상으로 수정" in joined


def test_personal_data_and_login_exclusions_are_stated():
    joined = "\n".join(l for _, l in paste_lines())
    assert "개인정보" in joined and "로그인이 필요한" in joined
