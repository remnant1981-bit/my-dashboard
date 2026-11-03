"""수익 시뮬레이션 (몬테카를로). 모든 입력값은 '가정'이며 실측 데이터가 아님.
사용: python revenue_sim.py [--runs 10000] [--seed 42]
모델(주 단위):
  문의 ~ Poisson(기본문의율 x (1 + 0.12 x 리뷰수), 최대 3배)
  유효문의 = 문의 x (1 - 거절률)            # 로그인/개인정보/약관 위험건 거절
  수주 ~ Binomial(유효문의, min(p0 + 0.02 x 리뷰수, pmax))
  패키지 믹스: STANDARD 50% / DELUXE 30% / PREMIUM 20%  (가격 8/15/30만, 작업일 3/5/7)
  작업은 주당 가용 작업일(capacity)만큼 FIFO로 처리, 대기 작업일이 상한 초과 시 신규 수주 거절
  완료 시 95% 정산(5%는 환불/분쟁), 정산은 완료 1주 후, 수수료 20%, 원천징수 3.3%
  완료 건의 70%가 리뷰를 남김 -> 이후 문의율/전환율 상승
"""
import argparse

import numpy as np

PRICES = np.array([8.0, 15.0, 30.0])  # 만원
DAYS = np.array([3, 5, 7])
MIX = np.array([0.5, 0.3, 0.2])
FEE, TAX = 0.20, 0.033
NET_RATE = (1 - FEE) * (1 - TAX)
TARGET = 100.0  # 만원 실수령

SCENARIOS = {
    # 이름: (신규 판매자 주당 기본 문의, 초기 전환율 p0, 전환율 상한 pmax, 거절률)
    "보수": (0.3, 0.10, 0.25, 0.25),
    "기본": (0.7, 0.15, 0.30, 0.20),
    "낙관": (1.5, 0.20, 0.35, 0.15),
}


def simulate(rng, base_inq, p0, pmax, reject, capacity_days, weeks):
    reviews, cum_net, backlog_days = 0, 0.0, 0.0
    jobs = []  # [남은 작업일, 가격]
    pending = []  # (정산 주, 금액)
    reached = None
    for w in range(1, weeks + 1):
        lam = base_inq * min(1 + 0.12 * reviews, 3.0)
        n_inq = rng.poisson(lam)
        n_valid = rng.binomial(n_inq, 1 - reject)
        p_conv = min(p0 + 0.02 * reviews, pmax)
        n_orders = rng.binomial(n_valid, p_conv)
        for _ in range(n_orders):
            if backlog_days > 14:  # 수용 한도 초과 -> 거절
                continue
            k = rng.choice(3, p=MIX)
            jobs.append([float(DAYS[k]), PRICES[k]])
            backlog_days += DAYS[k]
        cap = capacity_days
        while jobs and cap > 0:
            used = min(cap, jobs[0][0])
            jobs[0][0] -= used
            cap -= used
            backlog_days -= used
            if jobs[0][0] <= 1e-9:
                price = jobs.pop(0)[1]
                if rng.random() < 0.95:
                    pending.append((w + 1, price * NET_RATE))
                if rng.random() < 0.70:
                    reviews += 1
        for item in [x for x in pending if x[0] <= w]:
            cum_net += item[1]
            pending.remove(item)
        if reached is None and cum_net >= TARGET:
            reached = w
    return cum_net, reached


def run(runs, seed, capacity_days, weeks=26):
    out = {}
    for name, (b, p0, pmax, rej) in SCENARIOS.items():
        rng = np.random.default_rng(seed)
        nets, reach = [], []
        for _ in range(runs):
            net, r = simulate(rng, b, p0, pmax, rej, capacity_days, weeks)
            nets.append(net)
            reach.append(r if r is not None else np.inf)
        nets, reach = np.array(nets), np.array(reach)
        out[name] = {
            "P(<=4주)": float((reach <= 4).mean()),
            "P(<=8주)": float((reach <= 8).mean()),
            "P(<=12주)": float((reach <= 12).mean()),
            "P(<=26주)": float((reach <= 26).mean()),
            "달성 주 중앙값": None if (reach <= 26).mean() < 0.5 else float(np.median(reach)),
            "26주 실수령 p10/중앙/p90": (np.percentile(nets, 10), np.median(nets), np.percentile(nets, 90)),
        }
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=10000)
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args()
    for cap in (3, 6):
        print(f"\n## 주당 가용 작업일 {cap}일 (등록 후 26주, {a.runs}회, 목표 실수령 {TARGET:.0f}만원)")
        print("| 시나리오 | 4주 | 8주 | 12주 | 26주 | 달성 주 중앙값 | 26주 실수령 p10 / 중앙 / p90(만원) |")
        print("|---|---|---|---|---|---|---|")
        for name, r in run(a.runs, a.seed, cap).items():
            p10, med, p90 = r["26주 실수령 p10/중앙/p90"]
            med_w = "미달(과반 미만)" if r["달성 주 중앙값"] is None else f"{r['달성 주 중앙값']:.0f}주"
            print(f"| {name} | {r['P(<=4주)']:.0%} | {r['P(<=8주)']:.0%} | {r['P(<=12주)']:.0%} | "
                  f"{r['P(<=26주)']:.0%} | {med_w} | {p10:.0f} / {med:.0f} / {p90:.0f} |")
