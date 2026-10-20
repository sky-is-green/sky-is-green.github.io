"""QR-avatar proof of concept.

Goal: check whether a QR code survives (a) GitHub/HF's circular avatar crop and
(b) real display sizes, when the QR is centered inside a 1024x1024 avatar.

Geometry note: an avatar is displayed as a circle inscribed in a square image.
The largest square that survives a circular crop has side = D / sqrt(2) ~= 0.707 D,
so the QR (incl. 4-module quiet zone) must stay under ~65% of canvas width.
"""

import json
import math
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
CANVAS = 1024
BOX = 16  # px per module in the source QR (integer -> crisp modules)

VARIANTS = {
    # Placeholder URLs; swap for the real ones later.
    "A_githubio": "https://USER.github.io",   # default GitHub Pages URL
    "B_short": "https://u.dev",               # generic short custom domain
}


def make_qr(url: str) -> Image.Image:
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # 30% recovery
        border=4,  # quiet zone, 4 modules (spec minimum)
        box_size=BOX,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    if hasattr(img, "get_image"):  # newer qrcode libs wrap the PIL image
        img = img.get_image()
    return img.convert("RGB"), qr


def circle_preview(img: Image.Image, size: int) -> Image.Image:
    """Simulate how platforms render avatars: circle mask on light backdrop."""
    small = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new("RGB", (size, size), (245, 245, 245))  # page-ish backdrop
    out.paste(small, (0, 0), mask)
    return out


report = {}
circle_card = Image.new("RGB", (640, 340), (24, 24, 24))

for name, url in VARIANTS.items():
    qr_img, qr = make_qr(url)
    total_modules = qr.modules_count + 8  # + 8 for the 4-module border on both sides
    qpx = qr_img.width

    # Sanity: does the whole QR (incl. quiet zone) fit in the safe circle area?
    half_diag = (qpx / 2) * math.sqrt(2)
    fits_circle = half_diag <= CANVAS / 2 * 0.98

    avatar = Image.new("RGB", (CANVAS, CANVAS), "white")
    off = (CANVAS - qpx) // 2
    avatar.paste(qr_img, (off, off))

    avatar.save(OUT / f"avatar_{name}_1024.png")
    circle_preview(avatar, 260).save(OUT / f"display_{name}_260_circle.png")
    circle_preview(avatar, 130).save(OUT / f"display_{name}_130_circle.png")
    circle_preview(avatar, 40).save(OUT / f"display_{name}_40_circle.png")

    report[name] = {
        "url": url,
        "chars": len(url),
        "qr_version": (qr.modules_count - 17) // 4,
        "modules_per_side": qr.modules_count,
        "modules_incl_quiet_zone": total_modules,
        "qr_px_in_1024_canvas": qpx,
        "fraction_of_canvas": round(qpx / CANVAS, 3),
        "fits_inside_circle_crop": fits_circle,
        "px_per_module_at_460_display": round((qpx / CANVAS * 460) / total_modules, 2),
        "px_per_module_at_260_display": round((qpx / CANVAS * 260) / total_modules, 2),
        "px_per_module_at_40_display": round((qpx / CANVAS * 40) / total_modules, 2),
    }

# contact sheet: A@260, B@260, and the 40px "seen in feeds" sizes
circle_card.paste(circle_preview(Image.open(OUT / "avatar_A_githubio_1024.png"), 260), (20, 40))
circle_card.paste(circle_preview(Image.open(OUT / "avatar_B_short_1024.png"), 260), (300, 40))
circle_card.paste(circle_preview(Image.open(OUT / "avatar_A_githubio_1024.png"), 40), (60, 280))
circle_card.paste(circle_preview(Image.open(OUT / "avatar_B_short_1024.png"), 40), (340, 280))
d = ImageDraw.Draw(circle_card)
d.text((20, 14), "A: github.io url  (left)", fill=(200, 200, 200))
d.text((300, 14), "B: short custom domain (right)", fill=(200, 200, 200))
d.text((110, 288), "40px feed size (unscannable on purpose)", fill=(200, 200, 200))
circle_card.save(OUT / "overview.png")

print(json.dumps(report, indent=2))
