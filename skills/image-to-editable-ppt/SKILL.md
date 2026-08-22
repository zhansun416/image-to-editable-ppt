---
name: image-to-editable-ppt
description: "Rebuild static slide images or image-based PPT pages as editable PPTX slides. Use for image-to-editable-PowerPoint reconstruction, not ordinary PPT edits or new decks."
---

# Image to Editable PPT

Rebuild a visual reference as an editable PowerPoint page. Preserve the reference's hierarchy while keeping text, simple shapes, connectors, tables, charts, and simple diagrams native whenever practical.

## Setup and local state

- Before first use, run `scripts/check-env.ps1`. If the core runtime is absent, ask the user to run `scripts/setup-dependencies.ps1`; do not install dependencies automatically.
- `PPTXGENJS_DIST` may override the runtime; otherwise use `runtime/node_modules/pptxgenjs/dist/pptxgen.cjs.js`.
- The SVG library defaults to `Documents\Codex\svg-library`; set `I2EP_SVG_LIBRARY` to override it. Run `scripts/ensure-svg-library.ps1` before first use in a new environment.
- Use `Microsoft YaHei` for Chinese and `Times New Roman` for Latin/English runs. Increase small reference text when needed for readable output.

## Reconstruct

1. Inspect the entire slide and identify editable text, simple shapes, charts, tables, formulas, logos, and complex raster assets.
2. Recreate readable copy as text boxes. Use native shapes for basic geometry and native charts/tables when their values or structure are recoverable.
3. Search the local SVG library before any external lookup with `scripts/find-svg-library.ps1`.
4. If no close local asset exists, use an approved icon search workflow and register the selected standalone SVG with `scripts/register-svg.ps1`. Preserve source URL, hash, extraction method, and license status.
5. Treat intricate logos, textures, and irrecoverable visuals as declared image assets rather than pretending they are editable.
6. For formulas, preserve MathML/MTEF source and create an EMF/WMF vector fallback for PPTX. A Word-style MathType OLE object is not promised inside PPTX.

## QA

- Write a slide-specific PptxGenJS builder; never use a full-slide screenshot as the normal background.
- Avoid corrupt PPTX output: six-character colors without `#`, non-negative shape dimensions, and fresh repeated option objects.
- Run `scripts/inspect-ppt.ps1`, then `scripts/render-ppt.ps1`; inspect the actual rendered PNGs and fix clipping, wrapping, chart labels, icon alignment, and contrast before delivery.

## Boundaries

- Do not invoke OCR, inpainting, image generation, cloud APIs, or Iconfont by default.
- Use optional OCR/background repair only when a complex source genuinely requires it.
- If chart values are unreadable, label estimates or request clarification; never invent precise data.

Read [references/svg-library-policy.md](references/svg-library-policy.md) when adding assets and [references/qa-checklist.md](references/qa-checklist.md) before final delivery.
