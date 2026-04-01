from __future__ import annotations

import datetime as dt
import html
import json
import shutil
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SPEC_PATH = ROOT / "downloads" / "kids-activity" / "kids-activity-bundle-spec.json"
LIVE_DIR = ROOT / "live-printables" / "kids-activity"
ARCHIVE_DIR = ROOT / "downloads" / "kids-activity-archive"
PDF_DIR = ROOT / "downloads" / "kids-activity"
ZIP_PATH = ROOT / "downloads" / "kids-activity-coloring-bundle.zip"
PRINT_CSS = """
:root{
  --paper:#ffffff;
  --ink:#171717;
  --muted:#696969;
  --line:#d8d8d8;
  --soft:#f7f4ee;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  font-family:"Avenir Next","Segoe UI",Arial,sans-serif;
  color:var(--ink);
  background:
    radial-gradient(circle at top left, rgba(215,205,187,.55), transparent 30%),
    linear-gradient(180deg,#f8f4ed 0%,#f3eee5 100%);
}
a{color:inherit}
.studio-shell{max-width:1180px;margin:0 auto;padding:24px 16px 48px}
.studio-header,.pack-hero,.print-page{
  background:rgba(255,255,255,.94);
  border:1px solid #e8dfd2;
  border-radius:24px;
  box-shadow:0 18px 50px rgba(47,36,20,.08);
}
.studio-header{padding:28px;margin-bottom:18px}
.eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8b6e3c;font-weight:700}
h1,h2,h3,p{margin:0}
.studio-header h1,.pack-hero h1{margin-top:6px;font-size:clamp(28px,4vw,46px);line-height:1.02}
.studio-header p,.pack-hero p{margin-top:10px;color:#5d5344;max-width:760px;line-height:1.6}
.button-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.btn{
  appearance:none;border:1px solid #d8c8ae;border-radius:999px;padding:12px 18px;
  text-decoration:none;font-weight:700;background:#fff7e7;color:#6e5221;cursor:pointer;
}
.btn.secondary{background:#fff;border-color:#e5ddd0;color:#3f372d}
.pack-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:18px}
.pack-card{padding:16px;border:1px solid #ebe2d6;border-radius:18px;background:rgba(255,255,255,.9)}
.pack-card h3{margin-top:12px;font-size:19px}
.pack-card p{margin-top:8px;color:#62574a;line-height:1.55;font-size:14px}
.pack-hero{padding:28px;margin-bottom:18px}
.print-grid{display:grid;gap:18px}
.print-page{padding:26px;page-break-after:always}
.print-page:last-child{page-break-after:auto}
.print-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;border-bottom:1px solid #d7ccba;padding-bottom:12px}
.print-head h2{font-size:28px;line-height:1.08}
.print-head p{font-size:14px;color:var(--muted);margin-top:8px}
.brand-mark{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8b6e3c}
.worksheet{margin-top:18px;border:1px solid var(--line);border-radius:22px;padding:18px;background:var(--paper)}
.ghost-row,.practice-row{display:grid;gap:12px}
.ghost-row{grid-template-columns:repeat(4,1fr);margin-top:16px}
.trace-box,.practice-box,.match-box,.shape-box,.quiet-box,.seek-box,.color-box{
  border:1px solid var(--line);border-radius:18px;background:#fff;
}
.trace-box{height:150px;display:grid;place-items:center;color:#d6d1c9;font-size:78px;font-weight:800}
.practice-row{margin-top:18px}
.practice-box{height:92px;position:relative;padding:16px 18px}
.practice-box::after,.practice-box::before{
  content:"";position:absolute;left:18px;right:18px;border-top:1px solid #ddd;opacity:.95
}
.practice-box::before{top:32px}
.practice-box::after{top:62px}
.practice-symbol{position:absolute;left:18px;top:6px;font-size:58px;color:#e3ddd1;font-weight:800}
.match-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:14px}
.match-col{display:grid;gap:14px}
.match-item{display:grid;grid-template-columns:88px 1fr;gap:12px;align-items:center;padding:10px;border:1px solid #ebe4d8;border-radius:16px}
.match-item.shadow .label{color:#8a8173}
.icon-box{width:76px;height:76px;display:grid;place-items:center;border:1px solid #ece5d8;border-radius:16px;background:#faf8f4}
.label{font-weight:700;font-size:17px}
.shape-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:20px;align-items:start}
.house-stage{padding:18px;border:1px solid #e8e1d6;border-radius:18px;background:#faf8f4;min-height:280px}
.pieces-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.shape-box{padding:10px;display:grid;place-items:center;min-height:132px}
.seek-board{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
.seek-box{padding:12px;min-height:110px;display:grid;place-items:center}
.target-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.target-pill{border:1px solid #e1d7c7;border-radius:999px;padding:7px 10px;background:#faf6ee;font-size:13px;font-weight:700}
.quiet-box{min-height:430px;padding:18px}
.line-stack{margin-top:22px;display:grid;gap:24px}
.line-stack span{display:block;border-top:1px solid #d8d8d8}
.phrase{font-size:clamp(36px,5vw,60px);font-weight:800;letter-spacing:-.03em;text-align:center;color:#232323}
.small-note{margin-top:14px;font-size:14px;color:#706453;line-height:1.55}
.footer-note{margin-top:16px;font-size:12px;color:#8c816f;text-align:center}
.preview-kicker{display:grid;gap:8px}
.preview-shell{
  position:relative;
  width:100%;
  min-height:220px;
  border-radius:18px;
  border:1px solid #ece2d6;
  background:
    radial-gradient(circle at top right, rgba(244,224,192,.75), transparent 30%),
    linear-gradient(180deg,#fffdfa 0%,#f5efe5 100%);
  overflow:hidden;
  box-shadow:0 14px 30px rgba(69,49,23,.07);
}
.preview-shell::before{
  content:"";
  position:absolute;
  inset:14px;
  border-radius:14px;
  border:1px solid rgba(161,131,86,.18);
}
.preview-card{
  position:absolute;
  border-radius:14px;
  border:1px solid rgba(118,92,48,.14);
  background:rgba(255,255,255,.96);
  box-shadow:0 14px 24px rgba(85,62,26,.08);
}
.preview-mini-title{
  position:absolute;
  left:18px;
  top:14px;
  font-size:11px;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:#8b6e3c;
  font-weight:800;
}
.preview-footer{
  position:absolute;
  left:18px;
  right:18px;
  bottom:14px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:11px;
  color:#8b7c66;
  font-weight:700;
}
.preview-dots{display:flex;gap:6px}
.preview-dots span{
  width:8px;height:8px;border-radius:50%;
  background:#d9cfbe;border:1px solid #d1c4ad;
}
.preview-coloring .preview-card.main{left:20px;top:40px;width:58%;height:128px;padding:18px}
.preview-coloring .preview-card.side{right:20px;top:58px;width:28%;height:106px;padding:12px}
.preview-coloring .preview-phrase{font-size:24px;line-height:1.02;font-weight:800;letter-spacing:-.04em;max-width:150px}
.preview-coloring .preview-lines{position:absolute;left:18px;right:18px;bottom:18px;display:grid;gap:8px}
.preview-coloring .preview-lines span,.preview-quiet .preview-lines span{display:block;border-top:1px solid #ddd3c4}
.preview-coloring .preview-icon{position:absolute;right:14px;bottom:14px;width:54px;opacity:.95}
.preview-maze .preview-card.main{left:20px;right:20px;top:42px;height:136px;padding:14px}
.preview-maze .preview-card.goal{right:26px;bottom:28px;width:96px;height:34px;padding:8px 12px}
.preview-trace .preview-card.main{left:20px;right:20px;top:42px;height:140px;padding:16px}
.preview-trace .preview-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px}
.preview-trace .preview-glyph,.preview-trace .preview-line{
  border:1px solid #e5dccd;border-radius:12px;background:#fffaf2;height:38px;display:grid;place-items:center;
}
.preview-trace .preview-glyph{font-size:26px;color:#cfbe9b;font-weight:800}
.preview-trace .preview-line{position:relative}
.preview-trace .preview-line::before,.preview-trace .preview-line::after{
  content:"";position:absolute;left:10px;right:10px;border-top:1px dashed #d9cdb8
}
.preview-trace .preview-line::before{top:14px}
.preview-trace .preview-line::after{top:24px}
.preview-matching .preview-card.left{left:20px;top:44px;width:42%;height:136px;padding:12px}
.preview-matching .preview-card.right{right:20px;top:44px;width:42%;height:136px;padding:12px}
.preview-matching .preview-pair{display:grid;grid-template-columns:42px 1fr;gap:8px;align-items:center;margin-bottom:10px}
.preview-matching .preview-icon-box{
  width:42px;height:42px;border-radius:12px;border:1px solid #e6dccd;background:#fffdf8;display:grid;place-items:center;
}
.preview-matching .preview-name{height:10px;border-radius:999px;background:#e7ded0}
.preview-cut .preview-card.stage{left:20px;top:40px;width:54%;height:138px;padding:14px}
.preview-cut .preview-card.pieces{right:20px;top:52px;width:28%;height:114px;padding:10px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.preview-cut .preview-piece{border:1px solid #e5dbcd;border-radius:12px;background:#fffdf9;display:grid;place-items:center}
.preview-find .preview-card.main{left:20px;right:20px;top:44px;height:134px;padding:12px}
.preview-find .preview-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.preview-find .preview-cell{
  border:1px solid #e6dccd;border-radius:12px;background:#fffdf8;height:48px;display:grid;place-items:center;
}
.preview-find .preview-targets{position:absolute;left:20px;bottom:22px;display:flex;gap:8px;flex-wrap:wrap}
.preview-find .preview-targets span{
  padding:5px 8px;border-radius:999px;border:1px solid #eadfce;background:#fffaf2;font-size:10px;font-weight:800;color:#76654b;
}
.preview-quiet .preview-card.main{left:20px;right:20px;top:42px;height:140px;padding:16px}
.preview-quiet .prompt{font-size:17px;font-weight:700;color:#3d3428}
.preview-quiet .preview-lines{margin-top:22px;display:grid;gap:14px}
svg{max-width:100%;height:auto}
@media print{
  body{background:#fff}
  .studio-header,.pack-hero{box-shadow:none}
  .button-row{display:none !important}
  .studio-shell{max-width:none;padding:0}
  .print-page,.pack-hero,.studio-header{border-radius:0;box-shadow:none;border-color:#ccc}
}
""".strip()


def esc(value: Any) -> str:
    return html.escape(str(value or ""))


def now_stamp() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S")


def load_spec() -> dict[str, Any]:
    payload = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def archive_old_pdf_outputs() -> dict[str, str]:
    stamp = now_stamp()
    target = ARCHIVE_DIR / stamp
    moved: dict[str, str] = {}
    target.mkdir(parents=True, exist_ok=True)
    for path in sorted(PDF_DIR.glob("*.pdf")):
        dest = target / path.name
        shutil.move(str(path), str(dest))
        moved[path.name] = str(dest.relative_to(ROOT))
    if ZIP_PATH.exists():
        dest = target / ZIP_PATH.name
        shutil.move(str(ZIP_PATH), str(dest))
        moved[ZIP_PATH.name] = str(dest.relative_to(ROOT))
    return moved


def svg_for_icon(label: str, *, shadow: bool = False) -> str:
    key = str(label or "").strip().lower()
    fill = "#111" if shadow else "none"
    stroke = "#111"
    stroke_width = "4"
    if "star" in key:
        shape = '<polygon points="50,10 61,36 90,39 68,58 75,88 50,71 25,88 32,58 10,39 39,36"/>'
    elif "ball" in key or "circle" in key:
        shape = '<circle cx="50" cy="50" r="30"/><path d="M28 38c12 9 32 9 44 0"/><path d="M35 23c-3 13-3 41 0 54"/>'
    elif "book" in key:
        shape = '<path d="M18 22h30c7 0 12 5 12 12v44H30c-7 0-12 5-12 12z"/><path d="M82 22H52c-7 0-12 5-12 12v44h30c7 0 12 5 12 12z"/><path d="M50 22v68"/>'
    elif "tree" in key:
        shape = '<path d="M50 14 78 45H66l18 18H61l15 17H24l15-17H16l18-18H22z"/><rect x="43" y="78" width="14" height="12" rx="2"/>'
    elif "leaf" in key:
        shape = '<path d="M20 60C20 28 53 17 76 20 73 45 58 77 24 80 21 74 20 67 20 60z"/><path d="M30 70c16-9 27-23 39-39"/>'
    elif "cloud" in key:
        shape = '<path d="M27 72h42c10 0 18-8 18-18s-8-17-18-17c-2-13-12-21-25-21-12 0-22 7-25 19C12 36 7 42 7 50c0 12 9 22 20 22z"/>'
    elif "cup" in key:
        shape = '<path d="M24 24h34v34c0 11-8 20-18 20s-16-9-16-20z"/><path d="M58 30h9c8 0 14 6 14 14s-6 14-14 14h-9"/><path d="M20 22h44"/>'
    elif "toy" in key:
        shape = '<rect x="20" y="34" width="60" height="24" rx="10"/><circle cx="20" cy="46" r="11"/><circle cx="80" cy="46" r="11"/>'
    elif "heart" in key:
        shape = '<path d="M50 84 17 52c-8-8-8-22 0-30 8-8 21-8 29 0l4 4 4-4c8-8 21-8 29 0 8 8 8 22 0 30z"/>'
    elif "triangle" in key:
        shape = '<polygon points="50,14 86,82 14,82"/>'
    elif "square" in key or "window" in key:
        shape = '<rect x="22" y="22" width="56" height="56" rx="6"/><path d="M50 22v56M22 50h56"/>'
    elif "door" in key:
        shape = '<rect x="28" y="16" width="44" height="68" rx="6"/><circle cx="60" cy="50" r="3"/>'
    else:
        shape = '<circle cx="50" cy="50" r="28"/>'
    return f'<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="{fill}" stroke="{stroke}" stroke-width="{stroke_width}" stroke-linejoin="round" stroke-linecap="round">{shape}</g></svg>'


def preview_markup(pack: dict[str, Any]) -> str:
    key = str(pack.get("key") or "").strip()
    title = esc(pack.get("title") or "Printable Pack")
    page = (pack.get("pages") or [{}])[0]
    if key == "coloring-pages-pack":
        phrase = esc(page.get("phrase") or "Be kind")
        return f"""
        <div class="preview-shell preview-coloring" aria-hidden="true">
          <div class="preview-mini-title">{title}</div>
          <div class="preview-card main">
            <div class="preview-phrase">{phrase}</div>
            <div class="preview-lines"><span></span><span></span><span></span></div>
          </div>
          <div class="preview-card side"><div class="preview-icon">{svg_for_icon('heart')}</div></div>
          <div class="preview-footer"><span>Made For This</span><div class="preview-dots"><span></span><span></span><span></span></div></div>
        </div>
        """
    if key == "mazes-pack":
        return f"""
        <div class="preview-shell preview-maze" aria-hidden="true">
          <div class="preview-mini-title">{title}</div>
          <div class="preview-card main">
            <svg viewBox="0 0 300 120" style="width:100%">
              <g fill="none" stroke="#111" stroke-width="3">
                <rect x="6" y="6" width="288" height="108" rx="12"/>
                <path d="M28 24h74v26H66v26h52v18H34v-22h36V40H28zM130 24h52v20h-28v16h40v18h-34v18h58v-24h42V52h-34V24h62"/>
              </g>
            </svg>
          </div>
          <div class="preview-card goal">Finish</div>
          <div class="preview-footer"><span>Start to finish</span><div class="preview-dots"><span></span><span></span><span></span></div></div>
        </div>
        """
    if key == "trace-and-learn-pack":
        symbol = esc(page.get("symbol") or "A")
        return f"""
        <div class="preview-shell preview-trace" aria-hidden="true">
          <div class="preview-mini-title">{title}</div>
          <div class="preview-card main">
            <div class="preview-row">
              <div class="preview-glyph">{symbol}</div><div class="preview-glyph">{symbol}</div><div class="preview-glyph">{symbol}</div>
            </div>
            <div class="preview-row">
              <div class="preview-line"></div><div class="preview-line"></div><div class="preview-line"></div>
            </div>
            <div class="preview-row">
              <div class="preview-line"></div><div class="preview-line"></div><div class="preview-line"></div>
            </div>
          </div>
          <div class="preview-footer"><span>Trace and practice</span><div class="preview-dots"><span></span><span></span><span></span></div></div>
        </div>
        """
    if key == "matching-activities-pack":
        items = [str(x).strip().title() for x in (page.get("items") or []) if str(x).strip()] or ["Star", "Book", "Tree"]
        left = "".join(f'<div class="preview-pair"><div class="preview-icon-box">{svg_for_icon(item)}</div><div class="preview-name"></div></div>' for item in items[:3])
        right = "".join(f'<div class="preview-pair"><div class="preview-icon-box">{svg_for_icon(item, shadow=True)}</div><div class="preview-name"></div></div>' for item in items[:3])
        return f"""
        <div class="preview-shell preview-matching" aria-hidden="true">
          <div class="preview-mini-title">{title}</div>
          <div class="preview-card left">{left}</div>
          <div class="preview-card right">{right}</div>
          <div class="preview-footer"><span>Match the pairs</span><div class="preview-dots"><span></span><span></span><span></span></div></div>
        </div>
        """
    if key == "cut-and-paste-pack":
        pieces = [str(x).strip().lower() for x in (page.get("pieces") or []) if str(x).strip()] or ["triangle", "square", "door", "window"]
        piece_html = "".join(f'<div class="preview-piece">{svg_for_icon(piece)}</div>' for piece in pieces[:4])
        return f"""
        <div class="preview-shell preview-cut" aria-hidden="true">
          <div class="preview-mini-title">{title}</div>
          <div class="preview-card stage">
            <svg viewBox="0 0 220 130" style="width:100%">
              <g fill="none" stroke="#111" stroke-width="3" stroke-linejoin="round">
                <polygon points="110,16 190,70 30,70"/>
                <rect x="48" y="70" width="124" height="48" rx="8"/>
                <rect x="96" y="84" width="28" height="34" rx="4"/>
              </g>
            </svg>
          </div>
          <div class="preview-card pieces">{piece_html}</div>
          <div class="preview-footer"><span>Cut and build</span><div class="preview-dots"><span></span><span></span><span></span></div></div>
        </div>
        """
    if key == "find-and-seek-pack":
        targets = [str(x).strip().title() for x in (page.get("targets") or []) if str(x).strip()] or ["Star", "Heart", "Leaf"]
        clutter = ["star", "heart", "leaf", "book", "cloud", "ball", "toy", "cup"]
        cells = "".join(f'<div class="preview-cell">{svg_for_icon(clutter[i])}</div>' for i in range(8))
        pills = "".join(f"<span>{esc(target)}</span>" for target in targets[:3])
        return f"""
        <div class="preview-shell preview-find" aria-hidden="true">
          <div class="preview-mini-title">{title}</div>
          <div class="preview-card main"><div class="preview-grid">{cells}</div></div>
          <div class="preview-targets">{pills}</div>
          <div class="preview-footer"><span>Find the objects</span><div class="preview-dots"><span></span><span></span><span></span></div></div>
        </div>
        """
    prompt = esc(page.get("prompt") or "Draw your favorite thing")
    return f"""
    <div class="preview-shell preview-quiet" aria-hidden="true">
      <div class="preview-mini-title">{title}</div>
      <div class="preview-card main">
        <div class="prompt">{prompt}</div>
        <div class="preview-lines"><span></span><span></span><span></span><span></span></div>
      </div>
      <div class="preview-footer"><span>Quiet time</span><div class="preview-dots"><span></span><span></span><span></span></div></div>
    </div>
    """


def phrase_block(page: dict[str, Any]) -> str:
    phrase = esc(page.get("phrase") or page.get("title") or "Coloring Page")
    caption = esc(page.get("caption") or "")
    return f"""
      <div class="worksheet">
        <div class="color-box" style="padding:28px;min-height:460px;display:grid;align-content:center;gap:18px">
          <div class="phrase">{phrase}</div>
          <p class="small-note">{caption}</p>
          <div class="line-stack"><span></span><span></span><span></span></div>
        </div>
      </div>
    """


def trace_block(page: dict[str, Any]) -> str:
    symbol = esc(page.get("symbol") or "A")
    label = esc(page.get("label") or page.get("title") or "Trace and practice")
    icon_label = "ball" if symbol.isdigit() else "star"
    if symbol.upper() == "SUN":
        icon_html = "".join(f'<div class="icon-box">{svg_for_icon("ball")}</div>' for _ in range(3))
    else:
        icon_html = "".join(f'<div class="icon-box">{svg_for_icon(icon_label)}</div>' for _ in range(3))
    ghost_boxes = "".join(f'<div class="trace-box">{symbol}</div>' for _ in range(4))
    practice_rows = "".join(f'<div class="practice-box"><span class="practice-symbol">{symbol}</span></div>' for _ in range(4))
    return f"""
      <div class="worksheet">
        <p class="small-note">{label}</p>
        <div class="button-row" style="margin-top:12px">{icon_html}</div>
        <div class="ghost-row">{ghost_boxes}</div>
        <div class="practice-row">{practice_rows}</div>
      </div>
    """


def matching_block(page: dict[str, Any]) -> str:
    items = [str(x).strip().title() for x in (page.get("items") or []) if str(x).strip()] or ["Star", "Ball", "Book", "Tree"]
    left = "".join(
        f'<div class="match-item"><div class="icon-box">{svg_for_icon(item)}</div><div class="label">{esc(item)}</div></div>'
        for item in items
    )
    rotated = items[1:] + items[:1] if len(items) > 1 else items
    right = "".join(
        f'<div class="match-item shadow"><div class="icon-box">{svg_for_icon(item, shadow=True)}</div><div class="label">Shadow</div></div>'
        for item in rotated
    )
    return f"""
      <div class="worksheet">
        <p class="small-note">Draw a line from each object to its shadow.</p>
        <div class="match-grid">
          <div class="match-col">{left}</div>
          <div class="match-col">{right}</div>
        </div>
      </div>
    """


def cut_paste_block(page: dict[str, Any]) -> str:
    pieces = [str(x).strip().lower() for x in (page.get("pieces") or []) if str(x).strip()] or ["square", "triangle", "door", "window"]
    piece_html = "".join(
        f'<div class="shape-box">{svg_for_icon(piece)}</div>' for piece in pieces[:4]
    )
    return f"""
      <div class="worksheet">
        <div class="shape-layout">
          <div class="house-stage">
            <svg viewBox="0 0 360 260" aria-hidden="true">
              <g fill="none" stroke="#111" stroke-width="4" stroke-linejoin="round">
                <polygon points="180,24 310,124 50,124"/>
                <rect x="80" y="124" width="200" height="110" rx="8"/>
                <rect x="160" y="168" width="44" height="66" rx="5"/>
                <rect x="106" y="152" width="40" height="36" rx="4"/>
                <rect x="214" y="152" width="40" height="36" rx="4"/>
              </g>
            </svg>
            <p class="small-note">Cut the pieces and build the house.</p>
          </div>
          <div class="pieces-grid">{piece_html}</div>
        </div>
      </div>
    """


def find_seek_block(page: dict[str, Any]) -> str:
    targets = [str(x).strip().lower() for x in (page.get("targets") or []) if str(x).strip()] or ["star", "heart", "circle"]
    clutter = targets + ["cloud", "leaf", "book", "ball", "toy", "cup", "triangle", "square"]
    board = "".join(f'<div class="seek-box">{svg_for_icon(clutter[i % len(clutter)])}</div>' for i in range(12))
    pills = "".join(f'<span class="target-pill">{esc(t.title())}</span>' for t in targets)
    return f"""
      <div class="worksheet">
        <div class="target-list">{pills}</div>
        <div class="seek-board">{board}</div>
      </div>
    """


def quiet_time_block(page: dict[str, Any]) -> str:
    prompt = esc(page.get("prompt") or "Draw your favorite thing.")
    return f"""
      <div class="worksheet">
        <div class="quiet-box">
          <h3 style="font-size:24px">{prompt}</h3>
          <div class="line-stack" style="margin-top:34px">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    """


def maze_block(page: dict[str, Any]) -> str:
    caption = esc(page.get("caption") or "Trace the path from start to finish.")
    return f"""
      <div class="worksheet">
        <svg viewBox="0 0 720 520" aria-hidden="true" style="width:100%">
          <g fill="none" stroke="#111" stroke-width="4">
            <rect x="40" y="40" width="640" height="420" rx="18"/>
            <path d="M90 90h130v60H150v50h110v70H120v90h180v-60h80v80h130v-60h90v-100h-120v-90h140v-80H430v60h-90v-70H90z"/>
          </g>
          <text x="50" y="28" font-size="20" fill="#111">Start</text>
          <text x="620" y="492" font-size="20" fill="#111">Finish</text>
        </svg>
        <p class="small-note">{caption}</p>
      </div>
    """


def coloring_scene_block(page: dict[str, Any]) -> str:
    title = esc(page.get("title") or "Coloring Page")
    caption = esc(page.get("caption") or "")
    return f"""
      <div class="worksheet">
        <div class="color-box" style="padding:22px;min-height:470px">
          <svg viewBox="0 0 720 420" aria-hidden="true" style="width:100%">
            <g fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="70" y="170" width="180" height="160" rx="8"/>
              <polygon points="160,90 270,170 50,170"/>
              <rect x="128" y="230" width="42" height="100" rx="5"/>
              <circle cx="435" cy="132" r="52"/>
              <path d="M390 208c18 14 33 26 46 26s29-12 47-26"/>
              <circle cx="470" cy="242" r="34"/>
              <path d="M470 276v78M470 312h-44M470 312h44M470 354l-36 44M470 354l36 44"/>
              <circle cx="560" cy="242" r="34"/>
              <path d="M560 276v78M560 312h-44M560 312h44M560 354l-36 44M560 354l36 44"/>
              <path d="M0 356h720"/>
              <path d="M560 96c22-10 44-8 66 6"/>
            </g>
          </svg>
          <p class="small-note"><strong>{title}</strong> {caption}</p>
        </div>
      </div>
    """


def page_block(page: dict[str, Any], index: int) -> str:
    page_type = str(page.get("type") or "coloring").strip().lower()
    title = esc(page.get("title") or f"Printable Page {index + 1}")
    subtitle = esc(page.get("instruction") or page.get("subtitle") or "")
    if page_type == "trace":
        worksheet = trace_block(page)
    elif page_type == "matching":
        worksheet = matching_block(page)
    elif page_type == "cut_paste":
        worksheet = cut_paste_block(page)
    elif page_type == "find_seek":
        worksheet = find_seek_block(page)
    elif page_type == "quiet_time":
        worksheet = quiet_time_block(page)
    elif page_type == "maze":
        worksheet = maze_block(page)
    elif page_type == "coloring" and page.get("phrase"):
        worksheet = phrase_block(page)
    else:
        worksheet = coloring_scene_block(page)
    return f"""
      <section class="print-page">
        <div class="print-head">
          <div>
            <div class="brand-mark">Made For This</div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div class="brand-mark">Page {index + 1:02d}</div>
        </div>
        {worksheet}
        <div class="footer-note">Made For This</div>
      </section>
    """


def html_shell(title: str, body: str, relative_prefix: str = ".") -> str:
    css_href = f"{relative_prefix}/printables.css"
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(title)}</title>
  <link rel="stylesheet" href="{css_href}" />
</head>
<body>
  {body}
</body>
</html>
"""


def render_pack_page(bundle_title: str, pack: dict[str, Any], all_packs: list[dict[str, Any]]) -> str:
    title = str(pack.get("title") or "Printable Pack").strip()
    subtitle = esc(pack.get("subtitle") or "")
    cover_caption = esc(pack.get("cover_caption") or "")
    pages_html = "".join(page_block(page, idx) for idx, page in enumerate(pack.get("pages") or []))
    pack_cards = "".join(
        f"""
        <article class="pack-card">
          {preview_markup(item)}
          <h3>{esc(item.get('title') or 'Printable Pack')}</h3>
          <p>{esc(item.get('subtitle') or '')}</p>
          <div class="button-row"><a class="btn secondary" href="/live-printables/kids-activity/{esc(item.get('key') or '')}.html">Open Pack</a></div>
        </article>
        """
        for item in all_packs
    )
    body = f"""
    <main class="studio-shell">
      <section class="pack-hero">
        <p class="eyebrow">{esc(bundle_title)}</p>
        <h1>{esc(title)}</h1>
        <p>{subtitle}</p>
        <div class="button-row">
          <a class="btn" href="/bundles/kids-activity-coloring-bundle.html">Back to Bundle Offer</a>
          <a class="btn secondary" href="/live-printables/kids-activity/">Open Library</a>
          <button class="btn secondary" onclick="window.print()">Print This Pack</button>
        </div>
        <div class="pack-grid" style="grid-template-columns:minmax(0,320px) 1fr;margin-top:18px">
          <article class="pack-card preview-kicker">
            {preview_markup(pack)}
          </article>
          <article class="pack-card">
            <h3>Pack Notes</h3>
            <p>{cover_caption}</p>
            <p class="small-note">These are live printable pages. Open them on any device, then print the pack or save it as PDF if needed.</p>
          </article>
        </div>
      </section>
      <section class="pack-grid">{pack_cards}</section>
      <section class="print-grid" style="margin-top:18px">{pages_html}</section>
    </main>
    """
    return html_shell(f"{title} | Made For This", body, relative_prefix=".")


def render_library_index(spec: dict[str, Any]) -> str:
    bundle_title = str(spec.get("bundle_title") or "Kids Activity & Coloring Printable Bundle")
    packs = spec.get("packs") or []
    cards = "".join(
        f"""
        <article class="pack-card">
          {preview_markup(pack)}
          <h3>{esc(pack.get('title') or 'Printable Pack')}</h3>
          <p>{esc(pack.get('subtitle') or '')}</p>
          <div class="button-row">
            <a class="btn" href="/live-printables/kids-activity/{esc(pack.get('key') or '')}.html">Open Pack</a>
            <button class="btn secondary" onclick="window.location.href='/live-printables/kids-activity/{esc(pack.get('key') or '')}.html#print'">Print View</button>
          </div>
        </article>
        """
        for pack in packs
    )
    body = f"""
    <main class="studio-shell">
      <section class="studio-header">
        <p class="eyebrow">Made For This Printable Library</p>
        <h1>{esc(bundle_title)}</h1>
        <p>Open each printable pack live, review it on screen, and print only the pages you want. This replaces the old PDF-first workflow with a cleaner preview-and-print system for clients.</p>
        <div class="button-row">
          <a class="btn" href="/bundles/kids-activity-coloring-bundle.html">Back to Product Page</a>
          <button class="btn secondary" onclick="window.print()">Print This Library Page</button>
        </div>
      </section>
      <section class="pack-grid">{cards}</section>
    </main>
    """
    return html_shell(f"{bundle_title} | Live Printable Library", body, relative_prefix=".")


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
    return preview_map.get(pack_key, "kids-coloring-preview.png")


def write_live_pages(spec: dict[str, Any]) -> dict[str, Any]:
    LIVE_DIR.mkdir(parents=True, exist_ok=True)
    (LIVE_DIR / "printables.css").write_text(PRINT_CSS, encoding="utf-8")
    packs = spec.get("packs") or []
    manifest = {
        "brand_name": spec.get("brand_name") or "Made For This",
        "bundle_title": spec.get("bundle_title") or "Kids Activity & Coloring Printable Bundle",
        "library_path": "/live-printables/kids-activity/",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "packs": [],
    }
    for pack in packs:
        key = str(pack.get("key") or "").strip()
        if not key:
            continue
        page_path = LIVE_DIR / f"{key}.html"
        page_path.write_text(render_pack_page(manifest["bundle_title"], pack, packs), encoding="utf-8")
        manifest["packs"].append(
            {
                "key": key,
                "title": pack.get("title"),
                "path": f"/live-printables/kids-activity/{key}.html",
                "preview": f"/live-printables/kids-activity/{key}.html",
            }
        )
    (LIVE_DIR / "index.html").write_text(render_library_index(spec), encoding="utf-8")
    (LIVE_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    spec = load_spec()
    archived = archive_old_pdf_outputs()
    manifest = write_live_pages(spec)
    print(json.dumps({"archived": archived, "manifest": manifest}, indent=2))


if __name__ == "__main__":
    main()
