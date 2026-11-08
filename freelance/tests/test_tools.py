import importlib.util
from pathlib import Path

import pytest
import requests

TOOLS = Path(__file__).resolve().parent.parent / "tools"


def load():
    spec = importlib.util.spec_from_file_location("check_robots", TOOLS / "check_robots.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


ROBOTS = """User-agent: *
Disallow: /private/
Crawl-delay: 3
Sitemap: https://ex.com/sitemap.xml

User-agent: BadBot
Disallow: /
"""


def test_allowed_and_disallowed_paths_with_crawl_delay():
    m = load()
    ok = m.evaluate(200, ROBOTS, "https://ex.com/public/a", "MyBot")
    assert ok["allowed"] is True and ok["crawl_delay"] == 3 and ok["sitemaps"] == ["https://ex.com/sitemap.xml"]
    bad = m.evaluate(200, ROBOTS, "https://ex.com/private/a", "MyBot")
    assert bad["allowed"] is False and "금지" in bad["reason"]


def test_ua_specific_block_is_reported():
    m = load()
    r = m.evaluate(200, ROBOTS, "https://ex.com/public/a", "BadBot")
    assert r["allowed"] is False and "'*' 기준은 허용" in r["reason"]


def test_status_code_policy_is_conservative():
    m = load()
    assert m.evaluate(404, "", "https://ex.com/a", "x")["allowed"] is True  # robots 없음
    assert m.evaluate(403, "", "https://ex.com/a", "x")["allowed"] is False  # 접근 거부 -> 보수적 불허
    assert m.evaluate(401, "", "https://ex.com/a", "x")["allowed"] is False
    assert m.evaluate(503, "", "https://ex.com/a", "x")["allowed"] is False  # 서버 오류 -> 불허


class FakeSession:
    def __init__(self, status=200, text="", exc=None):
        self.status, self.text, self.exc, self.seen = status, text, exc, None

    def get(self, url, headers=None, timeout=None):
        self.seen = (url, headers)
        if self.exc:
            raise self.exc

        class R:
            pass

        r = R()
        r.status_code, r.text = self.status, self.text
        return r


def test_check_builds_robots_url_and_sends_user_agent():
    m = load()
    s = FakeSession(200, ROBOTS)
    r = m.check("https://ex.com/public/page?x=1", ua="MyBot", session=s)
    assert s.seen[0] == "https://ex.com/robots.txt" and s.seen[1]["User-Agent"] == "MyBot"
    assert r["allowed"] is True


def test_check_network_error_is_unknown_not_allowed():
    m = load()
    r = m.check("https://ex.com/a", session=FakeSession(exc=requests.ConnectionError("down")))
    assert r["allowed"] is None and "확인 실패" in r["reason"]


def test_check_rejects_non_http_url():
    m = load()
    with pytest.raises(ValueError):
        m.check("ftp://ex.com/a")
    with pytest.raises(ValueError):
        m.check("not a url")


def test_main_exit_codes(monkeypatch, capsys):
    m = load()
    monkeypatch.setattr(m, "check", lambda url, ua: {"url": url, "ua": ua, "status": 200, "allowed": True,
                                                    "crawl_delay": 2, "sitemaps": [], "reason": "ok"})
    assert m.main(["https://ex.com/a"]) == 0
    assert "Crawl-delay: 2" in capsys.readouterr().out
    monkeypatch.setattr(m, "check", lambda url, ua: {"url": url, "ua": ua, "status": 403, "allowed": False,
                                                    "crawl_delay": None, "sitemaps": [], "reason": "no"})
    assert m.main(["https://ex.com/a"]) == 1
    monkeypatch.setattr(m, "check", lambda url, ua: {"url": url, "ua": ua, "status": None, "allowed": None,
                                                    "crawl_delay": None, "sitemaps": [], "reason": "fail"})
    assert m.main(["https://ex.com/a"]) == 2
    assert m.main(["bad-url"]) == 2
