"""샘플 3: 주기 확인 + 변경 감지 알림
사용: python 03_scheduled_notify.py --url https://example.com --interval 600 [--selector "div#price"]
- HTTP 오류(4xx/5xx)는 '변경'으로 보지 않고 실패로 처리, 실패 알림은 연속 시 1회만 발송
- --selector 지정 시 해당 영역 텍스트만 비교 (타임스탬프 등 잡음 제거)
- 알림은 notify()를 슬랙 웹훅/텔레그램/메일로 교체해서 사용 (templates/notify_examples.md 참고)
- 상시 실행은 OS 스케줄러/서비스 등록 필요 (templates/delivery_guide.md 참고)
"""
import argparse
import hashlib
import time

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; change-watcher/1.0)"}


def notify(msg: str) -> None:
    print(f"[알림] {msg}", flush=True)  # 납품 시 슬랙/텔레그램/SMTP로 교체


def fingerprint(html: bytes, selector: str | None) -> str:
    if selector:
        node = BeautifulSoup(html, "html.parser").select_one(selector)
        if node is None:
            raise ValueError(f"선택자 '{selector}' 영역을 찾을 수 없음")
        data = node.get_text(" ", strip=True).encode()
    else:
        data = html
    return hashlib.sha256(data).hexdigest()


def watch(url: str, interval: int, selector: str | None = None, once: bool = False) -> None:
    if interval <= 0:
        raise ValueError("interval은 1 이상이어야 함")
    last, failing = None, False
    try:
        while True:
            try:
                res = requests.get(url, headers=HEADERS, timeout=10)
                res.raise_for_status()
                h = fingerprint(res.content, selector)
                if failing:
                    notify(f"복구됨: {url}")
                    failing = False
                if last is not None and h != last:
                    notify(f"변경 감지: {url}")
                last = h
            except (requests.RequestException, ValueError) as e:
                if not failing:  # 연속 실패 시 알림 폭주 방지
                    notify(f"수집 실패: {e}")
                failing = True
            if once:
                return
            time.sleep(interval)
    except KeyboardInterrupt:
        print("종료")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--interval", type=int, default=600)
    ap.add_argument("--selector", default=None)
    a = ap.parse_args()
    watch(a.url, a.interval, a.selector)
