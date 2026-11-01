"""샘플 3: 주기 실행 + 변경 감지 알림 (페이지 내용이 바뀌면 알림)
사용: python 03_scheduled_notify.py --url https://example.com --interval 600
알림은 notify()를 슬랙 웹훅/텔레그램/메일로 교체해서 사용.
"""
import argparse
import hashlib
import time

import requests


def notify(msg: str) -> None:
    print(f"[알림] {msg}")  # 납품 시 슬랙/텔레그램/SMTP로 교체


def watch(url: str, interval: int) -> None:
    last = None
    while True:
        try:
            body = requests.get(url, timeout=10).text
            h = hashlib.sha256(body.encode()).hexdigest()
            if last and h != last:
                notify(f"변경 감지: {url}")
            last = h
        except requests.RequestException as e:
            notify(f"수집 실패: {e}")
        time.sleep(interval)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--interval", type=int, default=600)
    a = ap.parse_args()
    watch(a.url, a.interval)
