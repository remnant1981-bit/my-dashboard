"""샘플 2: 여러 CSV/엑셀 취합 → 요약 시트가 있는 보고서 자동 생성
사용: python 02_excel_report.py --in-dir data --out report.xlsx [--require 컬럼1,컬럼2]
- cp949(한국 엑셀 기본 CSV)/utf-8 자동 대응, 엑셀 잠금파일(~$)·출력 파일 자동 제외
- 시트에 '출처파일' 컬럼 추가, 필수 컬럼 누락 파일은 건너뛰고 경고
"""
import argparse
import sys
import unicodedata
from pathlib import Path

import pandas as pd


def read_csv_any(path: Path) -> pd.DataFrame:
    for enc in ("utf-8-sig", "cp949"):
        try:
            return pd.read_csv(path, encoding=enc)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"인코딩 판별 실패: {path.name}")


def load_frames(in_dir: str, out: str, require: list[str]) -> tuple[list[pd.DataFrame], list[str]]:
    frames, warns = [], []
    out_path = Path(out).resolve()
    for f in sorted(Path(in_dir).iterdir()):
        if f.name.startswith("~$") or f.resolve() == out_path:
            continue  # 엑셀 잠금파일 / 이전 출력물 제외
        suf = f.suffix.lower()
        try:
            if suf == ".csv":
                df = read_csv_any(f)
            elif suf in (".xlsx", ".xls"):
                df = pd.read_excel(f)
            else:
                continue
        except Exception as e:  # noqa: BLE001 - 파일 단위 실패는 경고 후 계속
            warns.append(f"{f.name}: 읽기 실패 ({e})")
            continue
        missing = [c for c in require if c not in df.columns]
        if missing:
            warns.append(f"{f.name}: 필수 컬럼 없음 {missing} → 제외")
            continue
        df.insert(0, "출처파일", f.name)
        frames.append(df)
    return frames, warns


def display_width(value) -> int:
    """한글 등 전각 문자는 2칸으로 계산."""
    s = "" if value is None else str(value)
    return sum(2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1 for ch in s)


def build(in_dir: str, out: str, require: list[str] | None = None) -> list[str]:
    frames, warns = load_frames(in_dir, out, require or [])
    if not frames:
        raise SystemExit("취합할 입력 파일 없음" + (": " + "; ".join(warns) if warns else ""))
    df = pd.concat(frames, ignore_index=True)
    num = df.select_dtypes("number").columns.tolist()
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="원본", index=False)
        summary = df[num].describe().T if num else pd.DataFrame({"행수": [len(df)]})
        summary.to_excel(w, sheet_name="요약")
        for ws in w.book.worksheets:
            for col in ws.columns:
                width = max(display_width(c.value) for c in col)
                ws.column_dimensions[col[0].column_letter].width = min(width + 2, 60)
    print(f"{len(df)}행 취합({len(frames)}개 파일) → {out}")
    return warns


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--in-dir", default="data")
    ap.add_argument("--out", default="report.xlsx")
    ap.add_argument("--require", default="", help="쉼표로 구분한 필수 컬럼")
    a = ap.parse_args()
    req = [c.strip() for c in a.require.split(",") if c.strip()]
    for w in build(a.in_dir, a.out, req):
        print("경고:", w, file=sys.stderr)
