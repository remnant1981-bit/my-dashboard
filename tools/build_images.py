#!/usr/bin/env python3
"""모바일용 축소 이미지 생성 + 목록 파일 작성 (기기별 크기 자동 선택용)
실행: python3 tools/build_images.py   (저장소 루트, Pillow 필요)
- assets/img/*.webp 중 가로 640px 초과 → assets/img/m/<이름>.webp (가로 640px, 품질 78)
- data/img-variants.js : window.SMG_IMGV = { "이름": [원본가로, 모바일가로], ... }
- 새 이미지를 assets/img 에 추가했거나 교체했으면 다시 실행 (이미 있고 원본보다 새 파일이면 건너뜀)"""
import glob, json, os
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
W = 640
os.makedirs('assets/img/m', exist_ok=True)
out, made = {}, 0
for f in sorted(glob.glob('assets/img/*.webp')):
    name = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f); w, h = im.size
    if w <= W:
        continue
    dst = f'assets/img/m/{name}.webp'
    if not (os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(f)):
        im2 = im.convert('RGBA') if im.mode in ('P', 'LA') else im
        im2 = im2.resize((W, round(h * W / w)), Image.LANCZOS)
        im2.save(dst, 'WEBP', quality=78, method=6)
        made += 1
    out[name] = [w, W]
# remove stale variants
for f in glob.glob('assets/img/m/*.webp'):
    if os.path.splitext(os.path.basename(f))[0] not in out:
        os.remove(f)
with open('data/img-variants.js', 'w', encoding='utf-8') as fp:
    fp.write('/* 자동 생성: tools/build_images.py — 직접 수정 금지 */\nwindow.SMG_IMGV = ' + json.dumps(out, separators=(',', ':')) + ';\n')
orig = sum(os.path.getsize(f'assets/img/{k}.webp') for k in out) // 1024
mob = sum(os.path.getsize(f'assets/img/m/{k}.webp') for k in out) // 1024
print(f'variants: {len(out)} (new {made}) | original {orig}KB → mobile {mob}KB')
