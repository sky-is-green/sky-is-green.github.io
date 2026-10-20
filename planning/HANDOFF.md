# Hand-off — sky-is-green.github.io

Everything below is committed and pushed. Nothing is half-finished; the site is
green and live. This document is the state of play so a new session can pick up
without re-deriving anything.

## Start here (the continuation prompt)

> Continue work on my portfolio site at
> `/run/media/penis/cbfa1404-241a-484e-9136-de07ee2fa8ad/work/sky-is-green.github.io`
> (live: https://sky-is-green.github.io/). Read `planning/HANDOFF.md` first, then
> `planning/PORTFOLIO_SCOPE.md` for the decision log, and
> `planning/tools/README.md` for how to run and measure the site headlessly in
> Firefox (this machine has no Chromium, so Firefox is the only verifiable
> browser). Work is committed and pushed as it lands. The next thing I want is
> <…>.

## Where everything is

| thing | path |
| --- | --- |
| the site (this repo) | `…/work/sky-is-green.github.io` — remote `sky-is-green/sky-is-green.github.io`, branch `main` |
| the profile README | `…/work/sky-is-green-profile` — remote `sky-is-green/sky-is-green` (the profile repo), branch `main` |
| PixelQR, the app | `…/work/pixelqr` — its own repo, clean at `942e8c6` |
| PixelQR as served | `sky-is-green.github.io/pixelqr/` — a byte copy of that commit, see `pixelqr/MIRROR.md` |
| decision log | `planning/PORTFOLIO_SCOPE.md` (long; the recent work is at the end, before "Still open") |
| test scaffolding | `planning/tools/` (+ its README) |
| page data | `data/profile.json`, `data/projects.json`, `data/open.json` |

The site is static, no build step: `index.html` + `app.js` + `screen.js` +
`styles.css`, `games/` (the arcade page), `assets/` (fonts, the QR renders),
`pixelqr/` (the mirrored app). GitHub Pages serves the repo root; `.nojekyll` is
present.

## Working on it

```sh
SITE=/run/media/penis/cbfa1404-241a-484e-9136-de07ee2fa8ad/work/sky-is-green.github.io
cd /tmp/opencode && fuser -k 8770/tcp 8771/tcp 8766/tcp; sleep 0.3; rm -f beacon.log
python3 $SITE/planning/tools/beacon.py &
python3 $SITE/planning/tools/nocache_server.py "$SITE" 8766 &
python3 $SITE/planning/tools/slow.py &
sleep 0.8
# …write $SITE/_probe.html (see planning/tools/README.md), then:
timeout 200 firefox --headless --no-remote --profile /tmp/opencode/ffprof \
  --window-size=1300,1000 --screenshot /tmp/opencode/shot.png \
  "http://127.0.0.1:8766/_probe.html" >/dev/null 2>&1
cat /tmp/opencode/beacon.log
fuser -k 8770/tcp 8771/tcp 8766/tcp; rm -f "$SITE/_probe.html"
```

`planning/tools/probe.sh <W,H> <out.png> <query>` is all of that in one command
(it drops Firefox's cache too, which the manual sequence above does not): write
the probe, run the script, read the log. The manual form is here for when the
script is the thing that needs debugging.

Rules that keep this honest:

- `_probe.html` is temporary and is **never committed**.
- Serve with `nocache_server.py`, never `python3 -m http.server` — without
  `no-store` Firefox serves a stale `app.js` and the measurements are fiction.
- Firefox's `--screenshot` fires at `load`; the drum is built from fetched JSON,
  so a hold-open image (`slow.py`) must keep `load` pending, and it must be
  `position: fixed` or every measured rect is 22px off the paint.
- After pushing, live is not live for ~60–90s (Pages) — curl the file for the
  marker you just added before believing a screenshot of the live site.
- Decoding a QR out of a screenshot: `planning/tools/png2raw.py` then
  `planning/tools/decode_raw.js` (see the tools README).

## Invariants — please keep

- **Firefox is the only browser that can be checked here.** Every fix so far has
  been Firefox-first (the drum's blank gap and gutter sliver were Firefox-only
  bugs); assume Chromium will be fine and check it if it ever becomes possible.
- **The drum is a tumbler** and stays one. The card's perspective is
  `PERSP = 1900`; do not make it orthographic. The faceted band idea is parked.
- **Retro, low-bit, obvious UI**: the numbered DOS menu stays; the CRT toggle
  stays; copy is terse.
- **The about copy is the author's**. Only clear slips were ever corrected (see
  the log); do not rewrite it. Its links are the author's too: the six concept
  links are Wikipedia pages, and the claims in paragraphs two and three point at
  their own projects (Strata, Bonsai 2 forensics, PixelQR, Scion) — re-point
  them only if asked.
- **The record fits its face** (`fitRecords()` / `--rec`). If you change the
  card's type, padding or the head row, re-measure at 390/430/1300 — the fit
  multiplies those numbers, so a size that ignores `var(--rec)` will break it.
- **One card builder, two sections** (`slideCard()`): the work drum and the
  open-projects carousel render the same card. A work card shows a `tok/s`
  readout and filterable tag chips; an open card shows a `status` badge, plain
  chips and no readout. Change the card and you change both — check both.
- **The carousel's arithmetic is three numbers**: `--peek` (how much of a
  neighbour shows), `--gap`, and the spacers at either end of `.caro-track` that
  let the first and last cards centre. The track is inset by the bezel's
  4px + 12px, so a card is never covered by the plastic. Change the card's width
  or the bezel and re-check the peek at 1300 **and** 390.
- **The drum is centred on the section's line** (frame, card and ticks share one
  centre). Above 880px `.tum-pad` mirrors the rail and `sizeDrum()` sets
  `--rail`; at or under 880px there is no side rail — the two buttons move under
  the frame and the pad is hidden. If you touch the row's children, re-check the
  centre line at 1300 **and** 390, and check both sides of the breakpoint.
- **PixelQR is named PixelQR** in prose; `pixelqr/`, `/pixelqr/` and repo slugs
  stay lowercase.
- **Touch the PixelQR engine only if you mean to.** If you do, run its node
  suites (`test/verify.js`, `test/pad.js`, `test/canvas.js`, `test/styles.js`,
  `test/pipeline.js`) and refresh the mirror by copy.

## What the last session changed (all pushed)

1. **PixelQR gets a second backend, and the round profile picture.** The app
   (the site repo's `pixelqr/` mirror of `sky-is-green/pixelqr`, refreshed to
   `c30ce7a`) now runs two backends: **standard**, an ordinary QR whose free
   surface — the area you may paint, kept free of random code cells — is a
   shape you choose (rounded square, circle, cross) and is now sized by what
   the error budget really allows (the unit is the codeword, and the tightest
   RS block decides, not the average cell count), and **custom**, our own
   layout: a disc for a grid, the three finder patterns inside it 120° apart,
   so the code fills a round avatar edge to edge. The custom code is **not a
   standard QR** — a phone camera will not read it — so the engine grew its
   own Reed-Solomon decoder to check the promise honestly. The version range
   went from v2–v6 to v2–v13 (the full alignment-pattern layout and the
   version-information blocks from v7 on), which is where most of the extra
   surface comes from: v10 buys a 35×35 free area against v6's 23×23. The
   avatar exports are now the round profile picture (the QR inscribed in the
   circle, so all three eyes survive the crop), and the export checks its own
   render — a styled render is not perfectly scale-invariant, and at one size
   in twenty a finder pattern blurs just enough to lose it. The app's copy and
   footer were tidied; the footer now says *an interactive for a profile
   picture near you*. The hero generator pins the mask (7) instead of
   searching: the hero and the avatars carry one code, and the regenerated
   hero is byte-identical to the committed one. See the decision log for the
   reasoning.
2. **`0a81d1f` — `[ vision ]` becomes `[ open projects ]`, and it slides.** The
   vision terminal is gone; the kernel-OS paragraph is the first card of a
   carousel in `data/open.json` (word for word from `profile.json`, whose
   `vision` object stays behind, unrendered, so nothing is lost if it does not
   become a card after all). The carousel is the drum's card — one
   `slideCard()` builds both, a work card showing the `tok/s` readout and
   filterable chips, an open card a `status` badge and plain ones — in the drum's
   monitor, on a scroll-snap track: one card centred, a sliver of each neighbour
   showing, the browser doing swipe and trackpad, a mouse drag for the rest, and
   `[ ◀ ]`/`[ ▶ ]`, both arrow keys and the numbered ticks to step a card. Only
   the centred card is awake, and it wakes 140ms after the strip stops, so a
   flick past three cards decodes one. `#vision` → `#open` (menu item 3, the
   games page's copy, `screen.js`'s key map); the arrow keys need
   `preventDefault()` because a focused scroll box moves ~40px natively; with one
   card the arrows and ticks are hidden. Two drum tricks are deliberately off in
   the strip (`--narrow: 1`, a half-strength side gradient over a lighter-edged
   surface) because a sliver is all edge and no middle, and at the drum's values
   the peek read as two dark bands instead of two panels. `fitRecords()` now
   takes a root. Fixed on the way: `Screen.decode` returned a handle with no
   `.stop()` when the effect was off (`?fx=off`), so the first scroll threw —
   pre-existing, and the drum had it too.
3. **`fb8e866` / `a32d0a2` — the session before that** moved the rail under the
   drum at or under 880px (the pad had taken a phone's screen down to its 200px
   floor) and pointed the about's claims at the author's own projects. See the
   decision log for both, and HANDOFF item 5 below for the one inference left to
   review in the about.
4. **The session before that** landed **a work card's record fits its face**
   (`fitRecords()` / `--rec`) and **the drum centred on the section's line**.
5. **`5ad5569` / `9157f60` — the open projects, cut down to two.** Five cards
   were written up from the author's material (session logs for the drone,
   Otamatone, talk box and airsoft, the Kestrel repo's README and `docs/`, and the
   talk box's shopping-list plan) and three of them — the kernel-OS card, the FPV
   drone and the airsoft platform — were withdrawn at the author's request as soon
   as they were seen. The Otamatone and the talk box, first written as one card,
   were split into two. `data/open.json` now holds exactly those two (*a DIY
   otamatone* and *a wearable Daft Punk talk box*, both status *parts sourced* —
   the author sourced the parts for both and is ready to build once the soldering
   iron is upgraded, which is the last bullet on each card), the copy distilled
   from the author's own notes and nothing invented, and no link row on either
   because neither has a public repo/demo/model. The cards are written in the
   first person singular on the author's instruction: it is one person's build
   log, so *I*, never *we*. The withdrawal costs nothing: the kernel-OS paragraph is still
   in `profile.json`'s `vision` (unrendered), the drone's writing is its own repo,
   and the airsoft source is the author's blueprint in Downloads. HANDOFF item 1
   below is the wording review that material still wants.

Measured at the end of this session: 1300×1000 monitor 856×492, track 824×460,
card 716×460, 54px of peek each side, count "2 open · project 1 / 2", two ticks,
one `.awake` per section, page 3085; both cards keep every bullet (396px and
397px inside the 460 face — the talk box's five fit by `--rec` easing, not by a
dropped bullet). At 390×844: card 254×456, peek 30, 400px / 365px inside the
face, no horizontal overflow. Stepping driven by probe on the real cards: buttons
0↔1 now *wrap* — next past the last card scrolls smoothly to the clone of the
first (which slides in from the right) and then teleports onto card 01, so it
does not sweep every card in between; prev on the first card cannot scroll left
past the start, so it jumps straight to the last card instead. Ticks and count
in step, `.active`/`.awake`/`aria-current` agreeing, no console errors, and no
first-person plural left in the copy. Free scrolling (drag, swipe, trackpad)
stays bounded at the two ends — only explicit steps wrap. The drum is untouched
at every width (frame 739.2×560 and `--rec: 1` on all nine cards at 1300; the
tag chips still filter: *quantization* → "2 of 9 entries"), and because the
change is data-only the previous session's clean 320×568 and `?fx=off` runs
still stand.

6. **The carousel now cycles — seamlessly forward.** `caroGoTo()` used to
   clamp at both ends. Now a next step past the last card scrolls smoothly to the
   clone of the first card (which slides in from the right) and then teleports onto
   card 01, so it does not sweep every card in between; prev on the first card
   cannot scroll left past the start, so it jumps straight to the last card
   instead. Ticks, count, `.active`/`.awake`/`aria-current` follow. Free scrolling
   (drag, swipe, trackpad) stays bounded, since wrapping mid-gesture would need an
   infinite track. The docs' earlier "clamps at both ends" notes are corrected to
   "wraps".

7. **The profile README is rebuilt** (`sky-is-green/sky-is-green`, a separate repo:
   `…/work/sky-is-green-profile`). It keeps the tech stack, the featured projects,
   the public repos, the social badges and the footer, and it now leads with the
   interactive portfolio — the QR avatar, which decodes to
   `https://sky-is-green.github.io#`, links to the site from the profile page.
   Everything else was cut: the old intro paragraph, the duplicated social row,
   the per-project badge rows. Two badges are live: *Public repos* (shields'
   dynamic JSON over the public API) and *Private repos*, which has no shields
   endpoint (both `/github/private-repos/…` and the dynamic JSON over
   `api.github.com/users/…` answer 404 / *no result* — GitHub does not publish
   the count). So the count lives in `private-repos.json` in the profile repo and
   the badge reads that file; a scheduled workflow
   (`.github/workflows/private-repos-badge.yml`, daily + dispatch) refreshes it
   with a GraphQL query for `viewer.repositories(privacy: PRIVATE)`. **The
   workflow needs a `GH_PAT` secret** (a PAT with `repo` scope): the workflow's
   own `GITHUB_TOKEN` is scoped to the repo it runs in and counts 0 private
   repos, and this machine cannot create repo secrets (the token gets 403 on
   `actions/secrets/public-key`). Until the secret exists the file keeps the
   hand-written count of 4 and the badge reads that.
8. **The contact section is back, and this time it is a `mailto:` and nothing
   else.** The first attempt (removed in `4dccdd2`) minted a random alias per
   visitor in the browser and published a domain that was not the author's, so
   visitors' mail went to a stranger and then bounced; the second attempt
   publishes `qbz7imbtw@mozmail.com`, a **Firefox Relay alias** the author
   controls, which Relay forwards to the real inbox. The real address is in no
   file in this repo. So the section is now a fixed address, a `mailto:` link
   and one `[ copy ]` button — no random names, no `localStorage`, no second
   paragraph of privacy prose. The shape is still data
   (`data/profile.json` → `contact`: `email`, `subject`, the copy), so
   changing the address is a one-line edit. The footer's id went back to being
   `#contact` for the section and the footer became `#colophon`, so the menu's
   4 and the games page's `../#contact` land on the section, which is where the
   address is.
   **Measured** (Firefox headless, 1300×1000 and 390×844): the section is a
   `<section id="contact">` 408px tall at 1300 and 418px at 390; the address
   renders 269px wide at 1300 and 168px at 390 with no overflow; the mailto is
   `mailto:qbz7imbtw@mozmail.com?subject=hello%20from%20sky-is-green.github.io`;
   the served document contains no `@gmail` and no `users.noreply`; pressing
   `4` and clicking the menu's `4 contact` both land on the section with the
   address on screen (the page cannot scroll further, because only the footer
   follows the section). The `[ copy ]` button falls back to *selecting* the
   address when the clipboard is refused, which is what a scripted click gets;
   a real click has the user activation the clipboard API needs.
   **Verified by mail, on 2026-10-20:** two messages were sent to the alias
   from a throwaway inbox (`ivbxufkvrs@mail.phantom-mail.sanjula.online`,
   created and sent through phantom-mail's own web UI) and no delivery
   notification came back to the sender. Note carefully what that does *not*
   prove: a control message to a deliberately non-existent `@mozmail.com`
   address also came back with no notification, so mozmail.com appears to
   accept unknown aliases rather than bouncing them, and "no bounce" is not
   evidence that this alias is registered. **The decisive check is the
   author's:** does the mail arrive in the real inbox? Only they can see
   that, and Relay's own dashboard is where to look.

## Open questions, in the order I would take them

1. **Confirm the contact address really reaches you.** Two test messages were
   sent to `qbz7imbtw@mozmail.com` from a throwaway inbox and nothing bounced
   back, but that is weak evidence — a bogus `@mozmail.com` address bounced
   back just as silently — so only your own inbox settles it. If the mail does
   not arrive, the alias is the wrong one (or Relay is not forwarding it) and
   the address in `data/profile.json` → `contact.email` is the one thing to
   change. Worth checking the *reply* path too: a reply leaves from the real
   address, so the inbox is hidden inbound only.
2. **Review the two open-project cards' wording.** They are in
   `data/open.json` — *a DIY otamatone* and *a wearable Daft Punk talk box* — and
   both were *distilled* from the author's notes rather than written by them (see
   the decision log). Read them back and change what sounds wrong; the file is the
   only place to edit, and no code depends on the wording. If more of the material
   comes back (the drone, the airsoft platform, the kernel OS), it is the same
   file, and the withdrawn copy is still around: the kernel-OS paragraph in
   `profile.json`'s `vision`, the drone's repo on the Desktop, the airsoft
   blueprint in Downloads.
3. **Play-test the arcade** — Snake and Breakout, keyboard *and* touch, on the
   games page — including the stage swap, which has only ever been driven by
   probe. `window.Cade.state(game)` exposes live state for assertions.
4. **The avatar direction** is still undecided: a generated portrait vs the
   existing low-bit style. The platform avatars (`avatar-1024.png` /
   `avatar-512.png`) are circular-crop renders of the same code as the hero QR.
5. **The games page footer's `EOF▮`** — keep, or move/remove? There is no prompt
   line on that page; the home page's cursor deliberately lives on
   `> sky-is-green`.
6. **The about's fusion claim** — read as the Strata engine ("fused kernels with
   measured per-change wins") rather than the llama.cpp fork's fusion
   *experiments*. Confirm or re-point.
7. **PixelQR's `LINKS TO` default** is `https://USER.github.io`; it should
   probably default to `https://sky-is-green.github.io/`. That is a change in the
   *pixelqr* repo, then a mirror refresh.
8. **Renaming the `GENERATIVE` filter chip** (a project tag on PixelQR) — the
   skills item was renamed to *non-AI generative art*, the tag was not.
9. Small offers never taken: moving the drum's stack breakpoint down to ~620px;
   `_probe.html` in `.gitignore`; the hero filling a tall window again
   (`min-height` + a header measurement — tried once, removed because it left
   ~146px of dead space above the divider); centring the card's record text;
   `frame generation` and fork/porting as skills concepts; repo stars, a
   last-commit Action, GoatCounter.
## Blocked

- GitHub Pages on `sky-is-green/pixelqr` cannot be enabled from here: `gh api`
  returns `403 Resource not accessible by personal access token` for both tokens
  on this machine. It only matters if the project should publish its own Pages;
  in that case delete this repo's `pixelqr/` so the project repo is the single
  source (`pixelqr/MIRROR.md`).
