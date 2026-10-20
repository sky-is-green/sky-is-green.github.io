# tools

Test scaffolding for the site, kept here because `/tmp` does not survive between
sessions and these were rewritten from scratch more than once. Nothing in this
folder is part of the site (it is served by Pages, like the rest of `planning/`,
but nothing links to it).

| file | what it does |
| --- | --- |
| `probe.sh <W,H> <out.png> <query> [root]` | one whole probe run: frees the ports, drops Firefox's cache, starts the three servers below, screenshots the probe, prints the beacon log with its `\|\|` separators broken out. It does not write or delete `_probe.html`. |
| `nocache_server.py <root> <port>` | static server with `Cache-Control: no-store`. Use this, not `python3 -m http.server`: that one sends no cache headers, so Firefox silently serves a stale `app.js` and a whole round of measurements is meaningless. |
| `slow.py` (port 8770) | a 1×1 gif that answers after 5s (`?d=<seconds>`). Referenced from a probe page to hold the `load` event open: `--screenshot` fires at `load`, before post-load JSON fetches resolve, so a bare capture of this site is missing everything built from `data/*.json`. |
| `beacon.py` (port 8771) | logs each request's query string to `/tmp/opencode/beacon.log`. A probe page reports measurements back as `new Image().src = 'http://127.0.0.1:8771/b?' + encodeURIComponent(...)` — no CORS, no reading numbers out of screenshots. |
| `png2raw.py in.png out.raw` | PIL: PNG → raw RGBA + `out.raw.meta`. |
| `decode_raw.js /abs/path/core.js out.raw` | decodes that raw RGBA with the PixelQR engine, so a rendered QR can be proven to scan. |

## The probe pattern

Firefox headless cannot be driven by a WebDriver here, so a page reports on
itself. Put a `_probe.html` in the site root (**delete it afterwards — never
commit it**), load the site in a 100vw×100vh iframe, measure inside it, and
beacon the result out:

```html
<iframe id="f" src="/"></iframe>          <!-- or "/#work", or "/?p=games" -->
<img id="hold" src="http://127.0.0.1:8770/slow.gif?d=16">   <!-- hold load open -->
<script>
const log = (s) => { new Image().src = 'http://127.0.0.1:8771/b?' + encodeURIComponent(s); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
document.getElementById('f').addEventListener('load', async () => {
  const w = document.getElementById('f').contentWindow, d = document.getElementById('f').contentDocument;
  await wait(2800);                       // fonts + data
  /* measure ... */
  log('probe :: ' + out.join(' || '));
});
</script>
```

Run it in **one shell invocation** (the servers must be up before Firefox
starts, and the iframe is same-origin only because the probe is served from the
site's own root). `planning/tools/probe.sh` does exactly this:

```sh
cd /tmp/opencode && fuser -k 8770/tcp 8771/tcp 8766/tcp; sleep 0.3; rm -f beacon.log
SITE=/path/to/sky-is-green.github.io
python3 $SITE/planning/tools/beacon.py &
python3 $SITE/planning/tools/nocache_server.py "$SITE" 8766 &
python3 $SITE/planning/tools/slow.py &
sleep 0.8
timeout 200 firefox --headless --no-remote --profile /tmp/opencode/ffprof \
  --window-size=1300,1000 --screenshot /tmp/opencode/shot.png \
  "http://127.0.0.1:8766/_probe.html" >/dev/null 2>&1
sleep 0.4; cat beacon.log
fuser -k 8770/tcp 8771/tcp 8766/tcp; rm -f "$SITE/_probe.html"
```

Two traps, both already paid for:

- give the hold-open image `position: fixed` — inline, its line box (~22px)
  pushes the iframe down, so the paint sits 22px below every rect the beacon
  reports;
- the probe reports at a *fixed time*. The card's record decodes ("generates")
  when it comes to the front, and while it is scrambled it lays out taller, so
  measure a settled card either at rest or ≥4s after waking it.

And two more, paid for later:

- **`load` is also the deadline.** `--screenshot` fires at `load` and Firefox
  quits straight after, taking any unfinished probe with it — a probe that
  clicks, waits and measures for 25s needs the hold-open image to hold `load`
  pending for longer than that (`?d=45`), not the 16s it takes to merely let the
  JSON land. A beacon that never arrives is usually this, not a bug in the site.
- `--window-size=1300,1000` gives an `innerWidth` of about 1288 (the scrollbar),
  and the screenshot is 1300px wide: measured rects and screenshot pixels are not
  the same coordinate space. Crop no tighter than the discrepancy allows.

## Decoding a QR from a screenshot

```sh
python3 planning/tools/png2raw.py /tmp/opencode/shot.png /tmp/opencode/shot.raw
node planning/tools/decode_raw.js /abs/path/pixelqr/core.js /tmp/opencode/shot.raw
```

(needs the `decodeRGBA` export in `pixelqr/core.js` and PIL on the machine).
