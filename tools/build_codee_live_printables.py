from __future__ import annotations

import html
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "assets" / "data" / "live-printables.json"
CSS_FILE = ROOT / "printables" / "live-printables.css"
ASSET_ROOT = ROOT / "live-printables" / "kids-activity" / "assets"
EXPORT_ROOT = ROOT / "codee-live-printables-export"
BUCKET_BASE_URL = "https://clients.digioffice.shop/codee-live-printables"

def escape(value: str) -> str:
    return html.escape(str(value or ""))


def relative_asset(image_url: str) -> str:
    return f"../assets/{Path(image_url).name}"


def render_page(record: dict, previous_slug: str | None, next_slug: str | None) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{escape(record['title'])} | AI K9 Live Printable</title>
  <link rel="stylesheet" href="../_shared/live-printables.css" />
</head>
<body class="lp-bare-page">
  <div class="lp-page-wrap lp-page-wrap-bare">
    <div class="lp-float-controls" id="float-controls">
      <button class="lp-float-btn" type="button" id="close-viewer-button">Close</button>
      <a class="lp-float-btn" href="{escape(relative_asset(record['image_url']))}" download>Download</a>
      <button class="lp-float-btn" type="button" id="float-print-button">Print</button>
    </div>
    <article class="lp-printable-shell lp-printable-shell-bare">
      <div class="lp-printable-body lp-printable-body-bare">
        <div class="lp-printable-canvas lp-printable-canvas-bare">
          <button class="lp-open-viewer" type="button" id="open-viewer-button" aria-label="Open full screen view">
            Tap to open
          </button>
          <div class="lp-design-stage lp-design-stage-bare" id="viewer-stage">
            <img class="lp-design-image" src="{escape(relative_asset(record['image_url']))}" alt="{escape(record['title'])}" />
          </div>
        </div>
      </div>
    </article>
  </div>
  <script>
    const body = document.body;
    const stage = document.getElementById("viewer-stage");
    const openButton = document.getElementById("open-viewer-button");
    const closeButton = document.getElementById("close-viewer-button");
    const floatControls = document.getElementById("float-controls");
    let reopenAfterPrint = false;
    const openViewer = () => {{
      body.classList.add("lp-viewer-open");
      floatControls?.classList.add("is-visible");
    }};
    const closeViewer = () => {{
      body.classList.remove("lp-viewer-open");
      floatControls?.classList.remove("is-visible");
    }};
    const printViewer = () => {{
      reopenAfterPrint = body.classList.contains("lp-viewer-open");
      closeViewer();
      window.print();
    }};
    window.addEventListener("afterprint", () => {{
      if (reopenAfterPrint) openViewer();
      reopenAfterPrint = false;
    }});
    document.getElementById("float-print-button")?.addEventListener("click", printViewer);
    openButton?.addEventListener("click", openViewer);
    stage?.querySelector(".lp-design-image")?.addEventListener("click", () => {{ if (!body.classList.contains("lp-viewer-open")) openViewer(); }});
    closeButton?.addEventListener("click", closeViewer);
    document.addEventListener("keydown", (event) => {{ if (event.key === "Escape") closeViewer(); }});
  </script>
</body>
</html>
"""


def render_index(records: list[dict]) -> str:
    cards = []
    for record in records:
        cards.append(
            f"""
            <article class="lp-card">
              <img src="assets/{escape(Path(record['image_url']).name)}" alt="{escape(record['title'])}" loading="lazy" />
              <p class="lp-pill">{escape(str(record['type']).replace('-', ' '))}</p>
              <h3>{escape(record['title'])}</h3>
              <p>{escape(record['description'])}</p>
              <p class="lp-path">{escape(BUCKET_BASE_URL+'/'+record['slug']+'/')}</p>
              <div class="lp-inline-actions">
                <a class="lp-btn lp-btn-primary" href="./{escape(record['slug'])}/">Open Live Page</a>
              </div>
            </article>
            """
        )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI K9 Live Printable Bundle</title>
  <link rel="stylesheet" href="_shared/live-printables.css" />
</head>
<body>
  <header class="lp-shell lp-topbar">
    <a class="lp-brand" href="./index.html">AI K9 Live Printables</a>
  </header>
  <main class="lp-shell">
    <section class="lp-hero">
      <div>
        <p class="lp-eyebrow">Reset Bundle Pages</p>
        <h1>AI K9 live printable reset bundle</h1>
        <p class="lp-lead">Each uploaded asset is hosted live, printable, and sequenced so viewers can move to the next page by button or swipe.</p>
      </div>
      <aside class="lp-note">
        <strong>Live bucket path</strong>
        <p>{escape(BUCKET_BASE_URL)}/[slug]/</p>
      </aside>
    </section>
    <section class="lp-section">
      <div class="lp-section-head">
        <div>
          <p class="lp-eyebrow">Bundle Sequence</p>
          <h2>Published printable pages</h2>
        </div>
      </div>
      <div class="lp-grid">
        {''.join(cards)}
      </div>
    </section>
  </main>
</body>
</html>
"""


def main() -> None:
    data = json.loads(DATA_FILE.read_text())
    records = data["records"]

    if EXPORT_ROOT.exists():
        shutil.rmtree(EXPORT_ROOT)
    (EXPORT_ROOT / "_shared").mkdir(parents=True, exist_ok=True)
    (EXPORT_ROOT / "assets").mkdir(parents=True, exist_ok=True)

    shutil.copy2(CSS_FILE, EXPORT_ROOT / "_shared" / "live-printables.css")

    for asset in ASSET_ROOT.glob("*"):
        if asset.is_file() and asset.name != ".DS_Store":
            shutil.copy2(asset, EXPORT_ROOT / "assets" / asset.name)

    published = [record for record in records if record.get("is_published")]
    (EXPORT_ROOT / "index.html").write_text(render_index(published), encoding="utf-8")

    for index, record in enumerate(published):
        page_dir = EXPORT_ROOT / record["slug"]
        page_dir.mkdir(parents=True, exist_ok=True)
        previous_slug = published[index - 1]["slug"] if index > 0 else None
        next_slug = published[index + 1]["slug"] if index < len(published) - 1 else None
        (page_dir / "index.html").write_text(render_page(record, previous_slug, next_slug), encoding="utf-8")

    export_manifest = {
        "bucketBaseUrl": BUCKET_BASE_URL,
        "records": published,
    }
    (EXPORT_ROOT / "manifest.json").write_text(json.dumps(export_manifest, indent=2), encoding="utf-8")

    print(f"Built export at {EXPORT_ROOT}")


if __name__ == "__main__":
    main()
