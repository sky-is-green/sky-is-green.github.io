"""Artistic QR avatar pipeline — from a target image (face/animal/portrait) to a
platform-ready avatar, with an automated decode stress-test harness.

Pipeline:
  1. pyqart (QArt algorithm) paints the target image into a QR (ECC level H).
  2. We render the result with a 4-module quiet zone and center it inside a
     1024x1024 white canvas, sized so it survives circular avatar crops
     (<= ~62% of canvas width; inscribed-circle rule: D / sqrt(2)).
  3. Simulated platform renders (460/260/130/40 px, circle-cropped) are saved.
  4. zxing-cpp decodes every render (+ blur/JPEG stress) and reports pass/fail.

Usage:
  python make_art_avatars.py --url https://you.dev --img targets/cat.png \
      --version 3 --mask 2 --name cat_m2
  python make_art_avatars.py --url https://you.dev --mode plain --name plain
"""

import argparse
import io
import json
from pathlib import Path

import zxingcpp
from PIL import Image, ImageDraw, ImageFilter

# geometry constants: quiet zone is 4 modules (QR spec minimum)
BORDER_MODULES = 4
BOX = 16                # px per module in the reference render
CANVAS = 1024           # avatar canvas
ART_FRAC = 0.578        # QR+quiet-zone width as fraction of canvas (PoC-verified circle-safe)


def make_plain_matrix(url: str):
    import qrcode

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H,
                       border=BORDER_MODULES, box_size=BOX)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    if hasattr(img, "get_image"):
        img = img.get_image()

    # rebuild as pure module matrix (border included) for uniform handling
    n = (img.width // BOX) - 2 * BORDER_MODULES
    matrix = [[False] * (n + 2 * BORDER_MODULES) for _ in range(n + 2 * BORDER_MODULES)]
    px = img.convert("L").load()
    for y in range(n + 2 * BORDER_MODULES):
        for x in range(n + 2 * BORDER_MODULES):
            matrix[y][x] = px[(x + 0.5) * BOX, (y + 0.5) * BOX] < 128
    return matrix, n, ("auto", None)


def make_art_matrix(url: str, img_path: str, version=None, mask=None):
    from pyqart.art import QArtist

    art = QArtist(url, str(img_path), version=version, mask=mask, level=3, dither=True)
    core = art.as_bool_matrix  # list[list[bool]], no quiet zone
    n = len(core)
    total = n + 2 * BORDER_MODULES
    matrix = [[False] * total for _ in range(total)]
    for y in range(n):
        for x in range(n):
            matrix[y + BORDER_MODULES][x + BORDER_MODULES] = bool(core[y][x])
    return matrix, n, (version, mask)


def render(matrix, box: int = BOX) -> Image.Image:
    side = len(matrix) * box
    img = Image.new("RGB", (side, side), "white")
    d = ImageDraw.Draw(img)
    for y, row in enumerate(matrix):
        for x, dark in enumerate(row):
            if dark:
                d.rectangle((x * box, y * box, (x + 1) * box - 1, (y + 1) * box - 1),
                            fill="black")
    return img


def circle_crop(img: Image.Image, size: int, backdrop=(245, 245, 245)) -> Image.Image:
    small = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new("RGB", (size, size), backdrop)
    out.paste(small, (0, 0), mask)
    return out


def compose_avatar(qr_img: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (CANVAS, CANVAS), "white")
    target = int(CANVAS * ART_FRAC)
    scale = target / qr_img.width
    resized = qr_img.resize((target, target), Image.LANCZOS)
    off = (CANVAS - target) // 2
    canvas.paste(resized, (off, off))
    return canvas


def stress_cases(avatar: Image.Image):
    """(label, image, expect_scannable) triples."""
    cases = []
    for size in (1024, 460, 260, 130, 40):
        sq = avatar.resize((size, size), Image.LANCZOS)
        cases.append((f"{size}px square", sq, size >= 130))
        cases.append((f"{size}px circle", circle_crop(avatar, size), size >= 130))
    c260 = circle_crop(avatar, 260)
    for r in (0.8, 1.2):
        cases.append((f"260px circle blur{int(r*10)/10}", c260.filter(ImageFilter.GaussianBlur(r)), True))
    buf = io.BytesIO()
    c260.save(buf, "JPEG", quality=50)
    cases.append(("260px circle jpeg q50", Image.open(buf), True))
    return cases


def run(url: str, img_path: str | None, version, mask, name: str, outdir: Path, plain: bool):
    outdir.mkdir(parents=True, exist_ok=True)
    if plain:
        matrix, n, cfg = make_plain_matrix(url)
    else:
        matrix, n, cfg = make_art_matrix(url, img_path, version, mask)

    qr_img = render(matrix)
    avatar = compose_avatar(qr_img)

    avatar.save(outdir / f"{name}_avatar_1024.png")
    for size, label in ((460, "profile_retina"), (260, "profile"), (130, "small"), (40, "feed")):
        circle_crop(avatar, size).save(outdir / f"{name}_display_{label}_{size}.png")

    report = {"name": name, "url": url, "modules": n, "config": list(cfg),
              "cases": []}
    for label, im, expect in stress_cases(avatar):
        res = zxingcpp.read_barcodes(im)
        ok = bool(res)
        text = res[0].text if ok else None
        status = "OK " if ok else "FAIL"
        if not expect and ok:
            status += " (decodes even here!)"
        report["cases"].append({"case": label, "decoded": ok, "text": text,
                                "expected": "scan" if expect else "no-scan (intrigue size)"})
        print(f"  [{status}] {label}: {text or '-'}")

    (outdir / f"{name}_report.json").write_text(json.dumps(report, indent=2))
    print(f"saved {name}_* to {outdir}")
    return avatar


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--url", required=True)
    p.add_argument("--img")
    p.add_argument("--version", type=int, default=None)
    p.add_argument("--mask", type=int, default=None)
    p.add_argument("--name", required=True)
    p.add_argument("--outdir", default=".")
    p.add_argument("--mode", choices=["art", "plain"], default="art")
    a = p.parse_args()
    run(a.url, a.img, a.version, a.mask, a.name, Path(a.outdir), plain=a.mode == "plain")
