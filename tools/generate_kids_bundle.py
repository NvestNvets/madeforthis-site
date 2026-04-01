from __future__ import annotations

import argparse
import base64
import json
import math
import os
import random
import re
import zipfile
from pathlib import Path
from typing import Any

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = ROOT / "downloads" / "kids-activity"
DEFAULT_PREVIEW_DIR = ROOT / "assets" / "printables" / "kids-activity"
PROMPT_PATH = ROOT / "KIDS_ACTIVITY_BUNDLE_PROMPT.md"
SPEC_PATH = DEFAULT_OUT_DIR / "kids-activity-bundle-spec.json"

OPENAI_BASE = (os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
OPENAI_MODEL_CHAT = os.getenv("OPENAI_MODEL_CHAT") or "gpt-4o-mini"
OPENAI_MODEL_IMAGE = os.getenv("OPENAI_MODEL_IMAGE") or "gpt-image-1"

PAGE_W, PAGE_H = 2550, 3300
MARGIN = 180
TITLE_Y = 160
FOOTER_Y = PAGE_H - 132

BLACK = 12
DARK = 54
MID = 122
LIGHT = 212
WHITE = 255


def _openai_key() -> str:
    return (os.getenv("OPENAI_API_KEY") or "").strip()


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(text or "").strip().lower()).strip("-")


def _extract_json_object(text: str) -> dict[str, Any]:
    raw = str(text or "").strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        pass
    match = re.search(r"(\{[\s\S]*\})", raw)
    if not match:
        return {}
    try:
        parsed = json.loads(match.group(1))
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _chat_json(prompt: str, reference_image: str = "") -> dict[str, Any]:
    key = _openai_key()
    if not key:
        return {}
    try:
        user_content: Any
        ref_path = Path(reference_image).expanduser() if reference_image else None
        if ref_path and ref_path.exists():
            mime = "image/png" if ref_path.suffix.lower() == ".png" else "image/jpeg"
            image_b64 = base64.b64encode(ref_path.read_bytes()).decode("utf-8")
            user_content = [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{image_b64}"}},
            ]
        else:
            user_content = prompt
        res = requests.post(
            f"{OPENAI_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": OPENAI_MODEL_CHAT,
                "temperature": 0.6,
                "response_format": {"type": "json_object"},
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You create structured printable bundle production specs for a premium lifestyle brand. "
                            "Return valid JSON only. Keep content calm, age-appropriate, printable-friendly, "
                            "and specific enough to render into PDFs."
                        ),
                    },
                    {"role": "user", "content": user_content},
                ],
            },
            timeout=180,
        )
        if res.status_code >= 400:
            return {}
        data = res.json()
        content = str(((((data.get("choices") or [])[0] or {}).get("message") or {}).get("content") or "")).strip()
        return _extract_json_object(content)
    except Exception:
        return {}


def _generate_preview_image(prompt: str, out_path: Path) -> bool:
    key = _openai_key()
    if not key or not prompt:
        return False
    try:
        res = requests.post(
            f"{OPENAI_BASE}/images/generations",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": OPENAI_MODEL_IMAGE,
                "prompt": prompt,
                "size": "1024x1536",
                "response_format": "b64_json",
            },
            timeout=240,
        )
        if res.status_code >= 400:
            return False
        data = res.json()
        rows = data.get("data") if isinstance(data, dict) else None
        if not isinstance(rows, list) or not rows:
            return False
        b64 = str((rows[0] or {}).get("b64_json") or "").strip()
        if not b64:
            return False
        out_path.write_bytes(base64.b64decode(b64))
        return out_path.exists() and out_path.stat().st_size > 0
    except Exception:
        return False


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        ("/System/Library/Fonts/Supplemental/Avenir Next.ttc", 1 if bold else 0),
        ("/System/Library/Fonts/Supplemental/Helvetica.ttc", 1 if bold else 0),
        ("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 0),
        ("/System/Library/Fonts/SFNS.ttf", 0),
    ]
    for path, index in candidates:
        try:
            return ImageFont.truetype(path, size=size, index=index)
        except Exception:
            continue
    return ImageFont.load_default()


TITLE_FONT = load_font(88, bold=True)
SECTION_FONT = load_font(64, bold=True)
SUB_FONT = load_font(44)
BODY_FONT = load_font(50)
SMALL_FONT = load_font(32)
TRACE_FONT = load_font(136, bold=True)
TAG_FONT = load_font(34, bold=True)


def centered_text(draw: ImageDraw.ImageDraw, text: str, y: int, font, fill=BLACK):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text(((PAGE_W - w) / 2, y), text, font=font, fill=fill)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = str(text or "").split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_soft_pattern(draw: ImageDraw.ImageDraw, seed: int, inset: int = 110):
    random.seed(seed)
    x0, y0 = inset, inset
    x1, y1 = PAGE_W - inset, PAGE_H - inset
    draw.rounded_rectangle((x0, y0, x1, y1), radius=48, outline=BLACK, width=5)
    draw.rounded_rectangle((x0 + 36, y0 + 36, x1 - 36, y1 - 36), radius=42, outline=LIGHT, width=2)
    for x in range(x0 + 140, x1 - 120, 260):
        for y in range(y0 + 180, y1 - 180, 260):
            if random.random() < 0.55:
                draw.ellipse((x, y, x + 10, y + 10), fill=LIGHT)
    draw.arc((x0 + 70, y0 + 70, x0 + 560, y0 + 560), 180, 270, fill=MID, width=6)
    draw.arc((x1 - 560, y1 - 560, x1 - 70, y1 - 70), 0, 90, fill=MID, width=6)


def draw_butterfly(draw: ImageDraw.ImageDraw, x: int, y: int, scale: int = 1, fill=BLACK):
    wing = 26 * scale
    gap = 10 * scale
    width = max(2, scale * 2)
    draw.ellipse((x - wing - gap, y - wing, x - gap, y + wing), outline=fill, width=width)
    draw.ellipse((x + gap, y - wing, x + wing + gap, y + wing), outline=fill, width=width)
    draw.ellipse((x - wing - gap, y - 2 * wing, x - gap, y), outline=fill, width=width)
    draw.ellipse((x + gap, y - 2 * wing, x + wing + gap, y), outline=fill, width=width)
    draw.line((x, y - 2 * wing, x, y + wing), fill=fill, width=width)


def draw_header(draw: ImageDraw.ImageDraw, title: str, subtitle: str | None = None, tag: str | None = None):
    if tag:
        tag_box = (MARGIN, TITLE_Y - 26, MARGIN + 310, TITLE_Y + 40)
        draw.rounded_rectangle(tag_box, radius=28, fill=236, outline=LIGHT, width=2)
        draw.text((tag_box[0] + 24, tag_box[1] + 16), tag, font=TAG_FONT, fill=DARK)
    draw.text((MARGIN, TITLE_Y + 70), title, font=TITLE_FONT, fill=BLACK)
    draw.line((MARGIN, 336, PAGE_W - MARGIN, 336), fill=BLACK, width=4)
    if subtitle:
        lines = wrap_text(draw, subtitle, SUB_FONT, PAGE_W - (MARGIN * 2))
        y = 380
        for line in lines[:3]:
            draw.text((MARGIN, y), line, font=SUB_FONT, fill=DARK)
            y += 56


def draw_footer(draw: ImageDraw.ImageDraw):
    draw.text((MARGIN, FOOTER_Y), "Made For This", font=SMALL_FONT, fill=BLACK)
    draw_butterfly(draw, PAGE_W - MARGIN - 34, FOOTER_Y + 28, scale=1, fill=BLACK)


def new_page(title: str, subtitle: str | None = None, tag: str | None = None, seed: int = 1) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("L", (PAGE_W, PAGE_H), color=WHITE)
    draw = ImageDraw.Draw(img)
    draw_soft_pattern(draw, seed=seed)
    draw_header(draw, title, subtitle=subtitle, tag=tag)
    draw_footer(draw)
    return img, draw


def draw_cover_image(draw: ImageDraw.ImageDraw, image_path: Path | None):
    panel = (290, 760, PAGE_W - 290, 2260)
    draw.rounded_rectangle(panel, radius=42, fill=248, outline=MID, width=3)
    if not image_path or not image_path.exists():
        draw.arc((420, 900, 1220, 1700), 180, 360, fill=MID, width=8)
        draw.arc((1300, 1180, 2100, 1980), 0, 180, fill=LIGHT, width=8)
        return
    try:
        src = Image.open(image_path).convert("L")
        src = ImageOps.autocontrast(src)
        src = ImageOps.fit(src, (1220, 1460), method=Image.Resampling.LANCZOS)
        src = ImageOps.expand(src, border=16, fill=WHITE)
        src = ImageOps.posterize(src.convert("RGB"), 2).convert("L")
        mask = Image.new("L", (1252, 1492), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle((0, 0, 1251, 1491), radius=36, fill=255)
        img = draw._image
        img.paste(src, (649, 860), mask)
        draw.rounded_rectangle((649, 860, 649 + 1252, 860 + 1492), radius=36, outline=BLACK, width=5)
    except Exception:
        draw.arc((420, 900, 1220, 1700), 180, 360, fill=MID, width=8)
        draw.arc((1300, 1180, 2100, 1980), 0, 180, fill=LIGHT, width=8)


def cover_page(title: str, subtitle: str, tag: str, caption: str, seed: int, image_path: Path | None = None) -> Image.Image:
    img, draw = new_page(title, subtitle, tag, seed=seed)
    draw_cover_image(draw, image_path)
    centered_text(draw, title, 2380, SECTION_FONT)
    for idx, line in enumerate(wrap_text(draw, caption, BODY_FONT, 1640)[:2]):
        centered_text(draw, line, 2490 + (idx * 66), BODY_FONT)
    return img


def draw_activity_panel(draw: ImageDraw.ImageDraw, top: int = 620, bottom: int = 2450):
    draw.rounded_rectangle((300, top, PAGE_W - 300, bottom), radius=42, fill=252, outline=LIGHT, width=3)


def draw_scene_people(draw: ImageDraw.ImageDraw, caption: str):
    draw_activity_panel(draw)
    base_y = 1920
    draw.rectangle((360, 1180, 980, 1820), outline=BLACK, width=6)
    draw.polygon([(340, 1180), (670, 920), (1000, 1180)], outline=BLACK, width=6)
    draw.rectangle((555, 1500, 745, 1820), outline=BLACK, width=6)
    draw.rectangle((430, 1310, 550, 1430), outline=BLACK, width=6)
    draw.rectangle((790, 1310, 910, 1430), outline=BLACK, width=6)
    for x, scale in ((1400, 1), (1710, 1), (2020, 0.92)):
        head = 92 * scale
        body_top = base_y - 410
        draw.ellipse((x - head, body_top - 200, x + head, body_top), outline=BLACK, width=6)
        draw.line((x, body_top, x, base_y - 40), fill=BLACK, width=6)
        draw.line((x - 150, body_top + 130, x + 150, body_top + 130), fill=BLACK, width=6)
        draw.line((x, base_y - 40, x - 120, base_y + 180), fill=BLACK, width=6)
        draw.line((x, base_y - 40, x + 120, base_y + 180), fill=BLACK, width=6)
    centered_text(draw, caption, 2530, BODY_FONT)


def draw_book_scene(draw: ImageDraw.ImageDraw, caption: str):
    draw_activity_panel(draw)
    draw.rounded_rectangle((420, 980, 2130, 2230), radius=36, outline=BLACK, width=6)
    draw.arc((590, 1120, 1370, 2040), start=270, end=90, fill=BLACK, width=6)
    draw.arc((1180, 1120, 1960, 2040), start=90, end=270, fill=BLACK, width=6)
    draw.line((1275, 1090, 1275, 2050), fill=BLACK, width=5)
    draw.rectangle((1740, 770, 1940, 970), outline=BLACK, width=6)
    draw.line((1785, 815, 1895, 925), fill=BLACK, width=5)
    draw.line((1895, 815, 1785, 925), fill=BLACK, width=5)
    draw.ellipse((700, 760, 980, 1040), outline=BLACK, width=6)
    centered_text(draw, caption, 2520, BODY_FONT)


def draw_phrase(draw: ImageDraw.ImageDraw, phrase: str, caption: str):
    draw_activity_panel(draw)
    centered_text(draw, phrase, 840, TRACE_FONT)
    for i in range(6):
        y = 1320 + i * 210
        draw.rounded_rectangle((420, y, 2130, y + 120), radius=40, outline=MID, width=4)
        draw.line((485, y + 60, 2065, y + 60), fill=LIGHT, width=2)
    centered_text(draw, caption, 2670, BODY_FONT)


def draw_maze(draw: ImageDraw.ImageDraw, seed: int, caption: str):
    random.seed(seed)
    draw_activity_panel(draw)
    x0, y0, x1, y1 = 420, 760, 2130, 2380
    cols, rows = 9, 9
    cell_w = (x1 - x0) // cols
    cell_h = (y1 - y0) // rows
    for c in range(cols + 1):
        draw.line((x0 + c * cell_w, y0, x0 + c * cell_w, y1), fill=BLACK, width=4)
    for r in range(rows + 1):
        draw.line((x0, y0 + r * cell_h, x1, y0 + r * cell_h), fill=BLACK, width=4)
    path = [(0, 0)]
    x = y = 0
    while x < cols - 1 or y < rows - 1:
        if x == cols - 1:
            y += 1
        elif y == rows - 1:
            x += 1
        elif random.random() < 0.52:
            x += 1
        else:
            y += 1
        path.append((x, y))
    for px, py in path:
        left = x0 + px * cell_w + 14
        top = y0 + py * cell_h + 14
        right = left + cell_w - 28
        bottom = top + cell_h - 28
        draw.rectangle((left, top, right, bottom), fill=WHITE)
    draw.text((430, 695), "Start", font=SUB_FONT, fill=BLACK)
    draw.text((1930, 2390), "Finish", font=SUB_FONT, fill=BLACK)
    centered_text(draw, caption, 2520, BODY_FONT)


def draw_trace_page(draw: ImageDraw.ImageDraw, symbol: str, label: str, caption: str):
    guide_top = 760
    guide_bottom = 1510
    practice_top = 1680
    practice_bottom = 2550

    # Dedicated trace layout instead of the generic activity panel.
    draw.rounded_rectangle((320, guide_top, PAGE_W - 320, guide_bottom), radius=42, fill=252, outline=LIGHT, width=3)
    draw.rounded_rectangle((320, practice_top, PAGE_W - 320, practice_bottom), radius=42, fill=252, outline=LIGHT, width=3)

    centered_text(draw, label, 620, BODY_FONT)

    # Small supporting icons across the top to keep the page feeling purposeful.
    icon_label = "ball" if symbol.isdigit() else "sun" if symbol == "SUN" else "star"
    icon_positions = (720, 1275, 1830)
    if icon_label == "sun":
        for idx, x in enumerate(icon_positions):
            draw_ball_icon(draw, x, 980, 54, fill=None, outline=BLACK if idx == 1 else MID, width=4)
            for angle in range(0, 360, 45):
                dx = 88 * math.cos(math.radians(angle))
                dy = 88 * math.sin(math.radians(angle))
                draw.line((x, 980, x + dx, 980 + dy), fill=BLACK if idx == 1 else MID, width=3)
    else:
        for idx, x in enumerate(icon_positions):
            draw_object_icon(draw, icon_label, x, 980, 58 if idx == 1 else 52, shadow=False)

    # Guided trace row.
    cell_count = 4
    cell_gap = 34
    cell_w = 390
    row_y0 = 1090
    row_y1 = 1410
    start_x = int((PAGE_W - ((cell_w * cell_count) + (cell_gap * (cell_count - 1)))) / 2)
    for i in range(cell_count):
        x0 = start_x + i * (cell_w + cell_gap)
        x1 = x0 + cell_w
        draw.rounded_rectangle((x0, row_y0, x1, row_y1), radius=32, outline=MID, width=3)
        baseline = row_y1 - 66
        midline = row_y0 + 124
        draw.line((x0 + 34, baseline, x1 - 34, baseline), fill=LIGHT, width=2)
        draw.line((x0 + 34, midline, x1 - 34, midline), fill=LIGHT, width=2)
        bbox = draw.textbbox((0, 0), symbol, font=TRACE_FONT)
        sw = bbox[2] - bbox[0]
        sh = bbox[3] - bbox[1]
        tx = x0 + (cell_w - sw) / 2
        ty = row_y0 + (row_y1 - row_y0 - sh) / 2 - 10
        draw.text((tx, ty), symbol, font=TRACE_FONT, fill=218)

    # Practice rows with repeated trace prompts and writing lines.
    practice_y = practice_top + 90
    for row in range(4):
        y0 = practice_y + row * 185
        y1 = y0 + 120
        draw.rounded_rectangle((420, y0, 2130, y1), radius=34, outline=LIGHT, width=3)
        draw.line((470, y0 + 78, 2080, y0 + 78), fill=LIGHT, width=2)
        bbox = draw.textbbox((0, 0), symbol, font=TRACE_FONT)
        sw = bbox[2] - bbox[0]
        sh = bbox[3] - bbox[1]
        draw.text((500, y0 + (120 - sh) / 2 - 14), symbol, font=TRACE_FONT, fill=230)
        dash_start = 500 + sw + 70
        for dash in range(5):
            dx0 = dash_start + dash * 205
            draw.line((dx0, y0 + 78, dx0 + 120, y0 + 78), fill=MID, width=3)

    centered_text(draw, caption, 2690, BODY_FONT)


def draw_star_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    points = [
        (x, y - size),
        (x + size * 0.28, y - size * 0.3),
        (x + size, y - size * 0.2),
        (x + size * 0.45, y + size * 0.2),
        (x + size * 0.62, y + size),
        (x, y + size * 0.52),
        (x - size * 0.62, y + size),
        (x - size * 0.45, y + size * 0.2),
        (x - size, y - size * 0.2),
        (x - size * 0.28, y - size * 0.3),
    ]
    draw.polygon(points, fill=fill, outline=outline, width=width)


def draw_ball_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.ellipse((x - size, y - size, x + size, y + size), fill=fill, outline=outline, width=width)
    draw.arc((x - size * 0.9, y - size * 0.9, x + size * 0.9, y + size * 0.9), 45, 225, fill=outline, width=max(3, width - 1))
    draw.arc((x - size * 0.6, y - size, x + size * 0.6, y + size), 90, 270, fill=outline, width=max(3, width - 1))


def draw_book_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    left = (x - size, y - size * 0.82, x, y + size * 0.82)
    right = (x, y - size * 0.82, x + size, y + size * 0.82)
    draw.rounded_rectangle(left, radius=18, fill=fill, outline=outline, width=width)
    draw.rounded_rectangle(right, radius=18, fill=fill, outline=outline, width=width)
    draw.line((x, y - size * 0.82, x, y + size * 0.82), fill=outline, width=max(3, width - 1))
    draw.line((x - size * 0.66, y - size * 0.35, x - size * 0.18, y - size * 0.35), fill=outline, width=max(2, width - 2))
    draw.line((x + size * 0.18, y - size * 0.35, x + size * 0.66, y - size * 0.35), fill=outline, width=max(2, width - 2))


def draw_tree_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    canopy = [
        (x, y - size * 1.15),
        (x + size * 0.92, y - size * 0.2),
        (x + size * 0.45, y - size * 0.2),
        (x + size * 1.08, y + size * 0.48),
        (x + size * 0.28, y + size * 0.48),
        (x + size * 0.82, y + size * 1.12),
        (x - size * 0.82, y + size * 1.12),
        (x - size * 0.28, y + size * 0.48),
        (x - size * 1.08, y + size * 0.48),
        (x - size * 0.45, y - size * 0.2),
        (x - size * 0.92, y - size * 0.2),
    ]
    draw.polygon(canopy, fill=fill, outline=outline, width=width)
    draw.rectangle((x - size * 0.18, y + size * 1.12, x + size * 0.18, y + size * 1.65), fill=fill, outline=outline, width=width)


def draw_cloud_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    parts = [
        (x - size * 0.9, y - size * 0.12, x - size * 0.1, y + size * 0.72),
        (x - size * 0.2, y - size * 0.58, x + size * 0.72, y + size * 0.62),
        (x - size * 0.7, y - size * 0.78, x + size * 0.12, y + size * 0.38),
    ]
    for box in parts:
        draw.ellipse(box, fill=fill, outline=outline, width=width)
    draw.line((x - size, y + size * 0.35, x + size, y + size * 0.35), fill=outline, width=width)


def draw_leaf_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.ellipse((x - size * 0.72, y - size, x + size * 0.72, y + size), fill=fill, outline=outline, width=width)
    draw.line((x - size * 0.62, y + size * 0.62, x + size * 0.55, y - size * 0.62), fill=outline, width=max(3, width - 1))


def draw_cup_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.rounded_rectangle((x - size * 0.7, y - size * 0.6, x + size * 0.45, y + size * 0.72), radius=18, fill=fill, outline=outline, width=width)
    draw.arc((x + size * 0.15, y - size * 0.2, x + size * 0.95, y + size * 0.55), 270, 90, fill=outline, width=width)
    draw.line((x - size * 0.55, y - size * 0.82, x + size * 0.3, y - size * 0.82), fill=outline, width=max(3, width - 1))


def draw_toy_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.rounded_rectangle((x - size * 0.9, y - size * 0.42, x + size * 0.9, y + size * 0.42), radius=24, fill=fill, outline=outline, width=width)
    draw.ellipse((x - size * 1.25, y - size * 0.32, x - size * 0.78, y + size * 0.32), fill=fill, outline=outline, width=width)
    draw.ellipse((x + size * 0.78, y - size * 0.32, x + size * 1.25, y + size * 0.32), fill=fill, outline=outline, width=width)


def draw_heart_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.ellipse((x - size, y - size * 0.95, x, y), fill=fill, outline=outline, width=width)
    draw.ellipse((x, y - size * 0.95, x + size, y), fill=fill, outline=outline, width=width)
    draw.polygon([(x - size * 0.98, y - size * 0.22), (x + size * 0.98, y - size * 0.22), (x, y + size * 1.15)], fill=fill, outline=outline, width=width)


def draw_square_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.rectangle((x - size, y - size, x + size, y + size), fill=fill, outline=outline, width=width)


def draw_triangle_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.polygon([(x, y - size), (x + size, y + size), (x - size, y + size)], fill=fill, outline=outline, width=width)


def draw_door_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.rounded_rectangle((x - size * 0.62, y - size, x + size * 0.62, y + size), radius=18, fill=fill, outline=outline, width=width)
    knob_r = max(6, int(size * 0.08))
    draw.ellipse((x + size * 0.24 - knob_r, y, x + size * 0.24 + knob_r, y + knob_r * 2), fill=outline)


def draw_window_icon(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, fill=None, outline=BLACK, width: int = 5):
    draw.rectangle((x - size, y - size, x + size, y + size), fill=fill, outline=outline, width=width)
    draw.line((x, y - size, x, y + size), fill=outline, width=max(3, width - 1))
    draw.line((x - size, y, x + size, y), fill=outline, width=max(3, width - 1))


def draw_object_icon(draw: ImageDraw.ImageDraw, label: str, x: int, y: int, size: int, shadow: bool = False):
    label_key = str(label or "").strip().lower()
    fill = BLACK if shadow else None
    outline = BLACK
    width = 5
    if "star" in label_key:
        draw_star_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "ball" in label_key:
        draw_ball_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "book" in label_key:
        draw_book_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "tree" in label_key:
        draw_tree_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "cloud" in label_key:
        draw_cloud_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "leaf" in label_key:
        draw_leaf_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "cup" in label_key:
        draw_cup_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "toy" in label_key:
        draw_toy_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "heart" in label_key:
        draw_heart_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "square" in label_key:
        draw_square_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "triangle" in label_key:
        draw_triangle_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "door" in label_key:
        draw_door_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    elif "window" in label_key:
        draw_window_icon(draw, x, y, size, fill=fill, outline=outline, width=width)
    else:
        draw.ellipse((x - size, y - size, x + size, y + size), fill=fill, outline=outline, width=width)


def draw_matching_page(draw: ImageDraw.ImageDraw, caption: str, page: dict[str, Any] | None = None):
    draw_activity_panel(draw)
    left_x, right_x = 670, 1820
    top = 960
    labels = page.get("items") if isinstance(page, dict) and isinstance(page.get("items"), list) else ["Star", "Ball", "Book", "Tree"]
    labels = [str(item).strip().title() for item in labels[:4] if str(item).strip()] or ["Star", "Ball", "Book", "Tree"]
    shadow_order = list(range(len(labels)))
    if len(shadow_order) > 1:
        shadow_order = shadow_order[1:] + shadow_order[:1]
    draw.rounded_rectangle((430, 760, 2120, 2330), radius=36, outline=LIGHT, width=3)
    for i, label in enumerate(labels):
        y = top + i * 300
        draw_object_icon(draw, label, left_x, y, 78, shadow=False)
        label_w = draw.textbbox((0, 0), label, font=BODY_FONT)[2]
        draw.text((left_x - label_w / 2, y + 118), label, font=BODY_FONT, fill=BLACK)
        shadow_label = labels[shadow_order[i]]
        draw_object_icon(draw, shadow_label, right_x, y, 78, shadow=True)
    centered_text(draw, "Draw a line from each object to its shadow.", 2440, BODY_FONT)
    centered_text(draw, caption, 2520, BODY_FONT)


def draw_cut_paste(draw: ImageDraw.ImageDraw, caption: str, page: dict[str, Any] | None = None):
    draw_activity_panel(draw)
    centered_text(draw, "Cut out the shapes and build a house.", 520, BODY_FONT)
    draw.rectangle((430, 860, 980, 1310), outline=BLACK, width=6)
    draw.polygon([(405, 860), (705, 590), (1005, 860)], outline=BLACK, width=6)
    draw.rectangle((1260, 860, 2130, 1430), outline=MID, width=4)
    pieces = page.get("pieces") if isinstance(page, dict) and isinstance(page.get("pieces"), list) else ["square", "triangle", "door", "window"]
    boxes = [
        (620, 1850),
        (1070, 1850),
        (1520, 1850),
        (1970, 1850),
    ]
    for idx, name in enumerate([str(p).strip().lower() for p in pieces[:4]]):
        x, y = boxes[idx]
        draw_object_icon(draw, name, x, y, 115, shadow=False)
        box = (x - 150, y - 150, x + 150, y + 150)
        draw.line((box[0], 2100, box[2], 2100), fill=MID, width=3)
        draw.text((box[0] + 26, 2140), "Cut here", font=SMALL_FONT, fill=DARK)
    centered_text(draw, caption, 2620, BODY_FONT)


def draw_find_seek(draw: ImageDraw.ImageDraw, caption: str, page: dict[str, Any] | None = None):
    draw_activity_panel(draw)
    random.seed(7)
    targets = page.get("targets") if isinstance(page, dict) and isinstance(page.get("targets"), list) else ["circle", "star", "heart"]
    target_labels = [str(t).strip().lower() for t in targets[:3] if str(t).strip()] or ["circle", "star", "heart"]
    clutter = target_labels + ["cloud", "leaf", "book", "ball", "star", "heart", "cup", "toy"]
    for idx in range(18):
        label = clutter[idx % len(clutter)]
        x = random.randint(560, 1940)
        y = random.randint(930, 2070)
        size = random.randint(46, 78)
        draw_object_icon(draw, label, x, y, size, shadow=False)
    legend = ", ".join(target_labels)
    centered_text(draw, f"Find these hidden objects: {legend}.", 2520, BODY_FONT)
    centered_text(draw, caption, 2600, SMALL_FONT)


def normalize_page(page: dict[str, Any], base: dict[str, Any]) -> dict[str, Any]:
    merged = {**base, **page}
    if merged.get("type") == "matching":
        items = merged.get("items")
        if not isinstance(items, list) or not items:
            merged["items"] = base.get("items") or ["Star", "Ball", "Book", "Tree"]
    if merged.get("type") == "find_seek":
        targets = merged.get("targets")
        if not isinstance(targets, list) or not targets:
            merged["targets"] = base.get("targets") or ["circle", "star", "heart"]
    if merged.get("type") == "cut_paste":
        pieces = merged.get("pieces")
        if not isinstance(pieces, list) or not pieces:
            merged["pieces"] = base.get("pieces") or ["square", "triangle", "door", "window"]
    return merged


def draw_quiet_time(draw: ImageDraw.ImageDraw, prompt: str, caption: str):
    draw_activity_panel(draw)
    centered_text(draw, prompt, 540, BODY_FONT)
    draw.rounded_rectangle((370, 860, 2180, 2410), radius=36, outline=BLACK, width=4)
    for i in range(7):
        y = 1060 + i * 180
        draw.line((470, y, 2080, y), fill=LIGHT, width=2)
    centered_text(draw, caption, 2580, BODY_FONT)


def render_page(page: dict[str, Any], seed: int) -> Image.Image:
    title = str(page.get("title") or "Printable Page").strip()
    subtitle = str(page.get("subtitle") or page.get("instruction") or "").strip()
    page_type = str(page.get("type") or "coloring").strip().lower()
    img, draw = new_page(title, subtitle=subtitle, seed=seed)
    caption = str(page.get("caption") or page.get("instruction") or "Enjoy this printable page.").strip()

    if page_type == "coloring":
        scene = str(page.get("scene") or "").lower()
        phrase = str(page.get("phrase") or "").strip()
        if phrase:
            draw_phrase(draw, phrase, caption)
        elif any(keyword in scene for keyword in ["reading", "book", "quiet", "bedtime"]):
            draw_book_scene(draw, caption)
        else:
            draw_scene_people(draw, caption)
    elif page_type == "maze":
        draw_maze(draw, seed, caption)
    elif page_type == "trace":
        draw_trace_page(
            draw,
            str(page.get("symbol") or "A").upper(),
            str(page.get("label") or "Trace the letter A"),
            caption,
        )
    elif page_type == "matching":
        draw_matching_page(draw, caption, page)
    elif page_type == "cut_paste":
        draw_cut_paste(draw, caption, page)
    elif page_type == "find_seek":
        draw_find_seek(draw, caption, page)
    elif page_type == "quiet_time":
        draw_quiet_time(draw, str(page.get("prompt") or "Draw your favorite thing."), caption)
    else:
        draw_scene_people(draw, caption)
    return img


def fallback_spec(prompt_text: str) -> dict[str, Any]:
    return {
        "brand_name": "Made For This",
        "bundle_title": "Kids Activity & Coloring Printable Bundle",
        "prompt_summary": prompt_text[:800],
        "packs": [
            {
                "key": "coloring-pages-pack",
                "title": "Coloring Pages Pack",
                "subtitle": "Gentle everyday scenes and phrase pages for ages 3 to 7.",
                "cover_caption": "Everyday moments, calm pages, and simple encouragement.",
                "preview_prompt": "Minimal black and white kids printable bundle cover page on soft neutral desk, calm modern lifestyle brand, clean typography, not childish, Made For This aesthetic",
                "pages": [
                    {"type": "coloring", "title": "Coloring Page - Family At Home", "scene": "family home routine", "instruction": "Fun everyday scene", "caption": "Color the family and the cozy home scene."},
                    {"type": "coloring", "title": "Coloring Page - Reading Time", "scene": "reading quiet time", "instruction": "Quiet moment page", "caption": "A calm page for quiet reading time."},
                    {"type": "coloring", "title": "Coloring Page - You've Got This", "phrase": "You've got this", "instruction": "Simple encouragement", "caption": "Color the phrase and trace your own ideas below."},
                    {"type": "coloring", "title": "Coloring Page - Be Kind", "phrase": "Be kind", "instruction": "Simple encouragement", "caption": "Use this page for a calm coloring break."},
                ],
            },
            {
                "key": "mazes-pack",
                "title": "Mazes Pack",
                "subtitle": "Clean easy-to-medium mazes with enough challenge to stay fun.",
                "cover_caption": "Clear paths and calm layouts for easy printing.",
                "preview_prompt": "Black and white kids maze printable cover mockup, calm modern printable bundle, neutral desk scene, clean paper stack, premium minimal brand",
                "pages": [
                    {"type": "maze", "title": "Maze 1", "instruction": "Easy to medium challenge", "caption": "Help the character find the way home."},
                    {"type": "maze", "title": "Maze 2", "instruction": "Easy to medium challenge", "caption": "Can you find the toy?"},
                    {"type": "maze", "title": "Maze 3", "instruction": "Easy to medium challenge", "caption": "Guide the child to the goal."},
                ],
            },
            {
                "key": "trace-and-learn-pack",
                "title": "Trace & Learn Pack",
                "subtitle": "Letters, numbers, and easy words with room to practice.",
                "cover_caption": "Clean tracing pages with matching icons and calm spacing.",
                "preview_prompt": "Minimal educational tracing printable cover on warm neutral desk, black and white line-art learning sheets, calm premium mom brand aesthetic",
                "pages": [
                    {"type": "trace", "title": "Trace the letter A", "symbol": "A", "label": "Trace the letter A", "instruction": "Practice page", "caption": "Trace slowly and say the letter out loud."},
                    {"type": "trace", "title": "Trace the number 3", "symbol": "3", "label": "Trace the number 3", "instruction": "Practice page", "caption": "Trace each number and practice again on the lines."},
                    {"type": "trace", "title": "Trace the word SUN", "symbol": "SUN", "label": "Trace the word SUN", "instruction": "Practice page", "caption": "Trace the word and practice writing it below."},
                ],
            },
            {
                "key": "matching-activities-pack",
                "title": "Matching Activities Pack",
                "subtitle": "Simple pair matching pages with a clean, uncluttered layout.",
                "cover_caption": "Pair, match, and connect without crowded visuals.",
                "preview_prompt": "Minimal matching activity worksheet cover for kids, premium printable mockup, black and white line art pages, soft neutral tabletop",
                "pages": [
                    {"type": "matching", "title": "Object to Shadow Matching", "instruction": "Draw the matching lines", "caption": "Draw a line to match each pair.", "items": ["Star", "Ball", "Book", "Tree"]},
                    {"type": "matching", "title": "Simple Pair Matching", "instruction": "Draw the matching lines", "caption": "Find the correct matching object.", "items": ["Toy", "Cup", "Cloud", "Leaf"]},
                ],
            },
            {
                "key": "cut-and-paste-pack",
                "title": "Cut & Paste Pack",
                "subtitle": "Hands-on printable pages with clean spacing for little scissors.",
                "cover_caption": "Build simple objects one page at a time.",
                "preview_prompt": "Kids cut and paste printable pack cover mockup, modern neutral lifestyle brand, clean worksheet stack, black and white activity sheets",
                "pages": [
                    {"type": "cut_paste", "title": "Cut & Paste Activity", "instruction": "Build the simple scene", "caption": "Cut the shapes and place them in the right spots.", "pieces": ["square", "triangle", "door", "window"]},
                ],
            },
            {
                "key": "find-and-seek-pack",
                "title": "Find & Seek Pack",
                "subtitle": "Hidden object pages that are fun, clean, and slightly challenging.",
                "cover_caption": "A little challenge with lots of breathing room.",
                "preview_prompt": "Hidden object printable pack cover page, premium minimalist kids activity bundle, neutral desk scene, black and white worksheet stack",
                "pages": [
                    {"type": "find_seek", "title": "Find & Seek", "instruction": "Hidden object page", "caption": "Find 5 circles and 4 stars in the scene.", "targets": ["circle", "star", "heart"]},
                ],
            },
            {
                "key": "quiet-time-pack",
                "title": "Quiet Time Pack",
                "subtitle": "Low-stimulation prompt pages for slower, calmer parts of the day.",
                "cover_caption": "Soft, minimal pages for slower moments.",
                "preview_prompt": "Quiet time printable pack cover, soft minimal kids worksheet aesthetic, premium neutral brand, black and white printable pages on desk",
                "pages": [
                    {"type": "quiet_time", "title": "Quiet Time - Favorite Thing", "prompt": "Draw your favorite thing.", "instruction": "Calm drawing prompt", "caption": "Take your time and fill the page with your favorite thing."},
                    {"type": "quiet_time", "title": "Quiet Time - Feelings", "prompt": "Draw how you feel today.", "instruction": "Calm drawing prompt", "caption": "Use this page to draw your feelings in a simple way."},
                ],
            },
        ],
    }


def _normalize_pages(pack: dict[str, Any], fallback_pack: dict[str, Any]) -> list[dict[str, Any]]:
    pages = pack.get("pages")
    if not isinstance(pages, list) or not pages:
        return fallback_pack["pages"]
    cleaned: list[dict[str, Any]] = []
    for idx, page in enumerate(pages):
        if not isinstance(page, dict):
            continue
        base = fallback_pack["pages"][min(idx, len(fallback_pack["pages"]) - 1)]
        cleaned.append(normalize_page(page, base))
    return cleaned or fallback_pack["pages"]


def normalize_spec(raw_spec: dict[str, Any], prompt_text: str) -> dict[str, Any]:
    fallback = fallback_spec(prompt_text)
    packs_by_key = {pack["key"]: pack for pack in fallback["packs"]}
    raw_packs = raw_spec.get("packs") if isinstance(raw_spec, dict) else None
    raw_pack_map = {}
    if isinstance(raw_packs, list):
        for pack in raw_packs:
            if isinstance(pack, dict):
                key = str(pack.get("key") or _slug(pack.get("title") or "")).strip()
                if key:
                    raw_pack_map[key] = pack

    packs = []
    for fallback_pack in fallback["packs"]:
        raw_pack = raw_pack_map.get(fallback_pack["key"], {})
        packs.append(
            {
                "key": fallback_pack["key"],
                "title": str(raw_pack.get("title") or fallback_pack["title"]).strip(),
                "subtitle": str(raw_pack.get("subtitle") or fallback_pack["subtitle"]).strip(),
                "cover_caption": str(raw_pack.get("cover_caption") or fallback_pack["cover_caption"]).strip(),
                "preview_prompt": str(raw_pack.get("preview_prompt") or fallback_pack["preview_prompt"]).strip(),
                "pages": _normalize_pages(raw_pack, fallback_pack),
            }
        )
    return {
        "brand_name": str(raw_spec.get("brand_name") or fallback["brand_name"]).strip(),
        "bundle_title": str(raw_spec.get("bundle_title") or fallback["bundle_title"]).strip(),
        "prompt_summary": str(raw_spec.get("prompt_summary") or prompt_text[:800]).strip(),
        "packs": packs,
    }


def generate_bundle_spec(prompt_text: str, reference_image: str = "", variant_note: str = "") -> dict[str, Any]:
    prompt = f"""
Create a JSON production spec for a printable bundle.

Brand: Made For This
Bundle: Kids Activity & Coloring Printable Bundle

Use the following client request as the source of truth:
{prompt_text}

Return one JSON object with exactly these top-level keys:
- brand_name
- bundle_title
- prompt_summary
- packs

Rules for packs:
- Return exactly 7 packs.
- Use these pack keys exactly:
  coloring-pages-pack
  mazes-pack
  trace-and-learn-pack
  matching-activities-pack
  cut-and-paste-pack
  find-and-seek-pack
  quiet-time-pack
- Each pack needs:
  key
  title
  subtitle
  cover_caption
  preview_prompt
  pages

Rules for pages:
- 1 to 4 pages per pack.
- Each page must include:
  type
  title
  instruction
  caption
- For type=coloring, optionally include scene or phrase.
- For type=trace, include symbol and label.
- For type=quiet_time, include prompt.
- For type=matching, include items as an array of exactly 4 object names.
- For type=find_seek, include targets as an array of 3 hidden object names.
- For type=cut_paste, include pieces as an array of 4 shape/object names.

Allowed page types only:
- coloring
- maze
- trace
- matching
- cut_paste
- find_seek
- quiet_time

Do not include orthodontic or dental content.
Keep tone calm, gender-neutral, modern, printable-friendly, and appropriate for ages 3 to 7.
Variation direction: {variant_note or "Use the strongest premium printable direction for this brand."}
Return JSON only.
""".strip()
    return normalize_spec(_chat_json(prompt, reference_image=reference_image), prompt_text)


def build_review_manifest(*, spec: dict[str, Any], bundle_zip: Path, pdfs: list[Path], preview_dir: Path, variant_key: str) -> dict[str, Any]:
    packs = []
    for pack in spec.get("packs", []):
        key = str(pack.get("key") or "").strip()
        packs.append(
            {
                "key": key,
                "title": pack.get("title"),
                "preview": str((preview_dir / pack_preview_name(key)).resolve()),
                "pdf": str((next((p for p in pdfs if p.stem == key), Path(""))).resolve()),
                "status": "review_ready",
            }
        )
    return {
        "brand_name": spec.get("brand_name"),
        "bundle_title": spec.get("bundle_title"),
        "variant_key": variant_key,
        "created_from_prompt": str(PROMPT_PATH.resolve()),
        "bundle_zip": str(bundle_zip.resolve()),
        "packs": packs,
        "status": "review_ready",
    }


def save_pack(name: str, pages: list[Image.Image], preview_name: str, out_dir: Path, preview_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / f"{name}.pdf"
    png_path = preview_dir / preview_name
    rgb_pages = [p.convert("RGB") for p in pages]
    rgb_pages[0].save(pdf_path, save_all=True, append_images=rgb_pages[1:])
    rgb_pages[0].save(png_path)
    return pdf_path


def build_bundle_zip(paths: list[Path], zip_path: Path):
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in paths:
            zf.write(path, arcname=path.name)
    return zip_path


def pack_preview_name(pack_key: str) -> str:
    preview_map = {
        "coloring-pages-pack": "kids-coloring-preview.png",
        "mazes-pack": "kids-mazes-preview.png",
        "trace-and-learn-pack": "kids-trace-preview.png",
        "matching-activities-pack": "kids-matching-preview.png",
        "cut-and-paste-pack": "kids-cut-preview.png",
        "find-and-seek-pack": "kids-find-preview.png",
        "quiet-time-pack": "kids-quiet-preview.png",
    }
    return preview_map.get(pack_key, f"{_slug(pack_key)}-preview.png")


def render_pack(pack: dict[str, Any], index: int, preview_path: Path | None = None) -> list[Image.Image]:
    pages = [
        cover_page(
            title=pack["title"],
            subtitle=pack["subtitle"],
            tag=f"Pack {index + 1:02d}",
            caption=pack["cover_caption"],
            seed=100 + index,
            image_path=preview_path,
        )
    ]
    for page_index, page in enumerate(pack["pages"]):
        pages.append(render_page(page, seed=(index + 1) * 50 + page_index))
    return pages


def main():
    parser = argparse.ArgumentParser(description="Generate AI-driven Made For This kids printable bundle assets.")
    parser.add_argument("--prompt-file", default=str(PROMPT_PATH), help="Path to the bundle prompt markdown/text file.")
    parser.add_argument("--spec-out", default=str(SPEC_PATH), help="Path to save the generated JSON spec.")
    parser.add_argument("--skip-ai-images", action="store_true", help="Skip OpenAI cover preview image generation.")
    parser.add_argument("--reference-image", default="", help="Optional local image path to use as style/reference context.")
    parser.add_argument("--variant-key", default="primary", help="Label for this generation variant.")
    parser.add_argument("--variant-note", default="", help="Extra style direction for this variation.")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Directory for generated PDF packs.")
    parser.add_argument("--preview-dir", default=str(DEFAULT_PREVIEW_DIR), help="Directory for generated preview PNGs.")
    parser.add_argument("--zip-out", default=str(ROOT / "downloads" / "kids-activity-coloring-bundle.zip"), help="Path for generated bundle ZIP.")
    args = parser.parse_args()

    prompt_text = Path(args.prompt_file).read_text(encoding="utf-8")
    spec = generate_bundle_spec(prompt_text, reference_image=args.reference_image, variant_note=args.variant_note)

    out_dir = Path(args.out_dir)
    preview_dir = Path(args.preview_dir)
    zip_out = Path(args.zip_out)
    out_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    spec_path = Path(args.spec_out)
    spec_path.parent.mkdir(parents=True, exist_ok=True)
    spec_path.write_text(json.dumps(spec, indent=2), encoding="utf-8")

    pdfs: list[Path] = []
    for idx, pack in enumerate(spec["packs"]):
        preview_name = pack_preview_name(pack["key"])
        preview_path = preview_dir / preview_name
        if not args.skip_ai_images:
            _generate_preview_image(pack["preview_prompt"], preview_path)
        pages = render_pack(pack, idx, preview_path if preview_path.exists() else None)
        pdfs.append(save_pack(pack["key"], pages, preview_name, out_dir, preview_dir))

    bundle_zip = build_bundle_zip(pdfs, zip_out)
    manifest = build_review_manifest(spec=spec, bundle_zip=bundle_zip, pdfs=pdfs, preview_dir=preview_dir, variant_key=args.variant_key)
    (out_dir / f"review-manifest-{_slug(args.variant_key)}.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Generated spec:")
    print(spec_path)
    print("Generated PDFs:")
    for pdf in pdfs:
        print(pdf)
    print(bundle_zip)


if __name__ == "__main__":
    main()
