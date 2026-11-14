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


def legacy_simulate(rng, base_inq, p0, pmax, reject, capacity_days, weeks, net_of):
    """체험 패키지 도입 전 모델의 사본 (3단 패키지, 재의뢰 없음). 체험 기능이 기본 모델을 바꾸지 않는지 지키는 기준.
    건당 실수령 계산(net_of)만 현재 수수료 함수를 주입받음."""
    prices, days, mix = np.array([8.0, 15.0, 30.0]), np.array([3, 5, 7]), np.array([0.5, 0.3, 0.2])
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
                    pending.append((w + 1, net_of(float(price))))
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
        old_net, old_reached = legacy_simulate(old_rng, b, p0, pmax, rej, capacity, 26, sim.net_of)
        assert net == pytest.approx(old_net) and reached == old_reached


def test_platform_fee_matches_kmong_official_example(sim):
    # 크몽 '판매 수수료 정책' 공식 예시: 3,500,000원 판매 시
    #   서비스 이용료 303,000 (70만x16.4% + 130만x9.4% + 150만x4.4%), 결제망 이용료 115,500, 부가세 41,850
    #   -> 판매 금액 - 수수료 = 3,039,650원
    fee = sim.platform_fee(350.0)  # 단위: 만원
    assert fee == pytest.approx(46.035)
    assert 350.0 - fee == pytest.approx(303.965)


def test_platform_fee_tiers(sim):
    # 70만원 이하 건: (16.4% + 3.3%) x 1.1 = 21.67%
    for price in (4.0, 8.0, 15.0, 30.0, 70.0):
        assert sim.platform_fee(price) == pytest.approx(price * 0.2167)
    # 구간 경계를 넘으면 초과분에만 낮은 요율 적용 (100만원: 70만x16.4% + 30만x9.4%)
    assert sim.platform_fee(100.0) == pytest.approx((70 * 0.164 + 30 * 0.094 + 100 * 0.033) * 1.1)
    # 실수령은 판매 금액보다 작고, 금액이 커질수록 늘어남
    nets = [sim.net_of(p) for p in (4.0, 8.0, 15.0, 30.0, 100.0, 350.0)]
    assert nets == sorted(nets) and all(n < p for n, p in zip(nets, (4.0, 8.0, 15.0, 30.0, 100.0, 350.0)))


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
