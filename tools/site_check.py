#!/usr/bin/env python3
"""사이트 상태 점검 (모니터링용). 사용: python3 tools/site_check.py [--json]

실사이트(https://www.sungsil.com)의 주요 페이지 응답, 필수 요소, sitemap, 인증서 만료일을 확인한다.
문제가 있으면 종료 코드 1. 정기 점검(주 1회 권장)이나 배포 직후 확인에 사용.
"""
import json, re, socket, ssl, sys, time, urllib.request
from datetime import datetime, timezone

SITE = 'https://www.sungsil.com'
PAGES = [
    ('/', '홈'), ('/products.html', '제품소개'), ('/product/str.html', '제품 상세(STR)'), ('/about.html', '회사소개'),
    ('/applications.html', '적용분야'), ('/support.html', '고객지원'), ('/contact.html', '견적문의'), ('/notice.html', '공지'),
    ('/compare.html', '사양 비교'), ('/en/index.html', '영문 홈'), ('/en/products.html', '영문 제품'), ('/en/contact.html', '영문 문의'),
]
ASSETS = ['/data/site-data.js', '/data/site-data-en.js', '/js/app.js', '/css/site.css', '/sitemap.xml', '/robots.txt', '/assets/SMG_Products_Catalogue_2026.pdf']
SLOW_MS = 3000


def fetch(path, head=False):
    req = urllib.request.Request(SITE + path, method='HEAD' if head else 'GET', headers={'User-Agent': 'smg-site-check'})
    t = time.time()
    with urllib.request.urlopen(req, timeout=20) as r:
        body = b'' if head else r.read()
        return r.status, body, int((time.time() - t) * 1000)


def cert_days(host='www.sungsil.com'):
    ctx = ssl.create_default_context()
    with socket.create_connection((host, 443), timeout=15) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as s:
            exp = datetime.strptime(s.getpeercert()['notAfter'], '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc)
            return (exp - datetime.now(timezone.utc)).days


def main():
    rows, problems = [], []
    for path, name in PAGES:
        try:
            st, body, ms = fetch(path)
            html = body.decode('utf-8', 'replace')
            issues = []
            if st != 200: issues.append(f'응답 {st}')
            if not re.search(r'<title>[^<]{3,}</title>', html): issues.append('title 없음')
            if 'js/app.js' not in html: issues.append('app.js 참조 없음')
            if ms > SLOW_MS: issues.append(f'응답 지연 {ms}ms')
        except Exception as e:  # noqa: BLE001
            st, ms, issues = 0, 0, [f'접속 실패: {type(e).__name__}']
        rows.append({'page': name, 'path': path, 'status': st, 'ms': ms, 'issues': issues})
        problems += [f'{name}: {i}' for i in issues]
    for path in ASSETS:
        try:
            st, _, ms = fetch(path, head=True)
            if st != 200: problems.append(f'{path}: 응답 {st}')
        except Exception as e:  # noqa: BLE001
            problems.append(f'{path}: 접속 실패 {type(e).__name__}')
    info = {}
    try:
        _, sm, _ = fetch('/sitemap.xml')
        info['sitemap_urls'] = len(re.findall(r'<loc>', sm.decode()))
        if info['sitemap_urls'] < 50: problems.append(f"sitemap 주소 수 {info['sitemap_urls']} (50 미만)")
    except Exception as e:  # noqa: BLE001
        problems.append(f'sitemap 확인 실패 {type(e).__name__}')
    try:
        info['cert_days_left'] = cert_days()
        if info['cert_days_left'] < 14: problems.append(f"HTTPS 인증서 만료 {info['cert_days_left']}일 전")
    except Exception as e:  # noqa: BLE001
        info['cert_days_left'] = None  # 프록시 환경 등에서는 직접 확인 불가
        info['cert_note'] = f'확인 불가 ({type(e).__name__})'
    ok_pages = [r for r in rows if not r['issues']]
    info['avg_ms'] = int(sum(r['ms'] for r in ok_pages) / len(ok_pages)) if ok_pages else None
    result = {'checked_at': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'), 'ok': not problems, 'problems': problems, 'info': info, 'pages': rows}
    if '--json' in sys.argv:
        print(json.dumps(result, ensure_ascii=False, indent=1))
    else:
        print(f"점검 시각: {result['checked_at']} | 결과: {'정상' if result['ok'] else '문제 ' + str(len(problems)) + '건'}")
        for r in rows: print(f"  {'OK ' if not r['issues'] else 'NG '} {r['status']} {r['ms']:>5}ms  {r['page']}  {' / '.join(r['issues'])}")
        print(f"  sitemap 주소 {info.get('sitemap_urls')}개 | 인증서 잔여 {info.get('cert_days_left')}일 {info.get('cert_note', '')} | 평균 응답 {info.get('avg_ms')}ms")
        for p in problems: print('  !! ' + p)
    sys.exit(0 if result['ok'] else 1)


if __name__ == '__main__':
    main()
