"""샘플 1: 공개 데이터 수집(정적 페이지) → CSV/엑셀 저장 (데모: quotes.toscrape.com)
사용: python 01_web_scraper.py --pages 3 --delay 1.0 --out quotes.xlsx
- 한글 사이트 대응: 응답 바이트를 BeautifulSoup이 직접 해석(charset 자동 판별)
- 일부 페이지 실패 시 그때까지 수집한 결과는 저장하고 종료 코드 1로 알림
- 대상 사이트 약관/robots.txt 확인 후 사용 (templates/legal_notes.md 참고)
"""
import argparse
import sys
import time

import pandas as pd
import requests
from bs4 import BeautifulSoup

BASE = "https://quotes.toscrape.com/page/{}/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; data-collector/1.0; contact: see README)"}


def _text(node) -> str:
    return node.get_text(strip=True) if node is not None else ""


def parse(content) -> list[dict]:
    """HTML(bytes 또는 str) 한 페이지에서 항목 추출. 누락된 요소는 빈 문자열로 처리."""
    soup = BeautifulSoup(content, "html.parser")
    return [
        {
            "text": _text(q.select_one("span.text")),
            "author": _text(q.select_one("small.author")),
            "tags": ",".join(_text(t) for t in q.select("a.tag")),
        }
        for q in soup.select("div.quote")
    ]


def scrape(pages: int, delay: float = 1.0, session=None) -> tuple[pd.DataFrame, str | None]:
    """(결과, 오류메시지) 반환. 오류가 나도 그때까지의 결과는 유지."""
    http = session or requests
    rows, error = [], None
    for p in range(1, pages + 1):
        try:
            res = http.get(BASE.format(p), headers=HEADERS, timeout=10)
            res.raise_for_status()
        except requests.RequestException as e:
            error = f"{p}페이지 수집 실패: {e}"
            break
        rows.extend(parse(res.content))  # bytes 전달 → 인코딩 자동 판별
        if p < pages:
            time.sleep(delay)  # 서버 부하 방지 (마지막 페이지 뒤에는 대기 안 함)
    return pd.DataFrame(rows, columns=["text", "author", "tags"]), error


def save(df: pd.DataFrame, out: str) -> None:
    base, dot, ext = out.rpartition(".")
    if not dot or ext.lower() not in ("xlsx", "csv"):
        base, ext = out, "xlsx"
    df.to_csv(f"{base}.csv", index=False, encoding="utf-8-sig")  # 엑셀에서 한글 깨짐 방지
    if ext.lower() == "xlsx":
        df.to_excel(f"{base}.xlsx", index=False)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", type=int, default=3)
    ap.add_argument("--delay", type=float, default=1.0)
    ap.add_argument("--out", default="quotes.xlsx")
    a = ap.parse_args()
    df, err = scrape(a.pages, a.delay)
    if df.empty:
        print("수집 결과 0건 (선택자/페이지 확인 필요)", file=sys.stderr)
    else:
        save(df, a.out)
        print(f"{len(df)}건 저장: {a.out}")
    if err:
        print(err, file=sys.stderr)
        sys.exit(1)
    if df.empty:
        sys.exit(2)
