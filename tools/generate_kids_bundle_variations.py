from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
OUT_ROOT = ROOT / "downloads" / "kids-activity-variations"

VARIANTS = [
    ("soft-minimal", "Make the bundle feel soft, calm, minimal, premium, and extra clean."),
    ("playful-lineart", "Make the bundle feel playful and doodle-forward, but still clean and printable."),
    ("structured-learning", "Make the bundle feel slightly more educational, organized, and teacher-friendly."),
    ("cozy-home", "Make the bundle feel warm, home-centered, and routine-friendly for moms and quiet time."),
]


def main():
    parser = argparse.ArgumentParser(description="Generate four printable bundle variations for review.")
    parser.add_argument("--prompt-file", default=str(ROOT / "KIDS_ACTIVITY_BUNDLE_PROMPT.md"))
    parser.add_argument("--reference-image", default="", help="Optional local image path used as visual reference.")
    parser.add_argument("--skip-ai-images", action="store_true")
    args = parser.parse_args()

    manifest = {"bundle": "Kids Activity & Coloring Printable Bundle", "variations": []}
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    for key, note in VARIANTS:
        variant_dir = OUT_ROOT / key
        variant_assets = variant_dir / "assets"
        variant_downloads = variant_dir / "downloads"
        variant_assets.mkdir(parents=True, exist_ok=True)
        variant_downloads.mkdir(parents=True, exist_ok=True)

        cmd = [
            "python3",
            str(TOOLS / "generate_kids_bundle.py"),
            "--prompt-file",
            str(args.prompt_file),
            "--spec-out",
            str(variant_downloads / "kids-activity-bundle-spec.json"),
            "--out-dir",
            str(variant_downloads),
            "--preview-dir",
            str(variant_assets),
            "--zip-out",
            str(variant_dir / "kids-activity-coloring-bundle.zip"),
            "--variant-key",
            key,
            "--variant-note",
            note,
        ]
        if args.reference_image:
            cmd.extend(["--reference-image", args.reference_image])
        if args.skip_ai_images:
            cmd.append("--skip-ai-images")

        subprocess.run(cmd, check=True)
        manifest["variations"].append(
            {
                "key": key,
                "note": note,
                "spec": str(variant_downloads / "kids-activity-bundle-spec.json"),
                "review_manifest": str(variant_downloads / f"review-manifest-{key}.json"),
            }
        )

    (OUT_ROOT / "variation-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
