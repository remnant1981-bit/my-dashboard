import datetime as dt
import importlib.util
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

SIMDIR = Path(__file__).resolve().parent.parent / "simulation"
TEMPLATE = Path(__file__).resolve().parent.parent / "tracking" / "log_template.csv"
HEADER = "날짜,채널,유형,패키지,판매금액(만원),비고\n"


@pytest.fixture(scope="module")
def cal():
    sys.path.insert(0, str(SIMDIR))
    spec = importlib.util.spec_from_file_location("calibrate", SIMDIR / "calibrate.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def write(tmp_path, rows, encoding="utf-8-sig", name="log.csv"):
    p = tmp_path / name
    p.write_text(HEADER + "\n".join(rows) + "\n", encoding=encoding)
    return p


def synthetic_rows(weeks=8, inq_per_week=4, start=dt.date(2026, 12, 1)):
    """주당 문의 4건, 그중 0.5건 거절, 신규 수주 1건(체험·DELUXE 번갈아), 완료·리뷰, 체험 2건마다 재의뢰 1건."""
    rows, trial_done = [], 0
    for w in range(weeks):
        d = start + dt.timedelta(days=7 * w)
        for i in range(inq_per_week):
            rows.append(f"{d + dt.timedelta(days=i)},크몽,문의,,,")
        if w % 2 == 0:
            rows.append(f"{d + dt.timedelta(days=1)},크몽,거절,,,약관")
        pkg, price = ("체험", 4) if w % 2 == 0 else ("DELUXE", 15)
        rows.append(f"{d + dt.timedelta(days=2)},크몽,수주,{pkg},{price},")
        rows.append(f"{d + dt.timedelta(days=5)},크몽,완료,{pkg},{price},")
        rows.append(f"{d + dt.timedelta(days=6)},크몽,리뷰,{pkg},,")
        if pkg == "체험":
            trial_done += 1
            if trial_done % 2 == 0:
                rows.append(f"{d + dt.timedelta(days=6)},크몽,수주,PREMIUM,30,체험 고객")
                rows.append(f"{d + dt.timedelta(days=6)},크몽,재의뢰,PREMIUM,,")
    return rows


def test_template_has_exact_header_and_no_data():
    text = TEMPLATE.read_text(encoding="utf-8-sig")
    assert text == HEADER


def test_read_log_accepts_cp949_and_drops_blank_rows(cal, tmp_path):
    p = write(tmp_path, ["2026-12-01,크몽,문의,,,", ",,,,,", "2026-12-02,숨고,문의,,,"], encoding="cp949")
    df = cal.read_log(p)
    assert len(df) == 2 and list(df["채널"]) == ["크몽", "숨고"]


def test_read_log_reports_all_errors_with_line_numbers(cal, tmp_path):
    p = write(tmp_path, [
        "2026/12/01,크몽,문의,,,",          # 2행: 날짜 형식
        "2026-12-02,크몽,주문,,,",           # 3행: 유형 오류
        "2026-12-03,크몽,수주,,,",           # 4행: 패키지 누락
        "2026-12-04,크몽,완료,DELUXE,,",     # 5행: 금액 누락
        "2026-12-05,크몽,완료,DELUXE,-3,",   # 6행: 음수 금액
    ])
    with pytest.raises(ValueError) as e:
        cal.read_log(p)
    msg = str(e.value)
    for line in ("2행", "3행", "4행", "5행", "6행"):
        assert line in msg


def test_read_log_rejects_missing_columns(cal, tmp_path):
    p = tmp_path / "bad.csv"
    p.write_text("날짜,유형\n2026-12-01,문의\n", encoding="utf-8")
    with pytest.raises(ValueError, match="필수 열"):
        cal.read_log(p)


def test_estimate_recovers_known_rates(cal, tmp_path):
    df = cal.read_log(write(tmp_path, synthetic_rows()))
    est = cal.estimate(df, start=dt.date(2026, 12, 1), until=dt.date(2027, 1, 25))  # 56일 = 8주
    assert est.weeks == pytest.approx(8.0)
    assert est.n["문의"] == 32 and est.n["거절"] == 4 and est.n["재의뢰"] == 2 and est.n["수주"] == 10
    assert est.inq_rate == pytest.approx(4.0)
    assert est.reject == pytest.approx(4 / 32)
    assert est.conv == pytest.approx(8 / 28)  # 신규 수주(10-2) / 유효 문의(32-4)
    assert est.conv_ci[0] < est.conv < est.conv_ci[1]
    assert est.inq_rate_ci[0] < 4.0 < est.inq_rate_ci[1]
    assert est.with_trial is True and est.upsell == pytest.approx(2 / 4)
    assert sum(est.mix) == pytest.approx(1.0)
    # 가격: 체험 4, STANDARD(기록 없음) 기본 8, DELUXE 15, PREMIUM 기본 30
    assert est.prices == pytest.approx((4.0, 8.0, 15.0, 30.0))
    # 실수령 = 체험 4건 + DELUXE 4건의 공식 수수료·원천징수 차감 후 합계 (PREMIUM 재의뢰는 아직 미완료)
    assert est.net_now == pytest.approx(4 * cal.sim.net_of(4.0) + 4 * cal.sim.net_of(15.0))
    assert est.reviews_now == 8
    # 예측에 쓰는 값은 실측과 기본 가정 사이 (기본 가정 쪽으로 축소)
    assert est.conv_used == pytest.approx((8 + 0.15 * 10) / (28 + 10))
    assert est.reject_used == pytest.approx((4 + 0.20 * 10) / (32 + 10))
    assert est.upsell_used == pytest.approx((2 + 0.10 * 5) / (4 + 5))
    assert 0.15 < est.conv_used < est.conv  # 실측 28.6%와 기본 15% 사이
    assert 0.10 < est.upsell_used < est.upsell  # 실측 50%와 기본 10% 사이
    # 리뷰 효과를 되돌린 기준값은 관측값보다 작아야 함
    assert 0 < est.base_inq < est.inq_rate and est.p0 < est.conv_used


def test_estimate_without_trial_uses_three_packages(cal, tmp_path):
    rows = ["2026-12-01,크몽,문의,,,", "2026-12-02,크몽,수주,STANDARD,8,", "2026-12-05,크몽,완료,STANDARD,9,"]
    est = cal.estimate(cal.read_log(write(tmp_path, rows)))
    assert est.with_trial is False and len(est.mix) == 3 and est.prices[0] == pytest.approx(9.0)
    assert any("표본이 작음" in w for w in est.warnings)


def test_estimate_handles_no_inquiries(cal, tmp_path):
    est = cal.estimate(cal.read_log(write(tmp_path, ["2026-12-05,크몽,리뷰,,,"])))
    assert est.conv is None and est.reject == pytest.approx(0.2)
    assert any("전환율을 추정할 수 없음" in w for w in est.warnings)


def test_until_before_start_is_error(cal, tmp_path):
    df = cal.read_log(write(tmp_path, ["2026-12-05,크몽,문의,,,"]))
    with pytest.raises(ValueError):
        cal.estimate(df, start=dt.date(2026, 12, 10), until=dt.date(2026, 12, 1))


def test_forecast_is_ordered_and_includes_recorded_net(cal, tmp_path):
    est = cal.estimate(cal.read_log(write(tmp_path, synthetic_rows())))
    fc = cal.forecast(est, weeks=12, runs=600)
    assert [r["구분"] for r in fc] == ["문의율 하한(90%)", "문의율 추정", "문의율 상한(90%)"]
    medians = [r["중앙"] for r in fc]
    assert medians == sorted(medians)  # 문의율이 높을수록 실수령 중앙값이 큼
    assert all(r["p10"] >= est.net_now - 1e-9 for r in fc)  # 기록된 실수령에서 출발
    assert cal.sim.TARGET == 100.0  # 목표 변경이 전역 상태에 남지 않음


def test_forecast_target_already_reached(cal, tmp_path):
    rows = [f"2026-12-0{i},크몽,완료,PREMIUM,200," for i in range(1, 3)]
    est = cal.estimate(cal.read_log(write(tmp_path, rows)))
    fc = cal.forecast(est, weeks=4, runs=100)
    assert all(r["목표 달성 확률"] == 1.0 for r in fc)


def test_main_writes_report_and_fails_cleanly(cal, tmp_path, capsys):
    log = write(tmp_path, synthetic_rows())
    out = tmp_path / "report.md"
    assert cal.main([str(log), "--start", "2026-12-01", "--weeks", "8", "--runs", "200", "--out", str(out)]) == 0
    text = out.read_text(encoding="utf-8")
    assert "## 기록 집계" in text and "## 예측" in text and "문의율 추정" in text
    bad = write(tmp_path, ["2026-12-01,크몽,주문,,,"], name="bad.csv")
    assert cal.main([str(bad)]) == 2
    assert "허용되지 않음" in capsys.readouterr().err
    assert cal.main([str(tmp_path / "none.csv")]) == 2


def test_small_sample_extremes_are_shrunk(cal, tmp_path):
    # 문의 2건 중 1건 거절, 1건 수주 = 실측 전환율 100%, 재의뢰율 100% -> 그대로 쓰면 예측이 크게 부풀려짐
    rows = ["2026-12-02,크몽,문의,,,", "2026-12-03,크몽,문의,,,", "2026-12-03,크몽,거절,,,",
            "2026-12-04,크몽,수주,체험,4,", "2026-12-07,크몽,완료,체험,4,",
            "2026-12-20,크몽,수주,DELUXE,15,", "2026-12-20,크몽,재의뢰,DELUXE,,"]
    est = cal.estimate(cal.read_log(write(tmp_path, rows)))
    assert est.conv == 1.0 and est.upsell == 1.0
    assert est.conv_used == pytest.approx((1 + 1.5) / (1 + 10))  # 약 23%
    assert est.upsell_used == pytest.approx((1 + 0.5) / (1 + 5))  # 25%
    assert est.conv_used < 0.3 and est.upsell_used < 0.3


def test_large_sample_converges_to_observed(cal, tmp_path):
    est = cal.estimate(cal.read_log(write(tmp_path, synthetic_rows(weeks=60))))
    assert abs(est.conv_used - est.conv) < 0.02 and abs(est.reject_used - est.reject) < 0.02
