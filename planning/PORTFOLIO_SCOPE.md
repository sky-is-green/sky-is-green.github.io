# Project Scope — "Curiosity QR" Portfolio

> One-line pitch: **your profile picture is a QR code; on every platform it reads as
> "what is that?", and the people who get close enough to scan it are rewarded with
> an interactive, GitHub-hosted portfolio built from your projects.**

Status: scoped, PoC done ✅ · Author: assistant · Date: 2026-10-16

---

## 1. The idea, sharpened

A single static site on GitHub Pages that acts as your **portfolio storefront**, plus a
**QR-code avatar** deployed identically across GitHub, Hugging Face, and anywhere else
you have a presence. The avatar is deliberately cryptic at small sizes (nav bars,
mentions, feeds) and **scannable at profile-page size**. Scanning it opens the site on
the visitor's phone.

Two products, one system:

1. **The avatar** — a QR code that encodes the site's URL, engineered to survive
   circular crops and small rendering, and to *reward* curiosity.
2. **The site** — a fast, interactive single page: your projects as a filterable,
   keyboard-navigable catalog. "Short-form" is the right instinct: instant load,
   no scrolling wall of text, every project reachable in ≤ 2 interactions.

**Key constraint that shapes everything:** people arrive by *phone camera*. The site
must be mobile-first and instant. A desktop-first, heavy-3D experience would fail the
exact audience the QR trick is designed to capture.

---

## 2. Precedent (what already exists, and what to steal)

### 2a. The QR-avatar trick specifically

| Reference | What it is | Takeaway |
|---|---|---|
| [qrface](https://qrface.bisks.net/) | Rebuilds a Bluesky avatar **as** a QR code (avatar is thresholded to B/W; a dot in every module carries the real code) | The artful version of this idea exists and works. Sets the bar; we start with the clean version and can graduate to this. |
| [AI-Pree/github-qrcode](https://github.com/AI-Pree/github-qrcode), [ohno/github-qr](https://github.com/ohno/github-qr) | QR generators aimed at GitHub profiles (READMEs, cards) | Precedent for GitHub as QR canvas; also confirms "QR *in the README*" is common — the **avatar** version is the less-trodden, more interesting angle. |
| QR sizing literature ([NNgroup](https://www.nngroup.com/articles/qr-code-guidelines/), [Adobe](https://www.adobe.com/express/discover/tips/qr-code/design-best-practices)) | Scan reliability rules: 10:1 distance:size, 4-module quiet zone, dark-on-light, ECC levels | Hard design constraints (see §4). |

### 2b. Portfolio archetypes worth studying

| Archetype | Exemplars | Steal | Risk |
|---|---|---|---|
| **Editorial one-pager** | [brittanychiang.com](https://brittanychiang.com) (v5), [pwnjoshi.github.io](https://pwnjoshi.github.io) | Sidebar nav, section anchors, a real `/archive` page; the most *credible* look for engineering roles | Can feel static if not personalized |
| **Terminal / CLI** | [nihalshetty.me](https://nihalshetty.me), [prkrovi.com](https://pkrovi17.github.io), [pranavvis.tech](https://pranavvis.tech), [zvspany.github.io/bio](https://zvspany.github.io/bio/) | `whoami` / `projects` / `open <x>` commands, typing effect, skill graph (Pranav), command history | Full-terminal sites gate content behind typing; mobile typing is clunky |
| **IDE / VSCode** | [luisguilher.me](https://luisguilher.me), [Karan's VSCodePortfolio](https://github.com/karankashyap/VSCodePortfolio) | File-tree nav = instant mental model; Monaco editor = overkill; Ctrl+P-style **command palette** is the killer feature | Heavy; editor UX on phone is awkward |
| **OS / desktop** | [davidgrcias.github.io](https://davidgrcias.github.io) (WebOS), [iampawan.me](https://iampawan.me) (draggable windows) | Draggable windows, app icons as menu | Novelty tax; hard to keep accessible |
| **3D / immersive** | [jalenedusei.com](https://www.jalenedusei.com/workstation) (R3F workstation), [siv19.dev](https://siv19.dev) (WebGL hero) | Cinematic transitions, lazy-loaded 3D | Slow on phone over cellular — **wrong first impression for scanned traffic** |
| **Zero-dep + agent** | [adilshamim.me](https://adilshamim.me) (vanilla, AI concierge, 95+ Lighthouse) | No-framework discipline, sub-second load, deterministic "AI" without API keys | Building an AI concierge is a separate project |
| **Flavor features** | [chinmaysakhare.netlify.app](https://chinmaysakhare.netlify.app) (10 themes, hidden games), [mohameddatt.com](https://mohameddatt.com) (terminal adventure game) | Theme switcher, one or two easter eggs | Games/themes multiply scope; cap at 2 signature interactions |

**Recommendation:** hybrid of **Editorial one-pager + command palette** (IDE's best
feature, no editor), with terminal styling as *seasoning* (a `~` prompt in the hero, an
optional `>_` easter egg), not as the whole meal. In the B/W QR language of the avatar,
the site can echo a stark monochrome base with one accent color — the avatar and site
feel like one brand.

---

## 3. Feasibility PoC — does the QR survive as an avatar? (done)

Script: `qr-avatar-poc/make_poc.py` · Images: `qr-avatar-poc/` (`overview.png` = the money shot)

Geometry: platforms render square avatars through a **circular mask**, so only the
inscribed area survives → usable width ≈ `D / √2` ≈ 70% of the avatar. The QR **plus
its 4-module quiet zone** must fit in that circle.

PoC results (ECC level **H**, 30% error recovery, 1024×1024 canvas, QR centered at ~58% width):

| Variant | Payload | QR version | Modules | Fits circle crop | px/module @ 460px (profile, retina) | @ 260px | @ 40px (feeds) |
|---|---|---|---|---|---|---|---|
| A | `https://USER.github.io` (22 ch) | v3 | 29 + 8 quiet | ✅ | 7.2 | 4.1 | 0.6 |
| B | `https://u.dev` (13 ch) | v2 | 25 + 8 quiet | ✅ | 7.2 | 4.1 | 0.6 |

Conclusions:

- **Profile page (desktop, retina 460px): comfortably scannable** — 7 px/module.
- **Profile page (single-density 260px): borderline-OK** — 4 px/module; needs real-phone testing and is a strong argument for a **short custom domain** (fewer modules → bigger pixels).
- **Nav bars / feeds (24–40px): intentionally unscannable.** That's not a bug — it's the "what is that?" hook, and a brand mark that looks identical everywhere.
- Practical scan flow to optimize for: desktop visitor sees QR → scans with phone. Let mobile users in via screenshot → iOS/Android Photos detect the QR in the image (worth verifying in testing).
- Same asset works on Hugging Face, X, LinkedIn, Discord, Slack (rounded-square = easier than circle). **Design for the circle; every other platform is free.**

Open QR decisions (M0/M4):
- Exact URL payload: prefer a **custom short domain** (`firstlast.dev`, ≤ ~20 chars → v3, big modules). Fallback `USER.github.io` works.
- Optional `?s=qr` (6 chars) for scan attribution via GoatCounter — costs a QR version bump; decide against it if that pushes density too far.
- Styling: start pure B/W. Round-module or centered-monogram versions are *test-gated* variants (ECC H tolerates a small logo, but every variant must pass the phone matrix).
- Keep current photo as a fallback asset; rollback must be one upload.

---

## 4. The site — architecture

**Hosting:** GitHub Pages (free, HTTPS, custom domain supported). Static only — no
server functions, so API keys for AI features are out of v1.

**Two build options:**

| | Option A — Zero-build vanilla | Option B — Vite + React/TS (+ Tailwind) |
|---|---|---|
| Stack | `index.html` + `styles.css` + `app.js` + `data/*.json` | Componentized, typed, routed |
| Build | none; push to deploy | GitHub Actions build → Pages artifact |
| Load | smallest possible; best for scanned-on-cellular traffic | still fast if disciplined |
| Precedent | adilshamim.me, pranavvis.tech, zvspany/bio | siv19.dev, many others |
| Best if | you want bulletproof + Lighthouse 100 | you want to grow it (archive pages, blog later) |

**Either way, the data model is the backbone:**

```
data/projects.json      # the single source of truth
  { slug, title, hook (1 line), bullets[], tags[], repo, demo?, status, featured }
data/profile.json       # name, one-liner, about, links, resume.pdf
```

**Project selection (decided 2026-10-16):** the portfolio only lists work with a
large personal contribution, and only **public** repos. Fork / engine work appears
as *contributions*, labeled with the personal commit count.

| Tier | Entry | Evidence |
|---|---|---|
| Project ✦ | **Scion** | 198 commits, owner — behind the released Scion-35B-A3B / Scion-FlashNext-176B-A6B |
| Project ✦ | **Splinter Memory** | 128 commits, owner |
| Project ✦ | **HiveBench** | 247 commits, owner |
| Project ✦ | **Bonsai 2 ternary forensics** | 47 commits, owner |
| Contribution ✦ | **Strata** (engine fork) | 31 commits in a ~2.2k-commit engine — kernel fusions + the k=1 MTP drafter |
| Project ✦ | **PixelQR** | the interactive piece |
| Project | **ScrollPeak** | 41 commits, owner |
| Contribution | **DeepSeek Harness** (fork) | 80 commits — plugins, studio, verify gates |
| Contribution | **Prism** (llama.cpp fork) | 19 commits — MoE expert slot cache, kernel experiments |

**Excluded:** private repos, per policy — TaleEngine (281 commits), Hive-Ops,
Decision-Lab, lsfg-cross-gpu. Also excluded for zero/trivial personal
contribution — llama-stock (upstream clone), lsfg-vk (upstream clone),
lsfg-vk-dualgpu (0 commits), FreeToken (0), RCO (0), huggingface.js (fork, no
work in it), autogrid (3 commits: attribution scaffolding only).

The curated dataset lives in `data/projects.json` (schema above, extended with
`kind`, `contribution`, `models`).

**Live GitHub enrichment without runtime rate limits:** a GitHub Action runs a small
script (daily or on push) that calls the GitHub API once, merges stars / language /
last-commit into the JSON, and commits it. The site stays fully static, zero API calls
from visitors' browsers (anonymous API = 60 req/hr per IP; a scan spike would 403).

**Analytics:** GoatCounter (free, privacy-friendly, works on Pages) — count visits,
plus `?s=qr` param if we accept the QR-density cost, to measure "how many people
actually scanned me."

**Repo layout (proposed):**

```
USER.github.io/            # or /portfolio with Pages configured
├─ index.html | src/       # site (per option A/B)
├─ data/                   # projects.json, profile.json
├─ scripts/enrich.ts|py    # build-time GitHub API merge
├─ assets/qr/              # avatar-1024.png + generator script + test sheet
├─ .github/workflows/     # deploy (+ enrich cron)
└─ CNAME                  # if custom domain
```

---

## 5. Interactive menus — pick two, skip the rest (v1)

Scanned visitors have ~30–60 seconds. Menus must work with thumbs, not keyboards alone.

1. **Command palette (⌘K / tap-to-search)** — fuzzy search across projects; opens
   detail drawer. On mobile it's just a big search field above the grid. *This is the
   signature interaction.* Deep-linkable (`/p/strata`) so links from chat/apps work.
2. **Tag filters** — you have ~28 repos in this workspace (strata-*, prism-*, lsfg-*,
   hive-*, autogrid, taleengine, …). Domain chips: `ML systems`, `GPU/graphics`,
   `infra`, `tools`, `games`. One tap → filtered grid.
3. *(Flavor, pick one)* Terminal easter egg: a `>_` button accepting `ls`, `open <project>`,
   `whoami`, `sudo hire-me`. Or a skills↔projects graph (Pranav-style). Not both.
4. *(Stretch)* Archive page `/archive` with the full repo table (bchiang-style) — cheap
   once data is JSON.

Explicitly out of v1: 3D scenes, games, theme system, AI chat. They're great — and they
are how these projects balloon from a weekend to a month.

---

## 6. Content plan (the real work)

Code is a weekend; **copy is what makes it feel like you.** For ~8 featured projects:

- `hook`: one line, outcome-first ("Real-time upscaling anywhere, on any GPU" > "CUDA port of X")
- 3 bullets: problem → what you did → result (numbers if possible)
- tech chips, status (`active`, `archived`, `WIP`), links (repo / demo / writeup)
- one screenshot or diagram each (even a terminal capture beats nothing)

The remaining ~20 repos go in the archive table with just title + one-liner + link.

Site voice suggestion (rewards the scan, sets tone):
hero line like *"You scanned. Good instinct. — here's everything I build."*

---

## 7. Milestones

| # | Deliverable | Effort | Done when |
|---|---|---|---|
| **M0** | This scope + QR PoC + URL decision | ~done | You approve direction + answer §9 questions |
| **M1** | Skeleton: repo, data JSON (8 featured), hero/projects/contact sections, palette v0, deploy to Pages | 1 weekend | Live URL, loads < 1s on phone, link on GitHub profile |
| **M2** | Signature interactions: fuzzy palette, filters, detail drawer w/ deep links, theme accent, reduced-motion | 1 weekend | Keyboard + thumb flows both feel good |
| **M3** | Polish: copy pass on 8 projects + archive table, OG/SEO tags, a11y, 404, perf budget | 2–4 evenings | Lighthouse ≥ 95 mobile; shareable OG card |
| **M4** | QR rollout: final avatar asset (plain or art-QR per §10), on-device scan matrix (≥ 3 phones, glare/dim conditions), publish to GitHub + HF, README one-line tie-in, analytics | 2h + test days | ≥ 2 phones scan reliably at profile size |
| **M5** *(optional)* | Halftone-fidelity QR art, skill graph, terminal easter egg, AI concierge (needs external proxy) | stretch | Only after M4 proven |

---

## 8. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| QR fails to scan on some phones/lighting | Medium | ECC-H + pure B/W + short URL; **test matrix on real phones before rollout**; keep photo avatar as fallback; site link also in README/bio |
| Circular crop clips quiet zone | Low (PoC passes) | QR ≤ 62% of canvas; regenerate + re-test if designing artful variant |
| Scanned visitors bounce (mobile-first neglected) | Medium | Phone-first design; no hover-only UX; instant content; test on throttled 3G |
| GitHub API rate limits | Low | Build-time enrichment only |
| Avatar reads as "spam/placeholder" to some | Low | Pair with README mention; distinctive geometry; site delivers |
| Scope creep (3D/games/themes/AI) | High | v1 frozen: 2 interactions, no frameworks if Option A; M5 is a reward, not a right |
| URL changes later → QR dead | Low | Regenerating avatar is cheap; or encode via redirect service |

---

## 9. Open questions (need your call)

1. **Vibe:** editorial + command palette (recommended) / full terminal / IDE / OS-desktop / 3D?
2. **URL:** custom domain (smaller QR, more pixels/module) or `USER.github.io`?
3. **Stack:** zero-build vanilla (Option A) or Vite + React + TS (Option B)?
4. **Flagships:** which 6–8 projects from your ~28 get the featured treatment? (I saw: autogrid, bonsai2-ternary-forensics, decision-lab, deepseek-harness, FreeToken, hive-ops, hivebench, jev-head, llama-stock, lsfg-*, prism-*, rco, scion, scrollpeak, splinter-memory, strata-*, taleengine, ternary-serve.)
5. **Green light for M1?** I can scaffold the repo, the projects.json schema (pre-filled from your folders), the avatar generator script, and the deploy workflow.

---

## 10. Addendum — Artistic QR avatars (proven ✅)

The avatar doesn't have to be a generic QR. Three tiers of "influenced" QR:

1. **Styled QR** — rounded modules, custom eye shapes, brand color, center logo
   (`qr-code-styling` library; e.g. [ohno/github-qr](https://github.com/ohno/github-qr)).
   Low risk, moderate payoff.
2. **Image-modulated QR (QArt algorithm)** — the module pattern itself paints a
   face/animal, using ECC-H's error budget as "ink". Precedent:
   [qrface](https://qrface.bisks.net/) (portrait avatars),
   [kciter/qArt.js](https://github.com/kciter/qArt.js),
   [7sDream/pyqart](https://github.com/7sDream/pyqart). **Implemented + tested here.**
3. **Halftone QR** (Chu et al., SIGGRAPH Asia 2013) — highest fidelity (grayscale
   halftone sub-modules). More implementation work; reserve for M5.

### What was built

- `qr-avatar-poc/art/make_art_avatars.py` — full pipeline: target image + URL
  (+ version / mask knobs) → centered avatar (quiet zone, circle-safe sizing) →
  simulated platform renders → **automated zxing-cpp decode stress matrix** → JSON report.
- `qr-avatar-poc/art/target_cat.png` — hand-drawn demo target (cat face, bold shapes).

### Anatomy learned

- Finder patterns are **free facial features** — in the cat design they read as the eyes;
  timing/alignment/format modules are locked, art lives in data+EC modules.
- **Mask (0–7) is a free aesthetic knob** — all 8 decode; masks 2/6 cluster features best.
- **Version is a fidelity/robustness dial**: v3 (29 modules) = chunky doodle look with
  max scan margin; v4/v5 = more detail, denser (v5 borderline at 260px). Start v3.
- Bold shapes only (ears, eyes, nose, mouth) — thin lines die at module resolution.

### Stress-test results (art-QR v3, mask 2 and 6 vs plain baseline)

| Render | plain | art m2 | art m6 |
|---|---|---|---|
| 1024 / 460 / 260 / 130 px (square + circle) | ✅ | ✅ | ✅ |
| 260px + Gaussian blur 0.8 / 1.2 | ✅ | ✅ | ✅ |
| 260px + JPEG q50 | ✅ | ✅ | ✅ |
| 40px (feed size) | ❌ (by design) | ❌ (by design) | ❌ (by design) |

Art version is **as robust as plain** in this harness (all ≥130px pass). 40px stays
unreadable — the intrigue effect is preserved either way.

### Caveats

- pyqart appends `#` to the payload (`https://you.dev#`) — harmless, opens the same page.
- At 29 modules the result is *semi-abstract* — clearly "a face/creature" at a glance,
  not a photographic portrait. For a recognizable *portrait of you*, supply a
  high-contrast cropped photo (qrface-style) + possibly v4; we tune and re-test.
- zxing ≠ every consumer scanner: real-phone matrix (M4) still mandatory.

### Decision this unlocks

**Avatar = plain QR or art-QR.** If art: pick *animal-designed* (we hand-tune the
target at module resolution) or *your portrait* (photo → pipeline). Photo avatar
stays as fallback asset for rollback either way.

---

## 11. PixelQR — the app (built + validated ✅)

The art-QR pipeline evolved into a small **browser app**: draw pixel art → get a
real, scannable QR code where the art *is* the code. It has a dual role:

1. **Internal tool** — design the actual portfolio avatar interactively, iterate
   on presets/masks, export the avatar set.
2. **Portfolio interactive** — ship the same app on the site as a playable
   exhibit: visitors paint, watch a QR appear, verify it scans, download an
   avatar. The tool demonstrates the exact trick the owner's avatar uses.

### Where it lives

`pixelqr/` (workspace root, deliberately standalone — zero build step, no server,
no CDN; vendored MIT/Apache deps). Open `index.html` or serve the folder.

### Engine (what makes it work)

- **RS-aware codeword sacrifice** — QR error-correction level H gives each RS
  block a budget of *t* correctable codeword errors. The engine groups art
  conflicts per codeword and sacrifices whole codewords (up to 8 art modules
  each) ranked by visual benefit → dramatically more art than naive per-bit
  flipping (naive: collapses at ~50 flips; this engine: ~115–174 flips verified).
- **Free art cells** — the 7 "remainder bits" (v2–6) carry no data; always painted.
- **Locked structure** — finders/timing/alignment/format never painted; they
  double as free facial features (finder = eye).
- **Decoder-verified, live** — after every edit, the code is decoded in-browser
  with jsQR twice: crisp, and shrunk + blurred (stand-in for scanning at
  distance). If it fails, the budget auto-trims until it passes; the badge shows
  the state. `strength` slider = share of the safety budget to spend (default 100%,
  margin validated by the stress tests in §10 + double-blur checks here).
- **Auto mask** — tries all 8 masks, picks the one whose base pattern matches the
  art best; manual + shuffle overrides available.

### Validation performed

- `test/verify.js` (node): **structural roundtrip** — extract bits from the
  rendered QR and re-parse the URL — bit-exact on **v2/v3/v4 × all 8 masks**
  (proves placement walk, mask formulas, function-mask geometry, RS block
  mapping). Tolerance sweep + template matrix (all verified).
- Live browser run (real Chromium): cat preset v3 = **115 flips verified**
  (clean 296px + blurred 148px), v4 = **174 flips verified**; strength 60% = 67
  flips; URL-too-long error path shows a clean message; SVG export OK.
- Human test: user immediately started drawing in the opened tab. ✅

### Files

- `index.html` / `style.css` / `app.js` — the app (editor, live preview, badges,
  PNG/SVG/avatar-1024/avatar-preview export).
- `core.js` — DOM-free engine (node-requirable): build, function mask, placement
  walk, RS plan, rank/group/sacrifice, auto-tune, verify, self-test, SVG.
- `lib/qrcode.js` — Kazuhiko Arase's qrcode-generator (MIT), patched in two
  places: `make(forcedMask)` + `QRRSBlock` export.
- `lib/jsQR.js` — jsQR (Apache-2.0) — the in-browser decoder used for validation.
- `test/verify.js` — the node verification suite (`node test/verify.js`).

### Integration plan (portfolio site)

- M5 exhibit: embed as its own page (`/play/`) via iframe or copy the folder into
  the site repo; slight theme pass to match the site. No external requests at
  runtime → works offline + on GitHub Pages.
- Also serves the M4 avatar task: export Avatar 1024 / preview PNGs directly.

### Nice-to-haves (not blocking)

Portrait mode (photo → threshold/dither → auto-tune), permalink/share of art,
stronger in-app verification via zxing-wasm, animations on load, TS port.

---

## Appendix — asset inventory

```
qr-portfolio-scope/
├─ PORTFOLIO_SCOPE.md            # this doc
└─ qr-avatar-poc/
   ├─ make_poc.py                # regenerable PoC (swap URLs, tune size)
   ├─ overview.png               # contact sheet: 260px circle + 40px feed size
   ├─ avatar_A_githubio_1024.png # placeholder github.io variant, full res
   ├─ avatar_B_short_1024.png    # placeholder short-domain variant, full res
   ├─ display_*_260_circle.png   # simulated GitHub profile rendering
   ├─ display_*_130_circle.png   # small-profile rendering
   ├─ display_*_40_circle.png    # feed/nav rendering (intentionally unreadable)
   └─ art/                       # artistic QR pipeline (see §10)
      ├─ make_art_avatars.py     # target image + URL -> avatar set + stress report
      ├─ probe_art.py            # pyqart experiments (cat/face targets)
      ├─ target_cat.png          # demo target drawing
      ├─ final_sheet.png         # plain vs cat m2 vs cat m6 at display sizes
      ├─ sheet_masks_v3.png      # all 8 mask variants
      ├─ art_cat_v3m2_*  / art_cat_v3m6_*  / plain_baseline_*
      │                          # avatar renders (1024/460/260/130/40) + *_report.json
      └─ cat_*.png / face_*.png  # exploration renders
```

```
pixelqr/                          # §11 — the app (standalone, embeddable)
├─ index.html                     # UI markup
├─ style.css                      # dark theme
├─ app.js                         # editor, live preview, badges, exports
├─ core.js                        # engine: RS-aware codeword sacrifice, auto-tune, verify
├─ lib/
│  ├─ qrcode.js                   # qrcode-generator (MIT), patched: forced mask + RS table
│  └─ jsQR.js                     # jsQR (Apache-2.0) — live in-browser decoder
├─ test/
│  ├─ verify.js                   # node suite: structural roundtrip, tolerance, templates
│  ├─ art_preview_v3.png          # early render check (96-flip era)
│  └─ art_preview_full.png        # full-budget check vs pyqart reference
├─ README.md
└─ (serve locally: python3 -m http.server, open in browser)
```

## Build status — handoff (2026-10-16)

**Live structure**

- `sky-is-green.github.io/` — the site. Zero-build vanilla: `index.html`,
  `styles.css`, `app.js`, `data/profile.json`, `data/projects.json`.
- Theme: retro/low-bit — phosphor green on near-black, self-hosted VT323 +
  Silkscreen, CRT scanlines with a `crt` toggle, numbered DOS menu (`1`–`4`
  keys travel the page).
- Hero avatar: a pixel-art QR (v4, cat preset, dots style) that scans to the
  site — the hero shows `assets/qr/hero-qr.png`, rendered full-bleed so the code
  fills its frame, from the same code as the profile avatars
  (`avatar-1024.png`), generated with the PixelQR engine
  (zero residual, zxing-verified). Generators: `assets/qr/make-hero-qr.js` +
  `make-hero-qr.py`.
- Work section: a Pip-Boy-style vertical drum — entries sit on a perspective
  cylinder (each gets `360°/N` of it), native scroll (wheel / touch /
  mouse-drag) rotates it, the wrap is invisible (one full turn per edge), and
  every action lands pixel-exact on a slot.

**Tumbler experiments — keep/reject record**

- KEPT: tight ring + strong perspective (`SPACING = 330`, `PERSP = 1900`) —
  the cylindrical slide that defines the look; exact-slot rAF animator with a
  hidden-tab fallback (commit `c7dbe31`).
- REJECTED: forcing uniform slot heights (`882bb78`) and orthographic
  projection (`3c87878`, no CSS perspective) — orthographic kills the
  cylinder feel entirely. Both reverted in `ef00df2` / `b964b8f`.
- KEPT (this session): **CRT card faces + fixed bezel + exit compensation**
  (`?drum=both`, now the default). Each card renders as a CRT face (rounded
  glass, centre-bright phosphor gradient, top sheen, edge vignette). The
  cylinder is untouched — `SPACING = 330`, `PERSP = 1900` — and a per-card
  `scaleX(k)` shrinks only the leading edge of tilted cards so it lands exactly
  on the front card's edges (measured flush at x = 81 / 850.6; `k` clamped ≤ 1
  so past ~40° cards keep their natural perspective taper). A fixed opaque
  bezel is pinned to the front slot, its opening cut to the front card's box
  and feathered by a soft vignette so the edges glow out like a CRT. The
  alternatives stay switchable via `?drum=` — `frame` (bezel only), `flush`
  (compensation only), `none` (raw). Frame-alone has smaller in-opening wedges;
  "both" was chosen for the softer CRT edges.
- KEPT (this session): **the drum is now a detented roll, not a free-scrolling
  box.** Reason: `STEP = 360` virtual px per slot vs a ~100 px wheel notch meant
  one notch was `round(0.28)` → the drum nudged 100 px, waited out a 150 ms
  settle debounce, then took ~275 ms to spring *back to the same card*. It
  never advanced on a single notch, which is what read as "laggy, not tactile".
  Changes: (1) **wheel is handled explicitly** (`preventDefault` + accumulated
  detents, unit measured from the first event of the gesture), so one notch —
  or one 48 px of trackpad — advances exactly one slot, in every `deltaMode`;
  (2) **one target-driven roll loop** replaced `animateTo` + the settle timer;
  it eases `scrollTop` toward a slot target with a frame-rate-independent
  exponential (`ROLL_TAU = 42` ms), moving ~⅓ of the gap on the first frame so
  input and motion look simultaneous, with no ease-in ramp; (3) arrow keys,
  ticks, wheel detents and drag-release all feed the same loop, so repeated
  input *chains* (targets accumulate; the next notch is measured from the
  target, not the mid-flight position); (4) a `sameTurn()` pick keeps jumps in
  the same turn as the current position (`8 → 9 → 1`, never `8 → 1` backwards);
  (5) the wrap teleport now **carries the roll target with it**, so crossing the
  seam mid-roll no longer lurches (verified `9 → 1 → 2 → 3` monotonic);
  (6) the loop eases against its **own float position** — `scrollTop` reads back
  as an integer, and easing against the read-back value stalled 1 px short and
  spun the rAF forever (`rolling: true, top: 3239, target: 3240`); (7) drag is
  untouched (still 1:1 with the pointer) and just snaps to the nearest slot
  100 ms after release; reduced-motion still jumps instantly. Measured on a
  ~150 Hz display: one notch = 1 slot, motion settles in ~150 ms (was ~425 ms
  round-trip to nowhere); 5 rapid notches advance 5 slots across the seam.
  `ROLL_TAU` is the feel knob — lower is snappier.
**The band is parked — the Work section is the tumbler**

- KEPT (this session): **edge to edge on the tumbler.** The cards now butt
  against each other instead of floating with a slice of background between
  them, while staying distinct CRT cards on the drum (face treatment, bezel,
  flush alignment, detented roll all intact). Two things were involved:
  - **It is a height problem, not a spacing problem.** A face of height `h` only
    meets its neighbour when `h = 2·R·tan(π/N)` for the radius it rides on, so
    the height is the input and the ring follows. `FACE_H = 352` (3D px) puts
    `N = 9` at `R = 483` / spacing `331` — within 0.2% of the 330 ring that was
    tuned by eye, so the look is unchanged and the ring matches every filter
    count (the radius is re-derived per `N`; `N < 3` falls back to a 3-face
    radius because there is no polygon to tile). Verified: the front card's top
    edge and the neighbour's near edge coincide to **0.05 px at identical
    depth** (z = 483.6 both) — an exact tessellation.
  - **`scale(SC)` had to move inside the rotation.** Applied outside `rotateX`
    it squashed the card in y while the card's depth still came from the
    unscaled y — not a plane on the cylinder at all, so it could not tile and
    overlapped its neighbours by 113 px. Inside, it is a smaller rigid card
    tangent to the drum, which tiles exactly. A useful side effect: with a
    correct tangent polygon every face's near edge sits at depth `R`, so the
    flush compensation is satisfied by construction (k = 1 at 0° and 40°) and
    the silhouette stays straight.
  - Because the faces now share edges, three things had to change together:
    the per-card face is **symmetric top to bottom** (the sheen moved to the
    centre, the bottom-only inset and the outer drop shadow are gone, or they
    drew a band across the seam); the **opacity ramp is gone** (a faded
    neighbour is a darkened seam — cards are either on screen and opaque or
    culled by geometry); and the drum's **top/bottom mask is gone** (it would
    dim exactly the seam it was hiding). The card is also 44 px wider than the
    stage so its rounded corners and border sides fall outside the screen
    rather than notching each join.
  - Also removed `measureHeights()`: the card height is fixed now, so the
    per-card `offsetHeight` reads were dead weight (and would have read 0 for
    any culled card).
- KEPT (this session): **standby faces, generated-on-view records, and the CRT
  silhouette are on the tumbler too** (the band keeps its own copies).
  - **Standby:** any move puts the drum back to title plates — every card shows
    only its number and title, with a bar strip at the foot. When the roll
    settles, the card it landed on *wakes*: it fades into its full record and
    writes it in at the card's advertised rate (`tok_s` in
    `data/projects.json` × 4 chars/token, so the number on screen *is* the
    on-screen speed). Moving again puts it straight back to standby, which
    makes rolling a roll of title plates and settling a generation.
  - The title sits at the **top** of the face, not vertically centred: the only
    part of a neighbour visible while rolling is its first/last ~44 px, so a
    centred title would never be glimpsed coming in, and the foot strip gives
    the outgoing edge something to show. Tags and links reveal whole (an
    unrevealed row would stream out as empty chip outlines) and are hidden —
    keeping their space — until their turn.
  - **Silhouette:** each card's top and bottom edges bow outward (an
    `clip-path` path generated per card size, since `path()` does not scale with
    the element). Every card uses the same curve, so adjacent edges follow the
    same arc and overlap slightly instead of parting in the middle; a true
    per-pixel barrel warp stays rejected (24 ms p95 — see above).
  - **Glass:** the specular sweep and the elliptical corner falloff are
    screen-space (`.tum-glass`), not per card, so they don't move when the drum
    does and can't disturb the shared edges.
- KEPT (this session): **set-back standby panels, a decode effect, and magnetic
  interference.**
  - **Narrower unviewed cards.** A card that is not the one in front draws
    narrower (`--narrow: 0.88`, i.e. 766px projected → 674px on the neighbours),
    so the drum reads as a lit panel between two set-back ones. The surface had
    to become its own layer (`.face`) to do this: narrowing the card would
    squash its text, and narrowing the *card* would reflow it during the wake.
    With a separate layer, only the panel narrows and it transitions in 170ms
    while the text is untouched. `0.88` is the knob.
  - **Shadows**, in two places: the panel's sides fade into shadow (a horizontal
    gradient on `.face::after`) so it curves away like a tube, and matching
    symmetric inner shadows at the top and bottom of every face put a groove at
    each seam — which is also a reminder that the faces are still stacked.
  - **Decode.** An un-decoded record is not blank, it is *noise*: what has not
    been revealed yet shows as random hex of the same length, whitespace
    preserved, so the record reads as a fragmented store being sorted rather
    than text appearing from nothing. The body repaints on the reveal's pace and
    at least every 30ms so the glyphs churn. Cost measured: none — p50/p95 6.1ms
    with the decode running.
  - **Magnetic interference.** Rarely (every 9–23s) the whole picture is yanked
    to the right and sheared for ~240ms (`tum-interfere` on the drum) and the
    glass flashes, with a tear fired at the same moment so the two read as one
    event. Keyframes rather than a transition so it can retrigger at any point
    and still recover cleanly. It is deliberately the one place the CRT and
    Fallout vocabularies are mixed rather than picked between.
  - **The scan roll jumps.** It still drifts on its CSS loop, but now and then
    (every 5–14s) it loses sync and snaps to a random point on the screen, and
    every corruption makes it jump twice more in quick succession — the signal
    failing to hold. Rather than a second set of keyframes, the jump restarts
    the *existing* animation at a random point in its own cycle via a negative
    `animation-delay`, so there is only one thing to keep in sync. A jump at
    this opacity is easy to miss, so the roll flares (`filter: brightness`) for
    130ms as it lands. Gotcha: `animation` is a *shorthand* and includes
    `animation-delay`, so `style.animation = ''` wipes the very offset being set
    — it has to be `animationName` on both sides. Cost while drifting, jumping
    and corrupting: p50 6.1ms over 1487 frames.
  - Gotcha worth remembering: `.face` is absolutely positioned, so it painted
    *over* the record — a positioned layer paints after non-positioned content
    whatever the tree order says. Only the `position: relative` list items showed
    through, which is what gave it away. `.slide-inner` is now `position:
    relative` too.
- NOTE: the band and the tumbler now share these ideas, but they are
  separate code on separate branches. If one is changed, decide deliberately
  whether the other should follow — the band's copies assume faces that tile
  into a single surface, so they will not port over unchanged.
- KEPT (this session): **the screen effect is a module, and there is a games
  page.** `screen.js` mounts the monitor (frame, glass, signal) on any box and
  owns the behaviour: tears, the drifting/jumping scan roll, and the magnetic
  interference. The interference runs through *every* mounted screen at once —
  one supply sagging — which is what makes a page of screens read as one room,
  and it is exposed as `Screen.corrupt()` so a game can trigger it on death.
  `Screen.decode()` (the noise reveal) is shared too: the project records use it
  and so do the cabinet titles. The main page's drum mounts one screen; the
  games page mounts three.
  - The drum's chrome is now `.scr-*` rather than `.tum-*`, and the frame is
    inset (`--frame-inset` + `--bezel`) instead of being sized from a
    hand-computed screen box. Two things had to move with it: `.scr` declares
    `--frame-inset: 0px` on the same element the tumbler sets it on, so the
    tumbler passes it as a mount option (inline wins) rather than in CSS; and
    `--card-w` was computed once at build, when fallback fonts make the side
    column wider, so it no longer matched after the webfonts landed — the sizing
    is now one re-runnable `sizeDrum()` called from build, `fonts.ready` and
    resize.
- KEPT (this session): **`/games/`** — two cabinets (Snake, Breakout) and
  PixelQR embedded on the same glass. Each game draws into a 320×200 canvas that
  CSS scales with `image-rendering: pixelated`, so the dots are real pixels; the
  canvas is sized to exactly the frame's opening. A cabinet shows a standby
  plate (same language as the drum's) until started, Enter/tap starts it, dying
  triggers a corruption, and `window.Cade.start('snake'|'breakout')` drives it
  from the console. `?fx=off` and reduced-motion still remove all of it.
- KEPT (this session): **PixelQR wears the site's glass when it is framed by the
  site** — it detects being embedded (or `?crt=1`) and swaps its palette and
  faces for the house ones, hiding its own tagline since the site frames it.
  Standing alone it keeps its neutral dark look, so the project stays its own
  thing. Framed, its header becomes a slim identity strip: the wordmark sits in
  the top-left of the frame and links to the repo (new tab — a plain link would
  navigate the frame and trap the visitor inside it). Hiding the header outright
  had taken the app's name with it. The two OFL webfonts are vendored into PixelQR so the theme needs no
  cross-origin font request.
- KEPT (this session): **the games are a side column and PixelQR owns the
  centre-right**, on a wider wrap (1200px) because the toy is an application,
  not a paragraph. Inside it, the editor and *Your QR* stay side by side: the
  app's own layout collapses at 880px, which the frame is always under, so the
  CRT theme holds two columns down to 400px. The frame then **sizes itself to
  the app** — it is same-origin, so `fitFrame()` reads
  `documentElement.scrollHeight` (on load and every 600ms, since the layout
  reflows when the column width changes) and sets the screen's height to it plus
  the two frame insets. A scrollbar inside a CRT bezel looks like a bug, and any
  guessed height is wrong at every other window size. The games page is now
  full-bleed: the cabinets are a rail at the screen's left edge (`x = 26`) and
  the toy is the stage, with an **empty third column the same width as the
  rail** — that is what centres the stage on the *screen* rather than letting
  the rail push it off to the right. Verified: toy centre 963 against a viewport
  centre of 968, overflow 0 on both axes, no page horizontal scrollbar, columns
  546px/656px.
  - The one scrollbar that survived was *horizontal*: the canvases are sized in
    JS to their backing store (a cell grid), which gave the panels an intrinsic
    pixel min-width (~800px against a 786px frame). They are clamped with
    `max-width: 100%` in the CRT theme, and `cellFromEvent()` was already
    scale-aware so pointer mapping still lands on the right cell.
- FIXED (this session): **the Breakout ball went through every brick.** The loop
  scaled velocity by the frame's `dt`, called `step()`, and then *restored the
  pre-step velocity* to keep it in per-frame units — which threw away every
  bounce, so the ball never turned. Simulated old vs new: the old code managed
  **0 bounces and 8 bricks destroyed in one pass**; the fix gives 2 bounces and
  1 brick. `step()` now takes `dt` and moves by it, so a bounce persists, and
  the frame's motion is split into ≤3px slices (`slices`) and the speed is
  capped at 3.2px/frame, or a fast ball can land past an 8px brick row without
  ever touching it.
- UNVERIFIED: the games' animation. The desktop window stopped rendering during
  this session (rAF paused, `browser.screenshot` refusing), so only the first
  frame — which is drawn synchronously at start for exactly this reason — and
  the state machine could be checked. The games need a look on a live window.
- KEPT (this session): **the card is sized to the screen, not to the stage.** It
  was projecting 45px wider than the frame's opening (clipping) and filling 89%
  of it (so the drum had almost nothing to show). Now it is sized so its
  projected box is *exactly* the opening — zero clipping, at every filter count
  — and it fills 80% of the screen's height, leaving ~53px of the neighbouring
  faces above and below. Those bands are the entire drum effect, so this is the
  number to move if the drum needs to read harder. `--tumh` and the frame are
  unchanged; the geometry is derived from the frame height, with a floor of
  399px projected (what the longest record needs) and a cap at the screen height
  so a card can never be taller than the screen it sits in. Side effect of the
  smaller faces: perf went from p95 12ms to a flat 6.1ms. The bezel is now a
  symmetric inset (`stage − 2·(FRAME+4)`) rather than being sized from the
  front card's projected width, which was circular once the card was sized from
  the opening. The record's line-height is 1.55 and there is a short-window
  media query that shrinks the type, since a shorter card cannot hold the same
  amount of text.

- **Status:** the faceted-band drum described in the entries below is *not* the
  Work section any more. It is preserved on branch **`band-secondscreen`**
  (tag `band-secondscreen-v1`, commit `a748133`) and is meant for a different
  use later. `main` has the Work drum back exactly as approved in `eef4e68`
  (CRT card faces + fixed bezel + flush compensation + the detented roll).
  The band's concept in one line: the entries become *faces of a prism* that
  tile into one unbroken curved surface — no card identity, no seams, one
  screen that rolls.
- **Lesson that carries over:** `SPACING` and the draw scale are what open the
  gap between cards. A face of height `h` only butts against its neighbour if it
  sits on a radius of `h / (2·tan(π/N))`, so edge-to-edge is a *height*
  problem, not a spacing problem. Parked-band code derives it forward
  (`h = q / (1 + q/(2·t·P))`); the tumbler just needs the height set to that
  tiling value.
- **Lesson that carries over:** a vertically asymmetric face treatment (a radial
  gradient centred above middle, a bottom-only inset shadow) draws a brightness
  step at the seam. Anything symmetric about the face's centre joins cleanly.
- The entries below are the band's keep/reject record, kept for when it is
  picked up again:

**Band keep/reject record (branch `band-secondscreen`)**

- PARKED: **the drum as one continuous faceted band, not a stack of plates.** Each entry is a *face of a prism*; the faces tile edge to
  edge, so there is no gap to see through and the surface reads as a single
  curved screen. That constraint is what drives the geometry, so it is derived
  rather than tuned: a face of height `h` only tiles if it sits on a radius of
  `h / (2·tan(π/N))`, therefore `h = q / (1 + q/(2·t·P))` where `q` is the
  projected height the front face should have (the frame less `NEIGHBOUR` px of
  the next face at each end). `SPACING` and the `scale(0.72)` draw scale are
  gone: `SPACING` fell out of the tiling, and the scale was what opened the gap.
  The **flush compensation was removed with them** — with the faces sharing
  edges there is no visible leading edge to align, and a per-face `scaleX` would
  have broken the seam it was invented for. Faces are `BLEED`× wider than the
  frame, so their left/right edges are never on screen and the band simply fills
  the glass. The frame is now **inset over the band** (its border *is* the
  bezel, its padding box is the visible screen) instead of wrapped around a
  sized opening, and the old `?drum=frame|flush|both|none` switch is replaced by
  `?drum=off` (band, no frame) + `?fx=off` (no signal).
- PARKED: **the CRT work moved to the glass.** Because the faces
  now share edges, anything that varies vertically *on a face* draws a seam
  clean across the screen — so the per-card gradients, borders and corners are
  gone (each face is flat with a 1px facet edge) and the falloff, curvature and
  signal live in screen-space overlays over the band (`.tum-glass`,
  `.tum-glitch`): scanlines, a slow signal roll, and a tear that flashes every
  few seconds. This is also just how a tube works — the glass does not move when
  the picture does.
- REJECTED (applies to both): **a true per-pixel barrel warp.** It needs an SVG
  `feDisplacementMap`, and a generated displacement map over the visible glass
  measured **p95 24 ms / worst 188 ms** per frame against a flat 6 ms without it
  — precisely the hitching we had just removed, so the curvature is carried by
  the geometry (the band visibly recedes) plus an elliptical glass falloff that
  pulls the corners in like a raster. A CSS-only curvature illusion was
  preferred over a correct warp we cannot afford.
- PARKED: **faces are title plates until the drum settles on one.**
  While rolling, every face shows only its number and title; the front face
  "wakes" ~170 ms after the roll stops and writes its record in at its own
  advertised rate. `tok_s` per project lives in `data/projects.json`; the
  displayed figure and the on-screen speed are the same number (`tok_s` × 4
  chars/token — measured 248 chars in 1.17 s against a displayed 52 tok/s). The
  reveal is character-level for prose but *atomic* for the tags and links rows,
  which otherwise stream out as empty chip outlines. The title sits at the top
  of the face, not vertically centred, because the only part of a neighbour you
  see while rolling is its first/last ~64 px — a centred title would never be
  glimpsed on the way in; each face also carries a standby bar at the foot so
  the outgoing edge is not blank.
- FIXED (applies to both): **a 2-project filter used to collapse the drum.** With
  `N < 3` there is no polygon to tile and the fallback radius (4× the face)
  exceeded the perspective distance, which inverts the projection — negative
  `--card-w`, zero-height stage, and `updateDrum` teleporting and returning
  before it painted, so the drum came back with no active face. The radius now
  falls back to a 3-face polygon, and the wrap teleport no longer returns early
  (it re-reads the position and renders, so a rebuild with no second scroll
  event still paints).
- PERF NOTE (applies to both): two things cost real frames in this change and both were fixed —
  the signal roll animated `top` (a relayout of a full-glass layer every frame)
  and now animates `transform`; and all nine faces were promoted layers even
  when off screen, so culled faces are now `display: none` (about five render).
  After the fixes: median 6.1 ms, p95 6.1, max 6.2 — level with before, with
  much larger faces and three new overlay layers.

**Pending**

- Enable GitHub Pages on both repos (Settings → Pages → Deploy from a
  branch → `main` / `(root)`) — the access token can't touch Pages settings.
- Avatar direction (cat vs portrait) for the GitHub / Hugging Face profile
  pictures; a custom-domain decision would change the QR payload.
- Featured-project split is provisional (see the selection table above).

**Testing notes (for the next session)**

- **Screenshots work now** (`browser.screenshot` → `files[].path`) — the window
  is visible. Earlier sessions had to reason about the drum blind and audit it
  numerically through `browser.evaluate`. Use the screenshot for anything visual;
  it is far cheaper than guessing. Crop/zoom with PIL if a detail matters.
- The site is audited in-page via `browser.evaluate`.
- Occluded/background tabs do NOT receive scroll events for off-screen
  scrollers — when testing the drum off-screen, set `scrollTop` and then
  dispatch a synthetic `new Event('scroll')` to drive the render.
- **`python3 -m http.server` will silently serve a stale `app.js`.** It sends
  `Last-Modified` but no `Cache-Control`, so the browser applies heuristic
  freshness (~10% of the file's age) and *won't revalidate* on a plain reload —
  `browser.reload` included. A whole round of measurements was taken against
  the previous revision this way (17 020 bytes cached vs 20 230 on disk) and the
  results were nonsense. Always confirm the revision actually running, e.g.
  `performance.getEntriesByType('resource')` → `app.js` `encodedBodySize`, or
  put a sentinel on `window` and read it back.
- Local previews: a **no-cache** static server is used instead — see
  `/tmp/opencode/nocache_server.py` (`python3 nocache_server.py <root> 8766`),
  which adds `Cache-Control: no-store`. Restart it after a machine reboot;
  if you fall back to `python3 -m http.server`, hard-reload (Ctrl+Shift+R) or
  the browser may keep the old bundle. The PixelQR app serves on 8765.
- Drive the drum's wheel by dispatching a `WheelEvent` directly on
  `#tum-frame` (input listeners live on the frame, not the viewport) rather
  than via an input-injection helper — the latter lands at the pointer's
  coordinates, which is only over the drum sometimes, and the failure mode is
  a silent no-op that looks like a bug in the code.

## Firefox: the drum was a blank gap (fixed)
- Symptom: in Firefox the whole work-section monitor painted nothing; the DOM
  was correct (9 cards, chrome mounted, decode running) but the drum's rect
  sat thousands of pixels above its section.
- Cause, verified via `getComputedStyle` + a `cssRules` walk in-page: the
  stage relied on `position: sticky`, but `Screen.mount` adds class `scr` to
  it and `.scr`'s later `position: relative` wins the cascade at equal
  specificity — sticky was dead, so the stage scrolled away with the
  scroller's content. The cull then hid every card (threshold reads
  `stage.clientHeight`, which had collapsed).
- Fix: the scroller and the monitor are now siblings inside `.tum-frame` —
  `.tum-viewport` only generates scroll input, `.tum-frame > .tum-stage`
  (higher specificity, beats `.scr`) pins the monitor over it, and the
  wheel/drag/click listeners moved from the viewport to the frame.
- Follow-up: as soon as the monitor stopped being the scroller's child, the
  clipping the scroller had been doing for free was gone — the rolling cards
  are on a cylinder and the far ones project far outside the frame, so they
  spilled over the about text and the vision section. `overflow: hidden` on
  the stage restores exactly the clipping the viewport used to provide
  (measured back at the known-good geometry: ~53px neighbour bands at the
  seams, card filling the opening). Worth re-checking in Chrome after any
  change to this pair — the bug appears in *both* engines, it was just found
  in Firefox.
- Incidentally confirmed in Firefox 158: `clip-path: path()` and
  `url(#clipPath)` both render; only `polygon()` with negative percentages is
  silently dropped (shape renders unclipped). The site's bow is a `path()`, so
  it was never the problem.

## Firefox: the drum's gutter sliver (fixed)
- Symptom: "there's still minor clipping" — the neighbouring faces read as cut
  by an invisible rectangle a few pixels outside the monitor.
- Cause: the stage's `overflow: hidden` clips at its *padding box*, which is
  the **frame's** box — 4px outside the opaque bezel. Measured with the chrome
  hidden and the page magenta (so the cards were the only thing painting), the
  cards filled rows 153–712, i.e. right out to the frame's edge: 653 columns of
  card paint in the top gutter (153–156) and 653 in the bottom one (709–712).
  That band is outside the bezel, so nothing opaque covers it, and it ends in a
  hard straight cut.
- Fix: clip the stage on the bezel's outline instead —
  `clip-path: inset(var(--frame-inset, 4px) round calc(var(--frame-radius, 15px) + 7px))`.
  Same 4px inset and same radius the bezel uses, so the cards run under the
  plastic and vanish behind the monitor's edge. Re-measured: 0 card columns in
  both gutters and 0 pixels outside the rounded clip region, corners included,
  and with `will-change: transform, opacity` back on `.slide` — so `clip-path`
  does hold the promoted layers (the earlier belief that Gecko composites them
  above *any* clip was wrong; `overflow` was simply clipping 4px too far out).
- The `inset: 4px` stage, `INSET = 0` and the `will-change` removal tried
  earlier were all reverted: geometry and the screen maths are as they were.
  One declaration in `styles.css`, no `app.js` change. `Screen.mount` adds the
  bezel in every `?drum=` mode, so the clip is always hidden by the plastic;
  the arcade cabinets mount the screen on the `.scr` box itself (inset 0), so
  they have no such gap and need nothing.
- Also ruled out: no card's record is clipped by `.slide-card { overflow:
  hidden }` — all 9 cards report `scrollHeight == clientHeight` (449px; one
  card 451 vs 449, a 2px decorative overflow with ~89px of slack below its last
  text line).

## Touch, and the arcade's toy
- The drum's wheel/drag listeners moved to `#tum-frame`, so dispatch
  `WheelEvent` there in tests. Touch still scrolls the drum natively: the
  stage is `pointer-events: none`, so a finger reaches the scroller under it.
- The games are controlled by touch now: `.scr[data-game="snake"|"breakout"]`
  carry `touch-action: none` (without it the browser claims the drag for
  scrolling and cancels the pointer before the handlers run), snake is steered
  by swipes over 20px (the origin resets after each turn, so one long drag
  keeps steering), breakout's paddle tracks the drag, and `setPointerCapture`
  keeps a drag steering when the finger wanders off the screen. The toy's
  screen is deliberately left `touch-action: auto` — it needs to scroll.
- Related fix: the breakout arrow keys were writing to `cab.px` while the
  paddle lives at `cab.state.px`, so the keyboard had never moved the paddle.
  Verified: `ArrowLeft` 138 → 120, `ArrowRight` back to 138.
- `cab.el` is the `.scr`, **not** the `<article class="cab">` — the same
  shape as `.scr.playing`. Anything that belongs to the cabinet (the foot
  text, the article's height) has to be reached with `cab.el.closest('.cab')`.
  A CSS rule written against `.cab.missing` silently never matched.
- PixelQR is a *project* page (`/pixelqr/`, its own repo), so it can be
  genuinely absent — as it is today: the path answers 404 until Pages is
  switched on for that repo. A frame that cannot load still fires `load` (on
  GitHub's 404 page), so the path is fetched first and the frame is only
  pointed at it once it answers; when it does not, the bezel shows an honest
  note with a link to the source instead of presenting a 404 as the app.
- `window.Cade.state(game)` exposes the live game state — the arcade is
  otherwise unassertable without reading canvas pixels.
- Firefox's `--screenshot` captures at the `load` event, which is *before*
  any post-load fetch resolves: anything built from fetched JSON is missing
  from the capture unless a deliberately slow resource holds `load` open
  (`/tmp/opencode/slow.py` answers a 1×1 gif after 5s). Same trick, plus a
  `setTimeout` report written into the DOM, is how the probes above were read.
- **Warning on that hold-open image: give it `position: fixed`.** Left inline,
  its line box (~22px at the default font) pushes the iframe down, so every
  in-page coordinate in the capture sits 22px below the rects the beacon
  reports. A whole session was spent hunting a "22px paint offset" that was
  this — `getBoundingClientRect` and the paint agreed all along. Before
  believing any rect-vs-paint discrepancy, check the probe's own layout.
- `/tmp/opencode` does not survive between sessions — the two helper servers
  (`nocache_server.py`, `slow.py`) have to be rewritten and restarted, and
  they must be started in the *same* shell invocation as the capture.

## The toy: served from this repo until its own Pages is on
- Pages is not enabled on the `pixelqr` repo, so `/pixelqr/` — the URL both the
  homepage link and the games-page embed use — had nothing to serve. Enabling
  it is not reachable from here: the REST call is refused
  (`403 Resource not accessible by personal access token`) with *both* the
  `gh` token and the one in `~/.git-credentials` (they are the same
  fine-grained PAT, whose permissions do not include Pages), and the browser
  has no signed-in GitHub session to click it with.
- So the toy is **mirrored into this repo** at `pixelqr/` — the same path the
  project site would publish to. `pixelqr/MIRROR.md` records the source commit
  and the refresh command; the editable copy, tests and history stay in the
  project repo.
- Verified end to end, local and served from this repo's root: `/pixelqr/`
  boots (2 canvases 529² and 492², no console errors, `scrollHeight` 1022) and
  the games page's `.scr[data-game=pixelqr]` gets `missing=false`, its fetch of
  `../../pixelqr/` returns 200, the frame mounts the app
  (`innerTitle` = "PixelQR — pixel art as a scannable QR code", inner height
  1054, cabinet fitted to 1129) and the "answered 404" fallback note stays
  hidden.
- **To undo:** enable Pages on `sky-is-green/pixelqr` (Settings → Pages →
  "Deploy from a branch" → `main` → `/ (root)`) — the project site then
  publishes to the same `/pixelqr/` path — and delete this repo's `pixelqr/`
  directory, so the project repo is the only source.

## The arcade's stage: a screen in use takes the middle
- Requested: play the games on the big screen, so *the screen that is in use
  swaps places with whatever is centred*. The stage is a **role, not a slot**:
  the toy holds it by default, and loses it to whichever screen you last used.
  Start a game and it becomes the middle cabinet while the toy drops into the
  empty right-hand rail — the third grid column, already reserved at the rail's
  width so the stage reads as centred on the screen, which is why the swap costs
  no layout.
- Two mechanisms, because they are two kinds of element. The **games** are
  canvases: a canvas keeps its bitmap when its node moves, so `stage()`
  reparents the `<article>` between `.cade-games` and `.cade` (back in its
  original order via `cab.rank`). The **toy** is an iframe: reparenting an
  iframe reloads it and the drawing would go with it, so it is never moved in
  the DOM at all — it is placed by CSS (`.cade.cade-swapped .cab-railed`), which
  is also the only mechanism that still behaves when the breakpoint moves under
  it.
- `cab.card` (`el.closest('.cab')`) is the `<article>`; `cab.el` is the `.scr`.
  The placement classes go on the article, because the article is the grid item.
  Moving `cab.el` threw `NotFoundError: insertBefore: child to insert before is
  not a child of this node` — the toy's `.scr` is not a child of `.cade`.
- The placement rules live inside `@media (min-width: 881px)`, so under the
  single-column breakpoint the classes do nothing, and `stage()` returns early
  there as well: with one column every screen is already full width, and moving
  the game that was just tapped below the rail would only reorder the stack
  under the finger that tapped it.
- The trigger is `start()`, so Enter, a tap and `Cade.start()` all swap. Never
  the end of a game: "last used wins" means a snake that just died stays on the
  stage for the tap that restarts it. The toy reclaims the stage by being
  *used* — a `pointerup` inside its own document (attached on the frame's
  `load`; same-origin, as the height fitting already relies on) or on the
  cabinet around it, so the screen is reachable even when the frame never
  loaded. Clicks on the foot's links are exempt, or "open it full size ↗" would
  drag the toy back mid-navigation.
- `fitFrame`'s fitted height belongs to the stage only: railing clears it
  (`cab.el.style.height = ''`) and a guard in `update()` stops it being
  re-applied, because a 1078px frame bursts a 256px column. A `resize` listener
  drops the stale height for the case where the breakpoint moves.
- `.cab-return` ("Click it to bring it back to the middle.") is in the toy's
  foot, shown only while railed: the one unobvious thing about the swap is that
  the small screen is the way back.
- Verified by probe against the real page (1600×1200 and 720×1400), reporting
  by beacon: default unchanged; after Enter `cade-swapped` is set, snake stages
  at 992×620 in column 2 with the toy railed at 256×160 in column 3 (8/5,
  inline height emptied, note shown); the toy's frame is the *same window* with
  its marker intact (**no reload**) and the snake canvas still has its pixels
  (`canvasLit` 183) after the move; a second game swaps in and the first returns
  to the rail in order; the foot link leaves the stage alone; a `pointerup`
  inside the toy restores it, the rail order and the fitted height. No page
  overflow, no console errors, homepage unchanged. Narrow: nothing staged,
  nothing reordered.

## The hero: the tagline, the socials, and what is boxed
- The tagline is the author's own sentence now — "Taking systems apart, analysing
  them, and rebuilding them smaller." — in place of "Low-bit systems — taken
  apart, understood, rebuilt smaller." It keeps the `-ise` spelling because it
  is copy rather than code (the prose around it is `-ize`: quantization).
- The hero links are the socials and nothing else: `data/profile.json` lists
  github and hugging face. That list also feeds the footer's contact line, so
  the PixelQR demo link is gone from there too — the demo is still linked from
  the avatar caption, its own work card and the games page.
- The skills block is inverted: the group is the boxed thing and the tags beside
  it are plain dim text (`--ink-dim`, no border). *retro* became *interests*.
  `.chip.static` is what marks the difference, so the work filters and the card
  tags stay boxed and clickable.
- Each group is a boxed label on its own line, with its tags underneath
  (`.skills .row` is a one-column grid, `justify-items: start`). An earlier
  version put the label in a fixed 76px column beside the tags so every row's
  tags began at the same x; stacking lets a long concept list begin at the
  block's own left edge instead. The tags still live in their own element
  (`div.tags`) so the ones that wrap hang under the first tag rather than under
  the box.
- Under 721px the whole block centres — label boxes and each wrapped tag line.
  The rule for that has to be written *after* the skills rules: the hero's own
  720px block is earlier in the file, and an equally specific later rule beats
  an earlier one, so putting it up there with the hero did nothing.
- The blinking `▮` lives on the prompt line (`> sky-is-green▮`) rather than
  after the footer's `EOF`: there is one cursor in the page and it belongs to
  the terminal prompt that opens it. Moving it is only moving the span — the
  footer keeps its `EOF` text.
- Under 721px the avatar stacks under the hero text and centres. The figure is
  centred as a whole, but its caption is wider than the 208px portrait and the
  portrait is a block, so it needs `margin-inline: auto` too or it sits left.
- The software tags are concepts drawn from the repos, not languages: Python,
  TypeScript and C++ came out. The list walks the accounts — scion, autogrid and
  bonsai2-ternary-forensics give *ternary models*, *MoE*, *quantization*,
  *model forensics*; Strata and the llama.cpp work give *inference engines* and
  *kernels*; hivebench and hive-ops give *evaluation* and *tests*;
  splinter-memory gives *memory* and *RAG*; decision-lab and hive-ops give
  *agents*; taleengine gives *procedural generation*; PixelQR gives *non-AI
  generative art*; scrollpeak gives *Firefox extensions*. Hardware gained
  circuitry design and breadboards, and robotics; interests gained 3D modelling
  and printing, animation, software and video games, science and technology, and
  history (kept as two tags rather than the one run-on "…and history").

## The about, and prose in the JSON
- The about copy is the author's own, in five paragraphs. Only clear slips were
  touched: "better then" → "than", the capital after the semicolon in paragraph
  two, "~2bits" → "~2 bits", and ***foresore*** → ***foresaw***. "yester-decade"
  and the `-ise` spellings (analysing, quantisation, theorise) stay as written:
  they are the author's, even though the rest of the site's copy is `-ize`.
- The prose in `data/*.json` goes through `prose()` in app.js — a small inline
  markdown subset (`**bold**`, `*italic*`, `***both***`, `[text](url)`) built as
  elements rather than assigned as HTML, so a stray angle bracket in someone's
  prose stays prose. It renders the about and the cards' hooks and bullets;
  titles and labels stay plain text.
- The about's links come in two kinds. **Concepts**: six Wikipedia pages checked
  to exist — Reverse engineering, Balanced ternary, QR code, 3D printing,
  Soldering, History of computing. **The author's own projects**: the three
  claims in paragraph two and the technique named in paragraph three point at the
  work they describe — `Strata` (the inference engine whose step-time drops by
  fusion), `bonsai2-ternary-forensics` (the 27B dense ternary forensics report),
  `pixelqr` (the QR code that turns into pixel art and still scans) and `scion`
  (ternary quantisation with trained corrections). Both kinds open in the same
  tab, the way the cards' repo and demo links do. The copy itself is untouched:
  words only ever changed for the slips listed above, and this change added links
  around them, nothing else.

## The hero, its spacing, and the page below it centring
- The hero is as tall as what is in it — `section`'s 34px padding, one grid with
  a `clamp(24px, 4vh, 44px)` gap between the title/portrait row and the tags.
  Everything in it is one block: the prompt, title and portrait, then the tag
  lists right under them. It was stretched to the first screen for a while
  (`min-height: calc(100svh - var(--hdr, 57px))`, with `--hdr` measured in
  `app.js` because the menu wraps and the header grows to 95px on a narrow
  window). That filled the screen with the tags a long way below the portrait and
  then left the rest of the screen empty before the dashed divider: measured at
  1300×1000, 156px above the block and 146px below it, against 34px anywhere
  else on the page. Removed, with `sizeHero()` and `--hdr` — the spacing only
  reads as one page if the hero obeys it too. Measured now, at 1300×1000,
  1600×1200 and 700×1400: 34px from the header to the block, 40–44px from the
  block to the tags, 34px from the tags to the divider, 34px from the divider to
  `[ about ]` — and the divider is on the first screen. Page 3094 → 2860 tall.
- The skills moved out of the row the portrait lives in — with them inside it the
  row grew to ~500px and the portrait centred on *that* rather than on the title.
  Measured: the title and portrait centres sit within 4px of each other at
  1300px.
- The portrait scales with the viewport (`clamp(208px, 24vw, 320px)`) and the
  skills row spans the whole column (856px, was 470px), both from when the hero
  had to fill a screen; the wider skills row is what keeps the tags from stacking
  into a column of one-word lines.
- From `#about` down the page reads centred — headings, prose, filters, footer —
  and it is scoped by id on purpose: the games page uses the same stylesheet and
  the same footer element but none of these ids, so it keeps its own chrome.
  One exception: what is *inside* a card stays left, because a record's bullets
  are marked with absolutely positioned glyphs and a centred line leaves those
  stranded at the card's edge. That is the drum's records (`.tumbler`) and the
  open-projects carousel's (`.caro`) alike.
- The about's measure is 86ch (≈851px — all of the 856px column the wrap
  leaves), in a centred block, so each line runs as long as the layout allows
  and the page is as short as the text makes it. Page height 3217 → 3094 at
  1300×1000. (The same 86ch came and went once: that first "it isn't wider" was
  about the QR, not the prose.)
- The skills tags are separated by a dash (`:not(:last-child)::after`) instead
  of a bare gap, and never break inside themselves, so a dash cannot end up
  opening a line on its own. The whole block is centred at every width — label
  above its tags, `justify-items: center` on the row, `justify-content: center`
  on the tags — so it lines up with the centred page rather than only centring
  under 721px. Measured: at 1300px and 700px every label and tag row shares the
  block's centre line.

## The hero QR fills its frame
- The avatar was generated for a circular crop (GitHub, Hugging Face): the code
  plus its quiet zone drawn at 58% of a 1024px canvas, so the crop never bites.
  In the hero that same margin is just white — the code looked small inside a
  square frame. `assets/qr/hero-qr.png` is the same code (v4, cat preset, dots
  style, mask 7, same 120 flips, decoding to `https://sky-is-green.github.io#`)
  drawn full-bleed: a 4-module quiet zone and nothing else, 820×820. The code
  now fills 80% of the file against 58%, and it survives a resample to 90px —
  the old render failed at 90 (both decode cleanly at 120 and above).
- The module grid is rendered at an integer 20px per module so nothing is
  scaled: pixel-drawn modules soften the moment they are resized.
- The platform avatars stay as they were, and the generator now lives beside the
  assets: `make-hero-qr.js` writes raw RGBA, `make-hero-qr.py` makes the PNG.
  Neither repo's engine changed — this is a render of the same code.
- The caption's PixelQR link points into this site, not out: `games/#cab-pixelqr`,
  the games page with the toy on the stage. From there the app's own top-left
  links to the repository (new tab) and the card's foot opens the full-size copy
  at `/pixelqr/` — so the repository is one hop further on, not the first hop.

## PixelQR's default version
- `state.version` is 6 and the initial art frame is `n()` = 41 — the biggest
  canvas, the most room to draw — and the version select's `selected` option
  matches so the control and the state agree on load. Presets only ever bump the
  version up, so they land on v6 as well; the cat draws 23×23 cells in it. The
  mirror here was refreshed to commit `942e8c6` and `pixelqr/MIRROR.md` updated.

## The record fits its face
- A work card is a fixed-height face, so a record too long for it was simply
  clipped. On a phone that was Scion: 141px past the bottom at 390×844, most of
  the third bullet and the links gone. Three of nine cards overflowed at 390px
  and four at 320px.
- Rather than rewrite the copy, the record scales: `fitRecords()` measures the
  record against the face and sets `--rec` on the card, and every size and
  vertical margin in the record (title, hook, bullets, tags' margin, links' gap,
  and the head row) is multiplied by it. A binary search takes the largest
  scale that fits, so nothing is shrunk more than it has to be. The floor is
  0.7 — at that point the type stops being readable, and what is still too long
  loses bullets off the end rather than being cut mid-line.
- The head row scales too, and the tok/s readout is written at build time
  instead of on waking. Both were needed: the badge and the readout share a
  244px face with the number, and at full size they wrapped onto a second line
  the moment a card woke — 16px the fit had not accounted for, so every fit
  came out a line short.
- Measured after: at 390×844 Scion fits at 0.775 (hook 11.6px, bullets 10.5px,
  all three bullets); at 430×932 at 0.85; at 320×568 at 0.737 with one bullet.
  At 1366×768 nothing shrinks — `--rec` stays 1 and the desktop card is
  unchanged. The old `@media (max-height: 780px)` type shrink is gone; the
  measured fit does that job, and only when a record actually needs it.

## The drum is centred — and the rail moves under it on a phone
- The drum's row is `pad · frame · rail`, and the rail is a flex item of its
  own, so the frame was only centred by accident: at 1300px it sat half a rail
  and its gap (29px) left of the line every other centred thing on the page sits
  on (ticks, count, filters, hero, about). `.tum-pad` is an empty div that
  mirrors the rail — `sizeDrum()` measures `.tum-side` and sets `--rail`, *before*
  anything else is measured, because the pad changes the frame's width and every
  number below it is derived from that width. Frame, card and ticks now share the
  section's centre line: measured offset 0 at 1300, 900, 880, 640, 560, 430, 390
  and 320.
- The pad costs the frame a rail's width and a gap (58.4px), and a phone does not
  have it to spare. At 390×844 the screen came out 229×523 — `screenW` 200px,
  the floor `sizeDrum()` clamps to — with a 216px-wide card, four of the nine
  records pinned to the 0.7 floor and Scion down to two of its three bullets.
- So at or under 880px — the site's existing narrow breakpoint, the one the
  games grid uses — the rail moves *under* the frame instead of beside it:
  `.tumbler` wraps, `.tum-pad` is `display: none` (the frame *is* the column, so
  it is centred without one) and `.tum-side` becomes a centred row of the same
  two buttons. Above the breakpoint nothing changes. The jump at the boundary is
  the pad and the rail themselves and nothing else: frame 804px at 880 against
  687.2px at 881.
- Measured after, 390×844: frame 346 (screen 314), card 338 wide, Scion 0.85 with
  all three bullets, Bonsai and Strata 0.963, PixelQR 0.888, the other five at 1.
  At 430×932: frame 383.6, only Scion off 1 (0.888). At 320×568: frame 276
  (screen 244), Scion 0.7 with all three bullets, where it used to fit one. At
  1300×1000 nothing moved: frame 739.2 and `--rec: 1` on all nine cards, page
  height 2860. At 390 the button row costs 47px of page height (4176 → 4223).
  Both buttons still drive the drum behind the breakpoint (`#tum-down` →
  "project 2 / 9", `#tum-up` → the front card again), no horizontal overflow at
  any width, no console errors.

## Open projects: the drum's cards, slid sideways
- The `[ vision ]` section is now `[ open projects ]`, and the terminal box
  (`.terminal`, `.vision-*`) is gone with it: the kernel-OS paragraph is an open
  project like any other, so it became the first card rather than a section of
  its own. The id is `#open` (menu item 3, the games page's copy of it, and
  `screen.js`'s numbered-key map all follow), and the kernel-OS copy moved out of
  `profile.json`'s `vision` object into `data/open.json`. One content rule from
  the work list carries over: a card is the author's copy, so nothing was
  invented — the section ships with that one card until the rest of the list
  arrives, and the `vision` object stays in `profile.json` (unrendered) so
  nothing is lost if it does not become a card after all.
- **One card builder, two sections.** `slideCard(p, num, opts)` serves the drum
  and the carousel: a work card carries the `tok/s` readout and filterable tag
  chips (`opts.onTag`), an open card carries a `status` badge where a fork-work
  card shows its commit count and plain chips; the readout is `opts.rate: false`.
  A card's `repo` is now optional — an open project usually has nothing to point
  at, and a title is a heading whether or not it is a link.
- **The motion is the browser's.** `.caro-track` is a scroll-snap track
  (`x mandatory`, one card centred), which buys touch swipes and trackpad
  gestures for nothing; a mouse has no swipe, so the drum's drag comes back
  sideways, with `.dragging` turning snapping off for the length of the gesture
  and `caroGoTo(caroIndex())` clicking the strip into place on release. The
  buttons, the ticks and the left/right arrows all just scroll to a card; the
  arrows need `preventDefault()` because a focused scroll box natively moves
  ~40px, and a carousel should move a card.
- **The peek is three numbers doing one job.** `--peek` is how much of a
  neighbour shows. Each slide carries half the gap as padding and the track
  carries a spacer of `calc((100% - var(--caro-w) - var(--gap)) / 2)` at either
  end, so the first and last cards centre exactly like the ones between them
  (the spacer comes out as peek less the half-gap). The track is inset by the
  bezel's own width — its 4px inset plus its 12px border — so no card is ever
  covered by the plastic, and a sliver is cut at the screen's opening rather than
  in the 4px gutter the drum's clip-path exists to hide.
- **A strip is not a cylinder, so two of the drum's card tricks are switched
  off inside `.caro`:** `.slide-card { --narrow: 1 }` (a neighbour is not a
  set-back panel here) and a half-strength side gradient over a surface whose
  outer stops are lighter (`#0e170e` against the drum's `#080c07`). The reason is
  measured, not aesthetic: a sliver is all edge and no middle, and at the drum's
  values the outer 5% of a panel is the same near-black as the gap beside it, so
  the peek read as a pair of dark bands. With the lighter edge the sliver reads
  as a panel — at 1300 the neighbour's visible 38.5px is clearly a card.
- **Only the centred card is awake**, marked on every animation frame, woken
  after 140ms of quiet: a flick past three cards decodes one, not four. Waking
  sets `.awake` (which swaps the standby plate for the record) and calls
  `Screen.decode` at the same 240 chars/s an open card's record would type at.
  `fitRecords()` now takes a root, so the same measurement fits the drum's cards
  and the strip's; `crtPath()` is set once on `.caro` because every card there is
  the same size. With one card the arrows and ticks stay hidden — there is
  nowhere to step to.
- **A latent `?fx=off` crash is fixed on the way** (pre-existing, and the drum
  had it too): `Screen.decode` returned a control handle with no `.stop()` when
  the effect was off or there was nothing to reveal, because the handle was
  assembled after that early return. `genCtl.stop()` / `caro.ctl.stop()` then
  threw on the first scroll. The handle is now complete before the return.
- Measured, 1300×1000: monitor 856×492, track 824×460, card 716×460, 54px of peek
  each side; page 3007 (the vision box it replaced was 2960). At 390×844: monitor
  346×487.8, card 254×455.8, peek 30; the kernel-OS card fits at 0.737 with all
  three bullets. At 320×568: card 184×360, `--rec` at the 0.7 floor with its
  bullets dropped — the same "a floor-only record loses bullets off the end"
  behaviour as the drum. Driven by probe on a four-card fixture (deleted before
  the commit): `[ ◀ ]`/`[ ▶ ]`, both arrow keys with the track focused, the ticks
  and a mouse drag each land on the right card and update `.active`, `.awake`,
  `aria-current`, the tick and the count together; the ends clamp instead of
  running off; exactly one card is awake in each section; no horizontal overflow
  and no console errors at 320, 390 and 1300, with `?fx=off` as well as on.

## Open projects: an otamatone and a talk box
- **The list arrived as material, not as copy.** The author handed over session
  logs and build notes for five projects at once — an OS controlled at the kernel
  level, a modular long-range FPV drone (the Kestrel repo on the Desktop, whose
  README and `docs/` are the finished writing), a DIY Otamatone, a wearable talk
  box, and a safe 6mm airsoft platform — so the cards had to be distilled rather
  than pasted. The rule held: every hook, bullet and badge is either the author's
  phrasing or a compression of it, with nothing asserted that their notes do not
  say.
- **Three were withdrawn as soon as they were seen.** The kernel-OS card, the
  drone and the airsoft platform were written up, landed, and then removed at the
  author's request in the same session; the section is left with the two that
  survived, so the carousel now runs off two cards and the *"the long build"*
  text still sits in `profile.json`'s `vision` object (unrendered, as before).
  Nothing is lost by the withdrawal: the drone's writing lives in its own repo,
  the airsoft source is the author's blueprint in Downloads, and the kernel-OS
  paragraph was never deleted from `profile.json`. The decision log keeps the
  order of events because the round trip is the useful part: the material was
  handed over *as* material, so the first cut was expected to be argued with.
- **One card became two.** The Otamatone and the wearable talk box were written
  as a single card before the author asked for them apart, and the split is
  honest — the Otamatone session went shopping for both, but they are separate
  builds: a touch-slider instrument for a printer-free build, and a phone-synth
  talk box whose plan is a finished vendor list (Daft Punk style: horn
  compression driver on the back, food-grade tubing into the corner of the mouth,
  the helmet needing an acoustic cutout). Their badges are the same because their
  state is: *parts sourced*, with the same closing bullet — ready to build once
  the soldering iron is upgraded.
- **The voice is the author's, in the singular.** The cards are a build log, so
  they say *I* and *my*, never *we* or *our*: the meta note in `data/open.json`
  carries the rule so a future edit does not drift back into house voice.
- **The copy is a SITE file, not a write-up.** `data/open.json`'s meta says where
  the words come from, so the next change edits that file rather than paraphrasing
  the cards in `app.js`. Neither project has a public `repo`, `demo` or `models`
  yet, so neither card carries a link row — the field is optional, as `slideCard`
  was already built to allow.
- Measured, 1300×1000: track 824×460, card 716×460, 54px of peek each side,
  count *"2 open · project 1 / 2"*, two ticks, one `.awake` per section, page
  3085. Both cards keep every bullet: 396px and 397px inside a 460px face
  (`fitRecords()` gets the taller talk-box card to fit by easing `--rec`, not by
  dropping a bullet, so the second card's five bullets sit in the same height as
  the first card's four). At 390×844: card 254×456, peek 30, 400px and 365px
  inside the face, still no dropped bullet. Stepping driven by probe on the real
  cards: `[ ◀ ]`/`[ ▶ ]`, the arrow keys, the ticks and the count now *cycle* —
  past the last card it jumps straight back to 01 and past the first it jumps to
  the last, the jump being instant so it does not sweep every card in between;
  `.active`/`.awake`/`aria-current` stay in agreement, no horizontal overflow and
  no console errors, and the section's text contains no first-person plural.
  Free scrolling (drag, swipe, trackpad) still stays bounded at the two ends —
  only explicit steps wrap, which is how a discrete carousel behaves.
  Note the screenshot trap again: at card scale *"DIY"* and *"TTP223"* downscale
  into what looks like a decode placeholder — crop and enlarge before calling a
  record broken.

## The profile README: the portfolio's front door
- **The profile page is now a doorway, not a résumé.** The GitHub profile repo
  (`sky-is-green/sky-is-green`) was rebuilt around what the author wants on it:
  the tech stack, the featured projects, the public repos, the social badges and
  the footer — everything else cut (the old intro paragraph, the duplicated
  social row, the per-project badge rows). The change that matters is at the top:
  the QR avatar (the same `assets/qr/avatar-512.png` the site ships, decoded
  `https://sky-is-green.github.io#`) is in the README as a link, so the profile
  page opens the interactive portfolio with a scan or a click. The site's own
  avatar direction is still undecided, but the README no longer needs it to be
  the QR — the README carries the QR itself.
- **There is no badge for private repos; there is a workaround.** Shields has no
  `/github/private-repos/…` endpoint, and the dynamic-JSON badge over
  `api.github.com/users/sky-is-green` answers *no result* because GitHub does not
  publish `total_private_repos` to the public API (it is in the authenticated
  `/user` payload and in GraphQL's `viewer.repositories(privacy: PRIVATE)`). So
  the count is published by us: `private-repos.json` in the profile repo, read
  by the badge as a dynamic-JSON file, refreshed daily by
  `.github/workflows/private-repos-badge.yml`. The workflow's own `GITHUB_TOKEN`
  counts 0 (it is scoped to the repo it runs in), so it needs a `GH_PAT` secret
  with `repo` scope — which this machine cannot create (403 on
  `actions/secrets/public-key`). The file therefore holds the hand-written 4
  until the secret exists; the badge is live either way.
- **The featured list and the site's list agree.** The README's six featured
  projects are the site's `featured: true` cards (Scion, Splinter Memory,
  HiveBench, Bonsai 2 forensics, PixelQR, Strata fork work), and the public-repos
  table lists the twelve public repos with their real descriptions and
  languages (the thirteenth is the profile repo itself) — the four private ones
  are deliberately absent, which is what the footer note is for.

## Contact: a Firefox Relay alias
- **The real inbox is not on the site.** The `[ contact ]` section shows
  `qbz7imbtw@mozmail.com` — a Firefox Relay alias. Relay forwards it to the
  real address; the forwarding lives in Mozilla's account, not in this repo.
  Nothing here contains the real address: the served document carries exactly
  one `mailto:` and it is the alias, and no `@gmail` or `users.noreply` string
  appears anywhere in it (checked in probe, 2026-10-20).
- **The whole mechanism is a `mailto:`.** The previous attempt minted a random
  alias per visitor in the browser (`crypto.getRandomValues`, kept in
  `localStorage`) and offered a copy button, a `[ new ]` button and two
  paragraphs explaining the privacy model. It was removed in `4dccdd2` because
  the domain it published was not the author's — `skyisgreen.com` is the aurora
  project's, so every visitor's message went to a stranger's mail, and the
  replacement `lsfg-vk.dev` had no mailbox for the name it published, so mail
  bounced. A Relay alias is a real mailbox that already exists, so there is
  nothing to mint and nothing to keep: the address is fixed, the link is a
  `mailto:`, and the copy says what the address is instead of apologising for
  it. The one button left is `[ copy ]`, for the visitor whose machine has no
  mail client configured — and if the clipboard is refused it *selects* the
  address instead, because a copy button that silently does nothing is worse
  than one that selects.
- **The footer's id moved.** The footer was `#contact` and the section wants
  the id, so the footer became `#colophon` and the section is `#contact` — the
  menu's 4 and the games page's `../#contact` both land on the section, which
  is where the address is. The footer's own two social links stay where they
  were.
- **The reply path is where the address would leak.** Inbound is hidden: the
  visitor never sees the inbox. But a reply sent from the author's own address
  carries that address in its `From:`, and the visitor sees it. Keeping the
  inbox hidden on the way back needs the reply sent from the alias domain,
  which Relay does not do — so the privacy of the *reply* is the author's to
  arrange (or accept), and the copy on the page says nothing that over-promises
  it.
- **What was checked from here, and what was not.** The section was measured in
  Firefox headless at 1300×1000 and 390×844: it is a `<section id="contact">`,
  408px tall at 1300, the address renders 269px wide (168px at 390) with no
  overflow, the served document carries exactly one `mailto:` and no `@gmail`
  and no `users.noreply`, and pressing `4` or clicking the menu's `4 contact`
  lands on the section with the address on screen. Mail was sent to the alias
  twice from a throwaway inbox (`ivbxufkvrs@mail.phantom-mail.sanjula.online`,
  through phantom-mail's own web UI) and no delivery notification came back —
  but a control message to a made-up `@mozmail.com` address came back just as
  silently, so mozmail.com accepts unknown aliases instead of bouncing them
  and **"no bounce" proves nothing**. The one thing that settles it is the
  author seeing the message in the real inbox, which only they can do.

## Still open
- **Wording review of the two cards.** The copy was distilled from the author's
  notes rather than written by them, so it wants a read-through for voice and any
  claim that reads sharper than they meant (`data/open.json`).
- Nothing else blocking. The arcade still wants a live play-test (Snake, Breakout) —
  including the stage swap, which has only been driven by probe so far — and the
  avatar direction is undecided.
