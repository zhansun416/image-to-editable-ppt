# Reconstruction manifest

Create one `reconstruction-manifest.json` beside each rebuilt deck. It records the source-first inventory, implementation choice, PowerPoint object mapping, completion state, and visual review. The manifest makes omissions and undeclared fallbacks visible, but it cannot prove that every source-image element was inventoried. Before building and again before delivery, inspect the entire source image and complex crops for source content absent from the manifest.

## Schema 1.0

```json
{
  "schemaVersion": "1.0",
  "deck": { "id": "stable-deck-id", "notes": "scope and uncertainties" },
  "slides": [
    {
      "slide": 1,
      "canvas": { "widthPx": 1600, "heightPx": 1000 },
      "regions": [
        {
          "id": "process-flow",
          "bbox": { "x": 80, "y": 180, "w": 900, "h": 540 },
          "layer": 20,
          "role": "process-flow",
          "critical": true,
          "fidelity": {
            "status": "verified",
            "methods": ["side-by-side", "overlay", "region-crop", "semantic-flow-review"],
            "notes": "Node order, arrow direction, spacing, and labels checked."
          },
          "elements": [
            {
              "id": "decision-node",
              "bbox": { "x": 410, "y": 310, "w": 220, "h": 120 },
              "layer": 24,
              "role": "decision-node",
              "expectedEditability": "native",
              "representation": { "mode": "mixed", "editability": "native" },
              "objectMap": [
                { "name": "decision-shape", "type": "shape" },
                { "name": "decision-label", "type": "text" }
              ],
              "completion": { "status": "complete", "notes": "Geometry and label are native objects." },
              "fidelity": {
                "status": "verified",
                "methods": ["structure-readback", "overlay"],
                "notes": "Mapped objects and rendered placement checked."
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Coordinates are source-image pixels. `slide` follows actual presentation order. Every actual slide needs a record. For an intentionally blank source page, set `"blank": true`, provide `blankReason`, and use `"regions": []`; the inspector rejects actual objects on a declared blank slide. A region is a visual review scope; only leaf elements own `objectMap` entries. One complex element may map to several native objects.

Use stable, unique `objectName` values in PptxGenJS. Object types are `text`, `shape`, `line`, `connector`, `chart`, `table`, `picture-raster`, `picture-svg`, `picture-unknown`, `group`, or `unknown`. A line or arrow shape is `line`; reserve `connector` for an OOXML connector node. Even then, inspect its rendered topology and endpoints manually rather than assuming that `p:cxnSp` proves correct attachment.

Representation modes are `native-text`, `native-shape`, `native-line`, `native-connector`, `native-chart`, `native-table`, `native-group`, `verified-native-path`, `raster-picture`, `svg-picture`, `mixed`, and `deferred`. `verified-native-path` requires `{"name":"path-name","type":"shape","geometry":"custom"}` and inspector confirmation of `custGeom`; visual path fidelity still needs review. An embedded SVG remains `picture-svg`, not a native shape.

For an original photo, texture, or already intentional visual asset, set `expectedEditability` to `asset` and record `assetReason` plus `editabilityBoundary`. That choice is not a quality downgrade. If an expected native element becomes a picture, or any element is `partial` or `deferred`, add:

```json
"degradation": {
  "reason": "why reliable native reconstruction was not possible",
  "editabilityBoundary": "what the user can and cannot edit"
}
```

Use draft mode while rebuilding. Delivery mode rejects incomplete elements, unmapped objects, undeclared degradation, incompatible representation mappings, and unverified critical regions:

```bash
node scripts/check-manifest.mjs reconstruction-manifest.json --mode draft
node scripts/inspect-ppt.mjs output.pptx --manifest reconstruction-manifest.json --mode delivery
```

The checks can validate only registered regions and elements. Always compare the source and rendered full slide before reviewing manifest regions.
