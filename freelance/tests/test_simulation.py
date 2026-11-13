import importlib.util
from pathlib import Path

import numpy as np
import pytest

SIM = Path(__file__).resolve().parent.parent / "simulation" / "revenue_sim.py"


@pytest.fixture(scope="module")
def sim():
    spec = importlib.util.spec_from_file_location("revenue_sim", SIM)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def legacy_simulate(rng, base_inq, p0, pmax, reject, capacity_days, weeks):
    """체험 패키지 도입 전 모델의 사본. 기존 RESULTS.md 수치가 그대로 재현되는지 지키기 위한 기준."""
    prices, days, mix = np.array([8.0, 15.0, 30.0]), np.array([3, 5, 7]), np.array([0.5, 0.3, 0.2])
    net_rate = (1 - 0.20) * (1 - 0.033)
    reviews, cum_net, backlog_days = 0, 0.0, 0.0
    jobs, pending, reached = [], [], None
    for w in range(1, weeks + 1):
        n_inq = rng.poisson(base_inq * min(1 + 0.12 * reviews, 3.0))
        n_valid = rng.binomial(n_inq, 1 - reject)
        n_orders = rng.binomial(n_valid, min(p0 + 0.02 * reviews, pmax))
        for _ in range(n_orders):
            if backlog_days > 14:
                continue
            k = rng.choice(3, p=mix)
            jobs.append([float(days[k]), prices[k]])
            backlog_days += days[k]
        cap = capacity_days
        while jobs and cap > 0:
            used = min(cap, jobs[0][0])
            jobs[0][0] -= used
            cap -= used
            backlog_days -= used
            if jobs[0][0] <= 1e-9:
                price = jobs.pop(0)[1]
                if rng.random() < 0.95:
                    pending.append((w + 1, price * net_rate))
                if rng.random() < 0.70:
                    reviews += 1
        for item in [x for x in pending if x[0] <= w]:
            cum_net += item[1]
            pending.remove(item)
        if reached is None and cum_net >= 100.0:
            reached = w
    return cum_net, reached


@pytest.mark.parametrize("scenario", ["보수", "기본", "낙관"])
@pytest.mark.parametrize("capacity", [3, 6])
def test_base_model_unchanged_by_trial_feature(sim, scenario, capacity):
    b, p0, pmax, rej = sim.SCENARIOS[scenario]
    new_rng, old_rng = np.random.default_rng(42), np.random.default_rng(42)
    for _ in range(300):  # 같은 난수열에서 300회 연속 동일해야 함
        net, reached, _ = sim.simulate(new_rng, b, p0, pmax, rej, capacity, 26)
        old_net, old_reached = legacy_simulate(old_rng, b, p0, pmax, rej, capacity, 26)
        assert net == pytest.approx(old_net) and reached == old_reached


def test_with_trial_mix_is_valid(sim):
    for lift in (0.0, 0.3, 1.0):
        for c in (0.0, 0.5, 1.0):
            p = sim.with_trial(lift, c)
            assert sum(p.mix) == pytest.approx(1.0) and all(m >= 0 for m in p.mix)
            assert p.names[0] == "체험" and p.trial_index == 0 and p.prices[0] == sim.TRIAL_PRICE
    assert sim.with_trial(0.0, 0.0).mix[0] == 0  # 수주 증가도 잠식도 없으면 체험 비중 0
    assert sim.with_trial(0.0, 1.0).mix[1] == 0  # 잠식 100%면 STANDARD 비중 0


def _mean_net(sim, runs, **kw):
    b, p0, pmax, rej = sim.SCENARIOS["낙관"]
    rng = np.random.default_rng(7)
    return float(np.mean([sim.simulate(rng, b, p0, pmax, rej, 6, 26, **kw)[0] for _ in range(runs)]))


def test_trial_without_extra_orders_does_not_help(sim):
    # 수주가 늘지 않고 STANDARD만 체험으로 내려가면 평균 실수령은 현행보다 낮아야 함 (더 싼 상품으로 대체)
    assert _mean_net(sim, 3000, packages=sim.with_trial(0.0), conv_lift=0.0) < _mean_net(sim, 3000)


def test_more_orders_and_upsell_increase_net(sim):
    low = _mean_net(sim, 3000, packages=sim.with_trial(0.0), conv_lift=0.0)
    high = _mean_net(sim, 3000, packages=sim.with_trial(0.6), conv_lift=0.6)
    assert high > low * 1.2
    with_upsell = _mean_net(sim, 3000, packages=sim.with_trial(0.6), conv_lift=0.6, upsell=0.5)
    assert with_upsell > high


def test_reviews_are_reported_and_bounded(sim):
    b, p0, pmax, rej = sim.SCENARIOS["낙관"]
    net, reached, reviews = sim.simulate(np.random.default_rng(1), b, p0, pmax, rej, 6, 26,
                                         packages=sim.with_trial(0.3), conv_lift=0.3, upsell=0.2)
    assert net >= 0 and reviews >= 0 and (reached is None or 1 <= reached <= 26)
