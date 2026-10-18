// Bölüm — 24 Tavşanlık Felaket (1859–2000)
(() => {
  'use strict';
  const MISSION = {
    title: '24 Tavşanlık Felaket · 1859',
    role: 'Tavşan kurulunun başkanısın.',
    control: '<b class="inl">100 puanlık bütçe</b>: 🪤 tuzak, 🧱 çit, 🦠 virüs. Araçlar zamanla açılır.',
    goal: '2000\'de tavşan <b class="inl">200 milyonun</b> altında, otlak <b class="inl">%85</b>, yerli hayvanlar <b class="inl">%58</b> üstünde.',
    watch: 'Zehir yerli hayvanları da öldürür.',
  };
  const M = window.TavsanModel;
  const $ = id => document.getElementById(id);
  const { clamp, smooth } = M;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const f1 = v => v.toFixed(1).replace('.', ',');
  const num = v => Math.round(v).toLocaleString('tr-TR');
  const TOTAL = M.Y1 - M.Y0 + 1;
  const GOAL = { R: 200, G: 0.85, N: 0.58 };
  const HISTORY = M.run(TOTAL, M.histP);
  const COST = { trap: 1, fence: 1, vir: 1 };
  const rabText = R => R >= 1000 ? f1(R / 1000) + ' milyar' : R >= 1 ? num(R) + ' milyon' : R * 1e6 >= 1000 ? num(R * 1e6) : String(Math.max(0, Math.round(R * 1e6)));
  const eraName = (y, R) => y < 1870 ? 'Biraz av, biraz memleket' : y < 1895 ? 'Gri halı yayılıyor' : y < 1950 ? (R >= 1000 ? 'Milyarlarca tavşan' : 'Yüz milyonlarca tavşan') : y < 1960 ? 'Virüs' : y < 1995 ? 'Tavşan karşılık veriyor' : 'İkinci virüs';

  // =====================================================================
  // SES
  // =====================================================================
  let AC = null, master, windGain, muted = /[?&](debug|hizli|sessiz)\b/.test(location.search) || (() => { try { return localStorage.getItem('bny-ses') === '0'; } catch (e) { return false; } })();
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(AC.destination);
      const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = AC.createBufferSource(); s.buffer = buf; s.loop = true;
      const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 450;
      windGain = AC.createGain(); windGain.gain.value = 0.025; s.connect(f); f.connect(windGain); windGain.connect(master); s.start();
    } catch (e) { AC = null; }
  }
  function tone(f0, f1, dur, gain, type = 'sine') {
    if (!AC) return;
    const t = AC.currentTime, o = AC.createOscillator(), e = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(e); e.connect(master);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + 0.02); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const blip = () => tone(880, 660, 0.12, 0.03, 'triangle');
  const hop = () => tone(500, 900, 0.08, 0.02, 'triangle');
  const clang = () => tone(300, 200, 0.2, 0.03, 'square');
  if (muted) $('sound').innerHTML = '🔇 <span>Ses</span>';
  $('sound').onclick = () => {
    muted = !muted; initAudio();
    try { localStorage.setItem('bny-ses', muted ? '0' : '1'); } catch (e) {}
    if (AC) master.gain.setTargetAtTime(muted ? 0 : 0.8, AC.currentTime, 0.05);
    $('sound').innerHTML = muted ? '🔇 <span>Ses</span>' : '🔊 <span>Ses</span>';
  };

  // =====================================================================
  // SAHNE
  // =====================================================================
  const cv = $('world'), ctx = cv.getContext('2d');
  let W = 0, H = 0, U = 1, mobile = false;
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight; U = clamp(Math.min(W, H) / 800, 0.62, 1.35); mobile = W < 760;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSbChart(); if (mode === 'result') drawResultChart();
  }
  function layoutFor(m) {
    const L = { gt: 0.6, gb: 1, x1: 1 };
    if (m === 'game') {
      const pnl = document.querySelector('.slide.active .gpanel');
      const top = pnl ? pnl.getBoundingClientRect().top : H * 0.56;
      L.gb = clamp((top - 6) / H, 0.4, 0.88); L.gt = Math.max(mobile ? 0.36 : 0.32, L.gb - (mobile ? 0.42 : 0.4));
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') L.gt = 0.82;
    if (m === 'sandbox') { if (mobile) { L.gt = 0.3; L.gb = 0.46; } else { L.gt = 0.55; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.6, gb: 1, x1: 1 };
  const PAL = { bgOk: [233, 240, 222], bgBad: [238, 228, 210], sky: [210, 228, 236], skyDry: [236, 220, 196], ink: [43, 58, 46], grass: [122, 176, 96], dry: [200, 180, 130], dirt: [176, 150, 110] };
  const vis = { R: 0.000024, G: 1, N: 1, A: 0.0005, trap: 0, fence: 0, kV: 0, v: 0, q: 0, rain: 1, bad: 0 };
  const target = { ...vis };
  const bubbles = [], floats = [], pulses = [];
  const clouds = Array.from({ length: 3 }, () => ({ x: rnd(0, 1), y: rnd(0.08, 0.2), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000012) }));
  const bunnies = Array.from({ length: 70 }, (_, i) => ({ f: rnd(0.25, 0.98), r: rnd(0.15, 0.95), ph: rnd(0, 6), dir: Math.random() < 0.5 ? -1 : 1, hopT: rnd(0, 2000), sick: Math.random() }));
  const warrens = Array.from({ length: 14 }, () => ({ f: rnd(0.3, 0.95), r: rnd(0.2, 0.9) }));
  const sheep = Array.from({ length: 5 }, (_, i) => ({ f: 0.3 + i * 0.12, r: rnd(0.3, 0.6), ph: rnd(0, 6) }));
  const trappers = Array.from({ length: 3 }, () => ({ f: rnd(0.35, 0.9), dir: 1, on: 0, ph: rnd(0, 6) }));
  const bilby = { f: 0.92, r: 0.85 }, austin = { sx: undefined }, mosq = [];
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};

  function geo() {
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H, gh = gb - gt;
    return { x1, gt, gb, gh, Y: r => gt + gh * (0.12 + 0.82 * r) };
  }
  function drawBubble(bb) {
    const pad = 10 * U, fs = 17 * U;
    ctx.font = `${fs}px "Patrick Hand"`;
    const lines = bb.text.split('\n');
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2, h = lines.length * fs * 1.15 + pad * 1.4;
    const bx = bb.obj.x, by = bb.obj.y;
    let x = clamp(bx - w / 2, 8, W - w - 8), y = Math.max(52, by - h - 22 * U);
    if (window.SceneUtils && mode === 'game') ({ x, y } = window.SceneUtils.avoidHud(x, y, w, h));
    ctx.globalAlpha = clamp(bb.life * 3);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 12) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - 7, y + h - 1); ctx.lineTo(bx, y + h + 12 * U); ctx.lineTo(bx + 7, y + h - 1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgb(PAL.ink); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad * 0.7 + i * fs * 1.15));
    ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  }
  const sayAt = (obj, text) => { bubbles.length = 0; bubbles.push({ obj, text, life: 1 }); };
  function tag(x, y, text, o = {}) {
    const fs = Math.max(11, (o.fs || 13) * U);
    ctx.font = `${fs}px "Patrick Hand"`;
    const w = ctx.measureText(text).width + 12 * U, h = fs + 8 * U;
    let bx = clamp(x - w / 2, 4, lay.x1 * W - w - 4), by = y - h;
    if (window.SceneUtils && mode === 'game') ({ x: bx, y: by } = window.SceneUtils.avoidHud(bx, by, w, h));
    ctx.globalAlpha = o.a === undefined ? 0.95 : o.a;
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(43,58,46,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, h, h / 2) : ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.color || rgb(PAL.ink); ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 6 * U, by + h / 2 + 1); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  }
  const pulseAt = (getPos, col = '#e0b04a') => pulses.push({ getPos, t0: performance.now(), col });
  function person(x, y, s, o = {}) {
    const dir = o.dir || 1, st = o.step || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 1, 9, 2.4, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(-3 - st, 0); ctx.moveTo(2, -9); ctx.lineTo(3 + st, 0); ctx.stroke();
    ctx.fillStyle = o.shirt || '#6b8db5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -27, 14, 19, 5) : ctx.rect(-7, -27, 14, 19); ctx.fill();
    ctx.fillStyle = '#e9c49d'; ctx.beginPath(); ctx.arc(0, -33, 6.5, 0, 6.283); ctx.fill();
    if (o.hat) { ctx.fillStyle = o.hat; ctx.beginPath(); ctx.ellipse(0, -38, 10, 2.6, 0, 0, 6.283); ctx.fill(); ctx.fillRect(-5, -44, 10, 6); }
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(2.2, -34, 1.1, 0, 6.283); ctx.arc(-1.8, -34, 1.1, 0, 6.283); ctx.fill();
    if (o.gun) { ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(20, -30); ctx.stroke(); }
    if (o.trap) { ctx.strokeStyle = '#6a6a6a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(10, -12, 4, 0, 6.283); ctx.stroke(); }
    ctx.restore();
  }
  function bunny(x, y, s, dir, hopK, sick) {
    ctx.save(); ctx.translate(x, y - Math.max(0, Math.sin(hopK * Math.PI)) * 6 * s); ctx.scale(s * dir, s);
    ctx.fillStyle = sick ? '#b8a898' : '#9a8068';
    ctx.beginPath(); ctx.ellipse(0, -4, 6, 4.2, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -7, 3, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -12, 1.2, 3.6, 0.15, 0, 6.283); ctx.ellipse(6.6, -12, 1.2, 3.6, 0.4, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.arc(-6, -4, 1.8, 0, 6.283); ctx.fill();
    ctx.fillStyle = sick ? '#c06060' : rgb(PAL.ink); ctx.beginPath(); ctx.arc(6.4, -7.6, sick ? 1.3 : 0.8, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const G = geo(), { x1, gt, gb, gh } = G;
    const dry = clamp(1 - vis.rain) * 1.6, bare = 1 - vis.G;
    const sky = ctx.createLinearGradient(0, 0, 0, gt); sky.addColorStop(0, rgb(mixC(PAL.sky, PAL.skyDry, clamp(dry + bare * 0.4)))); sky.addColorStop(1, 'rgba(244,240,228,.6)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, x1, gt);
    ctx.fillStyle = 'rgba(246,210,104,.9)'; ctx.beginPath(); ctx.arc(x1 * 0.8, H * 0.13, 22 * U, 0, 6.283); ctx.fill();
    for (const cl of clouds) { cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15; const cx = cl.x * x1, cy = cl.y * H, s = 18 * U * cl.s; ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - dry)})`; ctx.beginPath(); ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283); ctx.fill(); }
    drawCounter(G);
    // otlak: tavşan yedikçe toprağa döner; kurak yılda sararır
    ctx.fillStyle = rgb(mixC(mixC(PAL.grass, PAL.dry, clamp(dry)), PAL.dirt, clamp(bare * 1.6))); ctx.fillRect(0, gt, x1, H - gt);
    ctx.strokeStyle = rgb(mixC(PAL.grass, PAL.dry, clamp(dry + bare)), 0.9); ctx.lineWidth = 1.5 * U;
    const tufts = Math.round(60 * vis.G);
    for (let i = 0; i < tufts; i++) { const x = ((i * 97) % 1000) / 1000 * x1, y = G.Y(((i * 61) % 100) / 100), h = 6 * U * vis.G; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2 * U, y - h); ctx.moveTo(x, y); ctx.lineTo(x + 2 * U, y - h * 1.1); ctx.stroke(); }
    // çiftlik evi ve Thomas Austin (ilk yıllarda)
    const hx = x1 * (mobile ? 0.04 : 0.26); ctx.fillStyle = '#c8a880'; ctx.fillRect(hx, gt - 34 * U, x1 * 0.1, 34 * U); ctx.fillStyle = '#8a4a3a'; ctx.beginPath(); ctx.moveTo(hx - x1 * 0.01, gt - 34 * U); ctx.lineTo(hx + x1 * 0.05, gt - 52 * U); ctx.lineTo(hx + x1 * 0.11, gt - 34 * U); ctx.fill();
    if (mode === 'game' && (curHist() || { y: gs.y }).y < 1872) { const ax = x1 * (mobile ? 0.2 : 0.4), ay = G.Y(0.2); austin.sx = ax; austin.sy = ay - 44 * U; person(ax, ay, U, { shirt: '#5a6a4a', hat: '#3a2a1a', gun: true }); } else austin.sx = undefined;
    // çit (kurulduysa): arkada; bakım azsa delikli
    if (game.fenceY) {
      const fy = G.Y(0.02), holes = 1 - vis.fence;
      ctx.strokeStyle = '#6a6a6a'; ctx.lineWidth = 1.2;
      for (let x = 0; x < x1; x += 14 * U) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x, fy - 16 * U); ctx.stroke(); }
      for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 0; x < x1; x += 14 * U) { const gap = ((x * 7 + k * 31) % 100) / 100 < holes * 0.5; if (gap) ctx.moveTo(x + 14 * U, fy - 4 * U - k * 5 * U); else ctx.lineTo(x + 14 * U, fy - 4 * U - k * 5 * U); } ctx.stroke(); }
    }
    // tavşan yuvaları: yoğunlukla
    const dens = clamp(Math.log10(1 + vis.R) / 3.5);
    const nW = Math.round(warrens.length * dens);
    for (let i = 0; i < nW; i++) { const w = warrens[i], x = w.f * x1, y = G.Y(w.r); w.sx = x; w.sy = y; ctx.fillStyle = '#6a5038'; ctx.beginPath(); ctx.ellipse(x, y, 9 * U, 4 * U, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.ellipse(x, y + 1 * U, 5 * U, 2.4 * U, 0, 0, 6.283); ctx.fill(); }
    // koyunlar: otlak azaldıkça zayıflar
    sheep.forEach((s, i) => { if (i >= Math.round(2 + 3 * vis.G)) return; const x = s.f * x1 + Math.sin(t * 0.0003 + s.ph) * 10 * U, y = G.Y(s.r); s.sx = x; s.sy = y - 20 * U; const k = 0.7 + 0.3 * vis.G; ctx.fillStyle = '#f2eee4'; ctx.beginPath(); ctx.ellipse(x, y - 8 * U, 12 * U * k, 7 * U, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(x + 12 * U * k, y - 10 * U, 3.5 * U, 0, 6.283); ctx.fill(); ctx.fillRect(x - 6 * U, y - 3 * U, 2 * U, 5 * U); ctx.fillRect(x + 5 * U, y - 3 * U, 2 * U, 5 * U); });
    // tavşanlar: sayı logaritmik; virüs varken bazıları hasta
    const nB = vis.R <= 0 ? 0 : Math.max(Math.min(24, Math.round(vis.R * 1e6)), Math.round(bunnies.length * clamp(Math.log10(1 + vis.R * 1e6) / 9.5)));
    for (let i = 0; i < Math.min(nB, bunnies.length); i++) {
      const b = bunnies[i]; b.hopT += dt; const k = (b.hopT % 1600) / 1600;
      if (k < 0.25) b.f += b.dir * 0.00002 * dt; if (b.f < 0.22 || b.f > 0.99) b.dir *= -1;
      const x = b.f * x1, y = G.Y(b.r); b.sx = x; b.sy = y - 14 * U;
      bunny(x, y, U * 1.2, b.dir, k < 0.25 ? k * 4 : 0, b.sick < vis.kV * 1.2);
    }
    // sivrisinek ve pire: virüs yayılırken
    const nM = Math.round(clamp(vis.kV * 2) * 24);
    while (mosq.length < nM) mosq.push({ x: rnd(0.3, 0.95), y: rnd(0.2, 0.7), ph: rnd(0, 6) }); while (mosq.length > nM) mosq.pop();
    ctx.fillStyle = 'rgba(40,40,40,.7)'; mosq.forEach(m => { const x = m.x * x1 + Math.sin(t * 0.004 + m.ph) * 8 * U, y = G.Y(m.y) - 30 * U + Math.cos(t * 0.005 + m.ph) * 6 * U; ctx.fillRect(x, y, 2 * U, 2 * U); });
    // tuzakçılar: tuzak ve zehirle
    const nT = Math.round(clamp(vis.trap) * trappers.length + (vis.trap > 0.05 ? 0.4 : 0));
    trappers.forEach((p, i) => { p.on = lerp(p.on, i < nT ? 1 : 0, 0.05); if (p.on < 0.05) { p.sx = undefined; return; } p.f += p.dir * 0.000016 * dt; if (p.f < 0.3 || p.f > 0.95) p.dir *= -1; const x = x1 * p.f, y = G.Y(0.45 + i * 0.18); p.sx = x; p.sy = y - 44 * U; ctx.globalAlpha = p.on; person(x, y, U * (mobile ? 0.8 : 0.95), { dir: p.dir, shirt: '#8a6a4a', hat: '#5a4a3a', trap: true, step: Math.sin(t * 0.02 + p.ph) * 3 }); ctx.globalAlpha = 1; });
    // bilbi: yerli hayvan; azaldıkça solar
    if (vis.N > 0.05) { const x = bilby.f * x1, y = G.Y(bilby.r); bilby.sx = x; bilby.sy = y - 14 * U; ctx.globalAlpha = clamp(vis.N * 1.3); ctx.fillStyle = '#9a8a9a'; ctx.beginPath(); ctx.ellipse(x, y - 5 * U, 7 * U, 5 * U, 0, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.ellipse(x - 7 * U, y - 12 * U, 2 * U, 6 * U, -0.3, 0, 6.283); ctx.ellipse(x - 4 * U, y - 13 * U, 2 * U, 6 * U, 0.1, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.5 * U; ctx.beginPath(); ctx.moveTo(x + 7 * U, y - 4 * U); ctx.lineTo(x + 16 * U, y - 8 * U); ctx.stroke(); ctx.globalAlpha = 1; } else bilby.sx = undefined;
    if (window.SceneUtils && window.SceneUtils.atmo && (mode === 'game' || mode === 'title')) window.SceneUtils.atmo(ctx, G.x1, H, { year: (mode === 'game' ? Math.max(M.Y0, gs.y - 1) : M.Y0 + 40), bad: vis.bad }); // dönem rengi ve kriz
    drawLabels(G);
    drawOfficial(G, t);
    if (view.k > 0.01) drawMap(G, t, view.k);
    if (view.k < 0.5) for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i], k = (t - p.t0) / 2400; if (k > 1) { pulses.splice(i, 1); continue; } const [x, y] = p.getPos(); if (x === undefined) continue; for (let j = 0; j < 2; j++) { const kk = (k * 2 + j * 0.5) % 1; ctx.strokeStyle = p.col; ctx.globalAlpha = (1 - kk) * 0.9; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.arc(x, y, (10 + kk * 40) * U, 0, 6.283); ctx.stroke(); } ctx.globalAlpha = 1; }
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt / 1300; f.y -= dt * 0.025; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = clamp(f.life * 2); ctx.font = `${16 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillStyle = f.col || rgb(PAL.ink); ctx.fillText(f.text, f.x, f.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt / 4200; if (b.life <= 0) { bubbles.splice(i, 1); continue; } drawBubble(b); }
  }
  // gökyüzünde büyük sayaç: 24 tavşanın üstel büyümesi
  function drawCounter(G) {
    if (mode !== 'game' && mode !== 'sandbox') return;
    const h = curHist(); if (!h) return;
    const y = Math.max(230 * U, G.gt * 0.72);
    tag(G.x1 * 0.5, y, `🐇 ${rabText(h.R)} tavşan`, { fs: 18, color: h.R > GOAL.R ? '#8a4a2a' : '#2f6a3a' });
  }
  function drawLabels(G) {
    if (mode !== 'game' && mode !== 'sandbox') return;
    const h = curHist(); if (!h) return;
    const fs = mobile ? 11 : 13;
    if (h.v > 0) tag(G.x1 * 0.62, G.gt + 2 * U, `🦠 Virüs öldürücülüğü %${Math.round(h.v * 100)} · tavşan direnci %${Math.round(h.q * 100)}`, { fs: fs - 1, color: h.q > 0.4 ? '#8a4a2a' : '#5a3a8a' });
    if (h.N < 0.6) tag(G.x1 * 0.88, G.gt + G.gh * 0.62, h.N < 0.4 ? '🦘 Yerli hayvanlar kayboluyor' : '🦘 Yerli hayvanlar azalıyor', { fs: fs - 1, color: '#a0402a' });
    if (h.G < 0.75) tag(G.x1 * 0.3, G.gt + G.gh * 0.9, '🌾 Otlak çıplak: toz fırtınası', { fs: fs - 1, color: '#a0402a' });
  }
  // harita: Avustralya; cephe Geelong'dan yayılır, çit Batı Avustralya'yı korur
  const view = { want: 'scene', k: 0, until: 0, user: false };
  function setView(v, ms) { view.want = v; view.user = !ms; view.until = ms ? performance.now() + ms : 0; const b = $('g-view'); if (b) b.textContent = v === 'map' ? '🌾 Çiftlik' : '🗺️ Harita'; }
  const OZ = [[0.08, 0.42], [0.14, 0.3], [0.3, 0.2], [0.42, 0.1], [0.5, 0.13], [0.55, 0.05], [0.62, 0.15], [0.7, 0.08], [0.78, 0.02], [0.82, 0.2], [0.9, 0.35], [0.97, 0.5], [0.95, 0.68], [0.85, 0.85], [0.76, 0.9], [0.66, 0.82], [0.56, 0.74], [0.44, 0.7], [0.3, 0.74], [0.16, 0.78], [0.08, 0.68], [0.05, 0.55]];
  const GEE = [0.78, 0.88], WAX = 0.38;
  function drawMap(G, t, alpha) {
    const top = 150 * U, H2 = Math.max(80, G.gb - top - 10 * U), Wm = Math.min(G.x1 * 0.92, H2 * 1.25), Hm = Wm / 1.25, ox = (G.x1 - Wm) / 2, oy = top + (H2 - Hm) / 2;
    const X = p => ox + p * Wm, Y = p => oy + p * Hm;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#9cc4dc'; ctx.fillRect(0, 0, G.x1, H);
    ctx.beginPath(); OZ.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.closePath();
    ctx.fillStyle = '#e8d8a8'; ctx.fill();
    ctx.save(); ctx.clip();
    const A = vis.A, r = (0.6 * A + 0.35 * smooth(0.75, 1, A)) * Wm;
    const fenced = game.fenceY && game.fenceOk;
    ctx.fillStyle = 'rgba(140,110,80,.6)'; ctx.beginPath(); ctx.arc(X(GEE[0]), Y(GEE[1]), r, 0, 6.283); ctx.fill();
    if (fenced) { ctx.fillStyle = `rgba(232,216,168,${0.85 * vis.fence + 0.3})`; ctx.fillRect(X(0), Y(0), X(WAX) - X(0), Hm); }
    ctx.restore();
    if (game.fenceY) { ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 3 * U; ctx.setLineDash([6 * U, 3 * U]); ctx.beginPath(); ctx.moveTo(X(WAX), Y(0.14)); ctx.lineTo(X(WAX + 0.02), Y(0.72)); ctx.stroke(); ctx.setLineDash([]); tag(X(WAX + 0.02), Y(0.8), `🧱 Tavşan çiti${!game.fenceDoneY ? ' (yapılıyor)' : fenced ? '' : ' (geç kaldı)'}`, { fs: 12 }); }
    ctx.fillStyle = '#c0503a'; ctx.beginPath(); ctx.arc(X(GEE[0]), Y(GEE[1]), 4 * U, 0, 6.283); ctx.fill();
    tag(X(GEE[0]), Y(GEE[1]) - 6 * U, '1859: Geelong yakınında 24 tavşan', { fs: 11 });
    tag(X(0.5), Y(1.0) + 6 * U, `🗺️ Tavşanların yayıldığı alan: %${Math.round(A * 100)} · dokun: çiftliğe dön`, { fs: 12 });
    ctx.restore();
  }

  // =====================================================================
  // KONUŞMALAR
  // =====================================================================
  function lines(kind) {
    const h = curHist() || { R: 0, G: 1 };
    const P = {
      bunny: h.R > 500 ? ['Kardeşlerim\nsayılamaz!', 'Bu ot\nbizim!', 'Bir yılda\nbeş batın!'] : h.R > 1 ? ['Yeni yuva\nkazıyorum.', 'Burası\ncennet!', 'Tilki var mı?'] : ['Yeni bir\nkıtadayız!', 'Kimse bizi\nyemiyor burada.', 'Ne güzel ot!'],
      sheep: h.G > 0.8 ? ['Ot bol,\nmeee!', 'Tavşanlar da\nyiyor ama...'] : ['Ot kalmadı,\nmeee...', 'Tavşan her\nyeri kemirmiş!'],
      trapper: h.R > 500 ? ['Bir günde yüz tavşan!\nKürkü satılır.', 'Zehirli havuç\nkoydum.', 'Bitmez ki bunlar!'] : ['Tuzaklar\nboş kaldı.', 'Yerli hayvanlara da\nzarar veriyoruz...', 'Az kaldı!'],
      austin: ['Biraz av,\nbiraz memleket!', 'Birkaç tavşan\nne zarar verir ki?', 'Av sezonu\naçıldı!'],
      warren: ['Bu yuvanın altında\nyüz tavşan var.', 'Yuva sökülmezse\ntekrar dolar.'],
      bilby: ['Yuvamı\ntavşanlar kaptı.', 'Zehirli havucu\nben de yedim...', 'Ben buranın\nyerlisiyim!'],
      official: ['Kararınızı\nbekliyoruz.', 'Kurul\ntoplandı.'],
    };
    return pick(P[kind] || ['...']);
  }
  function talkAt(x, y) {
    if (view.k > 0.5) { setView('scene'); return true; }
    const c = [], add = (sx, sy, kind, fn) => { if (sx !== undefined && !isNaN(sy)) c.push({ d: Math.hypot(sx - x, sy - y), kind, fn, obj: { x: sx, y: sy } }); };
    bunnies.forEach(b => add(b.sx, b.sy, 'bunny', () => hop()));
    sheep.forEach(s => add(s.sx, s.sy, 'sheep'));
    trappers.forEach(p => add(p.sx, p.sy, 'trapper'));
    warrens.forEach(w => add(w.sx, w.sy, 'warren', () => { if (tapCount('warren') >= 3) award('tav-yuva'); }));
    add(austin.sx, austin.sy, 'austin', () => award('tav-austin'));
    add(bilby.sx, bilby.sy, 'bilby', () => award('tav-bilbi-dost'));
    if (official && official.x) add(official.x, official.y, 'official');
    if (!c.length) return false;
    c.sort((a, b) => a.d - b.d);
    sayAt(c[0].obj, lines(c[0].kind)); blip(); if (c[0].fn) c[0].fn(); if (window.Camera) window.Camera.focus(c[0].obj.x, c[0].obj.y + 30 * U); // dokunulan yere yakınlaş
    return true;
  }
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || bubbles.length || view.k > 0.5) return;
    if (!nextChat) nextChat = t + 8000;
    if (t < nextChat) return;
    nextChat = t + rnd(10000, 17000);
    const opts = [];
    bunnies.slice(0, 6).forEach(b => b.sx !== undefined && opts.push(['bunny', b]));
    trappers.forEach(p => p.sx !== undefined && opts.push(['trapper', p]));
    sheep.forEach(s => s.sx !== undefined && Math.random() < 0.3 && opts.push(['sheep', s]));
    if (!opts.length) return;
    const [k, p] = pick(opts); sayAt({ get x() { return p.sx; }, get y() { return p.sy; } }, lines(k));
  }

  let official = null;
  function drawBody(g, who, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = who === 'sci' ? '#f4f2ea' : who === 'farm' ? '#8a6a4a' : '#4f6a8a'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    if (who === 'farm') { g.fillStyle = '#c8a870'; g.beginPath(); g.ellipse(0, -42, 12, 3, 0, 0, 6.283); g.fill(); g.fillRect(-6, -49, 12, 7); }
    else if (who === 'sci') { g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 1; g.strokeRect(-5.5, -39, 4, 3); g.strokeRect(1.5, -39, 4, 3); }
    else { g.fillStyle = '#4a3a2a'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill(); }
    g.fillStyle = rgb(PAL.ink); g.beginPath(); g.arc(-2.6, -37, 1.2, 0, 6.283); g.arc(2.6, -37, 1.2, 0, 6.283); g.fill();
  }
  function portrait(who) {
    const c = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 120, h = 150;
    c.width = w * dpr; c.height = h * dpr; c.className = 'portrait';
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(w / 2, h - 8); g.scale(2.7, 2.7);
    drawBody(g, who, 0); return c;
  }
  function drawOfficial(G, t) {
    if (!official || view.k > 0.5) return;
    const now = performance.now(), e = now - official.t0;
    const stopX = G.x1 * (mobile ? 0.3 : 0.32), startX = -40;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    const leaving = official.leave && now > official.leave;
    if (leaving) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = G.Y(0.5), s = 1.1 * U, walk = e < 1500 || leaving;
    official.x = x; official.y = y - 52 * U;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (leaving ? -1 : 1), s); drawBody(ctx, official.who, walk ? Math.sin(t * 0.02) * 4 : 0); ctx.restore();
    const text = official.reply || (e > 1300 ? official.say : null);
    if (text && official.lastText !== text) { official.lastText = text; sayAt(official, text); }
  }

  // =====================================================================
  // SLAYTLAR
  // =====================================================================
  const slides = [...document.querySelectorAll('.slide')];
  let cur = 0, maxSeen = 0, mode = 'title';
  const DONE_KEY = 'bny-bitti-tavsan';
  const wasDone = (() => { try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; } })();
  if (wasDone) maxSeen = slides.length - 1;
  const dotsEl = $('dots');
  slides.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', `Adım ${i + 1}`); b.onclick = () => { if (i <= maxSeen) goTo(i); }; dotsEl.appendChild(b); });
  const slideOf = m => slides.findIndex(x => x.dataset.mode === m);
  function paintDots() { [...dotsEl.children].forEach((d, k) => { d.classList.toggle('on', k === cur); d.classList.toggle('seen', k <= maxSeen); d.disabled = k > maxSeen; }); }
  function replayNav() {
    const t = slides[slideOf('title')]; if (!t || t.querySelector('.replay-nav')) return;
    const nav = document.createElement('div'); nav.className = 'replay-nav';
    nav.innerHTML = '<span>Bu bölümü bitirdin. Doğrudan geç:</span>';
    [['sandbox', '🧪 Laboratuvar'], ['facts', '📜 Gerçekte ne oldu?'], ['lessons', '💡 Ne öğrendik?']].forEach(([m, l]) => { const b = document.createElement('button'); b.textContent = l; b.onclick = () => goTo(slideOf(m)); nav.appendChild(b); });
    (t.querySelector('.glass') || t).appendChild(nav);
  }
  function goTo(i) {
    if (i < 0 || i >= slides.length) return;
    if (mode === 'game' && game.state !== 'end') game.paused = true;
    if (mode === 'sandbox') sb.running = false;
    slides[cur].classList.remove('active');
    cur = i; maxSeen = Math.max(maxSeen, i);
    slides[cur].classList.add('active'); slides[cur].scrollTop = 0;
    mode = slides[cur].dataset.mode;
    paintDots();
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-tavsan', 'Başladı: 24 Tavşanlık Felaket'); enterGame(); }
    if (mode === 'result') renderResult();
    if (mode === 'sandbox') enterSandbox();
  }
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => { initAudio(); goTo(cur + 1); }));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { resetGame(); goTo(slideOf(b.dataset.goto)); }));
  window.addEventListener('keydown', e => { if (e.key === 'ArrowRight' && cur < maxSeen) goTo(cur + 1); if (e.key === 'ArrowLeft' && cur > 0) goTo(cur - 1); });

  // =====================================================================
  // BİLDİRİMLER
  // =====================================================================
  const FAST = /[?&]hizli\b/.test(location.search) ? 8 : 1;
  const toastQueue = [];
  let lastToastAt = -1e9;
  function toast(...args) {
    args.born = gs ? gs.y : 0;
    toastQueue.push(args);
    while (toastQueue.length > 6) { const k = toastQueue.findIndex(a => !(a[4] || {}).pause && !(a[4] || {}).keep); if (k < 0) break; toastQueue.splice(k, 1); }
    pumpToasts();
  }
  function pumpToasts() {
    if (!toastQueue.length || mode !== 'game') return;
    for (let i = toastQueue.length - 1; i >= 0; i--) { const a = toastQueue[i]; if (!(a[4] || {}).pause && a.born !== undefined && gs.y - a.born > ((a[4] || {}).keep ? 4 : 3)) toastQueue.splice(i, 1); }
    if (!toastQueue.length) return;
    const box = $('toasts'), visible = box.querySelectorAll('.toast:not(.out)').length;
    const k = toastQueue.findIndex(a => (a[4] || {}).pause);
    if (visible >= (mobile ? 1 : 2) || (k < 0 && performance.now() - lastToastAt < 9000 / FAST / Math.sqrt(game.speed || 1))) return;
    const next = toastQueue.splice(k >= 0 ? k : 0, 1)[0];
    lastToastAt = performance.now();
    showToast(...next);
  }
  setInterval(pumpToasts, 300);
  function showToast(ic, from, text, tone = '', opt = {}) {
    // haber bandı: durdurmayan haberler kart değil, tek satır manşet
    if (!opt.pause && window.SceneUtils && window.SceneUtils.ticker && window.SceneUtils.ticker(ic, from, text, tone, 7000 / Math.sqrt(game.speed || 1))) { if (opt.then) setTimeout(opt.then, 3000 / FAST); return; }
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + tone;
    el.innerHTML = `<div class="ic">${ic}</div><div><span class="from">${from}</span>${text}${opt.pause ? '<button class="go">Devam →</button>' : '<span class="x">dokun: kapat</span>'}</div>`;
    if (opt.pause) { el.classList.add('pause'); game.reading = (game.reading || 0) + 1; }
    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      el.classList.add('out');
      lastToastAt = Math.max(lastToastAt, performance.now() - 9000 / FAST + 5000 / FAST);
      if (opt.pause) game.reading = Math.max(0, (game.reading || 1) - 1);
      if (opt.then) setTimeout(opt.then, 3000 / FAST);
      setTimeout(() => { el.remove(); pumpToasts(); }, 400);
    };
    el.onclick = close;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    const plain = text.replace(/<[^>]+>/g, '');
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 1500 + plain.length * 83)) / (typeof FAST === 'number' ? FAST : 1)); // okuma süresi: saniyede ~12 karakter (oyun hızından bağımsız)
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const YEAR = 2600 / FAST;
  let gs = M.newState();
  const game = {};
  const SL = { trap: $('g-trap'), fence: $('g-fence'), vir: $('g-vir') };
  const award = id => (window.Badges ? window.Badges.award(id) : false);
  const choiceQ = [];
  const curHist = () => { if (game.replay && mode === 'game') return HISTORY.hist[Math.min(HISTORY.hist.length - 1, Math.floor(game.replay.i))]; const s = mode === 'sandbox' ? sb.st : gs; return s.hist.length ? s.hist[s.hist.length - 1] : null; };

  function makeDroughts() { const d = []; while (d.length < 6) { const y = 1872 + Math.floor(Math.random() * 126); if (d.every(x => Math.abs(x - y) > 6) && [1950, 1995, 1937, 1886, 1969].every(b => Math.abs(b - y) > 1)) d.push(y); } return d; }
  function makeWets(dr) { const w = []; while (w.length < 5) { const y = 1885 + Math.floor(Math.random() * 112); if (w.every(x => Math.abs(x - y) > 5) && dr.every(x => Math.abs(x - y) > 2) && [1950, 1995, 1937, 1969].every(b => Math.abs(b - y) > 1)) w.push(y); } return w; }
  function resetGame() {
    gs = M.newState();
    Object.assign(game, {
      replay: null, started: false, paused: false, state: 'play', frac: 0, fired: new Set(), hist: [], speed: 1, touched: false, reading: 0, story: false, endAfter: false,
      p: { trap: 0, fence: 0, vir: 0 }, unlocked: { trap: false, fence: false, vir: false }, moved: {}, used: 0, sat: 70,
      droughts: makeDroughts(), wets: [], fenceY: 0, fenceOk: false, fenceDoneY: 0, fenceDone: 0, fenceA: 0, myxoY: 0, flea: 0, research: 0, replaced: false,
    });
    game.wets = makeWets(game.droughts);
    Object.values(SL).forEach(el => { el.value = 0; el.disabled = true; });
    $('w-trap').classList.add('locked'); $('w-fence').classList.add('locked'); $('w-vir').classList.add('locked');
    $('o-trap').textContent = "🔒 1883'te açılır"; $('o-fence').textContent = '🔒 çit yok'; $('o-vir').textContent = '🔒 virüs yok';
    document.querySelectorAll('.coach').forEach(uncoach);
    readPolicy();
    $('g-pause').textContent = '❚❚ Durdur'; setSpeed(1);
    $('modal').hidden = true; $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone'); $('row-native').hidden = true; $('row-trust').hidden = true;
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {}; if (window.SceneUtils && window.SceneUtils.decadeReset) window.SceneUtils.decadeReset();
    choiceQ.length = 0; official = null; setView('scene');
  }
  function readPolicy(moved) {
    const pts = k => Number(SL[k].value) * COST[k];
    let used = Object.keys(SL).reduce((a, k) => a + (game.unlocked[k] ? pts(k) : 0), 0);
    if (used > 100 && moved) { const others = used - pts(moved); SL[moved].value = Math.max(0, Math.floor((100 - others) / COST[moved] / 5) * 5); used = others + pts(moved); floats.push({ x: W / 2, y: lay.gb * H - 20, text: 'Bütçe doldu: başka araçtan puan çek', life: 1.4, col: '#a0402a' }); }
    ['trap', 'fence', 'vir'].forEach(k => { game.p[k] = game.unlocked[k] ? SL[k].value / 100 : 0; if (game.unlocked[k]) $('o-' + k).textContent = Math.round(pts(k)) + ' puan'; });
    $('b-trap').style.width = (game.unlocked.trap ? pts('trap') : 0) + '%'; $('b-fence').style.width = (game.unlocked.fence ? pts('fence') : 0) + '%'; $('b-vir').style.width = (game.unlocked.vir ? pts('vir') : 0) + '%';
    $('g-budget').textContent = Math.max(0, Math.round(100 - used)) + ' puan boşta';
    game.used = used;
  }
  const arrowTxt = (a, b, f, upGood) => { const better = upGood ? b > a : b < a, same = Math.abs(b - a) < 1e-9 || f(a) === f(b); return `${f(a)} → <b class="${same ? '' : better ? 'up' : 'down'}">${f(b)}</b>`; };
  // "Ne olur?": aynı dünyayı 5 yıl eski ve yeni ayarla koştur
  function simTav(pol, n = 5) {
    const st = JSON.parse(JSON.stringify(gs)); st.hist = [];
    for (let i = 0; i < n && st.y <= M.Y1; i++) { const y = st.y; const fenceBuilt = game.fenceY && y >= game.fenceY + 6 ? { y: game.fenceY + 6, A: game.fenceA } : 0; M.step(st, { ...pol, rain: 1, fenceBuilt, myxo: game.myxoY && y >= game.myxoY ? 1 : 0, flea: game.flea && y >= game.flea ? 1 : 0, rhdv: y >= 1995 ? 1 : 0 }); }
    return st.hist[st.hist.length - 1];
  }
  if (window.SceneUtils && window.SceneUtils.watchSliders) window.SceneUtils.watchSliders(Object.values(SL), () => game.p, (a, b) => {
    if (mode !== 'game' || !gs.hist.length) return null;
    const A = simTav(a), B = simTav(b); if (!A || !B) return null;
    return { html: `▶ <span class="k">5 yıl sonra</span> 🐇 ${arrowTxt(A.R, B.R, rabText, false)} · 🦘 ${arrowTxt(A.N, B.N, v => '%' + Math.round(v * 100), true)} · 🌾 ${arrowTxt(A.Gtot, B.Gtot, v => '%' + Math.round(v * 100), true)}` };
  });
  Object.entries(SL).forEach(([k, el]) => el.addEventListener('input', () => { initAudio(); game.moved[k] = 1; readPolicy(k); if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); } }));
  $('g-pause').onclick = () => { game.paused = !game.paused; $('g-pause').textContent = game.paused ? '▶ Devam' : '❚❚ Durdur'; };
  $('g-view').onclick = e => { e.stopPropagation(); initAudio(); setView(view.want === 'map' ? 'scene' : 'map'); };
  function setSpeed(v) { game.speed = v; $('g-speed').textContent = v + '×'; $('yb-speed').querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.s) === v)); }
  $('g-speed').onclick = () => setSpeed(game.speed === 1 ? 2 : game.speed === 2 ? 4 : 1);
  $('yb-speed').querySelectorAll('button[data-s]').forEach(b => b.onclick = e => { e.stopPropagation(); initAudio(); setSpeed(Number(b.dataset.s)); });
  function coach(input, text, ms = 14000) {
    const card = input.closest('.sl'); if (!card || input.disabled) return;
    document.querySelectorAll('.coach').forEach(uncoach);
    card.classList.add('coach');
    const tip = document.createElement('div'); tip.className = 'coach-tip'; tip.textContent = text; card.appendChild(tip);
    input.addEventListener('input', () => uncoach(card), { once: true });
    if (ms) card._coachT = setTimeout(() => uncoach(card), ms);
  }
  function uncoach(card) { card.classList.remove('coach'); card.querySelectorAll('.coach-tip').forEach(t => t.remove()); clearTimeout(card._coachT); }
  function once(key, fn) { if (game.fired && !game.fired.has(key)) { game.fired.add(key); fn(); } }
  const milestone = (ic, from, text, tone, then) => { if (game.speed > 1) setSpeed(1); showToast(ic, from, text, tone, { pause: true, then }); };
  const comeOfficial = (who, say) => { official = { t0: performance.now(), leave: 0, who, say }; };
  // sinematik sahne: oyun durur, atlanabilir; bölümü bitiren tekrar oynarken atlanır
  function cine(spec, then) {
    if (!window.Cinema) { if (then) then(); return; }
    if (game.speed > 1) setSpeed(1);
    game.reading = (game.reading || 0) + 1;
    window.Cinema.play({ skipIfSeen: wasDone, ...spec }, () => { game.reading = Math.max(0, game.reading - 1); if (then) then(); });
  }
  function guide(steps, then) {
    if (!window.SceneUtils || !window.SceneUtils.tour || wasDone) { if (then) then(); return; }
    game.reading = (game.reading || 0) + 1;
    window.SceneUtils.tour(steps, () => { game.reading = Math.max(0, game.reading - 1); if (then) then(); });
  }
  function drawRabbit(g, x, y, s, hop) { g.save(); g.translate(x, y - Math.max(0, Math.sin(hop)) * 14 * s); g.scale(s, s); g.fillStyle = '#9a8068'; g.beginPath(); g.ellipse(0, -8, 12, 8, 0, 0, 6.28); g.fill(); g.beginPath(); g.arc(10, -14, 6, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(10, -24, 2.4, 7, 0.15, 0, 6.28); g.ellipse(13, -24, 2.4, 7, 0.4, 0, 6.28); g.fill(); g.fillStyle = '#f4f0e8'; g.beginPath(); g.arc(-12, -8, 3.5, 0, 6.28); g.fill(); g.restore(); }
  const CINE = {
    arrive: { id: 'tav-1859', year: '1859', title: 'Barwon Park, Victoria', shots: [
      { dur: 4600, bg: '#9cc4dc', text: 'İngiltere\'den aylarca süren yolculuk. Ambarda bir sandık tavşan.', draw: (g, t, W, H, k) => {
        g.fillStyle = '#5a8ab0'; g.fillRect(0, H * 0.62, W, H); const x = W * (0.15 + 0.5 * k), y = H * 0.62 + Math.sin(t * 0.002) * 4;
        g.fillStyle = '#5a3a2a'; g.beginPath(); g.moveTo(x - 90, y - 10); g.lineTo(x + 90, y - 10); g.lineTo(x + 70, y + 22); g.lineTo(x - 70, y + 22); g.fill();
        g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x, y - 130); g.stroke(); g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(x + 4, y - 125); g.lineTo(x + 70, y - 40); g.lineTo(x + 4, y - 40); g.fill(); g.beginPath(); g.moveTo(x - 4, y - 110); g.lineTo(x - 55, y - 40); g.lineTo(x - 4, y - 40); g.fill();
        g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 12; i++) g.fillRect((i * 97 + t * 0.05) % W, H * 0.66 + (i % 4) * 14, 22, 2); } },
      { dur: 5600, bg: '#c8d8a0', text: '"Biraz av, biraz memleket." Thomas Austin sandığı açıyor: 24 tavşan serbest.', draw: (g, t, W, H, k) => {
        g.fillStyle = '#9ab070'; g.fillRect(0, H * 0.6, W, H); g.fillStyle = '#8a6a3a'; g.fillRect(W * 0.12, H * 0.6, W * 0.12, H * 0.1);
        for (let i = 0; i < 24; i++) { const d = Math.min(1, Math.max(0, k * 1.6 - i * 0.03)); const x = W * 0.18 + d * W * (0.1 + (i % 6) * 0.13), y = H * (0.7 + (i % 4) * 0.06); if (d > 0) drawRabbit(g, x, y, Math.min(W, H) / 700, t * 0.012 + i); } } },
      { dur: 4600, bg: '#d8c8a0', text: 'Burada onları avlayan neredeyse yok. Bir dişi yılda 30\'dan fazla yavru doğurabilir.', draw: (g, t, W, H, k) => { window.Cinema.fx.counter(g, W, H, 24, 2000000, k, { y: H * 0.5, suffix: ' tavşan' }); g.font = `${Math.min(W, H) * 0.04}px "Patrick Hand"`; g.textAlign = 'center'; g.fillStyle = '#3a2a1a'; g.fillText(`${1859 + Math.round(k * 17)}`, W / 2, H * 0.62); } },
    ] },
    myxo: { id: 'tav-1950', year: '1950', title: 'Murray Vadisi', credit: 'CSIRO Arşivi, CC BY 3.0', shots: [
      { img: '../../assets/img/cards/csiro-scienceimage-2232-releasing-the-myxoma-virus-for-rabbi.jpg', kb: [0.5, 0.45, 1.05, 0.45, 0.4, 1.3], dur: 5200, text: 'Bilim insanları virüs taşıyan tavşanları salıyor. Önce hiçbir şey olmuyor.' },
      { dur: 5000, bg: '#3a4a3a', text: 'Sonra yağmurlu bir yaz. Sivrisinekler virüsü bir yaz içinde binlerce kilometre taşıyor.', draw: (g, t, W, H, k) => {
        g.fillStyle = 'rgba(200,220,255,.25)'; for (let i = 0; i < 80; i++) g.fillRect((i * 53) % W, (i * 31 + t * 0.4) % H, 1.5, 12);
        g.fillStyle = 'rgba(20,20,20,.85)'; const n = Math.round(30 + 200 * k); for (let i = 0; i < n; i++) { const x = (i * 71.3 + Math.sin(t * 0.004 + i) * 30 + k * W * 0.6) % W, y = H * 0.3 + (i * 37) % (H * 0.4) + Math.cos(t * 0.005 + i) * 10; g.fillRect(x, y, 3, 3); } } },
    ] },
  };

  function unlock(k, text, tip, value) {
    game.unlocked[k] = true; SL[k].disabled = false; $('w-' + k).classList.remove('locked'); if (value !== undefined) SL[k].value = value; readPolicy();
    milestone(k === 'trap' ? '🪤' : k === 'fence' ? '🧱' : '🦠', 'Yeni araç', text, '', () => !game.moved[k] && coach(SL[k], tip));
  }

  const STORY = [
    ['🐇', '1859', '24 tavşan serbest. Sayaca bak: ne kadar çabuk çoğalıyorlar?', '', { pause: false }],
    
  ];
  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (game.started) return;
    game.started = true; game.story = true; // görev kartı kapanana kadar zaman durur
    $('g-intro').classList.add('gone'); // görev kartı ve sahne anlatıyor; ekranda ayrıca yazı yok
    Object.assign(vis, { R: 0.000024, G: 1, N: 1, A: 0.0005 });
    const show = i => {
      if (mode !== 'game') return;
      if (i >= STORY.length) { game.story = false; return; }
      const [ic, from, text, tone, opt0] = STORY[i];
      const opt = wasDone ? { ...opt0, pause: false, ms: 6000 } : opt0;
      toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
      if (!opt.pause) setTimeout(() => show(i + 1), 4500 / Math.max(1, FAST / 2));
    };
    const start = () => { if (wasDone) game.story = false; setTimeout(() => cine(CINE.arrive, () => wasDone ? show(0) : startReplay(() => show(0))), 300); };
    start(); // görev kartı yok: hedef, tarih filmi bitince 'şimdi sen' kartında
  }
  // 📼 önce tarih: tarihteki ayarlarla hızlı bir film; sonra geri sarılır ve oyuncuya bırakılır
  const REPLAY_NEWS = { 1875: ['🗺️', 'Tavşanlar yılda ~100 km ilerliyor'], 1883: ['🪤', 'Tuzak ve zehir yasası'], 1907: ['🧱', 'Çit bitti, ama tavşanlar çoktan geçmişti'], 1930: ['🌪️', 'Kuraklık ve toz fırtınaları'], 1950: ['🦠', 'Virüs salındı: tavşanların çoğu öldü'], 1975: ['🧬', 'Tavşanlar direnç kazandı, geri döndüler'], 1995: ['🦠', 'İkinci virüs adadan kaçtı'] };
  function startReplay(then) {
    game.replay = { i: 0, phase: 'play', then }; game.story = true;
    Object.values(SL).forEach(el => el.closest('.sl').classList.add('replaying'));
    const b = document.createElement('div'); b.className = 'rbanner'; b.innerHTML = '<span>📼 <b>Önce tarih:</b> gerçekte ne oldu? (hızlı)</span><button type="button">Geç ⏭</button>';
    document.body.appendChild(b); game.replay.el = b;
    const pnl = document.querySelector('.slide.active .gpanel'); if (pnl) b.style.bottom = (innerHeight - pnl.getBoundingClientRect().top + 10) + 'px'; // panelin hemen üstünde b.querySelector('button').onclick = () => endReplay(true);
    setView('scene');
  }
  function endReplay(skip) {
    const r = game.replay; if (!r || r.phase === 'done') return;
    if (skip || r.phase === 'play') { r.phase = 'rewind'; r.from = r.i; r.t = 0; if (r.el) r.el.querySelector('span').innerHTML = '⏪ <b>Geri sarılıyor…</b>'; return; }
  }
  function replayTick(dt) {
    const r = game.replay, N = HISTORY.hist.length;
    if (r.phase === 'play') {
      const prev = Math.floor(r.i); r.i = Math.min(N - 1, r.i + dt / 125);
      const y = HISTORY.hist[Math.floor(r.i)].y; for (let yy = HISTORY.hist[prev].y + 1; yy <= y; yy++) if (REPLAY_NEWS[yy] && window.SceneUtils && window.SceneUtils.ticker) window.SceneUtils.ticker(REPLAY_NEWS[yy][0], 'Tarih', `${yy}: ${REPLAY_NEWS[yy][1]}`, 'warn', 2600);
      if (r.i >= N - 1) { r.hold = (r.hold || 0) + dt; if (r.hold > 1400) endReplay(); }
    } else if (r.phase === 'rewind') {
      r.t += dt; r.i = Math.max(0, r.from * (1 - Math.min(1, r.t / 1500)));
      if (r.t >= 1500) {
        r.phase = 'done'; if (r.el) r.el.remove(); Object.values(SL).forEach(el => el.closest('.sl').classList.remove('replaying'));
        const last = HISTORY.hist[N - 1];
        game.replay = null; game.story = true;
        showToast('⏪', '1859 · şimdi sen', `Tarihte 2000'de <b>${rabText(last.R)}</b> tavşan kaldı. <b>Hedefin:</b> 200 milyonun altı, otlak ve yerli hayvanlar sağlam. Sen daha iyisini yapabilir misin?`, '', { pause: true, then: () => { game.story = false; if (r.then) r.then(); } });
      }
    }
  }
  function updateGame(dt) {
    if (game.replay && mode === 'game') { replayTick(dt); return; }
    if (mode !== 'game' || game.paused || game.reading || game.story || game.state !== 'play' || gs.y > M.Y1) return;
    const visible = $('toasts').querySelector('.toast:not(.out)');
    const pace = visible ? 1.5 : toastQueue.length ? 0.95 : 0.47;
    const y = gs.y, k = y < 1880 ? 0.5 : (y > 1910 && y < 1945) || (y > 1960 && y < 1992) ? 0.6 : 1;
    const dur = YEAR * k / game.speed;
    game.frac += dt / (dur * pace);
    if (game.frac >= 1) { game.frac -= 1; yearTick(); }
  }
  function choice(from, title, text, opts, who) {
    if (game.state === 'choice') { choiceQ.push([from, title, text, opts, who]); return; }
    game.state = 'choice';
    const m = $('modal');
    m.innerHTML = `<div class="card talk"><div class="who"></div><div><div class="from">${from}</div><h2>${title}</h2><p class="speech">${text}</p><div class="opts"></div></div></div>`;
    m.querySelector('.who').appendChild(portrait(who || 'off'));
    const box = m.querySelector('.opts');
    opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'opt';
      b.innerHTML = `${o.label}<small>${o.sub}</small>`;
      let used = false;
      b.onclick = () => {
        if (used) return; used = true;
        m.hidden = true; game.state = 'play'; initAudio(); o.fn(); if (official) official.leave = performance.now() + 1800;
        if (choiceQ.length && game.state === 'play' && !game.replaced) setTimeout(() => choice(...choiceQ.shift()), 900);
        else if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
      };
      box.appendChild(b);
    });
    m.hidden = false;
  }
  function askFence(y) {
    comeOfficial('farm', 'Batı\'dan haber var.');
    const A = gs.A, far = A < 0.6;
    choice('Batı Avustralya hükümeti', 'Çit kuralım mı?', `"Tavşan cephesi ${far ? 'hâlâ uzakta' : '<b>sınıra yaklaştı</b>'}. Kıtayı boydan boya kesen bir çit kurarsak Batı\'yı koruyabiliriz. Yapımı <b>6 yıl</b> sürer; bitince bakım ister."`, [
      { label: '🧱 Kuralım', sub: 'Hemen başlar, 6 yıl sürer', fn: () => { game.fenceY = y; clang(); toast('🧱', 'Çit ustaları', 'Çit yapımı başladı. Cephe bitmeden gelmezse Batı korunur.', ''); } },
      { label: '⏳ Bekleyelim', sub: 'Belki tavşan buraya gelmez', fn: () => {} },
    ], 'farm');
  }

  function yearTick() {
    const y = gs.y;
    const rain = game.droughts.includes(y) ? 0.45 : game.wets.includes(y) ? 1.35 : 1;
    const fenceBuilt = game.fenceY && y >= game.fenceY + 6 ? { y: game.fenceY + 6, A: game.fenceA } : 0;
    M.step(gs, { ...game.p, rain, fenceBuilt, myxo: game.myxoY && y >= game.myxoY ? 1 : 0, flea: game.flea && y >= game.flea ? 1 : 0, rhdv: y >= 1995 ? 1 : 0 });
    const h = gs.hist[gs.hist.length - 1];
    game.hist.push({ ...h, rain });
    // çiftçiler: otlak çıplaksa kızar
    if (!game.replaced) game.sat = clamp(game.sat + 0.8 + (h.Gtot - 0.8) * 12, 0, 100);
    $('yb-harvest').textContent = ''; // sayı sahnedeki sayaçta (aynı bilgiyi iki yerde verme) $('yb-harvest').style.color = h.R < GOAL.R ? 'var(--green)' : h.R < 1000 ? 'var(--grain)' : 'var(--danger)';
    // çit tamamlanınca: cephe geçmiş mi?
    if (game.fenceY && y === game.fenceY + 5) { game.fenceA = gs.A; game.fenceDoneY = y; game.unlocked.fence = true; SL.fence.disabled = false; $('w-fence').classList.remove('locked'); SL.fence.value = 0; readPolicy(); setView('map', 7000); game.fenceOk = gs.A < 1 - M.WA; if (game.fenceOk) award('tav-cit'); if (game.fenceOk) toast('🧱', 'Çit bitti', 'Çit tamamlandı ve <b>cephe henüz gelmedi</b>: Batı Avustralya korunuyor. Çit ancak bakımı kadar sağlam.', 'good', { then: () => !game.moved.fence && coach(SL.fence, '👉 Kaydır: çit bakımı') }); else toast('🧱', 'Çit bitti', 'Çit tamamlandı, ama tavşanlar <b>çoktan karşıya geçmişti</b>. Geç kalan çit hiçbir şeyi durdurmaz.', 'bad'); }
    // olaylar
    if (y === 1866) toast('🔫', 'Thomas Austin', 'Çiftliğimde bu yıl yüzlerce tavşan vurduk. Ama hâlâ çoğalıyorlar!', '');
    if (y === 1875) { setView('map'); setTimeout(() => guide([{ key: 'map', el: '#g-view', text: '🗺️ Tavşanların <b>kıtaya yayılışını</b> buradan izleyebilirsin. Yılda yaklaşık 100 km!' }], () => setView('scene', 1)), 700); toast('🗺️', 'Gazete', 'Tavşanlar yılda yaklaşık <b>100 km</b> ilerliyor.', 'warn'); }
    if (y === 1883) { $('row-native').hidden = false; pulseAt(() => { const r = $('row-native').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); }
    if (game.sat < 60 && $('row-trust').hidden) $('row-trust').hidden = false;
    if (y === 1883) unlock('trap', '<b>Tavşan yasası</b>: çiftçiler tavşanla savaşmak zorunda. Tuzak ve zehirli havuç tavşanı azaltır, ama <b>yerli hayvanları da</b> öldürür.', '👉 Kaydır: tuzak ve zehir');
    if (y === 1886 || (y === 1893 && !game.fenceY) || (y === 1900 && !game.fenceY)) askFence(y);
    if (y === 1888) toast('🧪', 'Yeni Güney Galler', 'Tavşanı bitirecek bir yönteme <b>25.000 sterlin</b> ödül! Pasteur\'ün ekibi tavuk kolerasını denedi; işe yaramadı.', '');
    if (y === 1925) toast('🧥', 'Liman', 'Tavşan kürkü ve dondurulmuş tavşan eti ihraç ediliyor. Tuzakçılar tavşanın bitmesini pek istemiyor!', '');
    if (y === 1942) toast('🪖', 'Savaş', 'Tuzakçıların çoğu cephede: tavşanlar yine çoğalıyor.', 'warn');
    if (y === 1937) { comeOfficial('sci', 'Bir virüs var...'); choice('Bilim insanı', 'Virüs denemesi', '"Güney Amerika tavşanlarında <b>miksoma</b> diye bir virüs var; Avrupa tavşanını öldürüyor. Bir adada denemeye para ayıralım mı?"', [
      { label: '🔬 Deneyelim', sub: 'Virüs 1945\'te hazır olabilir', fn: () => { game.research = 1; toast('🏝️', 'Wardang Adası', 'Deneme başladı. Kuru iklimde virüs zor yayılıyor; bekleyeceğiz.', ''); } },
      { label: '⏳ Gerek yok', sub: 'Tuzak yeter', fn: () => {} },
    ], 'sci'); }
    if ((y === 1945 && game.research) || (y === 1950 && !game.myxoY)) askVirus(y);
    if (game.myxoY && y === game.myxoY) cine(CINE.myxo);
    if (game.myxoY && y === game.myxoY + 1) { setView('scene'); toast('🦟', 'Murray Vadisi', 'Yağmurlu yazda sivrisinekler virüsü bir yaz içinde binlerce kilometre taşıdı. Tavşanların <b>%90\'dan fazlası</b> öldü!', 'good'); }
    if (h.q > 0.35) once('res', () => { pulseAt(() => [W * 0.62, geo().gt]); milestone('🧬', 'Bilim insanı', 'Virüs eskisi kadar öldürmüyor: <b>ılımlı soylar</b> kazandı, tavşanlar da <b>direnç</b> kazandı. Yeni ve sert soy salmak (virüs programı) direnci de hızlandırır.', 'warn', () => coach(SL.vir, '👉 Kaydır: virüs programı')); });
    if (y === 1968 && game.myxoY) { comeOfficial('sci', 'Pire buldum!'); choice('Bilim insanı', 'Tavşan piresi', '"Kurak iç bölgelerde sivrisinek yok; virüs yayılamıyor. Avrupa\'dan <b>tavşan piresi</b> getirelim mi? Virüsü taşır."', [
      { label: '🪳 Getirelim', sub: 'Kuraklıkta da virüs yayılır', fn: () => { game.flea = 1969; award('tav-pire'); } },
      { label: '⏳ Gerek yok', sub: 'Yeni bir tür getirmek riskli', fn: () => {} },
    ], 'sci'); }
    if (y === 1995) toast('🦠', 'Wedge Adası', 'Denenen <b>kalisivirüs</b> adadan kaçtı! Rüzgârla ve sineklerle anakaraya yayılıyor. Tavşanlar yine kırılıyor.', 'warn');
    if (game.droughts.includes(y + 1)) { const t = '<b>Gelecek yıl kuraklık</b>: tavşanlar su başlarında toplanacak. Tuzağı o yıl artırırsan çok yakalarsın.'; toast('☀️', 'Hava tahmini', t, 'warn', { keep: true }); }
    if (game.wets.includes(y + 1)) { const t = '<b>Gelecek yıl bol yağmur</b>: ot gürleşecek, tavşan patlaması bekleniyor. Tuzağı o yıl artır.'; toast('🌧️', 'Hava tahmini', t, 'warn', { keep: true }); }
    if (rain < 1) floats.push({ x: W * 0.55, y: geo().gt + 30 * U, text: '🌪️ Toz fırtınası: çıplak toprak uçuyor', life: 2.2, col: '#8a4a2a' });
    if (rain > 1.2) floats.push({ x: W * 0.55, y: geo().gt + 30 * U, text: '🐇🐇 Tavşan patlaması!', life: 2.2, col: '#6a4a2a' });
    if (h.N < 0.5) once('native', () => toast('🦘', 'Doğa bilimci', 'Bilbi ve sıçan kangurular kayboluyor: tavşan yuvalarını ve otlarını kaptı, zehirli havucu da onlar yedi.', 'bad', { keep: true }));
    if (game.sat < 25 && !game.replaced) once('sat' + Math.floor(y / 15), () => milestone('🧑‍🌾', 'Çiftçiler', 'Otlak kalmadı, koyunlar açlıktan ölüyor! Destek sıfırlanırsa kurul dağıtılır.', 'bad'));
    if (game.sat <= 0 && !game.replaced) { game.replaced = true; toast('📜', 'Hükümet', 'Çiftçiler kurulu dağıttı: görevden alındın.', 'bad'); endGame(); return; }
    if (y === M.Y1) { if (h.Gtot >= 0.9) award('tav-otlak'); if (h.N >= 0.68) award('tav-bilbi'); if (h.R < GOAL.R && h.Gtot >= GOAL.G && h.N >= GOAL.N) award('tav-hedef'); }
    if (window.SceneUtils && window.SceneUtils.advise) {
      const A = window.SceneUtils.advise, dNext = game.droughts.includes(y + 1);
      if (y < 1883) A(`Henüz araç yok: 24 tavşanın nasıl çoğaldığını izle (${rabText(h.R)})`);
      else if (!game.fenceY && gs.A < 0.6 && y >= 1886) A('Çit için hâlâ vakit var: cephe Batı\'ya varmadan kur');
      else if (h.N < 0.62 && game.p.trap > 0.4) A('Zehir yerli hayvanları da vuruyor: tuzağı biraz azalt', 'bad');
      else if (h.Gtot < 0.78) A('Otlak çıplak, çiftçiler kızgın: tavşanı azalt', 'bad');
      else if (dNext || game.wets.includes(y + 1)) A(dNext ? 'Kuraklık geliyor: tuzağı bu yıl artır, çok yakalarsın' : 'Tavşan patlaması geliyor: tuzağı bu yıl artır');
      else if (h.v > 0 && h.q > 0.4 && game.p.vir < 0.3) A('Tavşanlar direnç kazandı: virüs programını artır', 'bad');
      else if (h.R >= GOAL.R) A(`Hedef 200 milyonun altı: şimdi ${rabText(h.R)}`);
      else A(`Hedefte: ${rabText(h.R)} tavşan; zehri az tut, yerlileri koru`, 'good');
    }
    if (y % 10 === 0 && window.SceneUtils && window.SceneUtils.decade) window.SceneUtils.decade(y, ({ 1860: "Altına hücum yılları: Victoria hızla büyüyor", 1880: "Koloniler tavşan yasaları çıkarıyor", 1890: "Uzun kuraklıklar ve ekonomik bunalım", 1900: "Avustralya tek ülke oluyor (1901)", 1910: "Birinci Dünya Savaşı", 1920: "Tavşan eti ve kürkü gemilerle ihraç ediliyor", 1930: "Büyük Buhran ve toz fırtınaları", 1940: "İkinci Dünya Savaşı", 1950: "Bilim insanları bir virüs deniyor", 1960: "Tavşanlar azaldı, otlaklar yeşerdi", 1970: "Tavşanlar geri dönüyor", 1980: "Yeni bir çözüm aranıyor", 1990: "Bir deneme adasında yeni virüs" })[y]);
    if (gs.y > M.Y1 && game.state === 'play') endGame(); else if (gs.y > M.Y1) game.endAfter = true;
  }
  function askVirus(y) {
    comeOfficial('sci', 'Virüs hazır.');
    choice('Bilim insanı', 'Miksomatozis', '"Virüs tavşan dışında hiçbir hayvana bulaşmıyor. Salarsak tavşanların çoğu ölür. Ama canlılar karşılık verir: virüs ve tavşan birlikte evrilir."', [
      { label: '🦠 Salalım', sub: 'Virüs programı açılır', fn: () => { game.myxoY = y + 1; game.unlocked.vir = true; SL.vir.disabled = false; $('w-vir').classList.remove('locked'); SL.vir.value = 0; readPolicy(); setTimeout(() => coach(SL.vir, '👉 Kaydır: virüs programı'), 2500); } },
      { label: '⏳ Bekleyelim', sub: 'Bir kez daha düşünelim', fn: () => { if (y < 1950) toast('⏳', 'Kurul', 'Virüs bekleyecek. 1950\'de yeniden sorulacak.', ''); else toast('⏳', 'Kurul', 'Virüs salınmadı.', ''); } },
    ], 'sci');
  }
  function endGame() {
    if (game.state === 'end') return;
    game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-tavsan', 'Bitirdi: 24 Tavşanlık Felaket');
    maxSeen = slides.length - 1; paintDots(); replayNav();
    setView('map', 4000);
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 2600);
  }
  function renderResult() {
    if (!game.hist.length || (gs.y <= M.Y1 && !game.replaced)) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const hs = game.hist, last = hs[hs.length - 1], hh = HISTORY.hist[hs.length - 1], R = last.R, G0 = last.Gtot, N = last.N;
    const ok = !game.replaced && R < GOAL.R && G0 >= GOAL.G && N >= GOAL.N;
    const score = Math.round(100 * (0.4 * clamp(GOAL.R / Math.max(1, R)) + 0.3 * clamp((G0 - 0.6) / 0.35) + 0.3 * clamp((N - 0.3) / 0.35)));
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'Otlak çıplak kaldı, koyunlar öldü, çiftçiler kurulu dağıttı.'; }
    else if (ok) { title = 'Gri halı toplandı'; text = 'Tavşan azaldı, otlak yeşerdi, yerli hayvanlar yaşıyor. Tek bir çözüm değil, sırayla birkaç çözüm işe yaradı.'; }
    else if (N < GOAL.N && hs.reduce((a, h) => a + h.kT, 0) / hs.length > 0.08) { title = 'Zehirli zafer'; text = 'Tavşanla savaşırken yerli hayvanları da kaybettin. Zehir seçici değildir.'; }
    else if (N < GOAL.N) { title = 'Yerliler kayboldu'; text = 'Tavşanlar bilbi gibi yerli hayvanların otunu ve yuvasını kaptı. İstilacı tür yalnız otu değil, komşularını da yer.'; }
    else if (R >= 1000) { title = 'Tavşanların kıtası'; text = 'Tavşanlar kazandı: otlak kemirildi, toprak uçtu. Gerçekte de yalnız tuzak ve çit asla yetmedi.'; }
    else { title = 'Yarım zafer'; text = 'Tavşan azaldı ama hedefe inmedi. Virüs yumuşadı, tavşanlar direnç kazandı: canlılar karşılık verir.'; }
    const col = ok ? 'var(--green)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">${game.replaced ? (gs.y - 1) + ' · görevden alındın' : '2000 · görev süren doldu'}</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${window.SceneUtils ? window.SceneUtils.bestLine('tavsan', score, 'kurul puanı', !game.replaced) : ''}
      <div class="rgrid">
        <div><div class="y">Tavşan (${game.replaced ? last.y : 2000})</div><div class="v" style="color:${R < GOAL.R ? 'var(--green)' : 'var(--danger)'}">${rabText(R)}</div><div class="h">tarihte: ${rabText(hh.R)}</div></div>
        <div><div class="y">Otlak</div><div class="v" style="color:${G0 >= GOAL.G ? 'var(--green)' : 'var(--danger)'}">%${Math.round(G0 * 100)}</div><div class="h">tarihte: %${Math.round(hh.Gtot * 100)}</div></div>
        <div><div class="y">Yerli hayvanlar</div><div class="v" style="color:${N >= GOAL.N ? 'var(--green)' : 'var(--danger)'}">%${Math.round(N * 100)}</div><div class="h">tarihte: %${Math.round(hh.N * 100)}</div></div>
      </div>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return d ? `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>` : ''; }).join('')}</div>` : ''}
      <canvas class="rchart" id="rchart"></canvas>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button><a class="hbtn" href="../../#bolumler">☰ Tüm bölümler</a></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(slideOf('game')); };
    $('r-next').onclick = () => goTo(slideOf('sandbox')); $('r-next').textContent = '🧪 Zehirsiz başarabilir misin? →';
    requestAnimationFrame(drawResultChart);
  }
  const rBar = R => clamp(Math.log10(1 + R * 1e6) / 9.5);
  const series = hist => [
    { data: hist.map(d => rBar(d.R)), color: '#9a7a5a', label: 'Tavşan', fmt: v => rabText((Math.pow(10, v * 9.5) - 1) / 1e6) },
    { data: hist.map(d => d.Gtot), color: '#7ab060', label: 'Otlak', fmt: v => '%' + Math.round(v * 100) },
    { data: hist.map(d => d.N), color: '#c08a4a', label: 'Yerli hayvan', fmt: v => '%' + Math.round(v * 100) },
  ];
  function drawResultChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('rchart'), [{ data: HISTORY.hist.map(d => rBar(d.R)), color: '#9aa59a', dash: true, label: 'Tarihte tavşan', fmt: v => rabText((Math.pow(10, v * 9.5) - 1) / 1e6) }, ...series(game.hist)], TOTAL, { y0: M.Y0, step: 20 }); }

  // =====================================================================
  // LABORATUVAR
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: M.newState(), p: { trap: 0.3, vir: 0.3, rain: 1 }, preset: null };
  function readSliders() {
    sb.p.trap = $('p-t').value / 100; sb.p.vir = $('p-v').value / 100; sb.p.rain = $('p-r').value / 100;
    $('o-pt').textContent = '%' + $('p-t').value; $('o-pv').textContent = '%' + $('p-v').value; $('o-pr').textContent = '%' + $('p-r').value;
  }
  ['p-t', 'p-v', 'p-r'].forEach(id => $(id).addEventListener('input', () => { readSliders(); sb.preset = null; document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: null, none: [35, 0, 100], trap: [100, 0, 100], all: [40, 40, 100] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset]; sb.preset = b.dataset.preset;
    if (v) ['p-t', 'p-v', 'p-r'].forEach((id, i) => $(id).value = v[i]);
    readSliders(); sb.st = M.newState(); sb.frac = 0; sb.fenceA = 0; updateSbStats(); drawSbChart();
    document.querySelectorAll('.pbtn').forEach(x => x.classList.toggle('on', x === b));
  });
  $('sb-play').onclick = () => { sb.running = !sb.running; $('sb-play').textContent = sb.running ? '❚❚ Durdur' : '▶ Devam'; };
  $('sb-speed').onclick = () => { sb.speed = sb.speed === 1 ? 2 : sb.speed === 2 ? 4 : 1; $('sb-speed').textContent = sb.speed + '×'; };
  $('sb-reset').onclick = () => { sb.st = M.newState(); sb.frac = 0; updateSbStats(); drawSbChart(); };
  readSliders();
  function enterSandbox() { sb.running = true; $('sb-play').textContent = '❚❚ Durdur'; updateSbStats(); setTimeout(drawSbChart, 50); }
  function labP(y) {
    if (sb.preset === 'history') return M.histP(y, sb.st);
    const virOn = sb.preset !== 'none' && sb.preset !== 'trap';
    if (sb.preset === 'all' && y === 1891) sb.fenceA = sb.st.A;
    const fb = sb.preset === 'all' && y >= 1892 ? { y: 1892, A: sb.fenceA || sb.st.A } : 0;
    return { trap: y >= 1883 ? sb.p.trap : 0, vir: y >= 1950 && virOn ? sb.p.vir : 0, rain: sb.p.rain, fence: fb ? 0.6 : 0, fenceBuilt: fb, myxo: virOn && y >= 1950 ? 1 : 0, flea: virOn && y >= 1969 ? 1 : 0, rhdv: virOn && y >= 1995 ? 1 : 0 };
  }
  function updateSandbox(dt) {
    if (mode !== 'sandbox' || !sb.running) return;
    sb.frac += dt / (450 / sb.speed);
    while (sb.frac >= 1) {
      sb.frac -= 1;
      if (sb.st.y > M.Y1) { sb.st = M.newState(); sb.fenceA = 0; }
      M.step(sb.st, labP(sb.st.y));
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() { const h = sb.st.hist[sb.st.hist.length - 1]; $('sb-year').textContent = String(h ? h.y : M.Y0); $('sb-harvest').textContent = h ? `Tavşan: ${rabText(h.R)} · otlak %${Math.round(h.Gtot * 100)} · yerli %${Math.round(h.N * 100)}` : 'Tavşan: 24'; }
  function drawSbChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('sb-chart'), series(sb.st.hist), TOTAL, { y0: M.Y0, step: 20 }); }

  // =====================================================================
  // DOKUNMA VE DÖNGÜ
  // =====================================================================
  cv.addEventListener('pointerdown', e => { initAudio(); if (mode === 'game' || mode === 'sandbox' || mode === 'title') talkAt(e.clientX, e.clientY); });
  let last = performance.now(), bgTick = 0, lastBg = '';
  function frame(now) {
    const dt = Math.max(0, Math.min(50, now - last)); last = now;
    updateGame(dt); updateSandbox(dt); ambientChat(now);
    if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
    const h = (mode === 'game' || mode === 'result' || mode === 'sandbox') ? curHist() : null;
    const pol = mode === 'sandbox' ? sb.p : game.replay ? M.histP(h ? h.y : 1859) : game.p;
    if (h) Object.assign(target, { R: h.R, G: h.G, N: h.N, A: h.A, trap: pol.trap, fence: mode === 'game' ? game.p.fence : 0, kV: h.kV + h.kV2, v: h.v, q: h.q, rain: mode === 'game' ? (game.hist[game.hist.length - 1] || {}).rain || 1 : sb.p.rain });
    else if (mode === 'game') Object.assign(target, { R: 0.000024, G: 1, N: 1, A: 0.0005, trap: 0, fence: 0, kV: 0, v: 0, q: 0, rain: 1 });
    else if (mode === 'title') Object.assign(target, { R: 0.000024, G: 1, N: 1, A: 0.0005, trap: 0, fence: 0, kV: 0, v: 0, q: 0, rain: 1 });
    else Object.assign(target, { R: 50, G: 0.9, N: 0.9, A: 0.3, trap: 0, fence: 0, kV: 0, v: 0, q: 0, rain: 1 });
    const k = 1 - Math.pow(0.93, dt / 16);
    for (const key of Object.keys(target)) vis[key] = key === 'R' ? Math.exp(lerp(Math.log(vis.R + 1e-7), Math.log(target.R + 1e-7), k * 0.5)) : lerp(vis[key], target[key], k * 0.5);
    vis.bad = lerp(vis.bad, clamp((1 - vis.G) * 2), k * 0.5);
    if (view.until && (game.reading || game.state === 'choice')) view.until += dt;
    if (view.until && performance.now() > view.until && !view.user) setView('scene');
    if (mode !== 'game' && mode !== 'result' && view.want === 'map') setView('scene');
    view.k = lerp(view.k, view.want === 'map' ? 1 : 0, 1 - Math.pow(0.9, dt / 16));
    if (window.SceneUtils && window.SceneUtils.fullView) window.SceneUtils.fullView(view.k > 0.5 && mode === 'game');
    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);
    try { render(now, dt); } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } } // çizim hatası döngüyü durdurmasın
    if (mode === 'game') {
      const yy = String(game.replay ? curHist().y : Math.max(M.Y0, Math.min(gs.y - 1, M.Y1)));
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = eraName(Number(yy), vis.R); $('g-date').textContent = yy;
      $('yb-fill').style.width = clamp(game.replay ? game.replay.i / TOTAL : (gs.hist.length + game.frac) / TOTAL) * 100 + '%';
      $('m-rab').style.width = rBar(vis.R) * 100 + '%';
      $('m-grass').style.width = clamp((curHist() || { Gtot: 1 }).Gtot) * 100 + '%';
      $('m-native').style.width = clamp(vis.N) * 100 + '%';
      $('m-trust').style.width = game.sat + '%';
      $('m-trust').parentElement.parentElement.classList.toggle('low', game.sat < 30);
    }
    if (++bgTick % 6 === 0) { const bg = rgb(mixC(PAL.bgOk, PAL.bgBad, vis.bad)); if (bg !== lastBg) { document.documentElement.style.setProperty('--bg', bg); lastBg = bg; } }
    requestAnimationFrame(frame);
  }

  resetGame();
  if (wasDone) { paintDots(); replayNav(); }
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, sb, vis, M, get gs() { return gs; }, get mode() { return mode; }, setView, go: m => { maxSeen = slides.length; goTo(slideOf(m)); } };
  window.addEventListener('resize', resize);
  resize();
  goTo(0);
  requestAnimationFrame(frame);
})();
