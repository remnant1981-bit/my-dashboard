"""엑셀 결과 시트를 표 이미지(PNG)로 렌더링 — 포트폴리오/상품 상세 페이지용 미리보기.
※ 실제 엑셀 화면 캡처가 아니라, 결과 시트 내용을 HTML 표로 그려 캡처한 '미리보기'임 (차트는 포함되지 않음).
사용: python render_preview.py
"""
import html
import sys
from pathlib import Path

import pandas as pd
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = Path(__file__).resolve().parent / "images"
CHROME_FALLBACK = "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"

CSS = """
body{font-family:'Malgun Gothic','Noto Sans CJK KR','WenQuanYi Zen Hei',sans-serif;margin:0;background:#fff;color:#222}
.card{display:inline-block;padding:24px;background:#fff}
h1{font-size:20px;margin:0 0 4px} p.note{font-size:12px;color:#777;margin:0 0 14px}
table{border-collapse:collapse;font-size:13px} th{background:#1F4E78;color:#fff;padding:7px 12px;text-align:center}
td{padding:6px 12px;border-bottom:1px solid #e3e3e3;white-space:nowrap} td.num{text-align:right;font-variant-numeric:tabular-nums}
tr:nth-child(even) td{background:#f6f9fc} tr.total td{font-weight:700;background:#eef3f8}
td.bad{color:#b00020;font-weight:700} td.ok{color:#1b7f3b;font-weight:700}
"""


# 열별 표시 형식 (정수 여부에 따라 자릿수가 달라지지 않도록 열 단위로 고정)
COL_FORMATS = {"면적(km2)": "{:,.2f}", "인구밀도(명/km2)": "{:,.1f}",
               "시도 합계(계산)": "{:,.2f}", "표의 '계'(원문)": "{:,.2f}", "차이": "{:,.2f}"}


def fmt(v, col=""):
    if isinstance(v, float) and v != v:
        return ""
    if isinstance(v, (int, float)):
        pattern = COL_FORMATS.get(col)
        if pattern:
            return pattern.format(v)
        return f"{int(round(v)):,}"
    return html.escape(str(v))


def table_html(df: pd.DataFrame, title: str, note: str) -> str:
    head = "".join(f"<th>{html.escape(str(c))}</th>" for c in df.columns)
    rows = []
    for _, r in df.iterrows():
        total = str(r.iloc[0]) in ("합계", "계")
        cells = []
        for c, v in zip(df.columns, r):
            cls = "num" if isinstance(v, (int, float)) and v == v else ""
            if c == "일치":
                cls = "ok" if v == "O" else "bad"
            cells.append(f"<td class='{cls}'>{fmt(v, c)}</td>")
        rows.append(f"<tr class='{'total' if total else ''}'>{''.join(cells)}</tr>")
    return (f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>"
            f"<div class='card'><h1>{html.escape(title)}</h1><p class='note'>{html.escape(note)}</p>"
            f"<table><tr>{head}</tr>{''.join(rows)}</table></div></body></html>")


def shot(page, doc: str, out: Path) -> None:
    page.set_content(doc)
    page.locator(".card").screenshot(path=str(out))  # 내용 크기만큼만 캡처 (여백 제거)
    print("저장:", out.relative_to(ROOT))


def main() -> int:
    OUT_DIR.mkdir(exist_ok=True)
    d1 = ROOT / "sample_output" / "demo1_korean_admin_division.xlsx"
    d2 = ROOT / "sample_output" / "demo2_branch_sales_report.xlsx"
    clean = pd.read_excel(d1, sheet_name="정제본", header=1)
    check = pd.read_excel(d1, sheet_name="검증").drop(columns="비고")
    for col in ("시도 합계(계산)", "표의 '계'(원문)", "차이"):  # 항목별(면적 2자리 / 인구 정수) 표시 형식
        check[col] = [f"{v:,.2f}" if item.startswith("면적") else f"{v:,.0f}" for item, v in zip(check["항목"], check[col])]
    pivot = pd.read_excel(d2, sheet_name="지점별 월 매출")
    pivot = pivot[pivot.iloc[:, 0].astype(str).str.startswith("※") == False].dropna(how="all")
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception:  # noqa: BLE001
            browser = p.chromium.launch(executable_path=CHROME_FALLBACK)
        page = browser.new_page(viewport={"width": 1100, "height": 600}, device_scale_factor=2)
        shot(page, table_html(clean, "대한민국 행정구역별 면적·인구 (자동 수집·정제 결과)",
                              "출처: 한국어 위키백과 '대한민국의 행정 구역' (CC BY-SA 4.0) · 각주/빈칸/괄호 숫자 정제, 인구밀도 계산"),
             OUT_DIR / "demo1_cleaned_table.png")
        shot(page, table_html(check, "수집 데이터 자동 검증 (시도 합계 vs 원본 '계' 행)",
                              "원본 표 내부 불일치를 자동 탐지해 경고 — 값은 임의로 맞추지 않음"),
             OUT_DIR / "demo1_validation.png")
        shot(page, table_html(pivot, "지점별 월 매출 취합 보고서 (5개 파일 자동 취합)",
                              "※ 시연용 가상 데이터 · cp949/utf-8 혼합, 잠금파일 제외, 양식 오류 파일 경고 후 제외"),
             OUT_DIR / "demo2_branch_sales_pivot.png")
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
