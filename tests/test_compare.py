#!/usr/bin/env python3
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "image-to-editable-ppt" / "scripts" / "compare-renders.py"


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run([sys.executable, str(SCRIPT), *args], text=True, capture_output=True, check=False)


with tempfile.TemporaryDirectory(prefix="i2ep-compare-") as folder:
    temp = Path(folder)
    reference = temp / "reference.png"
    rendered = temp / "rendered.png"
    Image.new("RGB", (600, 360), (238, 232, 220)).save(reference)
    Image.new("RGB", (1000, 600), (235, 230, 218)).save(rendered)
    manifest = temp / "manifest.json"
    manifest.write_text(json.dumps({
        "slides": [{
            "slide": 1,
            "canvas": {"widthPx": 1500, "heightPx": 900},
            "regions": [
                {"id": "中文区域", "critical": True, "bbox": {"x": 0, "y": 0, "w": 500, "h": 450}},
                {"id": "另一中文区域", "critical": False, "bbox": {"x": 500, "y": 0, "w": 500, "h": 450}},
            ],
        }]
    }), encoding="utf-8")
    output = temp / "comparison"
    result = run(str(reference), str(rendered), str(output), "--manifest", str(manifest))
    assert result.returncode == 0, result.stderr
    report = json.loads((output / "comparison.json").read_text(encoding="utf-8"))
    assert report["reference"]["sha256"] and report["rendered"]["sha256"]
    assert report["alignment"]["method"] == "proportional-fit-no-stretch"
    assert len(report["regions"]) == 2
    names = {item["reference"] for item in report["regions"]}
    assert len(names) == 2 and all((output / name).exists() for name in names)
    assert (output / "full-slide-side-by-side.png").exists()
    assert (output / "comparison.html").exists()

    mismatch = temp / "mismatch.png"
    Image.new("RGB", (600, 400), "white").save(mismatch)
    mismatch_output = temp / "mismatch-output"
    mismatch_result = run(str(reference), str(mismatch), str(mismatch_output))
    assert mismatch_result.returncode == 2
    mismatch_report = json.loads((mismatch_output / "comparison.json").read_text(encoding="utf-8"))
    assert mismatch_report["status"] == "aspect-ratio-mismatch"
    assert "fullSlide" not in mismatch_report

    invalid = run(str(reference), str(rendered), str(temp / "invalid"), "--aspect-tolerance", "NaN")
    assert invalid.returncode != 0

print("compare-renders regression: passed")
