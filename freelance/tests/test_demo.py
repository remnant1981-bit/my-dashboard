import importlib.util
import io
from pathlib import Path

import pandas as pd
import pytest

DEMO = Path(__file__).resolve().parent.parent / "demo"


def load(name: str):
    spec = importlib.util.spec_from_file_location(name, DEMO / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# 위키백과 표의 지저분한 셀을 그대로 흉내낸 고정 HTML (네트워크 불필요)
FIXTURE = """
<table>
<tr><th>행정 구역</th><th>넓이 (km2)</th><th>인구 (명)</th><th>시·도청 소재지</th><th>시</th><th>군</th><th>구</th><th>비고</th></tr>
<tr><td>가도</td><td>100.0</td><td>1000</td><td>가시[a], 나시[b]</td><td>빈칸</td><td>2</td><td>(17)</td><td></td></tr>
<tr><td>나도[c]</td><td>50.5</td><td>500</td><td>다군</td><td>28[g]</td><td>빈칸</td><td>빈칸</td><td></td></tr>
<tr><td>계</td><td>150.5</td><td>1500</td><td>빈칸</td><td>28</td><td>2</td><td>17</td><td></td></tr>
</table>
<table><tr><th>다른 표</th></tr><tr><td>x</td></tr></table>
"""


def raw_table(mod):
    return mod.find_table(pd.read_html(io.StringIO(FIXTURE)))


def test_strip_notes_and_to_int():
    m = load("01_korean_admin_division")
    assert m.strip_notes("서구[a], 무안군[b]") == "서구, 무안군"
    assert m.to_int("빈칸") == 0
    assert m.to_int("(17)") == 17
    assert m.to_int("28[g]") == 28
    assert m.to_int("(2)[r]") == 2
    assert m.to_int("1,234") == 1234
    assert m.to_int(float("nan")) == 0


def test_decode_html_utf8_and_cp949_without_charset_meta():
    m = load("01_korean_admin_division")
    text = "<table><tr><th>행정 구역</th></tr><tr><td>서울특별시</td></tr></table>"
    assert m.decode_html(text.encode("utf-8")) == text
    assert m.decode_html(text.encode("cp949")) == text  # 한국 사이트에 흔한 인코딩


def test_find_table_by_columns_not_position():
    m = load("01_korean_admin_division")
    assert "행정 구역" in raw_table(m).columns
    with pytest.raises(ValueError):
        m.find_table(pd.read_html(io.StringIO("<table><tr><th>a</th></tr><tr><td>1</td></tr></table>")))


def test_clean_removes_total_and_notes():
    m = load("01_korean_admin_division")
    out, total = m.clean(raw_table(m))
    assert list(out["행정구역"]) == ["가도", "나도"]  # '계' 행 분리, 각주 제거
    assert list(out["시·도청 소재지"]) == ["가시, 나시", "다군"]
    assert list(out["시"]) == [0, 28] and list(out["구"]) == [17, 0]
    assert out.loc[0, "인구밀도(명/km2)"] == 10.0
    assert total["행정 구역"] == "계"


def test_validate_matches_and_flags_mismatch():
    m = load("01_korean_admin_division")
    out, total = m.clean(raw_table(m))
    assert (m.validate(out, total)["일치"] == "O").all()
    out.loc[0, "인구(명)"] += 1000  # 의도적으로 틀어서 불일치 탐지 확인
    check = m.validate(out, total)
    assert check.loc[check["항목"] == "인구(명)", "일치"].iloc[0] == "X"
    assert "원본 표 내부 불일치" in check.loc[check["항목"] == "인구(명)", "비고"].iloc[0]


def test_demo1_offline_end_to_end(tmp_path, capsys):
    m = load("01_korean_admin_division")
    html = tmp_path / "t.html"
    html.write_text(FIXTURE, encoding="utf-8")
    out = tmp_path / "r.xlsx"
    import sys

    argv = sys.argv
    sys.argv = ["x", "--html", str(html), "--out", str(out)]
    try:
        assert m.main() == 0
    finally:
        sys.argv = argv
    book = pd.read_excel(out, sheet_name=None, header=None)
    assert set(book) == {"정제본", "원본", "검증"}


def test_demo2_end_to_end(tmp_path, capsys):
    m = load("02_branch_sales_report")
    out = tmp_path / "r.xlsx"
    import sys

    argv = sys.argv
    sys.argv = ["x", "--out", str(out)]
    try:
        assert m.main() == 0
    finally:
        sys.argv = argv
    err = capsys.readouterr().err
    assert "제주지점_매출(양식오류).csv" in err and "필수 컬럼 없음" in err  # 양식 오류 파일 경고
    raw = pd.read_excel(out, sheet_name="원본")
    assert len(raw) == 45 and set(raw["지점"]) == {"서울", "부산", "대구", "광주", "대전"}  # 5지점 x 3월 x 3상품군
    pivot = pd.read_excel(out, sheet_name="지점별 월 매출", index_col=0)
    assert pivot.loc["합계", "합계"] == raw["매출"].sum()  # 피벗 총합 = 원본 합계
