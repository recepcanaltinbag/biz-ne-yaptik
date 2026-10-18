// Bölüm — Dünyanın Anlaştığı Gün (1974–2060)
(() => {
  'use strict';
  const MISSION = {
    title: 'Dünyanın Anlaştığı Gün · 1974',
    role: 'BM çevre programında baş müzakerecisin. Masada yedi taraf var.',
    control: 'Her yıl <b class="inl">100 puanlık bütçe</b>: 🔬 bilim, 🤝 diplomasi, 1990\'dan sonra 💰 ozon fonu. Konferanslarda anlaşmanın ne kadar sıkı olacağına sen karar verirsin.',
    goal: 'Ozon deliği <b>2060\'a kadar</b> kapanma yoluna girsin.',
    watch: 'CFC havada onlarca yıl kalır: bugün kesilen gaz, deliği ancak yıllar sonra kapatır.',
  };
  const M = window.OzonModel;
  const $ = id => document.getElementById(id);
  const { clamp, smooth, BLOCS } = M;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const f1 = v => v.toFixed(1).replace('.', ',');
  const TOTAL = M.Y1 - M.Y0 + 1;
  const GOAL = 2060;
  const HISTORY = M.run(TOTAL, M.histP);
  const HREC = M.recoveryYear(HISTORY, M.histP(M.Y1));
  const COST = { sci: 1, dip: 1, fund: 1 };
  const bname = (i, y) => BLOCS[i].id === 'ssc' && (y || (gs ? gs.y : 0)) > 1991 ? 'Rusya' : BLOCS[i].name;
  const yk = y => window.SceneUtils ? window.SceneUtils.yilEk(y, 'de') : y + "'de";
  const recText = r => r === null ? 'delik hiç açılmadı' : r >= 9999 ? 'kapanmıyor' : r > 2150 ? '2150 sonrası' : String(r);
  const eraName = y => y < 1985 ? 'Bir uyarı' : y < 1987 ? 'Delik bulundu' : y < 1992 ? 'Masada' : y < 2009 ? 'Söz tutulacak mı?' : 'Uzun bekleyiş';

  // =====================================================================
  // SES
  // =====================================================================
  let AC = null, master, humGain, muted = /[?&](debug|hizli|sessiz)\b/.test(location.search) || (() => { try { return localStorage.getItem('bny-ses') === '0'; } catch (e) { return false; } })();
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(AC.destination);
      const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = AC.createBufferSource(); s.buffer = buf; s.loop = true;
      const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 350;
      humGain = AC.createGain(); humGain.gain.value = 0.02; s.connect(f); f.connect(humGain); humGain.connect(master); s.start();
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
  const gavel = () => { tone(180, 120, 0.12, 0.05, 'square'); setTimeout(() => tone(180, 120, 0.12, 0.04, 'square'), 180); };
  const sign = () => tone(1200, 1600, 0.15, 0.025, 'triangle');
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
    const L = { gt: 0.62, gb: 1, x1: 1 };
    if (m === 'game') {
      const pnl = document.querySelector('.slide.active .gpanel');
      const top = pnl ? pnl.getBoundingClientRect().top : H * 0.56;
      L.gb = clamp((top - 6) / H, 0.4, 0.88); L.gt = Math.max(0.36, L.gb - (mobile ? 0.36 : 0.36));
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') L.gt = 0.82;
    if (m === 'sandbox') { if (mobile) { L.gt = 0.3; L.gb = 0.46; } else { L.gt = 0.58; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.62, gb: 1, x1: 1 };
  const PAL = { bgOk: [230, 238, 236], bgBad: [236, 226, 232], sky: [190, 214, 236], skyBad: [214, 196, 226], ink: [43, 58, 46], floor: [214, 204, 180], table: [140, 100, 70], sand: [236, 222, 186], sea: [96, 150, 190] };
  const vis = { hole: 0, E: 0.7, C: 0.05, uv: 1, signed: 0, p: BLOCS.map(b => b.base), sg: BLOCS.map(() => 0), bad: 0 };
  const target = { hole: 0, E: 0.7, C: 0.05, uv: 1, signed: 0 };
  const bubbles = [], floats = [], pulses = [], puffs = [], o3 = [], mols = [];
  const clouds = Array.from({ length: 3 }, () => ({ x: rnd(0, 1), y: rnd(0.24, 0.34), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000012) }));
  for (let i = 0; i < 90; i++) o3.push({ x: Math.random(), y: Math.random(), ph: rnd(0, 6) });
  const seats = BLOCS.map((b, i) => ({ i, sx: undefined, sy: undefined }));
  const bathers = Array.from({ length: 4 }, (_, i) => ({ f: 0.66 + i * 0.07, ph: rnd(0, 6) }));
  const sci = { sx: undefined }, can = { sx: undefined };
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};

  function geo() {
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H, gh = gb - gt;
    return { x1, gt, gb, gh, ozY: Math.max(70, gt - 52 * U) };
  }
  function drawBubble(bb) {
    const pad = Math.max(8, 10 * U), fs = Math.max(15, 17 * U); // telefonda da okunur (en az 15 px)
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
    const fs = Math.max(mobile ? 12.5 : 11, (o.fs || 13) * U);
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
    const dir = o.dir || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = o.shirt || '#6b8db5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-8, -27, 16, 20, 5) : ctx.rect(-8, -27, 16, 20); ctx.fill();
    ctx.fillStyle = o.skin || '#e9c49d'; ctx.beginPath(); ctx.arc(0, -34, 7, 0, 6.283); ctx.fill();
    if (o.hat) { ctx.fillStyle = o.hat; ctx.beginPath(); ctx.ellipse(0, -39, 11, 2.6, 0, 0, 6.283); ctx.fill(); ctx.fillRect(-5, -45, 10, 6); }
    if (o.glasses) { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-5, -36, 4, 2.5); ctx.fillRect(1, -36, 4, 2.5); }
    else { ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(2.4, -35, 1.1, 0, 6.283); ctx.arc(-2, -35, 1.1, 0, 6.283); ctx.fill(); }
    if (o.mood !== undefined) { ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 1.2; ctx.beginPath(); if (o.mood > 0.5) ctx.arc(0, -32, 3, 0.2, Math.PI - 0.2); else if (o.mood < 0.3) ctx.arc(0, -28.5, 3, Math.PI + 0.3, -0.3); else { ctx.moveTo(-2.5, -30.5); ctx.lineTo(2.5, -30.5); } ctx.stroke(); }
    if (o.arms === 'cross') { ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(6, -15); ctx.moveTo(8, -20); ctx.lineTo(-6, -15); ctx.stroke(); }
    ctx.restore();
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const G = geo(), { x1, gt, gb, gh } = G;
    const bad = smooth(0, 26, vis.hole);
    const sky = ctx.createLinearGradient(0, 0, 0, gt); sky.addColorStop(0, rgb(mixC(PAL.sky, PAL.skyBad, bad))); sky.addColorStop(1, 'rgba(240,244,240,.6)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, x1, gt);
    // güneş ve UV ışınları: ozon inceldikçe ışınlar aşağı iner
    const sunX = x1 * 0.56, sunY = G.ozY - 34 * U;
    ctx.fillStyle = 'rgba(246,210,104,.95)'; ctx.beginPath(); ctx.arc(sunX, sunY, 22 * U, 0, 6.283); ctx.fill();
    for (const cl of clouds) { cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15; const cx = cl.x * x1, cy = cl.y * H, s = 18 * U * cl.s; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283); ctx.fill(); }
    drawOzoneBand(G, t, bad);
    const rays = 5, reach = lerp(G.ozY + 14 * U, gt + gh * 0.5, smooth(0, 1, (vis.uv - 1) / 1.6));
    ctx.strokeStyle = `rgba(150,90,200,${0.25 + 0.5 * bad})`; ctx.lineWidth = 2 * U; ctx.setLineDash([6 * U, 5 * U]); ctx.lineDashOffset = -t * 0.03;
    for (let k = 0; k < rays; k++) { const x = sunX + (k + 1) * x1 * 0.06; ctx.beginPath(); ctx.moveTo(sunX - k * 6 * U, sunY + 18 * U); ctx.lineTo(x, reach); ctx.stroke(); }
    ctx.setLineDash([]);
    // zemin: solda fabrika ve sprey, ortada müzakere masası, sağda plaj
    ctx.fillStyle = rgb(PAL.floor); ctx.fillRect(0, gt, x1, H - gt);
    ctx.fillStyle = rgb(PAL.sand); ctx.fillRect(x1 * 0.64, gt, x1 * 0.36, H - gt);
    ctx.fillStyle = rgb(PAL.sea); ctx.fillRect(x1 * 0.93, gt, x1 * 0.07, H - gt);
    drawFactory(G, t, dt);
    drawTable(G, t);
    drawBeach(G, t);
    drawScientist(G, t);
    drawMols(G, t, dt);
    if (window.SceneUtils && window.SceneUtils.atmo && (mode === 'game' || mode === 'title')) window.SceneUtils.atmo(ctx, G.x1, H, { year: (mode === 'game' ? Math.max(M.Y0, gs.y - 1) : M.Y0 + 40), bad: vis.bad }); // dönem rengi ve kriz
    drawLabels(G);
    drawOfficial(G, t);
    if (view.k > 0.01) drawPole(G, t, dt, view.k);
    if (view.k < 0.5) for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i], k = (t - p.t0) / 2400; if (k > 1) { pulses.splice(i, 1); continue; } const [x, y] = p.getPos(); if (x === undefined) continue; for (let j = 0; j < 2; j++) { const kk = (k * 2 + j * 0.5) % 1; ctx.strokeStyle = p.col; ctx.globalAlpha = (1 - kk) * 0.9; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.arc(x, y, (10 + kk * 40) * U, 0, 6.283); ctx.stroke(); } ctx.globalAlpha = 1; }
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt / 1300; f.y -= dt * 0.025; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = clamp(f.life * 2); ctx.font = `${16 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillStyle = f.col || rgb(PAL.ink); ctx.fillText(f.text, f.x, f.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt / 4200; if (b.life <= 0) { bubbles.splice(i, 1); continue; } drawBubble(b); }
  }
  // ozon tabakası: gökyüzünün üstünde mavi bir şerit; delik büyüdükçe incelir, ortasında boşluk açılır
  function drawOzoneBand(G, t, bad) {
    const y = G.ozY, th = 16 * U * (1 - 0.55 * bad);
    const holeW = G.x1 * 0.3 * bad, hx = G.x1 * 0.62;
    ctx.fillStyle = 'rgba(90,138,208,.35)'; ctx.fillRect(0, y - th, G.x1, th * 2);
    o3.forEach(o => { const x = o.x * G.x1; if (Math.abs(x - hx) < holeW / 2 && o.y > 0.15) return; ctx.fillStyle = 'rgba(70,110,190,.75)'; ctx.beginPath(); ctx.arc(x, y - th + o.y * th * 2 + Math.sin(t * 0.002 + o.ph) * 1.5, 2.2 * U, 0, 6.283); ctx.fill(); });
    if (holeW > 4) { ctx.strokeStyle = 'rgba(150,90,200,.7)'; ctx.setLineDash([4 * U, 4 * U]); ctx.strokeRect(hx - holeW / 2, y - th - 2, holeW, th * 2 + 4); ctx.setLineDash([]); }
    G.band = { y, th, hx, holeW };
  }
  function drawFactory(G, t, dt) {
    const fx = G.x1 * 0.02, fy = G.gt + G.gh * 0.5, s = U;
    ctx.fillStyle = '#9a8a7a'; ctx.fillRect(fx, fy - 46 * s, 70 * s, 46 * s); ctx.fillRect(fx + 50 * s, fy - 76 * s, 12 * s, 32 * s);
    ctx.fillStyle = rgb(PAL.ink); ctx.font = `${10 * U}px "Patrick Hand"`; ctx.fillText('SOĞUTUCU', fx + 6 * s, fy - 20 * s);
    // CFC dumanı: salımla
    if (Math.random() < clamp(vis.E / 1.4) * 0.12 * (dt / 16)) puffs.push({ x: fx + 56 * s, y: fy - 78 * s, r: 6 * s, life: 1 });
    for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.life -= dt / 9000; p.y -= dt * 0.02 * U; p.x += dt * 0.006 * U; p.r += dt * 0.0012; if (p.life <= 0 || p.y < G.ozY) { puffs.splice(i, 1); continue; } ctx.fillStyle = `rgba(180,120,100,${0.35 * p.life})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
    // sprey kutusu (dokunulabilir)
    const cx = fx + 90 * s, cy = fy - 6 * s; can.sx = cx; can.sy = cy - 20 * s;
    ctx.fillStyle = '#c0503a'; ctx.fillRect(cx - 6 * s, cy - 22 * s, 12 * s, 22 * s); ctx.fillStyle = '#8a8a8a'; ctx.fillRect(cx - 3 * s, cy - 27 * s, 6 * s, 5 * s);
  }
  function drawTable(G, t) {
    const tx0 = G.x1 * (mobile ? 0.06 : 0.22), tx1 = G.x1 * (mobile ? 0.7 : 0.62), ty = G.gt + G.gh * 0.62, n = BLOCS.length;
    // masa arkasında delegeler
    BLOCS.forEach((b, i) => {
      const x = lerp(tx0, tx1, (i + 0.5) / n), y = ty - 4 * U, p = vis.p[i], signedY = vis.sg[i];
      seats[i].sx = x; seats[i].sy = y - 50 * U;
      person(x, y, U * (mobile ? 0.8 : 1), { shirt: b.col, mood: p, arms: !signedY && p < 0.3 ? 'cross' : null, skin: i === 4 || i === 5 ? '#d8a878' : '#e9c49d' });
      // ikna çubuğu ve imza
      const bw = (mobile ? 32 : 26) * U, bh = (mobile ? 8 : 5) * U, by = y - 66 * U;
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x - bw / 2, by, bw, bh); ctx.fillStyle = p >= 0.45 ? '#4f9a7a' : p >= 0.3 ? '#e0b04a' : '#c0503a'; ctx.fillRect(x - bw / 2, by, bw * clamp(p), bh);
      ctx.fillStyle = '#c0302a'; ctx.fillRect(x - bw / 2 + bw * 0.45 - 1, by - 2 * U, 2.5, bh + 4 * U);
      if (signedY) { ctx.font = `${14 * U}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('✍️', x + 14 * U, y - 20 * U); ctx.textAlign = 'left'; }
    });
    ctx.fillStyle = rgb(PAL.table); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(tx0 - 10 * U, ty - 6 * U, tx1 - tx0 + 20 * U, 16 * U, 6 * U) : ctx.rect(tx0 - 10 * U, ty - 6 * U, tx1 - tx0 + 20 * U, 16 * U); ctx.fill();
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(tx0, ty + 10 * U, 6 * U, 24 * U); ctx.fillRect(tx1 - 6 * U, ty + 10 * U, 6 * U, 24 * U);
    BLOCS.forEach((b, i) => { const x = lerp(tx0, tx1, (i + 0.5) / n); ctx.fillStyle = '#fff'; ctx.fillRect(x - 14 * U, ty - 4 * U, 28 * U, 10 * U); ctx.fillStyle = rgb(PAL.ink); ctx.font = `${8 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText(bname(i).split(' ')[0], x, ty + 4 * U); ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillRect(x - 6 * U, ty - 12 * U, 12 * U, 8 * U); });
    G.table = { tx0, tx1, ty };
  }
  function drawBeach(G, t) {
    const uvBad = smooth(1.15, 2.2, vis.uv);
    bathers.forEach((b, i) => {
      const x = G.x1 * b.f, y = G.gt + G.gh * (0.55 + (i % 2) * 0.2); b.sx = x; b.sy = y - 44 * U;
      person(x, y, U * (mobile ? 0.75 : 0.9), { shirt: ['#e0b04a', '#7aa7d6', '#c0503a', '#8ac08a'][i], skin: mixC([233, 196, 157], [226, 120, 100], uvBad).reduce((s, v, k) => s + (k ? ',' : 'rgb(') + v, '') + ')', hat: uvBad > 0.3 ? '#e8dcc0' : null, glasses: uvBad > 0.5 });
    });
    tag(G.x1 * 0.8, G.gt + G.gh * 0.3, `☀️ UV indeksi: ${Math.round(4 + vis.uv * 3)}`, { fs: mobile ? 11 : 12, color: vis.uv > 1.6 ? '#a0402a' : undefined });
  }
  function drawScientist(G, t) {
    if (!(G.gh > 40)) return;
    const x = G.x1 * (mobile ? 0.06 : 0.14), y = G.gt + G.gh * 0.86; sci.sx = x; sci.sy = y - 46 * U;
    person(x, y, U * (mobile ? 0.8 : 0.95), { shirt: '#f4f2ea', glasses: false, mood: 0.6 });
    ctx.fillStyle = '#6a7a8a'; ctx.fillRect(x + 12 * U, y - 30 * U, 18 * U, 30 * U); ctx.fillStyle = '#8ad0a0'; ctx.fillRect(x + 15 * U, y - 26 * U, 12 * U, 8 * U); // ölçüm cihazı
  }
  // dokunulan sprey: bir CFC molekülü yıllarca yükselir, ozona varınca klor binlerce ozonu yer
  function drawMols(G, t, dt) {
    for (let i = mols.length - 1; i >= 0; i--) {
      const m = mols[i]; m.k += dt / 9000;
      const y = lerp(m.y0, G.ozY, smooth(0, 1, Math.min(1, m.k))), x = m.x0 + Math.sin(m.k * 8) * 12 * U;
      if (m.k < 1) { ctx.fillStyle = '#c0503a'; ctx.beginPath(); ctx.arc(x, y, 4 * U, 0, 6.283); ctx.fill(); ctx.fillStyle = '#7ac070'; ctx.beginPath(); ctx.arc(x + 4 * U, y - 3 * U, 2.5 * U, 0, 6.283); ctx.arc(x - 4 * U, y - 3 * U, 2.5 * U, 0, 6.283); ctx.fill(); }
      else { if (!m.done) { m.done = 1; floats.push({ x, y: G.ozY + 30 * U, text: 'Tek bir klor atomu binlerce ozonu yıkar!', life: 2, col: '#7a4aa0' }); award('ozon-klor'); } if (m.k > 2) mols.splice(i, 1); }
      if (m.k < 1) tag(x, y - 8 * U, `CFC yükseliyor: ${Math.round(m.k * 5)}. yıl`, { fs: 11 });
    }
  }
  function drawLabels(G) {
    if (mode !== 'game' && mode !== 'sandbox') return;
    const h = curHist(); if (!h) return;
    const fs = mobile ? 11 : 13;
    if (G.band) tag(G.band.hx, G.band.y + G.band.th + 22 * U, h.hole > 0.5 ? `🛡️ Ozon tabakası · Antarktika'da delik: ${f1(h.hole)} milyon km²` : '🛡️ Ozon tabakası: UV ışınlarını süzer', { fs, color: h.hole > 15 ? '#7a3a9a' : undefined });
    if (G.table && mode === 'game') tag((G.table.tx0 + G.table.tx1) / 2, G.table.ty + 44 * U, `✍️ İmzalayan: ${h.signed}/7 · kırmızı çizgi: imza eşiği`, { fs: fs - 1 });
  }
  // kutup görünümü: Antarktika yukarıdan; delik her baharda açılır
  const view = { want: 'scene', k: 0, until: 0, user: false };
  function setView(v, ms) { view.want = v; view.user = !ms; view.until = ms ? performance.now() + ms : 0; const b = $('g-view'); if (b) b.textContent = v === 'pole' ? '🤝 Masa' : '🌍 Kutup'; }
  const peng = { sx: undefined };
  function drawPole(G, t, dt, alpha) {
    const top = (window.SceneUtils && window.SceneUtils.viewTop ? window.SceneUtils.viewTop(180 * U) : 180 * U), H2 = Math.max(80, G.gb - top), cx = G.x1 / 2, cy = top + H2 * 0.48, R0 = Math.min(G.x1 * 0.42, H2 * 0.46);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#d6e2ec'; ctx.fillRect(0, 0, G.x1, H);
    ctx.fillStyle = '#3a6aa0'; ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 6.283); ctx.fill();
    // Antarktika
    ctx.fillStyle = '#f2f4f6'; ctx.beginPath();
    for (let a = 0; a < 6.283; a += 0.25) { const r = R0 * 0.32 * (1 + 0.18 * Math.sin(a * 3 + 1) + 0.1 * Math.cos(a * 5)); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill();
    // ozon: renkli halka, delik mor; mevsimle nefes alır
    const season = 0.75 + 0.25 * Math.sin(t * 0.0015);
    const hr = R0 * 0.32 * Math.sqrt(clamp(vis.hole / 14)) * season; // Antarktika ~14 milyon km²
    const gr = ctx.createRadialGradient(cx, cy, hr * 0.4, cx, cy, Math.max(hr * 1.5, 1));
    gr.addColorStop(0, 'rgba(130,60,170,.75)'); gr.addColorStop(0.6, 'rgba(150,90,200,.45)'); gr.addColorStop(1, 'rgba(150,90,200,0)');
    if (hr > 1) { ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, hr * 1.5, 0, 6.283); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,200,255,.35)'; ctx.lineWidth = 6 * U; ctx.beginPath(); ctx.arc(cx, cy, R0 * 0.85, 0, 6.283); ctx.stroke();
    // penguen (dokunulabilir)
    const px = cx + R0 * 0.2, py = cy + R0 * 0.08; peng.sx = px; peng.sy = py - 10 * U;
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(px, py, 5 * U, 8 * U, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(px, py + 1 * U, 3 * U, 6 * U, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.arc(px, py - 5 * U, 1.5 * U, 0, 6.283); ctx.fill();
    const h = curHist();
    tag(cx, cy - R0 - 8 * U, h && h.hole > 0.5 ? `🌍 Güney Kutbu, ilkbahar · ozon deliği ${f1(h.hole)} milyon km² (Antarktika'nın ${f1(h.hole / 14)} katı)` : '🌍 Güney Kutbu, ilkbahar · ozon tabakası sağlam', { fs: 13, color: '#16233a' });
    tag(cx, cy + R0 + 26 * U, 'Dokun: masaya dön', { fs: 12 });
    ctx.restore();
  }

  // =====================================================================
  // KONUŞMALAR
  // =====================================================================
  const SAY = {
    abd: ['Sanayimiz\nhazır mı?', 'Kongre ikna\nolmalı.', 'Bilim net:\nimzalarız.'],
    avr: ['Sprey kutusu\nişsiz bırakır!', 'Önce kanıt\nisteriz.', 'Tamam, bu iş\nciddi.'],
    jap: ['Elektronik sanayimiz\nCFC ile temizleniyor.', 'Alternatif\nbulunursa...', 'Biz de\nvarız.'],
    ssc: ['Planımızda\nyok bu.', 'Ekonomi zor\ndurumda.', 'Peki, imza.'],
    cin: ['Herkese buzdolabı\nsözü verdik!', 'Sizin kirliliğinizi\nbiz mi ödeyeceğiz?', 'Fon gelirse\nbaşlarız.'],
    hin: ['Önce zengin ülkeler\nkessin.', 'Teknolojiyi\npaylaşın.', 'Fon adil\nolmalı.'],
    gel: ['Biz az kullandık,\nsiz çok.', 'Yardım olmadan\nnasıl?', 'Bütün dünya\nbir arada!'],
    bather: ['Güneş bugün\nyakıyor!', 'Şapkasız\nçıkmam.', 'UV indeksi\nkaç bugün?'],
    sci: ['CFC havada\n50–100 yıl kalır.', 'Klor atomu ozonu\ntekrar tekrar yıkar.', 'Ölçmeye devam!\nKaçak olursa görürüz.'],
    can: ['Pssst! Saç spreyi\nhem de CFC\'li.', 'Beni sıkma,\nozona gidiyorum.'],
    peng: ['Burada bahar\nbaşka türlü geliyor.', 'Güneş gözlüğü\nyakışır mı?'],
    official: ['Kararınızı\nbekliyoruz.', 'Delegeler\ntoplandı.'],
  };
  function talkAt(x, y) {
    if (view.k > 0.5) { if (peng.sx !== undefined && Math.hypot(x - peng.sx, y - peng.sy) < 30 * U) { sayAt({ x: peng.sx, y: peng.sy }, pick(SAY.peng)); award('ozon-penguen'); return true; } setView('scene'); return true; }
    const c = [], add = (sx, sy, kind, fn) => { if (sx !== undefined && !isNaN(sy)) c.push({ d: Math.hypot(sx - x, sy - y), kind, fn, obj: { x: sx, y: sy } }); };
    seats.forEach((s, i) => add(s.sx, s.sy, BLOCS[i].id));
    bathers.forEach(b => add(b.sx, b.sy, 'bather', () => { if (vis.uv > 1.5 && tapCount('bath') >= 3) award('ozon-sapka'); }));
    add(sci.sx, sci.sy, 'sci', () => { if (tapCount('sci') >= 3) award('ozon-molina'); });
    add(can.sx, can.sy, 'can', () => { if (mols.length < 2) mols.push({ x0: can.sx, y0: can.sy, k: 0 }); });
    if (official && official.x) add(official.x, official.y, 'official');
    if (!c.length) return false;
    c.sort((a, b) => a.d - b.d);
    sayAt(c[0].obj, pick(SAY[c[0].kind] || ['...'])); blip(); if (c[0].fn) c[0].fn(); if (window.Camera) window.Camera.focus(c[0].obj.x, c[0].obj.y + 30 * U); // dokunulan yere yakınlaş
    return true;
  }
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || bubbles.length || view.k > 0.5) return;
    if (!nextChat) nextChat = t + 8000;
    if (t < nextChat) return;
    nextChat = t + rnd(10000, 17000);
    const i = Math.floor(Math.random() * BLOCS.length), s = seats[i];
    if (s.sx !== undefined) sayAt({ get x() { return s.sx; }, get y() { return s.sy; } }, pick(SAY[BLOCS[i].id]));
  }

  let official = null;
  function drawBody(g, who, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = who === 'ind' ? '#4a5866' : who === 'sci' ? '#f4f2ea' : '#3a6a9a'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = who === 'tolba' ? '#c89870' : '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    if (who === 'tolba') { g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill(); g.fillStyle = '#2a2a2a'; g.fillRect(-5, -38, 4, 2); g.fillRect(1, -38, 4, 2); } // gri saç, gözlük
    else if (who === 'ind') { g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill(); g.fillStyle = '#c0503a'; g.beginPath(); g.moveTo(-2, -30); g.lineTo(2, -30); g.lineTo(0, -18); g.fill(); }
    else { g.fillStyle = '#6a4a30'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill(); }
    if (who !== 'tolba') { g.fillStyle = rgb(PAL.ink); g.beginPath(); g.arc(-2.6, -37, 1.2, 0, 6.283); g.arc(2.6, -37, 1.2, 0, 6.283); g.fill(); }
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
    const stopX = G.x1 * (mobile ? 0.5 : 0.66), startX = G.x1 + 40;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    const leaving = official.leave && now > official.leave;
    if (leaving) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = G.gt + G.gh * 0.8, s = 1.1 * U, walk = e < 1500 || leaving;
    official.x = x; official.y = y - 52 * U;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (leaving ? 1 : -1), s); drawBody(ctx, official.who, walk ? Math.sin(t * 0.02) * 4 : 0); ctx.restore();
    const text = official.reply || (e > 1300 ? official.say : null);
    if (text && official.lastText !== text) { official.lastText = text; sayAt(official, text); }
  }

  // =====================================================================
  // SLAYTLAR
  // =====================================================================
  const slides = [...document.querySelectorAll('.slide')];
  let cur = 0, maxSeen = 0, mode = 'title';
  const DONE_KEY = 'bny-bitti-ozon';
  const wasDone = (() => { try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; } })();
  // tarih filminden sonra görev kartı: tarihte ne oldu + senin rolün, kontrolün, hedefin (oyuncu başlarken tek kart)
  function missionCard(ic, fr, tx, tone, o) {
    const m = document.getElementById('modal');
    if (!window.Mission || !m || typeof MISSION === 'undefined') return showToast(ic, fr, tx, tone, o);
    const hist = String(tx).split(/<b>Hedefin/)[0].trim().replace(/^Tarihte /, '').replace(/^./, c => c.toLocaleUpperCase('tr'));
    game.reading = (game.reading || 0) + 1;
    window.Mission.show(m, { ...MISSION, hist }, () => { game.reading = Math.max(0, game.reading - 1); window.__quietUntil = performance.now() + 10000 / (typeof FAST === 'number' ? FAST : 1); /* ilk 10 sn sahne konuşsun, yazı yok */ if (o && o.then) o.then(); if (MISSION.watch && window.SceneUtils && window.SceneUtils.ticker) setTimeout(() => window.SceneUtils.ticker('👀', 'Dikkat', MISSION.watch, '', 7000), 6000 / (typeof FAST === 'number' ? FAST : 1)); });
  }
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
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-ozon', 'Başladı: Dünyanın Anlaştığı Gün'); enterGame(); }
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
    if (visible >= (mobile ? 1 : 2) || (k < 0 && (performance.now() - lastToastAt < 13000 / FAST / Math.sqrt(game.speed || 1) || (window.__quietUntil && performance.now() < window.__quietUntil)))) return;
    const next = toastQueue.splice(k >= 0 ? k : 0, 1)[0];
    lastToastAt = performance.now();
    showToast(...next);
  }
  setInterval(pumpToasts, 300);
  function showToast(ic, from, text, tone = '', opt = {}) {
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
  const YEAR = 2900 / FAST;
  let gs = M.newState();
  const game = {};
  const SL = { sci: $('g-sci'), dip: $('g-dip'), fund: $('g-fund') };
  const award = id => (window.Badges ? window.Badges.award(id) : false);
  const choiceQ = [];
  const curHist = () => { if (RPI !== null && mode === 'game') return HISTORY.hist[RPI]; const s = mode === 'sandbox' ? sb.st : gs; return s.hist.length ? s.hist[s.hist.length - 1] : null; };

  function makeWorld() {
    const cheats = []; while (cheats.length < 2) { const y = 1996 + Math.floor(Math.random() * 28); if (cheats.every(x => Math.abs(x - y) > 6) && Math.abs(y - 2009) > 1) cheats.push(y); }
    const slides0 = []; while (slides0.length < 2) { const y = 1993 + Math.floor(Math.random() * 22); if (slides0.every(x => Math.abs(x.y - y) > 5) && !cheats.includes(y) && Math.abs(y - 2009) > 1) slides0.push({ y, i: Math.floor(Math.random() * BLOCS.length) }); }
    return { cheats, slides: slides0 };
  }
  function resetGame() {
    gs = M.newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, fired: new Set(), hist: [], speed: 1, touched: false, reading: 0, story: false, endAfter: false,
      p: { sci: 0.3, dip: 0.3, fund: 0 }, S: 0.5, used: 60, unlocked: { sci: true, dip: true, fund: false }, moved: {},
      world: makeWorld(), hcfc: 0, cheatOn: 0, cheatSince: 0, caughtFast: 0, caughtTotal: 0, rec: null, choices: {},
    });
    SL.sci.value = 30; SL.dip.value = 30; SL.fund.value = 0; SL.fund.disabled = true;
    $('w-fund').classList.add('locked'); $('o-fund').textContent = "🔒 1990'da açılır";
    document.querySelectorAll('.coach').forEach(uncoach);
    readPolicy();
    $('g-pause').textContent = '❚❚ Durdur'; setSpeed(1);
    $('modal').hidden = true; $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone'); $('g-rec').textContent = ''; if (window.SceneUtils && window.SceneUtils.advise) window.SceneUtils.advise('Önce kanıt lazım: bilime puan ayır');
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {}; if (window.SceneUtils && window.SceneUtils.decadeReset) window.SceneUtils.decadeReset();
    choiceQ.length = 0; official = null; mols.length = 0; puffs.length = 0; setView('scene');
  }
  // ortak bütçe: 100 puan; aşan kaydırıcı sığdığı kadar kalır
  function readPolicy(moved) {
    const pts = k => Number(SL[k].value) * COST[k];
    let used = Object.keys(SL).reduce((a, k) => a + (game.unlocked[k] ? pts(k) : 0), 0);
    if (used > 100 && moved) { const others = used - pts(moved); SL[moved].value = Math.max(0, Math.floor((100 - others) / COST[moved] / 5) * 5); used = others + pts(moved); floats.push({ x: W / 2, y: lay.gb * H - 20, text: 'Bütçe doldu: başka araçtan puan çek', life: 1.4, col: '#a0402a' }); }
    ['sci', 'dip', 'fund'].forEach(k => { game.p[k] = game.unlocked[k] ? SL[k].value / 100 : 0; if (game.unlocked[k]) $('o-' + k).textContent = Math.round(pts(k)) + ' puan'; });
    $('b-sci').style.width = pts('sci') + '%'; $('b-dip').style.width = pts('dip') + '%'; $('b-fund').style.width = (game.unlocked.fund ? pts('fund') : 0) + '%';
    $('g-budget').textContent = Math.max(0, Math.round(100 - used)) + ' puan boşta';
    game.used = used;
  }
  const arrowTxt = (a, b, f, upGood) => { const better = upGood ? b > a : b < a, same = Math.abs(b - a) < 1e-9 || f(a) === f(b); return `${f(a)} → <b class="${same ? '' : better ? 'up' : 'down'}">${f(b)}</b>`; };
  function simOz(pol) {
    const st = JSON.parse(JSON.stringify(gs));
    const P = { ...pol, S: game.S, cheat: 0, hcfc: game.hcfc ? 1 : 0 };
    const rec = M.recoveryYear(st, P);
    const s5 = JSON.parse(JSON.stringify(gs)); for (let i = 0; i < 5 && s5.y <= M.Y1; i++) M.step(s5, P);
    return { rec: rec === null ? 0 : rec, signed: s5.sign.filter(Boolean).length };
  }
  if (window.SceneUtils && window.SceneUtils.watchSliders) window.SceneUtils.watchSliders(Object.values(SL), () => game.p, (a, b) => {
    if (mode !== 'game' || !gs.hist.length) return null;
    const A = simOz(a), B = simOz(b);
    const yr = v => v >= 9999 ? 'kapanmıyor' : v > 2150 ? '2150+' : v ? String(v) : '—';
    return { html: `▶ <span class="k">kapanış tahmini</span> ${arrowTxt(A.rec || 9999, B.rec || 9999, yr, false)} · <span class="k">5 yıl sonra imza</span> ${arrowTxt(A.signed, B.signed, v => v + '/7', true)}` };
  });
  Object.entries(SL).forEach(([k, el]) => el.addEventListener('input', () => { initAudio(); game.moved[k] = 1; readPolicy(k); if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); } }));
  $('g-pause').onclick = () => { game.paused = !game.paused; $('g-pause').textContent = game.paused ? '▶ Devam' : '❚❚ Durdur'; };
  $('g-view').onclick = e => { e.stopPropagation(); initAudio(); setView(view.want === 'pole' ? 'scene' : 'pole'); };
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
  function guide(steps, then) {
    if (!window.SceneUtils || !window.SceneUtils.tour || wasDone) { if (then) then(); return; }
    game.reading = (game.reading || 0) + 1;
    window.SceneUtils.tour(steps, () => { game.reading = Math.max(0, game.reading - 1); if (then) then(); });
  }
  // sinematik sahne: oyun durur, atlanabilir; bölümü bitiren tekrar oynarken atlanır
  function cine(spec, then) {
    if (!window.Cinema) { if (then) then(); return; }
    if (game.speed > 1) setSpeed(1);
    game.reading = (game.reading || 0) + 1;
    window.Cinema.play({ skipIfSeen: wasDone, ...spec }, () => { game.reading = Math.max(0, game.reading - 1); if (then) then(); });
  }
  const CINE = {
    // açılış: CFC ve 1974 uyarısı (kodla çizilir)
    intro: { id: 'ozon-1974', year: '1974', title: 'Gökyüzünde görünmez kalkan', shots: [
      { bg: '#cfe2ee', text: 'Spreyde, buzdolabında CFC gazı var. Herkes zararsız sanıyor.', draw: (g, t, W, H, k) => {
        const s = Math.min(W, H) / 600; g.fillStyle = '#9ab878'; g.fillRect(0, H * 0.82, W, H);
        const cx = W * 0.3, cy = H * 0.74; g.fillStyle = '#c0503a'; g.fillRect(cx - 18 * s, cy - 70 * s, 36 * s, 80 * s); g.fillStyle = '#8a8a8a'; g.fillRect(cx - 8 * s, cy - 84 * s, 16 * s, 14 * s);
        g.fillStyle = '#e8eef0'; g.fillRect(W * 0.62, H * 0.42, W * 0.12, H * 0.4); g.strokeStyle = '#9aa'; g.lineWidth = 2 * s; g.strokeRect(W * 0.62, H * 0.42, W * 0.12, H * 0.4); g.beginPath(); g.moveTo(W * 0.62, H * 0.56); g.lineTo(W * 0.74, H * 0.56); g.stroke();
        for (let i = 0; i < 26; i++) { const ph = ((t * 0.00025 + i * 0.13) % 1), x = (i % 2 ? cx + 10 * s : W * 0.68) + Math.sin(ph * 9 + i) * 30 * s, y = (i % 2 ? cy - 84 * s : H * 0.42) - ph * H * 0.55; g.globalAlpha = 1 - ph; g.fillStyle = '#7a8a9a'; g.beginPath(); g.arc(x, y, (4 + 3 * ph) * s, 0, 6.28); g.fill(); }
        g.globalAlpha = 1; } },
      { bg: '#14203a', text: '1974: Molina ve Rowland uyardı: bu gaz yükselip ozonu yer.', draw: (g, t, W, H, k) => {
        const s = Math.min(W, H) / 600, bandY = H * 0.16, n = 60; g.fillStyle = '#2a5a7a'; g.fillRect(0, H * 0.86, W, H);
        for (let i = 0; i < n; i++) { const x = (i + 0.5) * W / n, gone = ((i * 37) % 100) / 100 < k * 0.7 && Math.abs(i - n / 2) < n * 0.3; g.fillStyle = gone ? 'rgba(120,180,220,.15)' : 'rgba(120,200,240,.75)'; g.fillRect(x - W / n / 2 + 1, bandY, W / n - 2, H * 0.07); }
        g.font = `${18 * s}px "Patrick Hand", sans-serif`; g.textAlign = 'left'; g.fillStyle = 'rgba(200,230,250,.9)'; g.fillText('ozon tabakası', 16 * s, bandY - 10 * s);
        for (let i = 0; i < 30; i++) { const ph = ((t * 0.00018 + i * 0.071) % 1), x = W * (0.2 + ((i * 53) % 60) / 100), y = H * 0.84 - ph * (H * 0.84 - bandY - H * 0.07); g.fillStyle = '#c8a050'; g.beginPath(); g.arc(x, y, 4 * s, 0, 6.28); g.fill(); } } },
      { bg: '#1e2a40', text: 'Ozon, Güneş\'in zararlı UV ışınını tutan kalkan. Sanayi: "bilim kurgu".', draw: (g, t, W, H, k) => {
        const s = Math.min(W, H) / 600; g.fillStyle = '#f0c040'; g.beginPath(); g.arc(W * 0.5, 0, 70 * s, 0, 6.28); g.fill();
        g.fillStyle = 'rgba(120,200,240,.6)'; g.fillRect(0, H * 0.3, W * 0.42, H * 0.06); g.fillRect(W * 0.58, H * 0.3, W * 0.42, H * 0.06);
        g.strokeStyle = 'rgba(240,190,60,.85)'; g.lineWidth = 3 * s; for (let i = 0; i < 9; i++) { const x = W * (0.1 + i * 0.1), pass = x > W * 0.42 && x < W * 0.58, y1 = pass ? H * 0.95 : H * 0.3, ph = (t * 0.002 + i) % 1; g.setLineDash([12 * s, 10 * s]); g.lineDashOffset = -ph * 44 * s; g.beginPath(); g.moveTo(W * 0.5 + (x - W * 0.5) * 0.2, 60 * s); g.lineTo(x, y1); g.stroke(); }
        g.setLineDash([]); g.fillStyle = '#9ab878'; g.fillRect(0, H * 0.9, W, H); } },
    ] },
    hole: { id: 'ozon-1985', year: '1985', title: 'Halley İstasyonu, Antarktika', credit: 'NASA, kamu malı', shots: [
      { dur: 4600, bg: '#0e1a2e', text: 'Antarktika. İngiliz araştırmacılar 1957\'den beri her gün gökyüzündeki ozonu ölçüyor.', draw: (g, t, W, H, k) => {
        g.fillStyle = '#e8eef4'; g.fillRect(0, H * 0.68, W, H); g.fillStyle = '#c9d6e2'; g.beginPath(); g.moveTo(0, H * 0.7); for (let x = 0; x <= W; x += 40) g.lineTo(x, H * 0.68 + Math.sin(x * 0.02) * 8); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        g.fillStyle = '#c0503a'; g.fillRect(W * 0.62, H * 0.56, W * 0.12, H * 0.12); g.fillStyle = '#8a3a2a'; g.fillRect(W * 0.6, H * 0.54, W * 0.16, H * 0.03);
        const x = W * 0.45, y = H * 0.68; g.fillStyle = '#e07a3a'; g.fillRect(x - 10, y - 46, 20, 30); g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(x, y - 54, 9, 0, 6.28); g.fill();
        g.fillStyle = '#556'; g.fillRect(x + 16, y - 40, 26, 22); g.strokeStyle = '#334'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 29, y - 40); g.lineTo(x + 36 + Math.sin(t * 0.002) * 4, y - 70); g.stroke();
        for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect((i * 137 + t * 0.03) % W, (i * 71 + t * 0.06) % (H * 0.68), 2, 2); } } },
      { dur: 4800, bg: '#f4ecd8', text: 'Her ilkbahar ozon biraz daha az. 1984\'te ekim ayındaki ozonun üçte biri gitmiş.', draw: (g, t, W, H, k) => {
        const x0 = W * 0.14, x1 = W * 0.86, y0 = H * 0.25, y1 = H * 0.72; g.strokeStyle = '#3a3a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x1, y1); g.stroke();
        g.font = `${Math.max(12, H * 0.025)}px "Patrick Hand"`; g.fillStyle = '#3a3a3a'; g.fillText('1957', x0, y1 + H * 0.04); g.fillText('1984', x1 - 30, y1 + H * 0.04); g.fillText('ozon', x0 - 10, y0 - 10);
        const n = 28, m = Math.floor(n * Math.min(1, k * 1.3)); g.strokeStyle = '#3a6ab0'; g.lineWidth = 4; g.beginPath();
        for (let i = 0; i <= m; i++) { const f = i / n, v = 1 - (f < 0.6 ? 0.05 * f : 0.03 + 0.55 * Math.pow((f - 0.6) / 0.4, 1.6)) + Math.sin(i * 2.1) * 0.02; const X = x0 + (x1 - x0) * f, Y = y0 + (y1 - y0) * (1 - v) * 0.9 + 10; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); } },
      { img: '../../assets/img/cards/hole-in-the-ozone-layer-over-antarctica-gpn-2002-000117.jpg', kb: [0.5, 0.5, 1.0, 0.5, 0.48, 1.35], dur: 5000, text: 'Uydudan bakınca: Antarktika\'nın üstünde her baharda açılan bir delik.' },
    ] },
    sign: { id: 'ozon-1987', year: '1987', title: 'Montreal', shots: [
      { dur: 4200, bg: '#2a2622', text: 'Montreal, eylül 1987. Ülkeler ilk kez gökyüzü için aynı masada.', draw: (g, t, W, H, k) => {
        const pan = -k * W * 0.15; g.translate(pan, 0);
        const cols = BLOCS.map(b => b.col); for (let i = 0; i < 7; i++) { const x = W * (0.18 + i * 0.12); g.strokeStyle = '#8a7a6a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, H * 0.2); g.lineTo(x, H * 0.52); g.stroke(); g.fillStyle = cols[i]; g.fillRect(x, H * 0.2 + Math.sin(t * 0.002 + i) * 3, W * 0.07, H * 0.08); }
        g.fillStyle = '#6a4a30'; g.fillRect(W * 0.08, H * 0.62, W * 1.0, H * 0.06);
        for (let i = 0; i < 7; i++) { const x = W * (0.16 + i * 0.12); g.fillStyle = cols[i]; g.fillRect(x - 12, H * 0.52, 24, H * 0.1); g.fillStyle = '#e9c49d'; g.beginPath(); g.arc(x, H * 0.5, 11, 0, 6.28); g.fill(); } } },
      { dur: 4400, bg: '#f4ecd8', text: 'Bir imza. Etkisini görmek onlarca yıl sürecek.', draw: (g, t, W, H, k) => {
        g.fillStyle = '#fffaf0'; g.fillRect(W * 0.2, H * 0.18, W * 0.6, H * 0.64); g.strokeStyle = '#ccc4b0'; g.lineWidth = 1; for (let y = H * 0.26; y < H * 0.6; y += H * 0.04) { g.beginPath(); g.moveTo(W * 0.26, y); g.lineTo(W * 0.74, y); g.stroke(); }
        g.font = `${Math.max(14, H * 0.035)}px "Patrick Hand"`; g.fillStyle = '#3a3a3a'; g.fillText('MONTREAL PROTOKOLÜ', W * 0.34, H * 0.24);
        const m = Math.floor(60 * Math.min(1, k * 1.4)); g.strokeStyle = '#1a2a6a'; g.lineWidth = 3; g.beginPath(); let px = 0, py = 0;
        for (let i = 0; i <= m; i++) { const f = i / 60; px = W * (0.4 + 0.25 * f); py = H * 0.7 + Math.sin(f * 18) * H * 0.025 * (1 - f * 0.5); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
        g.fillStyle = '#2a2a2a'; g.save(); g.translate(px, py); g.rotate(-0.7); g.fillRect(-3, -60, 6, 60); g.restore(); } },
    ] },
  };

  const STORY = [
    ['🤝', 'Masada yedi taraf', 'Delegelerin başındaki çubuk <b>ikna</b>. Kırmızı çizgiyi geçen, anlaşma açılınca imzalar.', '', { pause: false, ms: 7000 }],
  ];
  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (game.started) return;
    game.started = true; game.story = true; // görev kartı kapanana kadar zaman durur
    const show = i => {
      if (mode !== 'game') return;
      if (i >= STORY.length) { game.story = false; return; }
      const [ic, from, text, tone, opt0] = STORY[i];
      const opt = wasDone ? { ...opt0, pause: false, ms: 6000 } : i < 2 ? { ...opt0, pause: true } : opt0; // ilk iki kart 'Devam →' ile okunur (görevi anlamak için)
      if (i === 1) { guide([
        { key: 'table', rect: () => { const G = geo(); return G.table ? [G.table.tx0 - 20 * U, G.table.ty - 80 * U, G.table.tx1 - G.table.tx0 + 40 * U, 100 * U] : [0, 0, 0, 0]; }, text: '🤝 Her delegenin başındaki çubuk <b>ikna</b>. Kırmızı çizgiyi geçen, anlaşma açılınca imzalar.' },
        { el: '#g-adv', text: '💡 Burada her yıl <b>şimdi ne yapman gerektiği</b> yazar.' },
        { el: '#w-sci', text: '🔬 Önce <b>bilim</b>: kanıt olmadan kimse ikna olmaz. Kaydırıcıyı oynatınca ne olacağını hemen görürsün.' },
      ], () => show(i + 1)); return; }
      toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
      if (!opt.pause) setTimeout(() => show(i + 1), 4500 / Math.max(1, FAST / 2));
    };
    const start = () => { if (wasDone) game.story = false; setTimeout(() => cine(CINE.intro, () => histFilm(() => show(0))), 300); };
    start(); // görev kartı yok: hedef, tarih filmi bitince 'şimdi sen' kartında
  }
  // 📼 önce tarih: tarihteki ayarlarla hızlı film (ortak modül), sonra 'şimdi sen' kartı; tekrar oynayana gösterilmez
  let RPI = null;
  function histFilm(then) {
    if (wasDone || !window.SceneUtils || !window.SceneUtils.replay) { game.story = false; return then(); }
    game.story = true;
    window.SceneUtils.replay({ n: HISTORY.hist.length, ms: 14000, yearAt: i => HISTORY.hist[i].y, news: { 1985: ["🧊", "Antarktika'da ozon deliği bulundu"], 1987: ["✍️", "Montreal Protokolü imzalandı"], 1990: ["💰", "Yoksul ülkeler için fon kuruldu"], 2009: ["🌍", "Bütün ülkeler onayladı"], 2018: ["🔎", "Kaçak CFC yakalandı"] }, onIndex: i => { RPI = i; if (typeof replayPol === 'function') replayPol(i); }, card: () => ['⏪', '1974 · şimdi sen', `Tarihte delik <b>${HREC}</b> civarında kapanacak. <b>Hedefin:</b> 2060'tan önce. Dünyayı daha erken anlaştırabilir misin?`], showCard: (ic, fr, tx, th) => missionCard(ic, fr, tx, '', { pause: true, then: () => {
      // kontroller: ilk kaydırıcı spot ışığıyla tanıtılır (görev kartının yerine)
      const sl = document.querySelector('.slide.active .gpanel .sl:not(.locked)');
      const go = () => { game.story = false; th(); };
      go(); { const inp = sl && sl.querySelector('input'); if (inp) coach(inp, '👉 Dene: kaydır, sonucu hemen gör', 9000); } // görev kartı kontrolü zaten anlattı: spot ışığıyla durdurma yok, yalnız nabız
    } }), then });
  }
  function updateGame(dt) {
    if (RPI !== null) return; // tarih filmi oynuyor
    if (mode !== 'game' || game.paused || game.reading || game.story || game.state !== 'play' || gs.y > M.Y1) return;
    const visible = $('toasts').querySelector('.toast:not(.out)');
    const pace = visible ? 1.5 : toastQueue.length ? 0.95 : 0.47;
    const dur = YEAR * (gs.y < M.Y0 + 2 ? 1.5 : gs.y > 2025 ? 0.4 : gs.y > 2010 ? 0.7 : 1) / game.speed;
    game.frac += dt / (dur * pace);
    if (game.frac >= 1) { game.frac -= 1; yearTick(); }
  }
  function choice(from, title, text, opts, who) {
    if (game.state === 'choice') { choiceQ.push([from, title, text, opts, who]); return; }
    game.state = 'choice';
    const m = $('modal');
    m.innerHTML = `<div class="card talk"><div class="who"></div><div><div class="from">${from}</div><h2>${title}</h2><p class="speech">${text}</p><div class="opts"></div></div></div>`;
    m.querySelector('.who').appendChild(portrait(who || 'tolba'));
    const box = m.querySelector('.opts');
    opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'opt';
      b.innerHTML = `${o.label}<small>${o.sub}</small>`;
      let used = false;
      b.onclick = () => {
        if (used) return; used = true;
        m.hidden = true; game.state = 'play'; initAudio(); gavel(); o.fn(); if (official) official.leave = performance.now() + 1800;
        if (choiceQ.length && game.state === 'play') setTimeout(() => choice(...choiceQ.shift()), 900);
        else if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
      };
      box.appendChild(b);
    });
    m.hidden = false;
  }
  function conference(y) {
    comeOfficial('tolba', 'Delegeler salonda.');
    if (y === 1987) { cine(CINE.sign, () => conference87()); return; }
    conferenceRest(y);
  }
  function conference87() {
    choice('UNEP Başkanı Mostafa Tolba', 'Montreal Konferansı', '"Dünyanın önde gelen ülkeleri masada. Anlaşma ne kadar sıkı olsun? Sıkı anlaşma ozonu çabuk korur, ama bazı ülkeler imzadan kaçabilir."', [
      { label: '½ Yalnız %50 kesinti', sub: 'Kolay imza; ozon yavaş korunur', fn: () => { game.S = 0.2; game.choices.m = 'weak'; } },
      { label: '📉 Kademeli tam yasak', sub: 'Dengeli', fn: () => { game.S = 0.6; game.choices.m = 'mid'; } },
      { label: '⛔ Hemen tam yasak', sub: 'Sanayi kızar; bazıları geç imzalar', fn: () => { game.S = 0.9; game.choices.m = 'strict'; } },
    ], 'tolba');
  }
  function conferenceRest(y) {
    if (y === 1990) choice('Londra toplantısı', 'Takvim sıkılaşsın mı?', '"Yeni ölçümler delik büyüyor diyor. CFC\'yi <b>2000\'e kadar</b> tamamen bırakalım mı?"', [
      { label: '⏩ Evet, sıkılaştır', sub: 'Ozon çabuk iyileşir; Avrupa ve Japonya sanayisi kızar', fn: () => { game.S = Math.min(1, game.S + 0.25); [1, 2].forEach(i => gs.p[i] = Math.max(0, gs.p[i] - 0.15)); } },
      { label: '⏸ Şimdilik böyle kalsın', sub: 'Sanayi rahat eder', fn: () => {} },
    ], 'tolba');
    if (y === 1992) choice('Kopenhag toplantısı', 'Bir adım daha?', '"Alternatif soğutucular hazır. Takvimi <b>1996\'ya</b> çekebiliriz."', [
      { label: '⏩ Çekelim', sub: 'Sıkı takvim; zengin ülkeler biraz soğur', fn: () => { game.S = Math.min(1, game.S + 0.15); BLOCS.forEach((b, i) => { if (!b.dev) gs.p[i] = Math.max(0, gs.p[i] - 0.08); }); } },
      { label: '⏸ Gerek yok', sub: 'Takvim aynı', fn: () => {} },
    ], 'tolba');
  }

  function yearTick() {
    const y = gs.y, Wd = game.world;
    if (Wd.cheats.includes(y)) { game.cheatOn = 1; game.cheatSince = y; }
    const sl = Wd.slides.find(s => s.y === y);
    M.step(gs, { ...game.p, S: game.S, cheat: game.cheatOn, slide: sl ? sl.i : -1, hcfc: game.hcfc && y >= 2008 ? 1 : 0 });
    { const hh = gs.hist[gs.hist.length - 1]; hh.hole = Math.min(29, hh.hole * (0.88 + 0.24 * Math.random())); } // hava koşulları deliği yıldan yıla oynatır
    const h = gs.hist[gs.hist.length - 1];
    game.hist.push({ ...h, rec: null });
    // kaçak üretim: ölçüm ağı güçlüyse çabuk yakalanır
    if (game.cheatOn) {
      if (y === game.cheatSince) { pulseAt(() => [sci.sx, sci.sy], '#c0503a'); milestone('📈', 'Ölçüm istasyonu', 'Havada <b>beklenmedik CFC</b> var! Biri gizlice üretiyor. Bilime puan ayırırsan kaynağı çabuk bulur.', 'bad'); if (!game.moved.sci || game.p.sci < 0.3) coach(SL.sci, '👉 Kaydır: bilim ve ölçüm'); }
      else if (Math.random() < 0.15 + 0.7 * game.p.sci) { game.cheatOn = 0; game.caughtTotal++; if (y - game.cheatSince <= 2) game.caughtFast++; toast('🔎', 'Bilim insanları', `Kaçak fabrikalar ${y - game.cheatSince} yılda bulundu ve kapatıldı.`, 'good', { keep: true }); }
    }
    if (sl) { const b = { ...BLOCS[sl.i], name: bname(sl.i) }; pulseAt(() => [seats[sl.i].sx, seats[sl.i].sy], '#c0503a'); toast('📉', b.name, `Ekonomik kriz ve yeni hükümet: ${b.name} anlaşmadan <b>geri adım</b> atıyor: imzalı ama uymuyor. Diplomasi${b.dev ? ' ve fon' : ''} gerek.`, 'bad', { keep: true }); coach(b.dev && game.unlocked.fund ? SL.fund : SL.dip, b.dev && game.unlocked.fund ? '👉 Kaydır: ozon fonu' : '👉 Kaydır: diplomasi'); }
    // yeni imzalar
    h.sign.forEach((s, i) => { if (s === y) { if (view.want === 'pole' && !view.user) setView('scene'); sign(); pulseAt(() => [seats[i].sx, seats[i].sy], '#4f9a7a'); floats.push({ x: seats[i].sx || W / 2, y: (seats[i].sy || H / 2) - 10, text: `${bname(i)} imzaladı!`, life: 1.5, col: '#2f7a4a' }); } });
    // projeksiyon
    game.rec = M.recoveryYear(gs, { ...game.p, S: game.S, cheat: 0, hcfc: game.hcfc ? 1 : 0 });
    game.hist[game.hist.length - 1].rec = game.rec;
    if (y >= 1980) { const r = game.rec; $('g-rec').textContent = r === null ? '' : `Tahmin: ${recText(r)}`; $('g-rec').style.color = r !== null && r <= GOAL ? 'var(--green)' : 'var(--danger)'; }
    $('yb-harvest').textContent = h.hole > 0.5 ? `🌀 ${f1(h.hole)} Mkm²` : '🛡️ sağlam'; $('yb-harvest').style.color = h.hole < 5 ? 'var(--green)' : h.hole < 18 ? 'var(--grain)' : 'var(--danger)';
    // olaylar
    if (y === 1978) toast('🧴', 'ABD', 'ABD sprey kutularında CFC\'yi yasakladı. Ama buzdolapları ve klimalar sürüyor.', '', { keep: true });
    if (y === 1985) { cine(CINE.hole, () => { setView('pole'); setTimeout(() => guide([{ key: 'pole', el: '#g-view', text: '🌍 Deliğe <b>istediğin zaman</b> buradan bakabilirsin. Her ilkbahar açılır, nefes alır gibi.' }], () => setView('scene', 1)), 900); }); milestone('🧊', 'İngiliz Antarktika araştırmacıları', 'Antarktika\'nın üstünde her baharda ozon incelip bir <b>delik</b> açılıyor! 1957\'den beri ölçüyoruz, şimdi emin olduk.', 'bad'); toast('📜', 'Viyana', 'Ülkeler ozonu korumak için bir çerçeve sözleşmesi imzaladı. Ama henüz yasak yok.', '', { keep: true }); }
    if (y === 1986) conferenceSoon();
    if (y === 1987) toast('🕶️', 'Bir bakan', '"Herkes şapka ve güneş gözlüğü taksın, yeter!" Gazeteler bununla aylarca dalga geçti.', '', { keep: true });
    if (y === 1990) { game.unlocked.fund = true; SL.fund.disabled = false; $('w-fund').classList.remove('locked'); readPolicy(); milestone('💰', 'Gelişmekte olan ülkeler', '"Sizin kirliliğinizi biz mi ödeyeceğiz?" <b>Ozon fonu</b>: zengin ülkeler, yoksul ülkelerin CFC\'yi bırakmasına para verir. Fonsuz Çin ve Hindistan imzalamaz.', '', () => !game.moved.fund && coach(SL.fund, '👉 Kaydır: ozon fonu')); }
    if (y === 1991) toast('🇹🇷', 'Türkiye', 'Türkiye de Montreal Protokolü\'ne katıldı.', 'good', { keep: true });
    if (y === 1995) toast('🏅', 'Nobel', 'Molina, Rowland ve Crutzen ozonu yıkan kimyayı çözdükleri için Nobel Kimya Ödülü\'nü aldı.', 'good', { keep: true });
    if (y === 2009 && h.signed === BLOCS.length) toast('🌍', 'BM', 'Tarihte ilk kez <b>dünyadaki bütün ülkeler</b> bir çevre anlaşmasını onayladı!', 'good', { keep: true });
    if (y === 2007) { comeOfficial('tolba', 'Bir karar daha.'); choice('BM toplantısı', 'Geçiş gazları', '"CFC\'nin yerine geçen <b>HCFC</b> gazları da ozonu biraz yıkıyor. Bırakma takvimini 10 yıl öne çekelim mi? Gelişmekte olan ülkeler daha çok fon ister."', [
      { label: '⏩ Öne çekelim', sub: 'Delik daha erken kapanır; fon azsa Çin ve Hindistan soğur', fn: () => { game.hcfc = 1; if (game.p.fund < 0.3) BLOCS.forEach((b, i) => { if (b.dev) gs.p[i] = Math.max(0, gs.p[i] - 0.2); }); } },
      { label: '⏸ Takvim aynı kalsın', sub: 'Kimse kızmaz', fn: () => {} },
    ], 'tolba'); }
    if (y === 2016) toast('❄️', 'Kigali', 'Ülkeler CFC\'nin yerine geçen HFC gazlarını da azaltmaya karar verdi: bu gazlar iklimi ısıtıyor.', 'good', { keep: true });
    if (h.hole > 20) once('big', () => { setView('pole', 7000); toast('🌀', 'Uydu', `Delik ${f1(h.hole)} milyon km²: Antarktika'dan büyük!`, 'bad'); });
    if (y > 1990 && h.signed === BLOCS.length && y <= 1995) once('all95', () => award('ozon-herkes'));
    if (y === M.Y1) { if (game.rec !== null && game.rec <= GOAL) award('ozon-kapandi'); if (game.caughtTotal >= 2 && game.caughtFast >= 2) award('ozon-kacak'); }
    advise(h);
    if (y % 10 === 0 && window.SceneUtils && window.SceneUtils.decade) window.SceneUtils.decade(y, ({ 1980: "Spreyler, buzdolapları, klimalar her evde", 1990: "Soğuk Savaş bitiyor", 2000: "Yeni bir yüzyıl", 2010: "CFC neredeyse tamamen bırakıldı", 2020: "Delik yavaşça küçülüyor", 2030: null, 2040: null, 2050: null })[y]);
    if (gs.y > M.Y1 && game.state === 'play') endGame(); else if (gs.y > M.Y1) game.endAfter = true;
  }
  // yol gösterici: o an en önemli tek adım + kapanış tahmini
  function advise(h) {
    if (!window.SceneUtils || !window.SceneUtils.advise) return;
    const y = h.y, r = game.rec, recS = r === null ? '' : ` · tahmin: ${recText(r)}`;
    const unsigned = BLOCS.map((b, i) => i).filter(i => !h.sign[i]);
    const devWait = unsigned.filter(i => BLOCS[i].dev);
    const slid = BLOCS.map((b, i) => i).find(i => h.sign[i] && h.p[i] < 0.45);
    let t, tone;
    if (y < 1985) { t = game.p.sci < 0.4 ? 'Önce kanıt lazım: bilime puan ayır' : 'Bilim çalışıyor; kaygı büyüyor'; }
    else if (game.cheatOn) { t = 'Kaçak var: bilimi artır, kaynağı bulsun'; tone = 'bad'; }
    else if (slid !== undefined) { t = `${bname(slid)} uymuyor: ${BLOCS[slid].dev ? 'fonu' : 'diplomasiyi'} artır`; tone = 'bad'; }
    else if (y < 1987) t = 'Montreal yaklaşıyor: diplomasiyle çubukları kırmızı çizgiye taşı';
    else if (devWait.length && !game.unlocked.fund) t = 'Gelişmekte olan ülkeler bekliyor: fon 1990\'da açılacak';
    else if (devWait.length && game.p.fund < 0.25) { t = `${devWait.map(i => bname(i)).join(', ')} fon bekliyor`; tone = 'bad'; }
    else if (unsigned.length) t = `${unsigned.map(i => bname(i)).join(', ')} henüz imzalamadı: diplomasi`;
    else if (r !== null && r > GOAL) { t = y < 2007 ? 'Herkes imzalı ama tahmin geç: 2007\'de takvim kararı gelecek' : 'Tahmin geç: kaçakları yakala, uymayanı ikna et'; tone = 'bad'; }
    else { t = 'Herkes imzalı, yol doğru: bilimi kesme, kaçakları yakala'; tone = 'good'; }
    window.SceneUtils.advise(t + (y >= 1985 ? recS : ''), tone);
  }
  function conferenceSoon() { once('conf87', () => toast('📅', 'UNEP', 'Gelecek yıl Montreal\'de büyük konferans: anlaşmanın sıkılığını sen seçeceksin. İmzalayanlar kırmızı çizgiyi geçmiş olmalı.', 'warn')); }
  // konferans kartları: yılın başında
  function endGame() {
    if (game.state === 'end') return;
    game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-ozon', 'Bitirdi: Dünyanın Anlaştığı Gün');
    maxSeen = slides.length - 1; paintDots(); replayNav();
    const devAll = BLOCS.every((b, i) => !b.dev || (gs.sign[i] && gs.sign[i] <= 1996)); if (devAll) award('ozon-fon');
    setView('pole', 4000);
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 2600);
  }
  function renderResult() {
    if (!game.hist.length || gs.y <= M.Y1) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const hs = game.hist, last = hs[hs.length - 1], r = game.rec, peak = Math.max(...hs.map(h => h.hole)), hpeak = Math.max(...HISTORY.hist.map(h => h.hole));
    const score = r === null ? 100 : Math.round(clamp((2100 - Math.min(r, 2100)) / 60) * 100);
    let title, text;
    if (r !== null && r <= GOAL) { title = 'Dünya anlaştı'; text = `Ozon deliği ${yk(r)} kapanacak, tarihten (${HREC}) erken. Bilim kanıtladı, diplomasi ikna etti${game.p.fund > 0.1 ? ', fon herkesi masaya getirdi' : ''}.`; }
    else if (r !== null && r < 2075) { title = 'Tarihe yakın'; text = `Delik ${yk(r)} kapanacak, tarihte ${HREC}. Anlaşma işe yaradı, ama daha erken ve daha sıkı olabilirdi.`; }
    else if (r !== null && r < 9999) { title = 'Geç kalan anlaşma'; text = `Delik ancak ${recText(r)} kapanacak. CFC havada uzun kalır: her geciken yıl, onlarca yıl bekleme demek.`; }
    else { title = 'Delik kapanmıyor'; text = last.signed < 7 ? 'Anlaşma yarım kaldı: bazı ülkeler hiç imzalamadı. Klor birikmeye devam ediyor.' : 'Anlaşma imzalandı ama yetmedi: CFC salınmaya devam etti, klor birikiyor.'; }
    if (game.choices.m === 'weak' && !(r !== null && r <= GOAL)) text = 'Herkes imzaladı, ama yalnız %50 kesinti vardı: CFC\'nin yarısı salınmaya devam etti, klor birikti.';
    const col = r !== null && r <= GOAL ? 'var(--green)' : r !== null && r < 2075 ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">2060 · görev süren doldu</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${window.SceneUtils ? window.SceneUtils.bestLine('ozon', score, 'iyileşme hızı', true) : ''}
      <div class="rgrid">
        <div><div class="y">Delik kapanıyor</div><div class="v" style="color:${col}">${recText(r)}</div><div class="h">tarihte: ${HREC}</div></div>
        <div><div class="y">En büyük delik</div><div class="v">${f1(peak)} Mkm²</div><div class="h">tarihte: ${f1(hpeak)}</div></div>
        <div><div class="y">İmzalayan</div><div class="v">${last.signed}/7</div><div class="h">son imza: ${Math.max(...last.sign) || '—'}</div></div>
      </div>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return d ? `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>` : ''; }).join('')}</div>` : ''}
      <canvas class="rchart" id="rchart"></canvas>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button><a class="hbtn" href="../../#bolumler">☰ Tüm bölümler</a></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(slideOf('game')); };
    $('r-next').onclick = () => goTo(slideOf('sandbox'));
    { const nx = $('r-next'), fb = document.createElement('button'); fb.className = 'hbtn'; fb.id = 'r-facts'; fb.textContent = '📜 Gerçekte ne oldu?'; fb.onclick = () => goTo(slideOf('facts')); nx.parentNode.insertBefore(fb, nx.nextSibling); }
    requestAnimationFrame(drawResultChart);
  }
  const series = hist => [
    { data: hist.map(d => d.hole / 26), color: '#8a5ac0', label: 'Ozon deliği', fmt: v => f1(v * 26) + ' Mkm²' },
    { data: hist.map(d => clamp(d.E / 1.5)), color: '#b5543c', label: 'CFC salımı', fmt: v => '%' + Math.round(v * 150) },
    { data: hist.map(d => d.signed / 7), color: '#4f9a7a', label: 'İmzalayan', fmt: v => Math.round(v * 7) + '/7' },
  ];
  function drawResultChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('rchart'), [{ data: HISTORY.hist.map(d => d.hole / 26), color: '#9aa59a', dash: true, label: 'Tarihte delik', fmt: v => f1(v * 26) + ' Mkm²' }, ...series(game.hist)], TOTAL, { y0: M.Y0, step: 20 }); }

  // =====================================================================
  // LABORATUVAR
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: M.newState(), p: { sci: 0.3, dip: 0.3, fund: 0.4, S: 0.75 }, preset: null };
  function readSliders() {
    sb.p.sci = $('p-s').value / 100; sb.p.dip = $('p-d').value / 100; sb.p.S = $('p-k').value / 100; sb.p.fund = 0.4;
    $('o-ps').textContent = '%' + $('p-s').value; $('o-pd').textContent = '%' + $('p-d').value; $('o-pk').textContent = '%' + $('p-k').value;
  }
  ['p-s', 'p-d', 'p-k'].forEach(id => $(id).addEventListener('input', () => { readSliders(); sb.preset = null; document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: null, none: [10, 0, 0], weak: [30, 30, 10], best: [60, 50, 95] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset]; sb.preset = b.dataset.preset;
    if (v) ['p-s', 'p-d', 'p-k'].forEach((id, i) => $(id).value = v[i]);
    readSliders(); sb.st = M.newState(); sb.frac = 0; updateSbStats(); drawSbChart();
    document.querySelectorAll('.pbtn').forEach(x => x.classList.toggle('on', x === b));
  });
  $('sb-play').onclick = () => { sb.running = !sb.running; $('sb-play').textContent = sb.running ? '❚❚ Durdur' : '▶ Devam'; };
  $('sb-speed').onclick = () => { sb.speed = sb.speed === 1 ? 2 : sb.speed === 2 ? 4 : 1; $('sb-speed').textContent = sb.speed + '×'; };
  $('sb-reset').onclick = () => { sb.st = M.newState(); sb.frac = 0; updateSbStats(); drawSbChart(); };
  readSliders();
  function enterSandbox() { sb.running = true; $('sb-play').textContent = '❚❚ Durdur'; updateSbStats(); setTimeout(drawSbChart, 50); }
  function labP(y) {
    if (sb.preset === 'history') return M.histP(y);
    if (sb.preset === 'none') return { sci: 0.1, dip: 0, fund: 0, S: 0, noTreaty: 1 }; // anlaşma hiç yok
    return { ...sb.p, fund: y >= 1990 ? (sb.preset === 'none' ? 0 : 0.5) : 0 };
  }
  function updateSandbox(dt) {
    if (mode !== 'sandbox' || !sb.running) return;
    sb.frac += dt / (600 / sb.speed);
    while (sb.frac >= 1) {
      sb.frac -= 1;
      if (sb.st.y > M.Y1) sb.st = M.newState();
      const pp = labP(sb.st.y);
      if (sb.preset === 'history') { $('p-s').value = Math.round(pp.sci * 100); $('p-d').value = Math.round(pp.dip * 100); $('p-k').value = Math.round(pp.S * 100); }
      M.step(sb.st, pp);
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() { const h = sb.st.hist[sb.st.hist.length - 1]; $('sb-year').textContent = String(h ? h.y : M.Y0); $('sb-harvest').textContent = h ? `Delik: ${f1(h.hole)} Mkm² · imza ${h.signed}/7` : 'Ozon deliği: 0'; }
  function drawSbChart() { if (window.SceneUtils) window.SceneUtils.lineChart($('sb-chart'), series(sb.st.hist), TOTAL, { y0: M.Y0, step: 20 }); }

  // =====================================================================
  // DOKUNMA VE DÖNGÜ
  // =====================================================================
  cv.addEventListener('pointerdown', e => { initAudio(); if (mode === 'game' || mode === 'sandbox' || mode === 'title') talkAt(e.clientX, e.clientY); });
  let last = performance.now(), bgTick = 0, lastBg = '';
  function frame(now) {
    const dt = Math.max(0, Math.min(50, now - last)); last = now;
    // konferans yılları: yılın başında karar
    if (mode === 'game' && game.state === 'play' && !game.reading && [1987, 1990, 1992].includes(gs.y - 1) && !game.fired.has('conf' + (gs.y - 1))) { game.fired.add('conf' + (gs.y - 1)); conference(gs.y - 1); }
    updateGame(dt); updateSandbox(dt); ambientChat(now);
    if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
    const h = (mode === 'game' || mode === 'result' || mode === 'sandbox') ? curHist() : null;
    if (h) Object.assign(target, { hole: h.hole, E: h.E, C: h.C, uv: h.uv, signed: h.signed });
    else Object.assign(target, { hole: 0, E: 0.8, C: 0.1, uv: 1, signed: 0 });
    const k = 1 - Math.pow(0.93, dt / 16);
    for (const key of Object.keys(target)) vis[key] = lerp(vis[key], target[key], k * 0.5);
    BLOCS.forEach((b, i) => { vis.p[i] = lerp(vis.p[i], h ? h.p[i] : b.base, k * 0.5); vis.sg[i] = h ? h.sign[i] : 0; });
    vis.bad = lerp(vis.bad, smooth(0, 26, vis.hole), k * 0.5);
    if (view.until && (game.reading || game.state === 'choice')) view.until += dt;
    if (view.until && performance.now() > view.until && !view.user) setView('scene');
    if (mode !== 'game' && mode !== 'result' && view.want === 'pole') setView('scene');
    view.k = lerp(view.k, view.want === 'pole' ? 1 : 0, 1 - Math.pow(0.9, dt / 16));
    if (window.SceneUtils && window.SceneUtils.fullView) window.SceneUtils.fullView(view.k > 0.5 && mode === 'game');
    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);
    try { render(now, dt); } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } } // çizim hatası döngüyü durdurmasın
    if (mode === 'game') {
      const yy = String(RPI !== null ? HISTORY.hist[RPI].y : Math.max(M.Y0, Math.min(gs.y - 1, M.Y1)));
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = eraName(Number(yy)); $('g-date').textContent = yy;
      $('yb-fill').style.width = clamp(RPI !== null ? RPI / TOTAL : (gs.hist.length + game.frac) / TOTAL) * 100 + '%';
      $('m-ozone').style.width = (1 - 0.7 * smooth(0, 26, vis.hole)) * 100 + '%';
      $('m-cfc').style.width = clamp(vis.E / 1.5) * 100 + '%';
      $('m-sign').style.width = vis.signed / 7 * 100 + '%';
      $('m-trust').style.width = clamp(vis.C) * 100 + '%';
      $('m-trust').parentElement.parentElement.classList.toggle('low', vis.C < 0.25);
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
