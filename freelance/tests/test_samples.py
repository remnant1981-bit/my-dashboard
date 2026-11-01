import importlib.util
from pathlib import Path

import pandas as pd

SAMPLES = Path(__file__).resolve().parent.parent / "samples"


def load(name: str):
    spec = importlib.util.spec_from_file_location(name, SAMPLES / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_parse_extracts_items():
    html = (
        '<div class="quote"><span class="text">hi</span>'
        '<small class="author">A</small><a class="tag">x</a><a class="tag">y</a></div>'
    )
    rows = load("01_web_scraper").parse(html)
    assert rows == [{"text": "hi", "author": "A", "tags": "x,y"}]


def test_parse_empty_page():
    assert load("01_web_scraper").parse("<html></html>") == []


def test_excel_report_merges_files(tmp_path):
    d = tmp_path / "data"
    d.mkdir()
    pd.DataFrame({"a": [1, 2], "b": [3, 4]}).to_csv(d / "x.csv", index=False)
    pd.DataFrame({"a": [5], "b": [6]}).to_excel(d / "y.xlsx", index=False)
    out = tmp_path / "r.xlsx"
    load("02_excel_report").build(str(d), str(out))
    book = pd.read_excel(out, sheet_name=None)
    assert set(book) == {"원본", "요약"}
    assert len(book["원본"]) == 3


def test_excel_report_empty_dir_exits(tmp_path):
    import pytest

    (tmp_path / "e").mkdir()
    with pytest.raises(SystemExit):
        load("02_excel_report").build(str(tmp_path / "e"), str(tmp_path / "o.xlsx"))


def _run_watch(monkeypatch, bodies):
    """bodies 순서대로 응답을 돌려주며 watch를 실행. 소진되면 중단."""
    mod = load("03_scheduled_notify")
    msgs, it = [], iter(bodies)

    class Resp:
        def __init__(self, text):
            self.text = text

    def fake_get(url, timeout):
        return Resp(next(it))  # 소진 시 StopIteration

    def fake_sleep(_):
        pass

    monkeypatch.setattr(mod.requests, "get", fake_get)
    monkeypatch.setattr(mod.time, "sleep", fake_sleep)
    monkeypatch.setattr(mod, "notify", msgs.append)
    try:
        mod.watch("http://x", 1)
    except (StopIteration, RuntimeError):
        pass
    return msgs


def test_watch_notifies_only_on_change(monkeypatch):
    msgs = _run_watch(monkeypatch, ["a", "a", "b", "b"])
    assert len(msgs) == 1 and "변경 감지" in msgs[0]


def test_watch_no_notify_when_unchanged(monkeypatch):
    assert _run_watch(monkeypatch, ["a", "a", "a"]) == []
