# This is a mirror

These files are a byte-for-byte copy of the **pixelqr** project at
`sky-is-green/pixelqr` commit `bce265b` (2026-10-20). The editable copy, tests and
history live there: change it there, never here.

It is mirrored into this repository because GitHub Pages is not switched on for
the project repo, so `/pixelqr/` (the URL both the homepage link and the
games-page embed use) had nothing to serve. Serving it from here makes that
path live today.

**When Pages is enabled on `sky-is-green/pixelqr`** (Settings → Pages →
Deploy from a branch → `main` → `/`), the project site publishes to the same
`/pixelqr/` path and this directory is no longer wanted: delete it, so the
project repo is the only source.

To refresh it in the meantime:

    cp index.html style.css core.js app.js reader.js favicon.svg /path/to/site/pixelqr/
    cp lib/qrcode.js lib/jsQR.js /path/to/site/pixelqr/lib/
    cp assets/fonts/*.woff2 /path/to/site/pixelqr/assets/fonts/

and update the commit hash above.
