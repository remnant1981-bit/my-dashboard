import importlib.util
import shutil
import threading
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

import pandas as pd
import pytest
import requests

SAMPLES = Path(__file__).resolve().parent.parent / "samples"


def load(name: str):
    spec = importlib.util.spec_from_file_location(name, SAMPLES / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------- 01 ----------
def test_parse_extracts_items():
    html = (
        '<div class="quote"><span class="text">hi</span>'
        '<small class="author">A</small><a class="tag"> x </a><a class="tag">y</a></div>'
    )
    assert load("01_web_scraper").parse(html) == [{"text": "hi", "author": "A", "tags": "x,y"}]


def test_parse_empty_page():
    assert load("01_web_scraper").parse("<html></html>") == []


def test_parse_missing_elements_do_not_crash():
    rows = load("01_web_scraper").parse('<div class="quote"><span class="text">a</span></div>')
    assert rows == [{"text": "a", "author": "", "tags": ""}]


def test_parse_korean_without_charset():
    # charset 헤더/메타가 없는 UTF-8 바이트도 한글이 깨지지 않아야 함
    html = '<div class="quote"><span class="text">안녕하세요 데이터</span></div>'.encode()
    assert load("01_web_scraper").parse(html)[0]["text"] == "안녕하세요 데이터"


def test_scrape_returns_partial_on_failure():
    mod = load("01_web_scraper")
    ok = '<div class="quote"><span class="text">a</span><small class="author">b</small></div>'

    class Resp:
        def __init__(self, status):
            self.status, self.content = status, ok.encode()

        def raise_for_status(self):
            if self.status >= 400:
                raise requests.HTTPError(f"{self.status}")

    class Sess:
        n = 0

        def get(self, url, **kw):
            self.n += 1
            return Resp(200 if self.n == 1 else 500)

    df, err = mod.scrape(3, delay=0, session=Sess())
    assert len(df) == 1 and "2페이지" in err


def test_save_without_extension(tmp_path):
    mod = load("01_web_scraper")
    mod.save(pd.DataFrame({"a": [1]}), str(tmp_path / "noext"))
    assert (tmp_path / "noext.csv").exists() and (tmp_path / "noext.xlsx").exists()


# ---------- 02 ----------
def test_excel_report_merges_files_and_adds_source(tmp_path):
    d = tmp_path / "data"
    d.mkdir()
    pd.DataFrame({"a": [1, 2], "b": [3, 4]}).to_csv(d / "x.csv", index=False)
    pd.DataFrame({"a": [5], "b": [6]}).to_excel(d / "y.xlsx", index=False)
    out = tmp_path / "r.xlsx"
    load("02_excel_report").build(str(d), str(out))
    book = pd.read_excel(out, sheet_name=None)
    assert set(book) == {"원본", "요약"}
    assert len(book["원본"]) == 3 and set(book["원본"]["출처파일"]) == {"x.csv", "y.xlsx"}


def test_excel_report_cp949_and_lockfile(tmp_path):
    d = tmp_path / "data"
    d.mkdir()
    (d / "k.csv").write_bytes("이름,금액\n가나다,10\n".encode("cp949"))
    (d / "~$lock.xlsx").write_bytes(b"junk")
    out = tmp_path / "r.xlsx"
    load("02_excel_report").build(str(d), str(out))
    assert pd.read_excel(out, sheet_name="원본")["이름"][0] == "가나다"


def test_excel_report_rerun_does_not_duplicate(tmp_path):
    d = tmp_path / "data"
    d.mkdir()
    pd.DataFrame({"a": [1, 2]}).to_csv(d / "x.csv", index=False)
    out = d / "report.xlsx"  # 출력 파일을 입력 폴더에 둠
    mod = load("02_excel_report")
    mod.build(str(d), str(out))
    mod.build(str(d), str(out))
    assert len(pd.read_excel(out, sheet_name="원본")) == 2


def test_excel_report_required_columns_skip(tmp_path):
    d = tmp_path / "data"
    d.mkdir()
    pd.DataFrame({"a": [1]}).to_csv(d / "good.csv", index=False)
    pd.DataFrame({"z": [1]}).to_csv(d / "bad.csv", index=False)
    warns = load("02_excel_report").build(str(d), str(tmp_path / "o.xlsx"), ["a"])
    assert len(warns) == 1 and "bad.csv" in warns[0]


def test_excel_report_empty_dir_exits(tmp_path):
    (tmp_path / "e").mkdir()
    with pytest.raises(SystemExit):
        load("02_excel_report").build(str(tmp_path / "e"), str(tmp_path / "o.xlsx"))


def test_display_width_korean():
    mod = load("02_excel_report")
    assert mod.display_width("가나") == 4 and mod.display_width("ab") == 2


# ---------- 03 ----------
class _Stop(Exception):
    pass


def _run_watch(monkeypatch, steps, selector=None):
    """steps: 응답(str) 또는 Exception 목록. 소진되면 _Stop 으로 중단."""
    mod = load("03_scheduled_notify")
    msgs, it = [], iter(steps)

    class Resp:
        def __init__(self, text):
            self.content = text.encode()

        def raise_for_status(self):
            pass

    def fake_get(url, **kw):
        try:
            s = next(it)
        except StopIteration:
            raise _Stop
        if isinstance(s, Exception):
            raise s
        return Resp(s)

    monkeypatch.setattr(mod.requests, "get", fake_get)
    monkeypatch.setattr(mod.time, "sleep", lambda _: None)
    monkeypatch.setattr(mod, "notify", msgs.append)
    with pytest.raises(_Stop):
        mod.watch("http://x", 1, selector)
    return msgs


def test_watch_notifies_only_on_change(monkeypatch):
    msgs = _run_watch(monkeypatch, ["a", "a", "b", "b"])
    assert len(msgs) == 1 and "변경 감지" in msgs[0]


def test_watch_no_notify_when_unchanged(monkeypatch):
    assert _run_watch(monkeypatch, ["a", "a", "a"]) == []


def test_watch_failure_is_not_change_and_not_spammy(monkeypatch):
    err = requests.ConnectionError("down")
    msgs = _run_watch(monkeypatch, ["a", err, err, err, "a"])
    assert [m.split(":")[0] for m in msgs] == ["수집 실패", "복구됨"]  # 실패 1회 + 복구, 오탐 없음


def test_watch_selector_ignores_noise(monkeypatch):
    p1 = '<div id="t">9</div><span>12:00:01</span>'
    p2 = '<div id="t">9</div><span>12:00:02</span>'
    p3 = '<div id="t">10</div><span>12:00:03</span>'
    msgs = _run_watch(monkeypatch, [p1, p2, p3], selector="div#t")
    assert len(msgs) == 1


def test_watch_rejects_bad_interval():
    with pytest.raises(ValueError):
        load("03_scheduled_notify").watch("http://x", 0)


# ---------- 04 (로컬 서버 + 실제 Chrome. Chrome/Selenium 없으면 skip) ----------
PAGE = """<html><body><div id="r"></div><script>
const q=new URLSearchParams(location.search).get('p')||'1';
setTimeout(()=>{{document.getElementById('r').innerHTML=
'<div class="quote"><span class="text">t{p}a</span><small class="author">u{p}</small></div>'+
'<div class="quote"><span class="text">t{p}b</span></div>'+
'<ul><li class="next"><a href="?p='+(Number(q)+1)+'">next</a></li></ul>'}},300);
</script></body></html>""".replace("{p}", "'+q+'")


def _find_chrome():
    for c in ("/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", shutil.which("google-chrome"),
              shutil.which("chromium")):
        if c and Path(c).exists():
            return c
    return None


@pytest.fixture
def local_site(tmp_path):
    (tmp_path / "index.html").write_text(PAGE, encoding="utf-8")
    handler = partial(SimpleHTTPRequestHandler, directory=str(tmp_path))
    handler.log_message = lambda *a, **k: None
    srv = HTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_port}/index.html"
    srv.shutdown()


def test_parse_fields():
    mod = load("04_dynamic_scraper_selenium")
    assert mod.parse_fields("a=div.x, b=span") == {"a": "div.x", "b": "span"}
    with pytest.raises(ValueError):
        mod.parse_fields("noequals")


@pytest.mark.skipif(_find_chrome() is None, reason="Chrome 없음")
def test_dynamic_scrape_pagination_and_missing_field(local_site):
    mod = load("04_dynamic_scraper_selenium")
    df, err = mod.scrape(local_site, "div.quote", {"text": "span.text", "author": "small.author"},
                         next_sel="li.next > a", max_pages=2, chrome=_find_chrome(), timeout=10)
    assert err is None
    assert len(df) == 4  # 2페이지 x 2건
    assert (df["author"] == "").sum() == 2  # 두 번째 항목은 author 없음 → 빈 값


@pytest.mark.skipif(_find_chrome() is None, reason="Chrome 없음")
def test_dynamic_scrape_timeout_reports_error(local_site):
    mod = load("04_dynamic_scraper_selenium")
    df, err = mod.scrape(local_site, "div.nothing", {"t": "span"}, chrome=_find_chrome(), timeout=2)
    assert df.empty and "미표시" in err
