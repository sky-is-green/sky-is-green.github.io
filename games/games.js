/* games.js — the arcade. Two games and an embedded toy, each on a screen from
   screen.js so they get the same frame, glass, scanlines and interference as
   the drum on the main page.

   Games draw into a small fixed canvas (320×200) which CSS scales up with
   `image-rendering: pixelated` — so the phosphor dots are real pixels rather
   than a blur, and the whole thing stays cheap. */
(() => {
  'use strict';

  const $ = (sel, root) => (root === null ? null : (root || document).querySelector(sel));
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = 320, H = 200;
  const PAPER = '#08120a';
  const INK = '#5df08a';
  const DIM = '#2f9e5b';

  /* ---------------- the arcade ---------------- */

  const cabs = [];        // { el, canvas, game, screen, hud, plate, running }
  let active = null;      // only one game runs at a time

  function mount(el) {
    // a cabinet with no canvas (the embedded toy) still gets the screen chrome
    const canvas = $('.cab-canvas', el);
    const cab = {
      el: el,
      card: el.closest('.cab') || el,   // the .scr, and the cabinet it sits in
      canvas: canvas,
      ctx: canvas ? canvas.getContext('2d') : null,
      screen: Screen.mount(el, { target: canvas || el }),
      hud: $('.cab-hud', el),
      plate: $('.cab-plate', el),
      game: el.dataset.game,
      rank: cabs.length,      // the order the rail keeps when a game comes back
      running: false,
      keys: new Set(),
      pointer: { x: W / 2, y: 0, down: false, sx: 0, sy: 0 }
    };
    if (cab.ctx) cab.ctx.imageSmoothingEnabled = false;
    cabs.push(cab);
    return cab;
  }

  const playable = (cab) => !!(cab && cab.canvas && (cab.game === 'snake' || cab.game === 'breakout'));

  /* ---------------- the stage ----------------
     One screen at a time sits in the middle of the arcade: the toy by default,
     and after that whichever screen was last put to use, so a game can be
     played at the full size of the monitor. A game that takes the stage is
     moved out of the rail — a canvas keeps its pixels across a move — while the
     toy is never moved in the DOM at all: reparenting an iframe reloads it, and
     the drawing would go with it. It is placed by CSS instead (see the
     .cade-swapped rules in styles.css). Under the single-column breakpoint
     there is no rail to swap into and none of it applies. */
  const cadeEl = $('.cade');
  const railEl = $('.cade-games');
  const oneColumn = () => window.matchMedia('(max-width: 880px)').matches;
  let toyCab = null;
  let centred = null;

  // the rail keeps its original order — snake above breakout — when one returns
  const railNext = (cab) => [...railEl.children].find((el) => {
    const c = cabs.find((x) => x.card === el);
    return c && c.rank > cab.rank;
  }) || null;

  function stage(cab) {
    // with one column every screen is already the full width of the screen and
    // there is no rail to swap into: moving anything would only reorder the
    // stack under the finger that just started the game
    if (!cab || cab === centred || !cadeEl || !railEl || oneColumn()) return;
    centred = cab;
    // moving a node runs the removal steps, which drop focus to the body — and
    // Enter-to-go-again reads document.activeElement, so put it back
    const wasFocused = document.activeElement;
    // a fitted height belongs to the stage; in the rail the CSS aspect-ratio
    // owns the height, and a fitted one would burst the column
    if (toyCab && cab !== toyCab) toyCab.el.style.height = '';
    cabs.forEach((c) => {
      const on = c === cab;
      const toy = !playable(c);
      c.card.classList.toggle('cab-staged', on && !toy);
      c.card.classList.toggle('cab-railed', !on && toy);
      if (toy) return;
      if (on) cadeEl.insertBefore(c.card, toyCab ? toyCab.card : null);
      else if (c.card.parentElement !== railEl) railEl.insertBefore(c.card, railNext(c));
    });
    cadeEl.classList.toggle('cade-swapped', cab !== toyCab);
    if (wasFocused && wasFocused.classList.contains('scr')
        && document.activeElement !== wasFocused) {
      try { wasFocused.focus({ preventScroll: true }); } catch (e) { wasFocused.focus(); }
    }
  }

  function start(cab) {
    if (!playable(cab)) return;
    if (active && active !== cab) stop(active);
    active = cab;
    cab.running = true;
    stage(cab);                 // a screen in use takes the middle of the arcade
    cab.el.classList.add('playing');
    cab.game === 'snake' ? snake.start(cab) : breakout.start(cab);
  }

  function stop(cab) {
    if (!cab.running) { if (active === cab) active = null; return; }
    cab.running = false;
    cab.el.classList.remove('playing');
    const g = cab.game === 'snake' ? snake : breakout;
    if (g.stop) g.stop(cab);
    if (active === cab) active = null;
  }

  function over(cab, label) {
    cab.running = false;
    if (active === cab) active = null;
    cab.el.classList.remove('playing');
    cab.el.classList.add('over');
    const pt = $('.plate-title', cab.el);
    if (pt) pt.textContent = label;
    const hint = $('.cab-hint', cab.el);
    if (hint) hint.innerHTML = 'tap or press <span class="key">enter</span> to go again';
    cab.plate.style.opacity = '';
    // the supply does not like losing
    if (cab.screen) cab.screen.corrupt();
  }

  function ready(cab) {
    cab.el.classList.remove('over');
    const pt = $('.plate-title', cab.el);
    if (pt) pt.textContent = cab.game === 'snake' ? 'Snake' : 'Breakout';
    const hint = $('.cab-hint', cab.el);
    if (hint) hint.innerHTML = 'tap or press <span class="key">enter</span>';
  }

  function score(cab, s, hi) {
    const a = $('.hud-score', cab.hud), b = $('.hud-hi', cab.hud);
    if (a) a.textContent = String(s).padStart(3, '0');
    if (b) b.textContent = 'HI ' + String(hi).padStart(3, '0');
  }

  const hiscores = {};
  const best = (k, v) => (hiscores[k] = Math.max(hiscores[k] || 0, v));

  /* ---------------- snake ---------------- */

  const snake = (() => {
    const COLS = 40, ROWS = 25, CELL = 8;
    const TICK = 110;

    function start(cab) {
      cab.state = { body: [{ x: 20, y: 12 }, { x: 19, y: 12 }, { x: 18, y: 12 }],
                    dir: { x: 1, y: 0 }, queued: null, food: null, s: 0, t: 0, last: 0, rate: TICK };
      place(cab);
      score(cab, 0, hiscores.snake || 0);
      draw(cab);                                  // visible even before rAF runs
      cab.raf = requestAnimationFrame((now) => loop(cab, now));
    }

    function place(cab) {
      const st = cab.state;
      for (let tries = 0; tries < 500; tries++) {
        const c = { x: (Math.random() * COLS) | 0, y: (Math.random() * ROWS) | 0 };
        if (!st.body.some((b) => b.x === c.x && b.y === c.y)) { st.food = c; return; }
      }
    }

    function turn(cab, x, y) {
      const st = cab.state;
      if (!st) return;
      const cur = st.queued || st.dir;
      if (cur.x === -x && cur.y === -y) return;   // no folding back
      st.queued = { x: x, y: y };
    }

    function step(cab) {
      const st = cab.state;
      if (st.queued) { st.dir = st.queued; st.queued = null; }
      const head = { x: st.body[0].x + st.dir.x, y: st.body[0].y + st.dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) return die(cab, 'WALL');
      if (st.body.some((b) => b.x === head.x && b.y === head.y)) return die(cab, 'TAIL');
      st.body.unshift(head);
      if (head.x === st.food.x && head.y === st.food.y) {
        st.s++;
        st.rate = Math.max(55, TICK - st.s * 2);
        score(cab, st.s, best('snake', st.s));
        place(cab);
      } else {
        st.body.pop();
      }
    }

    function die(cab, why) {
      const pt = $('.plate-title', cab.el);
      const st = cab.state;
      over(cab, (why === 'WALL' ? 'WALL' : 'TAIL') + ' · ' + st.s);
      if (!reduceMotion() && cab.screen) cab.screen.corrupt();
    }

    function draw(cab) {
      const st = cab.state, c = cab.ctx;
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      // a faint dot grid, so the field reads as a matrix rather than a void
      c.fillStyle = 'rgba(93,240,138,0.07)';
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) c.fillRect(x * CELL + 3, y * CELL + 3, 2, 2);
      c.fillStyle = INK;
      c.fillRect(st.food.x * CELL + 1, st.food.y * CELL + 1, CELL - 2, CELL - 2);
      st.body.forEach((b, i) => {
        c.fillStyle = i === 0 ? '#c8ffdc' : INK;
        c.fillRect(b.x * CELL, b.y * CELL, CELL - 1, CELL - 1);
      });
    }

    function loop(cab, now) {
      if (!cab.running) return;
      const st = cab.state;
      if (!st.last) st.last = now;
      while (now - st.last >= st.rate) { st.last += st.rate; step(cab); if (!cab.running) return; }
      draw(cab);
      cab.raf = requestAnimationFrame((t) => loop(cab, t));
    }

    return { start, stop: (cab) => cancelAnimationFrame(cab.raf), turn };
  })();

  /* ---------------- breakout ---------------- */

  const breakout = (() => {
    const PAD_W = 44, PAD_H = 4, BALL = 3;
    const COLS = 10, ROWS = 5, BW = 28, BH = 8, BX = 8, BY = 22, GAP = 2;

    function start(cab) {
      cab.state = { level: 1, lives: 3, s: 0, px: W / 2 - PAD_W / 2, bx: W / 2, by: H - 30,
                    vx: 0, vy: 0, stuck: true, bricks: wall(1), last: 0 };
      score(cab, 0, hiscores.breakout || 0);
      draw(cab);                                  // visible even before rAF runs
      cab.raf = requestAnimationFrame((now) => loop(cab, now));
    }

    function wall(level) {
      const out = [];
      for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
        // the top rows are worth more, and take two hits from level 2
        out.push({ x: BX + col * (BW + GAP), y: BY + r * (BH + GAP), hp: level > 1 && r === 0 ? 2 : 1,
                   points: ROWS - r });
      }
      return out;
    }

    function serve(cab) {
      const st = cab.state;
      st.stuck = true;
      st.bx = st.px + PAD_W / 2; st.by = H - 26; st.vx = 0; st.vy = 0;
    }

    function launch(cab) {
      const st = cab.state;
      if (!st.stuck) return;
      st.stuck = false;
      const speed = 1.5 + st.level * 0.25;
      st.vx = speed * (Math.random() < 0.5 ? -0.6 : 0.6);
      st.vy = -Math.sqrt(Math.max(0.2, speed * speed - st.vx * st.vx));
    }

    function step(cab, dt) {
      const st = cab.state;
      if (st.stuck) { st.bx = st.px + PAD_W / 2; return; }
      st.bx += st.vx * dt; st.by += st.vy * dt;
      if (st.bx < BALL) { st.bx = BALL; st.vx = Math.abs(st.vx); }
      if (st.bx > W - BALL) { st.bx = W - BALL; st.vx = -Math.abs(st.vx); }
      if (st.by < BALL) { st.by = BALL; st.vy = Math.abs(st.vy); }
      // paddle
      if (st.vy > 0 && st.by > H - 14 && st.by < H - 6 && st.bx > st.px - BALL && st.bx < st.px + PAD_W + BALL) {
        const off = (st.bx - (st.px + PAD_W / 2)) / (PAD_W / 2);
        const speed = Math.min(3.2, Math.hypot(st.vx, st.vy) * 1.02);
        st.vx = off * speed * 0.85;
        st.vy = -Math.sqrt(Math.max(0.2, speed * speed - st.vx * st.vx));
        st.by = H - 14;
      }
      // bricks
      for (let i = 0; i < st.bricks.length; i++) {
        const b = st.bricks[i];
        if (!b.hp) continue;
        if (st.bx > b.x - BALL && st.bx < b.x + BW + BALL && st.by > b.y - BALL && st.by < b.y + BH + BALL) {
          // bounce off whichever face is nearer
          const dx = Math.min(Math.abs(st.bx - b.x), Math.abs(st.bx - (b.x + BW)));
          const dy = Math.min(Math.abs(st.by - b.y), Math.abs(st.by - (b.y + BH)));
          if (dx < dy) st.vx = -st.vx; else st.vy = -st.vy;
          b.hp--;
          st.s += b.points;
          score(cab, st.s, best('breakout', st.s));
          break;
        }
      }
      st.bricks = st.bricks.filter((b) => b.hp > 0);
      if (!st.bricks.length) {
        st.level++;
        st.bricks = wall(st.level);
        serve(cab);
        return;
      }
      if (st.by > H + BALL) {
        st.lives--;
        if (cab.screen) cab.screen.corrupt();
        if (st.lives <= 0) { over(cab, 'OUT · ' + st.s); return; }
        score(cab, st.s, hiscores.breakout || 0);
        serve(cab);
      }
    }

    function draw(cab) {
      const st = cab.state, c = cab.ctx;
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      st.bricks.forEach((b) => {
        c.fillStyle = b.points >= 4 ? INK : b.points >= 2 ? DIM : '#1f6b41';
        c.fillRect(b.x, b.y, BW, BH);
      });
      c.fillStyle = '#c8ffdc';
      c.fillRect(st.px, H - 8, PAD_W, PAD_H);
      c.fillStyle = INK;
      c.fillRect(st.bx - 1, st.by - 1, BALL + 2, BALL + 2);
      // lives as blocks, bottom left
      c.fillStyle = DIM;
      for (let i = 0; i < st.lives; i++) c.fillRect(4 + i * 7, H - 14, 5, 3);
    }

    function loop(cab, now) {
      if (!cab.running) return;
      const st = cab.state;
      if (!st.last) st.last = now;
      const dt = Math.min(3, (now - st.last) / 16.7);
      st.last = now;
      // move in small slices: a brick is 8px of a 320px field, and a ball at
      // 3px/frame would otherwise land past a row without ever touching it
      const slices = Math.max(1, Math.ceil(Math.hypot(st.vx, st.vy) * dt / 3));
      for (let i = 0; i < slices; i++) { step(cab, dt / slices); if (!cab.running) return; }
      if (cab.pointer.down && st.stuck) launch(cab);
      if (!cab.running) return;
      draw(cab);
      cab.raf = requestAnimationFrame((t) => loop(cab, t));
    }

    return { start, stop: (cab) => cancelAnimationFrame(cab.raf), launch };
  })();

  /* ---------------- input ---------------- */

  const KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  };

  function wireInput() {
    document.addEventListener('keydown', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      // start / restart whichever cabinet is under the cursor, else the first
      if (k === 'Enter') {
        const t = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.scr') : null;
        const cab = [cabs.find((c) => c.el === t), active, cabs[0]].find(playable);
        if (cab) { e.preventDefault(); if (!cab.running) { ready(cab); start(cab); } else if (cab.game === 'breakout') breakout.launch(cab); }
        return;
      }
      if (active && active.game === 'snake' && KEYS[k]) {
        e.preventDefault();
        snake.turn(active, KEYS[k][0], KEYS[k][1]);
        return;
      }
      if (active && active.game === 'breakout') {
        if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); active.state.px = Math.max(0, active.state.px - 18); }
        if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); active.state.px = Math.min(W - 44, active.state.px + 18); }
        if (k === ' ') { e.preventDefault(); breakout.launch(active); }
      }
    });

    cabs.filter(playable).forEach(wireCabinet);
  }

  /* A finger and a mouse produce the same events but cannot share one gesture:
     a mouse points (the paddle goes where the cursor is), a finger has to drag
     it there. Snake is steered by swipes either way — a drag on a grid game has
     no other sensible reading. The two cabinets also carry
     `touch-action: none` (see the .scr[data-game] rule), without which the
     browser claims the drag for scrolling and cancels the pointer before any of
     this runs. */
  const SWIPE = 20;   // px of travel before a drag counts as a direction

  function wireCabinet(cab) {
    const box = cab.el;
    const aim = (clientX) => {
      if (!cab.state) return;              // hovering an unstarted cabinet
      const r = cab.canvas.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * W;
      cab.state.px = Math.max(0, Math.min(W - 44, x - 22));
    };
    const release = () => { cab.pointer.down = false; };

    box.addEventListener('pointerdown', (e) => {
      if (!playable(cab)) return;          // the embedded toy keeps its clicks
      e.preventDefault();
      box.focus();
      // capture, so a drag that wanders off the screen keeps steering rather
      // than stopping mid-gesture
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
      cab.pointer.down = true;
      cab.pointer.sx = e.clientX;
      cab.pointer.sy = e.clientY;
      if (!cab.running) { ready(cab); start(cab); return; }
      if (cab.game === 'breakout') { aim(e.clientX); breakout.launch(cab); }
    });

    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);   // a gesture the browser took away

    box.addEventListener('pointermove', (e) => {
      if (cab.game === 'breakout') {
        // a mouse aims by hovering; a finger only while it is down
        if (cab.pointer.down || e.pointerType === 'mouse') aim(e.clientX);
        return;
      }
      if (cab.game !== 'snake' || !cab.pointer.down) return;
      const dx = e.clientX - cab.pointer.sx, dy = e.clientY - cab.pointer.sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;   // a tap, not a swipe
      if (Math.abs(dx) > Math.abs(dy)) snake.turn(cab, dx > 0 ? 1 : -1, 0);
      else snake.turn(cab, 0, dy > 0 ? 1 : -1);
      // reset the origin, so one long drag can keep steering
      cab.pointer.sx = e.clientX;
      cab.pointer.sy = e.clientY;
    });
  }

  /* ---------------- the embedded toy ----------------
     PixelQR is an application in a frame, so it gets exactly the height it
     asks for rather than a guess: a scrollbar inside a CRT bezel looks like a
     bug, and the guess is wrong at every other window size. It is same-origin,
     so the height can simply be read — and re-read, since the layout reflows
     when the column width changes.

     It is also served from its own repository at its own project page, so it
     can genuinely be absent. A frame that cannot load still fires `load` — on
     GitHub's 404 page — so the path is fetched first and the frame is only
     pointed at it once it answers; otherwise the bezel would present a 404 as
     if it were the toy. */
  function fitFrame(cab) {
    const frame = cab.el.querySelector('iframe');
    if (!frame) return;
    const CHROME = 24;   // the two frame insets
    let live = true;
    const update = () => {
      if (!live || !frame.contentWindow) return;
      // in the rail the screen is a small fixed-aspect plate, not a stage
      if (cab.card.classList.contains('cab-railed') && !oneColumn()) return;
      let h = 0;
      try {
        const d = frame.contentDocument;
        if (!d || d.URL === 'about:blank') return;
        h = d.documentElement.scrollHeight;
      } catch (e) { h = 0; }               // not same-origin: leave the CSS height
      if (!h) return;
      const want = h + CHROME;
      const cur = cab.el.getBoundingClientRect().height;
      if (Math.abs(want - cur) > 3) cab.el.style.height = want + 'px';
    };
    frame.addEventListener('load', () => {
      update();
      // touching the toy brings it back to the middle, whichever game has it
      if (cab === toyCab) {
        try {
          const doc = frame.contentDocument;
          ['pointerup', 'keydown'].forEach((t) => doc.addEventListener(t, () => stage(cab)));
        } catch (e) { /* not same-origin: leave it where it is */ }
      }
    });
    const timer = setInterval(update, 600);

    const src = frame.getAttribute('data-src');
    if (!src) return;
    fetch(src, { cache: 'no-store' })
      .then((r) => {
        if (r.ok) frame.setAttribute('src', src);
        else absent(cab, r.status, timer);
      })
      .catch(() => absent(cab, 0, timer));
  }

  function absent(cab, status, timer) {
    // note cab.el is the .scr, not the cabinet: the foot lives on the article
    const card = cab.el.closest('.cab') || cab.el;
    clearInterval(timer);
    cab.el.classList.add('missing');
    cab.el.style.height = '';   // fitFrame() writes the fitted height here
    const note = $('.cab-fallback', cab.el);
    if (note) {
      note.innerHTML = 'The toy is its own little application in its own repository, served here from '
        + '<code>/pixelqr/</code>: that path answered '
        + (status ? '<code>' + status + '</code>' : 'nothing') + ', so there is nothing to frame. '
        + '<a href="https://github.com/sky-is-green/pixelqr" target="_blank" rel="noopener">Read the source on GitHub ↗</a>';
    }
    const full = $('.cab-foot a', card);   // this one would 404 too
    if (full) { full.href = 'https://github.com/sky-is-green/pixelqr'; full.textContent = 'read the source on GitHub ↗'; }
  }

  /* ---------------- boot ---------------- */

  document.querySelectorAll('.scr[data-game]').forEach((el) => {
    const cab = mount(el);
    if (cab.canvas) { cab.el.tabIndex = 0; ready(cab); }
  });
  toyCab = cabs.find((c) => c.game === 'pixelqr') || null;
  centred = toyCab;                       // the toy starts on the stage
  wireInput();
  cabs.filter((c) => c.el.dataset.game === 'pixelqr').forEach(fitFrame);

  // the breakpoint can move under a railed toy: the fitted height is only right
  // on the stage, so drop it and let the rail's aspect-ratio take over
  window.addEventListener('resize', () => {
    if (toyCab && centred !== toyCab) toyCab.el.style.height = '';
  });

  // using the toy brings it back to the middle. Inside the frame that is heard
  // from the toy's own document (see fitFrame); the cabinet around it answers
  // too, so the screen is reachable even when the frame never loaded — but not
  // through the links in its foot, which go somewhere else entirely.
  if (toyCab) toyCab.card.addEventListener('pointerup', (e) => {
    if (e.target.closest && e.target.closest('a')) return;
    stage(toyCab);
  });

  // boot the standby titles the way the project records boot, then leave them
  cabs.filter(playable).forEach((cab, i) => {
    setTimeout(() => Screen.decode($('.plate-title', cab.el), { charsPerSecond: 150 }), 260 + i * 320);
  });

  // a small deliberate API, for poking at it from the console
  window.Cade = {
    start: (game) => { const c = cabs.find((x) => x.game === game); if (c) { ready(c); start(c); } return !!c; },
    stop: () => active && stop(active),
    state: (game) => { const c = cabs.find((x) => x.game === game); return c ? c.state : null; },
    stage: (game) => { const c = cabs.find((x) => x.game === game); if (c) stage(c); return !!c; },
    get running() { return active ? active.game : null; },
    get centred() { return centred ? centred.game : null; }
  };
  Screen.chrome();
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
