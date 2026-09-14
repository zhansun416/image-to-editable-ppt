# Platform support

`image-to-editable-ppt` has a shared Node.js core and small operating-system adapters. The generated `.pptx` remains editable in PowerPoint on either platform; the difference is how the slide is previewed and how equations are handled.

| Capability | Windows | macOS | Linux |
| --- | --- | --- | --- |
| PptxGenJS generation | Supported | Supported | Supported |
| Persistent local SVG library | Supported | Supported | Supported |
| PPTX structural inspection | Supported | Supported | Supported |
| Manifest delivery validation | Supported | Supported | Supported |
| Visual comparison artifacts | Python + Pillow | Python + Pillow | Python + Pillow |
| Headless render QA | PowerPoint COM or LibreOffice | LibreOffice | LibreOffice |
| Per-slide PNG output | PowerPoint COM or LibreOffice + Poppler | LibreOffice + Poppler | LibreOffice + Poppler |
| MathType Word/WPS OLE | Supported when the user provides the local bridge | Not supported | Not supported |
| Formula fallback | EMF/WMF or SVG/PDF plus MathML/MTEF source | SVG/PDF plus MathML/LaTeX source | SVG/PDF plus MathML/LaTeX source |

## macOS setup

1. Install Node.js 20 or newer, LibreOffice, and optionally Poppler (`pdftoppm`) using the package manager of your choice.
2. Clone this repository and run `node scripts/setup.mjs`.
3. Run `node scripts/check-env.mjs` to confirm the local render route.
4. During reconstruction, run `node scripts/svg-library.mjs init` once to seed the local SVG collection.

LibreOffice is used only to generate preview artifacts for quality assurance. The skill creates standard Office Open XML `.pptx` files through PptxGenJS. For an additional visual sign-off, open the finished deck in PowerPoint for Mac if it is available. Font availability differs between LibreOffice and PowerPoint: inspect the actual render and record substitutions rather than relying on the font family declared in OOXML.

On Windows, `winget install --exact --id oschwartz10612.Poppler` installs Poppler. The standard Winget package directory is detected automatically if the active terminal has not reloaded PATH yet.

## Formula note

MathType OLE automation depends on the Windows Word/WPS integration. On macOS and Linux, preserve the editable equation source (preferably MathML or LaTeX) beside the slide asset and insert a vector fallback. This avoids falsely presenting a raster formula as an editable MathType object.
