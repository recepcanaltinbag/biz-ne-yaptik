// Bölüm 2 — Kurtarıcı Kurbağa (Avustralya, 1935–2025)
(() => {
  'use strict';
  const M = window.ToadModel;
  const $ = id => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const smooth = M.smooth;
  const FAST = /[?&]hizli\b/.test(location.search) ? 6 : 1;
  const TOAD_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Cane_toad_%28Bufo_marinus%29.jpg/960px-Cane_toad_%28Bufo_marinus%29.jpg';
  const INK = [43, 58, 46];

  // Tarihî senaryo (karşılaştırma için)
  const HISTORY = M.run({});
  const H_END = HISTORY.hist[HISTORY.hist.length - 1];
  const fmtToads = n => n >= 1e6 ? `${Math.round(n / 1e6)} milyon` : n >= 1e3 ? `${Math.round(n / 1e3)} bin` : `${Math.round(n)}`;

  // =====================================================================
  // SES
  // =====================================================================
  let AC = null, master, chorus, muted = false;
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(AC.destination);
      const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const loop = (f, type, q, g) => {
        const s = AC.createBufferSource(); s.buffer = buf; s.loop = true;
        const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
        const ga = AC.createGain(); ga.gain.value = g; s.connect(fl); fl.connect(ga); ga.connect(master); s.start(); return ga;
      };
      loop(400, 'lowpass', 0.5, 0.03);
      // kurbağa korosu: düşük, titreşimli bir uğultu
      const o = AC.createOscillator(); o.type = 'triangle'; o.frequency.value = 610;
      const lfo = AC.createOscillator(); lfo.frequency.value = 22; const lg = AC.createGain(); lg.gain.value = 0.5;
      chorus = AC.createGain(); chorus.gain.value = 0;
      const am = AC.createGain(); am.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
      o.connect(am); am.connect(chorus); chorus.connect(master); o.start(); lfo.start();
    } catch (e) { AC = null; }
  }
  function trill() {
    if (!AC) return;
    const t = AC.currentTime, o = AC.createOscillator(), e = AC.createGain();
    o.type = 'triangle'; o.frequency.value = rnd(560, 680); o.connect(e); e.connect(master);
    for (let k = 0; k < 14; k++) { e.gain.setValueAtTime(0.05, t + k * 0.045); e.gain.setValueAtTime(0.0, t + k * 0.045 + 0.025); }
    o.start(t); o.stop(t + 0.7);
  }
  function blip(f = 880) {
    if (!AC) return;
    const t = AC.currentTime, o = AC.createOscillator(), e = AC.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.08);
    o.connect(e); e.connect(master); e.gain.setValueAtTime(0.05, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.start(t); o.stop(t + 0.16);
  }
  $('sound').onclick = () => {
    muted = !muted; initAudio();
    if (AC) master.gain.setTargetAtTime(muted ? 0 : 0.8, AC.currentTime, 0.05);
    $('sound').innerHTML = muted ? '🔇 <span>Ses</span>' : '🔊 <span>Ses</span>';
  };

  // =====================================================================
  // TUVAL VE HARİTA
  // =====================================================================
  const cv = $('world'), ctx = cv.getContext('2d');
  let W = 0, H = 0, U = 1, mobile = false, DPR = 1;
  const land = document.createElement('canvas'), lctx = land.getContext('2d');
  let landKey = '';
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight; U = clamp(Math.min(W, H) / 800, 0.62, 1.35); mobile = W < 760;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    landKey = '';
    drawSbChart(); if (mode === 'result') drawResultChart();
  }

  let proj = { s: 1, ox: 0, oy: 0 };
  function mapRect() {
    if (mobile) {
      const pnl = document.querySelector('.slide.active .gpanel, .slide.active .sb-panel');
      const bottom = pnl ? pnl.getBoundingClientRect().top - 8 : H * 0.56;
      return { x: 8, y: 150, w: W - 16, h: Math.max(120, bottom - 150) };
    }
    const right = mode === 'sandbox' ? 380 : 366;
    if (mode === 'game' && document.body.classList.contains('dock')) {
      const pnl = document.querySelector('.slide.active .gpanel');
      const bottom = pnl ? pnl.getBoundingClientRect().top - 10 : H - 60;
      return { x: 24, y: 178, w: W - 48, h: Math.max(160, bottom - 178) };
    }
    const top = mode === 'game' ? 150 : 64;
    return { x: 24, y: top, w: W - right - 48, h: H - top - 52 };
  }
  function setProj() {
    const r = mapRect(), mw = 42 * 0.86, mh = 34.5;
    const s = Math.min(r.w / mw, r.h / mh);
    proj = { s, ox: r.x + (r.w - mw * s) / 2, oy: r.y + (r.h - mh * s) / 2 };
  }
  const P = (lon, lat) => [proj.ox + (lon - M.LON0) * 0.86 * proj.s, proj.oy + (M.LAT0 - lat) * proj.s];
  const unP = (x, y) => [M.LON0 + (x - proj.ox) / (0.86 * proj.s), M.LAT0 - (y - proj.oy) / proj.s];

  const SITES = [
    { lon: 132.4, lat: -12.8, ic: '🐾', name: 'Kakadu · kuzey kedisi' },
    { lon: 126.3, lat: -16.2, ic: '🦎', name: 'Kimberley · goanna' },
    { lon: 142.7, lat: -13.6, ic: '🐊', name: 'Cape York · timsah' },
    { lon: 139.4, lat: -18.2, ic: '🐍', name: 'Körfez · yılan' },
    { lon: 135.0, lat: -12.7, ic: '🐾', name: 'Arnhem · kuzey kedisi' },
    { lon: 130.6, lat: -14.6, ic: '🐊', name: 'Daly · timsah' },
    { lon: 118.6, lat: -21.6, ic: '🐾', name: 'Pilbara · kuzey kedisi' },
    { lon: 148.6, lat: -21.6, ic: '🦎', name: 'Queensland · goanna' },
  ];
  const CITIES = [['Darwin', 130.85, -12.45], ['Brisbane', 153.0, -27.5], ['Sidney', 151.2, -33.87], ['Perth', 115.86, -31.95], ['Broome', 122.24, -17.96], ['Alice Springs', 133.88, -23.7]];

  function buildLand(st) {
    setProj();
    const key = [W, H, mode, proj.s.toFixed(2), proj.oy.toFixed(0), st ? st.p.warm : 0, st ? Math.round(st.p.fence * 10) : 0].join('|');
    if (key === landKey) return;
    landKey = key;
    land.width = W * DPR; land.height = H * DPR; lctx.setTransform(DPR, 0, 0, DPR, 0, 0); lctx.clearRect(0, 0, W, H);
    const path = poly => { lctx.beginPath(); poly.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? lctx.lineTo(x, y) : lctx.moveTo(x, y); }); lctx.closePath(); };
    lctx.save();
    lctx.shadowColor = 'rgba(43,58,46,.18)'; lctx.shadowOffsetY = 5;
    lctx.fillStyle = '#f7f2e2'; path(M.COAST); lctx.fill(); path(M.TAS); lctx.fill();
    lctx.restore();
    // yaşam alanı tonları: kurbağaya uygun yerler yeşil, kurak yerler kum
    lctx.save(); path(M.COAST); lctx.clip();
    const cs = M.CELL * proj.s;
    const tmp = st || M.newState();
    for (const c of M.G.cells) {
      const [x, y] = P(M.G.lon[c] - M.CELL / 2, M.G.lat[c] + M.CELL / 2);
      const s = M.suitOf(tmp, c), m = M.G.moist[c];
      lctx.fillStyle = s >= 0.22 ? `rgba(150,190,120,${0.18 + 0.3 * s})` : m < 0.3 ? 'rgba(226,200,150,.35)' : 'rgba(200,210,170,.25)';
      lctx.fillRect(x, y, cs * 0.86 + 0.5, cs + 0.5);
    }
    lctx.restore();
    lctx.strokeStyle = rgb(INK); lctx.lineWidth = 2.4; lctx.lineJoin = 'round';
    path(M.COAST); lctx.stroke(); path(M.TAS); lctx.stroke();
    // şehirler
    lctx.font = `${14 * U}px "Patrick Hand"`; lctx.fillStyle = rgb(INK, 0.7);
    for (const [n, lo, la] of CITIES) { const [x, y] = P(lo, la); lctx.beginPath(); lctx.arc(x, y, 2.5 * U, 0, 6.283); lctx.fill(); lctx.fillText(n, x + 5 * U, y - 4 * U); }
    const [gx, gy] = P(145.78, -17.1);
    lctx.fillStyle = '#c0503a'; lctx.font = `${18 * U}px "Patrick Hand"`; lctx.fillText('★ 1935', gx + 6 * U, gy + 5 * U);
  }

  // =====================================================================
  // ÇİZİM: KARAKTERLER
  // =====================================================================
  function drawToad(x, y, s, t, ph, dir = 1, mood = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 3, 13, 3, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#8c6c3c';
    ctx.beginPath(); ctx.ellipse(-8, -2, 7, 5, -0.5, 0, 6.283); ctx.fill();             // arka bacak
    ctx.fillStyle = '#b08a52';
    ctx.beginPath(); ctx.ellipse(0, -7, 13, 9, 0, 0, 6.283); ctx.fill();                // gövde
    ctx.fillStyle = '#e2cfa0'; ctx.beginPath(); ctx.ellipse(3, -3, 8, 4, 0, 0, 6.283); ctx.fill();   // karın
    ctx.fillStyle = '#7d5f33';
    [[-6, -11], [-1, -13], [-9, -6], [4, -12]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 1.4, 0, 6.283); ctx.fill(); }); // siğiller
    ctx.beginPath(); ctx.ellipse(2, -13, 4, 2.2, -0.2, 0, 6.283); ctx.fill();           // zehir bezi
    ctx.fillStyle = '#e7c04a'; ctx.beginPath(); ctx.arc(8, -14, 3.6, 0, 6.283); ctx.fill(); // göz
    ctx.fillStyle = rgb(INK); ctx.fillRect(6, -14.6, 4.4, 1.3);
    ctx.strokeStyle = rgb(INK); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(6, -6); ctx.quadraticCurveTo(10, -5 + mood, 13, -7); ctx.stroke();
    ctx.fillStyle = '#9a7845'; ctx.beginPath(); ctx.ellipse(9, 0, 3, 2, 0.3, 0, 6.283); ctx.fill(); // ön ayak
    ctx.restore();
  }
  function drawBeetle(x, y, s, t, ph) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 0.004 + ph) * 1.5); ctx.scale(s, s);
    ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 1;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-1, k * 2); ctx.lineTo(-7, k * 4 + 2); ctx.moveTo(1, k * 2); ctx.lineTo(7, k * 4 + 2); ctx.stroke(); }
    ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 7, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#5a4128'; ctx.beginPath(); ctx.arc(0, -7, 2.8, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 6); ctx.stroke();
    ctx.restore();
  }
  function drawPerson(x, y, s, coat, t, ph, item) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const bob = Math.sin(t * 0.006 + ph) * 1.2;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 2, 11, 3, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = coat; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -26 + bob, 14, 24, 6) : ctx.rect(-7, -26, 14, 24); ctx.fill();
    ctx.strokeStyle = rgb(INK, 0.4); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -32 + bob, 7, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgb(INK); ctx.beginPath(); ctx.arc(-2.4, -33 + bob, 1.2, 0, 6.283); ctx.arc(2.4, -33 + bob, 1.2, 0, 6.283); ctx.fill();
    if (item === 'bucket') {
      ctx.fillStyle = '#5b8fc0'; ctx.beginPath(); ctx.moveTo(8, -14); ctx.lineTo(17, -14); ctx.lineTo(15.5, -4); ctx.lineTo(9.5, -4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,170,.5)'; ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(-30, -6); ctx.lineTo(-24, 2); ctx.closePath(); ctx.fill(); // fener ışığı
    }
    if (item === 'crate') { ctx.fillStyle = '#b8894f'; ctx.fillRect(9, -12, 16, 12); ctx.strokeStyle = '#7a5a30'; ctx.strokeRect(9, -12, 16, 12); }
    ctx.restore();
  }

  // konuşma balonları
  const bubbles = [], floats = [];
  function drawBubble(bb) {
    const pad = 10 * U, fs = 17 * U;
    ctx.font = `${fs}px "Patrick Hand"`;
    const lines = bb.text.split('\n');
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2, h = lines.length * fs * 1.15 + pad * 1.4;
    const x = clamp(bb.x - w / 2, 8, W - w - 8), y = Math.max(56, bb.y - h - 18 * U);
    ctx.globalAlpha = clamp(bb.life * 3);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = rgb(INK); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 12) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bb.x - 7, y + h - 1); ctx.lineTo(bb.x, y + h + 11 * U); ctx.lineTo(bb.x + 7, y + h - 1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgb(INK); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad * 0.7 + i * fs * 1.15));
    ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  }
  function say(obj, text) { bubbles.length = 0; bubbles.push({ obj, x: obj.x, y: obj.y, text, life: 1 }); }

  // =====================================================================
  // SAHNE 1: KAMIŞ TARLASI
  // =====================================================================
  const stalks = [], beetles = [], fieldToads = [], scientists = [];
  function buildField() {
    stalks.length = 0; beetles.length = 0;
    for (let row = 0; row < 2; row++) for (let x = 20 + row * 30; x < W + 20; x += 62 * U) stalks.push({ x: x + rnd(-8, 8), row, h: rnd(0.85, 1.1), ph: rnd(0, 6.28) });
    for (let i = 0; i < Math.round(W / 140); i++) { const s = pick(stalks); beetles.push({ st: s, dy: rnd(0.02, 0.15), ph: rnd(0, 6.28) }); }
  }
  function drawField(t, dt, crowd) {
    const pnl = (mobile || document.body.classList.contains('dock')) && mode === 'game' ? document.querySelector('.slide.active .gpanel') : null;
    const floor = pnl ? pnl.getBoundingClientRect().top - 6 : H;
    const gt = mobile ? Math.min(H * 0.46, floor - 150) : Math.min(H * 0.74, floor - 170), sh = H * (mobile ? 0.24 : 0.34);
    ctx.fillStyle = '#c9b48a'; ctx.fillRect(0, gt, W, H - gt);
    ctx.strokeStyle = rgb(INK, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, gt); ctx.lineTo(W, gt); ctx.stroke();
    ctx.fillStyle = 'rgba(120,90,50,.18)'; for (let i = 0; i < 6; i++) ctx.fillRect(0, gt + 14 + i * i * 6, W, 2);
    for (const s of stalks) {
      const base = gt + (s.row ? 18 : 4) * U, top = base - sh * s.h * (s.row ? 1 : 0.9);
      const sw = Math.sin(t * 0.0012 + s.x * 0.01) * 4 * U;
      ctx.strokeStyle = s.row ? '#7aa257' : '#93b56a'; ctx.lineWidth = 6 * U; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x, base); ctx.quadraticCurveTo(s.x, (base + top) / 2, s.x + sw, top); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,100,50,.6)'; ctx.lineWidth = 2;
      for (let k = 1; k < 6; k++) { const yy = lerp(base, top, k / 6), xx = s.x + sw * (k / 6) ** 2; ctx.beginPath(); ctx.moveTo(xx - 3 * U, yy); ctx.lineTo(xx + 3 * U, yy); ctx.stroke(); }
      ctx.strokeStyle = s.row ? '#6c9a4c' : '#86b060'; ctx.lineWidth = 3 * U;
      for (let k = 0; k < 2; k++) {
        const yy = lerp(base, top, 0.7 + k * 0.18), xx = s.x + sw * 0.8, dir = (k + s.row) % 2 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + dir * 26 * U, yy - 22 * U, xx + dir * (44 + Math.sin(t * 0.002 + s.ph) * 5) * U, yy + 6 * U); ctx.stroke();
      }
      s.topX = s.x + sw; s.topY = top;
    }
    for (const b of beetles) { b.x = b.st.topX; b.y = b.st.topY + sh * b.dy; drawBeetle(b.x, b.y, 1.1 * U, t, b.ph); }
    // bilim insanları ve kasalar
    if (game.released) {
      scientists.length = 2;
      scientists[0] = scientists[0] || { ph: 0 }; scientists[1] = scientists[1] || { ph: 2 };
      scientists.forEach((p, i) => { p.x = W * (mobile ? 0.25 : 0.18) + i * 70 * U; p.y = gt + 46 * U; drawPerson(p.x, p.y, 1.3 * U, '#f4f4f0', t, p.ph, 'crate'); });
    }
    // kurbağalar
    const want = crowd;
    while (fieldToads.length < want) {
      const sx = scientists[0] ? scientists[0].x + 30 * U : W * 0.2;
      fieldToads.push({ x: sx + rnd(-30, 90) * U, y: gt + rnd(26, Math.max(40, (floor - gt) * 0.85)), tx: rnd(20, W - (mobile || document.body.classList.contains('dock') ? 20 : 380)), ph: rnd(0, 6.28), hop: 0, s: rnd(0.9, 1.25), jump: 0 });
    }
    fieldToads.length = Math.max(0, want);
    const f = dt / 16.67;
    for (const td of fieldToads) {
      if (Math.abs(td.tx - td.x) < 4) td.tx = rnd(20, W - (mobile || document.body.classList.contains('dock') ? 20 : 380));
      td.x += Math.sign(td.tx - td.x) * 0.5 * U * f;
      td.hop = Math.max(0, Math.sin(t * 0.006 + td.ph * 3)) * 6 * U;
      if (!td.jump && Math.random() < 0.0006 * f) td.jump = 1;
      if (td.jump) { td.jump += 0.03 * f; if (td.jump > 2) td.jump = 0; }
      const jy = td.jump ? Math.sin((td.jump - 1) * Math.PI) * 50 * U : 0;
      td.sx = td.x; td.sy = td.y - td.hop - Math.max(0, jy);
      drawToad(td.sx, td.sy, td.s * U, t, td.ph, td.tx > td.x ? 1 : -1);
    }
    return gt;
  }

  // =====================================================================
  // SAHNE 2: HARİTA
  // =====================================================================
  let sprites = [], volunteers = [];
  function refreshFront(st) {
    const front = [];
    for (const c of M.G.cells) {
      if (st.d[c] <= 0) continue;
      const i = c % M.NX, j = (c / M.NX) | 0;
      let edge = false;
      for (let dj = -1; dj <= 1 && !edge; dj++) for (let di = -1; di <= 1; di++) { const n = (j + dj) * M.NX + i + di; if (M.G.inside[n] && st.d[n] <= 0 && M.suitOf(st, n) >= 0.22) { edge = true; break; } }
      if (edge) front.push(c);
    }
    const take = (n) => Array.from({ length: Math.min(n, front.length) }, () => pick(front));
    sprites = take(14).map(c => ({ c, ph: rnd(0, 6.28), dx: rnd(-0.3, 0.3), dy: rnd(-0.3, 0.3) }));
    const nv = Math.round((st.p.collect || 0) * 8);
    volunteers = take(nv).map(c => ({ c, ph: rnd(0, 6.28), next: 0 }));
  }
  function drawMap(st, t, dt) {
    buildLand(st);
    ctx.drawImage(land, 0, 0, W, H);
    const cs = M.CELL * proj.s;
    for (const c of M.G.cells) {
      const d = st.d[c]; if (d <= 0) continue;
      const [x, y] = P(M.G.lon[c], M.G.lat[c]);
      ctx.fillStyle = `rgba(122,100,46,${0.25 + 0.55 * clamp(d * 1.4)})`;
      ctx.beginPath(); ctx.arc(x, y, cs * 0.62, 0, 6.283); ctx.fill();
    }
    // çitlenmiş göletler
    if (st.p.fence > 0 || mode === 'sandbox') {
      for (const c of M.G.cells) {
        if (!M.G.dam[c]) continue;
        const [x, y] = P(M.G.lon[c], M.G.lat[c]);
        ctx.fillStyle = 'rgba(80,140,200,.5)'; ctx.beginPath(); ctx.arc(x, y, Math.max(1.4, cs * 0.12), 0, 6.283); ctx.fill();
        if (st.fenced[c]) { ctx.strokeStyle = 'rgba(138,90,58,.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, Math.max(2.6, cs * 0.24), 0, 6.283); ctx.stroke(); }
      }
    }
    // yerli avcılar
    ctx.textAlign = 'center';
    for (const s of SITES) {
      const [x, y] = P(s.lon, s.lat); s.x = x; s.y = y - 10 * U;
      const health = sitePred(st, s);
      ctx.fillStyle = health < 0.45 ? 'rgba(244,214,204,.95)' : 'rgba(255,255,255,.92)';
      ctx.strokeStyle = rgb(INK, 0.6); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y - 8 * U, 15 * U, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.4 + 0.6 * health;
      ctx.font = `${20 * U}px serif`; ctx.textBaseline = 'middle'; ctx.fillText(s.ic, x, y - 7 * U); ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
      if (health < 0.45) { ctx.font = `${14 * U}px serif`; ctx.fillText('☠️', x + 14 * U, y - 12 * U); }
    }
    // ön cephede zıplayan kurbağalar
    for (const sp of sprites) {
      const [x, y] = P(M.G.lon[sp.c] + sp.dx, M.G.lat[sp.c] + sp.dy);
      const hop = Math.max(0, Math.sin(t * 0.007 + sp.ph * 4)) * 5 * U;
      sp.x = x; sp.y = y - hop - 10 * U;
      drawToad(x, y - hop, 0.75 * U, t, sp.ph, Math.sin(sp.ph) > 0 ? -1 : 1);
    }
    // gönüllüler fenerle kurbağa topluyor
    for (const v of volunteers) {
      const [x, y] = P(M.G.lon[v.c] + 0.25, M.G.lat[v.c] - 0.25);
      v.x = x; v.y = y - 30 * U;
      drawPerson(x, y, 0.75 * U, '#5b7f5a', t, v.ph, 'bucket');
      if (t > v.next) { v.next = t + rnd(1200, 2600); floats.push({ x: x + 10 * U, y: y - 30 * U, text: '−1', life: 1 }); if (Math.random() < 0.3) blip(700); }
    }
  }
  function sitePred(st, s) {
    let sum = 0, n = 0;
    for (const c of M.G.cells) { if (Math.abs(M.G.lon[c] - s.lon) < 1.2 && Math.abs(M.G.lat[c] - s.lat) < 1.2) { sum += st.pred[c]; n++; } }
    return n ? sum / n : 1;
  }

  // =====================================================================
  // SLAYTLAR
  // =====================================================================
  const slides = [...document.querySelectorAll('.slide')];
  let cur = 0, maxSeen = 0, mode = 'title';
  const slideOf = m => slides.findIndex(x => x.dataset.mode === m);
  const dotsEl = $('dots');
  slides.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', `Adım ${i + 1}`); b.onclick = () => { if (i <= maxSeen) goTo(i); }; dotsEl.appendChild(b); });
  function goTo(i) {
    if (i < 0 || i >= slides.length) return;
    if (mode === 'sandbox') sb.running = false;
    slides[cur].classList.remove('active');
    cur = i; maxSeen = Math.max(maxSeen, i);
    slides[cur].classList.add('active'); slides[cur].scrollTop = 0;
    mode = slides[cur].dataset.mode; landKey = '';
    [...dotsEl.children].forEach((d, k) => { d.classList.toggle('on', k === cur); d.classList.toggle('seen', k <= maxSeen); d.disabled = k > maxSeen; });
    if (mode === 'game') enterGame();
    if (mode === 'result') renderResult();
    if (mode === 'sandbox') enterSandbox();
  }
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => { initAudio(); goTo(cur + 1); }));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { resetGame(); goTo(slideOf(b.dataset.goto)); }));

  // =====================================================================
  // BİLDİRİMLER (okuma süresine saygılı)
  // =====================================================================
  // bildirimler sıraya girer: aralarında en az birkaç saniye, ekranda az kart
  const toastQueue = [];
  let lastToastAt = -1e9;
  function toast(...args) {
    const opt = args[4] || {};
    toastQueue.push(args);
    // sıra uzarsa en eski küçük haberleri at; hikâye ve yeni araç kartları kalır
    while (toastQueue.length > 6) { const k = toastQueue.findIndex(a => !(a[4] || {}).pause); if (k < 0) break; toastQueue.splice(k, 1); }
    pumpToasts();
  }
  function pumpToasts() {
    if (!toastQueue.length || mode !== 'game') return;
    const box = $('toasts'), visible = box.querySelectorAll('.toast:not(.out)').length;
    const gap = 9000 / (typeof FAST === 'number' ? FAST : 1);
    if (visible >= (mobile ? 1 : 2) || performance.now() - lastToastAt < gap) return;
    const k = toastQueue.findIndex(a => (a[4] || {}).pause);
    const next = toastQueue.splice(k >= 0 ? k : 0, 1)[0];
    lastToastAt = performance.now();
    showToast(...next);
  }
  setInterval(pumpToasts, 300);
  function showToast(ic, from, text, tone = '', opt = {}) {
    const box = $('toasts');
    if (game.speed > 1) setSpeed(1); // olay geldi: normal hıza dön
    const el = document.createElement('div');
    el.className = 'toast ' + tone + (opt.img ? ' story' : '');
    el.innerHTML = (opt.img ? `<img src="${opt.img}" alt="">` : `<div class="ic">${ic}</div>`) +
      `<div><span class="from">${from}</span>${text}${opt.pause ? '<button class="go">Devam →</button>' : '<span class="x">dokun: kapat</span>'}</div>`;
    if (opt.pause) { el.classList.add('pause'); game.reading++; }
    const close = () => {
      if (el.classList.contains('out')) return;
      el.classList.add('out');
      lastToastAt = Math.max(lastToastAt, performance.now() - 9000 / (typeof FAST === 'number' ? FAST : 1) + 5000 / (typeof FAST === 'number' ? FAST : 1));
      if (opt.pause) game.reading = Math.max(0, game.reading - 1);
      if (opt.then) setTimeout(opt.then, 3000 / (typeof FAST === 'number' ? FAST : 1));
      setTimeout(() => { el.remove(); pumpToasts(); }, 400);
    };
    el.onclick = close;
    if (opt.img && window.Toon) window.Toon.process(opt.img, { maxW: 320 }).then(u => { const im = el.querySelector('img'); if (im) im.src = u; }).catch(() => {});
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    const plain = text.replace(/<[^>]+>/g, '');
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 4500 + plain.length * 65)) / FAST);
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const game = {};
  const sliders = { collect: $('g-collect'), teach: $('g-teach'), fence: $('g-fence') };
  const UNLOCK = { collect: 1980, teach: 2008, fence: 2010 };
  function resetGame() {
    Object.assign(game, {
      started: false, state: 'intro', phase: 'field', released: false, refused: 0, noToads: false,
      st: M.newState(), frac: 0, speed: 1, paused: false, reading: 0, fired: new Set(), hist: [], fade: 0, unlocked: {},
    });
    Object.values(sliders).forEach(s => { s.value = 0; s.disabled = true; });
    document.querySelectorAll('.coach').forEach(uncoach);
    ['collect', 'teach', 'fence'].forEach(k => { $('w-' + k).classList.add('locked'); $('o-' + k).textContent = '🔒 ' + UNLOCK[k] + "'de açılır"; });
    $('g-pause').textContent = '❚❚ Durdur'; if (typeof setSpeed === 'function') setSpeed(1);
    $('modal').hidden = true; $('milestone').hidden = true; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    fieldToads.length = 0; scientists.length = 0; bubbles.length = 0; sprites = []; volunteers = [];
    SITES.forEach(s => { s.hit = false; });
    readPolicy(); updatePanel();
  }
  function once(key, fn) { if (!game.fired.has(key)) { game.fired.add(key); fn(); } }
  // rehber ipucu: yeni açılan aracı parlatır
  function coach(input, text, ms = 14000) {
    const card = input.closest('.sl'); if (!card || input.disabled) return;
    uncoach(card); card.classList.add('coach');
    const tip = document.createElement('div'); tip.className = 'coach-tip'; tip.textContent = text; card.appendChild(tip);
    const done = () => uncoach(card);
    input.addEventListener('input', done, { once: true }); card._coachT = setTimeout(done, ms);
  }
  function uncoach(card) { card.classList.remove('coach'); card.querySelectorAll('.coach-tip').forEach(t => t.remove()); clearTimeout(card._coachT); }

  function readPolicy(changed) {
    // ortak bütçe: toplam 100 puanı aşamaz
    const keys = ['collect', 'teach', 'fence'];
    if (changed) {
      const others = keys.filter(k => k !== changed).reduce((a, k) => a + Number(sliders[k].value), 0);
      if (Number(sliders[changed].value) + others > 100) sliders[changed].value = 100 - others;
    }
    let used = 0;
    keys.forEach(k => {
      const v = Number(sliders[k].value); used += v;
      game.st.p[k] = v / 100;
      if (game.unlocked[k]) $('o-' + k).textContent = '%' + v;
    });
    $('g-budget').textContent = `${100 - used} puan kaldı`;
  }
  Object.entries(sliders).forEach(([k, el]) => el.addEventListener('input', () => { initAudio(); readPolicy(k); refreshFront(game.st); }));
  $('g-pause').onclick = () => { game.paused = !game.paused; $('g-pause').textContent = game.paused ? '▶ Devam' : '❚❚ Durdur'; };
  // hız: 1× → 2× → 4×; yeni bir olay gelince kendiliğinden 1×'e döner
  function setSpeed(v) {
    game.speed = v;
    $('g-speed').textContent = v + '×';
    $('yb-speed').querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.s) === v));
  }
  const nextSpeed = () => setSpeed(game.speed === 1 ? 2 : game.speed === 2 ? 4 : 1);
  $('g-speed').onclick = nextSpeed;
  $('yb-speed').querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); initAudio(); setSpeed(Number(b.dataset.s)); });

  function choice(from, title, text, opts) {
    game.state = 'choice';
    const m = $('modal');
    m.innerHTML = `<div class="card"><div class="from">${from}</div><h2>${title}</h2><p>${text}</p><div class="opts"></div></div>`;
    const box = m.querySelector('.opts');
    opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'opt';
      b.innerHTML = `${o.label}<small>${o.sub}</small>`;
      b.onclick = () => { m.hidden = true; game.state = 'play'; initAudio(); o.fn(); };
      box.appendChild(b);
    });
    m.hidden = false;
  }

  function enterGame() {
    if (game.started) return;
    game.started = true; game.state = 'intro';
    const seq = [
      ['🇦🇺', 'Queensland, Avustralya', 'Şeker kamışı tarlalarını <b>kamış böceği</b> kemiriyor. Yetişkinler yaprakları, larvalar kökleri yiyor.', '', { pause: true }],
      ['', 'Çözüm Hawaii\'den geliyor', 'Gemiyle 102 <b>kamış kurbağası</b> geldi. Plan basit: kurbağa böceği yer. Öyle değil mi?', '', { img: TOAD_IMG, pause: true }],
    ];
    const show = i => {
      if (mode !== 'game') return;
      if (i >= seq.length) return askRelease();
      toast(...seq[i].slice(0, 4), { ...seq[i][4], then: () => show(i + 1) });
    };
    setTimeout(() => show(0), 500);
  }

  function askRelease() {
    choice('Gordonvale deneme istasyonu', 'Yavrular hazır', 'Laboratuvarda binlerce yavru kurbağa büyüdü. Tarlalara salalım mı?', [
      { label: 'Salın!', sub: 'Doğal, ucuz, hızlı bir çözüm', fn: doRelease },
      { label: 'Önce araştıralım', sub: 'Kurbağa bu böceği gerçekten yer mi?', fn: () => {
        game.refused = 1;
        toast('🔬', 'Böcek bilimci Walter Froggatt', '"Kurbağa böceği değil, önüne gelen her şeyi yer. Salarsak geri toplayamayız."', '', { pause: true, then: () => {
          choice('Hükümet', 'Şeker üreticileri bastırıyor', 'Hükümet yasağı kaldırmak istiyor. Böcekler kamışı yemeye devam ediyor. Kararın?', [
            { label: 'Peki, salın', sub: 'Baskıya dayanamadın', fn: doRelease },
            { label: 'Hayır, kurbağa yok', sub: 'Böceği başka bir yolla çöz', fn: noRelease },
          ]);
        } });
      } },
    ]);
  }
  function doRelease() {
    game.released = true; game.state = 'play';
    M.release(game.st); trill();
    toast('📦', 'Gordonvale', 'Kasalar açıldı, kurbağalar tarlada! Şimdi bakalım böceklerle nasıl başa çıkacaklar.', 'good');
  }
  function noRelease() {
    game.noToads = true; game.state = 'play';
    toast('🕊️', 'Karar', 'Kurbağa salınmadı. Şeker üreticileri kızgın ama kıta bundan haberdar bile değil.', 'good');
  }

  function yearDur() {
    const y = game.st.year;
    let ms = game.phase === 'field' ? 6500 : y < 1975 ? 900 : 1700;
    if (game.noToads) ms = 900;
    // kart okunurken zaman yavaşlar; yapılacak bir şey yokken hızlanır
    ms *= $('toasts').querySelector('.toast:not(.out)') ? 1.5 : toastQueue.length ? 1 : 0.6;
    return ms / game.speed / FAST;
  }

  function updateGame(dt) {
    if (mode !== 'game' || game.paused || game.reading || game.state !== 'play') return;
    game.frac += dt / yearDur();
    if (game.frac >= 1) { game.frac -= 1; yearTick(); }
  }

  function unlock(k, text) {
    game.unlocked[k] = true;
    sliders[k].disabled = false; $('w-' + k).classList.remove('locked'); readPolicy();
    toast(k === 'collect' ? '🪣' : k === 'teach' ? '🎓' : '🚧', 'Yeni araç açıldı', text, 'good', { pause: true, then: () => coach(sliders[k], k === 'collect' ? '👉 Bütçeden pay ayır' : '👉 Bunu da dene') });
    blip(1000);
  }

  function yearTick() {
    const st = game.st;
    const s = M.step(st);
    game.hist.push(s);
    const y = st.year;
    if (game.noToads) {
      if (y === 1947) toast('🧪', 'Kamış böceği', 'Böcek sonunda kimyasal ilaçlar ve tarım yöntemleriyle kontrol altına alındı. Kurbağaya hiç gerek kalmadı.', 'good');
      if (y >= 1952) return endGame();
      if (y === 1937) toMap();
      updatePanel(); return;
    }
    if (game.phase === 'field') {
      if (y === 1936) toast('🐸', 'Tarla gözlemi', 'Kurbağalar tarlada. Ama böcekler kamışın tepesinde, larvaları toprağın altında. Kurbağalar zıplayamıyor.', 'warn');
      if (y === 1937) toast('🥚', 'Biyoloji notu', 'Bir dişi kurbağa bir seferde <b>30 bine kadar</b> yumurta bırakabiliyor.', '');
      if (y === 1938) toast('🍽️', 'Tarla gözlemi', 'Kurbağalar böcek yerine önlerine çıkan her şeyi yiyor: başka böcekler, kurbağalar, hatta küçük hayvanlar.', 'warn');
      if (y >= 1939) toMap();
      updatePanel(); return;
    }
    if (y === 1947) toast('🧪', 'Kamış böceği', 'Böcek sonunda kimyasal ilaçlarla kontrol altına alındı. Kurbağalarla değil. Kurbağalar ise kaldı.', 'warn');
    if (y === 1990) toast('🦵', 'Bilim insanları', 'Öndeki kurbağaların bacakları uzuyor! En hızlılar öne geçip birbirleriyle çiftleşiyor. Cephe her yıl hızlanıyor.', 'warn');
    if (y === 2020) toast('🐍', 'Biraz umut', 'Bazı yılanlar ve kuşlar kurbağadan kaçınmayı ya da onu güvenli yerinden yemeyi öğrendi. Ama bu on yıllar sürüyor.', 'good');
    for (const k of ['collect', 'teach', 'fence']) if (!game.unlocked[k] && y >= UNLOCK[k]) {
      unlock(k, k === 'collect' ? 'Gönüllüler geceleri fenerle kurbağa topluyor. Bütçenden pay ayır; ön cephede yayılmayı yavaşlatır.'
        : k === 'teach' ? 'Avcılara kusturucu, küçük bir kurbağa parçası yedir; tadından tiksinip bir daha dokunmasınlar. Gerçekte 2010\'larda denendi.'
        : 'Çöllerde kurbağalar çiftlik göletlerine muhtaç. Göletleri çitle, çölün içinden geçen yolu kes.');
      break;
    }
    for (const site of SITES) {
      if (site.hit) continue;
      if (sitePred(st, site) < 0.75) {
        site.hit = true;
        say(site, st.p.teach > 0.3 ? 'Iyy! Bu kurbağanın tadı\nberbat. Bir daha asla!' : 'Bu da ne? Lezzetli\ngörünüyor...');
        once('site-' + site.name, () => toast(site.ic, site.name, st.p.teach > 0.3 ? 'Eğitilmiş avcılar kurbağalardan uzak duruyor. Kayıplar beklenenden az.' : 'Kurbağayı yiyen avcılar zehirlenip ölüyor. Bazı bölgelerde nüfus %90\'ın üzerinde düşebiliyor.', st.p.teach > 0.3 ? 'good' : 'bad'));
      }
    }
    const MS = [
      ['nsw', 'Yeni Güney Galler', 'Kurbağalar güneyde Yeni Güney Galler\'e ulaştı.', null],
      ['nt', 'Kuzey Bölgesi', 'Kurbağalar Kuzey Bölgesi sınırını geçti.', 1984],
      ['darwin', 'Darwin', 'Kurbağalar kuzeyin başkenti Darwin\'e ulaştı.', 2005],
      ['wa', 'Batı Avustralya', 'Kurbağalar Batı Avustralya\'ya girdi. Önlerinde Kimberley var.', 2009],
    ];
    for (const [k, title, text, hy] of MS) if (st.firsts[k] && !game.fired.has('ms-' + k)) { game.fired.add('ms-' + k); milestone(st.firsts[k], title, text, hy); break; }
    if (y % 2 === 0) refreshFront(st);
    if (y >= 2025) return endGame();
    updatePanel();
  }

  function toMap() {
    game.phase = 'map'; game.fade = 1; landKey = '';
    refreshFront(game.st);
    $('g-phase').textContent = 'Avustralya';
    if (!game.noToads) toast('🗺️', 'Kurbağalar tarlalardan taştı', 'Artık tek bir tarla yetmez. Bütün kıtaya bakalım. Kahverengi alan kurbağaların yayıldığı yer.', '', { pause: true });
  }

  function milestone(year, title, text, histYear) {
    game.state = 'milestone'; if (game.speed > 1) setSpeed(1);
    const el = $('milestone');
    el.innerHTML = `<div><div class="k">${title}</div><div class="n">${year}</div><div class="s">${text}${histYear ? `<br>Tarihte: ${histYear}` : ''}</div><div class="tap">devam etmek için dokun</div></div>`;
    el.hidden = false; trill();
    let done = false;
    const next = () => { if (done) return; done = true; el.hidden = true; game.state = 'play'; };
    el.onpointerdown = next; setTimeout(next, 4200 / FAST);
  }

  function endGame() {
    game.state = 'end';
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 1400);
  }

  function updatePanel() {
    const st = game.st, s = game.hist[game.hist.length - 1] || M.stats(st);
    $('g-year').textContent = st.year;
    const yy = String(st.year);
    if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
    $('yb-sub').textContent = game.phase === 'field' ? 'Kamış tarlası' : game.noToads ? 'Kurbağasız Avustralya' : 'Avustralya';
    $('yb-fill').style.width = clamp((st.year - 1935 + game.frac) / 90) * 100 + '%';
    const fieldCount = game.released ? Math.round(102 * Math.pow(9, st.year - 1935 + game.frac)) : 102;
    $('s-toads').textContent = game.noToads ? '0' : game.phase === 'field' ? fmtToads(Math.min(fieldCount, 5e6)) : fmtToads(Math.max(s.toads, fieldCount > 5e6 ? 5e6 : fieldCount));
    $('s-area').textContent = '%' + s.areaPct.toFixed(1);
    $('m-pred').style.width = s.pred * 100 + '%';
    $('m-pred').style.background = s.pred < 0.45 ? 'var(--danger)' : 'var(--green)';
  }

  // =====================================================================
  // SONUÇ
  // =====================================================================
  function renderResult() {
    const last = game.hist[game.hist.length - 1];
    if (!last || game.state !== 'end') { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    let title, text;
    if (game.noToads) { title = 'Kurbağasız Avustralya'; text = 'Uyarıyı dinledin. Kamış böceği birkaç yıl sonra kimyasallarla kontrol edildi; kurbağaya hiç gerek yokmuş. Kuzey kedileri, goannalar ve timsahlar bu kararı hiç bilmeyecek.'; }
    else if (last.pred >= 0.45 || last.areaPct <= H_END.areaPct * 0.8) { title = 'Fark yarattın'; text = 'Kurbağaları durduramadın, kimse durduramazdı. Ama doğru araçlara bütçe ayırarak yerli avcıların çoğunu korudun. Salmak bir günde oldu, telafisi bir asır sürüyor.'; }
    else { title = 'Kıtayı kurbağalara verdin'; text = 'Tarih tekrarlandı: 102 kurbağa, 200 milyonu aşan bir ordu oldu. Kamış böceği ise hiç umursamadı.'; }
    const pct = v => `%${Math.round(v * 100)}`;
    $('result').innerHTML = `
      <div class="kicker">2025 · 90 yıl sonra</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      <div class="rgrid">
        <div><div class="y">Yayıldığı alan</div><div class="v">%${last.areaPct.toFixed(0)}</div><div class="h">tarihte: %${H_END.areaPct.toFixed(0)}</div></div>
        <div><div class="y">Kurbağa</div><div class="v">${game.noToads ? '0' : fmtToads(last.toads)}</div><div class="h">tarihte: ${fmtToads(H_END.toads)}</div></div>
        <div><div class="y">Yerli avcılar</div><div class="v" style="color:${last.pred >= 0.45 ? 'var(--green)' : 'var(--danger)'}">${pct(last.pred)}</div><div class="h">tarihte: ${pct(H_END.pred)}</div></div>
      </div>
      <canvas class="rchart" id="rchart"></canvas>
      <div class="legend"><span style="--c:#8a7a3a">Alan</span><span style="--c:#4f7a4a">Yerli avcılar</span><span style="--c:#9aa59a">Tarihteki alan (kesikli)</span></div>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(slideOf('game')); };
    $('r-next').onclick = () => goTo(slideOf('sandbox'));
    requestAnimationFrame(drawResultChart);
  }
  function lineChart(c, series, n) {
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight; if (!w) return;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const pad = 10, X = i => pad + (i / Math.max(1, n - 1)) * (w - pad * 2), Y = v => pad + (1 - clamp(v)) * (h - pad * 2);
    series.forEach(s => {
      if (!s.data.length) return;
      g.strokeStyle = s.color; g.lineWidth = s.dash ? 1.8 : 3; g.lineJoin = 'round'; g.setLineDash(s.dash ? [5, 5] : []);
      g.beginPath(); s.data.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke();
    });
    g.setLineDash([]);
  }
  function drawResultChart() {
    lineChart($('rchart'), [
      { data: HISTORY.hist.map(h => h.areaPct / 40), color: '#9aa59a', dash: true },
      { data: game.hist.map(h => h.pred), color: '#4f7a4a' },
      { data: game.hist.map(h => h.areaPct / 40), color: '#8a7a3a' },
    ], 90);
  }

  // =====================================================================
  // LABORATUVAR
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: null, hist: [] };
  const SBS = { evo: 'p-evo', collect: 'p-collect', teach: 'p-teach', fence: 'p-fence', warm: 'p-warm' };
  function sbParams() {
    const v = k => Number($(SBS[k]).value);
    $('o-evo').textContent = '%' + v('evo'); $('o-pcollect').textContent = '%' + v('collect'); $('o-pteach').textContent = '%' + v('teach');
    $('o-pfence').textContent = '%' + v('fence'); $('o-warm').textContent = '+' + (v('warm') / 10).toFixed(1) + ' °C';
    return { evo: v('evo') / 100, collect: v('collect') / 100, teach: v('teach') / 100, fence: v('fence') / 100, warm: v('warm') / 10 };
  }
  function sbReset() { sb.st = M.newState(sbParams()); M.release(sb.st); sb.hist = []; sb.frac = 0; landKey = ''; refreshFront(sb.st); sbStats(); drawSbChart(); }
  Object.values(SBS).forEach(id => $(id).addEventListener('input', () => { if (sb.st) { Object.assign(sb.st.p, sbParams()); landKey = ''; refreshFront(sb.st); } document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: [100, 0, 0, 0, 0], all: [100, 60, 80, 100, 0], noevo: [0, 0, 0, 0, 0], warm: [100, 0, 0, 0, 25] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    PRESETS[b.dataset.preset].forEach((v, i) => { $(Object.values(SBS)[i]).value = v; });
    document.querySelectorAll('.pbtn').forEach(x => x.classList.toggle('on', x === b));
    sbReset();
  });
  $('sb-play').onclick = () => { sb.running = !sb.running; $('sb-play').textContent = sb.running ? '❚❚ Durdur' : '▶ Devam'; };
  $('sb-speed').onclick = () => { sb.speed = sb.speed === 1 ? 2 : sb.speed === 2 ? 4 : 1; $('sb-speed').textContent = sb.speed + '×'; };
  $('sb-reset').onclick = sbReset;
  function enterSandbox() { if (!sb.st) sbReset(); sb.running = true; $('sb-play').textContent = '❚❚ Durdur'; setTimeout(drawSbChart, 50); }
  function updateSandbox(dt) {
    if (mode !== 'sandbox' || !sb.running || !sb.st || sb.st.year >= 2100) return;
    sb.frac += dt / (420 / sb.speed);
    while (sb.frac >= 1 && sb.st.year < 2100) {
      sb.frac -= 1; sb.hist.push(M.step(sb.st));
      if (sb.st.year % 2 === 0) refreshFront(sb.st);
      sbStats(); drawSbChart();
    }
  }
  function sbStats() { const s = sb.hist[sb.hist.length - 1]; $('sb-year').textContent = sb.st ? sb.st.year : 1935; $('sb-area').textContent = `Alan: %${s ? s.areaPct.toFixed(1) : 0}`; }
  function drawSbChart() {
    lineChart($('sb-chart'), [
      { data: sb.hist.map(h => h.pred), color: '#4f7a4a' },
      { data: sb.hist.map(h => h.areaPct / 40), color: '#8a7a3a' },
    ], 165);
  }
  sbParams();

  // =====================================================================
  // KONUŞMALAR VE DOKUNMA
  // =====================================================================
  const LINES = {
    toad: ['Böcek nerede? Yukarıda mı?\nO kadar zıplayamam.', 'Ben böcek değil,\nher şeyi yerim!', 'Vrrrrr! Burası\nçok güzelmiş.'],
    beetle: ['Ben tepedeyim, larvalarım\ntoprağın altında. Bol şans!', 'Kurbağa mı? Hiç\nyukarı bakmıyor ki.'],
    sci: ['Kurbağa böceği yer.\nBasit biyoloji!', 'Hawaii\'de işe yaradı.\nGaliba.', 'Bu kurbağalar neden\nböceğe bakmıyor?'],
    mtoad: ['30 bin yumurta daha!', 'Bacaklarım her\nnesilde uzuyor!', 'Batıya! Hep batıya!', 'Vrrrrr!'],
    vol: ['Bu gece 800 kurbağa\ntopladık!', 'Topladıkça yenileri\ngeliyor...', 'Fener, kova, eldiven.\nHazırım!'],
  };
  function candidates() {
    const out = [];
    if (game.phase === 'field' && mode === 'game') {
      fieldToads.forEach(t => out.push([t.sx, t.sy - 10 * U, 'toad', t]));
      beetles.forEach(b => out.push([b.x, b.y, 'beetle', b]));
      scientists.forEach(p => out.push([p.x, p.y - 30 * U, 'sci', p]));
    } else {
      sprites.forEach(s => out.push([s.x, s.y, 'mtoad', s]));
      volunteers.forEach(v => out.push([v.x, v.y, 'vol', v]));
      SITES.forEach(s => out.push([s.x, s.y, 'site', s]));
    }
    return out.filter(c => c[0] !== undefined);
  }
  function talk(c) {
    const [x, y, kind, obj] = c;
    const st = mode === 'sandbox' ? sb.st : game.st;
    let text = kind === 'site' ? (sitePred(st, obj) < 0.45 ? (st.p.teach > 0.3 ? 'Kurbağaya dokunmamayı\nöğrendik. Zor oldu.' : 'Burada eskiden\nçok kalabalıktık...') : 'Bu da ne? Lezzetli\ngörünüyor...') : pick(LINES[kind]);
    say({ get x() { return kind === 'beetle' ? obj.x : x; }, get y() { return y; } }, text);
    if (kind === 'toad' || kind === 'mtoad') trill(); else blip(kind === 'beetle' ? 1400 : 600);
  }
  cv.addEventListener('pointerdown', e => {
    initAudio();
    if (mode !== 'game' && mode !== 'sandbox' && mode !== 'title') return;
    const cs = candidates(); let best = null, bd = 60 * U;
    for (const c of cs) { const d = Math.hypot(c[0] - e.clientX, c[1] - e.clientY); if (d < bd) { bd = d; best = c; } }
    if (best) talk(best);
  });
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || game.paused || game.reading) return;
    if (!nextChat) nextChat = t + 8000;
    if (t < nextChat || bubbles.length) return;
    nextChat = t + rnd(9000, 15000);
    const cs = candidates().filter(c => c[2] !== 'site'); if (cs.length) talk(pick(cs));
  }

  // =====================================================================
  // DÖNGÜ
  // =====================================================================
  let last = performance.now(), tick = 0, badness = 0, lastBg = '';
  function frame(now) {
    const dt = Math.min(FAST > 1 ? 1000 : 50, now - last); last = now;
    updateGame(dt); updateSandbox(dt);
    ctx.clearRect(0, 0, W, H);
    let st = null;
    if (mode === 'game' || mode === 'result') st = game.st;
    if (mode === 'sandbox') st = sb.st;
    const showMap = st && (mode === 'sandbox' || mode === 'result' || game.phase === 'map');
    if (showMap) drawMap(st, now, dt);
    else {
      const crowd = mode === 'game' && game.released ? Math.min(70, 8 + Math.floor((game.st.year - 1935 + game.frac) * 20)) : mode === 'title' ? 6 : 0;
      drawField(now, dt, crowd);
    }
    if (game.fade > 0 && mode === 'game') { game.fade = Math.max(0, game.fade - dt / 900); ctx.fillStyle = `rgba(233,240,222,${game.fade})`; ctx.fillRect(0, 0, W, H); }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.life -= 0.015 * (dt / 16); f.y -= 0.4 * U * (dt / 16);
      if (f.life <= 0) { floats.splice(i, 1); continue; }
      ctx.fillStyle = rgb(INK, f.life); ctx.font = `${18 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bb = bubbles[i]; bb.life -= 0.0035 * (dt / 16);
      if (bb.obj) { bb.x = bb.obj.x; bb.y = bb.obj.y; }
      if (bb.life <= 0) { bubbles.splice(i, 1); continue; }
      drawBubble(bb);
    }
    ambientChat(now);
    if (mode === 'game' && ++tick % 4 === 0) updatePanel();

    // arka plan: yerli avcılar azaldıkça kırmızıya kayar
    const s = st && (mode === 'sandbox' ? sb.hist : game.hist).slice(-1)[0];
    const target = s ? smooth(0.95, 0.35, s.pred) * 0.9 + smooth(5, 35, s.areaPct) * 0.25 : 0;
    badness = lerp(badness, clamp(target), 0.02);
    if (tick % 6 === 0) {
      const bg = rgb([233, 240, 222].map((v, i) => Math.round(v + ([244, 219, 209][i] - v) * badness)));
      if (bg !== lastBg) { document.documentElement.style.setProperty('--bg', bg); lastBg = bg; }
    }
    if (AC && chorus && tick % 10 === 0) chorus.gain.setTargetAtTime(st && !game.noToads ? clamp((s ? s.areaPct : 0) / 30) * 0.035 : (mode === 'title' ? 0.006 : 0), AC.currentTime, 0.8);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { resize(); buildField(); });
  resize(); buildField(); resetGame(); goTo(0);
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, sb, fieldToads, get mode() { return mode; } };
  requestAnimationFrame(frame);
})();
