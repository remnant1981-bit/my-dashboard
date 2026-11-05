#!/usr/bin/env python3
"""CSS·JS 파일 참조에 버전(?v=내용해시)을 붙여, 수정 후 방문자 브라우저가 옛 파일을 쓰지 않게 함.
실행: python3 tools/stamp_assets.py   (저장소 루트. 모든 생성 스크립트 실행 후 마지막에 실행)
순서: build_en_pages.py → build_og_images.py(필요 시) → build_product_pages.js → stamp_assets.py
※ data/site-data*.js 는 관리자 게시로 자주 바뀌므로 대상 아님 (최대 10분 캐시)."""
import glob, hashlib, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
ASSETS = ['css/site.css', 'css/admin.css', 'js/app.js', 'js/extras.js', 'js/motion.js', 'js/chat.js', 'js/features.js', 'js/admin.js', 'data/img-variants.js']
ver = {a: hashlib.sha1(open(a, 'rb').read()).hexdigest()[:8] for a in ASSETS if os.path.exists(a)}
pat = re.compile(r'((?:src|href)=")(' + '|'.join(re.escape(a) for a in ver) + r')(\?v=[0-9a-f]+)?(")')
n = 0
for f in glob.glob('*.html') + glob.glob('en/*.html') + glob.glob('product/*.html') + glob.glob('en/product/*.html'):
    s = open(f, encoding='utf-8').read()
    t = pat.sub(lambda m: f'{m.group(1)}{m.group(2)}?v={ver[m.group(2)]}{m.group(4)}', s)
    if t != s:
        open(f, 'w', encoding='utf-8').write(t); n += 1
print(f'stamped {n} files:', ', '.join(f'{k}={v}' for k, v in ver.items()))
