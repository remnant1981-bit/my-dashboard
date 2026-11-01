"""샘플 2: 여러 CSV/엑셀 취합 → 요약 시트가 있는 보고서 자동 생성
사용: python 02_excel_report.py --in-dir data --out report.xlsx
"""
import argparse
from pathlib import Path

import pandas as pd


def build(in_dir: str, out: str) -> None:
    frames = []
    for f in sorted(Path(in_dir).glob("*")):
        if f.suffix.lower() == ".csv":
            frames.append(pd.read_csv(f))
        elif f.suffix.lower() in (".xlsx", ".xls"):
            frames.append(pd.read_excel(f))
    if not frames:
        raise SystemExit("입력 파일 없음")
    df = pd.concat(frames, ignore_index=True)
    num = df.select_dtypes("number").columns.tolist()
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="원본", index=False)
        summary = df[num].describe().T if num else pd.DataFrame({"행수": [len(df)]})
        summary.to_excel(w, sheet_name="요약")
        for ws in w.book.worksheets:
            for col in ws.columns:
                width = max(len(str(c.value)) if c.value is not None else 0 for c in col)
                ws.column_dimensions[col[0].column_letter].width = min(width + 2, 50)
    print(f"{len(df)}행 취합 → {out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--in-dir", default="data")
    ap.add_argument("--out", default="report.xlsx")
    a = ap.parse_args()
    build(a.in_dir, a.out)
