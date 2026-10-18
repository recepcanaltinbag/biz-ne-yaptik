// Bölüm — Milyarlardan Sıfıra (1860–1914)
(() => {
  'use strict';
  const MISSION = {
    title: 'Milyarlardan Sıfıra · 1860',
    role: 'Büyük Göller av komisyonunun başkanısın. Göçmen güvercin avının kurallarını sen koyarsın.',
    control: '🪺 <b class="inl">Yuva yasağı</b> baştan, 🛒 pazar yasağı 1870\'te, 🌳 orman koruma 1875\'te açılır. Telgraf dev bir koloni haber verince bekçi gönderip göndermeyeceğine sen karar verirsin.',
    goal: '1914\'te gökyüzünde en az <b>yarım milyar</b> güvercin uçsun.',
    watch: 'Güvercin yılda tek yumurta yapar ve yalnız kalabalık kolonide ürer. Sürü çizginin altına inerse koruma da yetmeyebilir.',
  };
  const M = window.GuvercinModel;
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
  HISTORY.hist.forEach(h => { if (h.P * 1e9 < 40) h.P = 0; });
  const GOAL = 0.5, THR = 0.3; // hedef ve Allee eşiği (milyar)
  const yk = y => window.SceneUtils ? window.SceneUtils.yilEk(y, 'de') : y + "'de";
  const popText = P => P >= 1 ? f1(P) + ' milyar' : P >= 0.001 ? Math.round(P * 1000) + ' milyon' : P >= 1e-6 ? Math.round(P * 1e6) + ' bin' : P > 0 ? Math.round(P * 1e9) + ' kuş' : 'yok';
  const popBar = P => clamp(Math.sqrt(P / 4.2));
  const eraName = (y, P) => y < 1866 ? 'Kararan gökyüzü' : P >= THR ? (y < 1890 ? 'Demiryolu ve telgraf' : 'Sürüler direniyor') : P > 0 ? 'Dağılan sürüler' : 'Son kuşlar';

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
      const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
      windGain = AC.createGain(); windGain.gain.value = 0.03; s.connect(f); f.connect(windGain); windGain.connect(master); s.start();
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
  const coo = () => { tone(330, 260, 0.35, 0.03); setTimeout(() => tone(300, 240, 0.4, 0.025), 380); };
  const tick = () => { tone(1200, 1200, 0.05, 0.02, 'square'); setTimeout(() => tone(1200, 1200, 0.05, 0.02, 'square'), 120); };
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
    const L = { gt: 0.66, gb: 1, x1: 1 };
    if (m === 'game') {
      const pnl = document.querySelector('.slide.active .gpanel');
      const top = pnl ? pnl.getBoundingClientRect().top : H * 0.56;
      L.gb = clamp((top - 6) / H, 0.4, 0.88); L.gt = Math.max(0.42, L.gb - (mobile ? 0.3 : 0.32));
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') L.gt = 0.82;
    if (m === 'sandbox') { if (mobile) { L.gt = 0.32; L.gb = 0.46; } else { L.gt = 0.62; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.66, gb: 1, x1: 1 };
  const PAL = { bgOk: [233, 240, 222], bgBad: [232, 226, 214], sky: [206, 222, 236], dusk: [120, 120, 130], ground: [206, 196, 156], farm: [222, 206, 150], ink: [43, 58, 46], tree: [79, 130, 80], tree2: [104, 150, 90] };
  const vis = { P: 4.2, F: 0.95, nest: 0.9, kill: 0.04, reach: 0.04, guard: 0, n: 0.1, bad: 0 };
  const target = { ...vis };
  const bubbles = [], floats = [], pulses = [], flock = [], mapBirds = [], hunters = [], wardens = [];
  const clouds = Array.from({ length: 3 }, () => ({ x: rnd(0, 1), y: rnd(0.08, 0.2), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000012) }));
  const trees = Array.from({ length: 22 }, (_, i) => ({ f: 0.3 + i / 22 * 0.68 + rnd(-0.01, 0.01), h: rnd(0.8, 1.25), k: i % 2, nest: Math.random() < 0.7 }));
  const train = { x: -0.3, t0: 0 }, tele = { pulse: -1 }, zoo = { sx: undefined };
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};
  for (let i = 0; i < 260; i++) flock.push({ x: Math.random(), y: rnd(-1, 1), v: rnd(0.8, 1.2), ph: rnd(0, 6) });
  for (let i = 0; i < 4; i++) hunters.push({ f: rnd(0.6, 0.95), dir: Math.random() < 0.5 ? -1 : 1, ph: rnd(0, 6), on: 0 });
  for (let i = 0; i < 3; i++) wardens.push({ f: rnd(0.62, 0.92), dir: 1, ph: rnd(0, 6), on: 0 });

  function geo() {
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H, gh = gb - gt;
    return { x1, gt, gb, gh, rail: gt + gh * 0.16 };
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
    if (o.hat) { ctx.fillStyle = o.hat; ctx.beginPath(); ctx.ellipse(0, -38, 9, 2.4, 0, 0, 6.283); ctx.fill(); ctx.fillRect(-5, -44, 10, 6); }
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(2.2, -34, 1.1, 0, 6.283); ctx.arc(-1.8, -34, 1.1, 0, 6.283); ctx.fill();
    if (o.net) { ctx.strokeStyle = 'rgba(90,70,50,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(22, -40); ctx.stroke(); ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(14 + k * 3, -46); ctx.lineTo(18 + k * 3, -32); ctx.moveTo(12, -44 + k * 3.5); ctx.lineTo(28, -42 + k * 3.5); } ctx.stroke(); }
    if (o.badge) { ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.arc(-2, -21, 2.4, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }
  function bird(x, y, s, flap, col = '#5a6a8a') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    const w = Math.sin(flap) * 3;
    ctx.beginPath(); ctx.moveTo(-5, -w); ctx.quadraticCurveTo(-2, 0, 0, 0); ctx.quadraticCurveTo(2, 0, 5, -w); ctx.stroke();
    ctx.restore();
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const G = geo(), { x1, gt, gb, gh } = G;
    const dark = 0.4 * smooth(0.2, 4, vis.P) * (mode === 'game' || mode === 'sandbox' || mode === 'title' ? 1 : 0.4);
    const sky = ctx.createLinearGradient(0, 0, 0, gt); sky.addColorStop(0, rgb(mixC(PAL.sky, PAL.dusk, dark), 0.95)); sky.addColorStop(1, 'rgba(240,244,232,.55)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, x1, gt);
    ctx.fillStyle = `rgba(246,210,104,${0.9 - dark})`; ctx.beginPath(); ctx.arc(x1 * 0.82, H * 0.14, 24 * U, 0, 6.283); ctx.fill();
    for (const cl of clouds) { cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15; const cx = cl.x * x1, cy = cl.y * H, s = 20 * U * cl.s; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283); ctx.fill(); }
    drawFlock(G, t, dt);
    // zemin: orman kesildikçe soldan tarla açılır
    ctx.fillStyle = rgb(PAL.ground); ctx.fillRect(0, gt, x1, H - gt);
    const cut = 1 - clamp((vis.F - 0.3) / 0.65);
    ctx.fillStyle = rgb(PAL.farm); ctx.fillRect(0, gt, x1 * (0.28 + cut * 0.45), H - gt);
    ctx.strokeStyle = 'rgba(160,130,80,.35)'; ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) { const y = gt + gh * (0.3 + k * 0.12); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(x1 * (0.28 + cut * 0.45), y); ctx.stroke(); }
    // istasyon ve şehir (solda)
    ctx.fillStyle = '#b89070'; ctx.fillRect(x1 * 0.02, gt - 34 * U, x1 * 0.09, 34 * U); ctx.fillStyle = '#8a5a40'; ctx.beginPath(); ctx.moveTo(x1 * 0.015, gt - 34 * U); ctx.lineTo(x1 * 0.065, gt - 50 * U); ctx.lineTo(x1 * 0.115, gt - 34 * U); ctx.fill();
    ctx.fillStyle = rgb(PAL.ink); ctx.font = `${10 * U}px "Patrick Hand"`; ctx.fillText('İSTASYON', x1 * 0.03, gt - 20 * U);
    // variller: av arttıkça birikir
    const nBar = Math.round(clamp(vis.kill / 0.3) * 8);
    for (let i = 0; i < nBar; i++) { const bx = x1 * (0.12 + (i % 4) * 0.022), by = gt + gh * 0.08 - Math.floor(i / 4) * 13 * U; ctx.fillStyle = '#9a6a3a'; ctx.beginPath(); ctx.ellipse(bx, by, 6 * U, 7 * U, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 6 * U, by - 2 * U); ctx.lineTo(bx + 6 * U, by - 2 * U); ctx.moveTo(bx - 6 * U, by + 3 * U); ctx.lineTo(bx + 6 * U, by + 3 * U); ctx.stroke(); }
    // demiryolu ve telgraf: avcıların kolonilere ulaşması
    const railLen = clamp((vis.reach - 0.04) / 0.27);
    if (railLen > 0.02) {
      const rx1 = x1 * (0.1 + 0.88 * railLen);
      ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 2 * U; ctx.beginPath(); ctx.moveTo(x1 * 0.1, G.rail); ctx.lineTo(rx1, G.rail); ctx.moveTo(x1 * 0.1, G.rail + 5 * U); ctx.lineTo(rx1, G.rail + 5 * U); ctx.stroke();
      ctx.lineWidth = 2 * U; for (let x = x1 * 0.1; x < rx1; x += 12 * U) { ctx.beginPath(); ctx.moveTo(x, G.rail - 2 * U); ctx.lineTo(x, G.rail + 7 * U); ctx.stroke(); }
      // telgraf direkleri ve tel
      ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2 * U; const poles = [];
      for (let x = x1 * 0.14; x < rx1; x += x1 * 0.11) { poles.push(x); ctx.beginPath(); ctx.moveTo(x, G.rail - 2 * U); ctx.lineTo(x, G.rail - 40 * U); ctx.moveTo(x - 6 * U, G.rail - 36 * U); ctx.lineTo(x + 6 * U, G.rail - 36 * U); ctx.stroke(); }
      if (poles.length > 1) { ctx.strokeStyle = 'rgba(60,50,40,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(poles[0], G.rail - 36 * U); for (let i = 1; i < poles.length; i++) ctx.quadraticCurveTo((poles[i - 1] + poles[i]) / 2, G.rail - 30 * U, poles[i], G.rail - 36 * U); ctx.stroke(); }
      tele.poles = poles; tele.sx = poles.length ? poles[Math.floor(poles.length / 2)] : undefined; tele.sy = G.rail - 40 * U;
      if (tele.pulse >= 0) { tele.pulse += dt / 1800; const px = lerp(rx1, x1 * 0.14, clamp(tele.pulse)); ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.arc(px, G.rail - 36 * U, 5 * U, 0, 6.283); ctx.fill(); if (tele.pulse > 1) tele.pulse = -1; }
      // tren: av çoğaldıkça sık gelir
      const per = lerp(26000, 9000, clamp(vis.kill / 0.3));
      const k = ((t - train.t0) % per) / per, tx = lerp(-0.25, 1.1, k) * x1;
      if (tx < rx1) { ctx.fillStyle = '#3a3f46'; ctx.fillRect(tx, G.rail - 18 * U, 34 * U, 16 * U); ctx.fillRect(tx + 24 * U, G.rail - 28 * U, 8 * U, 10 * U); ctx.fillStyle = '#7a5a3a'; for (let c = 1; c <= 3; c++) ctx.fillRect(tx - c * 30 * U, G.rail - 15 * U, 26 * U, 13 * U); ctx.fillStyle = 'rgba(200,200,200,.6)'; ctx.beginPath(); ctx.arc(tx + 28 * U, G.rail - 34 * U - (t % 900) / 90 * U, 5 * U, 0, 6.283); ctx.fill(); }
    } else tele.sx = undefined;
    // orman ve yuvalar
    const nTrees = Math.round(trees.length * clamp((vis.F - 0.2) / 0.75));
    trees.forEach((tr, i) => {
      const x = tr.f * x1, base = gt + gh * 0.28 + (i % 3) * gh * 0.05;
      if (i < trees.length - nTrees) { ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 4 * U, base - 6 * U, 8 * U, 6 * U); return; } // kütük
      const h = 60 * U * tr.h;
      ctx.fillStyle = '#6a4a30'; ctx.fillRect(x - 3 * U, base - h * 0.45, 6 * U, h * 0.45);
      ctx.fillStyle = rgb(tr.k ? PAL.tree : PAL.tree2); ctx.beginPath(); ctx.arc(x, base - h * 0.6, h * 0.32, 0, 6.283); ctx.arc(x - h * 0.18, base - h * 0.45, h * 0.22, 0, 6.283); ctx.arc(x + h * 0.18, base - h * 0.45, h * 0.22, 0, 6.283); ctx.fill();
      tr.sx = x; tr.sy = base - h * 0.7;
      if (tr.nest && vis.P > 0.002) { // yuva: tek yumurta; başarı düşükse boş
        const nx = x + h * 0.08, ny = base - h * 0.62;
        ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(nx, ny, 7 * U, 3 * U, 0, 0, Math.PI); ctx.fill();
        if ((i * 37 % 100) / 100 < vis.nest * smooth(0.03, 0.6, vis.P)) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(nx, ny - 1 * U, 2.6 * U, 3.2 * U, 0, 0, 6.283); ctx.fill(); }
        tr.nx = nx; tr.ny = ny;
      } else tr.nx = undefined;
    });
    // avcılar (ağlı) ve bekçiler: av ve koruma düzeyiyle
    const nH = Math.round(clamp(vis.kill / 0.25) * hunters.length * (vis.P > 0.001 ? 1 : 0));
    hunters.forEach((p, i) => { p.on = lerp(p.on, i < nH ? 1 : 0, 0.05); if (p.on < 0.05) { p.sx = undefined; return; } p.f += p.dir * 0.000018 * dt; if (p.f < 0.55 || p.f > 0.96) p.dir *= -1; const x = x1 * p.f, y = gt + gh * (0.62 + (i % 2) * 0.16); p.sx = x; p.sy = y - 44 * U; ctx.globalAlpha = p.on; person(x, y, U * (mobile ? 0.8 : 0.95), { dir: p.dir, shirt: '#8a5a3a', hat: '#4a3a2a', net: true, step: Math.sin(t * 0.02 + p.ph) * 3 }); ctx.globalAlpha = 1; });
    const nW = Math.round(clamp(Math.max(vis.n, vis.guard)) * wardens.length);
    wardens.forEach((p, i) => { p.on = lerp(p.on, i < nW ? 1 : 0, 0.05); if (p.on < 0.05) { p.sx = undefined; return; } p.f += p.dir * 0.000014 * dt; if (p.f < 0.6 || p.f > 0.94) p.dir *= -1; const x = x1 * p.f, y = gt + gh * (0.72 + (i % 2) * 0.12); p.sx = x; p.sy = y - 44 * U; ctx.globalAlpha = p.on; person(x, y, U * (mobile ? 0.8 : 0.95), { dir: p.dir, shirt: '#4f7a5a', hat: '#3a5a3a', badge: true, step: Math.sin(t * 0.02 + p.ph) * 3 }); ctx.globalAlpha = 1; });
    // hayvanat bahçesi kafesi: yabani sürü bitince son kuşlar burada
    if (mode === 'game' && (game.wildGone || (gs.y > 1898 && vis.P < THR))) {
      const zx = x1 * 0.42, zy = gt + gh * 0.5; zoo.sx = zx; zoo.sy = zy - 30 * U;
      ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 1.5; ctx.strokeRect(zx - 24 * U, zy - 36 * U, 48 * U, 36 * U); for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(zx - 24 * U + k * 8 * U, zy - 36 * U); ctx.lineTo(zx - 24 * U + k * 8 * U, zy); ctx.stroke(); }
      const nz = gs.y >= 1914 ? 1 : Math.max(1, Math.round(lerp(6, 1, clamp((gs.y - 1900) / 14))));
      for (let k = 0; k < nz; k++) bird(zx - 14 * U + k * 6 * U, zy - 12 * U - (k % 2) * 6 * U, U * 1.2, 0.3, '#7a6a9a');
      tag(zx, zy - 42 * U, '🏛️ Cincinnati Hayvanat Bahçesi', { fs: 11 });
    } else zoo.sx = undefined;
    if (window.SceneUtils && window.SceneUtils.atmo && (mode === 'game' || mode === 'title')) window.SceneUtils.atmo(ctx, G.x1, H, { year: (mode === 'game' ? Math.max(M.Y0, gs.y - 1) : M.Y0 + 40), bad: vis.bad }); // dönem rengi ve kriz
    drawLabels(G, t);
    drawOfficial(G, t);
    if (view.k > 0.01) drawMap(G, t, dt, view.k);
    if (view.k < 0.5) for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i], k = (t - p.t0) / 2400; if (k > 1) { pulses.splice(i, 1); continue; } const [x, y] = p.getPos(); if (x === undefined) continue; for (let j = 0; j < 2; j++) { const kk = (k * 2 + j * 0.5) % 1; ctx.strokeStyle = p.col; ctx.globalAlpha = (1 - kk) * 0.9; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.arc(x, y, (10 + kk * 40) * U, 0, 6.283); ctx.stroke(); } ctx.globalAlpha = 1; }
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt / 1300; f.y -= dt * 0.025; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = clamp(f.life * 2); ctx.font = `${16 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillStyle = f.col || rgb(PAL.ink); ctx.fillText(f.text, f.x, f.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt / 4200; if (b.life <= 0) { bubbles.splice(i, 1); continue; } drawBubble(b); }
  }
  // gökyüzündeki sürü: kuş sayısı nüfusla; milyarlarken gökyüzü kararır, tek tük kalınca birkaç kuş
  const flockBox = { x0: 0, x1: 0, y0: 0, y1: 0 };
  function drawFlock(G, t, dt) {
    const P = vis.P, n = P <= 0 ? 0 : Math.max(P > 1e-6 ? 3 : 1, Math.round(flock.length * Math.sqrt(clamp(P / 4.2))));
    const cy = G.gt * 0.5, band = G.gt * (0.08 + 0.22 * Math.sqrt(clamp(P / 4.2)));
    flockBox.x0 = 0; flockBox.x1 = G.x1; flockBox.y0 = cy - band; flockBox.y1 = cy + band;
    for (let i = 0; i < n; i++) {
      const b = flock[i]; b.x += b.v * 0.00006 * dt; if (b.x > 1.05) b.x = -0.05;
      const x = b.x * G.x1, y = cy + b.y * band + Math.sin(b.x * 9 + b.ph + t * 0.001) * 10 * U;
      bird(x, y, U * (0.9 + 0.3 * (i % 3) / 2), t * 0.02 + b.ph);
    }
  }
  function drawLabels(G, t) {
    if (mode !== 'game' && mode !== 'sandbox') return;
    const fs = mobile ? 11 : 13, bad = '#a0402a', h = curHist();
    if (!h) return;
    const days = h.P / 4.2 * 3;
    tag(G.x1 * 0.5, Math.max(G.gt * 0.5 + G.gt * 0.3 + 20 * U, 230 * U), h.P > 0 ? `🕊️ ${popText(h.P)} güvercin · bir sürünün geçişi: ${days >= 1 ? f1(days) + ' gün' : days * 24 >= 1 ? Math.round(days * 24) + ' saat' : 'birkaç dakika'}` : '🕊️ Gökyüzü boş', { fs, color: h.P < THR ? bad : undefined });
    if (h.P > 0 && h.P < 0.6) tag(G.x1 * 0.78, G.gt + G.gh * 0.28 - 70 * U, h.P < THR ? '🪺 Koloni çok küçük: kuşlar ürüyemiyor' : '🪺 Koloniler küçülüyor', { fs: fs - 1, color: bad });
    if (vis.reach > 0.08 && G.gh > 60) tag(G.x1 * 0.2, G.rail - 46 * U, `🚂 Avcılar trenle: yılda sürünün %${Math.round(h.killRate * 100)}'i avlanıyor`, { fs: fs - 1, color: h.killRate > 0.15 ? bad : undefined });
  }
  // harita: Büyük Göller; demiryolu yayılır, telgraf koloniyi haber verir, avcılar trene biner
  const view = { want: 'scene', k: 0, until: 0, user: false };
  function setView(v, ms) { view.want = v; view.user = !ms; view.until = ms ? performance.now() + ms : 0; const b = $('g-view'); if (b) b.textContent = v === 'map' ? '🌳 Orman' : '🗺️ Harita'; }
  const CITY = { chi: [0.33, 0.64, 'Chicago'], det: [0.57, 0.53, 'Detroit'], ny: [0.94, 0.7, 'New York'], cin: [0.52, 0.9, 'Cincinnati'], pet: [0.43, 0.26, 'Petoskey'] };
  const RAILS = [['ny', 'det', 0.1], ['det', 'chi', 0.25], ['chi', 'cin', 0.4], ['det', 'pet', 0.65], ['chi', 'pet', 0.8]];
  const colonies = [];
  function mapGeom(G) {
    const top = 150 * U, H2 = Math.max(80, G.gb - top - 10 * U), Wm = Math.min(G.x1 * 0.94, H2 * 1.5), Hm = Wm / 1.5;
    return { ox: (G.x1 - Wm) / 2, oy: top + (H2 - Hm) / 2, Wm, Hm };
  }
  function drawMap(G, t, dt, alpha) {
    const g = mapGeom(G), X = p => g.ox + p * g.Wm, Y = p => g.oy + p * g.Hm;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#e4dcc0'; ctx.fillRect(0, 0, G.x1, H);
    // orman: kuzeyde, kesildikçe küçülür
    ctx.fillStyle = `rgba(79,130,80,${0.25 + 0.5 * clamp((vis.F - 0.3) / 0.65)})`;
    ctx.beginPath(); ctx.ellipse(X(0.45), Y(0.3), g.Wm * 0.34 * (0.45 + 0.55 * vis.F), g.Hm * 0.28 * (0.45 + 0.55 * vis.F), 0, 0, 6.283); ctx.fill();
    // göller
    ctx.fillStyle = '#86b0cc';
    [[0.3, 0.1, 0.15, 0.05, -0.1], [0.37, 0.4, 0.028, 0.2, 0], [0.52, 0.33, 0.045, 0.12, 0.3], [0.66, 0.6, 0.08, 0.035, -0.3], [0.8, 0.5, 0.06, 0.03, -0.2]].forEach(([x, y, rx, ry, r]) => { ctx.beginPath(); ctx.ellipse(X(x), Y(y), rx * g.Wm, ry * g.Hm, r, 0, 6.283); ctx.fill(); });
    // demiryolları: ulaşım arttıkça çizilir
    const reach = clamp((vis.reach - 0.04) / 0.27);
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2.5 * U; ctx.setLineDash([6 * U, 4 * U]);
    RAILS.forEach(([a, b, at]) => { const k = clamp((reach - at) / 0.2 + 0.5); if (k <= 0) return; const A = CITY[a], B = CITY[b]; ctx.beginPath(); ctx.moveTo(X(A[0]), Y(A[1])); ctx.lineTo(X(lerp(A[0], B[0], k)), Y(lerp(A[1], B[1], k))); ctx.stroke(); });
    ctx.setLineDash([]);
    // koloniler: telgraf haber verir, avcılar (noktalar) koşar
    for (let i = colonies.length - 1; i >= 0; i--) {
      const c = colonies[i]; if (gs.y > c.year + 1) { colonies.splice(i, 1); continue; }
      const r = (8 + 14 * Math.sqrt(clamp(vis.P / 4.2))) * U;
      ctx.fillStyle = 'rgba(90,106,138,.5)'; ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = c.guard ? '#4f7a5a' : '#c0503a'; ctx.lineWidth = 2.5 * U; ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), r + 3 * U, 0, 6.283); ctx.stroke();
      const k = (t * 0.0004 + i) % 1;
      ['chi', 'det', 'ny'].forEach((cc, j) => { const C = CITY[cc]; const kk = (k + j * 0.33) % 1; ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.arc(X(lerp(c.x, C[0], kk)), Y(lerp(c.y, C[1], kk)), 3 * U, 0, 6.283); ctx.fill(); if (!c.guard) { ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(X(lerp(C[0], c.x, kk)), Y(lerp(C[1], c.y, kk)), 3.5 * U, 0, 6.283); ctx.fill(); } });
      tag(X(c.x), Y(c.y) - r - 6 * U, c.guard ? `🛡️ ${c.name}: bekçiler kolonide` : `📨 ${c.name}: avcılar yolda`, { fs: 12 });
    }
    // göç eden kuşlar: nüfusla
    const want = vis.P <= 0 ? 0 : Math.max(2, Math.round(80 * Math.sqrt(clamp(vis.P / 4.2))));
    while (mapBirds.length < want) mapBirds.push({ x: rnd(0.15, 0.85), y: rnd(0.15, 0.85), a: rnd(0, 6.283) });
    while (mapBirds.length > want) mapBirds.pop();
    mapBirds.forEach(b => { b.a += rnd(-0.1, 0.1); b.x = clamp(b.x + Math.cos(b.a) * dt * 0.00004, 0.1, 0.9); b.y = clamp(b.y + Math.sin(b.a) * dt * 0.00004, 0.1, 0.9); bird(X(b.x), Y(b.y), U * 0.8, t * 0.02 + b.a, '#4a5a7a'); });
    Object.values(CITY).forEach(([x, y, n]) => { ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(X(x), Y(y), 4 * U, 0, 6.283); ctx.fill(); tag(X(x), Y(y) - 6 * U, n, { fs: 11, a: 0.85 }); });
    tag(X(0.5), Y(1.0), `🗺️ Büyük Göller · demiryolu %${Math.round(reach * 100)} · orman %${Math.round(vis.F * 100)} · dokun: ormana dön`, { fs: 12 });
    ctx.restore();
  }

  // =====================================================================
  // KONUŞMALAR
  // =====================================================================
  function lines(kind) {
    const h = curHist() || { P: 4.2 };
    const P = {
      hunter: h.P > 1 ? ['Bir ağda yüzlerce kuş!\nBunlar bitmez.', 'Düzinesi elli sent,\nvarili trenle Chicago\'ya.', 'Telgraf geldi:\nkuzeyde yeni koloni!'] : ['Eskiden gökyüzü\nkarardı. Şimdi?', 'Bu yıl ağ\nboş kaldı...', 'Kuşlar nereye\ngitti?'],
      warden: ['Yuvalara ağ yok!\nYasa böyle.', 'Avcılar beni\nhiç sevmiyor.', 'Tek yumurta, tek yavru.\nKorumazsak biter.'],
      tree: h.P > 0.3 ? ['Dallarım yuvadan\nkırılacak!', 'Kayın yemişim\nbu yıl bol.', 'Bir ağaçta\nyüz yuva!'] : ['Dallarım\nsessiz.', 'Yuvalar boş\nkaldı.', 'Yemişimi\nyiyen yok.'],
      tele: ['Tık tık tık!\nKoloni haberi.', 'Telgraf tüm\navcılara haber verdi.', 'Tren yarın\nsabah kalkıyor.'],
      zoo: ['Burada yalnızım.', 'Martha diyorlar\nbana.', 'Arkadaşlarım\nnerede?'],
      official: ['Kararınızı\nbekliyoruz.', 'Meclis\ntoplandı.'],
    };
    return pick(P[kind] || ['...']);
  }
  function talkAt(x, y) {
    if (view.k > 0.5) { setView('scene'); return true; }
    if (y > flockBox.y0 && y < flockBox.y1 && vis.P > 0 && y < geo().gt - 40 * U) { coo(); floats.push({ x, y, text: vis.P > 1 ? 'Gökyüzü kuş dolu!' : 'Sürü inceldi...', life: 1 }); if (tapCount('flock') >= 3) award('guv-audubon'); return true; }
    const c = [], add = (sx, sy, kind, fn) => { if (sx !== undefined && !isNaN(sy)) c.push({ d: Math.hypot(sx - x, sy - y), kind, fn, obj: { x: sx, y: sy } }); };
    hunters.forEach(p => add(p.sx, p.sy, 'hunter'));
    wardens.forEach(p => add(p.sx, p.sy, 'warden'));
    trees.forEach(tr => { if (tr.nx !== undefined) add(tr.nx, tr.ny, 'tree', () => award('guv-yumurta')); });
    (tele.poles || []).forEach(px => add(px, tele.sy, 'tele', () => { tick(); if (tapCount('tele') >= 3) award('guv-telgraf'); }));
    add(zoo.sx, zoo.sy, 'zoo', () => award('guv-martha'));
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
    hunters.forEach(p => { if (p.sx !== undefined) opts.push(['hunter', p]); });
    wardens.forEach(p => { if (p.sx !== undefined) opts.push(['warden', p]); });
    trees.forEach(tr => { if (tr.nx !== undefined && Math.random() < 0.2) opts.push(['tree', { get sx() { return tr.nx; }, get sy() { return tr.ny; } }]); });
    if (!opts.length) return;
    const [k, p] = pick(opts); sayAt({ get x() { return p.sx; }, get y() { return p.sy; } }, lines(k));
    if (Math.random() < 0.3 && vis.P > 0.1) coo();
  }

  let official = null;
  function drawBody(g, who, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = who === 'tel' ? '#6a7fb0' : who === 'lobby' ? '#4a5866' : '#4f7a5a'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    if (who === 'tel') { g.fillStyle = '#3a4a6a'; g.fillRect(-8, -46, 16, 4); g.fillRect(-5, -50, 10, 5); } // telgrafçı şapkası
    else if (who === 'lobby') { g.fillStyle = '#2a2a2a'; g.fillRect(-7, -54, 14, 12); g.fillRect(-11, -43, 22, 3); g.fillStyle = '#c0503a'; g.beginPath(); g.moveTo(-2, -30); g.lineTo(2, -30); g.lineTo(0, -18); g.fill(); } // silindir şapka
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
    const stopX = G.x1 * (mobile ? 0.3 : 0.36), startX = -40;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    const leaving = official.leave && now > official.leave;
    if (leaving) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = G.gt + G.gh * 0.55, s = 1.1 * U, walk = e < 1500 || leaving;
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
  const DONE_KEY = 'bny-bitti-guvercin';
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
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-guvercin', 'Başladı: Milyarlardan Sıfıra'); enterGame(); }
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
    for (let i = toastQueue.length - 1; i >= 0; i--) { const a = toastQueue[i]; if (!(a[4] || {}).pause && a.born !== undefined && gs.y - a.born > ((a[4] || {}).keep ? 4 : 2)) toastQueue.splice(i, 1); }
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
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    const plain = text.replace(/<[^>]+>/g, '');
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 4500 + plain.length * 65)) / Math.sqrt(game.speed || 1)); // hız arttıkça kart da kısa kalır
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const YEAR = 3900 / FAST;
  let gs = M.newState();
  const game = {};
  const SL = { nest: $('g-nest'), quota: $('g-quota'), forest: $('g-forest') };
  const award = id => (window.Badges ? window.Badges.award(id) : false);
  const choiceQ = [];
  const curHist = () => { const s = mode === 'sandbox' ? sb.st : gs; return s.hist.length ? s.hist[s.hist.length - 1] : null; };
  const PLACES = { Wisconsin: [0.22, 0.3], 'Michigan ormanı': [0.47, 0.42], Pennsylvania: [0.8, 0.72], 'New York eyaleti': [0.86, 0.5], Ohio: [0.6, 0.78] };

  function makeWorld() {
    const mast = []; while (mast.length < 2) { const y = 1864 + Math.floor(Math.random() * 40); if (mast.every(x => Math.abs(x - y) > 5) && Math.abs(y - 1878) > 1 && Math.abs(y - 1870) > 1 && Math.abs(y - 1875) > 1) mast.push(y); }
    const col = []; for (let y = 1867 + Math.floor(Math.random() * 3); y < 1906; y += 4 + Math.floor(Math.random() * 3)) if (Math.abs(y - 1878) > 1 && !mast.includes(y)) col.push(y);
    return { mast, col };
  }
  function resetGame() {
    gs = M.newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, fired: new Set(), hist: [], speed: 1, touched: false, reading: 0, story: false, endAfter: false,
      p: { nest: 0.1, quota: 0, forest: 0 }, sat: 70, habit: 0.03, replaced: false, unlocked: { nest: true, quota: false, forest: false },
      world: makeWorld(), guard: 0, colonyNow: 0, guards: 0, petoskey: false, lobbies: 0, lockUntil: 0, moved: {}, wildGone: 0, maxLate: 0,
    });
    SL.nest.value = 10; SL.quota.value = 0; SL.forest.value = 0; SL.quota.disabled = true; SL.forest.disabled = true;
    $('w-quota').classList.add('locked'); $('w-forest').classList.add('locked'); $('o-quota').textContent = "🔒 1870'te açılır"; $('o-forest').textContent = "🔒 1875'te açılır";
    document.querySelectorAll('.coach').forEach(uncoach);
    readPolicy();
    $('g-pause').textContent = '❚❚ Durdur'; setSpeed(1);
    $('modal').hidden = true; $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone');
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {}; if (window.SceneUtils && window.SceneUtils.decadeReset) window.SceneUtils.decadeReset();
    choiceQ.length = 0; official = null; colonies.length = 0; mapBirds.length = 0; setView('scene');
  }
  function readPolicy() {
    const lim = { nest: 0.3, quota: 0.2, forest: 0.3 };
    ['nest', 'quota', 'forest'].forEach(k => {
      if (game.lockUntil && gs.y < game.lockUntil && SL[k].value / 100 > lim[k]) SL[k].value = lim[k] * 100;
      game.p[k] = game.unlocked[k] ? SL[k].value / 100 : 0;
      if (game.unlocked[k]) $('o-' + k).textContent = '%' + SL[k].value + (game.lockUntil && gs.y < game.lockUntil ? ' · 🔒 meclis' : '');
    });
  }
  const arrowTxt = (a, b, f, upGood) => { const better = upGood ? b > a : b < a, same = Math.abs(b - a) < 1e-9 || f(a) === f(b); return `${f(a)} → <b class="${same ? '' : better ? 'up' : 'down'}">${f(b)}</b>`; };
  function simGuv(pol, n = 5) {
    const st = JSON.parse(JSON.stringify(gs)); st.hist = [];
    for (let i = 0; i < n && st.y <= M.Y1; i++) { M.step(st, { ...pol, guard: 0, colony: 1, mast: 1 }); if (st.P * 1e9 < 40) st.P = 0; }
    return st.hist[st.hist.length - 1];
  }
  if (window.SceneUtils && window.SceneUtils.watchSliders) window.SceneUtils.watchSliders(Object.values(SL), () => game.p, (a, b) => {
    if (mode !== 'game' || !gs.hist.length) return null;
    const A = simGuv(a), B = simGuv(b); if (!A || !B) return null;
    const lv = q => (q.nest * 1.6 + q.quota * 2.2 + q.forest * 1.6) / 5.4, press = 0.4 + 0.8 * (gs.hist[gs.hist.length - 1].reach) / 0.31;
    const dSat = -(lv(b) - lv(a)) * press * 2 - Math.max(0, lv(b) - lv(a)) ** 2 * 40;
    return { html: `▶ <span class="k">5 yıl sonra</span> 🕊️ ${arrowTxt(A.P, B.P, popText, true)} · 🪺 ${arrowTxt(A.nest, B.nest, v => '%' + Math.round(v * 100), true)}${Math.abs(dSat) >= 1 ? ` · 🏛️ destek <b class="${dSat > 0 ? 'up' : 'down'}">${dSat > 0 ? '+' : ''}${Math.round(dSat)}</b>` : ''}` };
  });
  Object.entries(SL).forEach(([k, el]) => el.addEventListener('input', () => { initAudio(); game.moved[k] = 1; readPolicy(); if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); } }));
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
  const CINE = {
    sky: { id: 'guv-1860', year: '1860', title: 'Kuzey Amerika', shots: [
      { dur: 5200, bg: '#c8d4dc', text: 'Doğa bilimci Audubon yazmıştı: sürü geçerken öğle güneşi tutulmadaki gibi karardı.', draw: (g, t, W, H, k) => {
        const dark = Math.min(1, k * 1.4); g.fillStyle = `rgba(40,40,60,${0.55 * dark})`; g.fillRect(0, 0, W, H);
        g.fillStyle = '#4a6a3a'; g.beginPath(); g.moveTo(0, H * 0.8); for (let x = 0; x <= W; x += 30) g.lineTo(x, H * 0.76 - Math.abs(Math.sin(x * 0.03)) * 30); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        window.Cinema.fx.birds(g, t, W, H, Math.round(40 + 260 * k), { y: H * 0.38, spread: H * 0.22, v: 0.09, col: 'rgba(25,25,35,.8)' }); } },
      { dur: 4600, bg: '#c8d4dc', text: 'Kuzey Amerika\'da 3–5 milyar göçmen güvercin. Kimse bitebileceklerini düşünmüyor.', draw: (g, t, W, H, k) => {
        g.fillStyle = 'rgba(40,40,60,.5)'; g.fillRect(0, 0, W, H); window.Cinema.fx.birds(g, t, W, H, 300, { y: H * 0.4, spread: H * 0.3, v: 0.08 }); window.Cinema.fx.counter(g, W, H, 1000, 4000000000, k, { y: H * 0.86, fs: Math.min(W, H) * 0.08 }); } },
    ] },
    petoskey: { id: 'guv-1878', year: '1878', title: 'Petoskey, Michigan', credit: 'J. P. Cockburn (1829), kamu malı', shots: [
      { img: '../../assets/img/cards/passenger-pigeon-net-cockburn-1829.jpg', kb: [0.3, 0.5, 1.05, 0.65, 0.45, 1.35], dur: 5200, text: 'Telgraf haber verdi, trenler avcıları getirdi. Ağlar kurulup yüzlerce kuş birden yakalanıyor.' },
      { dur: 4400, bg: '#2a2420', text: 'Aylarca, her gün yaklaşık 50.000 güvercin varillere konup şehirlere yollandı.', draw: (g, t, W, H, k) => {
        const n = Math.floor(24 * Math.min(1, k * 1.3)); for (let i = 0; i < n; i++) { const x = W * 0.12 + (i % 8) * W * 0.1, y = H * 0.7 - Math.floor(i / 8) * H * 0.14; g.fillStyle = '#8a5a30'; g.beginPath(); g.ellipse(x, y, W * 0.035, H * 0.06, 0, 0, 6.28); g.fill(); g.strokeStyle = '#4a2a10'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - W * 0.035, y - H * 0.02); g.lineTo(x + W * 0.035, y - H * 0.02); g.moveTo(x - W * 0.035, y + H * 0.02); g.lineTo(x + W * 0.035, y + H * 0.02); g.stroke(); } } },
    ] },
    martha: { id: 'guv-1914', year: '1914', title: 'Cincinnati Hayvanat Bahçesi', shots: [
      { dur: 5000, bg: '#d8d0c0', text: '1 Eylül 1914. Martha, türünün son bireyi, kafesinde yalnız.', draw: (g, t, W, H, k) => {
        g.strokeStyle = '#4a4a4a'; g.lineWidth = 3; const x0 = W * 0.3, x1 = W * 0.7, y0 = H * 0.22, y1 = H * 0.78; g.strokeRect(x0, y0, x1 - x0, y1 - y0); for (let x = x0; x < x1; x += 22) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
        g.strokeStyle = '#6a4a30'; g.lineWidth = 6; g.beginPath(); g.moveTo(x0 + 20, H * 0.55); g.lineTo(x1 - 20, H * 0.55); g.stroke();
        const a = 1 - Math.max(0, (k - 0.75) * 4); g.globalAlpha = Math.max(0, a); g.fillStyle = '#7a6a9a'; g.beginPath(); g.ellipse(W * 0.5, H * 0.52, 16, 9, -0.2, 0, 6.28); g.fill(); g.beginPath(); g.arc(W * 0.5 + 14, H * 0.49, 6, 0, 6.28); g.fill(); g.globalAlpha = 1; } },
      { dur: 4400, bg: '#14120f', text: 'Milyarlardan sıfıra: elli yıl yetti.', draw: (g, t, W, H, k) => { window.Cinema.fx.counter(g, W, H, 4000000000, 1, Math.min(1, k * 1.6), { y: H * 0.52 }); } },
    ] },
  };

  function unlock(k, text) {
    game.unlocked[k] = true; SL[k].disabled = false; $('w-' + k).classList.remove('locked'); readPolicy();
    milestone(k === 'quota' ? '🛒' : '🌳', 'Yeni araç', text, '', () => !game.moved[k] && Number(SL[k].value) === 0 && coach(SL[k], k === 'quota' ? '👉 Kaydır: pazar yasağı' : '👉 Kaydır: orman koruma'));
  }

  const STORY = [
    ['🕊️', '1860', 'Gökyüzü kararıyor: Kuzey Amerika\'da <b>4 milyar</b> göçmen güvercin var. Bir sürünün geçişi günler sürüyor.', '', { pause: true }],
    ['🪺', 'Doğa bilimci', 'Bu kuş yılda <b>tek yumurta</b> yapar ve yalnız dev kolonilerde ürer. Kalabalık, onun hayatta kalma yolu.', '', { pause: true }],
    ['📜', 'Senato raporu (1857)', 'Ohio: "Göçmen güvercinin korunmaya ihtiyacı yok. Bu kadar bereketli bir kuşu sıradan bir av azaltamaz."', '', { pause: false, ms: 8000 }],
  ];
  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (game.started) return;
    game.started = true; game.story = true; // görev kartı kapanana kadar zaman durur
    const show = i => {
      if (mode !== 'game') return;
      if (i >= STORY.length) { game.story = false; setTimeout(() => !game.moved.nest && coach(SL.nest, '👉 Kaydır: yuvaları koru', 0), 1500); return; }
      const [ic, from, text, tone, opt0] = STORY[i];
      const opt = wasDone ? { ...opt0, pause: false, ms: 6000 } : opt0;
      toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
      if (!opt.pause) setTimeout(() => show(i + 1), 4500 / Math.max(1, FAST / 2));
    };
    const start = () => { if (wasDone) game.story = false; setTimeout(() => cine(CINE.sky, () => show(0)), 300); };
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
  // telgraf: dev koloni haberi; bekçi göndermek meclisi zorlar, göndermemek avcıları koloniye yığar
  function colonyAlert(y, name) {
    const big = name === 'Petoskey';
    if (big && !game.fired.has('cineP')) { game.fired.add('cineP'); cine(CINE.petoskey, () => colonyAlert(y, name)); return; }
    tele.pulse = 0; tick();
    const at = big ? CITY.pet : PLACES[name]; colonies.length = 0; colonies.push({ x: at[0], y: at[1], name, year: y, guard: false });
    const col = colonies[colonies.length - 1];
    setView('map', 7000);
    if (!game.fired.has('gmap')) { game.fired.add('gmap'); guide([{ key: 'map', el: '#g-view', text: '🗺️ <b>Haritaya</b> istediğin zaman buradan bakabilirsin: demiryolu, orman ve koloniler.' }]); }
    comeOfficial('tel', 'Tık tık! Telgraf var.');
    choice('Telgrafçı', big ? 'Petoskey: dev koloni!' : `${name}: yeni koloni`, big ? '"Michigan\'ın kuzeyinde görülmüş en büyük koloni! Bütün avcılar trene biniyor. Günde <b>50.000 kuş</b> avlayacaklar."' : pick(['"Telgraf haber verdi: dev bir koloni yuva yapıyor. Avcılar yarın trenle oraya varır."', '"Tık tık tık! Ağaçlar yuvadan görünmüyor diyorlar. İstasyonda ağlar yükleniyor."', '"Kasabadan haber: kuşlar ormana indi. Tüccarlar boş varil ısmarladı bile."']), [
      { label: '🛡️ Bekçi gönder', sub: 'Bu yıl koloni korunur; meclis masrafa kızar', fn: () => { game.guard = 1; game.guards++; col.guard = true; if (big) { game.petoskey = true; award('guv-petoskey'); } if (game.guards >= 4) award('guv-bekci'); toast('🛡️', 'Bekçiler', 'Bekçiler koloniye vardı. Ağlar toplandı.', 'good'); } },
      { label: '🚂 Avcılar gelsin', sub: 'Kasabalar kazanır; koloni ağır av görür', fn: () => { game.guard = 0; toast('🚂', 'İstasyon', 'Varillerle dolu trenler şehre gidiyor.', 'bad'); } },
    ], 'tel');
  }

  function yearTick() {
    const y = gs.y, W0 = game.world;
    const colony = game.colonyNow, guard = game.guard;
    const mast = W0.mast.includes(y) ? 0.55 : 1;
    M.step(gs, { ...game.p, guard, colony: colony ? 2 : 1, mast });
    game.colonyNow = 0; game.guard = 0;
    let h = gs.hist[gs.hist.length - 1];
    if (gs.P > 0 && gs.P * 1e9 < 40) { gs.P = 0; h.P = 0; } // son yabani kuşlar
    if (gs.P === 0 && !game.wildGone) game.wildGone = y;
    game.hist.push({ ...h, sat: game.sat });
    if (y >= 1885) game.maxLate = Math.max(game.maxLate, game.p.nest + game.p.quota);
    // meclis desteği: yasaklar kasabaları ve pazarı kızdırır; ani artış daha çok kızdırır, zamanla alışılır
    const lvl = (game.p.nest * 1.6 + game.p.quota * 2.2 + game.p.forest * 1.6) / 5.4, press = 0.4 + 0.8 * h.reach / 0.31;
    const shock = Math.max(0, lvl - game.habit); game.habit += (lvl - game.habit) * 0.15;
    const lastLvl = game.lastLvl; game.lastLvl = lvl;
    if (!game.replaced) game.sat = clamp(game.sat + 1.0 - lvl * press * 2 - shock * shock * 40 - (guard ? 1.5 : 0) + (colony && !guard ? 2 : 0), 0, 100);
    if (shock > 0.15 && lvl - (lastLvl || 0) > 0.08) once('shock' + Math.floor(y / 5), () => toast('😠', 'Kasabalar', 'Yasaklar <b>birden</b> sıkılaştı, herkes kızgın. Yavaş artırırsan alışırlar.', 'warn'));
    $('yb-harvest').textContent = `🕊️ ${popText(h.P)}`; $('yb-harvest').style.color = h.P >= GOAL ? 'var(--green)' : h.P >= THR ? 'var(--grain)' : 'var(--danger)';
    // olaylar
    if (y === 1866) { pulseAt(() => [tele.sx, tele.sy]); milestone('🚂', 'Demiryolu ve telgraf', 'Avcılar koloninin yerini <b>telgrafla</b> öğrenip <b>trenle</b> geliyor. Vurulan kuşlar buzlu varillerle şehre gidiyor.', 'warn'); }
    if (y === 1870) unlock('quota', 'Şehirde bir düzine güvercin elli sent. <b>Pazar yasağı</b> satışı sınırlar. Ama şehirde et pahalanır, tüccarlar kızar.');
    if (y === 1875) unlock('forest', 'Çiftçiler ve keresteciler ormanı kesiyor. <b>Orman koruma</b> palamut ve kayın yemişini korur. Ama çiftçi ve kereste ustası kızar.');
    if (W0.mast.includes(y + 1)) milestone('🌰', 'Ormancı', '<b>Gelecek yıl</b> kayın yemişi az olacak: yuvaların çoğu boş kalacak. O yıl avı azaltmak (pazar ve yuva yasağı) kayıpları sınırlar.', 'warn');
    if (W0.mast.includes(y)) toast('🌰', 'Orman', 'Yemiş kıt: yuvaların çoğu boş kaldı.', 'bad');
    const nextCol = W0.col.includes(y + 1) || y + 1 === 1878;
    if (nextCol && gs.P > 0.05) { game.colonyNow = 1; colonyAlert(y + 1, y + 1 === 1878 ? 'Petoskey' : pick(Object.keys(PLACES))); }
    else if (nextCol && gs.P > 0) once('nocol', () => toast('🪺', 'Telgrafçı', 'Artık dev koloni haberi gelmiyor. Kuşlar küçük gruplara dağılmış.', 'bad'));
    if (h.P > 0 && h.P < 0.6) once('allee1', () => { pulseAt(() => [geo().x1 * 0.78, geo().gt + 40 * U]); guide([{ key: 'thr', rect: () => { const r = $('m-pop').parentElement.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }, pad: 10, text: '🕊️ Sürü göstergesindeki <b>kırmızı çizgi</b> eşik: altına inerse koloniler ürüyemez, koruma da yetmeyebilir.' }]); milestone('🪺', 'Doğa bilimci', 'Koloniler küçülüyor. Kuşlar kalabalık olmadan yuva yapmıyor (<i>Allee etkisi</i>). Çizgiye yaklaşıyorsun.', 'warn'); });
    if (h.P > 0 && h.P < THR) once('allee2', () => milestone('⚠️', 'Eşik geçildi', 'Sürü <b>çizginin altına</b> indi. Artık her yıl daha az yavru çıkıyor; tam koruma bile yetmeyebilir.', 'bad'));
    if (game.wildGone === y) toast('🕊️', 'Son yabani kuş', y >= 1898 && y <= 1902 ? 'Ohio\'da bir çocuk son yabani güvercini vurdu. Gökyüzü boş.' : 'Yabani sürü bitti. Geriye yalnız hayvanat bahçesindeki birkaç kuş kaldı.', 'bad', { keep: true });
    if (y === 1900) toast('⚖️', 'ABD Kongresi', '<b>Lacey Yasası</b>: yasa dışı avlanan hayvanı eyaletten eyalete satmak artık federal suç.', '', { keep: true });
    if (y === 1913) toast('⚖️', 'ABD Kongresi', 'Göçmen kuşlar artık federal koruma altında (<b>Weeks–McLean Yasası</b>).', h.P > 0 ? 'good' : '', { keep: true });
    if (y === 1906 && h.P >= THR) toast('🕊️', 'Gazeteler', 'Gökyüzü hâlâ kararıyor: başka ülkelerden doğa bilimciler sürüleri görmeye geliyor.', 'good');
    if (y === 1897 && h.P < THR && h.P > 0) toast('📜', 'Eyalet meclisi', 'Michigan tam av yasağını tartışıyor. Ama kuşlar artık çok az.', '', { keep: true });
    if (game.sat < 25 && !game.replaced) once('warn-sat' + Math.floor(y / 10), () => toast('🏛️', 'Meclis', 'Kasabalar ve tüccarlar şikâyetçi. Meclisin desteği düşüyor.', 'warn'));
    if (game.sat <= 0 && !game.replaced && gs.y >= game.lockUntil && (game.p.nest + game.p.quota + game.p.forest) > 0.4) lobby();
    if (y === M.Y1) { if (h.P >= GOAL) award('guv-gokyuzu'); if (h.F >= 0.6) award('guv-orman'); }
    if (window.SceneUtils && window.SceneUtils.advise) {
      const A = window.SceneUtils.advise;
      if (h.P <= 0) A('Yabani sürü bitti', 'bad');
      else if (h.P < THR) A('Sürü eşiğin altında: her şeyi koru, ama geç olabilir', 'bad');
      else if (game.lockUntil && y < game.lockUntil) A(`Meclis yasakları kısıtladı (${game.lockUntil} yılına kadar): bekçi gönder`, 'bad');
      else if (game.sat < 25) A('Meclis kızgın: yasakları birden değil yavaş artır', 'bad');
      else if (h.reach > 0.1 && game.p.nest < 0.5) A('Demiryolu yayılıyor: yuva yasağını artır');
      else if (game.unlocked.quota && h.killRate > 0.12 && game.p.quota < 0.4) A('Pazar yasağı avı keser: biraz artır');
      else if (game.unlocked.forest && h.F < 0.7 && game.p.forest < 0.3) A('Orman kesiliyor: yemiş azalırsa yuva da azalır');
      else if (h.P < 1) A(`Sürü inceliyor (${popText(h.P)}): kolonilere bekçi gönder`);
      else A(`Gökyüzü kara: ${popText(h.P)} güvercin`, 'good');
    }
    if (y % 10 === 0 && window.SceneUtils && window.SceneUtils.decade) window.SceneUtils.decade(y, ({ 1860: "ABD'de iç savaş başlıyor (1861)", 1870: "Demiryolu kıtayı boydan boya birleştirdi (1869)", 1880: "Ormanlar hızla kesiliyor", 1890: "İlk kuş koruma dernekleri kuruluyor", 1900: "Lacey Yasası: yasa dışı av satışı suç", 1910: "Son kuşlar" })[y]);
    if (gs.y > M.Y1 && game.state === 'play') endGame(); else if (gs.y > M.Y1) game.endAfter = true;
  }
  function lobby() {
    if (game.replaced || game.state === 'choice') return;
    game.lobbies++; const second = game.lobbies === 2, yrs = game.lobbies > 1 ? 8 : 6;
    if (game.lobbies >= 3) { comeOfficial('lobby', 'Sözünü yine tutmadın.'); game.replaced = true; toast('📜', 'Meclis', 'Üçüncü kez yasaklar yüzünden kriz çıktı: görevden alındın.', 'bad'); endGame(); return; }
    comeOfficial('lobby', second ? 'Yine mi siz?' : 'Bu yasaklar bizi batırıyor!');
    choice('Tüccarlar ve meclis', second ? 'Son uyarı: bir daha olmaz' : 'Yasaklar gevşesin!', `"Kasabalar avcılıkla geçiniyor, pazar boş kaldı. ${yrs} yıl boyunca yasakları <b>gevşet</b> (yuva %30, pazar %20, orman %30), yoksa seni görevden alırız."`, [
      { label: 'Tamam, gevşetiyorum', sub: `${yrs} yıl yasaklar sınırlı`, fn: () => { game.lockUntil = gs.y + yrs; readPolicy(); game.sat = 40; game.habit = 0.25; } },
      { label: 'Hayır, yasa kalıyor', sub: 'Görevden alınırsın, oyun biter', fn: () => { game.replaced = true; toast('📜', 'Meclis', 'Görevden alındın. Yerine gelen ilk iş yasakları kaldırdı.', 'bad'); endGame(); } },
    ], 'lobby');
  }
  function endGame() {
    if (game.state === 'end') return;
    game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-guvercin', 'Bitirdi: Milyarlardan Sıfıra');
    maxSeen = slides.length - 1; paintDots(); replayNav();
    const h = gs.hist[gs.hist.length - 1];
    if (!game.replaced && h && h.P === 0) { game.reading = 0; window.Cinema && window.Cinema.play({ id: 'guv-1914', skipIfSeen: wasDone, ...CINE.martha }, () => { if (mode === 'game') goTo(slideOf('result')); }); }
    if (false) toast('🏛️', '1 Eylül 1914', '<b>Martha</b>, türünün son bireyi, Cincinnati Hayvanat Bahçesi\'nde öldü.', 'bad', { keep: true });
    if (!(window.Cinema && !game.replaced && h && h.P === 0 && !(wasDone && window.Cinema.seen('guv-1914')))) setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 3200);
  }
  function renderResult() {
    if (!game.hist.length || (gs.y <= M.Y1 && !game.replaced)) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const hs = game.hist, last = hs[hs.length - 1], n = hs.length, hh = HISTORY.hist.slice(0, n);
    const P = last.P, Pmin = Math.min(...hs.map(h => h.P));
    const score = Math.round(clamp(P / 4.2) * 100);
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'Yasaları savundun, ama kasabalar ve tüccarlar kazandı. Gerçekte de yuva yasağı vardı, ama kimse uygulamadı.'; }
    else if (P >= GOAL) { title = 'Gökyüzü hâlâ kararıyor'; text = `1914'te ${popText(P)} güvercin uçuyor. Erken davrandın, sürüyü eşiğin üstünde tuttun. Martha hiç yalnız kalmadı.`; }
    else if (P > 0) { title = 'Son sürüler'; text = `1914'te ${popText(P)} kuş kaldı. Yaşıyorlar, ama çizginin altındalar: koloniler ürememeye devam ederse sonları yakın.`; }
    else if (game.maxLate > 1.2) { title = 'Çok geçti'; text = `Sonunda yasaları sıkılaştırdın, ama sürü eşiğin altına inmişti. Kuşlar ürüyemedi: son yabani kuş ${yk(game.wildGone)} gitti.`; }
    else { title = 'Martha\'nın yalnızlığı'; text = `Tarih tekrarlandı: milyarlarca kuş elli yılda bitti. Son yabani güvercin ${yk(game.wildGone)} gitti, Martha 1914'te öldü.`; }
    const col = v => v >= GOAL ? 'var(--green)' : v >= THR ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">${game.replaced ? (gs.y - 1) + ' · görevden alındın' : '1914 · görev süren doldu'}</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${window.SceneUtils ? window.SceneUtils.bestLine('guvercin', score, 'kalan sürü', !game.replaced) : ''}
      <div class="rgrid">
        <div><div class="y">Sürü (${game.replaced ? last.y : 1914})</div><div class="v" style="color:${col(P)}">${popText(P)}</div><div class="h">tarihte: ${popText(hh[hh.length - 1].P)}</div></div>
        <div><div class="y">En düşük</div><div class="v" style="color:${col(Pmin)}">${popText(Pmin)}</div><div class="h">eşik: 300 milyon</div></div>
        <div><div class="y">Orman</div><div class="v">%${Math.round(last.F * 100)}</div><div class="h">tarihte: %${Math.round(hh[hh.length - 1].F * 100)}</div></div>
      </div>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return d ? `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>` : ''; }).join('')}</div>` : ''}
      <canvas class="rchart" id="rchart"></canvas>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button><a class="hbtn" href="../../#bolumler">☰ Tüm bölümler</a></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(slideOf('game')); };
    $('r-next').onclick = () => goTo(slideOf('sandbox'));
    requestAnimationFrame(drawResultChart);
  }
  const series = hist => [
    { data: hist.map(d => popBar(d.P)), color: '#6a7fb0', label: 'Sürü', fmt: v => popText(v * v * 4.2) },
    { data: hist.map(d => d.nest), color: '#e0b04a', label: 'Yuva başarısı', fmt: v => '%' + Math.round(v * 100) },
    { data: hist.map(d => d.F), color: '#4f9a7a', label: 'Orman', fmt: v => '%' + Math.round(v * 100) },
  ];
  function drawResultChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('rchart'), [{ data: HISTORY.hist.map(d => popBar(d.P)), color: '#9aa59a', dash: true, label: 'Tarihte sürü', fmt: v => popText(v * v * 4.2) }, ...series(game.hist)], TOTAL, { y0: M.Y0, step: 10 }); }

  // =====================================================================
  // LABORATUVAR
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: M.newState(), p: { nest: 0.1, quota: 0, forest: 0 }, preset: null };
  function readSliders() {
    sb.p.nest = $('p-n').value / 100; sb.p.quota = $('p-q').value / 100; sb.p.forest = $('p-f').value / 100;
    $('o-pn').textContent = '%' + $('p-n').value; $('o-pq').textContent = '%' + $('p-q').value; $('o-pf').textContent = '%' + $('p-f').value;
  }
  ['p-n', 'p-q', 'p-f'].forEach(id => $(id).addEventListener('input', () => { readSliders(); sb.preset = null; document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: null, nest: [100, 0, 0], late: null, all: [90, 70, 60] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset]; sb.preset = b.dataset.preset;
    if (v) ['p-n', 'p-q', 'p-f'].forEach((id, i) => $(id).value = v[i]);
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
    sb.frac += dt / (800 / sb.speed);
    while (sb.frac >= 1) {
      sb.frac -= 1;
      if (sb.st.y > M.Y1) sb.st = M.newState();
      let pp = sb.p;
      if (sb.preset === 'history') pp = M.histP(sb.st.y);
      if (sb.preset === 'late') pp = sb.st.y >= 1885 ? { nest: 1, quota: 1, forest: 1 } : { nest: 0, quota: 0, forest: 0 };
      if (sb.preset === 'history' || sb.preset === 'late') { $('p-n').value = Math.round(pp.nest * 100); $('p-q').value = Math.round(pp.quota * 100); $('p-f').value = Math.round(pp.forest * 100); readSliders(); }
      M.step(sb.st, pp);
      const h = sb.st.hist[sb.st.hist.length - 1]; if (sb.st.P * 1e9 < 40) { sb.st.P = 0; h.P = 0; }
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() { const h = sb.st.hist[sb.st.hist.length - 1]; $('sb-year').textContent = String(h ? h.y : M.Y0); $('sb-harvest').textContent = `Sürü: ${popText(h ? h.P : 4.2)} · orman %${Math.round((h ? h.F : 0.95) * 100)}`; }
  function drawSbChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('sb-chart'), series(sb.st.hist), TOTAL, { y0: M.Y0, step: 10 }); }

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
    const pol = mode === 'sandbox' ? sb.p : game.p;
    if (h) Object.assign(target, { P: h.P, F: h.F, nest: h.nest, kill: h.killRate, reach: h.reach, guard: game.colonyNow && mode === 'game' ? game.guard : 0, n: pol.nest });
    else Object.assign(target, { P: 4.2, F: 0.95, nest: 0.9, kill: 0.06, reach: 0.12, guard: 0, n: 0.3 });
    const k = 1 - Math.pow(0.93, dt / 16);
    for (const key of Object.keys(target)) vis[key] = lerp(vis[key], target[key], k * 0.5);
    if (target.P === 0 && vis.P < 1e-4) vis.P = 0;
    vis.bad = lerp(vis.bad, 1 - smooth(0.1, 3, vis.P), k * 0.5);
    if (view.until && (game.reading || game.state === 'choice')) view.until += dt;
    if (view.until && performance.now() > view.until && !view.user) setView('scene');
    if (mode !== 'game' && view.want === 'map') setView('scene');
    view.k = lerp(view.k, view.want === 'map' ? 1 : 0, 1 - Math.pow(0.9, dt / 16));
    if (window.SceneUtils && window.SceneUtils.fullView) window.SceneUtils.fullView(view.k > 0.5 && mode === 'game');
    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);
    try { render(now, dt); } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } } // çizim hatası döngüyü durdurmasın
    if (mode === 'game') {
      const yy = String(Math.max(M.Y0, Math.min(gs.y - 1, M.Y1))), hh0 = curHist();
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = eraName(Number(yy), hh0 ? hh0.P : 4.2); $('g-date').textContent = yy;
      $('yb-fill').style.width = clamp((gs.hist.length + game.frac) / TOTAL) * 100 + '%';
      const hh = curHist();
      $('g-pop').textContent = '🕊️ ' + popText(hh ? hh.P : 4.2);
      $('m-pop').style.width = popBar(vis.P) * 100 + '%';
      $('m-thr').style.left = popBar(THR) * 100 + '%';
      $('m-nest').style.width = clamp(vis.nest) * 100 + '%';
      $('m-forest').style.width = clamp(vis.F) * 100 + '%';
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
