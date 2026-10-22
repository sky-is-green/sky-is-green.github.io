/* sky-is-green — renders data/*.json, a 3D drum project tumbler in the
   Pip-Boy spirit (native scroll rotates the drum; it wraps like a cylinder),
   and a numbered DOS-style menu. No dependencies; all static and same-origin. */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function elem(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function chip(label, opts) {
    const b = elem('button', 'chip' + (opts && opts.static ? ' static' : ''));
    b.type = 'button';
    b.textContent = label;
    return b;
  }
  /* A small slice of inline markdown, because the copy lives in data/*.json and
     plain text is what is editable there: **bold**, *italic*, ***both*** and
     [text](url). It is built as elements rather than assigned as HTML, so a
     stray angle bracket in someone's prose stays prose. */
  const PROSE = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/;
  function prose(text) {
    const frag = document.createDocumentFragment();
    String(text).split(PROSE).forEach((part) => {
      let m;
      if (!part) return;
      if ((m = /^\*\*\*([^*]+)\*\*\*$/.exec(part))) {
        const s = elem('strong');
        s.append(elem('em', null, m[1]));
        frag.append(s);
      } else if ((m = /^\*\*([^*]+)\*\*$/.exec(part))) {
        frag.append(elem('strong', null, m[1]));
      } else if ((m = /^\*([^*]+)\*$/.exec(part))) {
        frag.append(elem('em', null, m[1]));
      } else if ((m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part))) {
        frag.append(Object.assign(elem('a', null, m[1]), { href: m[2] }));
      } else {
        frag.append(document.createTextNode(part));
      }
    });
    return frag;
  }
  function flash(node) {
    node.classList.remove('flash');
    void node.offsetWidth;
    node.classList.add('flash');
  }
  function goTo(id) {
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ block: 'start' });
    flash(node);
  }

  let PROFILE = null;
  let PROJECTS = [];
  let activeTag = null;

  /* ---------------- profile ---------------- */

  function renderProfile(p) {
    document.title = p.name + ' · ' + p.handle;
    $('#profile-name').textContent = p.handle;
    $('#hero-tagline').textContent = p.tagline;
    $('#year').textContent = String(new Date().getFullYear());

    const heroLinks = $('#hero-links');
    p.links.forEach((l, i) => {
      if (i) heroLinks.append(document.createTextNode(' · '));
      heroLinks.append(Object.assign(elem('a', null, l.label), { href: l.url }));
    });

    const contact = $('#contact-links');
    p.links.forEach((l) => contact.append(Object.assign(elem('a', null, l.label + ' ↗'), { href: l.url, rel: 'me' })));

    const about = $('#about-body');
    p.about.forEach((par) => {
      const el = elem('p');
      el.append(prose(par));
      about.append(el);
    });

    const skills = $('#skills');
    p.skills.forEach((s) => {
      const row = elem('div', 'row');
      row.append(elem('span', 'g', s.group));
      const tags = elem('div', 'tags');   // so wrapped tags hang under the first
      s.items.forEach((it) => tags.append(chip(it, { static: true })));
      row.append(tags);
      skills.append(row);
    });
  }

  /* ---------------- contact ----------------
     The address shown here is a Firefox Relay alias: mail sent to it is
     forwarded to the real inbox, and the inbox is in no file in this repo —
     only the alias is published. The alias is the whole of the address the
     page hands out, so it is just a mailto: there is nothing to mint and
     nothing to keep in storage. */
  function renderContact(c) {
    if (!c || !c.email) return;
    const intro = $('#contact-intro');
    const note = $('#contact-note');
    const addr = $('#contact-mail');
    if (intro) intro.textContent = c.intro || '';
    if (note) note.textContent = c.note || '';
    if (addr) {
      addr.textContent = c.email;
      addr.href = 'mailto:' + c.email + (c.subject ? '?subject=' + encodeURIComponent(c.subject) : '');
    }
    const copy = $('#contact-copy');
    if (!copy) return;
    copy.addEventListener('click', async () => {
      let ok = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { await navigator.clipboard.writeText(c.email); ok = true; } catch (e) { ok = false; }
      }
      if (!ok) {
        // no clipboard permission (or an insecure origin): select the address
        // instead — a copy button that silently does nothing is worse than
        // one that selects.
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(addr);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      copy.textContent = ok ? '[ copied ]' : '[ selected ]';
      setTimeout(() => { copy.textContent = '[ copy ]'; }, 1400);
    });
  }

  /* ---------------- menu ---------------- */

  // the DOS menu and the CRT toggle are shared chrome — screen.js owns them
  const wireMenu = () => Screen.chrome();

  /* ---------------- filters ---------------- */

  function matches(p) {
    return !activeTag || (p.tags || []).indexOf(activeTag) !== -1;
  }

  function buildFilters() {
    const wrap = $('#filters');
    wrap.textContent = '';
    const freq = {};
    PROJECTS.forEach((p) => (p.tags || []).forEach((t) => { freq[t] = (freq[t] || 0) + 1; }));
    const tags = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || a.localeCompare(b));

    const all = chip('all');
    all.addEventListener('click', () => setFilter(null));
    wrap.append(all);

    tags.forEach((t) => {
      const c = chip(t);
      c.addEventListener('click', () => setFilter(t));
      wrap.append(c);
    });
    syncFilterChips();
  }

  function syncFilterChips() {
    $('#filters').querySelectorAll('.chip').forEach((c) => {
      const v = c.textContent.toLowerCase() === 'all' ? null : c.textContent;
      c.classList.toggle('active', (v === null && activeTag === null) || v === activeTag);
    });
  }

  function setFilter(tag) {
    if (tag === activeTag) return;
    activeTag = tag;
    syncFilterChips();
    buildTumbler();
  }

  /* ---------------- tumbler: 3D drum (pip-boy style) ---------------- */

  const frame = $('#tum-frame');
  const stage = $('#tum-stage');
  const drum = $('#tum-drum');
  const viewport = $('#tum-viewport');
  const tumbler = $('#tumbler');
  const ticks = $('#tum-ticks');
  const count = $('#count');

  const STEP = 360;      // virtual px scrolled per slot (scroll sensitivity)
  const PERSP = 1900;    // css perspective — strong, so the curve reads clearly
  const CHARS_PER_TOKEN = 4;  // for the generated-on-view readout
  const SC = 0.72;       // card draw scale (matches --sc in styles.css)
  const FRAME = 12;      // bezel thickness, px — frame/both modes only

  // ?drum=both   → fixed CRT bezel + per-card exit compensation   ·   default
  // ?drum=frame  → fixed CRT bezel only
  // ?drum=flush  → per-card perspective compensation only
  // ?drum=none   → raw
  // ?fx=off      → no signal glitch
  const MODE = (new URLSearchParams(location.search).get('drum') || 'both').toLowerCase();
  const PARAMS = new URLSearchParams(location.search);
  const useFrame = MODE === 'frame' || MODE === 'both';
  const useFlush = MODE === 'flush' || MODE === 'both';
  const useFx = (PARAMS.get('fx') || '').toLowerCase() !== 'off';
  document.documentElement.classList.toggle('drum-frame', MODE === 'frame');
  document.documentElement.classList.toggle('drum-both', MODE === 'both');

  let items = [];
  let N = 0;
  let theta = 0;         // degrees per slot on the drum
  let radius = 620;      // drum radius, px
  let cardBox = 489;     // card height in css px (= FACE_H / SC)
  let cur = -1;          // index of the front card
  let settleTimer = null;

  /* One card, used by both the work drum and the open-projects carousel: the
     differences between the two are the motion and two fields — a work card
     carries a tok/s readout and filterable tags, an open card a status badge
     and plain ones. */
  function slideCard(p, num, opts) {
    opts = opts || {};
    const card = elem('div', 'slide');
    const face = elem('div', 'slide-card');
    // The lit surface, as its own layer: a card that is not in front narrows,
    // and this is what narrows — the text inside can't be squashed with it, so
    // the panel has to be separable from its contents.
    face.append(elem('span', 'face'));

    // Standby face: number and title alone, until this card is the one in front.
    const plate = elem('div', 'plate');
    plate.append(elem('span', 'plate-num', '[' + String(num).padStart(2, '0') + ']' + (p.featured ? ' ✦' : '')));
    plate.append(elem('h3', 'plate-title', p.title));
    const foot = elem('div', 'plate-foot');
    for (let i = 0; i < 7; i++) foot.append(elem('i'));
    plate.append(foot);
    face.append(plate);

    const col = elem('div', 'slide-inner');
    const body = elem('div', 'body');

    const head = elem('div', 'head');
    const numEl = elem('span', 'proj-num', '[' + String(num).padStart(2, '0') + ']' + (p.featured ? ' ' : ''));
    if (p.featured) numEl.append(elem('span', 'star', '✦'));
    head.append(numEl);
    const right = elem('div', 'head-right');
    const badge = p.kind === 'contribution' ? (p.contribution || 'fork work') : p.status;
    if (badge) right.append(elem('span', 'kind-badge', badge));
    if (opts.rate !== false) {
      const rate = elem('span', 'gen-rate');
      rate.dataset.tok = String(p.tok_s || 60);
      // the readout is set now, not on waking: fitRecords() measures a card as it
      // will be seen, and a head that gains a line only once the card is in front
      // would make every fit a line short
      rate.textContent = rate.dataset.tok + ' tok/s';
      right.append(rate);
    }
    head.append(right);
    body.append(head);

    const title = elem('h3', 'proj-title');
    // an open project has no repo to point at yet more often than not, and a
    // title is a heading either way
    if (p.repo) title.append(Object.assign(elem('a', null, p.title), { href: p.repo }));
    else title.textContent = p.title;
    body.append(title);
    const hook = elem('p', 'proj-hook');
    if (p.hook) hook.append(prose(p.hook));
    body.append(hook);

    const ul = elem('ul', 'proj-bullets');
    (p.bullets || []).forEach((b) => {
      const li = elem('li');
      li.append(prose(b));
      ul.append(li);
    });
    if (ul.children.length) body.append(ul);

    const tags = elem('div', 'proj-tags');
    (p.tags || []).forEach((t) => {
      const c = chip(t, opts.onTag ? null : { static: true });
      if (opts.onTag) c.addEventListener('click', () => opts.onTag(t));
      tags.append(c);
    });
    if (tags.children.length) body.append(tags);

    const links = elem('div', 'proj-links');
    if (p.repo) links.append(Object.assign(elem('a', null, 'repo'), { href: p.repo }));
    (p.models || []).forEach((m, i) => links.append(Object.assign(elem('a', null, 'model ' + (i + 1)), { href: m })));
    if (p.demo) links.append(Object.assign(elem('a', null, 'demo'), { href: p.demo }));
    (p.papers || []).forEach((u, i) => links.append(Object.assign(elem('a', null, 'paper ' + (i + 1)), { href: u })));
    if (links.children.length) body.append(links);

    col.append(body);
    face.append(col);
    card.append(face);
    return card;
  }

  /* The CRT silhouette: the card's top and bottom edges bow outward, so each
     face reads as part of a curved tube rather than a flat panel. Only those
     two edges need it — the sides are off-screen. Every card uses the same
     curve, so where two cards meet, their edges follow the same arc and
     overlap slightly instead of parting at the middle. Generated in px because
     clip-path path() coordinates do not scale with the element. */
  function crtPath(w, h) {
    const b = Math.round(Math.min(9, h * 0.019));   // how far an edge bows
    return 'path("M 0 0 Q ' + (w / 2) + ' ' + (-2 * b) + ' ' + w + ' 0' +
           ' L ' + w + ' ' + h + ' Q ' + (w / 2) + ' ' + (h + 2 * b) + ' 0 ' + h + ' Z")';
  }

  function buildTumbler() {
    items = PROJECTS.filter(matches);
    N = items.length;
    drum.textContent = '';
    ticks.textContent = '';
    cur = -1;
    cancelRoll();
    sleepAll();
    clearTimeout(settleTimer);

    if (!N) {
      $('#tum-space').style.height = '0px';
      updateCount();
      return;
    }

    // the drum is a full circle: every item gets 360/N degrees of it. The
    // radius is not free — it is fixed by the face height and the number of
    // faces, because that is the only arrangement in which neighbours meet
    // edge to edge instead of leaving a slice of background between them.
    theta = N === 1 ? 0 : 360 / N;

    items.forEach((p) => drum.append(slideCard(p, PROJECTS.indexOf(p) + 1, { onTag: setFilter })));

    items.forEach((p, i) => {
      const b = elem('button', 'tick', String(i + 1).padStart(2, '0'));
      b.type = 'button';
      b.setAttribute('aria-label', 'go to ' + p.title);
      b.addEventListener('click', () => jumpTo(i));
      ticks.append(b);
    });

    sizeDrum();

    // scrollable range: a full drum of slots plus the margin that lets the roll
    // wrap at either end — scrolling off an end teleports by exactly one full
    // turn, which is invisible on a cylinder. See sizeRange(): the maximum
    // scroll position has to reach past the last slot, or the roll stops dead
    // on the end card instead of cycling back to 01.
    sizeRange();
    void viewport.scrollHeight; // flush layout so the scroll range exists
    viewport.scrollTop = N * STEP; // slot N ≡ slot 0 → first project front
    layoutBezel();
    updateDrum();
    paint();
    wakeFront();   // the first card wakes without waiting for a roll
  }

  /* Every measurement the drum needs, in one place, because all of it depends on
     the stage's *current* box: the side column's width depends on the webfonts,
     and a resize changes both dimensions. Run from buildTumbler and again
     whenever either could have moved. */
  function sizeDrum() {
    if (!N) return;
    // The pad mirrors the rail's own width, so the frame lands on the section's
    // centre line. Set before anything is measured: the pad changes the frame's
    // width, and every number below is derived from that width.
    const rail = tumbler.querySelector('.tum-side');
    if (rail) tumbler.style.setProperty('--rail', rail.getBoundingClientRect().width + 'px');
    // one or two faces have no polygon to tile; size them as if there were
    // three, or tan(π/N) runs to infinity and the radius to zero
    const tan = Math.tan(Math.PI / Math.max(3, N));
    // The screen: symmetric inside the frame.
    const screenW = Math.max(200, stage.clientWidth - 2 * (FRAME + 4));
    const screenH = Math.max(200, stage.clientHeight - 2 * (FRAME + 4));
    // Face height, and therefore the ring: the card should fill 80% of the
    // screen so the neighbouring faces still show above and below it — that
    // band of the next card is the whole drum effect. The floor is what a long
    // record needs, and the cap keeps a card from ever being taller than the
    // screen it has to sit inside (on a short window the drum effect gives way
    // before the card does).
    const want = Math.max(399, screenH * 0.80);
    const q = Math.min(want, screenH);          // projected height of the front card
    const face3d = q / (1 + q / (2 * tan * PERSP));
    radius = face3d / (2 * tan);
    const mag = PERSP / (PERSP - radius);       // projection gain on the front card
    stage.style.setProperty('--persp', PERSP + 'px');
    stage.style.setProperty('--sc', SC);
    // the card's own height in css px: the face height unscaled by the draw
    // scale, since the scale is applied inside the rotation (see updateDrum)
    cardBox = Math.round(face3d / SC);
    stage.style.setProperty('--card-h', cardBox + 'px');
    // ...and its width is set so it projects to exactly the screen, so no part
    // of a card is ever cut off by the frame
    const cardW = Math.round(screenW / (SC * mag));
    stage.style.setProperty('--card-w', cardW + 'px');
    stage.style.setProperty('--crt-path', crtPath(cardW, cardBox));
    layoutBezel();
    fitRecords(drum);
  }

  /* The record sits on a face of a fixed height and the longer ones do not
     always fit it: on a phone, Scion's ran 141px past the bottom at 390x844 and
     the card clipped it. Shrinking the type is the first answer — each card
     carries a `--rec` factor that every size and margin in its record is
     multiplied by — down to the floor where it stops being readable. What is
     still too long at that point loses bullets off the end. */
  const REC_FLOOR = 0.7;
  function fitRecords(root) {
    root.querySelectorAll('.slide-card').forEach((card) => {
      const inner = card.querySelector('.slide-inner');
      if (!inner) return;
      const lis = Array.prototype.slice.call(inner.querySelectorAll('.proj-bullets li'));
      lis.forEach((li) => { li.hidden = false; });
      const css = getComputedStyle(card);
      const have = card.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
      const set = (s) => card.style.setProperty('--rec', String(Math.round(s * 1000) / 1000));
      const fits = () => inner.offsetHeight <= have;
      set(1);
      if (fits()) return;
      // At the floor the type is as small as it can stay readable. If the copy
      // is still too long there, it loses bullets off the end: a cut mid-line
      // reads as a bug, a shorter list reads as a shorter record.
      set(REC_FLOOR);
      for (let i = lis.length - 1; i >= 0 && !fits(); i--) lis[i].hidden = true;
      if (!fits()) return;
      // Largest scale that still fits — three bisections settle it, so the
      // record gets as much of the face as it can actually use.
      let lo = REC_FLOOR, hi = 1;
      for (let i = 0; i < 3; i++) {
        const mid = (lo + hi) / 2;
        set(mid);
        if (fits()) lo = mid; else hi = mid;
      }
      set(lo);
    });
  }

  /* The scroll track: as long as the viewport, plus a full drum of slots, plus
     a slot of margin at either end for the wrap. The height deliberately
     depends on the viewport, so that the maximum scroll position comes out at
     exactly N * STEP: slot N (≡ slot 0) and the wrap point half a slot past it
     are then both reachable at any window size. */
  function sizeRange() {
    if (!N) return;
    $('#tum-space').style.height = (N + 1) * STEP + viewport.clientHeight + 'px';
  }

  // the frame is a symmetric inset over the band; the opening it leaves is the
  // screen the cards are sized to fill exactly
  function layoutBezel() {
    if (!N || !useFrame) return;
    stage.style.setProperty('--screen-w', Math.max(200, stage.clientWidth - 2 * (FRAME + 4)) + 'px');
    stage.style.setProperty('--screen-h', Math.max(200, stage.clientHeight - 2 * (FRAME + 4)) + 'px');
    stage.style.setProperty('--bezel', FRAME + 'px');
  }

  function frontIndex(s) {
    return ((Math.round(s) % N) + N) % N;
  }

  function updateDrum() {
    if (!N) return;
    const s = viewport.scrollTop / STEP;
    // Scrolling off either end teleports by exactly one full turn, which is
    // invisible on a cylinder. Carry an in-flight roll target along by the same
    // amount, otherwise the roll would suddenly see a half-drum of distance and
    // lurch across it.
    if (s < 0.5) { viewport.scrollTop += N * STEP; if (rollTarget != null) { rollTarget += N * STEP; rollPos += N * STEP; } return; }
    if (s >= N + 0.5) { viewport.scrollTop -= N * STEP; if (rollTarget != null) { rollTarget -= N * STEP; rollPos -= N * STEP; } return; }
    const els = drum.children;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      let a = (s - i) * theta; // items below the front rise into view as you scroll
      a = ((a % 360) + 360) % 360;
      if (a > 180) a -= 360;
      const abs = Math.abs(a);
      // Cull by geometry, not by an opacity ramp. The cards share edges now, so
      // fading a neighbour would darken exactly the seam we are trying to make
      // invisible; a card is either on screen and fully opaque, or off it.
      // Its nearest edge is the point of it closest to the centre of frame.
      const half = (cardBox * SC) / 2;
      const rad = (abs * Math.PI) / 180;
      const yNear = half * Math.cos(rad) - radius * Math.sin(rad);
      const zNear = half * Math.sin(rad) + radius * Math.cos(rad);
      if (Math.abs(yNear) * (PERSP / (PERSP - zNear)) > stage.clientHeight / 2 + 40) {
        // kept in the layer tree rather than display:none'd: creating and
        // rasterizing a fresh face mid-roll costs more than leaving it
        // composited, and the churn showed up as dropped frames
        el.style.visibility = 'hidden';
        continue;
      }
      el.style.visibility = '';
      el.style.opacity = '';
      // flush compensation: a tilted card's near edge sits closer to the
      // camera than the front card, so it projects wider than the front card.
      // Shrink x by exactly that ratio and the two line up at the seam; the
      // far edge keeps its natural cylinder taper.
      let k = 1;
      if (useFlush && abs > 0.01) {
        // shrink only: near the front a tilted card's leading edge projects wider
        // than the front card, so scale it back to flush. Past ~40° the card is
        // genuinely receding (narrower), and we let the cylinder taper it.
        k = Math.min(1, (1 - zNear / PERSP) / (1 - radius / PERSP));
      }
      // scale(SC) goes *inside* the rotation: applied outside it would squash
      // the card in y while its depth still came from the unscaled y, which is
      // not a plane on the cylinder at all and cannot tile with its neighbours.
      // Inside, it is simply a smaller rigid card sitting tangent to the drum.
      el.style.transform = 'scaleX(' + k.toFixed(4) + ') translateY(-50%) rotateX(' + a.toFixed(2) +
        'deg) translateZ(' + radius.toFixed(1) + 'px) scale(' + SC + ')';
      el.style.zIndex = String(600 - Math.round(abs));
    }
    const front = frontIndex(s);
    if (front !== cur) {
      cur = front;
      paint();
    }
  }

  function paint() {
    if (!N) {
      count.textContent = 'no entries for this filter';
      return;
    }
    [...drum.children].forEach((el, i) => {
      el.classList.toggle('active', i === cur);
      if (i === cur) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    [...ticks.children].forEach((b, i) => b.classList.toggle('active', i === cur));
    updateCount();
  }

  function updateCount() {
    const parts = [];
    if (activeTag) parts.push('filter: ' + activeTag + ' · ' + N + ' of ' + PROJECTS.length + ' entries');
    else parts.push(PROJECTS.length + ' entries · public work only · fork work is labeled');
    if (N) parts.push('project ' + (cur + 1) + ' / ' + N);
    count.textContent = parts.join(' · ');
  }

  /* ---------------- generation: the front card writes itself in ----------------
     Only the card the drum has settled on generates, and it stops the moment
     the roll moves on. The reveal itself lives in screen.js, since the games
     page wants it too. */
  let genEl = null, genCtl = null, awakeEl = null;

  function sleepAll() {
    if (!awakeEl) return;
    awakeEl.classList.remove('awake');
    awakeEl = null;
    if (genCtl) { genCtl.stop(); genCtl = null; }
  }

  function wakeFront() {
    const el = drum.children[cur];
    if (!el || el === awakeEl) return;
    sleepAll();
    awakeEl = el;
    el.classList.add('awake');
    const body = el.querySelector('.body');
    const rate = el.querySelector('.gen-rate');
    if (!body) return;
    genEl = el;
    if (rate) rate.classList.add('gen');
    const tok = Number(rate && rate.dataset.tok) || 60;
    genCtl = Screen.decode(body, {
      charsPerSecond: tok * 4,
      atomic: '.proj-tags, .proj-links',
      skip: '.gen-rate',          // the readout is chrome, not decoded text
      done: () => { if (rate) rate.classList.remove('gen'); }
    });
  }

  /* ---------------- roll: the feel of the drum ----------------
     Every move (wheel notch, arrow key, tick, snap after a drag) sets a target
     and one loop eases the scroll position toward it. Two things make it feel
     tactile rather than laggy:

       · it moves ~a third of the gap on the very first frame — no ease-in
         ramp, so input and motion look simultaneous;
       · the loop is the only thing that writes scrollTop, so a gesture never
         stacks a raw jump on top of a separate settling animation.

     The ease is exponential (frame-rate independent), so the drum still reads
     as a weighted roll instead of a teleport. */
  const ROLL_TAU = 42;   // ms — smaller is snappier (63% of the gap per tau)
  let rollTarget = null; // scrollTop we are easing toward (null = at rest)
  let rollPos = 0;       // float position we drive; scrollTop rounds it on write
  let rollRaf = null;
  let rollLast = 0;

  function cancelRoll() {
    if (rollRaf) { cancelAnimationFrame(rollRaf); rollRaf = null; }
    rollTarget = null;
    rollLast = 0;
  }

  // the same slot in the turn nearest `from`, so we never roll the long way round
  function sameTurn(slot, from) { return slot + Math.round((from - slot) / N) * N; }

  function rollLoop(now) {
    if (rollTarget == null) { rollRaf = null; return; }
    // frame-rate independent: elapsed ms, clamped so a stalled frame can't leap
    const dt = rollLast ? Math.min(64, now - rollLast) : 16.7;
    rollLast = now;
    const diff = rollTarget - rollPos;
    if (Math.abs(diff) < 0.5) {
      rollPos = rollTarget;
      viewport.scrollTop = rollPos;
      rollRaf = null; rollTarget = null; rollLast = 0;
      normalize();
      wakeFront();   // the drum has stopped: the front card wakes and generates
      return;
    }
    // the ease runs on our own float: scrollTop reads back as an integer, so
    // easing against the read-back value stalls a pixel short and never lands
    rollPos += diff * (1 - Math.exp(-dt / ROLL_TAU));
    viewport.scrollTop = rollPos;
    rollRaf = requestAnimationFrame(rollLoop);
  }

  function rollTo(top) {
    if (!N) return;
    // any move puts the drum back to standby: title plates while it rolls
    sleepAll();
    if (reduceMotion()) {
      cancelRoll();
      viewport.scrollTop = top;
      normalize();
      wakeFront();
      return;
    }
    if (rollTarget == null) rollPos = viewport.scrollTop; // seed a fresh roll
    rollTarget = top;
    if (!rollRaf) { rollLast = 0; rollRaf = requestAnimationFrame(rollLoop); }
  }

  // where we are *heading* (not where we are mid-animation), in slots
  function fromSlot() { return (rollTarget != null ? rollTarget : viewport.scrollTop) / STEP; }

  function normalize() {
    const s = viewport.scrollTop / STEP;
    if (s < 0.5) viewport.scrollTop += N * STEP;
    else if (s >= N + 0.5) viewport.scrollTop -= N * STEP;
    updateDrum();
    paint();
  }

  function snapToNearest() {
    if (!N) return;
    const from = fromSlot();
    rollTo(sameTurn(Math.round(from), from) * STEP);
  }

  // after a pointer drag (or a touch fling) the browser owns the scroll, so we
  // only snap once it has gone quiet for a beat
  function scheduleSettle() {
    if (!N || rollRaf) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (rollRaf) return;
      const s = viewport.scrollTop / STEP;
      if (Math.abs(viewport.scrollTop - Math.round(s) * STEP) > 1) snapToNearest();
    }, 100);
  }

  function step(delta) {
    if (!N) return;
    const from = fromSlot();
    rollTo(sameTurn(Math.round(from) + delta, from) * STEP);
  }

  function jumpTo(i) {
    if (!N) return;
    rollTo(sameTurn(i, fromSlot()) * STEP);
  }

  function wireTumbler() {
    $('#tum-up').addEventListener('click', () => step(-1));
    $('#tum-down').addEventListener('click', () => step(1));
    tumbler.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    });
    viewport.addEventListener('scroll', () => {
      updateDrum();
      scheduleSettle();
    }, { passive: true });

    // Wheel: the drum is a detented roll, not a free-scrolling box.
    //
    // The problem being fixed: a slot is STEP = 360 virtual px, but a mouse
    // notch is only ~100 px, so one notch moved round(100/360) = 0 slots — the
    // drum nudged forward and then sprang back to the same card after the
    // settle delay. Never advancing on a notch is what read as "laggy".
    //
    // So the wheel is handled here instead: deltas accumulate to a detent and
    // each detent advances exactly one slot. The detent size is taken from the
    // first event of the gesture, which makes a mouse notch one slot whatever
    // its size (~100 px in Chrome, lines in Firefox, pages elsewhere) and turns
    // a trackpad's stream of small deltas into the same firm steps.
    const WHEEL_MIN = 90;  // px of travel per slot for pixel-mode input (trackpad/mouse)
    const WHEEL_MAX = 240; // cap, so an odd huge delta can't skip the drum
    let wheelAcc = 0, wheelAt = 0, wheelUnit = 0;
    frame.addEventListener('wheel', (e) => {
      if (!N || e.ctrlKey) return; // let pinch-zoom go through untouched
      e.preventDefault();
      const now = performance.now();
      const px = e.deltaMode === 1 ? e.deltaY * 16                  // lines
               : e.deltaMode === 2 ? e.deltaY * viewport.clientHeight // pages
               : e.deltaY;                                          // pixels
      if (now - wheelAt > 150) { wheelAcc = 0; wheelUnit = 0; } // new gesture
      wheelAt = now;
      if (!wheelUnit) {
        wheelUnit = e.deltaMode !== 0
          ? Math.max(24, Math.abs(px))      // one line/page notch = one slot
          : Math.min(WHEEL_MAX, Math.max(WHEEL_MIN, Math.abs(px)));
      }
      wheelAcc += px;
      const n = Math.trunc(wheelAcc / wheelUnit);
      if (n) {
        wheelAcc -= n * wheelUnit;
        step(Math.sign(n) * Math.min(Math.abs(n), 2)); // cap a wild flick
      }
      clearTimeout(settleTimer); // a detent already lands on a slot
    }, { passive: false });

    // any direct input takes over from a running roll, and puts the drum back
    // to its standby titles while it moves
    frame.addEventListener('touchstart', () => { cancelRoll(); sleepAll(); }, { passive: true });

    // mouse drag (touch swipes are handled natively by the scroll container)
    let drag = null;
    let justDragged = false;
    frame.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelRoll();
      sleepAll();
      drag = { y: e.clientY, top: viewport.scrollTop, moved: false };
      viewport.classList.add('dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dy) > 6) drag.moved = true;
      if (drag.moved) viewport.scrollTop = drag.top - dy;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      viewport.classList.remove('dragging');
      if (moved) { justDragged = true; scheduleSettle(); } // click into the nearest slot
    });
    frame.addEventListener('click', (e) => {
      if (justDragged) {
        e.preventDefault();
        e.stopPropagation();
        justDragged = false;
      }
    }, true);

    // rAF stops in a hidden tab, which would leave an in-flight roll stranded
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rollTarget != null) {
        const top = rollTarget;
        cancelRoll();
        viewport.scrollTop = top;
        normalize();
      }
    });
  }

  /* ---------------- open projects: the same cards, slid sideways ----------------
     The drum rolls on a cylinder; this is the same card in the same monitor
     with the motion swapped for a slide. It is a plain scroll-snap track: one
     card centred at a time, a sliver of each neighbour left showing at the
     edges so the strip reads as a strip. The centred card is the awake one and
     writes itself in; the slivers hold their standby plates, exactly as the
     cards off the front of the drum do.

     Snapping is the browser's, so touch swipes and trackpads cost nothing. A
     mouse has no swipe, so the drag is ours — the drum's drag, sideways — and
     the buttons, the ticks and the left/right arrows all just scroll the track
     to a card. Nothing rolls while you read: scroll-snap does the arithmetic,
     and one rAF decides which card is centred. */
  let OPEN = [];
  const caro = {
    box: null, track: null, slides: [], ticks: [],
    cur: -1, awake: null, ctl: null, raf: null, settle: null
  };

  function buildCarousel(items) {
    OPEN = items || [];
    caro.box = $('#caro');
    caro.track = $('#caro-track');
    const ticksEl = $('#caro-ticks');
    caro.track.textContent = '';
    ticksEl.textContent = '';
    caro.slides = [];
    caro.ticks = [];
    caro.cur = -1;
    caro.awake = null;
    caro.ctl = null;
    OPEN.forEach((p, i) => {
      const slide = slideCard(p, i + 1, { rate: false });
      caro.track.append(slide);
      caro.slides.push(slide);

      const b = elem('button', 'tick', String(i + 1).padStart(2, '0'));
      b.type = 'button';
      b.setAttribute('aria-label', 'go to ' + p.title);
      b.addEventListener('click', () => caroGoTo(i));
      ticksEl.append(b);
      caro.ticks.push(b);
    });
    // seamless wrap, like the drum: a clone of the last card before the first
    // and a clone of the first after the last, so scrolling past an end reveals
    // the other end instead of stopping. The spacers are switched off for this
    // (see .caro.has-wrap) because the clones supply the peek themselves.
    caro.box.classList.toggle('has-wrap', OPEN.length > 1);
    if (OPEN.length > 1) {
      const cloneLast = caro.slides[OPEN.length - 1].cloneNode(true);
      cloneLast.classList.add('clone');
      caro.track.insertBefore(cloneLast, caro.track.firstChild);
      const cloneFirst = caro.slides[0].cloneNode(true);
      cloneFirst.classList.add('clone');
      caro.track.append(cloneFirst);
    }
    sizeCarousel();
    void caro.track.scrollHeight;
    // one card is not a carousel: leave the controls out until there is
    // somewhere to step to
    const many = OPEN.length > 1;
    if ($('#caro-side')) $('#caro-side').style.display = many ? '' : 'none';
    ticksEl.style.display = many ? '' : 'none';
    // the first card is the one at rest: it sits one slot in, past the clone.
    caroMark(0);
    if (many) {
      const setup = () => {
        void caro.track.scrollHeight;
        const firstReal = caro.track.querySelector('.slide:not(.clone)');
        if (firstReal) {
          caro.slot = firstReal.offsetLeft || caro.slot || 1;
          caro.base = firstReal.offsetLeft + firstReal.offsetWidth / 2 - caro.track.clientWidth / 2;
          caro.track.scrollLeft = caro.base;
        }
      };
      setup();
      setTimeout(setup, 0);
      setTimeout(setup, 100);
      setTimeout(setup, 1000);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setup);
      }
    } else {
      caro.track.scrollLeft = 0;
    }
    caroWake();
  }

  // the card is a fixed size, so its bowed CRT edge is one path for the whole
  // strip — the same trick as the drum's, on the carousel's box instead
  function sizeCarousel() {
    if (!OPEN.length) return;
    const card = caro.slides[0] && caro.slides[0].querySelector('.slide-card');
    if (!card) return;
    void caro.track.scrollHeight; // flush layout so offsets are real
    const box = card.getBoundingClientRect();
    caro.box.style.setProperty('--crt-path', crtPath(box.width, box.height));
    // slot width: distance between two card centres (= clone width = one slot).
    // Measured off the first real slide's offset, which sits one clone past
    // the track's start once the wrap clones are in place.
    if (caro.slides[0]) {
      const slot = caro.slides[0].offsetLeft || caro.slides[0].offsetWidth;
      if (slot > 0) caro.slot = slot;
    }
    fitRecords(caro.track);
    // keep the centred card centred after a resize
    if (OPEN.length > 1 && caro.slot && caro.cur >= 0 && caro.base != null) {
      caro.track.scrollLeft = caro.base + caro.cur * caro.slot;
    }
  }

  // which card is centred: the one whose middle is nearest the track's middle
  function caroIndex() {
    const track = caro.track;
    const n = OPEN.length;
    if (!n || !caro.slot) return 0;
    const C = caro.slot;
    const base = (caro.base != null) ? caro.base : 0;
    const s = track.scrollLeft;
    if (n > 1) {
      if (s >= base + (n - 1) * C + C / 2) return 0;   // clone of the first
      if (s <= base - C / 2) return n - 1;              // clone of the last
    }
    const mid = s + track.clientWidth / 2;
    let best = 0, bestD = Infinity;
    caro.slides.forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function caroCount(i) {
    const el = $('#caro-count');
    if (!el) return;
    if (!OPEN.length) { el.textContent = 'nothing open right now'; return; }
    const parts = [OPEN.length + ' open'];
    // with one card there is nowhere to step to, so the counter would only
    // repeat itself
    if (OPEN.length > 1) parts.push('project ' + (i + 1) + ' / ' + OPEN.length);
    el.textContent = parts.join(' · ');
  }

  // the centred card only: it is the one that is lit
  function caroMark(i) {
    if (i === caro.cur) return;
    caro.cur = i;
    caro.slides.forEach((el, j) => {
      el.classList.toggle('active', j === i);
      if (j === i) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
    caro.ticks.forEach((b, j) => b.classList.toggle('active', j === i));
    caroCount(i);
  }

  function caroWake() {
    const el = caro.slides[caro.cur];
    if (!el || el === caro.awake) return;
    if (caro.ctl) { caro.ctl.stop(); caro.ctl = null; }
    if (caro.awake) caro.awake.classList.remove('awake');
    caro.awake = el;
    el.classList.add('awake');
    const body = el.querySelector('.body');
    if (body) {
      caro.ctl = Screen.decode(body, {
        charsPerSecond: 60 * 4,      // no readout on an open card: the default rate
        atomic: '.proj-tags, .proj-links'
      });
    }
  }

  function caroGoTo(i, instant) {
    const n = OPEN.length;
    if (!n) return;
    const C = caro.slot || 1;
    const base = (caro.base != null) ? caro.base : 0;
    const track = caro.track;
    let target, smooth = !instant && !reduceMotion();
    if (n > 1 && i === -1) {
      // prev on first: instant jump to the last card (clone_last cannot be
      // centred, so this direction cannot be a smooth slide)
      target = base + (n - 1) * C;
      smooth = false;
    } else if (n > 1 && i === n) {
      // next on last: smooth slide to the clone of the first, then teleport
      target = base + n * C;
    } else {
      const idx = Math.max(0, Math.min(n - 1, i));
      target = base + idx * C;
    }
    const dist = Math.abs(track.scrollLeft - target);
    track.scrollTo({
      left: Math.max(0, target),
      behavior: (instant || reduceMotion() || dist > 1.5 * C || !smooth) ? 'auto' : 'smooth'
    });
  }

  /* The teeth of the slide: mark the centre on every frame (the ticks and the
     count follow the track, not the button), but let the reveal wait for the
     track to come to rest — a flick past three cards decodes one, not four.
     Settling also performs the wrap teleport, so a card scrolled off either end
     lands on the other end invisibly. */
  function caroScroll() {
    if (!caro.raf) {
      caro.raf = requestAnimationFrame(() => {
        caro.raf = null;
        caroMark(caroIndex());
      });
    }
    clearTimeout(caro.settle);
    caro.settle = setTimeout(() => {
      const n = OPEN.length;
      const track = caro.track;
      if (n > 1 && caro.slot) {
        const C = caro.slot;
        const base = (caro.base != null) ? caro.base : 0;
        const s = track.scrollLeft;
        let teleported = false;
        track.removeEventListener('scroll', caroScroll);
        if (s >= base + (n - 1) * C + C / 2) {
          track.scrollLeft = base;            // clone of the first -> card 0
          teleported = true;
        } else if (s <= base - C / 2) {
          track.scrollLeft = base + (n - 1) * C;  // clone of the last -> last card
          teleported = true;
        }
        track.addEventListener('scroll', caroScroll, { passive: true });
        if (teleported) caroMark(caroIndex());
      }
      caroMark(caroIndex());
      caroWake();
    }, 140);
  }

  function wireCarousel() {
    const track = caro.track;
    $('#caro-prev').addEventListener('click', () => caroGoTo(caro.cur - 1));
    $('#caro-next').addEventListener('click', () => caroGoTo(caro.cur + 1));
    // the track takes focus (tabindex), and the native arrow-key scroll of a
    // scrollable box moves a few px; a carousel should move a card
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); caroGoTo(caro.cur - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); caroGoTo(caro.cur + 1); }
    });
    track.addEventListener('scroll', caroScroll, { passive: true });

    // a mouse has no swipe: drag the strip, then let it settle on a card
    let drag = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
      track.classList.add('dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) drag.moved = true;
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      track.classList.remove('dragging');
      if (moved) caroGoTo(caroIndex());
    });
  }

  /* ---------------- boot ---------------- */

  Promise.all([
    fetch('data/profile.json').then((r) => r.json()),
    fetch('data/projects.json').then((r) => r.json()),
    fetch('data/open.json').then((r) => r.json())
  ]).then(([profile, projects, open]) => {
    PROFILE = profile;
    PROJECTS = projects.projects;
    OPEN = open.open || [];
    renderProfile(profile);
    renderContact(profile.contact);
    wireMenu();
    buildFilters();
    buildTumbler();
    wireTumbler();
    // the monitor chrome over the drum; the interference warps the cards, not
    // the frame — that is what makes it read as the picture, not the monitor
    Screen.mount(stage, { target: drum, inset: 4 });  // frame just inside the stage

    buildCarousel(open.open);
    wireCarousel();
    // the same chrome over the carousel, warping the strip for the same reason
    Screen.mount(caro.box, { target: caro.track, inset: 4 });

    // the webfonts change the side column's width, and a resize changes both
    // dimensions, so re-derive the whole sizing (not just the frame)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        sizeDrum(); sizeRange(); updateDrum(); sizeCarousel();
      });
    }
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sizeDrum(); sizeRange(); updateDrum();
        sizeCarousel();
        caroGoTo(caro.cur, true);   // the strip's centre moves with the track
      }, 120);
    });
  }).catch((err) => {
    $('#profile-name').textContent = 'data failed to load';
    $('#hero-tagline').textContent = 'serve this from the site root (or GitHub Pages): ' + err.message;
  });
})();
