// Bölüm 4 — Kuşlar Neden Sustu? (ABD, 1946–1990)
(() => {
  'use strict';
  const MISSION = {"title": "Kuşlar Neden Sustu? · ABD, 1946", "role": "Bir kıyı ilçesinin tarım müdürüsün. Uçaklar ilacı sıkar, çiftçiler hasadı toplar.", "control": "✈️ <b class=\"inl\">DDT ilaçlaması</b>: ne kadar ilaçlanacağını, düğmelerle de <b class=\"inl\">nereye</b> (tarla, bahçeler, bataklık) sıkılacağını seçersin. 1962'de 🐞 doğal mücadele açılabilir.", "goal": "1990'a kadar ürünü koru, kartalları ve ötücü kuşları kaybetme.", "watch": "Çiftçiler böcek görürse kızar. Zehrin besin zincirinde nasıl biriktiğini sol üstteki zincirden izle."};
  const M = window.DdtModel;
  const $ = id => document.getElementById(id);
  const { clamp, smooth } = M;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const ppm = v => v <= 0 ? '0' : v < 0.001 ? v.toFixed(5).replace('.', ',') : v < 0.1 ? v.toFixed(2).replace('.', ',') : v < 10 ? v.toFixed(1).replace('.', ',') : String(Math.round(v));

  const TOTAL = M.Y1 - M.Y0 + 1; // 45 yıl
  const HISTORY = M.run(TOTAL, M.histP);
  const eraName = y => y < 1950 ? 'Savaş sonrası' : y < 1962 ? 'Mucize toz yılları' : y < 1973 ? 'Sessiz Bahar tartışması' : 'Yasaktan sonra';

  // =====================================================================
  // SES — rüzgâr, kuş cıvıltısı (ötücü kuş sayısıyla), uçak motoru, vızıltı
  // =====================================================================
  let AC = null, master, buzzGain, motorGain, noiseBuf, muted = /[?&](debug|hizli|sessiz)\b/.test(location.search) || (() => { try { return localStorage.getItem('bny-ses') === '0'; } catch (e) { return false; } })(); // test sırasında ya da oyuncu kapattıysa ses çıkmasın
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const loop = (freq, type, q, gain) => {
        const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
        const g = AC.createGain(); g.gain.value = gain;
        s.connect(f); f.connect(g); g.connect(master); s.start();
        return g;
      };
      loop(420, 'lowpass', 0.5, 0.03);
      buzzGain = loop(560, 'bandpass', 3, 0);
      motorGain = loop(140, 'bandpass', 2, 0);
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
  function chirp() {
    if (!AC) return;
    const base = rnd(3200, 4300), n = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) setTimeout(() => tone(base, base + 1100, 0.08, 0.022, 'sine'), k * 120);
  }
  const eagleCry = () => { tone(2400, 1500, 0.35, 0.025, 'triangle'); setTimeout(() => tone(2200, 1400, 0.3, 0.02, 'triangle'), 300); };
  const blip = () => tone(880, 660, 0.12, 0.03, 'triangle');
  const crack = () => tone(1800, 300, 0.08, 0.05, 'square');
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
      L.gb = clamp((top - 6) / H, 0.4, 0.88); L.gt = Math.max(0.3, L.gb - (mobile ? 0.34 : 0.4));
      if (!document.body.classList.contains('dock') && !mobile) { L.gt = 0.55; L.gb = 1; L.x1 = (W - 366) / W; }
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') L.gt = 0.8;
    if (m === 'sandbox') { if (mobile) { L.gt = 0.22; L.gb = 0.46; } else { L.gt = 0.52; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.62, gb: 1, x1: 1 };
  const PAL = {
    bgOk: [233, 240, 222], bgBad: [236, 228, 214],
    sky: [214, 232, 238], grass: [178, 206, 140], grassBad: [204, 196, 150],
    stalk: [104, 146, 78], stalkBad: [170, 150, 96], cob: [236, 196, 70],
    water: [96, 150, 180], reed: [130, 150, 90], ink: [43, 58, 46], sun: [246, 210, 104],
    barn: [176, 64, 50], house: [236, 224, 204], roof: [120, 90, 70], mist: [246, 246, 240],
  };
  const vis = { P: 1.56, N: 1, B: 1, S: 1, Y: 1, D: 0, R: 0, s: 0.1, thin: 0, bad: 0 };
  const target = { ...vis };
  const bubbles = [], floats = [], bugs = [], ladies = [], robins = [], eagles = [], mist = [], gags = [];
  const clouds = Array.from({ length: 3 }, () => ({ x: rnd(0, 1), y: rnd(0.08, 0.22), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000012) }));
  const plane = { x: -200, on: false, next: 0, sx: 0, sy: 0 };
  const nest = { x: 0, y: 0, eggs: 2, cracked: 0, chicks: 0, lastY: 0, sx: 0, sy: 0 };
  const poster = { x: 0, y: 0, w: 0, h: 0 };
  const farmers = [{ f: 0.12, ph: 0 }, { f: 0.22, ph: 2 }, { f: 0.3, ph: 4 }];
  const heron = { x: 0, y: 0, ph: 0 };
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};
  for (let i = 0; i < 8; i++) robins.push({ tree: i % 3, k: i, ph: rnd(0, 6), sx: 0, sy: 0 });
  for (let i = 0; i < 3; i++) eagles.push({ a: rnd(0, 6), r: rnd(40, 80), sp: rnd(0.0003, 0.0005), sx: 0, sy: 0 });

  function geo() {
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H, gh = gb - gt;
    return { x1, gt, gb, gh, marsh: x1 * 0.62, road: gt + gh * 0.12 };
  }

  function drawBubble(bb) {
    const pad = 10 * U, fs = 17 * U;
    ctx.font = `${fs}px "Patrick Hand"`;
    const lines = bb.text.split('\n');
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2, h = lines.length * fs * 1.15 + pad * 1.4;
    const bx = bb.obj ? bb.obj.x : bb.x, by = bb.obj ? bb.obj.y : bb.y;
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
  const at = (getX, getY) => ({ get x() { return getX(); }, get y() { return getY(); } });

  function person(x, y, s, o = {}) {
    const dir = o.dir || 1, st = o.step || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.beginPath(); ctx.ellipse(0, 1, 10, 2.6, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(-3 - st, 0); ctx.moveTo(2, -9); ctx.lineTo(3 + st, 0); ctx.stroke();
    ctx.fillStyle = o.shirt || '#6b8db5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -27, 14, 19, 5) : ctx.rect(-7, -27, 14, 19); ctx.fill();
    if (o.overall) { ctx.fillStyle = o.overall; ctx.fillRect(-7, -19, 14, 11); ctx.fillRect(-5, -27, 3, 8); ctx.fillRect(2, -27, 3, 8); }
    ctx.fillStyle = o.skin || '#e9c49d'; ctx.beginPath(); ctx.arc(0, -33, 6.5, 0, 6.283); ctx.fill();
    if (o.hat) { ctx.fillStyle = o.hat; ctx.beginPath(); ctx.ellipse(0, -38, 10, 2.6, 0, 0, 6.283); ctx.fill(); ctx.fillRect(-5, -44, 10, 6); }
    if (o.hair) { ctx.fillStyle = o.hair; ctx.beginPath(); ctx.arc(0, -35, 7, Math.PI, 0); ctx.fill(); ctx.fillRect(-7, -35, 3, 9); }
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(2.2, -34, 1.1, 0, 6.283); ctx.arc(-1.8, -34, 1.1, 0, 6.283); ctx.fill();
    if (o.arm !== undefined) { ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(4, -22); ctx.lineTo(11, -22 + o.arm); ctx.stroke(); }
    ctx.restore();
  }

  function drawPlane(G, t, dt) {
    if (mode === 'facts' || mode === 'lessons') return;
    const s = vis.s;
    if (!plane.on && s > 0.08 && t > plane.next) { plane.on = true; plane.x = -80 * U; plane.v = (0.12 + 0.1 * s) * U; }
    if (!plane.on) return;
    plane.x += plane.v * dt;
    const y = G.gt - G.gh * 0.12 + Math.sin(plane.x * 0.01) * 4 * U;
    plane.sx = plane.x; plane.sy = y - 14 * U;
    if (plane.x > G.x1 + 80 * U) { plane.on = false; plane.next = t + lerp(12000, 2500, s); return; }
    // ilaç bulutu: tarladan bataklığa kadar her yere iner
    const z = mode === 'game' ? game.z : { f: 1, g: 1, m: 1 }, px = plane.x / G.x1;
    const over = (px < 0.43 && z.f) || (px >= 0.43 && px < 0.62 && z.g) || (px >= 0.62 && z.m);
    if (over && Math.random() < 0.6 * s * (dt / 16)) mist.push({ x: plane.x - 14 * U, y: y + 6 * U, vy: rnd(0.02, 0.05) * U, life: 1 });
    const sc = U * (mobile ? 0.8 : 1);
    ctx.save(); ctx.translate(plane.x, y); ctx.scale(sc, sc);
    ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#c0503a'; ctx.fillRect(-6, -14, 12, 28); ctx.fillRect(-22, -6, 6, 6);
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(8, -3, 3, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgb(PAL.ink, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(23, -7 * Math.sin(t * 0.08)); ctx.lineTo(23, 7 * Math.sin(t * 0.08)); ctx.stroke();
    ctx.restore();
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const G = geo(), { x1, gt, gb, gh } = G;
    const sky = ctx.createLinearGradient(0, 0, 0, gt);
    sky.addColorStop(0, rgb(PAL.sky, 0.9)); sky.addColorStop(1, 'rgba(240,244,232,.5)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, x1, gt);
    ctx.fillStyle = rgb(PAL.sun, 0.9); ctx.beginPath(); ctx.arc(x1 * 0.1, H * 0.14, 24 * U, 0, 6.283); ctx.fill();
    for (const cl of clouds) {
      cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15;
      const cx = cl.x * x1, cy = cl.y * H, s = 22 * U * cl.s;
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath();
      ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283); ctx.fill();
    }
    // zemin
    ctx.fillStyle = rgb(mixC(PAL.grass, PAL.grassBad, clamp(vis.bad * 1.2))); ctx.fillRect(0, gt, x1, H - gt);
    // bataklık ve göl
    ctx.fillStyle = rgb(PAL.water);
    ctx.beginPath(); ctx.moveTo(G.marsh, gt + gh * 0.22); ctx.quadraticCurveTo(G.marsh + 30 * U, gt + gh * 0.12, x1, gt + gh * 0.1); ctx.lineTo(x1, H); ctx.lineTo(G.marsh - 20 * U, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5 * U;
    for (let k = 0; k < 5; k++) { const wx = G.marsh + 30 * U + ((t * 0.015 + k * 83) % Math.max(40, x1 - G.marsh - 40 * U)); const wy = gt + gh * (0.3 + k * 0.1); ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 14 * U, wy); ctx.stroke(); }
    ctx.strokeStyle = rgb(PAL.reed); ctx.lineWidth = 2 * U;
    for (let x = G.marsh - 10 * U; x < G.marsh + 60 * U; x += 7 * U) { const yy = gt + gh * (0.2 + Math.sin(x) * 0.03); ctx.beginPath(); ctx.moveTo(x, yy + 10 * U); ctx.quadraticCurveTo(x + 2 * U, yy - 4 * U, x + Math.sin(t * 0.002 + x) * 3 * U, yy - 14 * U); ctx.stroke(); }

    // ahır ve afiş ("DDT iyidir!")
    const bx = x1 * (mobile ? 0.36 : 0.355), by = gt + gh * 0.05;
    ctx.fillStyle = rgb(PAL.barn); ctx.fillRect(bx, by - 46 * U, 50 * U, 46 * U);
    ctx.beginPath(); ctx.moveTo(bx - 4 * U, by - 46 * U); ctx.lineTo(bx + 25 * U, by - 66 * U); ctx.lineTo(bx + 54 * U, by - 46 * U); ctx.fill();
    ctx.fillStyle = '#f4ecd8'; poster.x = bx + 8 * U; poster.y = by - 40 * U; poster.w = 34 * U; poster.h = 20 * U;
    ctx.fillRect(poster.x, poster.y, poster.w, poster.h);
    ctx.fillStyle = rgb(PAL.ink); ctx.font = `${8 * U}px "Patrick Hand"`; ctx.textAlign = 'center';
    ctx.fillText('DDT', poster.x + poster.w / 2, poster.y + 9 * U); ctx.fillText('iyidir!', poster.x + poster.w / 2, poster.y + 17 * U); ctx.textAlign = 'left';

    // mısır tarlası: zararlı çoğaldıkça yapraklar kemirilir, koçanlar ürünle
    const eaten = clamp((vis.P - 1.2) / 2.6), cobs = clamp(vis.Y / 1.15);
    for (let r = 0; r < 3; r++) {
      const yy = gt + gh * (0.36 + r * 0.17);
      for (let x = x1 * 0.04; x < x1 * 0.34; x += 12 * U) {
        const hgt = (30 + Math.sin(x * 0.3 + r) * 5) * U * (1 - 0.3 * eaten);
        ctx.strokeStyle = rgb(mixC(PAL.stalk, PAL.stalkBad, eaten)); ctx.lineWidth = 2.4 * U;
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + Math.sin(t * 0.0015 + x) * 2 * U, yy - hgt); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, yy - hgt * 0.5); ctx.quadraticCurveTo(x + 8 * U, yy - hgt * 0.6, x + 11 * U * (1 - eaten * 0.6), yy - hgt * 0.4); ctx.stroke();
        if (Math.sin(x * 1.7 + r * 5) * 0.5 + 0.5 < cobs) { ctx.fillStyle = rgb(PAL.cob); ctx.beginPath(); ctx.ellipse(x - 3 * U, yy - hgt * 0.62, 2.4 * U, 5 * U, -0.3, 0, 6.283); ctx.fill(); }
      }
    }
    // kasaba: evler ve karaağaçlar (ötücü kuşlar burada)
    for (let i = 0; i < 3; i++) {
      const hx = x1 * (0.44 + i * 0.055), hy = gt + gh * 0.08;
      ctx.fillStyle = rgb(PAL.house); ctx.fillRect(hx, hy - 22 * U, 24 * U, 22 * U);
      ctx.fillStyle = rgb(PAL.roof); ctx.beginPath(); ctx.moveTo(hx - 3 * U, hy - 22 * U); ctx.lineTo(hx + 12 * U, hy - 34 * U); ctx.lineTo(hx + 27 * U, hy - 22 * U); ctx.fill();
      ctx.fillStyle = '#9ac4d8'; ctx.fillRect(hx + 5 * U, hy - 16 * U, 6 * U, 6 * U);
    }
    const trees = [0.46, 0.53, 0.6].map(f => ({ x: x1 * f, y: gt + gh * 0.3 }));
    trees.forEach(tr => {
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(tr.x - 3 * U, tr.y - 34 * U, 6 * U, 34 * U);
      ctx.fillStyle = rgb(mixC([110, 160, 90], [170, 170, 110], clamp(vis.bad))); ctx.beginPath(); ctx.arc(tr.x, tr.y - 44 * U, 20 * U, 0, 6.283); ctx.arc(tr.x - 14 * U, tr.y - 34 * U, 13 * U, 0, 6.283); ctx.arc(tr.x + 14 * U, tr.y - 34 * U, 13 * U, 0, 6.283); ctx.fill();
    });
    // ötücü kuşlar: sayıları kuş sağlığıyla; ölenler çimde
    const alive = Math.round(vis.S * robins.length);
    robins.forEach((rb, i) => {
      const tr = trees[rb.tree], k = rb.k;
      if (i < alive) {
        const x = tr.x + Math.cos(k * 2.1) * 14 * U, y = tr.y - 40 * U + Math.sin(k * 1.3) * 10 * U + Math.sin(t * 0.004 + rb.ph) * 1.5 * U;
        rb.sx = x; rb.sy = y;
        ctx.fillStyle = '#7a5a40'; ctx.beginPath(); ctx.ellipse(x, y, 5 * U, 3.6 * U, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#d0603a'; ctx.beginPath(); ctx.ellipse(x + 1 * U, y + 1 * U, 3 * U, 2.4 * U, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(x + 3 * U, y - 1.5 * U, 0.9 * U, 0, 6.283); ctx.fill();
      } else if (vis.S < 0.7) {
        const x = tr.x + (k - 4) * 7 * U, y = tr.y + 4 * U; rb.sx = undefined;
        ctx.fillStyle = 'rgba(122,90,64,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 5 * U, 2.2 * U, 0, 0, 6.283); ctx.fill();
      }
    });
    if (AC && mode !== 'facts' && mode !== 'lessons' && Math.random() < alive * 0.0009 * (dt / 16)) chirp();

    // kartal yuvası: ölü bir ağaçta, bataklığın kıyısında
    const nx = x1 * (mobile ? 0.86 : 0.88), ny = gt + gh * 0.14;
    ctx.strokeStyle = '#6a5440'; ctx.lineWidth = 5 * U; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(nx, ny + 40 * U); ctx.lineTo(nx, ny - 50 * U); ctx.moveTo(nx, ny - 30 * U); ctx.lineTo(nx - 18 * U, ny - 46 * U); ctx.moveTo(nx, ny - 40 * U); ctx.lineTo(nx + 16 * U, ny - 58 * U); ctx.stroke();
    const ty = ny - 52 * U; nest.x = nx; nest.y = ty; nest.sx = nx; nest.sy = ty - 26 * U;
    ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.ellipse(nx, ty, 16 * U, 6 * U, 0, 0, 6.283); ctx.fill();
    for (let k = 0; k < 2; k++) {
      const ex = nx - 5 * U + k * 10 * U, ey = ty - 5 * U;
      if (k < nest.chicks) { ctx.fillStyle = '#e8e0cc'; ctx.beginPath(); ctx.arc(ex, ey - 2 * U, 4.5 * U, 0, 6.283); ctx.fill(); ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.moveTo(ex + 3 * U, ey - 3 * U); ctx.lineTo(ex + 7 * U, ey - 2 * U); ctx.lineTo(ex + 3 * U, ey - 1 * U); ctx.fill(); }
      else if (k < nest.eggs) {
        ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.ellipse(ex, ey, 3.6 * U, 4.6 * U, 0, 0, 6.283); ctx.fill();
        if (k < nest.cracked) { ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex - 3 * U, ey - 1 * U); ctx.lineTo(ex - 1 * U, ey + 1 * U); ctx.lineTo(ex + 1 * U, ey - 1.5 * U); ctx.lineTo(ex + 3 * U, ey + 0.5 * U); ctx.stroke(); }
      }
    }
    // yırtıcı kuşlar süzülür: sayıları kartal sağlığıyla
    const nE = Math.round(vis.B * (mobile ? 2 : 3));
    eagles.forEach((e, i) => {
      if (i >= nE) { e.sx = undefined; return; }
      e.a += e.sp * dt;
      const ex = nx - 40 * U + Math.cos(e.a) * e.r * U * 1.6, ey = H * 0.2 + Math.sin(e.a) * e.r * U * 0.4 + i * 14 * U;
      e.sx = ex; e.sy = ey;
      const fl = Math.sin(t * 0.004 + i) * 3 * U;
      ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.moveTo(ex - 18 * U, ey - fl); ctx.quadraticCurveTo(ex - 6 * U, ey - 6 * U, ex, ey); ctx.quadraticCurveTo(ex + 6 * U, ey - 6 * U, ex + 18 * U, ey - fl); ctx.lineTo(ex, ey + 3 * U); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.arc(ex + (Math.cos(e.a) > 0 ? -1 : 1) * 0 + 0, ey - 2 * U, 2.6 * U, 0, 6.283); ctx.fill();
    });
    // balıkçıl ve balıklar
    heron.x = G.marsh + 40 * U; heron.y = gt + gh * 0.36; heron.ph += dt * 0.002;
    ctx.strokeStyle = '#7a8a96'; ctx.lineWidth = 2 * U; ctx.beginPath(); ctx.moveTo(heron.x, heron.y); ctx.lineTo(heron.x, heron.y - 14 * U); ctx.stroke();
    ctx.fillStyle = '#a8b4bc'; ctx.beginPath(); ctx.ellipse(heron.x, heron.y - 18 * U, 8 * U, 5 * U, -0.3, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#a8b4bc'; ctx.lineWidth = 2.4 * U; ctx.beginPath(); ctx.moveTo(heron.x + 5 * U, heron.y - 21 * U); ctx.quadraticCurveTo(heron.x + 12 * U, heron.y - 30 * U, heron.x + 8 * U, heron.y - 34 * U); ctx.stroke();
    ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.moveTo(heron.x + 8 * U, heron.y - 35 * U); ctx.lineTo(heron.x + 17 * U, heron.y - 33 * U); ctx.lineTo(heron.x + 8 * U, heron.y - 32 * U); ctx.fill();
    heron.sx = heron.x; heron.sy = heron.y - 40 * U;

    // zararlılar ve faydalı böcekler (uğur böceği)
    const wantBugs = Math.round(vis.P * (mobile ? 6 : 10));
    while (bugs.length < wantBugs) bugs.push({ x: rnd(0.05, 0.34), y: rnd(0.2, 0.75), ph: rnd(0, 6) });
    while (bugs.length > wantBugs) bugs.pop();
    ctx.fillStyle = 'rgba(70,80,40,.85)';
    for (const b of bugs) { b.ph += dt * 0.01; const xx = b.x * x1 + Math.sin(b.ph) * 8 * U, yy = gt + b.y * gh + Math.cos(b.ph * 1.3) * 5 * U; b.sx = xx; b.sy = yy; ctx.beginPath(); ctx.ellipse(xx, yy, 2.4 * U, 1.6 * U, 0, 0, 6.283); ctx.fill(); }
    const wantLadies = Math.round(vis.N * (mobile ? 4 : 7));
    while (ladies.length < wantLadies) ladies.push({ x: rnd(0.06, 0.33), r: Math.floor(rnd(0, 3)), ph: rnd(0, 6) });
    while (ladies.length > wantLadies) ladies.pop();
    for (const l of ladies) { const xx = l.x * x1, yy = gt + gh * (0.36 + l.r * 0.17) - 16 * U + Math.sin(t * 0.002 + l.ph) * 3 * U; ctx.fillStyle = '#c0302a'; ctx.beginPath(); ctx.arc(xx, yy, 2.6 * U, 0, 6.283); ctx.fill(); ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(xx, yy, 0.8 * U, 0, 6.283); ctx.fill(); }

    // çiftçiler
    farmers.forEach((f, i) => {
      const x = x1 * f.f, y = gt + gh * (0.42 + (i % 2) * 0.17) + 10 * U; f.sx = x; f.sy = y - 46 * U;
      person(x, y, U * (mobile ? 0.8 : 0.95), { dir: i % 2 ? -1 : 1, overall: '#3a6a9a', shirt: '#e8dcc0', hat: '#c9a45a', arm: Math.sin(t * 0.003 + f.ph) * 3 });
    });
    drawPlane(G, t, dt);
    for (let i = mist.length - 1; i >= 0; i--) {
      const m = mist[i]; m.y += m.vy * dt; m.life -= dt / 3500;
      if (m.life <= 0 || m.y > gb) { mist.splice(i, 1); continue; }
      ctx.fillStyle = rgb(PAL.mist, m.life * 0.5); ctx.beginPath(); ctx.arc(m.x, m.y, (6 + (1 - m.life) * 14) * U, 0, 6.283); ctx.fill();
    }
    drawLabels(G);
    drawGags(G, t, dt);
    drawOfficial(G, t);
    if (cview.k > 0.01) drawChainView(G, t, dt, cview.k);
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt / 1400; f.y -= dt * 0.02; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = clamp(f.life * 2); ctx.fillStyle = rgb(PAL.ink); ctx.font = `${18 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt / 4200; if (b.life <= 0) { bubbles.splice(i, 1); continue; } drawBubble(b); }
  }

  // yuva: her yıl yumurtalar kuluçkaya yatar; kabuk inceyse kırılır
  function nestYear(h) {
    nest.eggs = vis.B > 0.12 ? 2 : vis.B > 0.04 ? 1 : 0;
    nest.cracked = 0; nest.chicks = 0;
    if (!nest.eggs) return;
    if (h.hatch < 0.5) {
      nest.cracked = h.hatch < 0.2 ? nest.eggs : 1;
      setTimeout(() => { crack(); if (mode === 'game') sayAt(at(() => nest.sx, () => nest.sy), pick(['Yumurtam\nkırıldı!', 'Kabuk kâğıt\ngibi ince...', 'Yine mi?\nYine mi kırıldı?'])); }, 900);
    } else setTimeout(() => { nest.chicks = h.hatch > 0.85 ? 2 : 1; nest.eggs = 2; if (mode === 'game' && Math.random() < 0.5) sayAt(at(() => nest.sx, () => nest.sy), pick(['Cik! Cik!\nAcıktık!', 'Yumurtadan\nçıktık!'])); }, 1500);
  }


  // sahnedeki etiketler: oyuncu neyin neden değiştiğini görsün
  function tag(x, y, text, o = {}) {
    const fs = (o.fs || 13) * U;
    ctx.font = `${fs}px "Patrick Hand"`;
    const w = ctx.measureText(text).width + 12 * U, h = fs + 8 * U;
    let bx = clamp(x - w / 2, 4, lay.x1 * W - w - 4), by = y - h;
    if (window.SceneUtils && mode === 'game') ({ x: bx, y: by } = window.SceneUtils.avoidHud(bx, by, w, h));
    ctx.globalAlpha = o.a === undefined ? 0.95 : o.a;
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.strokeStyle = 'rgba(43,58,46,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, h, h / 2) : ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.color || rgb(PAL.ink); ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 6 * U, by + h / 2 + 1); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  }
  function drawLabels(G) {
    if (mode !== 'game' && mode !== 'sandbox') return;
    const fs = mobile ? 11 : 13, bad = '#a0402a';
    tag(G.x1 * 0.2, G.gt + G.gh * 0.25, vis.R > 0.15 ? `🐛 Zararlılarda direnç %${Math.round(vis.R * 100)}` : `🐛 Zararlı ${vis.P > 2.4 ? 'çok' : vis.P > 1.2 ? 'normal' : 'az'}`, { fs, color: vis.R > 0.4 || vis.P > 2.4 ? bad : undefined });
    tag(G.x1 * 0.53, G.gt + G.gh * 0.02, `🐦 Ötücü kuş %${Math.round(vis.S * 100)}`, { fs, color: vis.S < 0.5 ? bad : undefined });
    const c = M.chain(vis.D);
    tag(G.marsh + (G.x1 - G.marsh) * 0.5, G.gt + G.gh * 0.62, `🐟 Balıkta ${ppm(c.fish)} ppm`, { fs, color: c.fish > 1 ? bad : undefined });
    tag(nest.x, nest.y - 14 * U, vis.thin > 1 ? `🥚 Kabuk %${Math.round(vis.thin)} ince` : '🥚 Kabuk sağlam', { fs: mobile ? 10 : 12, color: vis.thin > 8 ? bad : undefined });
  }


  // =====================================================================
  // BESİN ZİNCİRİ GÖRÜNÜMÜ: zehrin basamak basamak tırmanışı (ekranı kaplar)
  // =====================================================================
  const cview = { want: 0, k: 0, until: 0, user: false };
  const parts = [];
  function setChain(on, ms) { cview.want = on ? 1 : 0; cview.user = on && !ms; cview.until = ms ? performance.now() + ms : 0; }
  function drawChainView(G, t, dt, alpha) {
    const top = (window.SceneUtils && window.SceneUtils.viewTop ? window.SceneUtils.viewTop(96 * U) : 96 * U) + 24 * U, Hh = G.gb - top, x0 = G.x1 * 0.04, Wd = G.x1 * (mobile ? 0.92 : 0.66);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(250,248,240,.97)'; ctx.fillRect(0, top - 10 * U, G.x1, Hh + 10 * U + (H - G.gb));
    const c = M.chain(vis.D);
    const L = [
      { k: 'water', name: 'Su', v: c.water, ic: '💧' },
      { k: 'plankton', name: 'Plankton', v: c.plankton, ic: '🦠' },
      { k: 'fish', name: 'Balık', v: c.fish, ic: '🐟' },
      { k: 'bird', name: 'Kartal', v: c.bird, ic: '🦅' },
    ];
    const n = L.length, stepW = Wd / n, base = top + Hh * 0.92;
    // basamaklar: her basamak bir öncekinden yüksek; içindeki kırmızı noktalar DDT
    L.forEach((l, i) => {
      const x = x0 + i * stepW, hgt = Hh * (0.22 + i * 0.18), y = base - hgt, w = stepW * 0.86;
      l.x = x + w / 2; l.y = y;
      ctx.fillStyle = ['#cfe3ee', '#d8ead0', '#d6e2ea', '#e8dccb'][i]; ctx.strokeStyle = rgb(PAL.ink, 0.4); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, hgt, 12) : ctx.rect(x, y, w, hgt); ctx.fill(); ctx.stroke();
      const logv = l.v > 0 ? Math.log10(l.v / 0.00001) : 0, dots = Math.round(clamp(logv / 7.2) * 40);
      for (let d = 0; d < dots; d++) { const px = x + 8 * U + ((d * 37) % Math.max(10, w - 16 * U)), py = y + hgt - 10 * U - ((d * 23) % Math.max(10, hgt - 40 * U)); ctx.fillStyle = 'rgba(192,64,48,.75)'; ctx.beginPath(); ctx.arc(px, py, 2.6 * U, 0, 6.283); ctx.fill(); }
      ctx.font = `${(mobile ? 20 : 30) * U}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(l.ic, x + w / 2, y + 34 * U);
      ctx.font = `${(mobile ? 13 : 17) * U}px "Patrick Hand"`; ctx.fillStyle = rgb(PAL.ink); ctx.fillText(l.name, x + w / 2, y + 54 * U);
      ctx.font = `${(mobile ? 15 : 22) * U}px "Patrick Hand"`; ctx.fillStyle = l.k === 'bird' && l.v > 20 ? '#a0402a' : rgb(PAL.ink);
      ctx.fillText(`${ppm(l.v)} ppm`, x + w / 2, y - 10 * U); ctx.textAlign = 'left';
      if (i > 0) {
        const prev = L[i - 1], mult = prev.v > 0 ? l.v / prev.v : 0;
        ctx.strokeStyle = 'rgba(192,64,48,.6)'; ctx.lineWidth = 2.5 * U; ctx.beginPath(); ctx.moveTo(prev.x + stepW * 0.3, prev.y - 30 * U); ctx.quadraticCurveTo((prev.x + l.x) / 2, Math.min(prev.y, l.y) - 50 * U, l.x - stepW * 0.25, l.y - 34 * U); ctx.stroke();
        if (mult) tag((prev.x + l.x) / 2, Math.min(prev.y, l.y) - 40 * U, `×${Math.round(mult)}`, { fs: mobile ? 11 : 14, color: '#a0402a' });
      }
    });
    // yukarı tırmanan zehir parçacıkları
    if (Math.random() < clamp(vis.s + vis.D / 4) * 0.5 * (dt / 16)) parts.push({ k: 0, i: 0 });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.k += dt / 1400; if (p.k >= 1) { p.k = 0; p.i++; } if (p.i >= n - 1) { parts.splice(i, 1); continue; }
      const a = L[p.i], b = L[p.i + 1], px = lerp(a.x, b.x, p.k), py = lerp(a.y - 30 * U, b.y - 34 * U, p.k) - Math.sin(p.k * Math.PI) * 30 * U;
      ctx.fillStyle = 'rgba(192,64,48,.9)'; ctx.beginPath(); ctx.arc(px, py, 3.2 * U, 0, 6.283); ctx.fill();
    }
    ctx.font = `${(mobile ? 15 : 20) * U}px "Patrick Hand"`; ctx.fillStyle = rgb(PAL.ink); ctx.textAlign = 'center'; ctx.fillText('Zehir her basamakta katlanıyor (biyolojik birikim)', G.x1 / 2, top - 6 * U); ctx.textAlign = 'left';
    // yumurta kabuğu kesiti: 1946 ile bugünkü kalınlık
    if (!mobile) {
      const ex = G.x1 * 0.86, ey = top + Hh * 0.5, er = Math.min(G.x1 * 0.09, Hh * 0.28), th = 1 - vis.thin / 100;
      ctx.fillStyle = '#f2ece0'; ctx.strokeStyle = rgb(PAL.ink, 0.5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(ex, ey, er * 0.78, er, 0, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 9 * U; ctx.beginPath(); ctx.arc(ex, ey, er * 0.9, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
      ctx.strokeStyle = vis.thin > 8 ? '#c0503a' : '#c9b48a'; ctx.lineWidth = 9 * U * th; ctx.beginPath(); ctx.arc(ex, ey, er * 0.9, Math.PI * 1.6, Math.PI * 1.9); ctx.stroke();
      ctx.font = `${13 * U}px "Patrick Hand"`; ctx.fillStyle = rgb(PAL.ink); ctx.textAlign = 'center';
      ctx.fillText('1946 kabuğu', ex - er * 0.55, ey - er * 1.08); ctx.fillText('bugünkü kabuk', ex + er * 0.55, ey - er * 1.08);
      ctx.font = `${18 * U}px "Patrick Hand"`; ctx.fillStyle = vis.thin > 8 ? '#a0402a' : rgb(PAL.ink);
      ctx.fillText(vis.thin > 1 ? `%${Math.round(vis.thin)} daha ince` : 'kabuk sağlam', ex, ey + er + 26 * U);
      if (vis.thin > 12) ctx.fillText('kuluçkada kırılıyor!', ex, ey + er + 48 * U);
      ctx.textAlign = 'left';
    }
    tag(G.x1 / 2, G.gb - 8 * U, '🌾 dokun: sahneye dön', { fs: 12 });
    ctx.restore();
  }

  // =====================================================================
  // KONUŞMALAR VE MİZAH
  // =====================================================================
  function lines(kind) {
    const P = {
      farmer: vis.P > 2.6 ? ['Bu böcekler ilaçtan\nkorkmuyor artık!', 'Daha çok sıktık,\ndaha çok geldiler.', 'Uğur böceği de\nkalmadı ki!'] : vis.s > 0.5 ? ['Uçak geldi,\nböcek gitti!', 'Bu toz mucize!', 'Bu yıl rekor\nmısır!'] : vis.N > 0.7 ? ['Uğur böcekleri\nişini yapıyor.', 'Tarla dengede,\nben de keyifteyim.', 'Böcek var ama\nzarar az.'] : ['Böcek çok,\nne yapsak?', 'Mısır yaprakları\ndelik deşik.', 'Kooperatif ilaç\nbekliyor.'],
      robin: vis.s > 0.5 ? ['Öhö öhö!\nBu sis de ne?', 'Kanatlarım\ntitriyor...', 'Kurtlar zehirli\ntadıyor.'] : ['Cik cik!\nBahar geldi!', 'Bugün üç solucan\nbuldum!', 'Şarkı vakti!'],
      eagle: vis.thin > 10 ? ['Yumurtalarım\nkırılıyor...', 'Balıkların tadı\ntuhaf.', 'Gökyüzü boşaldı.'] : ['Bu göl bizim\nkrallığımız!', 'Balık bol,\nyavrular tok.', 'Kiiiir!'],
      nest: nest.cracked ? ['Kabuk kâğıt\ngibi ince...', 'Yumurtam\nkırıldı!'] : nest.chicks ? ['Cik! Cik!\nAcıktık!', 'Anne, balık\ngetirdin mi?'] : ['Sabırla\nbekliyoruz.', 'Sıcak tut,\nanne!'],
      heron: vis.D > 2 ? ['Balıklar ağır\nhasta gibi.', 'Bir balık, iki\nbalık... zehir.', 'Bu bataklık\nesrarengiz.'] : ['Sabır.\nBalık gelecek.', 'Tek ayak\ndaha rahat.', 'Hop! Yakaladım!'],
      bug: vis.R > 0.4 ? ['Ha ha! Biz artık\nDDT içiyoruz!', 'Annem de ilaca\ndayanıklıydı!', 'Sık bakalım,\nsık!'] : ['Vızzz!\nMısır tatlı.', 'Kaçın,\nuçak geliyor!', 'Kuşlar\nnerede?'],
      plane: ['Pırrr! Her yer\nilaçlanacak!', 'Tarla, bahçe,\nbataklık... hepsi!', 'Bugün bir\nilçe daha!'],
      official: ['İmzala,\nmüdür bey.', 'Kararınızı\nbekliyoruz.'],
    };
    return pick(P[kind] || ['...']);
  }
  function talkAt(x, y) {
    if (mode === 'game' && x > poster.x && x < poster.x + poster.w && y > poster.y && y < poster.y + poster.h) {
      sayAt(at(() => poster.x + poster.w / 2, () => poster.y), 'Afiş: "DDT benim için\niyidir!" (1947 reklamı)'); blip(); award('ddt-afis'); return true;
    }
    const c = [], add = (o, kind, fn) => { if (o && o.sx !== undefined) c.push({ d: Math.hypot(o.sx - x, o.sy - y), o, kind, fn }); };
    farmers.forEach(f => add({ sx: f.sx, sy: f.sy, get x() { return f.sx; }, get y() { return f.sy; } }, 'farmer'));
    robins.forEach(r => add({ sx: r.sx, sy: r.sy, get x() { return r.sx; }, get y() { return r.sy; } }, 'robin', chirp));
    eagles.forEach(e => add({ sx: e.sx, sy: e.sy, get x() { return e.sx; }, get y() { return e.sy; } }, 'eagle', eagleCry));
    add({ sx: nest.sx, sy: nest.sy + 20 * U, get x() { return nest.sx; }, get y() { return nest.sy; } }, 'nest', () => { if (nest.eggs && tapCount('nest') >= 3) award('ddt-yumurta'); });
    add({ sx: heron.sx, sy: heron.sy, get x() { return heron.sx; }, get y() { return heron.sy; } }, 'heron');
    bugs.slice(0, 4).forEach(b => add({ sx: b.sx, sy: b.sy, get x() { return b.sx; }, get y() { return b.sy; } }, 'bug', () => { if (vis.R > 0.4) award('ddt-sinek'); }));
    if (plane.on) add({ sx: plane.sx, sy: plane.sy, get x() { return plane.sx; }, get y() { return plane.sy; } }, 'plane');
    const truck = gags.find(g => g.type === 'truck' && g.sx !== undefined);
    if (truck) add({ sx: truck.sx, sy: truck.sy, get x() { return truck.sx; }, get y() { return truck.sy; } }, 'truck', () => award('ddt-kamyon'));
    if (official && official.x) add({ sx: official.x, sy: official.y, get x() { return official.x; }, get y() { return official.y; } }, 'official');
    if (!c.length) return false;
    c.sort((a, b) => a.d - b.d);
    const best = c[0];
    sayAt(best.o, best.kind === 'truck' ? 'Şoför: Çocuklar, sisin\narkasından koşmayın!' : lines(best.kind)); blip(); if (window.Camera) window.Camera.focus(best.o.x, best.o.y + 30 * U); // dokunulan yere yakınlaş
    if (best.fn) best.fn();
    return true;
  }
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || bubbles.length) return;
    if (!nextChat) nextChat = t + 7000;
    if (t < nextChat) return;
    nextChat = t + rnd(9000, 16000);
    const f = pick(farmers);
    const opts = [['farmer', { get x() { return f.sx; }, get y() { return f.sy; } }], ['heron', { get x() { return heron.sx; }, get y() { return heron.sy; } }]];
    const r = robins.find(x => x.sx !== undefined); if (r) opts.push(['robin', { get x() { return r.sx; }, get y() { return r.sy; } }]);
    const [kind, obj] = pick(opts);
    sayAt(obj, lines(kind));
  }

  // mizahi sahneler
  let nextGag = 0;
  function startGag(t) {
    const opts = [];
    if (vis.s > 0.3 && game.year < 1965) opts.push('truck');
    if (vis.s > 0.3) opts.push('salesman');
    if (vis.N > 0.6 && game.unlockedIpm) opts.push('ladies');
    if (vis.P > 2.4) opts.push('swarm');
    if (vis.S < 0.4) opts.push('silent');
    if (vis.B > 0.7) opts.push('fish');
    if (vis.R > 0.4 && vis.s > 0.3) opts.push('spray-more');
    if (!opts.length) return;
    const type = pick(opts);
    gags.push({ type, t0: t, dur: type === 'truck' ? 9000 : 6500 });
    const f = farmers[0], fo = { get x() { return f.sx; }, get y() { return f.sy; } };
    if (type === 'salesman') setTimeout(() => sayAt(fo, 'Satıcı: Yeni formül!\nİki kat güçlü!'), 600);
    if (type === 'ladies') sayAt(at(() => farmers[1].sx, () => farmers[1].sy), 'Bir kutu uğur böceği\ngeldi, salıyorum!');
    if (type === 'swarm') sayAt(fo, 'Böcekler ilacı\nyemek sanıyor!');
    if (type === 'silent') { const tr = W * lay.x1 * 0.53; sayAt({ x: tr, y: lay.gt * H }, 'Komşu: Bu bahar\nhiç kuş ötmedi...'); }
    if (type === 'fish') { eagleCry(); }
    if (type === 'spray-more') sayAt(fo, 'Geçen yıl bir kat,\nbu yıl iki kat sıktık!');
  }
  function drawGags(G, t, dt) {
    if (mode === 'game' && game.state === 'play') {
      if (!nextGag) nextGag = t + 15000;
      if (t > nextGag) { nextGag = t + rnd(17000, 27000); if (!gags.length) startGag(t); }
    }
    for (let i = gags.length - 1; i >= 0; i--) {
      const g = gags[i], k = (t - g.t0) / g.dur;
      if (k > 1) { gags.splice(i, 1); continue; }
      if (g.type === 'truck') {
        // sis kamyonu: 1940'larda çocuklar arkasından koşardı
        const x = lerp(-60 * U, G.x1 * 0.7, k), y = G.road + 6 * U;
        g.sx = x; g.sy = y - 30 * U;
        ctx.fillStyle = '#3a6a4a'; ctx.fillRect(x - 26 * U, y - 18 * U, 30 * U, 18 * U); ctx.fillStyle = '#d8d2c0'; ctx.fillRect(x + 4 * U, y - 14 * U, 12 * U, 14 * U);
        ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(x - 18 * U, y, 4 * U, 0, 6.283); ctx.arc(x + 9 * U, y, 4 * U, 0, 6.283); ctx.fill();
        for (let j = 0; j < 4; j++) { ctx.fillStyle = `rgba(246,246,240,${0.6 - j * 0.12})`; ctx.beginPath(); ctx.arc(x - 34 * U - j * 16 * U, y - 10 * U, (10 + j * 5) * U, 0, 6.283); ctx.fill(); }
        person(x - 60 * U, y + 4 * U, U * 0.65, { dir: 1, shirt: '#e0b04a', step: Math.sin(t * 0.03) * 3 });
        person(x - 80 * U, y + 4 * U, U * 0.6, { dir: 1, shirt: '#7aa7d6', hair: '#6a4a2a', step: Math.sin(t * 0.03 + 1) * 3 });
        if (!g.said && k > 0.3) { g.said = 1; sayAt({ get x() { return x - 60 * U; }, get y() { return y - 26 * U; } }, 'Sis kamyonu!\nArkasından koş!'); }
      }
      if (g.type === 'salesman') {
        const x = lerp(-30 * U, G.x1 * 0.12, smooth(0, 0.3, k)) - (k > 0.8 ? (k - 0.8) * G.x1 : 0), y = G.gt + G.gh * 0.3;
        person(x, y, U * 0.95, { dir: 1, shirt: '#4a5866', hat: '#3a3f46' });
        ctx.fillStyle = '#e0b04a'; ctx.fillRect(x + 8 * U, y - 26 * U, 9 * U, 12 * U); ctx.fillStyle = rgb(PAL.ink); ctx.font = `${6 * U}px Inter`; ctx.fillText('DDT', x + 8.5 * U, y - 18 * U);
      }
      if (g.type === 'ladies') {
        for (let j = 0; j < 8; j++) { const a = j * 0.8 + k * 6; const xx = farmers[1].sx + Math.cos(a) * (10 + k * 60) * U, yy = farmers[1].sy + 20 * U - k * 30 * U + Math.sin(a) * 10 * U; ctx.fillStyle = '#c0302a'; ctx.beginPath(); ctx.arc(xx, yy, 2.6 * U, 0, 6.283); ctx.fill(); }
      }
      if (g.type === 'fish') {
        const e = eagles.find(x => x.sx !== undefined); if (!e) continue;
        const fx = lerp(G.marsh + 80 * U, e.sx, smooth(0.4, 1, k)), fy = lerp(G.gt + G.gh * 0.4, e.sy, smooth(0.4, 1, k));
        ctx.fillStyle = '#6d8fa0'; ctx.beginPath(); ctx.ellipse(fx, fy, 6 * U, 2.6 * U, 0.3, 0, 6.283); ctx.fill();
      }
    }
  }

  // karar anında yanına gelen karakterler: Carson, EPA yetkilisi, çiftçi birliği
  let official = null;
  function drawBody(g, who, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    const shirt = who === 'carson' ? '#5a7a5a' : who === 'farm' ? '#3a6a9a' : '#4a5866';
    g.fillStyle = shirt; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    if (who === 'carson') { g.fillStyle = '#6a4a30'; g.beginPath(); g.arc(0, -39, 8.5, Math.PI, 0); g.fill(); g.fillRect(-8.5, -40, 3.5, 8); g.fillRect(5, -40, 3.5, 8); g.fillStyle = '#e8dcc0'; g.fillRect(9, -26, 10, 13); g.fillStyle = '#5a7a5a'; g.fillRect(10, -25, 8, 2); } // kitap
    else if (who === 'farm') { g.fillStyle = '#c9a45a'; g.beginPath(); g.ellipse(0, -43, 11, 3, 0, 0, 6.283); g.fill(); g.fillRect(-6, -50, 12, 7); }
    else { g.fillStyle = '#3a3f46'; g.beginPath(); g.ellipse(0, -43, 9, 3, 0, 0, 6.283); g.fill(); g.fillRect(-7, -49, 14, 6); g.fillStyle = '#efe9da'; g.fillRect(9, -28, 12, 15); }
    g.fillStyle = rgb(PAL.ink); g.beginPath(); g.arc(-2.6, -37, 1.2, 0, 6.283); g.arc(2.6, -37, 1.2, 0, 6.283); g.fill();
  }
  function portrait(who) {
    const c = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 120, h = 150;
    c.width = w * dpr; c.height = h * dpr; c.className = 'portrait';
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(w / 2, h - 8); g.scale(2.7, 2.7);
    drawBody(g, who, 0);
    return c;
  }
  function drawOfficial(G, t) {
    if (!official) return;
    const now = performance.now(), e = now - official.t0;
    const stopX = G.x1 * (mobile ? 0.3 : 0.34), startX = -40;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    const leaving = official.leave && now > official.leave;
    if (leaving) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = G.gt + G.gh * 0.3, s = 1.15 * U, walk = e < 1500 || leaving;
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
  const DONE_KEY = 'bny-bitti-ddt';
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
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-ddt', 'Başladı: Kuşlar Neden Sustu?'); enterGame(); }
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
    args.born = gs ? gs.y : 0; // bayatlama için doğduğu yıl
    toastQueue.push(args);
    while (toastQueue.length > 6) { const k = toastQueue.findIndex(a => !(a[4] || {}).pause); if (k < 0) break; toastQueue.splice(k, 1); }
    pumpToasts();
  }
  function pumpToasts() {
    if (!toastQueue.length || mode !== 'game') return;
    // iki yıldan eski küçük haberler atılır: 1949 olayı 1972'de çıkmasın
    for (let i = toastQueue.length - 1; i >= 0; i--) { const a = toastQueue[i]; if (!(a[4] || {}).pause && a.born !== undefined && gs.y - a.born > 2) toastQueue.splice(i, 1); }
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
    el.innerHTML = (opt.img ? `<img src="${opt.img}" alt="">` : `<div class="ic">${ic}</div>`) +
      `<div><span class="from">${from}</span>${text}${opt.pause ? '<button class="go">Devam →</button>' : '<span class="x">dokun: kapat</span>'}</div>`;
    if (opt.pause) { el.classList.add('pause'); game.reading = (game.reading || 0) + 1; }
    const close = () => {
      if (el.classList.contains('out')) return;
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
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 4500 + plain.length * 65)) / Math.sqrt(game.speed || 1)); // hız arttıkça kart da kısa kalır
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const YEAR = 4750 / FAST;
  let gs = M.newState();
  const game = {};
  const gS = $('g-s'), gIpm = $('g-ipm');
  const award = id => (window.Badges ? window.Badges.award(id) : false);
  const choiceQ = [];

  function resetGame() {
    gs = M.newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, fired: new Set(), hist: [], speed: 1, touched: false, reading: 0, story: false, endAfter: false,
      outbreaks: (() => { const o = []; while (o.length < 3) { const y = Math.round(1950 + Math.random() * 38); if (o.every(x => Math.abs(x - y) > 4)) o.push(y); } return o; })(), z: { f: 1, g: 1, m: 1 }, s: 0.1, ipm: 0, support: 70, replaced: false, inspected: false, carson: null, ban: false, unlockedIpm: false, year: M.Y0,
    });
    gS.value = 10; gS.disabled = false; $('w-s').classList.remove('locked');
    document.querySelectorAll('#zones button').forEach(b => b.classList.add('on')); $('zones').classList.remove('locked');
    gIpm.value = 0; gIpm.disabled = true; $('w-ipm').classList.add('locked'); $('o-ipm').textContent = "🔒 1962'de açılır";
    document.querySelectorAll('.coach').forEach(uncoach);
    readGameSliders();
    $('g-pause').textContent = '❚❚ Durdur'; setSpeed(1);
    $('modal').hidden = true; $('harvest').hidden = true; $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone');
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {};
    choiceQ.length = 0; gags.length = 0; nextGag = 0; official = null; mist.length = 0;
    Object.assign(nest, { eggs: 2, cracked: 0, chicks: 0 });
    Object.assign(vis, { P: 1.56, N: 1, B: 1, S: 1, Y: 1, D: 0, R: 0, s: 0.1, thin: 0 });
  }
  function readGameSliders() {
    game.s = game.ban ? 0 : gS.value / 100; game.ipm = game.unlockedIpm ? gIpm.value / 100 : 0;
    if (!game.ban) $('o-s').textContent = '%' + gS.value;
    if (game.unlockedIpm) $('o-ipm').textContent = '%' + gIpm.value;
  }
  [gS, gIpm].forEach(el => el.addEventListener('input', () => {
    initAudio(); readGameSliders();
    if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); }
  }));
  // nereye ilaçlanacağı: her yerin bedeli farklı
  document.querySelectorAll('#zones button').forEach(b => b.onclick = () => {
    initAudio(); const k = b.dataset.z; game.z[k] = game.z[k] ? 0 : 1; b.classList.toggle('on', !!game.z[k]);
    const msg = { f: game.z.f ? 'Tarla ilaçlanıyor: zararlı azalır, uğur böcekleri de ölür.' : 'Tarlaya ilaç yok: zararlıyı başka yolla azaltmak gerek.', g: game.z.g ? 'Bahçeler ve ağaçlar ilaçlanıyor: ötücü kuşlar zehirlenir.' : 'Bahçelere ilaç yok: ötücü kuşlar rahat.', m: game.z.m ? 'Bataklık ilaçlanıyor: sivrisinek azalır ama DDT suya, balığa, kartala gider.' : 'Bataklığa ilaç yok: sivrisinek şikâyeti artar ama göl temiz kalır.' }[k];
    // anında geri bildirim: kart kuyruğuna girmez, ilgili yerdeki çiftçi söyler
    const f = farmers[k === 'f' ? 0 : 2]; sayAt({ get x() { return k === 'm' ? geo().marsh + 60 * U : k === 'g' ? lay.x1 * W * 0.53 : f.sx; }, get y() { return k === 'f' ? f.sy : lay.gt * H + 10 * U; } }, msg.replace(': ', ':\n'));
  });
  $('g-pause').onclick = () => { game.paused = !game.paused; $('g-pause').textContent = game.paused ? '▶ Devam' : '❚❚ Durdur'; };
  function setSpeed(v) { game.speed = v; $('g-speed').textContent = v + '×'; $('yb-speed').querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.s) === v)); }
  $('g-speed').onclick = () => setSpeed(game.speed === 1 ? 2 : game.speed === 2 ? 4 : 1);
  $('yb-speed').querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); initAudio(); setSpeed(Number(b.dataset.s)); });

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

  const PLANE_IMG = '../../assets/img/cards/statelibqld-2-162299-cloud-spraying-for-mosquitos-at-norman-.jpg';
  const STORY = [
    ['🇺🇸', 'ABD · 1946', 'Savaş bitti. Askerleri tifüs ve sıtmadan koruyan "mucize toz" <b>DDT</b> artık çiftçilere satılıyor. Ucuz, etkili ve herkes zararsız sanıyor.', '', { pause: true, img: PLANE_IMG }],
    ['🧪', 'Kimya şirketi', '"Bir uçak dolusu DDT, bir tarla dolusu böceği bir günde bitirir!" İlçede ne kadar ilaçlanacağına tarım müdürü olarak sen karar vereceksin.', '', { pause: true }],
    ['✈️', 'Senin işin', 'Kaydırıcı ilaçlamayı belirler. Uçak tarlaya, bahçelere ve bataklığa sıkar. Böcekleri, ürünü ve gökyüzünü izle.', '', { ms: 9000 }],
    ['👨‍🌾', 'Çiftçi birliği', 'Mısırda kurt, bahçede sinek var. Çiftçiler ilaç bekliyor.', 'warn', { ms: 8000 }],
  ];
  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (game.started) return;
    game.started = true; game.story = true; // görev kartı kapanana kadar zaman durur
    const show = i => {
      if (mode !== 'game') return;
      if (i >= STORY.length) { game.story = false; return game.s <= 0.15 ? coach(gS, '👉 Kaydırıcıyı dene: ilaç ne değiştiriyor?', 12000) : null; }
      const [ic, from, text, tone, opt0] = STORY[i];
      const opt = wasDone ? { ...opt0, pause: false, ms: 6000 } : opt0; // tekrar oynayışta hikâye durdurmaz
      toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
      if (!opt.pause) setTimeout(() => show(i + 1), 6500 / Math.max(1, FAST / 2));
    };
    const start = () => { if (wasDone) game.story = false; setTimeout(() => show(0), 300); };
    if (window.Mission && !window.__mSeen && (window.__mSeen = 1)) window.Mission.show($('modal'), MISSION, start); else start();
  }
  function updateGame(dt) {
    if (mode !== 'game' || game.paused || game.reading || game.story || game.state !== 'play' || gs.y > M.Y1) return;
    const visible = $('toasts').querySelector('.toast:not(.out)');
    const pace = visible ? 1.5 : toastQueue.length ? 0.95 : 0.47;
    const dur = YEAR * (gs.y < M.Y0 + 2 ? 1.5 : game.ban ? 0.7 : 1) / game.speed;
    game.frac += dt / (dur * pace);
    if (game.frac >= 1) { game.frac -= 1; yearTick(); }
  }
  function choice(from, title, text, opts, who) {
    if (game.state === 'choice') { choiceQ.push([from, title, text, opts, who]); return; }
    game.state = 'choice'; // seçilen hız korunur (testçi: her kartta 1×'e dönmesin)
    const m = $('modal');
    m.innerHTML = `<div class="card talk"><div class="who"></div><div><div class="from">${from}</div><h2>${title}</h2><p class="speech">${text}</p><div class="opts"></div></div></div>`;
    m.querySelector('.who').appendChild(portrait(who || 'off'));
    const box = m.querySelector('.opts');
    opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'opt';
      b.innerHTML = `${o.label}<small>${o.sub}</small>`;
      b.onclick = () => {
        m.hidden = true; game.state = 'play'; initAudio(); o.fn(); if (official) official.leave = performance.now() + 1800;
        if (choiceQ.length && game.state === 'play' && !game.replaced) setTimeout(() => choice(...choiceQ.shift()), 900);
        else if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
      };
      box.appendChild(b);
    });
    m.hidden = false;
  }
  function unlockIpm(text) {
    if (game.unlockedIpm) return;
    game.unlockedIpm = true; gIpm.disabled = false; $('w-ipm').classList.remove('locked'); readGameSliders();
    milestone('🐞', 'Biyolog', text, '', () => coach(gIpm, '👉 Kaydır: doğal mücadele'));
  }

  function yearTick() {
    const y = gs.y; game.year = y;
    const hot = game.outbreaks.includes(y);
    M.step(gs, { s: game.s, ipm: game.ipm, ban: game.ban ? 1 : 0, z: game.z, heat: hot ? 2.6 : 1 });
    if (hot) toast('🔥', 'Tarla raporu', 'Sıcak yaz: zararlılar patladı! Doğal düşmanı ya da ilacı az olan tarla zarar görüyor.', 'bad');
    if (game.outbreaks.includes(y + 1) && y < M.Y1) milestone('🌡️', 'Hava tahmini', '<b>Gelecek yaz</b> çok sıcak ve nemli geçecek: zararlılar patlayabilir. Hazırlıklı ol.', 'warn');
    const h = gs.hist[gs.hist.length - 1];
    game.hist.push(h);
    nestYear(h);
    // çiftçilerin desteği: ürün iyiyse artar, böcek patlarsa düşer
    if (!game.replaced) {
      const pre = !game.ban && y < 1972;
      game.support = clamp(game.support + (h.Y - 0.93) * 40 + (h.P > 2.6 ? -5 : 0) + (pre && !game.z.m ? -2.5 : 0) + (pre && !game.z.g && y > 1950 ? -1.2 : 0), 0, 100);
      if (pre && !game.z.m && y < 1952) once('mosq', () => toast('🦟', 'Mahalle', 'Bataklık ilaçlanmayınca sivrisinek arttı. Bu yıllarda ABD\'de sıtmayla savaşın ana silahı DDT\'ydi; halk kızgın.', 'warn'));
      if (pre && !game.z.g && y > 1952) once('elm', () => toast('🌳', 'Mahalle', 'Bahçeler ilaçlanmayınca karaağaç hastalığı yayılıyor, sokak ağaçları kuruyor. Komşular şikâyetçi.', 'warn'));
    }
    const yp = Math.round(h.Y * 100);
    $('yb-harvest').textContent = `🌽 %${yp}`; $('yb-harvest').style.color = yp >= 95 ? 'var(--green)' : yp >= 80 ? 'var(--grain)' : 'var(--danger)';
    if (yp >= 108) once('rekor', () => toast('🌽', 'Çiftçi birliği', `Rekor hasat: normalin <b>%${yp}</b> kadarı! Herkes DDT'yi övüyor.`, 'good'));

    if (y === 1948) milestone('🏅', 'Stockholm', 'DDT\'nin böcek öldürdüğünü bulan Paul Müller <b>Nobel</b> ödülü aldı.');
    if (h.R > 0.3) once('res', () => toast('🧬', 'Çiftçi', 'Böcekler ilaca alışıyor! Her sıkışta dayanıklılar hayatta kalıp çoğalıyor. Aynı etki için daha çok sıkmak gerekiyor.', 'warn'));
    if (h.N < 0.4) once('lady', () => toast('🐞', 'Bahçıvan', 'Uğur böcekleri ve yaban arıları da öldü. Zararlıları yiyen kalmadı.', 'bad'));
    if (h.S < 0.5) once('robin', () => toast('🐦', 'Mahalle', 'Bu bahar ağaçlarda kuş sesi az. Çimlerde ölü ardıç kuşları var.', 'bad'));
    if (h.thin > 8) once('thin', () => toast('🥚', 'Kuş gözlemcisi', 'Kartal yuvasındaki yumurtalar kuluçkada kırılıyor. Kabukları çok ince.', 'bad'));
    if (h.P > 2.6 && h.s > 0.4) once('treadmill', () => toast('🔁', 'Tarla raporu', 'Daha çok ilaç, daha çok böcek! Faydalı böcekler öldü, zararlılar dirençli. Buna <b>pestisit çarkı</b> deniyor.', 'bad'));
    if (y === 1958 && h.S < 0.85) milestone('✉️', 'Bir mektup', 'Olga Huckins, sivrisinek ilaçlamasından sonra bahçesindeki kuşların öldüğünü biyolog bir arkadaşına yazdı: <b>Rachel Carson</b>\'a.');
    if (y === 1962) {
      comeOfficial('carson', 'Kitabımı okudunuz mu?');
      choice('Biyolog Rachel Carson', '"Sessiz Bahar" yayımlandı', '"Zehri tarlaya serptik, şimdi besin zincirinde yukarı tırmanıyor: böcekten balığa, balıktan kuşa. Böyle giderse bir bahar sabahı hiç kuş sesi duymayacağız." Kimya şirketleri kitaba "histerik" diyor.', [
        { label: 'Kitabı ciddiye al', sub: 'Doğal mücadele açılır, şirket kızar', fn: () => { game.carson = true; award('ddt-carson'); game.support = clamp(game.support - 8, 0, 100); unlockIpm('Uğur böcekleri, yaban arıları, kuş evleri ve ekim nöbeti: zararlıyı doğal düşmanlarıyla azalt. Az ilaç, aynı ürün.'); } },
        { label: 'Şirkete güven', sub: 'İlaçlama aynen sürer', fn: () => { game.carson = false; toast('🧪', 'Kimya şirketi', '"Bilim bizden yana. Sakin olun, sıkmaya devam!"'); } },
      ], 'carson');
    }
    if (y === 1963) milestone('🦅', 'Yaban Hayatı Servisi', h.B < 0.4 ? 'Ülke genelinde yalnız <b>417 kel kartal çifti</b> kaldı.' : 'Ülke genelinde yalnız 417 kel kartal çifti kaldı. Senin ilçende kartallar hâlâ yuva yapıyor.', h.B < 0.4 ? 'bad' : 'warn');
    if (h.D > 0.6) once('chain1', () => { setChain(true, 8000); toast('🔗', 'Besin zinciri', 'Zehir nereye gidiyor? Basamak basamak bak: her yiyen, yediğinin zehrini biriktiriyor. Sol üstteki zincire dokunarak bu görünümü istediğin zaman açabilirsin.', 'warn'); });
    if (y === 1967 && h.D > 0.8) { setChain(true, 9000); milestone('🔬', 'Bilim insanları', `Bataklıkta ölçtüler: planktonda <b>${ppm(M.chain(h.D).plankton)} ppm</b>, kuşta <b>${ppm(h.bird)} ppm</b>. Zehir her basamakta katlanıyor!`, 'bad'); const c = $('chain'); c.classList.add('hot'); setTimeout(() => c.classList.remove('hot'), 9000); }
    if (y === 1972 && !game.ban) {
      game.ban = true; gS.value = 0; gS.disabled = true; $('zones').classList.add('locked'); $('w-s').classList.add('locked'); $('o-s').textContent = "🔒 1972'de yasaklandı"; readGameSliders();
      milestone('⚖️', 'Çevre Koruma Ajansı (EPA)', 'Haziran 1972: DDT ABD\'de tarımda <b>yasaklandı</b>. Zehir ise toprakta ve suda yıllarca kalacak.', '', () => { if (!game.unlockedIpm) unlockIpm('İlaç yasaklandı, böcekler kaldı. Doğal düşmanlarla mücadele zamanı.'); });
    }
    if (game.ban && h.B > 0.3 && h.B > (game.hist[game.hist.length - 4] || h).B + 0.05) once('back', () => toast('🦅', 'Kuş gözlemcisi', 'Kartallar yeniden yuva yapıyor! Ama zehir topraktan yavaş çıkıyor.', 'good'));
    if (game.ban && h.P > 2.4 && game.ipm < 0.4) once('need-ipm', () => { toast('👨‍🌾', 'Çiftçi', 'İlaç yok, böcek çok! Doğal mücadeleyi artırın.', 'warn'); coach(gIpm, '👉 Kaydır: doğal mücadele'); });
    if (game.ban && h.B > 0.3) once('b30', () => milestone('🦅', 'Kuş gözlemcisi', 'Kartallar yeniden yuva yapıyor. Yumurtalar artık kırılmadan çatlıyor, yavrular çıkıyor!', 'good'));
    if (game.ban && h.S > 0.7 && (game.hist.some(x => x.S < 0.5))) once('s70', () => toast('🐦', 'Mahalle', 'Bu bahar ağaçlarda yine kuş sesi var.', 'good'));
    if (y === 1983) milestone('🇹🇷', 'Türkiye', '1980\'lerde Türkiye de DDT\'yi tarımda yasakladı. Ama zehir yavaş gider: Söke Ovası\'nda yıllar sonra bile toprakta kalıntısı bulundu.', '');
    if (game.support < 30 && !game.replaced) once('warn-sup', () => { toast('📞', 'Çiftçi birliği', 'Telefon çalıyor: "Mısırı böcek yedi, sen ne yapıyorsun?"', 'warn'); if (game.s < 0.5 && !game.ban && !game.unlockedIpm) coach(gS, '👉 Çiftçiler kızıyor: ilacı artır'); });
    // çiftçiler ancak ilaç azken "daha çok sık" der; zaten çok sıkılıyorsa çarktan yakınırlar
    if (game.support <= 0 && !game.replaced && !game.ban) {
      if (game.s < 0.5 && h.Y < 0.92) farmUnion();
      else once('angry-high', () => toast('😩', 'Çiftçi birliği', 'Bu kadar ilaç sıkıyoruz, böcek yine bitmiyor! Paramız da bitti. Başka bir yol yok mu?', 'bad'));
    }

    if (gs.y > M.Y1 && game.state === 'play') endGame();
    else if (gs.y > M.Y1) game.endAfter = true;
  }
  function farmUnion() {
    if (game.inspected || game.replaced) return;
    game.inspected = true; comeOfficial('farm', 'Böcekler mısırı bitirdi!');
    choice('Çiftçi birliği başkanı', 'Sabır tükendi', '"Mısırı böcek yedi. İlaçlamayı hemen <b>en az %70</b> yap, yoksa seni görevden aldıracağız."', [
      { label: 'Tamam, ilacı artırıyorum', sub: 'İlaçlama en az %70 olur', fn: () => { gS.value = Math.max(Number(gS.value), 70); readGameSliders(); game.support = 40; toast('✈️', 'Havaalanı', 'Uçaklar yeniden havalandı.', 'warn'); } },
      { label: 'Hayır, kuşları zehirlemem', sub: 'Görevden alınırsın, oyun biter', fn: () => { game.replaced = true; toast('📜', 'İlçe meclisi', 'Görevden alındın. Yerine gelen ilk iş uçakları çağırdı.', 'bad'); endGame(); } },
    ], 'farm');
  }

  function awardEnd() {
    if (game.replaced || gs.y <= M.Y1) return;
    const hs = game.hist;
    if (Math.min(...hs.map(h => h.B)) >= 0.5) award('ddt-kartal');
    const avgY = hs.reduce((a, h) => a + h.Y, 0) / hs.length, avgS = hs.reduce((a, h) => a + h.s, 0) / hs.length;
    const minY = Math.min(...hs.filter(h => h.y >= 1962).map(h => h.Y));
    if (avgY >= 0.93 && avgS <= 0.3 && minY >= 0.85) award('ddt-hasat');
    // yasa beklemeden: 1972'den önce en az 5 yıl üst üste hiç ilaçlama
    let run = 0, best = 0; hs.forEach(h => { if (h.y < 1972 && h.s === 0) { run++; best = Math.max(best, run); } else run = 0; });
    if (best >= 5) award('ddt-erken');
  }
  function endGame() {
    if (game.state === 'end') return;
    awardEnd();
    game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-ddt', 'Bitirdi: Kuşlar Neden Sustu?');
    maxSeen = slides.length - 1; paintDots(); replayNav();
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 1600);
  }

  function renderResult() {
    if (!game.hist.length || (gs.y <= M.Y1 && !game.replaced)) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const hs = game.hist, last = hs[hs.length - 1], n = hs.length, hh = HISTORY.hist.slice(0, n), hl = hh[hh.length - 1];
    const bY = Math.round(last.B * 100), bH = Math.round(hl.B * 100);
    const yY = Math.round(hs.reduce((a, h) => a + h.Y, 0) / n * 100), yH = Math.round(hh.reduce((a, h) => a + h.Y, 0) / n * 100);
    const pY = Math.max(...hs.map(h => h.bird)), pH = Math.max(...hh.map(h => h.bird));
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'Kuşları savundun ve koltuğunu kaybettin. Carson da yıllarca "histerik" diye suçlandı. Doğruyu bilmek yetmiyor; sistemin de seni dinlemesi gerekiyor.'; }
    else if (Math.min(...hs.map(h => Math.min(h.B, h.S))) >= 0.5 && yY >= 92) { title = 'Bahar sessiz kalmadı'; text = 'Hem ürünü korudun hem kartalları. Sırrı zararlıyla doğanın kendi düşmanlarıyla savaşmaktı. Tarihte bunu öğrenmek otuz yıl sürdü.'; }
    else if (Math.min(...hs.map(h => Math.min(h.B, h.S))) >= 0.25) { title = 'Kuşlar zor kurtuldu'; text = 'Gökyüzü bir süre seyreldi ama tamamen susmadı. İlacı geç de olsa azaltman işe yaradı.'; }
    else { title = 'Sessiz bahar'; text = 'Böceklere karşı savaşı kazandın sandın; böcekler ilaca alıştı, kartallar ise yumurtalarını kaybetti. Tebrikler, tarihi başarıyla tekrarladın.'; }
    const col = v => v >= 70 ? 'var(--green)' : v >= 40 ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">${game.replaced ? (gs.y - 1) + ' · görevden alındın' : '1990 · görev süren doldu'}</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${window.SceneUtils ? window.SceneUtils.bestLine('ddt', Math.min(last.B, last.S) * 100, 'kuşların durumu', !game.replaced) : ''}
      <div class="rgrid">
        <div><div class="y">Kartallar</div><div class="v" style="color:${col(bY)}">%${bY}</div><div class="h">tarihte: %${bH}</div></div>
        <div><div class="y">Ortalama ürün</div><div class="v" style="color:${yY >= 95 ? 'var(--green)' : yY >= 85 ? 'var(--grain)' : 'var(--danger)'}">%${yY}</div><div class="h">tarihte: %${yH}</div></div>
        <div><div class="y">Kuşta en çok DDT</div><div class="v" style="color:${pY < 20 ? 'var(--green)' : pY < 45 ? 'var(--grain)' : 'var(--danger)'}">${ppm(pY)} ppm</div><div class="h">tarihte: ${ppm(pH)} ppm</div></div>
      </div>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return d ? `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>` : ''; }).join('')}</div>` : ''}
      <canvas class="rchart" id="rchart"></canvas>
      <div class="legend"><span style="--c:#b5543c">Zararlı</span><span style="--c:#c29a2e">Ürün</span><span style="--c:#7a5a3a">Kartal</span><span style="--c:#9c6b47">Ötücü kuş</span><span style="--c:#9aa59a">Tarihteki kartal (kesikli)</span></div>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button><a class="hbtn" href="../../#bolumler">☰ Tüm bölümler</a></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(slideOf('game')); };
    $('r-next').onclick = () => goTo(slideOf('sandbox'));
    requestAnimationFrame(drawResultChart);
  }
  function lineChart(c, series, n, opts) {
    if (window.SceneUtils) return window.SceneUtils.lineChart(c, series, n, opts || {}); // uç etiketleri ve yıl ekseni
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const pad = 10, X = i => pad + (i / Math.max(1, n - 1)) * (w - pad * 2), Y = v => pad + (1 - clamp(v)) * (h - pad * 2);
    g.strokeStyle = 'rgba(43,58,46,.12)'; g.lineWidth = 1;
    for (let k = 4; k < n; k += 10) { g.beginPath(); g.moveTo(X(k), pad); g.lineTo(X(k), h - pad); g.stroke(); }
    series.forEach(s => {
      if (!s.data.length) return;
      g.strokeStyle = s.color; g.lineWidth = s.dash ? 1.8 : 3; g.lineJoin = 'round'; g.lineCap = 'round';
      g.setLineDash(s.dash ? [5, 5] : []);
      g.beginPath(); s.data.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke();
    });
    g.setLineDash([]);
  }
  const series = hist => [
    { data: hist.map(d => d.Y / 1.25), color: '#c29a2e', label: 'Ürün', fmt: v => '%' + Math.round(v * 125) },
    { data: hist.map(d => d.P / M.PK), color: '#b5543c', label: 'Zararlı', fmt: v => '%' + Math.round(v * 100) },
    { data: hist.map(d => d.S), color: '#9c6b47', label: 'Ötücü kuş', fmt: v => '%' + Math.round(v * 100) },
    { data: hist.map(d => d.B), color: '#7a5a3a', label: 'Kartal', fmt: v => '%' + Math.round(v * 100) },
  ];
  function drawResultChart() { lineChart($('rchart'), [{ data: HISTORY.hist.map(d => d.B), color: '#9aa59a', dash: true, label: 'Tarihte kartal', fmt: v => '%' + Math.round(v * 100) }, ...series(game.hist)], TOTAL, { y0: M.Y0 }); }

  // =====================================================================
  // LABORATUVAR (1946–2000)
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: M.newState(), p: { ...M.DEF }, preset: null };
  function readSliders() {
    sb.p.s = $('p-s').value / 100; sb.p.ipm = $('p-ipm').value / 100; sb.p.res = $('p-res').value / 100; sb.p.ban = 0;
    $('o-ps').textContent = '%' + $('p-s').value; $('o-pipm').textContent = '%' + $('p-ipm').value; $('o-pres').textContent = '×' + sb.p.res.toFixed(1).replace('.', ',');
  }
  ['p-s', 'p-ipm', 'p-res'].forEach(id => $(id).addEventListener('input', () => { readSliders(); sb.preset = null; document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: null, none: [0, 0, 100], smart: [10, 100, 100], heavy: [100, 0, 100] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset]; sb.preset = b.dataset.preset;
    if (v) ['p-s', 'p-ipm', 'p-res'].forEach((id, i) => $(id).value = v[i]);
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
      if (sb.st.y > 2000) sb.st = M.newState();
      if (sb.preset === 'history') { const hp = M.histP(sb.st.y); sb.p.s = hp.s; sb.p.ipm = hp.ipm; $('p-s').value = Math.round(hp.s * 100); $('p-ipm').value = Math.round(hp.ipm * 100); $('o-ps').textContent = '%' + Math.round(hp.s * 100); $('o-pipm').textContent = '%' + Math.round(hp.ipm * 100); }
      M.step(sb.st, sb.p);
      if (sb.st.hist.length) nestYear(sb.st.hist[sb.st.hist.length - 1]);
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() {
    const h = sb.st.hist[sb.st.hist.length - 1];
    $('sb-year').textContent = String(h ? h.y : 1946);
    $('sb-harvest').textContent = `Kuşta DDT: ${h ? ppm(h.bird) : 0} ppm · Ürün: %${h ? Math.round(h.Y * 100) : 100}`;
  }
  function drawSbChart() { lineChart($('sb-chart'), series(sb.st.hist), 55, { y0: M.Y0 }); }

  // =====================================================================
  // DOKUNMA VE DÖNGÜ
  // =====================================================================
  cv.addEventListener('pointerdown', e => { initAudio(); if (cview.k > 0.5) { setChain(false); return; } if (mode === 'game' || mode === 'sandbox' || mode === 'title') talkAt(e.clientX, e.clientY); });
  $('chain').addEventListener('click', e => { e.stopPropagation(); initAudio(); setChain(cview.want < 0.5); blip(); });

  let last = performance.now(), bgTick = 0, lastBg = '';
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    updateGame(dt); updateSandbox(dt); ambientChat(now);
    if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
    const src = mode === 'sandbox' ? sb.st : (mode === 'game' || mode === 'result') ? gs : null;
    const h = src && src.hist.length ? src.hist[src.hist.length - 1] : null;
    const sNow = mode === 'sandbox' ? sb.p.s : mode === 'game' ? game.s : 0;
    if (h) Object.assign(target, { P: h.P, N: h.N, B: h.B, S: h.S, Y: h.Y, D: h.D, R: h.R, thin: h.thin, s: sNow });
    else Object.assign(target, { P: 1.56, N: 1, B: 1, S: 1, Y: 1, D: 0, R: 0, thin: 0, s: sNow });
    const k = 1 - Math.pow(0.93, dt / 16);
    for (const key of Object.keys(target)) vis[key] = lerp(vis[key], target[key], key === 's' ? k * 2 : k * 0.5);
    const health = 0.35 * vis.B + 0.25 * vis.S + 0.25 * clamp(vis.Y) + 0.15 * vis.N;
    vis.bad = lerp(vis.bad, smooth(0.15, 0.7, 1 - health), k * 0.5);
    if (cview.until && performance.now() > cview.until && !cview.user) setChain(false);
    if (mode !== 'game' && mode !== 'sandbox') cview.want = 0;
    cview.k = lerp(cview.k, cview.want, 1 - Math.pow(0.9, dt / 16));
    if (window.SceneUtils && window.SceneUtils.fullView) window.SceneUtils.fullView(cview.k > 0.5);
    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);
    try { render(now, dt); } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } } // çizim hatası döngüyü durdurmasın
    if (mode === 'game') {
      // yıl çubuğu son işlenen yılı gösterir; kartlar da o yıla aittir
      const yy = String(Math.max(M.Y0, Math.min(gs.y - 1, M.Y1)));
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = eraName(Math.min(gs.y, M.Y1)); $('g-date').textContent = yy;
      $('yb-fill').style.width = clamp((gs.hist.length + game.frac) / TOTAL) * 100 + '%';
      const c = M.chain(vis.D);
      $('c-w').textContent = ppm(c.water); $('c-p').textContent = ppm(c.plankton); $('c-f').textContent = ppm(c.fish); $('c-b').textContent = ppm(c.bird);
      $('m-p').style.width = clamp(vis.P / M.PK) * 100 + '%';
      $('m-y').style.width = clamp(vis.Y / 1.25) * 100 + '%';
      $('m-n').style.width = clamp(vis.N) * 100 + '%';
      $('m-b').style.width = clamp(vis.B) * 100 + '%';
      $('m-s').style.width = clamp(vis.S) * 100 + '%';
      $('m-trust').style.width = game.support + '%';
      $('m-trust').parentElement.parentElement.classList.toggle('low', game.support < 30);
    }
    if (++bgTick % 6 === 0) { const bg = rgb(mixC(PAL.bgOk, PAL.bgBad, vis.bad)); if (bg !== lastBg) { document.documentElement.style.setProperty('--bg', bg); lastBg = bg; } }
    if (AC && buzzGain && bgTick % 10 === 0) { buzzGain.gain.setTargetAtTime(clamp((vis.P - 1.5) / 2.5) * 0.08, AC.currentTime, 0.6); motorGain.gain.setTargetAtTime(plane.on ? 0.05 : 0, AC.currentTime, 0.3); }
    requestAnimationFrame(frame);
  }

  resetGame();
  if (wasDone) { paintDots(); replayNav(); }
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, sb, vis, nest, poster, plane, gags, farmers, bugs, M, get gs() { return gs; }, get mode() { return mode; }, gag: () => { nextGag = 1; }, go: m => { maxSeen = slides.length; goTo(slideOf(m)); } };
  window.addEventListener('resize', resize);
  resize();
  goTo(0);
  requestAnimationFrame(frame);
})();
