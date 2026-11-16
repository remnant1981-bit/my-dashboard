"""수주 전 점검 도구: 대상 URL이 robots.txt 상 자동 수집 가능한지 확인.
사용: python check_robots.py https://example.com/some/path [--ua MyBot]
종료 코드: 0 = 허용, 1 = 불허, 2 = 확인 불가(네트워크 오류 등)

※ robots.txt 허용 ≠ 수집해도 된다는 뜻이 아님. 이용약관·개인정보·저작권 확인은 별도임 (templates/legal_notes.md).
판정 규칙 (RFC 9309를 참고하되 일부러 더 보수적으로 처리)
  2xx            : robots.txt 내용을 파싱해 판정
  404/410 등 4xx : robots.txt 없음 -> 규칙상 허용 (약관 확인은 별도)
  401/403        : 접근 거부 -> 보수적으로 '불허' 처리 (RFC는 허용 가능으로 보지만 분쟁 소지 회피)
  5xx            : 서버 오류 -> '불허' 처리 (RFC 9309: 전체 불허로 간주)
"""
import argparse
import sys
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests

DEFAULT_UA = "data-collector-demo/1.0"
REMINDER = "※ robots.txt 허용은 약관·개인정보·저작권 검토를 대신하지 않음 (templates/legal_notes.md 참고)"


def evaluate(status: int, text: str, url: str, ua: str) -> dict:
    """robots.txt 응답(status, 본문)으로 url 수집 가능 여부를 판정."""
    result = {"url": url, "ua": ua, "status": status, "allowed": None, "crawl_delay": None,
              "sitemaps": [], "reason": ""}
    if 200 <= status < 300:
        rp = RobotFileParser()
        rp.parse(text.splitlines())
        allowed_ua = rp.can_fetch(ua, url)
        allowed_any = rp.can_fetch("*", url)
        result["allowed"] = bool(allowed_ua)
        result["crawl_delay"] = rp.crawl_delay(ua) or rp.crawl_delay("*")
        result["sitemaps"] = rp.site_maps() or []
        result["reason"] = ("robots.txt가 허용" if allowed_ua else "robots.txt가 해당 경로를 금지") + \
            ("" if allowed_ua == allowed_any else f" (UA '{ua}' 기준. '*' 기준은 {'허용' if allowed_any else '금지'})")
    elif status in (401, 403):
        result["allowed"] = False
        result["reason"] = f"robots.txt 접근 거부({status}) -> 보수적으로 불허 처리"
    elif 400 <= status < 500:
        result["allowed"] = True
        result["reason"] = f"robots.txt 없음({status}) -> 규칙상 제한 없음 (약관은 별도 확인)"
    else:
        result["allowed"] = False
        result["reason"] = f"robots.txt 서버 오류({status}) -> 불허로 간주"
    return result


def check(url: str, ua: str = DEFAULT_UA, session=None, timeout: int = 15) -> dict:
    parts = urlparse(url)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise ValueError(f"http(s) URL이 필요함: {url}")
    robots_url = f"{parts.scheme}://{parts.netloc}/robots.txt"
    http = session or requests
    try:
        res = http.get(robots_url, headers={"User-Agent": ua}, timeout=timeout)
    except requests.RequestException as e:
        return {"url": url, "ua": ua, "status": None, "allowed": None, "crawl_delay": None,
                "sitemaps": [], "reason": f"robots.txt 확인 실패: {e}"}
    out = evaluate(res.status_code, res.text if res.status_code < 400 else "", url, ua)
    out["robots_url"] = robots_url
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("url")
    ap.add_argument("--ua", default=DEFAULT_UA)
    a = ap.parse_args(argv)
    try:
        r = check(a.url, a.ua)
    except ValueError as e:
        print(e, file=sys.stderr)
        return 2
    label = {True: "허용", False: "불허", None: "확인 불가"}[r["allowed"]]
    print(f"[{label}] {r['url']}\n  사유: {r['reason']}")
    if r["crawl_delay"]:
        print(f"  Crawl-delay: {r['crawl_delay']}초 -> 요청 간격을 이 값 이상으로 설정할 것")
    if r["sitemaps"]:
        print(f"  Sitemap: {', '.join(r['sitemaps'][:3])}")
    print(REMINDER)
    return {True: 0, False: 1, None: 2}[r["allowed"]]


if __name__ == "__main__":
    sys.exit(main())
