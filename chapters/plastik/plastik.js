// Bölüm — Plastik Çorba (1950–2030)
(() => {
  'use strict';
  const MISSION = {
    title: 'Plastik Çorba · 1950',
    role: 'Bir kıyı ülkesinin çevre bakanısın.',
    control: 'Her yıl <b class="inl">100 puanlık bütçe</b>: 🗑️ atık yönetimi, sonra 🛍️ plastik vergisi ve 🚢 temizlik gemileri.',
    goal: '2030\'da denize giren plastiği tarihteki <b>yarısına</b> indir.',
    watch: 'Halk temizlik gemilerini sever, vergiyi sevmez. Ama okyanusa ne girdiğine bak.',
  };
  const M = window.PlastikModel;
  const $ = id => document.getElementById(id);
  const { clamp, smooth } = M;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const f1 = v => v.toFixed(1).replace('.', ',');
  const TOTAL = M.Y1 - M.Y0 + 1;
  const HISTORY = M.run(TOTAL, M.histP);
  const H2000 = HISTORY.hist[50].I; // 2000'deki girdi: zor rozet
  const TARGET = HISTORY.hist[TOTAL - 1].I * 0.5; // hedef: 2030'da tarihteki girdinin yarısı
  // üretim büyüdükçe aynı atık bütçesi daha az çöpü toplar
  const capOf = prod => Math.min(1, Math.sqrt(350 / Math.max(1, prod)));
  const eraName = y => y < 1965 ? 'Plastik mucizesi' : y < 1997 ? 'Tek kullanımlık çağ' : y < 2018 ? 'Çöp alanı bulundu' : 'Atık nereye gidecek?';
  const COST = { waste: 1, tax: 0.6, clean: 1.4 }; // her %1 için puan

  // =====================================================================
  // SES
  // =====================================================================
  let AC = null, master, waveGain, muted = /[?&](debug|hizli|sessiz)\b/.test(location.search) || (() => { try { return localStorage.getItem('bny-ses') === '0'; } catch (e) { return false; } })();
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(AC.destination);
      const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = AC.createBufferSource(); s.buffer = buf; s.loop = true;
      const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.6;
      waveGain = AC.createGain(); waveGain.gain.value = 0.04; s.connect(f); f.connect(waveGain); waveGain.connect(master); s.start();
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
  const gull = () => { tone(1500, 900, 0.25, 0.025, 'triangle'); setTimeout(() => tone(1400, 800, 0.2, 0.02, 'triangle'), 230); };
  const plop = () => tone(500, 180, 0.12, 0.03);
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
      L.gb = clamp((top - 6) / H, 0.4, 0.88); L.gt = Math.max(mobile ? 0.34 : 0.3, L.gb - (mobile ? 0.46 : 0.38));
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') L.gt = 0.8;
    if (m === 'sandbox') { if (mobile) { L.gt = 0.24; L.gb = 0.46; } else { L.gt = 0.55; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.6, gb: 1, x1: 1 };
  const PAL = { bgOk: [233, 240, 222], bgBad: [236, 226, 218], sky: [214, 232, 238], sand: [236, 222, 186], sea: [86, 150, 186], seaDirty: [120, 150, 150], ink: [43, 58, 46], city: [214, 206, 196] };
  const vis = { I: 0.1, M: 0.6, m: 0.02, G: 0, turtle: 1, waste: 0.2, clean: 0, bad: 0 };
  const target = { ...vis };
  const bubbles = [], floats = [], debris = [], tourists = [], pulses = [], mapParts = [], bottles = [], micro = [];
  const clouds = Array.from({ length: 3 }, () => ({ x: rnd(0, 1), y: rnd(0.08, 0.22), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000012) }));
  const turtle = { x: 0.8, dir: -1, y: 0, sx: 0, sy: 0, eat: 0 }, boat = { x: 0.85, sx: 0, sy: 0 }, ghost = { on: 0, x: 0.9, sx: 0, sy: 0 };
  const lensBox = { x: 0, y: 0, r: 0 };
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};
  for (let i = 0; i < 5; i++) tourists.push({ f: rnd(0.32, 0.56), dir: Math.random() < 0.5 ? -1 : 1, ph: rnd(0, 6), shirt: pick(['#e0b04a', '#7aa7d6', '#c0503a', '#8ac08a']), bag: Math.random() < 0.6 });
  for (let i = 0; i < 70; i++) micro.push({ a: rnd(0, 6.283), d: Math.sqrt(Math.random()) * 0.88, c: pick(['#c0503a', '#3a8adc', '#e0b04a', '#8a6fd8', '#4fbf8a']), ph: rnd(0, 6) });

  function geo() {
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H, gh = gb - gt;
    return { x1, gt, gb, gh, shore: x1 * 0.58, water: gt + gh * 0.08 };
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
    if (o.hat) { ctx.fillStyle = o.hat; ctx.beginPath(); ctx.ellipse(0, -38, 9, 2.4, 0, 0, 6.283); ctx.fill(); ctx.fillRect(-5, -43, 10, 5); }
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(2.2, -34, 1.1, 0, 6.283); ctx.arc(-1.8, -34, 1.1, 0, 6.283); ctx.fill();
    if (o.bag) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(43,58,46,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(9, -14, 4.5, 6, 0.2, 0, 6.283); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function drawDebrisItem(x, y, kind, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    if (kind === 0) { ctx.fillStyle = 'rgba(140,200,230,.9)'; ctx.fillRect(-6, -2, 12, 4); ctx.fillStyle = '#3a8adc'; ctx.fillRect(6, -1.5, 2.5, 3); } // şişe
    else if (kind === 1) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.5, 0, 0, 6.283); ctx.fill(); } // poşet
    else { ctx.strokeStyle = 'rgba(60,140,120,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = -6; k <= 6; k += 3) { ctx.moveTo(k, -4); ctx.lineTo(k + 2, 4); ctx.moveTo(-6, k * 0.6); ctx.lineTo(6, k * 0.6); } ctx.stroke(); } // ağ
    ctx.restore();
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const G = geo(), { x1, gt, gb, gh } = G;
    const sky = ctx.createLinearGradient(0, 0, 0, gt); sky.addColorStop(0, rgb(PAL.sky, 0.9)); sky.addColorStop(1, 'rgba(240,244,232,.5)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, x1, gt);
    ctx.fillStyle = 'rgba(246,210,104,.9)'; ctx.beginPath(); ctx.arc(x1 * 0.82, H * 0.13, 24 * U, 0, 6.283); ctx.fill();
    for (const cl of clouds) { cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15; const cx = cl.x * x1, cy = cl.y * H, s = 20 * U * cl.s; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283); ctx.fill(); }
    // şehir (solda): büyüdükçe bina artar
    const yr = mode === 'game' ? Math.max(M.Y0, gs.y - 1) : 1990, grow = clamp((yr - 1950) / 70);
    ctx.fillStyle = rgb(PAL.sand); ctx.fillRect(0, gt, x1, H - gt);
    ctx.fillStyle = '#c8d4b0'; ctx.fillRect(0, gt, x1 * 0.32, H - gt);
    for (let i = 0; i < 6; i++) { const bh = (30 + ((i * 37) % 50)) * U * (0.6 + grow * 0.8), bx = x1 * (0.17 + i * 0.04); ctx.fillStyle = rgb(mixC(PAL.city, [190, 186, 180], i % 2 * 0.5)); ctx.fillRect(bx, gt - bh, x1 * 0.036, bh); ctx.fillStyle = 'rgba(154,196,216,.8)'; for (let w = 0; w < bh / (12 * U) - 1; w++) ctx.fillRect(bx + 4 * U, gt - bh + 6 * U + w * 12 * U, 5 * U, 5 * U); }
    // market (poşetlerin kaynağı)
    ctx.fillStyle = '#e0b04a'; ctx.fillRect(x1 * 0.42, gt - 26 * U, x1 * 0.07, 26 * U); ctx.fillStyle = rgb(PAL.ink); ctx.font = `${10 * U}px "Patrick Hand"`; ctx.fillText('MARKET', x1 * 0.425, gt - 15 * U);
    // dere: şehirden denize, çöp taşır
    const ry = gt + gh * 0.32;
    ctx.strokeStyle = rgb(PAL.sea, 0.9); ctx.lineWidth = 9 * U; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1 * 0.2, gt + gh * 0.04); ctx.quadraticCurveTo(x1 * 0.3, gt + gh * 0.45, G.shore + 10 * U, ry); ctx.stroke();
    // deniz
    const dirty = smooth(5, 60, vis.M);
    ctx.fillStyle = rgb(mixC(PAL.sea, PAL.seaDirty, dirty));
    ctx.beginPath(); ctx.moveTo(G.shore, G.water); for (let x = G.shore; x <= x1 + 4; x += 12) ctx.lineTo(x, G.water + Math.sin(x * 0.03 + t * 0.002) * 1.5 * U); ctx.lineTo(x1, H); ctx.lineTo(G.shore - 30 * U, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5 * U;
    for (let k = 0; k < 5; k++) { const wx = G.shore + ((t * 0.02 + k * 97) % Math.max(40, x1 - G.shore)); ctx.beginPath(); ctx.moveTo(wx, G.water + 10 * U + k * 8 * U); ctx.lineTo(wx + 16 * U, G.water + 10 * U + k * 8 * U); ctx.stroke(); }
    // çöp kutuları ve geri dönüşüm kamyonu: atık yönetimiyle
    const nBins = Math.round(vis.waste * 6);
    for (let i = 0; i < nBins; i++) { const bx = x1 * (0.33 + i * 0.04), by = gt + gh * 0.16; ctx.fillStyle = ['#3a8adc', '#e0b04a', '#4f9a7a'][i % 3]; ctx.fillRect(bx, by - 14 * U, 10 * U, 14 * U); ctx.fillStyle = rgb(PAL.ink, 0.6); ctx.fillRect(bx - 1 * U, by - 16 * U, 12 * U, 3 * U); }
    if (vis.waste > 0.35) { const tx = x1 * 0.3 + ((t * 0.03 * U) % (x1 * 0.3)); ctx.fillStyle = '#4f9a7a'; ctx.fillRect(tx, gt + gh * 0.06 - 16 * U, 30 * U, 16 * U); ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(tx + 7 * U, gt + gh * 0.06, 4 * U, 0, 6.283); ctx.arc(tx + 23 * U, gt + gh * 0.06, 4 * U, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `${9 * U}px sans-serif`; ctx.fillText('♻', tx + 10 * U, gt + gh * 0.06 - 5 * U); }
    // turistler (poşetli)
    tourists.forEach((p, i) => { p.f += p.dir * 0.00002 * dt; if (p.f < 0.31 || p.f > 0.56) p.dir *= -1; const x = x1 * p.f, y = gt + gh * (0.55 + (i % 3) * 0.13); p.sx = x; p.sy = y - 44 * U; person(x, y, U * (mobile ? 0.75 : 0.9), { dir: p.dir, shirt: p.shirt, step: Math.sin(t * 0.02 + p.ph) * 3, bag: p.bag && vis.waste < 0.6, hat: i % 2 ? '#e8dcc0' : null }); });
    // dereden ve sahilden denize giden çöp: girdiyle; denizde yüzen: büyük parçalarla
    const wantD = Math.round(clamp(vis.M / 40) * (mobile ? 22 : 40));
    while (debris.length < wantD) debris.push({ x: rnd(G.shore / x1 + 0.02, 0.98), y: rnd(0.12, 0.85), k: Math.floor(rnd(0, 3)), r: rnd(0, 6), v: rnd(-1, 1) * 0.000008 });
    while (debris.length > wantD) debris.pop();
    debris.forEach(d => { d.x += d.v * dt; if (d.x < G.shore / x1 + 0.01 || d.x > 0.99) d.v *= -1; const x = d.x * x1, y = G.water + d.y * (gb - G.water) + Math.sin(t * 0.002 + d.r) * 2 * U; d.sx = x; d.sy = y; drawDebrisItem(x, y, d.k, U * 1.1, d.r + Math.sin(t * 0.001 + d.r) * 0.3); });
    // derede akan çöp (girdi): her an görünür akış
    const flowN = Math.round(clamp(vis.I / 12) * 10);
    for (let k = 0; k < flowN; k++) { const ph = ((t * 0.00012 + k / flowN) % 1); const x = lerp(x1 * 0.2, G.shore + 10 * U, ph), y = lerp(gt + gh * 0.04, ry, ph) + Math.sin(ph * 6) * 6 * U; drawDebrisItem(x, y, k % 2, U, ph * 6); }
    // kaplumbağa: poşeti deniz anası sanabilir
    turtle.x += turtle.dir * 0.00003 * dt; if (turtle.x < G.shore / x1 + 0.04) turtle.dir = 1; if (turtle.x > 0.74) turtle.dir = -1;
    const tx2 = turtle.x * x1, ty2 = G.water + (gb - G.water) * 0.32 + Math.sin(t * 0.0015) * 6 * U; turtle.sx = tx2; turtle.sy = ty2 - 16 * U;
    ctx.save(); ctx.translate(tx2, ty2); ctx.scale(U * 1.4 * turtle.dir, U * 1.4); ctx.globalAlpha = 0.4 + 0.6 * vis.turtle;
    ctx.fillStyle = '#4f9a7a'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#7ac0a0'; ctx.beginPath(); ctx.arc(15, -2, 5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#3a7a5a'; [[-8, 8], [8, 8], [-8, -8], [8, -8]].forEach(([fx, fy]) => { ctx.beginPath(); ctx.ellipse(fx, fy, 5, 2.5, fy > 0 ? 0.5 : -0.5, 0, 6.283); ctx.fill(); });
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(17, -3, 1, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
    // temizlik gemisi ve bariyeri: temizlik payıyla
    if (vis.clean > 0.02) {
      boat.x = 0.7 + Math.sin(t * 0.0002) * 0.12; const bx = boat.x * x1, by = G.water + 6 * U; boat.sx = bx; boat.sy = by - 30 * U;
      ctx.strokeStyle = '#e0b04a'; ctx.lineWidth = 4 * U * clamp(vis.clean * 2); ctx.beginPath(); ctx.moveTo(bx - 10 * U, by + 4 * U); ctx.quadraticCurveTo(bx - 70 * U, by + 30 * U, bx - 120 * U * vis.clean - 20 * U, by + 10 * U); ctx.stroke();
      ctx.fillStyle = '#4f9a7a'; ctx.beginPath(); ctx.moveTo(bx - 22 * U, by - 8 * U); ctx.lineTo(bx + 24 * U, by - 8 * U); ctx.lineTo(bx + 16 * U, by + 4 * U); ctx.lineTo(bx - 16 * U, by + 4 * U); ctx.fill();
      ctx.fillStyle = '#f4efe2'; ctx.fillRect(bx - 8 * U, by - 20 * U, 16 * U, 12 * U);
    } else boat.sx = undefined;
    // hayalet ağ olayı
    if (ghost.on > 0.05) { const gx = ghost.x * x1, gy = G.water + (gb - G.water) * 0.3; ghost.sx = gx; ghost.sy = gy - 20 * U; ctx.globalAlpha = ghost.on; drawDebrisItem(gx, gy, 2, U * 4, 0.2); ctx.globalAlpha = 1; ghost.on = Math.max(0, ghost.on - dt / 30000); } else ghost.sx = undefined;
    drawLabels(G, t);
    drawLens(G, t, dt);
    drawOfficial(G, t);
    if (view.k > 0.01) drawMap(G, t, dt, view.k);
    for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i], k = (t - p.t0) / 2400; if (k > 1) { pulses.splice(i, 1); continue; } const [x, y] = p.getPos(); for (let j = 0; j < 2; j++) { const kk = (k * 2 + j * 0.5) % 1; ctx.strokeStyle = p.col; ctx.globalAlpha = (1 - kk) * 0.9; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.arc(x, y, (10 + kk * 40) * U, 0, 6.283); ctx.stroke(); } ctx.globalAlpha = 1; }
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt / 1300; f.y -= dt * 0.025; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = clamp(f.life * 2); ctx.font = `${16 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillStyle = f.col || rgb(PAL.ink); ctx.fillText(f.text, f.x, f.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt / 4200; if (b.life <= 0) { bubbles.splice(i, 1); continue; } drawBubble(b); }
  }
  function drawLabels(G, t) {
    if (mode !== 'game' && mode !== 'sandbox') return;
    const fs = mobile ? 11 : 13, bad = '#a0402a', h = curHist();
    if (!h) return;
    tag(G.x1 * 0.4, G.gt + G.gh * 0.36, `🏞️ Dereden denize: ${f1(h.I)} milyon ton/yıl`, { fs, color: h.I > TARGET ? bad : undefined });
    tag(G.x1 * 0.79, G.water - 6 * U, `🌊 Denizde yüzen büyük çöp: ${Math.round(h.M)} Mt`, { fs, color: h.M > 30 ? bad : undefined });
    if (mode === 'game' && gs.y - 1 < 1975) tag(G.x1 * 0.16, G.gt - 60 * U, `🏭 Dünya üretimi: ${Math.round(h.prod)} milyon ton/yıl`, { fs: fs - 1 });
    if (vis.clean > 0.02 && boat.sx !== undefined) tag(boat.sx, boat.sy - 6 * U, '🚢 temizlik: yalnız büyük parçalar', { fs: fs - 1 });
  }
  // "bir avuç deniz suyu": yukarıdan görünmeyen mikroplastik; dokununca büyür
  const mview = { want: 0, k: 0, until: 0, user: false };
  const setMicro = (on, ms) => { mview.want = on ? 1 : 0; mview.user = on && !ms; mview.until = ms ? performance.now() + ms : 0; };
  function drawLens(G, t, dt) {
    if (mode === 'facts' || mode === 'lessons' || mode === 'title' || view.k > 0.5) return;
    if (!(G.x1 > 50 && G.gh > 20)) return;
    const r0 = Math.min(G.gh * 0.36, G.x1 * 0.1), cx0 = G.x1 - r0 - 16 * U, cy0 = G.gb - r0 - 30 * U;
    const big = smooth(0, 1, mview.k), top = 150 * U, rB = Math.min((G.gb - top) * 0.4, G.x1 * 0.28);
    const r = Math.max(10, lerp(r0, rB, big)), cx = lerp(cx0, G.x1 / 2, big), cy = lerp(cy0, top + (G.gb - top) * 0.45, big);
    lensBox.x = cx; lensBox.y = cy; lensBox.r = r;
    if (big > 0.01) { ctx.fillStyle = `rgba(30,40,36,${0.55 * big})`; ctx.fillRect(0, 0, G.x1, H); }
    ctx.fillStyle = '#e9c49d'; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.55, r * 1.15, r * 0.6, 0, 0, Math.PI); ctx.fill(); // avuç
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.clip();
    ctx.fillStyle = 'rgba(170,210,230,.95)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const n = Math.round(clamp(vis.m / 50) * micro.length);
    for (let i = 0; i < n; i++) { const p = micro[i]; p.ph += dt * 0.002; const x = cx + Math.cos(p.a + p.ph * 0.1) * p.d * r, y = cy + Math.sin(p.a + p.ph * 0.1) * p.d * r; ctx.fillStyle = p.c; ctx.fillRect(x, y, (2 + (i % 3)) * U * (1 + big), (1.5 + (i % 2)) * U * (1 + big)); }
    ctx.restore();
    ctx.strokeStyle = '#3a4250'; ctx.lineWidth = 4 * U; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();
    tag(cx, cy - r - 6 * U, big > 0.5 ? `🔬 Bir avuç deniz suyu: ${n} mikroplastik parça · dokun: geri dön` : `🔬 Bir avuç su · dokun`, { fs: big > 0.5 ? 14 : (mobile ? 10 : 11) });
    if (big > 0.5) tag(cx, cy + r + 40 * U, 'Bunlar yukarıdan görünmez ve temizlik gemisi toplayamaz.', { fs: 13 });
  }
  // okyanus haritası: kıyılardan çıkan plastik, girdap akıntısıyla ortada birikir
  const view = { want: 'shore', k: 0, until: 0, user: false };
  function setView(v, ms) { view.want = v; view.user = !ms; view.until = ms ? performance.now() + ms : 0; const b = $('g-view'); if (b) b.textContent = v === 'map' ? '🏖️ Kıyı' : '🗺️ Okyanus'; }
  function mapGeom(G) {
    const top = 104 * U, H2 = G.gb - top, Wm = Math.min(G.x1 * 0.96, H2 * 1.6), Hm = Wm / 1.6;
    return { ox: (G.x1 - Wm) / 2, oy: top + (H2 - Hm) / 2, Wm, Hm, cx: 0.5, cy: 0.48 };
  }
  function current(px, py) { // girdap: saat yönünde döner, yavaşça ortaya çeker
    const dx = px - 0.5, dy = (py - 0.48) * 1.6, r = Math.hypot(dx, dy) + 1e-6;
    return [(-dy / r) * 0.6 - dx * 0.5, (dx / r) * 0.6 / 1.6 - dy * 0.5 / 1.6];
  }
  function drawMap(G, t, dt, alpha) {
    const g = mapGeom(G), X = p => g.ox + p * g.Wm, Y = p => g.oy + p * g.Hm;
    const zoom = 1 + (1 - alpha) * 0.35;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(G.x1 / 2, (g.oy + g.Hm / 2)); ctx.scale(zoom, zoom); ctx.translate(-G.x1 / 2, -(g.oy + g.Hm / 2));
    ctx.fillStyle = rgb(PAL.sea); ctx.fillRect(-G.x1, 0, G.x1 * 3, H * 2);
    // kıtalar: solda Asya, sağda Kuzey Amerika
    ctx.fillStyle = '#d8d0b0';
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0.18), Y(0)); ctx.quadraticCurveTo(X(0.22), Y(0.3), X(0.12), Y(0.55)); ctx.quadraticCurveTo(X(0.16), Y(0.8), X(0.06), Y(1)); ctx.lineTo(X(0), Y(1)); ctx.fill();
    ctx.beginPath(); ctx.moveTo(X(1), Y(0)); ctx.lineTo(X(0.8), Y(0)); ctx.quadraticCurveTo(X(0.76), Y(0.3), X(0.86), Y(0.55)); ctx.quadraticCurveTo(X(0.84), Y(0.8), X(0.92), Y(1)); ctx.lineTo(X(1), Y(1)); ctx.fill();
    ctx.fillStyle = '#e8e0c4'; ctx.beginPath(); ctx.ellipse(X(0.4), Y(0.78), 6 * U, 4 * U, 0, 0, 6.283); ctx.fill(); // Hawaii
    // akıntı okları
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2 * U;
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + t * 0.0002, rx = 0.3, ry = 0.3 / 1.6 * 1.6; const x0 = 0.5 + Math.cos(a) * rx, y0 = 0.48 + Math.sin(a) * ry * 0.62; const a2 = a + 0.25, x2 = 0.5 + Math.cos(a2) * rx, y2 = 0.48 + Math.sin(a2) * ry * 0.62; ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x2), Y(y2)); ctx.stroke(); ctx.beginPath(); ctx.arc(X(x2), Y(y2), 2.2 * U, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill(); }
    // çöp alanı: girdabın ortasında
    const h = curHist(), Gk = h ? h.G : 0, area = 1.6 * Math.pow(Math.max(0.01, Gk) / 79, 0.8);
    const pr = Math.sqrt(area) * 0.09;
    const gr = ctx.createRadialGradient(X(0.5), Y(0.48), 0, X(0.5), Y(0.48), pr * g.Wm); gr.addColorStop(0, 'rgba(230,200,150,.75)'); gr.addColorStop(1, 'rgba(230,200,150,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(X(0.5), Y(0.48), pr * g.Wm, pr * g.Wm * 0.6, 0, 0, 6.283); ctx.fill();
    // kıyılardan akan plastik parçaları
    if (Math.random() < clamp((h ? h.I : 0.1) / 15) * 0.12 * (dt / 16) && mapParts.length < 260) mapParts.push({ x: Math.random() < 0.6 ? rnd(0.16, 0.22) : rnd(0.78, 0.84), y: rnd(0.15, 0.85), life: 1 });
    for (let i = mapParts.length - 1; i >= 0; i--) { const p = mapParts[i]; const [vx, vy] = current(p.x, p.y); p.x += vx * dt * 0.00012; p.y += vy * dt * 0.00012; p.life -= dt / 40000; if (p.life <= 0 || Math.hypot(p.x - 0.5, (p.y - 0.48) * 1.6) < 0.03) { mapParts.splice(i, 1); continue; } ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(X(p.x), Y(p.y), 2.5 * U, 2.5 * U); }
    // şişe postası: oyuncunun bıraktığı şişe akıntıyla gider
    for (let i = bottles.length - 1; i >= 0; i--) { const b = bottles[i]; const [vx, vy] = current(b.x, b.y); b.x += vx * dt * 0.00018; b.y += vy * dt * 0.00018; drawDebrisItem(X(b.x), Y(b.y), 0, U * 1.6, Math.atan2(vy, vx)); if (Math.hypot(b.x - 0.5, (b.y - 0.48) * 1.6) < 0.05) { bottles.splice(i, 1); floats.push({ x: X(0.5), y: Y(0.48), text: 'Şişen çöp alanına ulaştı!', life: 1.6 }); award('pla-sise'); } }
    const lbl = (p, q, text, o) => tag(X(p), Y(q), text, o);
    lbl(0.1, 0.1, 'Asya', { fs: 12, a: 0.8 }); lbl(0.9, 0.1, 'K. Amerika', { fs: 12, a: 0.8 }); lbl(0.4, 0.85, 'Hawaii', { fs: 11, a: 0.8 });
    lbl(0.5, 0.33, `🗑️ Büyük Pasifik Çöp Alanı: ${Math.round(Gk)} bin ton · ${f1(area)} milyon km² (Türkiye'nin ${f1(area / 0.78)} katı)`, { fs: 13, color: Gk > 60 ? '#a0402a' : undefined });
    lbl(0.5, 0.94, '🍾 Kıyıya dokun: şişe bırak, akıntı nereye götürüyor? · 🏖️ ortaya dokun: kıyıya dön', { fs: 12 });
    ctx.restore();
  }

  // =====================================================================
  // KONUŞMALAR
  // =====================================================================
  function lines(kind) {
    const h = curHist() || { I: 0.1, M: 0.5 };
    const P = {
      tourist: h.M > 30 ? ['Denize girmek istemiyorum,\nher yer poşet!', 'Bu kumda pipet\nbuldum yine.', 'Eskiden su\nberraktı.'] : vis.waste > 0.6 ? ['Çöp kutusu her yerde,\nharika!', 'Sahil tertemiz.', 'Pikniğin çöpünü\naldım, merak etme.'] : ['Poşet bedava,\nal bir tane daha!', 'Şişeyi kumda\nbırakayım, rüzgâr alır.', 'Plastik ne\nkadar pratik!'],
      turtle: h.M > 20 ? ['Bu deniz anası mı?\nTadı plastik...', 'Yine poşet!\nKarnım dolu ama aç...', 'Ağa takıldım,\nkurtarın!'] : ['Deniz anası\navındayım.', 'Bu sahilde\nyumurtlayacağım.', 'Su tertemiz!'],
      boat: ['Bariyer büyük\nparçaları topluyor.', 'Mikroplastik mi?\nO ağdan geçiyor...', 'Bugün 2 ton\ntopladık!'],
      ghost: ['Hayalet ağ: kimse\nçekmiyor ama hâlâ avlıyor.', 'Bu ağ yıllarca\nyüzecek.'],
      lens: ['Her renkli nokta\nbir plastik parçası.', 'Gözle görünmez,\nbalık yutar.'],
      official: ['Kararınızı\nbekliyoruz.', 'Hesaplar\nhazır.'],
    };
    return pick(P[kind] || ['...']);
  }
  function talkAt(x, y) {
    if (view.k > 0.5) {
      const G = geo(), g = mapGeom(G), px = (x - g.ox) / g.Wm, py = (y - g.oy) / g.Hm;
      if (px > 0.08 && px < 0.92 && (px < 0.3 || px > 0.7)) { bottles.push({ x: clamp(px, 0.2, 0.8), y: clamp(py, 0.1, 0.9) }); plop(); return true; }
      setView('shore'); return true;
    }
    if (mview.k > 0.5) { setMicro(false); return true; }
    if (Math.hypot(x - lensBox.x, y - lensBox.y) < lensBox.r) { setMicro(true); blip(); if (tapCount('lens') >= 3) award('pla-avuc'); return true; }
    const c = [], add = (sx, sy, kind, fn) => { if (sx !== undefined && !isNaN(sy)) c.push({ d: Math.hypot(sx - x, sy - y), kind, fn, obj: { x: sx, y: sy } }); };
    tourists.forEach(p => add(p.sx, p.sy, 'tourist'));
    add(turtle.sx, turtle.sy, 'turtle', () => { if ((curHist() || {}).M > 20) award('pla-kapl'); });
    add(boat.sx, boat.sy, 'boat');
    add(ghost.sx, ghost.sy, 'ghost', () => award('pla-ag'));
    if (official && official.x) add(official.x, official.y, 'official');
    if (!c.length) return false;
    c.sort((a, b) => a.d - b.d);
    sayAt(c[0].obj, lines(c[0].kind)); blip(); if (c[0].fn) c[0].fn();
    return true;
  }
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || bubbles.length || view.k > 0.5) return;
    if (!nextChat) nextChat = t + 8000;
    if (t < nextChat) return;
    nextChat = t + rnd(10000, 17000);
    const p = pick(tourists), opts = [['tourist', { get x() { return p.sx; }, get y() { return p.sy; } }], ['turtle', { get x() { return turtle.sx; }, get y() { return turtle.sy; } }]];
    const [k, o] = pick(opts); sayAt(o, lines(k));
    if (Math.random() < 0.3) gull();
  }

  let official = null;
  function drawBody(g, who, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = who === 'moore' ? '#3a6a9a' : who === 'lobby' ? '#4a5866' : '#4f9a7a'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    if (who === 'moore') { g.fillStyle = '#f4efe2'; g.beginPath(); g.ellipse(0, -43, 10, 3, 0, 0, 6.283); g.fill(); g.fillRect(-6, -49, 12, 6); g.fillStyle = '#d8d2c0'; g.beginPath(); g.arc(0, -32, 5, 0, Math.PI); g.fill(); } // kaptan şapkası, sakal
    else if (who === 'lobby') { g.fillStyle = '#3a3f46'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill(); g.fillStyle = '#c0503a'; g.beginPath(); g.moveTo(-2, -30); g.lineTo(2, -30); g.lineTo(0, -18); g.fill(); }
    else { g.fillStyle = '#6a4a30'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill(); }
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
    const stopX = G.x1 * (mobile ? 0.3 : 0.4), startX = -40;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    const leaving = official.leave && now > official.leave;
    if (leaving) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = G.gt + G.gh * 0.45, s = 1.1 * U, walk = e < 1500 || leaving;
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
  const DONE_KEY = 'bny-bitti-plastik';
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
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-plastik', 'Başladı: Plastik Çorba'); enterGame(); }
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
    while (toastQueue.length > 6) { const k = toastQueue.findIndex(a => !(a[4] || {}).pause); if (k < 0) break; toastQueue.splice(k, 1); }
    pumpToasts();
  }
  function pumpToasts() {
    if (!toastQueue.length || mode !== 'game') return;
    for (let i = toastQueue.length - 1; i >= 0; i--) { const a = toastQueue[i]; if (!(a[4] || {}).pause && a.born !== undefined && gs.y - a.born > 2) toastQueue.splice(i, 1); }
    if (!toastQueue.length) return;
    const box = $('toasts'), visible = box.querySelectorAll('.toast:not(.out)').length;
    const k = toastQueue.findIndex(a => (a[4] || {}).pause);
    if (visible >= (mobile ? 1 : 2) || (k < 0 && performance.now() - lastToastAt < 9000 / FAST)) return;
    const next = toastQueue.splice(k >= 0 ? k : 0, 1)[0];
    lastToastAt = performance.now();
    showToast(...next);
  }
  setInterval(pumpToasts, 300);
  function showToast(ic, from, text, tone = '', opt = {}) {
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + tone + (opt.img ? ' story' : '');
    el.innerHTML = (opt.img ? `<img src="${opt.img}" alt="">` : `<div class="ic">${ic}</div>`) + `<div><span class="from">${from}</span>${text}${opt.pause ? '<button class="go">Devam →</button>' : '<span class="x">dokun: kapat</span>'}</div>`;
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
    if (opt.img && window.Toon) window.Toon.process(opt.img, { maxW: 320 }).then(u => { const im = el.querySelector('img'); if (im) im.src = u; }).catch(() => {});
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    const plain = text.replace(/<[^>]+>/g, '');
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 4500 + plain.length * 65)));
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const YEAR = 3300 / FAST;
  let gs = M.newState();
  const game = {};
  const SL = { waste: $('g-waste'), tax: $('g-tax'), clean: $('g-clean') };
  const award = id => (window.Badges ? window.Badges.award(id) : false);
  const choiceQ = [];
  const curHist = () => { const s = mode === 'sandbox' ? sb.st : gs; return s.hist.length ? s.hist[s.hist.length - 1] : null; };

  function makeStorms() { const o = []; while (o.length < 3) { const y = Math.round(1965 + Math.random() * 62); if (o.every(x => Math.abs(x - y) > 4)) o.push(y); } return o; }
  function resetGame() {
    gs = M.newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, fired: new Set(), hist: [], speed: 1, touched: false, reading: 0, story: false, endAfter: false,
      p: { waste: 0.2, tax: 0, clean: 0 }, budget: 100, export: 0, sat: 70, replaced: false, inspected: false, unlocked: { waste: true, tax: false, clean: false },
      storms: makeStorms(), cap: 1, taxYears: 0, decided: null, lobbyUntil: 0,
    });
    SL.waste.value = 20; SL.tax.value = 0; SL.clean.value = 0; SL.tax.disabled = true; SL.clean.disabled = true;
    $('w-tax').classList.add('locked'); $('w-clean').classList.add('locked'); $('o-tax').textContent = "🔒 1990'da açılır"; $('o-clean').textContent = "🔒 2013'te açılır";
    document.querySelectorAll('.coach').forEach(uncoach);
    readPolicy();
    $('g-pause').textContent = '❚❚ Durdur'; setSpeed(1);
    $('modal').hidden = true; $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone');
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {};
    choiceQ.length = 0; official = null; bottles.length = 0; setView('shore'); setMicro(false);
  }
  // ortak bütçe: üç araç 100 puanı paylaşır; aşan kaydırıcı sığdığı kadar kalır
  function readPolicy(moved) {
    const pts = k => Number(SL[k].value) * COST[k];
    let used = Object.keys(SL).reduce((a, k) => a + (game.unlocked && game.unlocked[k] ? pts(k) : 0), 0);
    if (used > game.budget && moved) {
      const others = used - pts(moved);
      SL[moved].value = Math.max(0, Math.floor((game.budget - others) / COST[moved] / 5) * 5);
      used = others + pts(moved);
      floats.push({ x: W / 2, y: lay.gb * H - 20, text: 'Bütçe doldu: başka araçtan puan çek', life: 1.4, col: '#a0402a' });
    }
    if (game.lobbyUntil && gs.y < game.lobbyUntil && Number(SL.tax.value) > 20) SL.tax.value = 20;
    ['waste', 'tax', 'clean'].forEach(k => { game.p[k] = game.unlocked[k] ? SL[k].value / 100 : 0; if (game.unlocked[k]) $('o-' + k).textContent = Math.round(pts(k)) + ' puan'; });
    if (game.cap < 0.99) $('o-waste').textContent = Math.round(pts('waste')) + ' puan · %' + Math.round(game.p.waste * game.cap * 100) + ' toplanıyor';
    const tot = Math.max(1, game.budget);
    $('b-waste').style.width = pts('waste') / tot * 100 + '%';
    $('b-tax').style.width = (game.unlocked.tax ? pts('tax') : 0) / tot * 100 + '%';
    $('b-clean').style.width = (game.unlocked.clean ? pts('clean') : 0) / tot * 100 + '%';
    $('g-budget').textContent = Math.max(0, Math.round(game.budget - used)) + ' puan boşta';
  }
  Object.entries(SL).forEach(([k, el]) => el.addEventListener('input', () => { initAudio(); readPolicy(k); if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); } }));
  $('g-pause').onclick = () => { game.paused = !game.paused; $('g-pause').textContent = game.paused ? '▶ Devam' : '❚❚ Durdur'; };
  $('g-view').onclick = e => { e.stopPropagation(); initAudio(); setView(view.want === 'map' ? 'shore' : 'map'); };
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
  function unlock(k, text) {
    game.unlocked[k] = true; SL[k].disabled = false; $('w-' + k).classList.remove('locked'); readPolicy();
    milestone(k === 'tax' ? '🛍️' : '🚢', 'Yeni araç', text, '', () => coach(SL[k], k === 'tax' ? '👉 Kaydır: plastik vergisi' : '👉 Kaydır: temizlik gemileri'));
  }

  const STORY = [
    ['🧪', '1950', 'Plastik bir mucize: hafif, ucuz, kırılmaz. Dünya yılda <b>2 milyon ton</b> üretiyor.', '', { pause: true }],
    ['🏞️', 'Senin ülken', 'Toplanmayan çöp dereyle denize iner. Sahnede dereye bak.', '', { pause: true }],
  ];
  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (game.started) return;
    game.started = true; game.story = !wasDone;
    const show = i => {
      if (mode !== 'game') return;
      if (i >= STORY.length) { game.story = false; return; }
      const [ic, from, text, tone, opt0] = STORY[i];
      const opt = wasDone ? { ...opt0, pause: false, ms: 6000 } : opt0;
      toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
      if (!opt.pause) setTimeout(() => show(i + 1), 4500 / Math.max(1, FAST / 2));
    };
    const start = () => setTimeout(() => show(0), 300);
    if (window.Mission && !window.__mSeen && (window.__mSeen = 1)) window.Mission.show($('modal'), MISSION, start); else start();
  }
  function updateGame(dt) {
    if (mode !== 'game' || game.paused || game.reading || game.story || game.state !== 'play' || gs.y > M.Y1) return;
    const visible = $('toasts').querySelector('.toast:not(.out)');
    const pace = visible ? 1.5 : toastQueue.length ? 0.95 : 0.47;
    const dur = YEAR * (gs.y < M.Y0 + 2 ? 1.5 : 1) / game.speed;
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

  function yearTick() {
    const y = gs.y;
    const storm = game.storms.includes(y) ? 1.8 : 1;
    const prev = gs.hist.length ? gs.hist[gs.hist.length - 1].prod : 2;
    game.cap = capOf(prev);
    M.step(gs, { ...game.p, waste: game.p.waste * game.cap, export: game.export, storm });
    if (game.cap < 0.85) once('cap', () => toast('🏔️', 'Belediye', 'Çöp dağı büyüyor: <b>aynı bütçe artık daha az çöp topluyor</b>. Üretim yavaşlamazsa yetişemezsin.', 'warn'));
    readPolicy();
    const h = gs.hist[gs.hist.length - 1];
    game.hist.push({ ...h, tax: game.p.tax });
    if (game.p.tax >= 0.3) game.taxYears++;
    // halkın desteği: temizlik gemisi göze hoş gelir; vergi kızdırır; kirli sahil de kızdırır
    if (!game.replaced) game.sat = clamp(game.sat + game.p.clean * 6 - game.p.tax * 7 - smooth(15, 50, h.M) * 3 + 1.2, 0, 100);
    $('yb-harvest').textContent = `🌊 ${f1(h.I)} Mt`; $('yb-harvest').style.color = h.I <= TARGET ? 'var(--green)' : h.I <= H2000 * 2 ? 'var(--grain)' : 'var(--danger)';
    if (storm > 1) { toast('🌧️', 'Sel', 'Şiddetli yağmur: dereler taştı, sokaktaki çöp denize süpürüldü.', 'bad'); pulseAt(() => [geo().shore, geo().gt + geo().gh * 0.32], '#c0503a'); }
    if (game.storms.includes(y + 1) && y < M.Y1) milestone('⛈️', 'Hava tahmini', '<b>Gelecek yıl</b> sel bekleniyor: toplanmayan çöp denize gidecek.', 'warn');
    if (y === 1965) toast('🛍️', 'İsveç', 'Plastik poşet icat edildi. Bedava, hafif, her yerde.');
    if (y === 1973) toast('🍾', 'ABD', 'PET şişe icat edildi. Cam şişeler yavaş yavaş kayboluyor.');
    if (y === 1990) unlock('tax', 'Bazı ülkeler tek kullanımlık plastiğe vergi koymayı düşünüyor. <b>Plastik vergisi</b>: üretimin büyümesini yavaşlatır, ama halk ve marketler kızar.');
    if (y === 1997) { setView('map', 9000); milestone('⛵', 'Kaptan Charles Moore', 'Hawaii\'den dönerken Pasifik\'in ortasında, karadan çok uzakta <b>plastikle dolu</b> bir deniz buldum. Akıntılar çöpü buraya topluyor!', 'bad'); }
    if (y === 2013) unlock('clean', '<b>Temizlik gemileri</b>: denizdeki büyük parçaları toplar. Halk bayılır. Ama mikroplastiğe dokunamaz.');
    if (y === 2015) toast('📊', 'Bilim insanları', 'Hesap çıktı: okyanusa her yıl <b>milyonlarca ton</b> plastik giriyor.', 'warn');
    if (y === 2018) {
      comeOfficial('lobby', 'Çin kapıyı kapattı.');
      choice('Atık şirketi', 'Çin atık almıyor', '"Çöpümüzü yıllarca Çin\'e satıyorduk. Artık almıyor. Türkiye ve Malezya gibi ülkelere satalım mı? Bütçen rahatlar."', [
        { label: 'Yurt dışına sat', sub: '+20 puan bütçe; çöp başka kıyıdan denize gidebilir', fn: () => { game.export = 1; game.budget = 120; game.decided = 'export'; readPolicy(); toast('🚚', 'Liman', 'Çöp gemiyle yola çıktı. Senin sahilin daha temiz görünüyor.', 'warn'); } },
        { label: 'Kendin işle', sub: 'Bütçe aynı; çöp yerinde ayrılır', fn: () => { game.decided = 'home'; award('pla-evde'); toast('♻️', 'Bakanlık', 'Yeni ayrıştırma tesisi açıldı.', 'good'); } },
      ], 'lobby');
    }
    if (y === 2019) toast('🇹🇷', 'Türkiye', 'Türkiye\'de poşetler ücretli oldu. Market kasalarında bez çanta dönemi.', 'good');
    if (h.M > 15) once('m15', () => { if (!view.user) setView('shore'); setMicro(true, 7000); toast('🔬', 'Biyolog', 'Büyük parçalar güneşte ufalanıyor: <b>mikroplastik</b>. Avuçtaki suya bak.', 'warn'); });
    if (h.turtle < 0.8) once('t80', () => { pulseAt(() => [turtle.sx, turtle.sy]); toast('🐢', 'Sahil', 'Bir kaplumbağa poşeti deniz anası sanıp yuttu.', 'bad'); });
    if (y >= 2000 && Math.random() < 0.06) { ghost.on = 1; ghost.x = rnd(0.7, 0.92); once('ghost' + Math.floor(y / 6), () => toast('🕸️', 'Balıkçı', 'Fırtınada bir ağ koptu: artık <b>hayalet ağ</b>, kimse çekmeden avlıyor.', 'warn')); }
    if (game.sat < 25 && !game.replaced) once('warn-sat', () => toast('📢', 'Market zinciri', '"Vergi müşteriyi kaçırıyor!" Halkın desteği düşüyor.', 'warn'));
    if (game.sat <= 0 && !game.replaced && game.p.tax > 0.2) lobby();
    if (gs.y > M.Y1 && game.state === 'play') endGame(); else if (gs.y > M.Y1) game.endAfter = true;
  }
  function lobby() {
    if (game.inspected || game.replaced) return;
    game.inspected = true; comeOfficial('lobby', 'Bu vergi bizi batırıyor!');
    choice('Market zinciri lobisi', 'Vergi kalksın!', '"Müşteri kaçıyor, işçi çıkarıyoruz. Vergiyi <b>en fazla %20</b>ye indir, yoksa seni görevden aldırırız."', [
      { label: 'Tamam, indiriyorum', sub: '5 yıl boyunca vergi en fazla %20', fn: () => { game.lobbyUntil = gs.y + 5; SL.tax.value = Math.min(Number(SL.tax.value), 20); readPolicy(); game.sat = 40; } },
      { label: 'Hayır, vergi kalıyor', sub: 'Görevden alınırsın, oyun biter', fn: () => { game.replaced = true; toast('📜', 'Hükümet', 'Görevden alındın. Yerine gelen ilk iş vergiyi kaldırdı.', 'bad'); endGame(); } },
    ], 'lobby');
  }
  function awardEnd() {
    if (game.replaced || gs.y <= M.Y1) return;
    const hs = game.hist, last = hs[hs.length - 1];
    if (last.I < H2000) award('pla-musluk');
    if (Math.min(...hs.map(h => h.turtle)) >= 0.85) award('pla-kaplumbaga');
    if (game.taxYears >= 15) award('pla-vergi');
  }
  function endGame() {
    if (game.state === 'end') return;
    awardEnd(); game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-plastik', 'Bitirdi: Plastik Çorba');
    maxSeen = slides.length - 1; paintDots(); replayNav();
    setView('map', 4000);
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 2200);
  }
  function renderResult() {
    if (!game.hist.length || (gs.y <= M.Y1 && !game.replaced)) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const hs = game.hist, last = hs[hs.length - 1], n = hs.length, hh = HISTORY.hist.slice(0, n), hl = hh[hh.length - 1];
    const iY = last.I, iH = hl.I, tY = Math.round(Math.min(...hs.map(h => h.turtle)) * 100), tH = Math.round(Math.min(...hh.map(h => h.turtle)) * 100);
    const score = Math.round(clamp(1 - iY / Math.max(0.1, iH)) * 100);
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'Vergiyi savundun, market lobisi kazandı. Gerçekte de poşet ve şişe yasakları yıllarca ertelendi.'; }
    else if (iY < TARGET) { title = 'Musluğu kıstın'; text = 'Denize giren plastik tarihteki yarısının altına indi. Temizlik değil, önleme kazandırdı. Ama okyanustaki mikroplastik daha yüzyıllarca orada.'; }
    else if (iY < iH * 0.75) { title = 'Yarı yolda'; text = 'Denize giren plastik tarihten az, ama hâlâ artıyor. Musluk açık kaldıkça paspas yetmez.'; }
    else if (game.p.clean > 0.3) { title = 'Paspasla taşan küvet'; text = 'Temizlik gemileri sahil fotoğraflarını güzelleştirdi, ama okyanusa giren plastik hiç azalmadı. Mikroplastik ise hiç toplanmadı.'; }
    else { title = 'Plastik çorba koyulaştı'; text = 'Tarih tekrarlandı: üretim katlandı, toplanmayan çöp denize aktı. Tebrikler, okyanusu tarihteki gibi doldurdun.'; }
    if (game.decided === 'export') text += ' Çöpünü yurt dışına sattın: senin sahilin temiz göründü, ama okyanus aynı okyanus.';
    const col = v => v >= 70 ? 'var(--green)' : v >= 40 ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">${game.replaced ? (gs.y - 1) + ' · görevden alındın' : '2030 · görev süren doldu'}</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${window.SceneUtils ? window.SceneUtils.bestLine('plastik', score, 'önleme başarısı', !game.replaced) : ''}
      <div class="rgrid">
        <div><div class="y">Denize giren (2030)</div><div class="v" style="color:${iY < TARGET ? 'var(--green)' : iY < iH * 0.75 ? 'var(--grain)' : 'var(--danger)'}">${f1(iY)} Mt</div><div class="h">hedef: ${f1(TARGET)} · tarihte: ${f1(iH)}</div></div>
        <div><div class="y">Mikroplastik</div><div class="v">${Math.round(last.m)} Mt</div><div class="h">tarihte: ${Math.round(hl.m)} Mt</div></div>
        <div><div class="y">Kaplumbağalar (en kötü)</div><div class="v" style="color:${col(tY)}">%${tY}</div><div class="h">tarihte: %${tH}</div></div>
      </div>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return d ? `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>` : ''; }).join('')}</div>` : ''}
      <canvas class="rchart" id="rchart"></canvas>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button><a class="hbtn" href="../../#bolumler">☰ Tüm bölümler</a></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(slideOf('game')); };
    $('r-next').onclick = () => goTo(slideOf('sandbox'));
    requestAnimationFrame(drawResultChart);
  }
  const series = hist => [
    { data: hist.map(d => d.I / 30), color: '#b5543c', label: 'Denize giren', fmt: v => f1(v * 30) + ' Mt' },
    { data: hist.map(d => d.m / 60), color: '#8a6fd8', label: 'Mikroplastik', fmt: v => Math.round(v * 60) + ' Mt' },
    { data: hist.map(d => d.turtle), color: '#4f9a7a', label: 'Kaplumbağa', fmt: v => '%' + Math.round(v * 100) },
  ];
  function drawResultChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('rchart'), [{ data: HISTORY.hist.map(d => d.I / 30), color: '#9aa59a', dash: true, label: 'Tarihte girdi', fmt: v => f1(v * 30) + ' Mt' }, ...series(game.hist)], TOTAL, { y0: M.Y0, step: 20 }); }

  // =====================================================================
  // LABORATUVAR
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: M.newState(), p: { waste: 0.2, tax: 0, clean: 0 }, preset: null };
  function readSliders() {
    sb.p.waste = $('p-w').value / 100; sb.p.tax = $('p-t').value / 100; sb.p.clean = $('p-c').value / 100;
    $('o-pw').textContent = '%' + $('p-w').value; $('o-pt').textContent = '%' + $('p-t').value; $('o-pc').textContent = '%' + $('p-c').value;
  }
  ['p-w', 'p-t', 'p-c'].forEach(id => $(id).addEventListener('input', () => { readSliders(); sb.preset = null; document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: null, clean: [40, 0, 100], tap: [90, 50, 0], all: [80, 50, 60] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset]; sb.preset = b.dataset.preset;
    if (v) ['p-w', 'p-t', 'p-c'].forEach((id, i) => $(id).value = v[i]);
    readSliders(); sb.st = M.newState(); sb.frac = 0; updateSbStats(); drawSbChart();
    document.querySelectorAll('.pbtn').forEach(x => x.classList.toggle('on', x === b));
  });
  $('sb-play').onclick = () => { sb.running = !sb.running; $('sb-play').textContent = sb.running ? '❚❚ Durdur' : '▶ Devam'; };
  $('sb-speed').onclick = () => { sb.speed = sb.speed === 1 ? 2 : sb.speed === 2 ? 4 : 1; $('sb-speed').textContent = sb.speed + '×'; };
  $('sb-reset').onclick = () => { sb.st = M.newState(); sb.frac = 0; updateSbStats(); drawSbChart(); };
  readSliders();
  function enterSandbox() { sb.running = true; $('sb-play').textContent = '❚❚ Durdur'; updateSbStats(); setTimeout(drawSbChart, 50); }
  function updateSandbox(dt) {
    if (mode !== 'sandbox' || !sb.running) return;
    sb.frac += dt / (700 / sb.speed);
    while (sb.frac >= 1) {
      sb.frac -= 1;
      if (sb.st.y > M.Y1) sb.st = M.newState();
      const pp = sb.preset === 'history' ? M.histP(sb.st.y) : sb.p;
      if (sb.preset === 'history') { $('p-w').value = Math.round(pp.waste * 100); $('p-t').value = Math.round(pp.tax * 100); $('p-c').value = Math.round(pp.clean * 100); }
      M.step(sb.st, pp);
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() { const h = sb.st.hist[sb.st.hist.length - 1]; $('sb-year').textContent = String(h ? h.y : 1950); $('sb-harvest').textContent = `Denize giren: ${h ? f1(h.I) : 0} Mt · mikro: ${h ? Math.round(h.m) : 0} Mt`; }
  function drawSbChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('sb-chart'), series(sb.st.hist), TOTAL, { y0: M.Y0, step: 20 }); }

  // =====================================================================
  // DOKUNMA VE DÖNGÜ
  // =====================================================================
  cv.addEventListener('pointerdown', e => { initAudio(); if (mode === 'game' || mode === 'sandbox' || mode === 'title') talkAt(e.clientX, e.clientY); });
  let last = performance.now(), bgTick = 0, lastBg = '';
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    updateGame(dt); updateSandbox(dt); ambientChat(now);
    if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
    const h = (mode === 'game' || mode === 'result' || mode === 'sandbox') ? curHist() : null;
    if (h) Object.assign(target, { I: h.I, M: h.M, m: h.m, G: h.G, turtle: h.turtle, waste: mode === 'sandbox' ? sb.p.waste : game.p.waste, clean: mode === 'sandbox' ? sb.p.clean : game.p.clean });
    else Object.assign(target, { I: 2, M: 8, m: 4, G: 20, turtle: 1, waste: 0.3, clean: 0 });
    const k = 1 - Math.pow(0.93, dt / 16);
    for (const key of Object.keys(target)) vis[key] = lerp(vis[key], target[key], k * 0.5);
    vis.bad = lerp(vis.bad, smooth(10, 60, vis.M), k * 0.5);
    if (view.until && (game.reading || game.state === 'choice')) view.until += dt;
    if (view.until && performance.now() > view.until && !view.user) setView('shore');
    if (mode !== 'game' && mode !== 'result' && view.want === 'map') setView('shore');
    view.k = lerp(view.k, view.want === 'map' ? 1 : 0, 1 - Math.pow(0.9, dt / 16));
    if (mview.until && performance.now() > mview.until && !mview.user) setMicro(false);
    if (mode !== 'game' && mode !== 'sandbox') mview.want = 0;
    mview.k = lerp(mview.k, mview.want, 1 - Math.pow(0.9, dt / 16));
    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);
    render(now, dt);
    if (mode === 'game') {
      const yy = String(Math.max(M.Y0, Math.min(gs.y - 1, M.Y1)));
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = eraName(Number(yy)); $('g-date').textContent = yy;
      $('yb-fill').style.width = clamp((gs.hist.length + game.frac) / TOTAL) * 100 + '%';
      $('m-in').style.width = clamp(vis.I / 30) * 100 + '%';
      $('m-micro').style.width = clamp(vis.m / 60) * 100 + '%';
      $('m-turtle').style.width = clamp(vis.turtle) * 100 + '%';
      $('m-trust').style.width = game.sat + '%';
      $('m-trust').parentElement.parentElement.classList.toggle('low', game.sat < 30);
    }
    if (++bgTick % 6 === 0) { const bg = rgb(mixC(PAL.bgOk, PAL.bgBad, vis.bad)); if (bg !== lastBg) { document.documentElement.style.setProperty('--bg', bg); lastBg = bg; } }
    if (AC && waveGain && bgTick % 10 === 0) waveGain.gain.setTargetAtTime(0.03, AC.currentTime, 0.8);
    requestAnimationFrame(frame);
  }

  resetGame();
  if (wasDone) { paintDots(); replayNav(); }
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, sb, vis, turtle, ghost, bottles, lensBox, M, get gs() { return gs; }, get mode() { return mode; }, setView, go: m => { maxSeen = slides.length; goTo(slideOf(m)); } };
  window.addEventListener('resize', resize);
  resize();
  goTo(0);
  requestAnimationFrame(frame);
})();
