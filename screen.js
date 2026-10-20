/* screen.js — the CRT monitor, as a thing you can mount on any box.

   A screen is chrome plus behaviour, and both are deliberately screen-space:
   the frame, the glass and the noise sit *over* whatever the box contains, so
   a screen can hold a rolling drum or a game canvas and get the same treatment
   without knowing anything about them.

     const scr = Screen.mount(box, { target: inner });

   `box` gets the frame, glass and signal layers appended. `target` is the layer
   that suffers the magnetic interference (default: the box itself) — the drum
   warps its cards, a game warps its canvas, and the chrome stays put, which is
   what makes the warping read as the picture rather than the monitor.

   Everything degrades to nothing under prefers-reduced-motion or ?fx=off.

   No dependencies; one global. */
window.Screen = (() => {
  'use strict';

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const ON = (params.get('fx') || '').toLowerCase() !== 'off' && !reduceMotion();

  const screens = [];
  let started = false;

  const node = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  /* ---------------- the chrome ---------------- */

  function mount(box, opts) {
    if (!box) return null;
    opts = opts || {};
    box.classList.add('scr');
    if (opts.inset !== undefined) box.style.setProperty('--frame-inset', opts.inset + 'px');

    const s = {
      box: box,
      target: opts.target || box,
      glitch: node('div', 'scr-glitch'),
      glass: node('div', 'scr-glass'),
      bezel: node('div', 'scr-bezel'),
      roll: node('span', 'roll'),
      tears: [node('span', 'tear'), node('span', 'tear'), node('span', 'tear')]
    };
    s.glitch.setAttribute('aria-hidden', 'true');
    s.glass.setAttribute('aria-hidden', 'true');
    s.bezel.setAttribute('aria-hidden', 'true');
    s.glitch.append(s.roll, node('span', 'scan'));
    s.tears.forEach((t) => s.glitch.append(t));
    box.append(s.glass, s.glitch, s.bezel);

    s.jump = () => rollJump(s);
    s.flash = () => tearFlash(s);
    s.corrupt = () => corrupt(s);
    screens.push(s);
    if (opts.frame === false) s.bezel.style.display = 'none';
    start();
    return s;
  }

  /* ---------------- the signal ---------------- */

  function tearFlash(s) {
    if (!ON) return;
    const t = s.tears[Math.floor(Math.random() * s.tears.length)];
    t.style.top = rand(6, 86).toFixed(1) + '%';
    t.style.height = rand(10, 40).toFixed(0) + 'px';
    t.classList.remove('on');
    void t.offsetWidth;           // flush, or the animation will not restart
    t.classList.add('on');
  }

  /* The roll drifts on a CSS loop; to make it jump we restart that animation at
     a random point in its own cycle with a negative delay, which lands it
     anywhere on the screen. Note the longhands: `animation` is a shorthand and
     includes the delay, so resetting it would wipe the offset being set. */
  function rollJump(s) {
    if (!ON || !s.roll) return;
    const cycle = parseFloat(getComputedStyle(s.roll).animationDuration) || 9;
    s.roll.style.animationName = 'none';
    void s.roll.offsetWidth;
    s.roll.style.animationDelay = (-Math.random() * cycle).toFixed(2) + 's';
    s.roll.style.animationName = '';
    // a jump at this opacity is easy to miss, so let it flare as it lands
    s.roll.classList.add('jumped');
    setTimeout(() => s.roll.classList.remove('jumped'), 130);
  }

  /* Magnetic interference: the picture is yanked right and sheared, the glass
     lifts for a frame, and the signal cannot hold — it jumps twice on the way. */
  function corrupt(s) {
    if (!ON || !s) return;
    s.target.classList.remove('interfere');
    void s.target.offsetWidth;
    s.target.classList.add('interfere');
    tearFlash(s);
    rollJump(s);
    setTimeout(() => rollJump(s), rand(70, 130));
    s.glitch.classList.add('flashed');
    setTimeout(() => s.glitch.classList.remove('flashed'), 90);
    setTimeout(() => s.target.classList.remove('interfere'), 260);
  }

  function start() {
    if (started || !ON) return;
    started = true;

    // each screen keeps its own noise, at its own pace
    screens.forEach((s, i) => {
      const tear = () => { tearFlash(s); setTimeout(tear, rand(2600, 8000)); };
      setTimeout(tear, rand(1600, 5000));
      const drift = () => { rollJump(s); setTimeout(drift, rand(5000, 14000)); };
      setTimeout(drift, rand(4000, 9000) + i * 900);
    });

    // ...but the interference runs through all of them at once, like one supply
    // sagging: that is what makes a page of screens read as one room.
    const interfere = () => {
      screens.forEach(corrupt);
      setTimeout(interfere, rand(9000, 23000));
    };
    setTimeout(interfere, rand(6000, 13000));
  }

  /* ---------------- decode ----------------
     Reveals an element's text progressively, and shows what is not decoded yet
     as raw noise: random glyphs of the same length, whitespace preserved, so a
     record reads as a fragmented store being sorted rather than text appearing
     out of nothing.

     `atomic` names subtrees that land whole — a tags or links row revealed a
     character at a time is a row of empty outlines and a lone arrow. */
  const NOISE = '0123456789ABCDEF#%&*+=<>/\\';
  const CHARS_PER_TOKEN = 4;

  function scramble(full, from) {
    let out = '';
    for (let i = from; i < full.length; i++) {
      const c = full[i];
      out += c === ' ' || c === '\n' ? c : NOISE[(Math.random() * NOISE.length) | 0];
    }
    return out;
  }

  function collect(root, atomicSel, skipSel) {
    const recs = [];
    const groups = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walk.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      const pe = n.parentElement;
      if (skipSel && pe && pe.closest && pe.closest(skipSel)) continue;
      const host = atomicSel && pe && pe.closest ? pe.closest(atomicSel) : null;
      const rec = { node: n, full: n.nodeValue, shown: null, atom: host || null, start: 0 };
      recs.push(rec);
      if (host) {
        let g = groups.find((x) => x.host === host);
        if (!g) { g = { host: host, recs: [] }; groups.push(g); }
        g.recs.push(rec);
      }
    }
    let at = 0;
    const laid = new Set();
    for (const r of recs) {
      if (r.atom) {
        if (laid.has(r.atom)) continue;
        laid.add(r.atom);
        const g = groups.find((x) => x.host === r.atom);
        const len = g.recs.reduce((a, x) => a + x.full.length, 0);
        g.start = at;
        for (const x of g.recs) { x.start = at; x.len = len; }
        at += len;
      } else {
        r.start = at;
        r.len = r.full.length;
        at += r.full.length;
      }
    }
    return { recs: recs, total: at, atoms: groups };
  }

  function paint(plan, upto) {
    for (const t of plan.recs) {
      const rel = upto - t.start;
      const n = t.atom ? (rel > 0 ? t.full.length : 0)
                       : Math.max(0, Math.min(t.full.length, rel));
      const out = n >= t.full.length ? t.full : t.full.slice(0, n) + scramble(t.full, n);
      if (t.shown !== out) { t.node.nodeValue = out; t.shown = out; }
    }
    // an undecoded tags / links row would sit there as empty outlines; hide it,
    // but keep its space so nothing reflows
    for (const g of plan.atoms) {
      const want = upto > g.start ? '' : 'hidden';
      if (g.host.style.visibility !== want) g.host.style.visibility = want;
    }
  }

  function decode(root, opts) {
    opts = opts || {};
    if (!root) return null;
    const plan = root._decode || (root._decode = collect(root, opts.atomic, opts.skip));
    const cps = opts.charsPerSecond || 60 * CHARS_PER_TOKEN;
    const ctl = { stopped: false, raf: null, shown: 0, t0: 0, painted: 0 };

    const finish = () => {
      ctl.stopped = true;
      if (ctl.raf) { cancelAnimationFrame(ctl.raf); ctl.raf = null; }
      paint(plan, plan.total);
      if (opts.done) opts.done();
    };

    // the handle is complete before any early return: with the effect off, or a
    // plan with nothing to reveal, a caller still gets something it can stop
    ctl.stop = () => {
      ctl.stopped = true;
      if (ctl.raf) { cancelAnimationFrame(ctl.raf); ctl.raf = null; }
    };
    ctl.finish = finish;

    if (!plan.total || !ON) { finish(); return ctl; }

    for (const t of plan.recs) t.shown = null;
    paint(plan, 0);
    ctl.t0 = performance.now();

    const tick = (now) => {
      if (ctl.stopped) return;
      const want = Math.min(plan.total, Math.round(((now - ctl.t0) / 1000) * cps));
      // repaint on the reveal's pace, and keep the un-decoded glyphs churning
      // even when the reveal has not moved — but not every frame, since every
      // character in the element changes when we do
      if (want !== ctl.shown || now - ctl.painted > 30) {
        ctl.shown = want;
        ctl.painted = now;
        paint(plan, want);
      }
      if (want < plan.total) { ctl.raf = requestAnimationFrame(tick); return; }
      finish();
    };
    ctl.raf = requestAnimationFrame(tick);
    return ctl;
  }

  /* ---------------- page chrome ----------------
     Both pages carry the same DOS menu and CRT toggle, so they are wired here
     rather than twice. The numbered keys travel to the main page's sections;
     `5` is the games page itself. */
  function chrome() {
    const crt = document.getElementById('crt-toggle');
    if (crt) {
      crt.addEventListener('click', () => {
        const off = document.documentElement.classList.toggle('crt-off');
        crt.setAttribute('aria-pressed', String(!off));
      });
    }
    const here = document.documentElement.dataset.page || '';
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const map = { '1': 'about', '2': 'work', '3': 'open', '4': 'contact' };
      const at = (id) => (here === 'games' ? '../#' + id : '#' + id);
      if (map[e.key]) { e.preventDefault(); location.hash = ''; location.href = at(map[e.key]); }
      else if (e.key === '5' && here !== 'games') { e.preventDefault(); location.href = 'games/'; }
    });
  }

  return {
    mount: mount,
    decode: decode,
    chrome: chrome,
    // every screen at once — one supply sagging
    corrupt: () => screens.forEach(corrupt),
    jump: () => screens.forEach(rollJump),
    flash: () => screens.forEach(tearFlash),
    get count() { return screens.length; }
  };
})();
