"""실측 기록으로 수익 시뮬레이션 재보정.
등록 후 쌓인 활동 기록(tracking/log.csv)에서 문의율·전환율·패키지 비중 등을 추정하고,
그 값으로 남은 기간의 실수령을 다시 예측함.

사용:
  python calibrate.py ../tracking/log.csv --start 2026-12-01            # 등록일부터 기록 마지막 날까지를 관측 기간으로
  python calibrate.py ../tracking/log.csv --start 2026-12-01 --until 2026-12-29 --weeks 26 --out report.md

기록 형식은 tracking/README.md 참고. 핵심 규칙:
  - 문의 1건 = '문의' 1행. 위험 건이라 거절했으면 '거절' 행을 추가로 적음
  - 주문이 들어오면 '수주' 행(패키지 필수). 체험 고객이 다시 주문했으면 '수주' 행과 함께 '재의뢰' 행도 적음
  - 구매확정(정산 확정)되면 '완료' 행(패키지·판매금액 필수) / 리뷰가 달리면 '리뷰' 행
  - 숨고에서 견적 발송 비용이 실제로 차감되면 '견적비용' 행(판매금액 칸에 비용을 만원 단위로, 예: 3,000원 → 0.3)

채널별 실수령 (기록분 집계)
  - 채널에 '크몽'이 들어가면 크몽 공식 수수료(구간제) + 원천징수 3.3%(가정) 차감
  - 그 밖의 채널(숨고·직거래 등)은 거래 수수료 없이 원천징수 3.3%(가정)만 차감하고, '견적비용' 행을 빼서 계산
    (숨고 공식 안내 2026-11-14 확인: 최종 거래액 수수료 없음, 견적은 고객이 열람했을 때만 비용 부과, 48시간 미열람 시 환급)
  - 앞으로의 예측(forecast)은 시뮬레이션 모델을 쓰므로 모든 판매에 크몽 수수료를 적용함 (숨고 비중이 크면 예측이 보수적)

추정 방법 (모두 근사이며, 표본이 작으면 크게 흔들림)
  - 주당 문의율 = 문의 수 / 관측 주 수. 90% 구간은 포아송 정규근사
  - 전환율 = (수주 - 재의뢰) / (문의 - 거절). 90% 구간은 Wilson
  - 리뷰가 문의율·전환율을 올리는 효과(시뮬레이션 모델: 문의 x(1+0.12x리뷰), 전환 +0.02x리뷰)는
    관측 기간의 평균 리뷰 수로 되돌려 '리뷰 0개 기준값'을 구한 뒤 시뮬레이션에 넣음
  - 전환율·거절률·재의뢰율은 표본이 작을 때 극단값(예: 문의 2건에 전환 100%)이 예측을 왜곡하므로,
    기본 가정을 가상 건수만큼 섞은 값(베이즈 축소)을 예측에 씀. 기록이 쌓일수록 실측값에 수렴함
      전환율 15%를 가상 유효 문의 10건, 거절률 20%를 가상 문의 10건, 재의뢰율 10%를 가상 체험 5건으로 섞음
    리포트에는 실측값과 '예측에 쓴 값'을 함께 표시. 주당 문의율은 축소하지 않음(구간으로 불확실성 표시)
  - 패키지 비중은 실제 수주 건수에 기본 비중(가상 2건)을 섞어 0건 패키지가 사라지지 않게 함
  - 패키지 가격은 완료 건의 평균 판매금액(없으면 기본 가격)
"""
import argparse
import datetime as dt
import math
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import revenue_sim as sim  # noqa: E402

COLUMNS = ["날짜", "채널", "유형", "패키지", "판매금액(만원)", "비고"]
TYPES = ("문의", "거절", "수주", "완료", "리뷰", "재의뢰", "견적비용")
PRICED_TYPES = ("완료", "견적비용")  # 판매금액(만원) 칸이 필수인 유형
PACKAGES = ("체험", "STANDARD", "DELUXE", "PREMIUM")
PRIOR_ORDERS = 2.0  # 패키지 비중에 섞는 기본 비중의 가상 건수
# 표본이 작을 때 섞는 기본 가정: (값, 가상 건수)
PRIOR_CONV = (0.15, 10.0)    # 전환율 / 가상 유효 문의
PRIOR_REJECT = (0.20, 10.0)  # 거절률 / 가상 문의
PRIOR_UPSELL = (0.10, 5.0)   # 재의뢰율 / 가상 체험 완료
Z90 = 1.645
SMALL_INQUIRIES, SMALL_WEEKS = 20, 4


def read_log(path) -> pd.DataFrame:
    """기록 CSV를 읽어 검증. 문제 행은 모아서 한 번에 ValueError로 알림."""
    df = None
    for enc in ("utf-8-sig", "cp949"):
        try:
            df = pd.read_csv(path, encoding=enc, dtype=str, keep_default_na=False)
            break
        except UnicodeDecodeError:
            continue
    if df is None:
        raise ValueError(f"인코딩을 판별하지 못함: {path}")
    missing = [c for c in COLUMNS[:5] if c not in df.columns]
    if missing:
        raise ValueError(f"필수 열 없음: {missing} (양식: {', '.join(COLUMNS)})")
    df = df.apply(lambda col: col.str.strip())
    df = df[(df != "").any(axis=1)].copy()  # 완전히 빈 행 제거
    errors = []
    dates, prices = [], []
    for i, r in df.iterrows():
        line = i + 2  # 헤더가 1행
        try:
            dates.append(dt.date.fromisoformat(r["날짜"]))
        except ValueError:
            errors.append(f"{line}행: 날짜 형식 오류 '{r['날짜']}' (YYYY-MM-DD)")
            dates.append(None)
        if r["유형"] not in TYPES:
            errors.append(f"{line}행: 유형 '{r['유형']}'은 허용되지 않음 ({'/'.join(TYPES)})")
        if r["유형"] in ("수주", "완료") and r["패키지"] not in PACKAGES:
            errors.append(f"{line}행: '{r['유형']}'에는 패키지({'/'.join(PACKAGES)}) 필요 — 입력값 '{r['패키지']}'")
        price = None
        if r["판매금액(만원)"]:
            try:
                price = float(r["판매금액(만원)"].replace(",", ""))
                if price <= 0:
                    raise ValueError
            except ValueError:
                errors.append(f"{line}행: 판매금액 '{r['판매금액(만원)']}'이 양수 숫자가 아님")
                price = None
        if r["유형"] in PRICED_TYPES and price is None and not any(e.startswith(f"{line}행: 판매금액") for e in errors):
            what = "판매금액" if r["유형"] == "완료" else "견적 비용(만원, 예: 3,000원 → 0.3)"
            errors.append(f"{line}행: '{r['유형']}'에는 {what}을 판매금액(만원) 칸에 적어야 함")
        prices.append(price)
    if errors:
        raise ValueError("기록 오류:\n  " + "\n  ".join(errors))
    df["date"], df["price"] = dates, prices
    return df.reset_index(drop=True)


def sale_net(channel: str, price: float) -> float:
    """완료 1건의 실수령(만원). 크몽은 공식 수수료 차감, 그 밖의 채널은 거래 수수료 없음. 둘 다 원천징수(가정) 차감."""
    return sim.net_of(price) if "크몽" in channel else price * (1 - sim.TAX)


def channel_summary(df: pd.DataFrame) -> list[dict]:
    rows = []
    for ch in sorted(set(df["채널"]) - {""}) + ([""] if (df["채널"] == "").any() else []):
        d = df[df["채널"] == ch]
        done = d[d["유형"] == "완료"]
        cost = float(d.loc[d["유형"] == "견적비용", "price"].sum())
        net = float(sum(sale_net(ch, p) for p in done["price"])) - cost
        rows.append({"채널": ch or "(미기재)", "문의": int((d["유형"] == "문의").sum()),
                     "수주": int((d["유형"] == "수주").sum()), "완료": len(done),
                     "매출": float(done["price"].sum()), "견적비용": cost, "실수령": net})
    return rows


def wilson(k: int, n: int, z: float = Z90):
    if n == 0:
        return (0.0, 1.0)
    p = k / n
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return (max(0.0, centre - half), min(1.0, centre + half))


def avg_reviews_over(df: pd.DataFrame, start: dt.date, end: dt.date) -> float:
    """관측 기간 동안 누적 리뷰 수의 일 평균 (리뷰 효과를 되돌릴 때 사용)."""
    days = (end - start).days + 1
    review_days = sorted(d for d in df.loc[df["유형"] == "리뷰", "date"] if start <= d <= end)
    return sum((end - d).days + 1 for d in review_days) / days if days > 0 else 0.0


@dataclass
class Estimate:
    start: dt.date
    end: dt.date
    weeks: float
    n: dict
    inq_rate: float
    inq_rate_ci: tuple
    reject: float
    reject_used: float
    conv: float | None
    conv_used: float
    conv_ci: tuple
    avg_reviews: float
    base_inq: float
    p0: float | None
    mix: tuple
    prices: tuple
    with_trial: bool
    upsell: float
    upsell_used: float
    reviews_now: int
    net_now: float
    warnings: list
    channels: list


def estimate(df: pd.DataFrame, start: dt.date | None = None, until: dt.date | None = None,
             with_trial: bool | None = None) -> Estimate:
    start = start or min(df["date"])
    end = until or max(df["date"])
    if end < start:
        raise ValueError(f"관측 종료일({end})이 시작일({start})보다 빠름")
    df = df[(df["date"] >= start) & (df["date"] <= end)]
    weeks = max(1.0, ((end - start).days + 1) / 7)
    n = {t: int((df["유형"] == t).sum()) for t in TYPES}
    warnings = []

    inq_rate = n["문의"] / weeks
    half = Z90 * math.sqrt(max(n["문의"], 1)) / weeks
    inq_ci = (max(0.0, inq_rate - half), inq_rate + half)
    reject = n["거절"] / n["문의"] if n["문의"] else 0.2
    if not n["문의"]:
        warnings.append("문의 기록이 없어 거절률은 기본 가정(20%)을 씀")
    valid = n["문의"] - n["거절"]
    new_orders = n["수주"] - n["재의뢰"]
    if new_orders < 0:
        warnings.append("재의뢰가 수주보다 많음 — 재의뢰도 '수주' 행으로 함께 적었는지 확인")
        new_orders = 0
    conv = min(1.0, new_orders / valid) if valid > 0 else None
    conv_ci = wilson(min(new_orders, valid), valid) if valid > 0 else (0.0, 1.0)
    if new_orders > valid > 0:
        warnings.append("신규 수주가 유효 문의보다 많음 — 문의 기록 누락 가능성")

    avg_rev = avg_reviews_over(df, start, end)
    base_inq = inq_rate / min(1 + 0.12 * avg_rev, 3.0)
    shrink = lambda k, n, prior: (k + prior[0] * prior[1]) / (n + prior[1])  # noqa: E731
    conv_used = shrink(min(new_orders, max(valid, 0)), max(valid, 0), PRIOR_CONV)
    reject_used = shrink(n["거절"], n["문의"], PRIOR_REJECT)
    p0 = max(0.01, conv_used - 0.02 * avg_rev)

    orders = df[df["유형"] == "수주"]
    trial = with_trial if with_trial is not None else bool((orders["패키지"] == "체험").any())
    names = PACKAGES if trial else PACKAGES[1:]
    prior = sim.with_trial(0.0, 0.5) if trial else sim.BASE
    counts = np.array([(orders["패키지"] == p).sum() for p in names], dtype=float)
    mix_arr = (counts + PRIOR_ORDERS * np.array(prior.mix)) / (counts.sum() + PRIOR_ORDERS)
    done = df[df["유형"] == "완료"]
    prices = tuple(float(done.loc[done["패키지"] == p, "price"].mean()) if (done["패키지"] == p).any()
                   else float(prior.prices[i]) for i, p in enumerate(names))
    trial_done = int((done["패키지"] == "체험").sum())
    upsell = min(1.0, n["재의뢰"] / trial_done) if trial_done else 0.0
    upsell_used = shrink(min(n["재의뢰"], trial_done), trial_done, PRIOR_UPSELL) if trial else 0.0

    reviews_now = n["리뷰"]
    channels = channel_summary(df)
    net_now = float(sum(c["실수령"] for c in channels))

    if n["문의"] < SMALL_INQUIRIES or weeks < SMALL_WEEKS:
        warnings.append(f"표본이 작음(문의 {n['문의']}건, {weeks:.1f}주) — 추정과 예측이 크게 흔들림. "
                        f"문의 {SMALL_INQUIRIES}건·{SMALL_WEEKS}주 이상 쌓인 뒤 다시 돌릴 것")
    if conv is None:
        warnings.append("유효 문의가 없어 전환율을 추정할 수 없음 — 예측은 기본 가정(15%)으로 대체")
    return Estimate(start, end, weeks, n, inq_rate, inq_ci, reject, reject_used, conv, conv_used, conv_ci,
                    avg_rev, base_inq, p0, tuple(float(x) for x in mix_arr), prices, trial, upsell, upsell_used,
                    reviews_now, net_now, warnings, channels)


def _packages(est: Estimate) -> sim.Packages:
    if est.with_trial:
        days = (sim.TRIAL_DAYS,) + sim.BASE.days
        return sim.Packages(PACKAGES, est.prices, days, est.mix, 0)
    return sim.Packages(PACKAGES[1:], est.prices, sim.BASE.days, est.mix, None)


def forecast(est: Estimate, weeks: int = 26, runs: int = 5000, seed: int = 42, capacity_days: float = 6,
             target: float = sim.TARGET):
    """문의율 하한/추정/상한 3가지로 남은 기간 실수령을 예측. 목표는 '누적 실수령(기록분 포함)' 기준."""
    p0 = est.p0
    pmax = max(0.30, p0)
    pk = _packages(est)
    out = []
    old_target = sim.TARGET
    sim.TARGET = target
    try:
        for label, rate in (("문의율 하한(90%)", est.inq_rate_ci[0]), ("문의율 추정", est.inq_rate),
                            ("문의율 상한(90%)", est.inq_rate_ci[1])):
            base = rate / min(1 + 0.12 * est.avg_reviews, 3.0)
            rng = np.random.default_rng(seed)
            nets, reach = [], []
            for _ in range(runs):
                net, r, _ = sim.simulate(rng, base, p0, pmax, est.reject_used, capacity_days, weeks, pk,
                                         upsell=est.upsell_used, start_reviews=est.reviews_now, start_net=est.net_now)
                nets.append(net)
                reach.append(r if r is not None else np.inf)
            nets, reach = np.array(nets), np.array(reach)
            out.append({"구분": label, "주당 문의": rate, "목표 달성 확률": float((reach <= weeks).mean()),
                        "p10": float(np.percentile(nets, 10)), "중앙": float(np.median(nets)),
                        "p90": float(np.percentile(nets, 90))})
    finally:
        sim.TARGET = old_target
    return out


def report(est: Estimate, fc, weeks: int, target: float) -> str:
    pct = lambda x: f"{x:.0%}"  # noqa: E731
    lines = [f"# 실측 재보정 리포트 ({est.start} ~ {est.end}, {est.weeks:.1f}주)", ""]
    if est.warnings:
        lines += ["## 주의"] + [f"- {w}" for w in est.warnings] + [""]
    n = est.n
    lines += ["## 기록 집계",
              "| 문의 | 거절 | 수주 | 재의뢰 | 완료 | 리뷰 | 누적 실수령(만원) |",
              "|---|---|---|---|---|---|---|",
              f"| {n['문의']} | {n['거절']} | {n['수주']} | {n['재의뢰']} | {n['완료']} | {n['리뷰']} | {est.net_now:.1f} |",
              "", "### 채널별 (실수령 = 크몽은 공식 수수료 차감, 그 밖의 채널은 견적비용 차감. 원천징수 3.3% 가정 포함)",
              "| 채널 | 문의 | 수주 | 완료 | 매출(만원) | 견적비용(만원) | 실수령(만원) |", "|---|---|---|---|---|---|---|"]
    for c in est.channels:
        lines.append(f"| {c['채널']} | {c['문의']} | {c['수주']} | {c['완료']} | {c['매출']:.1f} | {c['견적비용']:.2f} | {c['실수령']:.1f} |")
    lines += ["", "## 추정값 (90% 구간은 근사)",
              "| 항목 | 실측 | 90% 구간 | 예측에 쓴 값 | 시뮬레이션 기본 가정(참고) |", "|---|---|---|---|---|",
              f"| 주당 문의 | {est.inq_rate:.2f} | {est.inq_rate_ci[0]:.2f} ~ {est.inq_rate_ci[1]:.2f} | 하한·실측·상한 3가지 | 보수 0.3 / 기본 0.7 / 낙관 1.5 |",
              f"| 전환율(신규 수주/유효 문의) | {'추정 불가' if est.conv is None else pct(est.conv)} | "
              f"{pct(est.conv_ci[0])} ~ {pct(est.conv_ci[1])} | {pct(est.conv_used)} | 10~20% |",
              f"| 거절률 | {pct(est.reject)} | - | {pct(est.reject_used)} | 15~25% |",
              f"| 체험 후 재의뢰율 | {pct(est.upsell)} | - | {pct(est.upsell_used)} | 0~20% |",
              f"| 관측 기간 평균 리뷰 수 | {est.avg_reviews:.1f} | - | - | - |", "",
              "'예측에 쓴 값'은 표본이 작을 때 실측값을 기본 가정 쪽으로 당긴 값임 (기록이 쌓이면 실측값에 가까워짐).", "",
              "패키지 비중·가격 (비중은 실제 수주에 기본 비중 2건을 섞은 값, 가격은 완료 건 평균 또는 기본 가격)",
              "| 패키지 | 비중 | 가격(만원) |", "|---|---|---|"]
    for name, m, p in zip(_packages(est).names, est.mix, est.prices):
        lines.append(f"| {name} | {pct(m)} | {p:.1f} |")
    lines += ["", f"## 예측: 앞으로 {weeks}주 뒤 누적 실수령 (기록분 {est.net_now:.1f}만원 포함, 목표 {target:.0f}만원)",
              "| 구분 | 주당 문의 | 목표 달성 확률 | p10 / 중앙 / p90(만원) |", "|---|---|---|---|"]
    for r in fc:
        lines.append(f"| {r['구분']} | {r['주당 문의']:.2f} | {pct(r['목표 달성 확률'])} | "
                     f"{r['p10']:.0f} / {r['중앙']:.0f} / {r['p90']:.0f} |")
    lines += ["", "※ 예측은 모든 판매에 크몽 공식 수수료를 적용함(숨고 비중이 크면 보수적, 단 앞으로의 숨고 견적 비용은 미반영). 원천징수 3.3%는 가정. 리뷰 효과·작업일·정산 지연 등 모델 구조는 "
              "`revenue_sim.py`의 가정을 그대로 씀. 예측은 '지금 추세가 유지된다면'의 값이며 보장이 아님."]
    return "\n".join(lines) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="실측 기록으로 수익 시뮬레이션 재보정")
    ap.add_argument("log", help="tracking/log.csv 경로")
    ap.add_argument("--start", type=dt.date.fromisoformat, help="관측 시작일(상품 등록일 권장), 기본: 첫 기록일")
    ap.add_argument("--until", type=dt.date.fromisoformat, help="관측 종료일, 기본: 마지막 기록일")
    ap.add_argument("--weeks", type=int, default=26, help="앞으로 예측할 주 수 (기본 26)")
    ap.add_argument("--target", type=float, default=sim.TARGET, help="목표 누적 실수령(만원, 기본 100)")
    ap.add_argument("--capacity", type=float, default=6, help="주당 가용 작업일 (기본 6)")
    ap.add_argument("--runs", type=int, default=5000)
    ap.add_argument("--trial", choices=("auto", "yes", "no"), default="auto",
                    help="체험 패키지 운영 여부 (auto: 체험 수주 기록이 있으면 운영 중으로 봄)")
    ap.add_argument("--out", help="리포트를 저장할 .md 경로")
    a = ap.parse_args(argv)
    try:
        df = read_log(a.log)
        if df.empty:
            print("기록이 비어 있음", file=sys.stderr)
            return 2
        est = estimate(df, a.start, a.until, {"auto": None, "yes": True, "no": False}[a.trial])
    except (ValueError, FileNotFoundError) as e:
        print(e, file=sys.stderr)
        return 2
    text = report(est, forecast(est, a.weeks, a.runs, capacity_days=a.capacity, target=a.target), a.weeks, a.target)
    if a.out:
        Path(a.out).write_text(text, encoding="utf-8")
        print(f"저장: {a.out}")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
