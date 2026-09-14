# Third-party notices

## Direct runtime dependency

- [PptxGenJS](https://github.com/gitbrent/PptxGenJS), MIT. Installed as the exact npm dependency `pptxgenjs@4.0.1`; its transitive dependencies are resolved by npm.
- [JSZip](https://stuk.github.io/jszip/), MIT or GPL-3.0-or-later. Installed as the exact npm dependency `jszip@3.10.1` for PPTX package access.
- [@xmldom/xmldom](https://github.com/xmldom/xmldom), MIT. Installed as the exact npm dependency `@xmldom/xmldom@0.9.12` for strict OOXML parsing.
- [Pillow](https://python-pillow.github.io/), MIT-CMU. Used when installed for local visual-comparison artifacts; it is not installed by the core Node setup.

## Workflow acknowledgments

The following MIT-licensed projects informed workflow decisions. Their source code is not vendored in this repository.

- `ningzimu/image-to-editable-ppt-skill`: page normalization, manifest thinking, and structural PPTX validation.
- `lirun/ppt-visual-reconstruction`: hybrid native-object reconstruction and render-based visual QA.
- `JadeLiu-tech/px-image2pptx`: optional OCR/background-repair routing.
- `gitbrent/PptxGenJS`: native OOXML generation.

If future changes copy or adapt a specific source file, retain its copyright and MIT notice beside the derived file and add the exact source path here.
