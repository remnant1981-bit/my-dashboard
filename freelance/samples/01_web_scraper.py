"""샘플 1: 공개 데이터 수집 → CSV/엑셀 저장 (데모 사이트 quotes.toscrape.com 대상)
사용: python 01_web_scraper.py --pages 3 --out quotes.xlsx
"""
import argparse
import time

import pandas as pd
import requests
from bs4 import BeautifulSoup

BASE = "https://quotes.toscrape.com/page/{}/"


def parse(html: str) -> list[dict]:
    """HTML 한 페이지에서 항목 추출 (네트워크 없이 테스트 가능)"""
    soup = BeautifulSoup(html, "html.parser")
    return [
        {
            "text": q.select_one("span.text").get_text(strip=True),
            "author": q.select_one("small.author").get_text(strip=True),
            "tags": ",".join(t.get_text() for t in q.select("a.tag")),
        }
        for q in soup.select("div.quote")
    ]


def scrape(pages: int, delay: float = 1.0) -> pd.DataFrame:
    rows = []
    for p in range(1, pages + 1):
        res = requests.get(BASE.format(p), timeout=10)
        res.raise_for_status()
        rows.extend(parse(res.text))
        time.sleep(delay)  # 서버 부하 방지
    return pd.DataFrame(rows)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", type=int, default=3)
    ap.add_argument("--out", default="quotes.xlsx")
    a = ap.parse_args()
    df = scrape(a.pages)
    df.to_csv(a.out.rsplit(".", 1)[0] + ".csv", index=False, encoding="utf-8-sig")
    df.to_excel(a.out, index=False)
    print(f"{len(df)}건 저장: {a.out}")
