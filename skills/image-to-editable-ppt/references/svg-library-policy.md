# SVG library policy

Search the library before opening an external icon website. Tag and semantic matches are candidates only. Compare silhouette, internal structure, proportions, direction, line/fill treatment, and style with the source before reuse. Reject a semantically similar asset when its visible geometry differs.

`generated-basic` entries are locally authored geometric primitives. External entries must retain source URL, source label, hash, extraction method, and license status.

Never overwrite a library asset with a different hash. A visible page SVG extracted after a blocked download must be described as `inline-rendered-svg` and `fallback-inline`, not as an official download.
