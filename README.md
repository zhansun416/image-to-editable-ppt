# Image to Editable PPT

Rebuild static slide images and image-based PowerPoint pages as editable `.pptx` slides for Codex.

The skill prioritizes native PowerPoint text, shapes, connectors, tables, charts, and reusable SVGs. It is Windows-first because the QA path opens the generated deck in Microsoft PowerPoint and renders every slide before delivery.

## What installation does

Installing the Codex skill only copies the skill files. It does **not** run scripts, install packages, download OCR models, access Iconfont, or modify an existing SVG library.

Run the dependency installer explicitly after cloning this repository:

```powershell
.\scripts\setup.ps1
```

That installs only the core `pptxgenjs` runtime into the skill's own `runtime/node_modules` directory. Optional capabilities remain opt-in:

```powershell
.\scripts\setup.ps1 -WithOcr
.\scripts\setup.ps1 -WithInpaint
.\scripts\setup.ps1 -WithOcr -WithInpaint
```

Run `./scripts/check-env.ps1` to see which local capabilities are available.

## Requirements

- Node.js 20+ for PPTX generation.
- Microsoft PowerPoint is recommended for visual QA. LibreOffice can be used for compatibility inspection.
- Python 3.10+ only for optional OCR or background-repair extras.
- MathType plus Word/WPS is optional and never installed by this project.

For formula export, set `MATHTYPE_WORD_WPS_TOOL` to a compatible local MathType bridge script, then run `skills/image-to-editable-ppt/scripts/prepare-formula.ps1`. The project stores MTEF/MathML alongside an EMF/WMF fallback; it does not install proprietary MathType or Word/WPS.

## SVG library

The first actual Skill run can seed a local SVG library with basic geometric assets. It defaults to `Documents\Codex\svg-library` and may be overridden with `I2EP_SVG_LIBRARY`.

The workflow searches this library before looking up external icons. External assets must preserve source URL, extraction method, hash, and license status.

## Repository layout

The distributable Skill is self-contained under `skills/image-to-editable-ppt/`. Root scripts are convenience wrappers for repository users.

## License and acknowledgments

New project code is MIT licensed. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for PptxGenJS and the four projects whose public workflows informed this implementation.
