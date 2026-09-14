# Image to Editable PPT

Rebuild static slide images and image-based PowerPoint pages as editable `.pptx` slides for Codex.

The skill prioritizes visual fidelity and native PowerPoint text, shapes, lines/connectors, tables, and charts. Complex elements are decomposed where reliable; localized raster or SVG assets are retained with an explicit editability boundary when native rebuilding would lose content. An embedded SVG is reported as a picture, not as a native shape.

Each reconstruction uses a source-first region/element manifest with stable PowerPoint object names. Draft and delivery checks expose incomplete elements, missing mappings, undeclared degradation, canvas mismatches, and unverified critical regions. The inspector reads back actual OOXML text, shapes, lines, connectors, charts, tables, groups, and pictures in presentation order. Manifest validation cannot discover source content that was never inventoried, so full-source review remains required.

## What installation does

Installing the Codex skill only copies the skill files. It does **not** run scripts, install packages, download OCR models, access Iconfont, or modify an existing SVG library.

Run the dependency installer explicitly after cloning this repository (the same command on Windows, macOS, and Linux):

```bash
node scripts/setup.mjs
```

Check the environment with:

```bash
node scripts/check-env.mjs
```

That installs only the core `pptxgenjs` generation runtime, `jszip`, and the lightweight `@xmldom/xmldom` OOXML parser into the skill's own `runtime/node_modules` directory. Optional capabilities remain opt-in:

```bash
node scripts/setup.mjs --with-ocr
node scripts/setup.mjs --with-inpaint
node scripts/setup.mjs --with-ocr --with-inpaint
```

Optional flags are `--with-ocr`, `--with-inpaint`, and `--skip-node`. The small `.sh` wrappers are optional conveniences; PowerShell is bundled only for Windows-native PowerPoint COM and MathType/Word/WPS automation.

## Requirements

- Node.js 20+ for PPTX generation.
- Windows: Microsoft PowerPoint is recommended for direct PNG render QA. LibreOffice is a fallback.
- macOS: LibreOffice is the supported headless render route; install Poppler (`pdftoppm`) to obtain per-slide PNGs automatically. Microsoft PowerPoint for Mac may still be used manually for a final visual check.
- Python 3.10+ with Pillow for visual comparison artifacts; heavier OCR and background-repair extras remain optional.
- MathType plus Word/WPS is optional and never installed by this project. Its editable OLE workflow is Windows-specific.

For PNG render output on Windows, install Poppler with `winget install --exact --id oschwartz10612.Poppler`. The renderer also detects the standard Winget installation location when a running terminal has not yet reloaded its PATH.

See [platform support](docs/platform-support.md) for the OS capability matrix and macOS setup notes.

For Windows formula export, set `MATHTYPE_WORD_WPS_TOOL` to a compatible local MathType bridge script, then run `skills/image-to-editable-ppt/scripts/prepare-formula.ps1`. The project stores MTEF/MathML alongside an EMF/WMF fallback; it does not install proprietary MathType or Word/WPS. On macOS, preserve MathML/LaTeX source and use an SVG/PDF/EMF-compatible vector fallback; do not promise a MathType OLE object.

## SVG library

The first actual Skill run can seed a local SVG library with basic geometric assets. It defaults to `Documents\Codex\svg-library` and may be overridden with `I2EP_SVG_LIBRARY`.

The workflow searches this library before looking up external icons. Tags produce candidates only; silhouette, structure, proportion, direction, and style must visually match the source. External assets must preserve source URL, extraction method, hash, and license status.

## Fidelity QA

Preserve the source image aspect ratio with a custom slide layout and use stable `objectName` values for every mapped object. Validate and inspect the output with:

```bash
node skills/image-to-editable-ppt/scripts/check-manifest.mjs reconstruction-manifest.json --mode delivery
node skills/image-to-editable-ppt/scripts/inspect-ppt.mjs output.pptx --manifest reconstruction-manifest.json --mode delivery
node skills/image-to-editable-ppt/scripts/render-ppt.mjs output.pptx render-dir
python3 skills/image-to-editable-ppt/scripts/compare-renders.py source.png render-dir/slide-1.png comparison-dir --manifest reconstruction-manifest.json --slide 1
```

The comparison keeps source/render hashes and full-page images, plus side-by-side, overlay, enhanced difference, and manifest-region crops. Pixel metrics are diagnostic only; critical regions require visual and semantic review. Verify that the selected render engine has the intended fonts available and record substitutions rather than trusting the OOXML font name alone.

## Repository layout

The distributable Skill is self-contained under `skills/image-to-editable-ppt/`. Root scripts are convenience wrappers for repository users.

## License and acknowledgments

New project code is MIT licensed. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for PptxGenJS and the four projects whose public workflows informed this implementation.
