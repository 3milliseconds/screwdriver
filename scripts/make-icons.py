#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["resvg-py>=0.1.5", "pillow>=11"]
# ///
"""Rasterise icons/icon.svg into the PNG sizes the manifest asks for.

The artwork is stroke-only, so each variant is the same SVG with the stroke
colour swapped — whatever colour the source happens to ship with is ignored.
Every size is rendered at 8x and Lanczos-filtered down: at 16px the thinnest
strokes are an eighth of a pixel wide, and asking resvg to resolve coverage
that fine directly loses the outer rings altogether.
"""

import io
import pathlib
import re

import resvg_py
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "icons" / "icon.svg"
OUT = ROOT / "public" / "icons"

SIZES = (16, 32, 48, 128)

# --accent (light) and --muted (dark) from src/popup/popup.css.
VARIANTS = (("", "#5b4be1"), ("-off", "#9ca3af"))

SUPERSAMPLE = 8

# Every painted stroke inherits the root element's `stroke`; `stroke="none"` is
# a deliberate opt-out and stays put.
STROKE = re.compile(r'stroke="(?!none")[^"]*"')


def paint(svg: str, colour: str) -> str:
    painted, count = STROKE.subn(f'stroke="{colour}"', svg)
    if not count:
        raise SystemExit(f"{SRC}: no stroke attribute to recolour")
    return painted


def render(svg: str, size: int) -> Image.Image:
    big = size * SUPERSAMPLE
    png = resvg_py.svg_to_bytes(svg_string=svg, width=big, height=big)
    image = Image.open(io.BytesIO(bytes(png))).convert("RGBA")
    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    template = SRC.read_text()
    OUT.mkdir(parents=True, exist_ok=True)

    for suffix, colour in VARIANTS:
        svg = paint(template, colour)

        for size in SIZES:
            path = OUT / f"icon{suffix}-{size}.png"
            render(svg, size).save(path, optimize=True)
            print(f"{path.relative_to(ROOT)}  {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
