"""샘플 4: JS로 렌더링되는 동적 페이지 수집 (Selenium, headless Chrome)
데모 대상: https://quotes.toscrape.com/js/ (JS로 목록을 그리는 공개 데모 사이트)
사용: python 04_dynamic_scraper_selenium.py --url https://quotes.toscrape.com/js/ --out dyn.xlsx
옵션: --chrome 경로 지정 시 해당 Chrome 바이너리 사용 (미지정 시 시스템 기본)
"""
import argparse

import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def make_driver(chrome: str | None = None) -> webdriver.Chrome:
    opt = Options()
    opt.add_argument("--headless=new")
    opt.add_argument("--no-sandbox")
    opt.add_argument("--disable-dev-shm-usage")
    if chrome:
        opt.binary_location = chrome
    return webdriver.Chrome(options=opt)


def scrape(url: str, item_sel: str = "div.quote", chrome: str | None = None) -> pd.DataFrame:
    driver = make_driver(chrome)
    try:
        driver.get(url)
        # JS 렌더링 완료까지 대기 (고정 sleep 대신 요소 대기)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, item_sel))
        )
        rows = []
        for el in driver.find_elements(By.CSS_SELECTOR, item_sel):
            rows.append({
                "text": el.find_element(By.CSS_SELECTOR, "span.text").text,
                "author": el.find_element(By.CSS_SELECTOR, "small.author").text,
            })
        return pd.DataFrame(rows)
    finally:
        driver.quit()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://quotes.toscrape.com/js/")
    ap.add_argument("--out", default="dyn.xlsx")
    ap.add_argument("--chrome", default=None)
    a = ap.parse_args()
    df = scrape(a.url, chrome=a.chrome)
    df.to_excel(a.out, index=False)
    print(f"{len(df)}건 저장: {a.out}")
