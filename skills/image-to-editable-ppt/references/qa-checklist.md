# QA checklist

## Source completeness

- Inspect the full source before reconstruction, then inspect it again at final QA. The manifest checks only registered elements and cannot reveal a source element that was never inventoried.
- Enlarge complex regions and verify every visible node, label, connector/line, icon, chart mark, table cell, illustration part, texture, and overlap.
- Confirm that no full-slide screenshot hides unfinished work and that every localized fallback has an explicit boundary.

## Canvas and typography

- Match the source image aspect ratio in the actual PPT slide size. Do not stretch a render to conceal a mismatch.
- Compare layout, spacing, line width, colors, font family characteristics, weight, size, tracking, alignment, and z-order.
- Confirm that the render engine can access the selected fonts. OOXML font names alone do not prove a match; record any substitution visible in LibreOffice or PowerPoint.
- Check clipping, unexpected wrapping, overflow, altered line breaks, and text placed too close to a box edge.

## Representation and editability

- Prefer native text, shapes, lines/connectors, charts, and tables where structure is recoverable. Decompose complex graphics before choosing an asset fallback.
- Verify every leaf manifest mapping against the actual PPTX object name and type. Embedded SVGs remain pictures. EMF/WMF and unrecognized media remain picture assets and are not claimed as raster or native geometry.
- For text separated from an image, inspect both layers for duplicate lettering, missing characters, and invented repairs.
- Inspect line and connector topology manually. An arrow-shaped line does not imply a bound connector, and an OOXML connector node does not prove that endpoints attach correctly.
- Confirm photos, textures, logos, and declared assets have an honest `assetReason`/`editabilityBoundary`; confirm native-to-picture, partial, or deferred work has a `degradation` record.

## Visual comparison

- Render every slide through the intended QA route. Preserve the full source and full rendered page in the comparison output.
- Review full-page side-by-side, 50% overlay, and enhanced difference views before region crops.
- Review every critical region separately. For process flows and charts, verify meaning, direction, labels, and values in addition to appearance.
- Treat pixel metrics as diagnostic. Do not use an uncalibrated similarity threshold as delivery evidence.

## Delivery commands

```bash
node scripts/check-manifest.mjs reconstruction-manifest.json --mode delivery
node scripts/inspect-ppt.mjs output.pptx --manifest reconstruction-manifest.json --mode delivery
node scripts/render-ppt.mjs output.pptx render-dir
python3 scripts/compare-renders.py source.png render-dir/slide-1.png comparison-dir --manifest reconstruction-manifest.json --slide 1
```

Open `comparison-dir/comparison.html`, resolve all delivery errors, and rerender any affected slides. A structurally valid package still requires visual review.
