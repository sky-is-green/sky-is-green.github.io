"""Probe: can pyqart paint a cat face into a QR that still decodes?

Level mapping check + first look at the bool matrix.
"""
import time
from pathlib import Path

from PIL import Image, ImageDraw
import zxingcpp

OUT = Path(__file__).resolve().parent
OUT.mkdir(exist_ok=True, parents=True)

URL = "https://USER.github.io"


def draw_cat(size=420):
    """Bold cat face: dark eyes at top corners (QR finder zone), ears, nose, mouth.

    Keep it BOLD: thin lines die at 29x29 modules.
    """
    w = size
    img = Image.new("L", (w, w), 255)  # white = light
    d = ImageDraw.Draw(img)
    m = w / 29.0  # one QR module ~ this many px when canvas maps 1:1

    # eyes: big discs near top-left / top-right (where finder patterns sit)
    for cx in (7.0 * m, 22.0 * m):
        r = 2.6 * m
        d.ellipse((cx - r, 6.5 * m - r, cx + r, 6.5 * m + r), fill=0)

    # ears: triangles poking above (rows 1-5), x around modules 10-13 and 16-19
    d.polygon(((11.5 * m, 0.2 * m), (14.0 * m, 5.5 * m), (9.0 * m, 5.5 * m)), fill=0)
    d.polygon(((17.5 * m, 0.2 * m), (20.0 * m, 5.5 * m), (15.0 * m, 5.5 * m)), fill=0)

    # nose: small triangle at center (~row 14)
    d.polygon(((14.5 * m, 13.0 * m), (16.5 * m, 13.0 * m), (15.5 * m, 15.0 * m)), fill=0)

    # mouth: two arcs under the nose
    d.arc((12.0 * m, 13.0 * m, 15.5 * m, 18.0 * m), 0, 120, fill=0, width=int(0.9 * m))
    d.arc((15.5 * m, 13.0 * m, 19.0 * m, 18.0 * m), 60, 180, fill=0, width=int(0.9 * m))

    # whisker-ish cheek patches: soft dark blobs (bold, survive dithering)
    d.ellipse((5.5 * m, 15.0 * m, 10.5 * m, 19.5 * m), fill=90)
    d.ellipse((18.5 * m, 15.0 * m, 23.5 * m, 19.5 * m), fill=90)

    img = img.resize((256, 256), Image.LANCZOS)
    img.save(OUT / "target_cat.png")
    return img


def artist_matrix(url, img_path, level=3, dither=True):
    from pyqart.art import QArtist

    t0 = time.time()
    art = QArtist(url, str(img_path), level=level, dither=dither)
    print("  params(version, dcwc, eccwc):", art.get_params()[:1], end=" ")
    mtx = art.as_bool_matrix
    print(f"| {len(mtx)}x{len(mtx[0])} modules | {time.time()-t0:.1f}s")
    return mtx


def render(module_matrix, box=16, border=4):
    n = len(module_matrix)
    side = (n + 2 * border) * box
    img = Image.new("RGB", (side, side), "white")
    d = ImageDraw.Draw(img)
    for y, row in enumerate(module_matrix):
        for x, dark in enumerate(row):
            if dark:
                d.rectangle(((x + border) * box, (y + border) * box,
                             (x + border + 1) * box - 1, (y + border + 1) * box - 1),
                            fill="black")
    return img


if __name__ == "__main__":
    cat = draw_cat()
    cat_path = OUT / "target_cat.png"
    print("== level 3 (dither) ==")
    mtx3 = artist_matrix(URL, cat_path, level=3, dither=True)
    img3 = render(mtx3)
    img3.save(OUT / "cat_level3.png")

    # decode at several scales
    for s in (1024, 460, 260):
        t = img3.resize((s, s), Image.LANCZOS)
        r = zxingcpp.read_barcodes(t)
        print(f"  {s}px ->", "OK" if r else "FAIL",
              (r[0].text, r[0].format) if r else "")

    print("== level 0 ==")
    mtx0 = artist_matrix(URL, cat_path, level=0, dither=True)
    print("  dims:", len(mtx0))
