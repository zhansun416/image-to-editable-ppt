---
name: image-to-editable-ppt
description: "Rebuild static slide images or image-based PPT pages as high-fidelity, editable PPTX slides. Use for reference-image reconstruction, not ordinary PPT edits or new deck design."
---

# Image to Editable PPT

Rebuild the supplied image with fidelity first and native PowerPoint editability wherever reliable. Complexity never justifies silently omitting, replacing, or simplifying source content.

## Setup

- Default to the Node.js commands on every platform: `node scripts/check-env.mjs` and, only when the user authorizes installation, `node scripts/setup-dependencies.mjs`. Do not install dependencies automatically.
- `PPTXGENJS_DIST` may override the runtime; otherwise use `runtime/node_modules/pptxgenjs/dist/pptxgen.cjs.js`.
- PowerShell scripts are Windows adapters. Use `render-ppt.ps1` only when PowerPoint COM is desired and `prepare-formula.ps1` only for the Windows MathType Word/WPS bridge.
- The SVG library defaults to `Documents\Codex\svg-library`; set `I2EP_SVG_LIBRARY` to override it. Run `node scripts/svg-library.mjs init` before first use in a new environment.

## Inspect and inventory the source

1. Inspect the full source image before listing objects. Recheck the full image and enlarged complex areas after the manifest is drafted; a valid manifest cannot prove that every visible source element was registered.
2. Preserve the source pixel aspect ratio. Define a matching custom PPT layout; do not force widescreen. Record the source canvas in the manifest.
3. Inventory visual regions and leaf elements in `reconstruction-manifest.json`: bounding box, layer, role, expected representation, PowerPoint object mapping, completion, and fidelity review. Read [references/reconstruction-manifest.md](references/reconstruction-manifest.md) before building.
4. Treat fonts, font weight, size, tracking, color, line width, alignment, spacing, overlap, and z-order as reference constraints. Use the closest available face to the reference; do not force Latin runs to Times New Roman. Confirm that the chosen render engine can access the font and record any substitution.

## Reconstruct

- Prefer native text, basic shapes, editable line shapes, real connectors when available, tables, and charts when structure or values are recoverable.
- Decompose complex diagrams and illustrations into smaller native objects or verified native paths before considering a fallback. Preserve one complex element with several mapped PowerPoint objects when needed.
- If reliable native rebuilding would invent content or lose appearance, retain only that local region as a raster or SVG asset. Declare why, what remains editable, and the affected bounding box. Do not use a full-slide screenshot as an editable slide or hide unimplemented work beneath one.
- When separating text from an image, confirm that the retained asset contains no duplicate lettering. Do not repair illegible text by inventing copy.
- An embedded SVG is a picture, not a native PowerPoint shape. Count a path as native only after actual conversion and package readback. Logos, photos, textures, decorative vectors, and irrecoverable visuals may remain declared assets.
- If chart values are unreadable, record estimates as estimates or request clarification. Never invent precise data.

## Asset selection

Search the local SVG library before external lookup with `node scripts/svg-library.mjs find --query "..."`. Search tags produce candidates only. Before reuse, compare silhouette, internal structure, proportions, direction, line/fill treatment, and visual style against the source. Reject semantic matches that look different.

If no close local asset exists, use an approved icon workflow and register the selected standalone SVG with `node scripts/svg-library.mjs register`. Preserve source URL, hash, extraction method, and license status. Read [references/svg-library-policy.md](references/svg-library-policy.md) when adding assets.

## QA and delivery

1. Run draft validation while building:

   ```bash
   node scripts/check-manifest.mjs reconstruction-manifest.json --mode draft
   node scripts/inspect-ppt.mjs output.pptx --manifest reconstruction-manifest.json --mode draft
   ```

2. Render every slide with `node scripts/render-ppt.mjs output.pptx render-dir`. The Windows PowerPoint-COM adapter is optional.
3. Compare source and actual render at their correct aspect ratio:

   ```bash
   python3 scripts/compare-renders.py source.png render-dir/slide-1.png comparison-dir --manifest reconstruction-manifest.json --slide 1
   ```

   Review the full slide first, then the side-by-side, 50% overlay, enhanced difference, and critical-region crops. Pixel measures are diagnostic only; do not impose an uncalibrated similarity threshold.
4. Inspect critical regions separately for meaning and topology, including arrow direction, dense chart/table labels, composite illustration parts, and text-image stacking. Visual similarity alone cannot confirm these.
5. Reopen the source at full-slide scale and enlarged complex areas. Look for source content absent from the manifest or reconstruction, then update both.
6. Run delivery validation:

   ```bash
   node scripts/check-manifest.mjs reconstruction-manifest.json --mode delivery
   node scripts/inspect-ppt.mjs output.pptx --manifest reconstruction-manifest.json --mode delivery
   ```

   Delivery mode rejects incomplete/deferred elements, undeclared degradation, missing or type-mismatched mappings, unmapped PPT objects, and unverified critical regions. SVG pictures remain reported as pictures.

Read [references/qa-checklist.md](references/qa-checklist.md) before final delivery.

## Boundaries

- Do not invoke OCR, inpainting, image generation, cloud APIs, or Iconfont by default. Use optional OCR or local background repair only when the source genuinely requires it and the user authorizes the dependency.
- Image comparison measures an existing reconstruction; it must not redraw or alter the source.
- For formulas, preserve MathML/MTEF or LaTeX source and create an EMF/WMF/SVG/PDF-compatible vector fallback. MathType Word/WPS OLE automation is Windows-only.
