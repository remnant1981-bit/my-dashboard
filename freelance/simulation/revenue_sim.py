"""수익 시뮬레이션 (몬테카를로). 모든 입력값은 '가정'이며 실측 데이터가 아님.
사용: python revenue_sim.py [--runs 10000] [--seed 42]
모델(주 단위):
  문의 ~ Poisson(기본문의율 x (1 + 0.12 x 리뷰수), 최대 3배)
  유효문의 = 문의 x (1 - 거절률)            # 로그인/개인정보/약관 위험건 거절
  수주 ~ Binomial(유효문의, min(p0 + 0.02 x 리뷰수, pmax) x (1 + 수주증가율))
  패키지 믹스(기본): STANDARD 50% / DELUXE 30% / PREMIUM 20%  (가격 8/15/30만, 작업일 3/5/7)
  작업은 주당 가용 작업일(capacity)만큼 FIFO로 처리, 대기 작업일이 상한 초과 시 신규 수주 거절
  완료 시 95% 정산(5%는 환불/분쟁), 정산은 완료 1주 후, 수수료 20%, 원천징수 3.3%
  완료 건의 70%가 리뷰를 남김 -> 이후 문의율/전환율 상승

체험 패키지(4만원, 작업 1.5일)를 넣을 때의 추가 가정:
  수주증가율(lift) : 체험 덕분에 늘어나는 수주 비율(문의 증가 + 전환 증가의 합산 효과). 늘어난 수주는 전부 체험.
  잠식률(cannibal) : 기존 STANDARD 수주 중 체험으로 내려가는 비율 (기본 50%)
  재의뢰율(upsell) : 체험 완료 고객이 2주 뒤 상위 패키지를 다시 주문할 확률
  -> 이 세 값은 근거 데이터가 없음. 결과는 '체험이 이득이 되려면 수주가 얼마나 늘어야 하는가'를 보는 용도임.
"""
import argparse
from dataclasses import dataclass

import numpy as np

FEE, TAX = 0.20, 0.033
NET_RATE = (1 - FEE) * (1 - TAX)
TARGET = 100.0  # 만원 실수령
BACKLOG_LIMIT = 14  # 대기 작업일 상한

SCENARIOS = {
    # 이름: (신규 판매자 주당 기본 문의, 초기 전환율 p0, 전환율 상한 pmax, 거절률)
    "보수": (0.3, 0.10, 0.25, 0.25),
    "기본": (0.7, 0.15, 0.30, 0.20),
    "낙관": (1.5, 0.20, 0.35, 0.15),
}


@dataclass(frozen=True)
class Packages:
    names: tuple
    prices: tuple  # 만원
    days: tuple  # 작업일
    mix: tuple  # 수주 비중 (합 1)
    trial_index: int | None = None  # 체험 패키지 위치 (없으면 None)


BASE = Packages(("STANDARD", "DELUXE", "PREMIUM"), (8.0, 15.0, 30.0), (3.0, 5.0, 7.0), (0.5, 0.3, 0.2))
TRIAL_PRICE, TRIAL_DAYS = 4.0, 1.5


def with_trial(lift: float, cannibal: float = 0.5) -> Packages:
    """체험 패키지를 추가한 구성. 늘어난 수주(lift)는 전부 체험, STANDARD의 cannibal 비율이 체험으로 이동."""
    s, d, p = BASE.mix
    total = 1 + lift
    mix = ((lift + s * cannibal) / total, s * (1 - cannibal) / total, d / total, p / total)
    return Packages(("체험",) + BASE.names, (TRIAL_PRICE,) + BASE.prices, (TRIAL_DAYS,) + BASE.days, mix, 0)


def simulate(rng, base_inq, p0, pmax, reject, capacity_days, weeks,
             packages: Packages = BASE, conv_lift: float = 0.0, upsell: float = 0.0):
    """한 번의 시뮬레이션. (26주 누적 실수령, 목표 달성 주 또는 None, 리뷰 수) 반환.
    packages=BASE, conv_lift=0, upsell=0 이면 체험 패키지 도입 전 모델과 난수 호출 순서까지 동일함."""
    mix = np.array(packages.mix)
    base_mix = np.array(BASE.mix)
    reviews, cum_net, backlog_days = 0, 0.0, 0.0
    jobs = []  # [남은 작업일, 가격, 체험 여부]
    pending = []  # (정산 주, 금액)
    followups = []  # (투입 주, 작업일, 가격) - 체험 후 재의뢰
    reached = None
    for w in range(1, weeks + 1):
        lam = base_inq * min(1 + 0.12 * reviews, 3.0)
        n_inq = rng.poisson(lam)
        n_valid = rng.binomial(n_inq, 1 - reject)
        p_conv = min(min(p0 + 0.02 * reviews, pmax) * (1 + conv_lift), 1.0)
        n_orders = rng.binomial(n_valid, p_conv)
        for _ in range(n_orders):
            if backlog_days > BACKLOG_LIMIT:  # 수용 한도 초과 -> 거절
                continue
            k = rng.choice(len(mix), p=mix)
            jobs.append([float(packages.days[k]), packages.prices[k], k == packages.trial_index])
            backlog_days += packages.days[k]
        for item in [f for f in followups if f[0] <= w]:
            followups.remove(item)
            if backlog_days <= BACKLOG_LIMIT:
                jobs.append([item[1], item[2], False])
                backlog_days += item[1]
        cap = capacity_days
        while jobs and cap > 0:
            used = min(cap, jobs[0][0])
            jobs[0][0] -= used
            cap -= used
            backlog_days -= used
            if jobs[0][0] <= 1e-9:
                _, price, is_trial = jobs.pop(0)
                if rng.random() < 0.95:
                    pending.append((w + 1, price * NET_RATE))
                if rng.random() < 0.70:
                    reviews += 1
                if is_trial and upsell > 0 and rng.random() < upsell:
                    j = rng.choice(len(base_mix), p=base_mix)
                    followups.append((w + 2, float(BASE.days[j]), BASE.prices[j]))
        for item in [x for x in pending if x[0] <= w]:
            cum_net += item[1]
            pending.remove(item)
        if reached is None and cum_net >= TARGET:
            reached = w
    return cum_net, reached, reviews


def summarize(nets, reach, reviews):
    nets, reach, reviews = np.array(nets), np.array(reach), np.array(reviews)
    return {
        "P(<=4주)": float((reach <= 4).mean()),
        "P(<=8주)": float((reach <= 8).mean()),
        "P(<=12주)": float((reach <= 12).mean()),
        "P(<=26주)": float((reach <= 26).mean()),
        "달성 주 중앙값": None if (reach <= 26).mean() < 0.5 else float(np.median(reach)),
        "26주 실수령 p10/중앙/p90": (np.percentile(nets, 10), np.median(nets), np.percentile(nets, 90)),
        "26주 실수령 평균": float(nets.mean()),
        "26주 리뷰 수 평균": float(reviews.mean()),
    }


def run(runs, seed, capacity_days, weeks=26, packages: Packages = BASE, conv_lift=0.0, upsell=0.0,
        scenarios=None):
    out = {}
    for name, (b, p0, pmax, rej) in (scenarios or SCENARIOS).items():
        rng = np.random.default_rng(seed)
        nets, reach, revs = [], [], []
        for _ in range(runs):
            net, r, rv = simulate(rng, b, p0, pmax, rej, capacity_days, weeks, packages, conv_lift, upsell)
            nets.append(net)
            reach.append(r if r is not None else np.inf)
            revs.append(rv)
        out[name] = summarize(nets, reach, revs)
    return out


# 체험 패키지 비교 구성: (표시 이름, 수주증가율, 재의뢰율). None 은 체험 없음(현행).
TRIAL_CONFIGS = [
    ("체험 없음 (현행)", None, 0.0),
    ("체험, 수주 +0%", 0.0, 0.0),
    ("체험, 수주 +30%", 0.3, 0.0),
    ("체험, 수주 +60%", 0.6, 0.0),
    ("체험, 수주 +100%", 1.0, 0.0),
    ("체험, 수주 +30%, 재의뢰 20%", 0.3, 0.2),
    ("체험, 수주 +60%, 재의뢰 20%", 0.6, 0.2),
]


def run_trial_comparison(runs, seed, capacity_days, scenario_names=("기본", "낙관")):
    scen = {k: SCENARIOS[k] for k in scenario_names}
    rows = []
    for label, lift, upsell in TRIAL_CONFIGS:
        if lift is None:
            res = run(runs, seed, capacity_days, scenarios=scen)
        else:
            res = run(runs, seed, capacity_days, packages=with_trial(lift), conv_lift=lift, upsell=upsell,
                      scenarios=scen)
        rows.append((label, res))
    return rows


def print_base(runs, seed):
    for cap in (3, 6):
        print(f"\n## 주당 가용 작업일 {cap}일 (등록 후 26주, {runs}회, 목표 실수령 {TARGET:.0f}만원)")
        print("| 시나리오 | 4주 | 8주 | 12주 | 26주 | 달성 주 중앙값 | 26주 실수령 p10 / 중앙 / p90(만원) |")
        print("|---|---|---|---|---|---|---|")
        for name, r in run(runs, seed, cap).items():
            p10, med, p90 = r["26주 실수령 p10/중앙/p90"]
            med_w = "미달(과반 미만)" if r["달성 주 중앙값"] is None else f"{r['달성 주 중앙값']:.0f}주"
            print(f"| {name} | {r['P(<=4주)']:.0%} | {r['P(<=8주)']:.0%} | {r['P(<=12주)']:.0%} | "
                  f"{r['P(<=26주)']:.0%} | {med_w} | {p10:.0f} / {med:.0f} / {p90:.0f} |")


def print_trial(runs, seed, capacity_days=6):
    rows = run_trial_comparison(runs, seed, capacity_days)
    for scen in ("기본", "낙관"):
        print(f"\n## 체험 패키지 비교 — {scen} 시나리오 (가용 {capacity_days}일/주, 26주, {runs}회)")
        print("| 구성 | 12주 내 100만 | 26주 내 100만 | 26주 실수령 평균 | p10 / 중앙 / p90(만원) | 26주 리뷰 수 평균 |")
        print("|---|---|---|---|---|---|")
        for label, res in rows:
            r = res[scen]
            p10, med, p90 = r["26주 실수령 p10/중앙/p90"]
            print(f"| {label} | {r['P(<=12주)']:.0%} | {r['P(<=26주)']:.0%} | {r['26주 실수령 평균']:.0f} | "
                  f"{p10:.0f} / {med:.0f} / {p90:.0f} | {r['26주 리뷰 수 평균']:.1f} |")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=10000)
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args()
    print_base(a.runs, a.seed)
    print_trial(a.runs, a.seed)
