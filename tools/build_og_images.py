#!/usr/bin/env python3
"""제품별 링크 미리보기 이미지 생성: assets/og/<id>.jpg (1200x630, 흰 배경 중앙 배치)
실행: python3 tools/build_og_images.py   (저장소 루트, Pillow 필요) → 이후 node tools/build_product_pages.js
이미 있는 파일은 건너뜀. 제품 대표 사진을 바꿨다면 해당 jpg를 지우고 다시 실행."""
import json, os, subprocess
from PIL import Image
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
items = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require("./data/site-data.js");console.log(JSON.stringify(window.SMG_DEFAULT_DATA.products.map(p=>[p.id,(p.images||[])[0]])))']))
os.makedirs('assets/og', exist_ok=True)
for pid, img in items:
    out = f'assets/og/{pid}.jpg'
    if os.path.exists(out) or not img or not os.path.exists(img):
        continue
    im = Image.open(img).convert('RGBA'); W, H = 1200, 630
    bg = Image.new('RGB', (W, H), (255, 255, 255))
    im.thumbnail((W - 160, H - 120))
    bg.paste(im, ((W - im.width) // 2, (H - im.height) // 2), im)
    bg.save(out, quality=82, optimize=True)
    print('created', out)
