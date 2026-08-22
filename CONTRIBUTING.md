# Contributing

Keep the default installation lightweight. New OCR, model, browser, or cloud dependencies must be optional and documented in the README.

Do not add an external SVG without source URL, hash, extraction method, and license status. Do not copy a third-party script without retaining its license notice and adding its exact source to `THIRD_PARTY_NOTICES.md`.

Before opening a pull request, run the Node syntax checks, validate all seed SVGs, and render at least one generated PPTX with the standard LibreOffice route or PowerPoint when that environment is available. PowerShell checks apply only to the Windows-specific adapters.
