"""Turns the raw RGBA that make-hero-qr.js writes into assets/qr/hero-qr.png.

The master render is already the right size (820×820 — v4's 33 modules plus a
4-module quiet zone, at 20px per module), so nothing is resized here: scaling
pixel-drawn modules is what makes them soft.

Usage:  node make-hero-qr.js && python3 make-hero-qr.py
"""
import json
from pathlib import Path

from PIL import Image

RAW = Path('/tmp/opencode/hero-qr.raw')
OUT = Path(__file__).resolve().parent / 'hero-qr.png'

meta = json.loads(RAW.with_suffix('.raw.meta').read_text())
img = Image.frombytes('RGBA', (meta['w'], meta['h']), RAW.read_bytes()).convert('RGB')
img.save(OUT, optimize=True)
print(f'{OUT} {img.width}×{img.height} '
      f'(v{meta["version"]}, mask {meta["mask"]}, box {meta["box"]}px, quiet {meta["quiet"]})')
