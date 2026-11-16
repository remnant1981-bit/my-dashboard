"""데모 2: 지점별 매출 파일 취합 → 월별 피벗 보고서 자동 생성
※ 입력 데이터는 시연용 '가상 데이터'임 (실제 매출/고객 정보 아님, 난수 시드 고정).

일부러 섞어 둔 현실적인 문제 (취합 도구가 어떻게 처리하는지 시연)
  - 인코딩 혼합: 한국 엑셀 기본 저장(cp949) CSV + utf-8 CSV
  - 엑셀 잠금파일(~$...)이 폴더에 남아 있음
  - 필수 컬럼('매출')이 빠진 파일 1개 -> 경고 후 제외
  - 출력 파일을 입력 폴더에 두고 재실행해도 중복 취합되지 않음
사용: python 02_branch_sales_report.py --out ../sample_output/demo2_branch_sales_report.xlsx
"""
import argparse
import importlib.util
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

SAMPLES = Path(__file__).resolve().parent.parent / "samples"
BRANCHES = ["서울", "부산", "대구", "광주", "대전"]
MONTHS = ["2026-07", "2026-08", "2026-09"]
CATEGORIES = ["정기구독", "단품", "서비스"]


def load_report_module():
    spec = importlib.util.spec_from_file_location("excel_report", SAMPLES / "02_excel_report.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def make_input_files(folder: Path, seed: int = 20260701) -> None:
    rng = np.random.default_rng(seed)
    for i, branch in enumerate(BRANCHES):
        rows = [
            {"지점": branch, "월": m, "상품군": c,
             "매출": int(rng.integers(8, 40)) * 100_000, "건수": int(rng.integers(20, 120))}
            for m in MONTHS for c in CATEGORIES
        ]
        df = pd.DataFrame(rows)
        if i < 3:
            df.to_csv(folder / f"{branch}지점_매출.csv", index=False, encoding="cp949")  # 한국 엑셀 기본
        else:
            df.to_csv(folder / f"{branch}지점_매출.csv", index=False, encoding="utf-8-sig")
    bad = pd.DataFrame({"지점": ["제주"], "월": ["2026-07"], "상품군": ["단품"], "건수": [10]})  # '매출' 없음
    bad.to_csv(folder / "제주지점_매출(양식오류).csv", index=False, encoding="cp949")
    (folder / "~$서울지점_매출.xlsx").write_bytes(b"lock")  # 엑셀 잠금파일


def add_pivot(out: str) -> pd.DataFrame:
    df = pd.read_excel(out, sheet_name="원본")
    pivot = df.pivot_table(index="지점", columns="월", values="매출", aggfunc="sum",
                           margins=True, margins_name="합계")
    with pd.ExcelWriter(out, mode="a", engine="openpyxl", if_sheet_exists="replace") as w:
        pivot.to_excel(w, sheet_name="지점별 월 매출")
        ws = w.book["지점별 월 매출"]
        ws["A" + str(ws.max_row + 2)] = "※ 시연용 가상 데이터 (실제 매출 아님)"
        ws["A" + str(ws.max_row)].font = Font(italic=True, color="999999")
        for c in ws[1]:
            c.font = Font(bold=True)
        for row in ws.iter_rows(min_row=2, max_row=1 + len(pivot), min_col=2, max_col=1 + pivot.shape[1]):
            for c in row:
                c.number_format = "#,##0"
        for i in range(1, ws.max_column + 1):
            ws.column_dimensions[get_column_letter(i)].width = 16
    return pivot


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="demo2_branch_sales_report.xlsx")
    a = ap.parse_args()
    mod = load_report_module()
    with tempfile.TemporaryDirectory() as tmp:
        folder = Path(tmp)
        make_input_files(folder)
        warns = mod.build(str(folder), a.out, require=["지점", "월", "매출"])
    for w in warns:
        print("경고:", w, file=sys.stderr)
    pivot = add_pivot(a.out)
    print(pivot.to_string(float_format=lambda v: f"{v:,.0f}"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
