"""데모 1: 한글 공개 웹페이지의 표 수집 → 정제 → 서식 있는 엑셀 보고서
대상: 한국어 위키백과 '대한민국의 행정 구역' (공개 문서, CC BY-SA 4.0 — 출처 표기 필수)
사용: python 01_korean_admin_division.py --out ../sample_output/demo1_korean_admin_division.xlsx

보여주는 것
  - 한글 페이지 수집 (인코딩, User-Agent 명시, 타임아웃/HTTP 오류 처리)
  - 지저분한 표 정제: 각주([a]), '빈칸', 괄호 숫자, 합계 행, 결측
  - 검증: 시도별 합계 vs 표의 '계' 행 일치 여부 (실제로 원본 표가 불일치 → 경고로 표시, 값은 임의로 맞추지 않음)
  - 결과 엑셀: 정제본 / 원본 / 검증 시트, 숫자 서식, 인구 막대 차트
"""
import argparse
import io
import re
import sys

import pandas as pd
import requests
from openpyxl.chart import BarChart, Reference
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

URL = "https://ko.wikipedia.org/wiki/대한민국의_행정_구역"
HEADERS = {"User-Agent": "data-collector-demo/1.0 (portfolio demo; polite crawler)"}
KEY_COLS = ["행정 구역", "넓이 (km2)", "인구 (명)"]
SOURCE_NOTE = "출처: 한국어 위키백과 '대한민국의 행정 구역' (CC BY-SA 4.0)"


def fetch(url: str = URL) -> bytes:
    res = requests.get(url, headers=HEADERS, timeout=20)
    res.raise_for_status()
    return res.content


def decode_html(content: bytes) -> str:
    """charset 선언이 없어도 한글이 깨지지 않도록 직접 디코딩: utf-8 우선, 실패 시 cp949(euc-kr 계열)."""
    for enc in ("utf-8-sig", "cp949"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace")


def find_table(tables: list[pd.DataFrame]) -> pd.DataFrame:
    """열 이름으로 대상 표를 찾음 (표 순서가 바뀌어도 동작)."""
    for t in tables:
        if all(c in t.columns for c in KEY_COLS):
            return t
    raise ValueError(f"대상 표를 찾지 못함 (필요 열: {KEY_COLS})")


def strip_notes(value) -> str:
    """각주 표기 [a], [1] 제거."""
    return re.sub(r"\[[^\]]*\]", "", "" if pd.isna(value) else str(value)).strip()


def to_int(value) -> int:
    """'빈칸' -> 0, '(17)' -> 17, '28[g]' -> 28, 숫자 문자열 -> int"""
    s = strip_notes(value)
    if s in ("", "빈칸", "-", "nan"):
        return 0
    m = re.search(r"\d[\d,]*", s)
    return int(m.group().replace(",", "")) if m else 0


def clean(raw: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """(정제된 시도별 표, '계' 행) 반환."""
    df = raw.copy()
    df["행정 구역"] = df["행정 구역"].map(strip_notes)
    total = df[df["행정 구역"] == "계"].iloc[0]
    body = df[df["행정 구역"] != "계"].copy()
    out = pd.DataFrame({
        "행정구역": body["행정 구역"],
        "면적(km2)": body["넓이 (km2)"].astype(float),
        "인구(명)": body["인구 (명)"].map(to_int),
        "시·도청 소재지": body["시·도청 소재지"].map(strip_notes),
        "시": body["시"].map(to_int) if "시" in body else 0,
        "군": body["군"].map(to_int) if "군" in body else 0,
        "구": body["구"].map(to_int) if "구" in body else 0,
    }).reset_index(drop=True)
    out["인구밀도(명/km2)"] = (out["인구(명)"] / out["면적(km2)"]).round(1)
    return out, total


def validate(clean_df: pd.DataFrame, total: pd.Series) -> pd.DataFrame:
    rows = []
    for label, col, tcol in (("면적(km2)", "면적(km2)", "넓이 (km2)"), ("인구(명)", "인구(명)", "인구 (명)")):
        calc, stated = float(clean_df[col].sum()), float(to_int(total[tcol]) if col == "인구(명)" else total[tcol])
        ok = abs(calc - stated) < 0.5
        rows.append({"항목": label, "시도 합계(계산)": round(calc, 2), "표의 '계'(원문)": stated,
                     "차이": round(calc - stated, 2), "일치": "O" if ok else "X",
                     "비고": "" if ok else "원본 표 내부 불일치(시도 행 합계 ≠ '계' 행). 원인 미확인 — 납품 시 고객 확인 필요"})
    return pd.DataFrame(rows)


def write_report(clean_df, raw, check, out_path: str) -> None:
    with pd.ExcelWriter(out_path, engine="openpyxl") as w:
        clean_df.to_excel(w, sheet_name="정제본", index=False, startrow=1)
        raw.to_excel(w, sheet_name="원본", index=False)
        check.to_excel(w, sheet_name="검증", index=False)
        ws = w.book["정제본"]
        ws["A1"] = SOURCE_NOTE
        ws["A1"].font = Font(italic=True, color="666666")
        head_fill = PatternFill("solid", fgColor="1F4E78")
        for c in ws[2]:
            c.font, c.fill = Font(bold=True, color="FFFFFF"), head_fill
            c.alignment = Alignment(horizontal="center")
        n = len(clean_df)
        for r in range(3, 3 + n):
            ws.cell(r, 2).number_format = "#,##0.00"
            ws.cell(r, 3).number_format = "#,##0"
            ws.cell(r, 8).number_format = "#,##0.0"
        ws.freeze_panes = "B3"
        for i, col in enumerate(clean_df.columns, start=1):
            width = max(len(str(col)) * 2, *(len(str(v)) * 2 for v in clean_df[col])) + 2
            ws.column_dimensions[get_column_letter(i)].width = min(width, 34)
        ch = BarChart()
        ch.type, ch.title, ch.style = "bar", "시도별 인구(명)", 10
        ch.add_data(Reference(ws, min_col=3, min_row=2, max_row=2 + n), titles_from_data=True)
        ch.set_categories(Reference(ws, min_col=1, min_row=3, max_row=2 + n))
        ch.height, ch.width, ch.legend = 11, 20, None
        ws.add_chart(ch, "J2")
        for name in ("원본", "검증"):
            sh = w.book[name]
            for c in sh[1]:
                c.font = Font(bold=True)
            for i in range(1, sh.max_column + 1):
                sh.column_dimensions[get_column_letter(i)].width = 22


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="demo1_korean_admin_division.xlsx")
    ap.add_argument("--html", default=None, help="저장된 HTML 파일로 오프라인 실행")
    ap.add_argument("--strict", action="store_true", help="검증 불일치 시 종료 코드 2")
    a = ap.parse_args()
    try:
        content = open(a.html, "rb").read() if a.html else fetch()
    except requests.RequestException as e:
        print(f"수집 실패: {e}", file=sys.stderr)
        return 1
    raw = find_table(pd.read_html(io.StringIO(decode_html(content))))
    clean_df, total = clean(raw)
    check = validate(clean_df, total)
    write_report(clean_df, raw, check, a.out)
    print(f"{len(clean_df)}개 시도 정제 완료 → {a.out}")
    print(check.drop(columns="비고").to_string(index=False))
    if not (check["일치"] == "O").all():
        print("경고: 시도 합계가 원본 표의 '계' 행과 다름 (검증 시트 참고). 수집 오류가 아니라 원본 표의 불일치일 수 있음.",
              file=sys.stderr)
        return 2 if a.strict else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
