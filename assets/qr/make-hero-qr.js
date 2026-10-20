/**
 * The hero QR.
 *
 * Same code the avatar has always carried — v4, cat preset, dots style — but
 * rendered full-bleed: a 4-module quiet zone and nothing else. The platform
 * avatars (avatar-1024/512.png) keep the wide white margin they need because
 * GitHub and Hugging Face crop avatars to a circle; the hero shows it in a
 * square frame, where that same margin just makes the code look small: it fills
 * 58% of the file and would fill 58% of the frame. This render fills ~84% of
 * it — quiet zone, code, edge — and is drawn at an integer 20px per module so
 * the modules stay crisp at the size the page displays them.
 *
 * Usage:  node make-hero-qr.js [path/to/core.js]
 *   Writes /tmp/opencode/hero-qr.raw + .meta
 *   Then: python3 make-hero-qr.py   →  hero-qr.png  (820×820)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const P = require(process.argv[2] || path.join(__dirname, '..', '..', 'pixelqr', 'core.js'));

const URL = 'https://sky-is-green.github.io#'; // exactly what the avatar encodes
const VERSION = 4;
const N = VERSION * 4 + 17;                    // v4 → 33 modules
const MASK = 7;                                // the mask the avatars carry
const BOX = 20;                                // px per module (integer: crisp)
const QUIET = 4;                               // modules of white: the QR minimum
const OUT = '/tmp/opencode/hero-qr.raw';

/* The app frames a template to the current version's canvas before fitting it;
   the same 33-cell frame on the shipped avatar is what this must reproduce. */
function reframeRows(rows, newN) {
  const oldN = rows.length;
  const off = Math.floor((newN - oldN) / 2);
  const out = [];
  for (let y = 0; y < newN; y++) {
    let row = '';
    for (let x = 0; x < newN; x++) {
      const oy = y - off, ox = x - off;
      row += (oy >= 0 && ox >= 0 && oy < oldN && ox < oldN) ? rows[oy][ox] : '.';
    }
    out.push(row);
  }
  return out;
}

const art = P.artFromRows(reframeRows(P.TEMPLATE_ROWS.CAT, N));
/* The mask is pinned, not searched: the hero has always carried the same code
   as the platform avatars (mask 7), and the two must stay one code — the hero
   is that code drawn full-bleed, the avatars are it drawn with a margin for a
   circular crop. An engine change that picks another mask would silently
   split them. */
const w = P.fitWorkbench(URL, VERSION, art, { mask: MASK, style: 'dots', margin: 1.0 });

/* A styled render is not perfectly scale-invariant: at one size in twenty a
   finder pattern blurs just enough to lose it. So the box is not a constant
   but a choice — the largest integer size that still decodes. */
let img = null, box = 0, decoded = null;
for (let b = BOX; b >= BOX - 4; b--) {
  const candidate = P.renderRGBA(w.t.modules, N, b, QUIET, 'dots');
  const read = P.decodeRGBA(candidate);
  if (read === URL) { img = candidate; box = b; decoded = read; break; }
}
if (!img) {
  console.error('the render does not decode at any size from', BOX, 'down to', BOX - 4);
  process.exit(1);
}

fs.writeFileSync(OUT, Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length));
fs.writeFileSync(OUT + '.meta', JSON.stringify({
  w: img.width, h: img.height, url: URL, version: VERSION, mask: w.fit.mask,
  flips: w.t.flips, box: box, quiet: QUIET, verified: true
}, null, 2));

console.log('v' + VERSION + ' ' + N + ' modules · mask ' + w.fit.mask + ' · flips ' + w.t.flips);
console.log(img.width + '×' + img.height + ' → ' + OUT + ' (decodes to ' + decoded + ')');
