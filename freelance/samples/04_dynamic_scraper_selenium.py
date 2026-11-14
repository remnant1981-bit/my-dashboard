"""샘플 4: JS로 렌더링되는 동적 페이지 수집 (Selenium, headless Chrome) + 페이지네이션
데모: https://quotes.toscrape.com/js/ (JS가 목록을 그리는 공개 연습 사이트)
사용:
  python 04_dynamic_scraper_selenium.py --max-pages 3 --out dyn.xlsx
  python 04_dynamic_scraper_selenium.py --url URL --item "div.quote" \
      --fields "text=span.text,author=small.author" --next "li.next > a"
- 필드 선택자는 --fields 로 외부 지정 (코드 수정 없이 다른 사이트에 적용)
- 항목에 필드가 없으면 빈 값, 타임아웃/드라이버 오류는 메시지 출력 후 그때까지 결과 저장
- Chrome 경로가 다르면 --chrome 지정. Selenium 4.6+ 는 chromedriver 자동 매칭
"""
import argparse
import sys

import pandas as pd
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def make_driver(chrome: str | None = None) -> webdriver.Chrome:
    opt = Options()
    opt.add_argument("--headless=new")
    opt.add_argument("--no-sandbox")
    opt.add_argument("--disable-dev-shm-usage")
    opt.add_argument("--lang=ko-KR")
    if chrome:
        opt.binary_location = chrome
    return webdriver.Chrome(options=opt)


def parse_fields(spec: str) -> dict[str, str]:
    out = {}
    for part in spec.split(","):
        name, _, sel = part.partition("=")
        if not name.strip() or not sel.strip():
            raise ValueError(f"--fields 형식 오류: '{part}' (이름=선택자)")
        out[name.strip()] = sel.strip()
    return out


def scrape(url: str, item_sel: str, fields: dict[str, str], next_sel: str | None = None,
           max_pages: int = 1, chrome: str | None = None, timeout: int = 15):
    """(DataFrame, 오류메시지|None) 반환."""
    driver = make_driver(chrome)
    rows, error = [], None
    try:
        driver.get(url)
        for page in range(1, max_pages + 1):
            try:
                # 고정 sleep 대신 요소가 나타날 때까지 대기
                WebDriverWait(driver, timeout).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, item_sel)))
            except TimeoutException:
                error = f"{page}페이지: '{item_sel}' 요소 {timeout}초 내 미표시"
                break
            for el in driver.find_elements(By.CSS_SELECTOR, item_sel):
                row = {}
                for name, sel in fields.items():
                    try:
                        row[name] = el.find_element(By.CSS_SELECTOR, sel).text.strip()
                    except NoSuchElementException:
                        row[name] = ""
                rows.append(row)
            if page >= max_pages or not next_sel:
                break
            nxt = driver.find_elements(By.CSS_SELECTOR, next_sel)
            if not nxt:
                break  # 마지막 페이지
            nxt[0].click()
    except WebDriverException as e:
        error = f"브라우저 오류: {str(e).splitlines()[0]}"
    finally:
        driver.quit()
    return pd.DataFrame(rows, columns=list(fields)), error


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://quotes.toscrape.com/js/")
    ap.add_argument("--item", default="div.quote")
    ap.add_argument("--fields", default="text=span.text,author=small.author")
    ap.add_argument("--next", default="li.next > a")
    ap.add_argument("--max-pages", type=int, default=1)
    ap.add_argument("--out", default="dyn.xlsx")
    ap.add_argument("--chrome", default=None)
    a = ap.parse_args()
    df, err = scrape(a.url, a.item, parse_fields(a.fields), a.next, a.max_pages, a.chrome)
    if not df.empty:
        df.to_excel(a.out, index=False)
        print(f"{len(df)}건 저장: {a.out}")
    if err:
        print(err, file=sys.stderr)
        sys.exit(1)
    if df.empty:
        print("수집 결과 0건", file=sys.stderr)
        sys.exit(2)
