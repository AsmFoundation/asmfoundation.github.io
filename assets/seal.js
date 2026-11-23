// The seal: every letter of the x86-64 one-byte opcode table becomes part of a circled A. The ring spells
// the motto in the table's own letters; the A is the rest of the table, in reading order. Three animations
// bring the letters in, and the page picks a different one on every load (the owner's rule):
//   "swirl"  the letters lift off the readable table and swirl once into place;
//   "print"  a print head stamps the ring letter by letter, then prints the A row by row;
//   "orbit"  the letters circle like a galaxy, then spiral into place;
//   "static" the seal is simply there: used when the visitor prefers reduced motion.
// An animation starts only once the seal is on screen, so nobody misses it; Replay plays it again.
"use strict";

/**
 * Builds the seal over the opcode table and wires its buttons.
 * @param {HTMLElement} stage The positioned box around the table; the canvas is laid exactly over it.
 * @param {HTMLTableElement} table The filled opcode table (see buildOpcodeTable); its cells give every letter's start.
 * @param {{toggle: HTMLButtonElement, replay?: HTMLButtonElement, onMode?: function(string): void}} ui
 *   toggle switches between the seal and the readable table; replay plays the animation again; onMode is
 *   told "seal" or "table" whenever the mode changes, so the page can update its captions.
 * @param {"swirl"|"print"|"orbit"|"static"} variant How the letters arrive.
 * @returns {void}
 * @remarks Call it after document.fonts.ready: the layout measures the table's text in Martian Mono and
 *   draws the ring in Archivo, and a fallback font would put every letter in the wrong place.
 */
function buildSeal(stage, table, ui, variant) {
  const MOTTO = "FREE OPEN SOURCE ASSEMBLY SOFTWARE / ";
  const INK = [6, 47, 46], GREY = [111, 122, 128], MINT = [18, 184, 102], TEAL = [6, 112, 109], PALE = [190, 225, 222];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.className = "seal"; cv.setAttribute("role", "img");
  cv.setAttribute("aria-label", "The opcode table's letters arranged as a seal: a ring reading Free Open Source Assembly Software around the AsmFoundation A");
  stage.appendChild(cv);
  const g = cv.getContext("2d");
  let W = 0, H = 0, cx = 0, cy = 0, R = 0, glyphs = [], ringOrder = 0, aRows = 0, rowYs = [];
  let anim = null, mode = variant === "swirl" ? "table" : "seal", spin = 0, last = 0, raf = 0, played = false;

  /** Linear interpolation. @param {number} a From. @param {number} b To. @param {number} t 0..1. @returns {number} The point between. */
  const lerp = (a, b, t) => a + (b - a) * t;
  /** Clamps to 0..1. @param {number} t Any number. @returns {number} t, clamped. */
  const clamp = (t) => Math.max(0, Math.min(1, t));
  /** Cubic ease in and out. @param {number} t 0..1. @returns {number} The eased progress. */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  /** A colour between two RGB triples. @param {number[]} a From. @param {number[]} b To. @param {number} t 0..1. @returns {string} A CSS rgb() colour. */
  const rgb = (a, b, t) => `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  let seed = 7;
  /** A seeded pseudo-random number (Park-Miller), so every visit draws the same orbits. @returns {number} 0..1. */
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /**
   * Measures every letter of the table and assigns it a place in the seal: ring letters come from matching
   * table letters, the rest fill the logo's blocks in reading order.
   * @returns {void}
   * @remarks Resizing a canvas clears it, even to the same size, so the bitmap is resized only when the
   *   stage's size really changed; the caller redraws.
   */
  function layout() {
    const r = stage.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    const pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    cv.style.width = W + "px"; cv.style.height = H + "px"; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2; R = Math.min(W, H) / 2 - 22;
    const src = [];
    g.font = '700 10px "Martian Mono"'; const unit = g.measureText("M").width / 10;
    // every visible character of every cell: the mnemonic (<b>, 8.6px bold) and the operands (<i>, 7px)
    table.querySelectorAll("td").forEach(td => {
      [["b", 8.6, 700], ["i", 7, 400]].forEach(([sel, px, wt]) => {
        const el = td.querySelector(sel), text = el ? el.textContent : "";
        if (!text) return;
        const e = el.getBoundingClientRect(), cw = unit * px, tw = cw * text.length;
        const x0 = e.left - r.left + (e.width - tw) / 2, y = e.top - r.top + e.height / 2;
        [...text].forEach((ch, k) => { if (ch.trim()) src.push({ ch, sx: x0 + cw * (k + .5), sy: y, sp: px, wt, a: td.dataset.a }); });
      });
    });
    // the ring: the motto repeated to close the circle, each letter taken from a matching table letter
    g.font = '800 19px "Archivo"';
    const circ = 2 * Math.PI * R;
    let text = MOTTO; while (g.measureText(text + MOTTO).width < circ * .96) text += MOTTO;
    const widths = [...text].map(c => g.measureText(c).width), extra = (circ - widths.reduce((s, w) => s + w, 0)) / text.length;
    const pool = new Map(); src.forEach((s, i) => { const k = s.ch.toUpperCase(); if (!pool.has(k)) pool.set(k, []); pool.get(k).push(i); });
    const used = new Set(), ring = [];
    let acc = 0;
    [...text].forEach((ch, k) => {
      const w = widths[k] + extra, ang = -Math.PI / 2 + (acc + w / 2) / R; acc += w;
      if (!ch.trim()) return;
      let pick = (pool.get(ch) || []).find(i => !used.has(i));
      if (pick === undefined) pick = src.findIndex((s, i) => !used.has(i) && s.wt === 400);   // "/" has no twin: borrow an operand letter
      used.add(pick); ring.push({ i: pick, ch, ang });
    });
    // the A: the logo's eleven blocks inside the ring, filled with every remaining letter, in table order
    const blocks = [[559,214,135,135,1],[414,372,129,125,1],[559,372,135,125,1],[712,372,127,125,1],[349,524,138,121,0],[766,524,138,121,0],[288,665,139,124,0],[451,665,351,121,0],[826,665,139,124,0],[246,811,156,129,0],[850,811,158,129,0]];
    const s = (R - 24) / 465;
    const rects = blocks.map(([x, y, w, h, m]) => ({ x: cx + (x - 627) * s, y: cy + (y - 674) * s, w: w * s, h: h * s, m }));
    const rest = src.map((_, i) => i).filter(i => !used.has(i));
    const area = rects.reduce((t, q) => t + q.w * q.h, 0);
    // shrink the letter grid until every remaining letter has a slot
    let ch = Math.sqrt(area / (.62 * rest.length)), slots = [];
    for (let tries = 0; tries < 40; tries++) {
      const cw = ch * .62; slots = [];
      rects.forEach(q => { const cols = Math.floor(q.w / cw), rows = Math.floor(q.h / ch);
        const ox = q.x + (q.w - cols * cw) / 2 + cw / 2, oy = q.y + (q.h - rows * ch) / 2 + ch / 2;
        for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) slots.push({ x: ox + cc * cw, y: oy + rr * ch, m: q.m }); });
      if (slots.length >= rest.length) break; ch *= .97;
    }
    slots.sort((p, q) => p.y - q.y || p.x - q.x);
    const step = slots.length / rest.length, rowY = [...new Set(slots.map(q => Math.round(q.y)))];
    glyphs = src.map(s0 => ({ ...s0 }));
    rest.forEach((i, k) => { const sl = slots[Math.floor(k * step)];
      Object.assign(glyphs[i], { tx: sl.x, ty: sl.y, tp: ch * .92, rot: 0, ring: false, col: sl.m ? MINT : TEAL, tc: glyphs[i].ch, row: rowY.indexOf(Math.round(sl.y)), seq: k }); });
    ring.forEach(({ i, ch: c, ang }, k) => Object.assign(glyphs[i], { tx: cx + R * Math.cos(ang), ty: cy + R * Math.sin(ang), tp: 19, rot: ang + Math.PI / 2, ang, ring: true, col: INK, tc: c, seq: k }));
    ringOrder = ring.length; aRows = rowY.length; rowYs = rowY;
    seed = 7;
    glyphs.forEach(q => {
      q.r0 = Math.hypot(q.sx - cx, q.sy - cy); q.a0 = Math.atan2(q.sy - cy, q.sx - cx);
      q.r1 = Math.hypot(q.tx - cx, q.ty - cy); q.a1 = Math.atan2(q.ty - cy, q.tx - cx);
      q.delay = (q.r0 / (R * 1.4)) * 420 + rnd() * 260;
      q.or = R * (.15 + rnd() * 1.1); q.oa = rnd() * 2 * Math.PI; q.ow = .0011 * Math.sqrt(R / q.or);
    });
  }

  /**
   * Where a glyph is at a moment of the current animation.
   * @param {object} q The glyph.
   * @param {number} t Milliseconds into the animation.
   * @returns {Array|null} [x, y, rotation, size, colour mix 0..1, show the seal's letter, alpha], or null when not drawn yet.
   */
  function at(q, t) {
    const ringRot = q.ring ? q.rot + spin : 0, ta = q.a1 + (q.ring ? spin : 0);
    const seal = [cx + q.r1 * Math.cos(ta), cy + q.r1 * Math.sin(ta), ringRot, q.tp, 1, true, 1];
    if (!anim) return mode === "seal" ? seal : null;
    const k = anim.kind;
    if (k === "swirl-in" || k === "swirl-out") {
      // polar swirl: one extra turn and a bulge, staggered by distance from the centre
      const p = clamp((k === "swirl-in" ? t - q.delay : t - (680 - q.delay)) / 2000), e = ease(k === "swirl-in" ? p : 1 - p);
      const turn = ta - q.a0 + 2 * Math.PI, a = q.a0 + turn * e, rad = lerp(q.r0, q.r1, e) + Math.sin(Math.PI * e) * R * .18;
      return [cx + rad * Math.cos(a), cy + rad * Math.sin(a), ringRot * e, lerp(q.sp, q.tp, e), e, e > .5, 1];
    }
    if (k === "print") {
      // the ring is stamped clockwise, 17 ms a letter; then the A row by row, each row left to right
      const start = q.ring ? q.seq * 17 : ringOrder * 17 + 250 + q.row * 30 + (q.tx - cx + R) * .9;
      const p = clamp((t - start) / 170);
      if (p <= 0) return null;
      return [seal[0], seal[1], ringRot, q.tp * lerp(q.ring ? 2.2 : 1.8, 1, ease(p)), 1, true, p];
    }
    if (k === "orbit") {
      // free orbits first (outer ones longer), then a spiral of at most half a turn to the target
      const free = 1500 + (q.or / (R * 1.25)) * 700, p = clamp((t - free) / 2100), e = ease(p);
      const oa = q.oa + q.ow * Math.min(t, free + 2100 * p) * (1 - e * .4);
      const ox = cx + q.or * Math.cos(oa), oy = cy + q.or * Math.sin(oa);
      const a0 = Math.atan2(oy - cy, ox - cx), turn = ((ta - a0) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      const a = a0 + turn * e, rad = lerp(q.or, q.r1, e);
      return [cx + rad * Math.cos(a), cy + rad * Math.sin(a), ringRot * e, lerp(8, q.tp, e), lerp(.35, 1, e), e > .5, lerp(.55, 1, Math.min(1, t / 400))];
    }
    return seal;
  }

  /** How long the current animation runs. @returns {number} Milliseconds; 0 when nothing plays. */
  function length() {
    if (!anim) return 0;
    if (anim.kind === "print") return ringOrder * 17 + 250 + aRows * 30 + 2 * R * .9 + 400;
    if (anim.kind === "orbit") return 1500 + 700 + 2100 + 100;
    return 2600;
  }

  /**
   * Draws one frame and schedules the next while anything moves.
   * @param {number} now The frame's timestamp from requestAnimationFrame.
   * @returns {void}
   * @remarks The loop stops when the table is shown again, and after one frame under reduced motion; a
   *   finished seal keeps turning slowly (a full turn in 140 s) otherwise.
   */
  function draw(now) {
    const dt = last ? now - last : 16; last = now;
    const t = anim ? now - anim.t0 : 0, done = !anim || t >= length();
    if (done && anim) { if (anim.kind === "swirl-out") mode = "table"; anim = null; }
    if (!anim && mode === "seal" && !reduce) spin += dt * (2 * Math.PI / 140000);
    g.clearRect(0, 0, W, H);
    const guide = anim && anim.kind === "swirl-out" ? 1 - clamp(t / 2400) : anim && anim.kind === "swirl-in" ? clamp((t - 600) / 1600) : mode === "seal" ? 1 : 0;
    g.globalAlpha = guide; g.strokeStyle = "#062f2e"; g.lineWidth = 1;
    if (guide > 0) [R + 17, R - 17].forEach(rr => { g.beginPath(); g.arc(cx, cy, rr, 0, 2 * Math.PI); g.stroke(); });
    if (anim && anim.kind === "print") {
      // the print head: a short bar across the ring where the next letter lands, then a bar under the row printing last
      const ringDone = ringOrder * 17, head = t < ringDone ? -Math.PI / 2 + (t / ringDone) * 2 * Math.PI : null;
      g.globalAlpha = 1; g.strokeStyle = "#06706d"; g.lineWidth = 3;
      if (head !== null) { g.beginPath(); g.moveTo(cx + (R - 30) * Math.cos(head), cy + (R - 30) * Math.sin(head)); g.lineTo(cx + (R + 30) * Math.cos(head), cy + (R + 30) * Math.sin(head)); g.stroke(); }
      else { const row = Math.min(aRows - 1, Math.floor((t - ringDone - 250) / 30)); if (row >= 0) { const y = rowYs[row] + 7; g.beginPath(); g.moveTo(cx - R * .72, y); g.lineTo(cx + R * .72, y); g.stroke(); } }
    }
    g.globalAlpha = 1; g.textAlign = "center"; g.textBaseline = "middle";
    for (const q of glyphs) {
      const s = at(q, t); if (!s) continue;
      const [x, y, rot, px, mix, target, alpha] = s, ringFont = q.ring && target;
      g.save(); g.globalAlpha = alpha; g.translate(x, y); if (rot) g.rotate(rot);
      const base = ringFont ? 19 : 10; g.scale(px / base, px / base);
      g.font = ringFont ? '800 19px "Archivo"' : `${q.wt} 10px "Martian Mono"`;
      const from = q.a === "a-m" ? INK : q.a === "a-t" ? PALE : GREY;
      g.fillStyle = anim && anim.kind === "print" ? rgb(q.ring ? TEAL : PALE, q.col, alpha) : rgb(from, q.col, mix);
      g.fillText(target ? q.tc : q.ch, 0, 0); g.restore();
    }
    if (mode === "table" && !anim) { cv.style.visibility = "hidden"; table.classList.remove("lifted"); raf = 0; return; }
    if (reduce && !anim) { raf = 0; return; }
    raf = requestAnimationFrame(draw);
  }

  /**
   * Starts an animation: lays the letters out again (the stage may have changed size) and runs the loop.
   * @param {"swirl-in"|"swirl-out"|"print"|"orbit"|"static"} kind Which animation; swirl-out sends the letters back to the table.
   * @returns {void}
   */
  function start(kind) {
    layout(); last = 0; anim = { kind, t0: performance.now() };
    if (kind !== "swirl-out") { mode = "seal"; table.classList.add("lifted"); cv.style.visibility = "visible"; }
    if (reduce) anim = null;
    if (!raf) raf = requestAnimationFrame(draw);
    ui.toggle.textContent = kind === "swirl-out" ? "Assemble the seal" : "Read the table";
    if (ui.onMode) ui.onMode(kind === "swirl-out" ? "table" : "seal");
  }
  /** Plays this page's variant from the start. @returns {void} */
  const play = () => start(variant === "static" ? "static" : variant === "swirl" ? "swirl-in" : variant);

  // Initial state. The page's head script lifted the table already for every variant that starts as the seal
  // (an attribute on <html>, so the table never flashes); the table's own class takes over from here, so
  // "Read the table" can lower it again.
  layout();
  if (variant === "swirl") { cv.style.visibility = "hidden"; ui.toggle.textContent = "Assemble the seal"; if (ui.onMode) ui.onMode("table"); }
  else {
    table.classList.add("lifted"); cv.style.visibility = "visible";
    if (variant === "static" || reduce) { anim = null; raf = requestAnimationFrame(draw); ui.toggle.textContent = "Read the table"; if (ui.onMode) ui.onMode("seal"); }
  }
  document.documentElement.removeAttribute("data-seal");
  // play once the seal is half on screen and the tab is visible, never unseen in a background tab
  if (variant !== "static" && !reduce) {
    const io = new IntersectionObserver(es => {
      if (!played && document.visibilityState === "visible" && es.some(e => e.isIntersecting)) { played = true; io.disconnect(); setTimeout(play, variant === "swirl" ? 1300 : 200); }
    }, { threshold: .5 });
    io.observe(stage);
  }
  ui.toggle.addEventListener("click", () => start(mode === "seal" && !(anim && anim.kind === "swirl-out") ? "swirl-out" : "swirl-in"));
  if (ui.replay) ui.replay.addEventListener("click", () => { if (variant === "swirl") start("swirl-in"); else play(); });
  // a resize re-measures, and resizing the canvas clears it: redraw when no loop is running (reduced motion, static)
  addEventListener("resize", () => { if (mode === "seal" && !anim) { layout(); if (!raf) raf = requestAnimationFrame(draw); } });
}
