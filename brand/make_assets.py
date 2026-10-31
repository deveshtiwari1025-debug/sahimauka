"""SahiMauka brand asset generator.

Draws the SahiMauka brand mark and exports the app icon set, splash marks
and the Play Store feature graphic.

Mark design (geometric, flat, no text):
  * a rounded-square with a diagonal violet -> deep-violet gradient
    (#7C3AED top-left -> #4C1D95 bottom-right),
  * a bold white upward-right arrow (opportunity rising),
  * a small amber dot just past the arrow tip (the "moment").

Palette: ink #1C1330, violet #7C3AED, deep-violet #4C1D95,
         amber #F59E0B, paper #FFFDF8.

Usage:  python brand/make_assets.py
Output: brand/assets/*.png

Note on store icons: `icon-1024.png` / `play-icon-512.png` are exported as
FULL SQUARE opaque artwork because Google Play applies its own rounded
masking to the listing icon and iOS requires opaque app icons. The
rounded-square rendition of the mark itself is exported separately as
`mark-rounded-1024.png` (and used for the favicon).
"""

from __future__ import annotations

import os

from PIL import Image, ImageChops, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets")

# --- palette -----------------------------------------------------------------
INK = (28, 19, 48)          # #1C1330
VIOLET = (124, 58, 237)     # #7C3AED
DEEP_VIOLET = (76, 29, 149)  # #4C1D95
AMBER = (245, 158, 11)      # #F59E0B
PAPER = (255, 253, 248)     # #FFFDF8
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

SS = 4  # supersample factor: draw big, downscale with Lanczos for clean edges

# --- helpers -----------------------------------------------------------------


def diagonal_gradient(size, c1, c2):
    """Exact 45-degree linear gradient: c1 at top-left -> c2 at bottom-right.

    Built from two half-range ramps (x + y) so no resampling blur is involved.
    """
    w, h = size
    gx = Image.new("L", (w, 1))
    if w > 1:
        gx.putdata([round(127 * x / (w - 1)) for x in range(w)])
    gy = Image.new("L", (1, h))
    if h > 1:
        gy.putdata([round(128 * y / (h - 1)) for y in range(h)])
    mask = ImageChops.add(
        gx.resize((w, h), Image.Resampling.NEAREST),
        gy.resize((w, h), Image.Resampling.NEAREST),
    )
    return Image.composite(Image.new("RGB", size, c2), Image.new("RGB", size, c1), mask)


def rounded_mask(size, radius):
    """L-mode mask: white rounded square, transparent (black) elsewhere."""
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255
    )
    return mask


# The arrow axis points up-right at 45 degrees (image y grows downward).
_UX, _UY = 0.7071067811865476, -0.7071067811865476
_VX, _VY = 0.7071067811865476, 0.7071067811865476  # perpendicular


def draw_mark(draw, cx, cy, s, arrow=WHITE, dot=AMBER):
    """Draw the SahiMauka mark: bold up-right arrow + amber dot at its tip.

    `s` is the mark scale; every geometry value is a fraction of `s`.
    The farthest point of the mark (the outer edge of the dot) sits at
    0.50 * s from the centre (cx, cy), so callers pick s = 2 * allowed_radius.
    """
    tip_d = 0.28 * s          # arrow tip distance from centre (along axis)
    tail_d = -0.34 * s        # tail distance from centre (negative = opposite)
    head_len = 0.30 * s       # arrowhead length along the axis
    head_w = 0.60 * s         # arrowhead width (perpendicular)
    shaft_w = 0.22 * s        # shaft thickness (perpendicular)
    dot_d = 0.415 * s         # dot centre distance from centre
    dot_r = 0.085 * s         # dot radius

    def pt(d, o=0.0):
        return (cx + _UX * d + _VX * o, cy + _UY * d + _VY * o)

    head_base = tip_d - head_len
    draw.polygon(
        [
            pt(tip_d),                          # tip
            pt(head_base, head_w / 2),          # head corner (perp +)
            pt(head_base, shaft_w / 2),         # shaft/head junction (perp +)
            pt(tail_d, shaft_w / 2),            # tail corner (perp +)
            pt(tail_d, -shaft_w / 2),           # tail corner (perp -)
            pt(head_base, -shaft_w / 2),        # shaft/head junction (perp -)
            pt(head_base, -head_w / 2),         # head corner (perp -)
        ],
        fill=arrow,
    )
    dcx, dcy = pt(dot_d)
    draw.ellipse([dcx - dot_r, dcy - dot_r, dcx + dot_r, dcy + dot_r], fill=dot)


def _load_font(px):
    """Best-effort bold system font (Windows first, then Linux, then default)."""
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf",   # Segoe UI Bold
        r"C:\Windows\Fonts\arialbd.ttf",    # Arial Bold
        r"C:\Windows\Fonts\calibrib.ttf",   # Calibri Bold
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, px)
    return ImageFont.load_default(size=px)


def _save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print(f"  wrote {path}  ({img.size[0]}x{img.size[1]}, {img.mode})")


# --- asset builders -----------------------------------------------------------


def make_icon_square(size=1024):
    """Full-square opaque app icon (Play masks it; iOS needs no alpha)."""
    ss = size * SS
    img = diagonal_gradient((ss, ss), VIOLET, DEEP_VIOLET)
    draw_mark(ImageDraw.Draw(img), ss / 2, ss / 2, 0.84 * ss)  # mark radius 0.42*size
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_mark_rounded(size=1024):
    """The brand mark itself: rounded-square gradient + arrow + dot, RGBA."""
    ss = size * SS
    img = diagonal_gradient((ss, ss), VIOLET, DEEP_VIOLET).convert("RGBA")
    draw_mark(ImageDraw.Draw(img), ss / 2, ss / 2, 0.84 * ss)
    img.putalpha(rounded_mask((ss, ss), round(0.22 * ss)))
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_foreground(size=1024):
    """Adaptive-icon foreground: mark on transparent, inside the 66% safe zone."""
    ss = size * SS
    img = Image.new("RGBA", (ss, ss), TRANSPARENT)
    draw_mark(ImageDraw.Draw(img), ss / 2, ss / 2, 0.62 * ss)  # radius 0.31*size < 0.33
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_background(size=1024):
    """Adaptive-icon background: full-bleed gradient (system masks the shape)."""
    return diagonal_gradient((size, size), VIOLET, DEEP_VIOLET)


def make_monochrome(size=1024):
    """Adaptive-icon monochrome layer: pure white mark silhouette on transparent."""
    ss = size * SS
    img = Image.new("RGBA", (ss, ss), TRANSPARENT)
    draw_mark(ImageDraw.Draw(img), ss / 2, ss / 2, 0.62 * ss, arrow=WHITE, dot=WHITE)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_splash(size=1024):
    """Splash art: mark centred on the ink background."""
    ss = size * SS
    img = Image.new("RGB", (ss, ss), INK)
    draw_mark(ImageDraw.Draw(img), ss / 2, ss / 2, 0.64 * ss)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_splash_mark(size=1024):
    """Transparent splash image for Expo: mark only, no background."""
    ss = size * SS
    img = Image.new("RGBA", (ss, ss), TRANSPARENT)
    draw_mark(ImageDraw.Draw(img), ss / 2, ss / 2, 0.60 * ss)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def make_feature_graphic(w=1024, h=500):
    """Play Store feature graphic: gradient bg, brand name, amber tagline, mark right."""
    W, H = w * SS, h * SS
    img = diagonal_gradient((W, H), VIOLET, DEEP_VIOLET)
    draw = ImageDraw.Draw(img)

    # Title: shrink until it clears the mark (mark bbox starts at x=700 at 1x).
    px = 104 * SS
    while draw.textlength("SahiMauka", font=_load_font(px)) > 560 * SS and px > 40 * SS:
        px -= 2 * SS
    draw.text((64 * SS, 224 * SS), "SahiMauka", font=_load_font(px), fill=WHITE, anchor="lm")
    draw.text(
        (66 * SS, 316 * SS),
        "Sahi mauka, sahi samay",
        font=_load_font(44 * SS),
        fill=AMBER,
        anchor="lm",
    )
    draw_mark(draw, 820 * SS, 250 * SS, 2 * 170 * SS)
    return img.resize((w, h), Image.Resampling.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Generating SahiMauka brand assets ->", OUT)

    icon = make_icon_square(1024)
    _save(icon, "icon-1024.png")
    _save(icon.resize((512, 512), Image.Resampling.LANCZOS), "play-icon-512.png")

    mark = make_mark_rounded(1024)
    _save(mark, "mark-rounded-1024.png")
    _save(mark.resize((64, 64), Image.Resampling.LANCZOS), "favicon-64.png")

    _save(make_foreground(1024), "icon-foreground-1024.png")
    _save(make_background(1024), "icon-background-1024.png")
    _save(make_monochrome(1024), "icon-monochrome-1024.png")
    _save(make_splash(1024), "splash-1024.png")
    _save(make_splash_mark(1024), "splash-mark-1024.png")
    _save(make_feature_graphic(), "feature-graphic-1024x500.png")

    print("Done.")


if __name__ == "__main__":
    main()
