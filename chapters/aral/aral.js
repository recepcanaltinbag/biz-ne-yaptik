// Bölüm 3 — Çöle Dönen Deniz (Aral Gölü, 1960–2010)
(() => {
  'use strict';
  const MISSION = {"title": "Çöle Dönen Deniz · Aral, 1960", "role": "Orta Asya'nın su planlamacısısın.", "control": "🌱 Tek kaydırıcı: nehir suyunun ne kadarı <b class=\"inl\">tarlaya</b> gitsin? Kalanı <b class=\"inl\">göle</b> akar.", "goal": "Moskova'nın pamuk planını tuttur, ama gölü de yaşat.", "watch": "Göl her yıl buharlaşır. Gelen su azsa küçülür."};
  const M = window.AralModel;
  const $ = id => document.getElementById(id);
  const { clamp, smooth } = M;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmtX = v => v.toFixed(2).replace('.', ',').replace(/0$/, '') + '×';

  const TOTAL = M.Y1 - M.Y0 + 1; // 51 yıl
  const PLAN = { 1965: 1.3, 1970: 1.55, 1975: 1.75, 1980: 1.9, 1985: 2.0, 1990: 2.0, 1995: 1.85, 2000: 1.85 };
  const targetFor = y => {
    // hedef bir sonraki değerlendirmeye doğru her yıl biraz artar: tek ayar beş yıl yetmez
    const ks = Object.keys(PLAN).map(Number); let k0 = 1960, v0 = 1;
    for (const k of ks) { if (y <= k) return v0 + (PLAN[k] - v0) * clamp((y - k0) / (k - k0)); k0 = k; v0 = PLAN[k]; }
    return v0;
  };
  const planName = y => y <= 1965 ? 'Yedi Yıllık Plan (1959–65)' : y <= 1970 ? '8. Beş Yıllık Plan' : y <= 1975 ? '9. Beş Yıllık Plan' : y <= 1980 ? '10. Beş Yıllık Plan' : y <= 1985 ? '11. Beş Yıllık Plan' : y <= 1991 ? '12. Beş Yıllık Plan' : 'Bağımsız Özbekistan';
  const HISTORY = M.run(TOTAL, M.histP);

  // =====================================================================
  // SES — rüzgâr, dalga, martı, su sıçraması, korna
  // =====================================================================
  let AC = null, master, waveGain, windGain, noiseBuf, muted = /[?&](debug|hizli|sessiz)\b/.test(location.search) || (() => { try { return localStorage.getItem('bny-ses') === '0'; } catch (e) { return false; } })(); // test sırasında ya da oyuncu kapattıysa ses çıkmasın
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
      windGain = loop(380, 'lowpass', 0.5, 0.03);
      waveGain = loop(700, 'bandpass', 0.7, 0);
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
  const gullCry = () => { tone(1500, 900, 0.25, 0.03, 'triangle'); setTimeout(() => tone(1400, 800, 0.2, 0.025, 'triangle'), 230); };
  const splash = () => tone(600, 120, 0.18, 0.04);
  const horn = () => { tone(180, 170, 0.6, 0.05, 'sawtooth'); };
  const blip = () => tone(880, 660, 0.12, 0.03, 'triangle');
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
      L.gb = clamp((top - 6) / H, 0.4, 0.88); L.gt = Math.max(0.3, L.gb - (mobile ? 0.34 : 0.4));
      if (!document.body.classList.contains('dock') && !mobile) { L.gt = 0.55; L.gb = 1; L.x1 = (W - 366) / W; }
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') { L.gt = 0.78; }
    if (m === 'sandbox') { if (mobile) { L.gt = 0.22; L.gb = 0.46; } else { L.gt = 0.5; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.6, gb: 1, x1: 1 };

  const PAL = {
    bgOk: [233, 240, 222], bgBad: [240, 226, 204],
    skyOk: [214, 232, 238], skyDust: [226, 214, 190],
    steppe: [208, 200, 156], steppeDry: [222, 206, 170], sand: [226, 210, 172], salt: [246, 244, 236],
    water: [91, 147, 184], waterDeep: [64, 116, 158], waterSalty: [120, 160, 168],
    mount: [176, 164, 150], snow: [250, 250, 248],
    leaf: [110, 150, 88], leafDry: [170, 160, 110], boll: [252, 252, 248],
    ink: [43, 58, 46], rust: [150, 92, 62], hull: [70, 92, 110], sun: [246, 210, 104],
  };

  const vis = { A: 1, sal: 10, F: 1, C: 1, w: 0.2, dust: 0, soil: 1, bad: 0, Vn: 0 };
  const target = { A: 1, sal: 10, F: 1, C: 1, w: 0.2, dust: 0, soil: 1, Vn: 0 };
  const bubbles = [], floats = [], pickers = [], boats = [], gulls = [], fishJumps = [], dust = [], gags = [];
  const clouds = Array.from({ length: 3 }, () => ({ x: rnd(0, 1), y: rnd(0.08, 0.22), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000012) }));
  const SHIPS = [0.69, 0.75, 0.82, 0.895].map((f, i) => ({ f, i, x: 0, y: 0, tilt: 0, stuck: 0, said: 0 }));
  const camel = { x: 0, dir: 1, on: 0, ph: 0, sx: 0, sy: 0 };
  const elder = { x: 0, y: 0 }, kid = { x: 0, y: 0 }, puddle = { x: 0, y: 0, on: 0 };
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};
  for (let i = 0; i < 4; i++) gulls.push({ x: rnd(0.6, 0.95), y: rnd(0.15, 0.35), vx: rnd(-0.6, 0.6), ph: rnd(0, 6) });

  // ekran geometrisi: kıyı, su seviyesi, nehir
  function geo() {
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H, gh = gb - gt;
    const dry = clamp(1 - vis.A);
    const shore0 = x1 * 0.6, shoreX = lerp(shore0, x1 * 0.975, Math.pow(dry, 0.9));
    const water0 = gt + gh * 0.07, waterY = water0 + dry * gh * 0.1;
    const ry = gt + gh * 0.17, xi = x1 * 0.22;
    return { x1, gt, gb, gh, dry, shore0, shoreX, water0, waterY, ry, xi };
  }
  const riverY = (x, G) => G.ry + Math.sin(x * 0.012) * 4 * U + Math.sin(x * 0.031 + 1) * 2 * U;

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
  function sayAt(obj, text) { bubbles.length = 0; bubbles.push({ obj, text, life: 1 }); }

  // basit insan: yuvarlak kafa, iki nokta göz; dir yalnız yatayda çevirir
  function person(x, y, s, o = {}) {
    const dir = o.dir || 1, st = o.step || 0, bend = o.bend || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.beginPath(); ctx.ellipse(0, 1, 10, 2.6, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(-3 - st, 0); ctx.moveTo(2, -9); ctx.lineTo(3 + st, 0); ctx.stroke();
    ctx.save(); ctx.translate(0, -9); ctx.rotate(bend);
    ctx.fillStyle = o.shirt || '#6b8db5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -18, 14, 19, 5) : ctx.rect(-7, -18, 14, 19); ctx.fill();
    if (o.bag) { ctx.fillStyle = '#efe9da'; ctx.beginPath(); ctx.ellipse(-8, -6, 5, 7, 0.2, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = o.skin || '#e9c49d'; ctx.beginPath(); ctx.arc(0, -24, 6.5, 0, 6.283); ctx.fill();
    if (o.scarf) { ctx.fillStyle = o.scarf; ctx.beginPath(); ctx.arc(0, -25.5, 7, Math.PI, 0); ctx.fill(); ctx.fillRect(-7, -26, 3, 7); }
    if (o.cap) { ctx.fillStyle = o.cap; ctx.fillRect(-6.5, -32, 13, 4); ctx.fillRect(0, -29, 9, 2); }
    if (o.beard) { ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.arc(0, -20.5, 4.8, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(2.2, -25, 1.1, 0, 6.283); ctx.arc(-1.8, -25, 1.1, 0, 6.283); ctx.fill();
    if (o.arm) { ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(4, -14); ctx.lineTo(10, -14 + o.arm); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  }

  function drawShip(sh, G, t) {
    const x = sh.f * G.x1; sh.x = x;
    const afloat = x > G.shoreX + 16 * U;
    sh.stuck = lerp(sh.stuck, afloat ? 0 : 1, 0.02);
    const bed = G.water0 + (x - G.shore0) / (G.x1 - G.shore0) * G.gh * 0.16 + 6 * U;
    const y = afloat ? G.waterY + Math.sin(t * 0.0018 + sh.i) * 1.6 * U : lerp(G.waterY, bed, sh.stuck);
    sh.y = y; sh.tilt = sh.stuck * (sh.i % 2 ? -0.16 : 0.12);
    const s = U * (mobile ? 0.8 : 1) * (0.9 + 0.08 * sh.i);
    ctx.save(); ctx.translate(x, y); ctx.rotate(sh.tilt); ctx.scale(s, s);
    const hull = mixC(PAL.hull, PAL.rust, sh.stuck);
    ctx.fillStyle = rgb(hull); ctx.beginPath(); ctx.moveTo(-30, -10); ctx.lineTo(32, -10); ctx.lineTo(24, 4); ctx.lineTo(-24, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgb(mixC([236, 232, 220], [200, 170, 140], sh.stuck)); ctx.fillRect(-14, -22, 20, 12);
    ctx.fillStyle = rgb(PAL.ink, 0.7); ctx.fillRect(-10, -19, 4, 4); ctx.fillRect(-3, -19, 4, 4);
    ctx.strokeStyle = rgb(PAL.ink, 0.8); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(14, -10); ctx.lineTo(14, -32); ctx.lineTo(26, -10); ctx.stroke();
    if (sh.stuck > 0.6) { ctx.fillStyle = rgb(PAL.rust, 0.5); ctx.fillRect(-20, -8, 6, 8); ctx.fillRect(4, -9, 8, 6); }
    ctx.restore();
    if (mode === 'game' && !afloat && sh.stuck > 0.5) once('ship1', () => { pulseAt(() => [sh.x, sh.y - 10 * U]); toast('⚓', 'Moynak', 'İlk gemi kumda kaldı. Denize ulaşacak su yok.', 'bad'); });
  }

  function drawCamel(G, t, dt) {
    const want = G.dry > 0.25 ? 1 : 0;
    camel.on = lerp(camel.on, want, 0.01);
    if (camel.on < 0.05) { camel.x = G.shore0 + 30 * U; return; }
    const lo = G.shore0 + 20 * U, hi = Math.max(lo + 40 * U, G.shoreX - 30 * U);
    if (!camel.eat) camel.x += camel.dir * 0.012 * dt * U;
    if (camel.x > hi) camel.dir = -1; if (camel.x < lo) camel.dir = 1;
    const y = G.water0 + (camel.x - G.shore0) / (G.x1 - G.shore0) * G.gh * 0.16 + 26 * U;
    camel.sx = camel.x; camel.sy = y - 40 * U; camel.ph += dt * 0.008;
    const s = U * 0.9;
    ctx.save(); ctx.globalAlpha = camel.on; ctx.translate(camel.x, y); ctx.scale(s * camel.dir, s);
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    const l = Math.sin(camel.ph) * 4;
    ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(-12 + l, 0); ctx.moveTo(-6, -14); ctx.lineTo(-6 - l, 0); ctx.moveTo(8, -14); ctx.lineTo(8 + l, 0); ctx.moveTo(13, -14); ctx.lineTo(13 - l, 0); ctx.stroke();
    ctx.fillStyle = '#c49a6c'; ctx.beginPath(); ctx.ellipse(0, -20, 18, 8, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(-4, -27, 7, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, -22); ctx.quadraticCurveTo(24, -26, 22, -38); ctx.lineTo(28, -38); ctx.lineTo(28, -33); ctx.lineTo(24, -32); ctx.quadraticCurveTo(26, -24, 18, -16); ctx.fill();
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(25, -36, 1.1, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function drawPickers(G, t, dt) {
    const want = Math.round(clamp(vis.C / 2.2) * (mobile ? 5 : 8));
    const fx0 = G.x1 * 0.16, fx1 = G.x1 * 0.5, town = G.x1 * 0.53;
    while (pickers.filter(p => !p.leave).length < want) {
      const n = pickers.length;
      pickers.push({ x: town, tx: lerp(fx0, fx1, (n * 0.37 + 0.13) % 1), row: n % 3, ph: rnd(0, 6), leave: false, kid: n % 4 === 3, scarf: pick(['#c0503a', '#d49a3a', '#7a5aa0', '#3a8a7a']), hat: 0 });
    }
    const active = pickers.filter(p => !p.leave);
    if (active.length > want) active[active.length - 1].leave = true;
    for (let i = pickers.length - 1; i >= 0; i--) {
      const p = pickers[i];
      const goal = p.leave ? town : p.tx, d = goal - p.x;
      const walking = Math.abs(d) > 2;
      if (walking) p.x += Math.sign(d) * Math.min(Math.abs(d), 0.05 * dt * U);
      if (p.leave && !walking) { pickers.splice(i, 1); continue; }
      const y = G.gt + G.gh * (0.42 + p.row * 0.16) + 14 * U;
      p.sx = p.x; p.sy = y - 34 * U;
      const s = U * (mobile ? 0.8 : 0.95) * (p.kid ? 0.75 : 1);
      person(p.x, y, s, { dir: d < 0 ? -1 : 1, step: walking ? Math.sin(t * 0.02 + p.ph) * 3 : 0, bend: walking ? 0 : 0.35 + Math.sin(t * 0.004 + p.ph) * 0.12, bag: true, scarf: p.kid ? null : p.scarf, cap: p.kid ? '#3a6a9a' : null, shirt: p.kid ? '#e0b04a' : '#8aa6c8' });
      if (p.hatFly) {
        const k = (performance.now() - p.hatFly) / 2500;
        if (k > 1) p.hatFly = 0; else { ctx.fillStyle = p.scarf; ctx.beginPath(); ctx.arc(p.x - k * 160 * U, y - 40 * U - Math.sin(k * 6) * 14 * U, 5 * U, 0, 6.283); ctx.fill(); }
      }
    }
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const G = geo(), { x1, gt, gb, gh } = G;
    const dustK = vis.dust;
    // gökyüzü: toz arttıkça sararır
    const sky = ctx.createLinearGradient(0, 0, 0, gt);
    sky.addColorStop(0, rgb(mixC(PAL.skyOk, PAL.skyDust, dustK), 0.9)); sky.addColorStop(1, rgb(mixC([238, 242, 230], [236, 222, 196], dustK), 0.5));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, x1, gt);
    ctx.fillStyle = rgb(PAL.sun, 0.9 - dustK * 0.4); ctx.beginPath(); ctx.arc(x1 * 0.86, H * 0.14, 26 * U, 0, 6.283); ctx.fill();
    for (const cl of clouds) {
      cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15;
      const cx = cl.x * x1, cy = cl.y * H, s = 22 * U * cl.s;
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath();
      ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283); ctx.fill();
    }
    // dağlar (Pamir): nehirler buradan doğar
    ctx.fillStyle = rgb(PAL.mount);
    ctx.beginPath(); ctx.moveTo(x1 * 0.04, gt); ctx.lineTo(x1 * 0.1, gt - gh * 0.42); ctx.lineTo(x1 * 0.15, gt - gh * 0.24); ctx.lineTo(x1 * 0.2, gt - gh * 0.38); ctx.lineTo(x1 * 0.27, gt); ctx.fill();
    ctx.fillStyle = rgb(PAL.snow, 0.95);
    ctx.beginPath(); ctx.moveTo(x1 * 0.087, gt - gh * 0.36); ctx.lineTo(x1 * 0.1, gt - gh * 0.42); ctx.lineTo(x1 * 0.113, gt - gh * 0.36); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1 * 0.188, gt - gh * 0.33); ctx.lineTo(x1 * 0.2, gt - gh * 0.38); ctx.lineTo(x1 * 0.212, gt - gh * 0.33); ctx.fill();

    // bozkır zemini
    ctx.fillStyle = rgb(mixC(PAL.steppe, PAL.steppeDry, dustK)); ctx.fillRect(0, gt, x1, gh + (H - gb));
    // eski deniz tabanı (kıyıdan sağa): kum ve tuz kabuğu
    ctx.fillStyle = rgb(PAL.sand);
    ctx.beginPath(); ctx.moveTo(G.shore0 - 10 * U, G.water0); ctx.lineTo(x1, G.water0); ctx.lineTo(x1, H); ctx.lineTo(G.shore0 - 30 * U, H); ctx.fill();
    if (G.dry > 0.08) {
      ctx.fillStyle = rgb(PAL.salt, clamp(G.dry * 1.4) * 0.85);
      for (let i = 0; i < 9; i++) {
        const sx = lerp(G.shore0, G.shoreX, (i * 0.618) % 1), sy = G.water0 + gh * (0.05 + ((i * 0.37) % 1) * 0.35);
        if (sx < G.shoreX - 10 * U) { ctx.beginPath(); ctx.ellipse(sx, sy, 22 * U * (0.6 + (i % 3) * 0.3), 4 * U, 0, 0, 6.283); ctx.fill(); }
      }
    }
    // göl
    const salty = smooth(15, 80, vis.sal);
    const wg = ctx.createLinearGradient(0, G.waterY, 0, gb);
    wg.addColorStop(0, rgb(mixC(PAL.water, PAL.waterSalty, salty))); wg.addColorStop(1, rgb(mixC(PAL.waterDeep, PAL.waterSalty, salty * 0.8)));
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.moveTo(G.shoreX, G.waterY);
    for (let x = G.shoreX; x <= x1 + 4; x += 12) ctx.lineTo(x, G.waterY + Math.sin(x * 0.03 + t * 0.002) * 1.5 * U);
    ctx.lineTo(x1, H); ctx.lineTo(G.shoreX + 26 * U, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5 * U;
    for (let k = 0; k < 4; k++) { const wx = G.shoreX + ((t * 0.02 + k * 97) % Math.max(40, x1 - G.shoreX)); ctx.beginPath(); ctx.moveTo(wx, G.waterY + 8 * U + k * 6 * U); ctx.lineTo(wx + 16 * U, G.waterY + 8 * U + k * 6 * U); ctx.stroke(); }
    // kuzey göl (göl ikiye ayrıldıktan sonra uzakta küçük mavi şerit)
    if (vis.Vn > 0.5) { ctx.fillStyle = rgb(PAL.water, clamp(vis.Vn / 20) * 0.9); ctx.beginPath(); ctx.ellipse(x1 * 0.955, G.waterY - 6 * U, x1 * 0.04 * clamp(vis.Vn / 22, 0.3, 1.3), 4 * U, 0, 0, 6.283); ctx.fill(); }

    // tuzlu birikinti ve son balık
    puddle.on = lerp(puddle.on, vis.F < 0.2 && G.dry > 0.3 ? 1 : 0, 0.02);
    if (puddle.on > 0.05) {
      puddle.x = lerp(G.shore0, G.shoreX, 0.38); puddle.y = G.water0 + gh * 0.2;
      ctx.globalAlpha = puddle.on; ctx.fillStyle = rgb(PAL.waterSalty); ctx.beginPath(); ctx.ellipse(puddle.x, puddle.y, 16 * U, 4 * U, 0, 0, 6.283); ctx.fill();
      const j = Math.max(0, Math.sin(t * 0.004)) * 7 * U;
      ctx.fillStyle = '#7f9aa8'; ctx.beginPath(); ctx.ellipse(puddle.x, puddle.y - j, 5 * U, 2.6 * U, Math.sin(t * 0.008) * 0.5, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
    SHIPS.forEach(sh => drawShip(sh, G, t));
    drawCamel(G, t, dt);

    // nehir: dağdan çıkar, ayrım noktasında bir kısmı kanala, kalanı göle
    const qv = mode === 'game' ? (game.qNow || 1) : 1, up = 9 * U * qv, down = (1.2 * U + 9 * U * (1 - vis.w)) * qv;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const river = (xa, xb, wdt, col) => { ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath(); for (let x = xa; x <= xb; x += 8) { const y = x < G.shore0 ? riverY(x, G) : lerp(riverY(G.shore0, G), G.waterY, (x - G.shore0) / Math.max(1, G.shoreX - G.shore0)); x === xa ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); };
    river(x1 * 0.09, G.xi, up, rgb(PAL.water));
    const reach = vis.w > 0.97 ? lerp(G.xi, G.shore0, 0.4) : G.shoreX;
    if (vis.w > 0.9) { ctx.setLineDash([3 * U, 6 * U]); river(G.xi, G.shoreX, 3 * U, 'rgba(160,140,110,.6)'); ctx.setLineDash([]); }
    river(G.xi, reach, down, rgb(PAL.water));
    // kanal ve tarla arkları
    const cy0 = G.gt + G.gh * 0.33, cw = 1 + 6 * U * vis.w;
    ctx.strokeStyle = rgb(PAL.water, 0.4 + 0.6 * clamp(vis.w * 2)); ctx.lineWidth = cw;
    ctx.beginPath(); ctx.moveTo(G.xi, riverY(G.xi, G)); ctx.lineTo(G.xi, cy0); ctx.lineTo(x1 * 0.5, cy0); ctx.stroke();
    ctx.lineWidth = Math.max(1, cw * 0.4);
    for (let r = 0; r < 3; r++) { const yy = G.gt + G.gh * (0.42 + r * 0.16) + 18 * U; ctx.beginPath(); ctx.moveTo(x1 * 0.16, yy); ctx.lineTo(x1 * 0.5, yy); ctx.stroke(); }

    // pamuk tarlası: koza sayısı üretimle, yaprak rengi toprak sağlığıyla
    const leaf = mixC(PAL.leaf, PAL.leafDry, clamp((1 - vis.soil) * 3));
    const bolls = clamp(vis.C / 2.2);
    for (let r = 0; r < 3; r++) {
      const yy = G.gt + G.gh * (0.42 + r * 0.16) + 12 * U;
      for (let x = x1 * 0.165; x < x1 * 0.5; x += 17 * U) {
        const k = Math.sin(x * 0.7 + r * 3) * 0.5 + 0.5;
        ctx.fillStyle = rgb(leaf); ctx.beginPath(); ctx.arc(x, yy, 6.5 * U, 0, 6.283); ctx.arc(x + 5 * U, yy - 3 * U, 5 * U, 0, 6.283); ctx.fill();
        if (k < bolls) { ctx.fillStyle = rgb(PAL.boll); ctx.beginPath(); ctx.arc(x + 1 * U, yy - 5 * U, 2.8 * U, 0, 6.283); ctx.arc(x + 6 * U, yy - 1 * U, 2.4 * U, 0, 6.283); ctx.fill(); }
      }
    }
    if (vis.soil < 0.93) { ctx.fillStyle = rgb(PAL.salt, clamp((0.93 - vis.soil) * 4) * 0.7); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x1 * (0.2 + i * 0.05), G.gt + G.gh * (0.5 + (i % 3) * 0.14), 14 * U, 3 * U, 0, 0, 6.283); ctx.fill(); } }

    // Moynak: evler, konserve fabrikası, iskele
    const ty = G.gt + G.gh * 0.1;
    for (let i = 0; i < 4; i++) { const hx = x1 * (0.505 + i * 0.022); ctx.fillStyle = ['#e8dcc4', '#f0e6d0', '#e2d4ba', '#efe2c8'][i]; ctx.fillRect(hx, ty - 16 * U, 16 * U, 16 * U); ctx.fillStyle = '#b06a4a'; ctx.beginPath(); ctx.moveTo(hx - 2 * U, ty - 16 * U); ctx.lineTo(hx + 8 * U, ty - 24 * U); ctx.lineTo(hx + 18 * U, ty - 16 * U); ctx.fill(); }
    const fx = x1 * 0.43; ctx.fillStyle = '#d7d2c4'; ctx.fillRect(fx, ty - 22 * U, 34 * U, 22 * U); ctx.fillStyle = '#9a8f7a'; ctx.fillRect(fx + 26 * U, ty - 40 * U, 6 * U, 18 * U);
    ctx.fillStyle = rgb(PAL.ink, 0.75); ctx.font = `${10 * U}px Inter`; ctx.fillText('BALIK', fx + 3 * U, ty - 8 * U);
    const working = clamp(vis.F * 1.4) + (game.truck ? 0.4 : 0);
    if (working > 0.1) for (let k = 0; k < 3; k++) { const p = ((t * 0.0004 + k / 3) % 1); ctx.fillStyle = `rgba(160,160,160,${(1 - p) * 0.4 * clamp(working)})`; ctx.beginPath(); ctx.arc(fx + 29 * U + p * 14 * U, ty - 42 * U - p * 30 * U, (4 + p * 8) * U, 0, 6.283); ctx.fill(); }
    // iskele: 1960 kıyısına uzanır; su çekilince kumda kalır
    const px0 = G.shore0 - 34 * U, px1 = G.shore0 + 30 * U, py = G.water0 - 4 * U;
    ctx.fillStyle = '#9a7a56'; ctx.fillRect(px0, py - 4 * U, px1 - px0, 4 * U);
    ctx.strokeStyle = '#7a5e40'; ctx.lineWidth = 2.5 * U; for (let x = px0 + 6 * U; x < px1; x += 14 * U) { ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x, py + 14 * U + G.dry * 10 * U); ctx.stroke(); }
    // dede ve torun: iskelenin ucunda
    elder.x = px1 - 12 * U; elder.y = py - 4 * U; kid.x = px1 - 30 * U; kid.y = py - 4 * U;
    person(elder.x, elder.y, U * 0.95, { dir: 1, beard: true, cap: '#5a4a3a', shirt: '#7a8a6a', arm: -6 });
    ctx.strokeStyle = rgb(PAL.ink, 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(elder.x + 9 * U, elder.y - 23 * U); ctx.quadraticCurveTo(elder.x + 40 * U, elder.y - 40 * U, elder.x + 52 * U, elder.y + (G.dry > 0.15 ? 18 : 10) * U); ctx.stroke();
    person(kid.x, kid.y, U * 0.7, { dir: 1, cap: '#c0503a', shirt: '#e0b04a', step: 0 });
    elder.sy = elder.y - 34 * U; kid.sy = kid.y - 26 * U;

    // balıkçı tekneleri: balıkla birlikte azalır
    const wantBoats = Math.round(clamp(vis.F) * (mobile ? 2 : 4));
    while (boats.length < wantBoats) boats.push({ f: rnd(0.2, 0.9), v: rnd(-1, 1) * 0.00004, ph: rnd(0, 6) });
    while (boats.length > wantBoats) boats.pop();
    for (const b of boats) {
      b.f += b.v * dt; if (b.f < 0.05 || b.f > 0.95) b.v *= -1;
      const bx = lerp(G.shoreX + 20 * U, x1 - 16 * U, b.f), by = G.waterY + 12 * U + Math.sin(t * 0.002 + b.ph) * 1.5 * U;
      b.sx = bx; b.sy = by - 26 * U;
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.moveTo(bx - 12 * U, by - 3 * U); ctx.lineTo(bx + 12 * U, by - 3 * U); ctx.lineTo(bx + 8 * U, by + 3 * U); ctx.lineTo(bx - 8 * U, by + 3 * U); ctx.fill();
      ctx.fillStyle = '#f4efe2'; ctx.beginPath(); ctx.moveTo(bx, by - 4 * U); ctx.lineTo(bx, by - 22 * U); ctx.lineTo(bx + 11 * U, by - 6 * U); ctx.fill();
    }
    // zıplayan balıklar
    if (Math.random() < vis.F * 0.03 * (dt / 16) && x1 - G.shoreX > 60 * U) fishJumps.push({ x: rnd(G.shoreX + 30 * U, x1 - 20 * U), y: G.waterY + rnd(10, 30) * U, k: 0 });
    for (let i = fishJumps.length - 1; i >= 0; i--) {
      const f = fishJumps[i]; f.k += dt / 700; if (f.k > 1) { fishJumps.splice(i, 1); continue; }
      const fy = f.y - Math.sin(f.k * Math.PI) * 18 * U;
      ctx.fillStyle = '#6d8fa0'; ctx.beginPath(); ctx.ellipse(f.x + f.k * 14 * U, fy, 5 * U, 2.2 * U, -0.6 + f.k * 1.2, 0, 6.283); ctx.fill();
    }
    // martılar
    for (const g of gulls) {
      g.ph += dt * 0.01; g.x += g.vx * 0.00005 * dt; if (g.x < 0.55 || g.x > 0.98) g.vx *= -1;
      const gx = g.x * x1, gy = g.y * gt + Math.sin(g.ph * 0.3) * 6 * U; g.sx = gx; g.sy = gy;
      ctx.strokeStyle = rgb(PAL.ink, 0.7); ctx.lineWidth = 1.6 * U; const fl = Math.sin(g.ph) * 4 * U;
      ctx.beginPath(); ctx.moveTo(gx - 9 * U, gy - fl); ctx.quadraticCurveTo(gx - 4 * U, gy - 4 * U, gx, gy); ctx.quadraticCurveTo(gx + 4 * U, gy - 4 * U, gx + 9 * U, gy - fl); ctx.stroke();
    }
    drawLabels(G, t);
    drawSat(G, t);
    drawPickers(G, t, dt);
    drawGags(G, t, dt);
    drawOfficial(G, t);

    // toz fırtınası: kuruyan tabandan kalkar, tarlaya ve kasabaya yağar
    if (Math.random() < vis.dust * 0.25 * (dt / 16) && mode !== 'facts' && mode !== 'lessons') {
      dust.push({ x: rnd(G.shore0, Math.max(G.shore0 + 1, G.shoreX)), y: G.water0 + rnd(-30, 20) * U, vx: -rnd(0.12, 0.3) * U, vy: -rnd(0.01, 0.05) * U, life: 1, r: rnd(3, 9) * U });
    }
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i]; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt / 6000;
      if (d.life <= 0 || d.x < -20) { dust.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(236,228,206,${d.life * 0.55})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
    }
    if (vis.dust > 0.05) { ctx.fillStyle = `rgba(230,214,180,${vis.dust * 0.16})`; ctx.fillRect(0, 0, x1, gb); }

    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt / 1400; f.y -= dt * 0.02; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = clamp(f.life * 2); ctx.fillStyle = rgb(PAL.ink); ctx.font = `${18 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    if (view.k > 0.01) drawMap(G, t, view.k);
    drawPulses(t);
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt / 4200; if (b.life <= 0) { bubbles.splice(i, 1); continue; } drawBubble(b); }
  }



  // =====================================================================
  // HARİTA GÖRÜNÜMÜ: kuşbakışı Aral havzası (kıyıdan yükselip bakılır)
  // =====================================================================
  const view = { want: 'shore', k: 0, until: 0, user: false };
  function setView(v, ms) {
    view.want = v; view.user = !ms;
    view.until = ms ? performance.now() + ms : 0;
    const b = $('g-view'); if (b) b.textContent = v === 'map' ? '🏘️ Kıyı' : '🗺️ Harita';
  }
  // harita koordinatları 0..1; göl şekli kabaca gerçek Aral'a benzer
  const MN = [[0.56, 0.12], [0.66, 0.1], [0.74, 0.16], [0.72, 0.26], [0.62, 0.3], [0.54, 0.24]];
  const MW = [[0.3, 0.34], [0.4, 0.32], [0.44, 0.5], [0.43, 0.72], [0.38, 0.86], [0.31, 0.8], [0.28, 0.56]];
  const ME = [[0.42, 0.32], [0.58, 0.3], [0.74, 0.38], [0.8, 0.56], [0.74, 0.76], [0.58, 0.86], [0.42, 0.84], [0.44, 0.56]];
  const cen = pts => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  function drawMap(G, t, alpha) {
    const top = 104 * U, H2 = G.gb - top, Wm = Math.min(G.x1 * 0.96, H2 * 1.35), Hm = Wm / 1.35;
    const ox = (G.x1 - Wm) / 2, oy = top + (H2 - Hm) / 2;
    const X = p => ox + p[0] * Wm, Y = p => oy + p[1] * Hm;
    const zoom = 1 + (1 - alpha) * 0.35;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(G.x1 / 2, (top + G.gb) / 2); ctx.scale(zoom, zoom); ctx.translate(-G.x1 / 2, -(top + G.gb) / 2);
    // çöl ve dağlar
    ctx.fillStyle = rgb(mixC([226, 214, 178], [232, 216, 184], vis.dust)); ctx.fillRect(-G.x1, 0, G.x1 * 3, G.gb + H);
    ctx.fillStyle = 'rgba(176,164,150,.9)';
    [[0.92, 0.92, 0.12], [1.0, 0.78, 0.1], [0.98, 0.18, 0.1]].forEach(([mx, my, r]) => { ctx.beginPath(); ctx.moveTo(X([mx - r, my + r * 0.6]), Y([0, my + r * 0.6])); ctx.lineTo(X([mx, my - r * 0.8]), Y([0, my - r * 0.8])); ctx.lineTo(X([mx + r, my + r * 0.6]), Y([0, my + r * 0.6])); ctx.fill(); });
    ctx.fillStyle = 'rgba(250,250,248,.9)'; [[0.92, 0.92, 0.12], [1.0, 0.78, 0.1], [0.98, 0.18, 0.1]].forEach(([mx, my, r]) => { ctx.beginPath(); ctx.moveTo(X([mx - r * 0.25, my - r * 0.4]), Y([0, my - r * 0.4])); ctx.lineTo(X([mx, my - r * 0.8]), Y([0, my - r * 0.8])); ctx.lineTo(X([mx + r * 0.25, my - r * 0.4]), Y([0, my - r * 0.4])); ctx.fill(); });
    const a = clamp(vis.A), split = vis.Vn > 0.5 || a < 0.5;
    const poly = (pts, c, k, fill, dash) => {
      ctx.beginPath(); pts.forEach((p, i) => { const q = [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q)); }); ctx.closePath();
      if (dash) { ctx.setLineDash([5 * U, 5 * U]); ctx.strokeStyle = 'rgba(64,116,158,.75)'; ctx.lineWidth = 1.6 * U; ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.fillStyle = fill; ctx.fill(); }
    };
    // kuruyan taban (1960 sınırı içinde): tuz kabuğu
    [MN, MW, ME].forEach(pp => poly(pp, cen(pp), 1, `rgba(246,244,236,${0.25 + 0.6 * (1 - a)})`));
    const water = rgb(mixC(PAL.water, PAL.waterSalty, smooth(15, 80, vis.sal)));
    const kE = Math.sqrt(clamp((a - 0.16) / 0.84)), kW = Math.sqrt(clamp(0.18 + 0.82 * a));
    if (kE > 0.02) poly(ME, [0.47, 0.56], kE, water);
    poly(MW, [0.36, 0.62], kW, water);
    const kN = split ? Math.sqrt(clamp((vis.Vn || 8) / 26, 0.15, 1.1)) : Math.sqrt(Math.max(0.35, a));
    poly(MN, cen(MN), kN, rgb(PAL.water));
    if (!split) { ctx.strokeStyle = water; ctx.lineWidth = 10 * U * Math.sqrt(a); ctx.beginPath(); ctx.moveTo(X([0.56, 0.26]), Y([0, 0.26])); ctx.lineTo(X([0.5, 0.34]), Y([0, 0.34])); ctx.stroke(); }
    [MN, MW, ME].forEach(pp => poly(pp, cen(pp), 1, null, true));
    // nehirler: genişlikleri göle akan suyla; tarlalar nehir boyunca yeşerir
    const flow = 1 - vis.w, rw = (1.2 + 6 * flow) * U;
    const southEnd = [0.47 + (1 - kE) * -0.08, 0.84 - (1 - kW) * 0.08], northEnd = [0.68, 0.27];
    const river = (pts, w, dashTail) => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgb(PAL.water); ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X(p), Y(p)) : ctx.moveTo(X(p), Y(p))); ctx.stroke(); };
    const fieldsK = clamp(vis.w * 1.2);
    ctx.fillStyle = `rgba(110,150,88,${0.25 + 0.6 * fieldsK})`;
    [[0.72, 0.9, 0.06], [0.62, 0.95, 0.05], [0.84, 0.86, 0.05], [0.86, 0.32, 0.04], [0.93, 0.26, 0.04], [0.55, 0.96, 0.04]].forEach(([fx, fy, r]) => { ctx.beginPath(); ctx.ellipse(X([fx, 0]), Y([0, fy]), r * Wm * (0.4 + 0.8 * fieldsK), r * Hm * 0.5 * (0.4 + 0.8 * fieldsK), 0, 0, 6.283); ctx.fill(); });
    if (vis.w > 0.35) { ctx.strokeStyle = rgb(PAL.water, 0.7); ctx.lineWidth = 2.4 * U; ctx.setLineDash([6 * U, 3 * U]); ctx.beginPath(); ctx.moveTo(X([0.8, 0]), Y([0, 0.93])); ctx.quadraticCurveTo(X([0.5, 0]), Y([0, 1.02]), X([0.12, 0]), Y([0, 0.98])); ctx.stroke(); ctx.setLineDash([]); }
    river([[0.92, 0.88], [0.8, 0.9], [0.66, 0.92], southEnd], rw);
    river([[0.98, 0.22], [0.86, 0.26], [0.76, 0.24], northEnd], rw * 0.8);
    // etiketler
    const lbl = (p, text, o) => tag(X(p), Y(p), text, o);
    lbl([0.47, 0.95], '⚓ Moynak', { fs: 12 }); lbl([0.66, 0.08], '⚓ Aralsk', { fs: 12 });
    lbl([0.9, 0.84], 'Amu Derya', { fs: 11, a: 0.85 }); lbl([0.86, 0.2], 'Siri Derya', { fs: 11, a: 0.85 });
    if (vis.w > 0.35) lbl([0.12, 0.93], 'Karakum Kanalı', { fs: 11, a: 0.85 });
    if (a < 0.75) lbl([0.62, 0.62], `🏜️ Aralkum çölü`, { fs: 13, color: '#8a6a44' });
    if (game.dam) { ctx.strokeStyle = '#6a5440'; ctx.lineWidth = 4 * U; ctx.beginPath(); ctx.moveTo(X([0.53, 0]), Y([0, 0.27])); ctx.lineTo(X([0.58, 0]), Y([0, 0.31])); ctx.stroke(); lbl([0.5, 0.36], '🧱 Kokaral seti', { fs: 11 }); }
    lbl([0.5, 1.0], `Göl: 1960'ın %${Math.round(a * 100)}'i · tuz ${Math.round(vis.sal)} g/L`, { fs: 13, color: a < 0.4 ? '#a0402a' : rgb(PAL.ink) });
    if (view.user) lbl([0.14, 0.05], '🏘️ dokun: kıyıya dön', { fs: 11, a: 0.85 });
    // toz bulutları kuruyan doğu tabanından güneybatıya
    if (vis.dust > 0.1) for (let i = 0; i < 6; i++) { const ph = (t * 0.00005 + i / 6) % 1; ctx.fillStyle = `rgba(240,232,212,${(1 - ph) * vis.dust * 0.8})`; ctx.beginPath(); ctx.arc(X([0.66 - ph * 0.3, 0]), Y([0, 0.5 + ph * 0.25 + (i % 2) * 0.05]), (10 + ph * 26) * U, 0, 6.283); ctx.fill(); }
    // balıkçı tekneleri: suda küçük beyaz noktalar
    const nb = Math.round(vis.F * 6);
    for (let i = 0; i < nb; i++) { const c = i % 2 ? [0.36, 0.6] : [0.5, 0.55]; const p = [c[0] + Math.cos(t * 0.0002 + i) * 0.04 * kW, c[1] + Math.sin(t * 0.00025 + i * 2) * 0.08 * kW]; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(p), Y(p), 2.4 * U, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }

  // =====================================================================
  // GÖRSEL AÇIKLAMALAR: sahnedeki etiketler, uydu haritası, olay halkaları
  // =====================================================================
  const pulses = [];
  const pulseAt = (getPos, col = '#e0b04a') => pulses.push({ getPos, t0: performance.now(), col });
  function tag(x, y, text, o = {}) {
    const fs = Math.max(11, (o.fs || 13) * U);
    ctx.font = `${fs}px "Patrick Hand"`;
    const w = ctx.measureText(text).width + 12 * U, h = fs + 8 * U;
    let bx = clamp(x - w / 2, 4, lay.x1 * W - w - 4), by = y - h;
    if (window.SceneUtils && mode === 'game') ({ x: bx, y: by } = window.SceneUtils.avoidHud(bx, by, w, h));
    ctx.globalAlpha = o.a === undefined ? 0.95 : o.a;
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.88)'; ctx.strokeStyle = o.border || 'rgba(43,58,46,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, h, h / 2) : ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.color || rgb(PAL.ink); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(text, bx + 6 * U, by + h / 2 + 1); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  }
  function drawValveHint(G, t) {
    if (mode !== 'game' || gs.y > M.Y0 + 4 || game.touched) return;
    const x = G.xi, y = riverY(G.xi, G), bob = Math.sin(t * 0.006) * 5 * U;
    ctx.strokeStyle = '#c0503a'; ctx.lineWidth = 3 * U; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 46 * U, y - 64 * U + bob); ctx.quadraticCurveTo(x + 30 * U, y - 30 * U + bob, x + 6 * U, y - 12 * U + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 6 * U, y - 12 * U + bob); ctx.lineTo(x + 16 * U, y - 14 * U + bob); ctx.moveTo(x + 6 * U, y - 12 * U + bob); ctx.lineTo(x + 9 * U, y - 22 * U + bob); ctx.stroke();
    tag(x + 60 * U, y - 66 * U + bob, 'Su burada ikiye ayrılıyor: kaydırıcı bu vanayı açar', { fs: 13, color: '#a0402a' });
  }
  function drawLabels(G, t) {
    if (mode !== 'game' && mode !== 'sandbox') return;
    drawValveHint(G, t);
    const small = mobile;
    // nehrin bölündüğü yer: suyun yüzde kaçı nereye
    const wPct = Math.round(vis.w * 100), q = game.qNow || 1;
    if (mode === 'game') tag(G.x1 * 0.12, riverY(G.x1 * 0.12, G) + 30 * U, q < 0.8 ? `☀️ Kurak yıl: nehir %${Math.round(q * 100)}` : q > 1.12 ? `🌨️ Bereketli yıl: nehir %${Math.round(q * 100)}` : `💧 Nehir bu yıl %${Math.round(q * 100)}`, { fs: small ? 11 : 13, color: q < 0.8 ? '#a0402a' : undefined });
    tag(G.xi, riverY(G.xi, G) - 12 * U, `💧 Tarlaya %${wPct} · Göle %${100 - wPct}`, { fs: small ? 11 : 13, color: vis.w > 0.7 ? '#a0402a' : rgb(PAL.ink) });
    // 1960 kıyısı ve kıyının ne kadar uzaklaştığı
    const km = M.shoreKm(vis.A * M.A0);
    ctx.setLineDash([4 * U, 5 * U]); ctx.strokeStyle = 'rgba(64,116,158,.6)'; ctx.lineWidth = 1.6 * U;
    ctx.beginPath(); ctx.moveTo(G.shore0, G.water0 - 34 * U); ctx.lineTo(G.shore0, G.gb); ctx.stroke(); ctx.setLineDash([]);
    if (G.shoreX - G.shore0 > 30 * U) {
      const ay = G.water0 + G.gh * 0.3;
      ctx.strokeStyle = 'rgba(160,64,42,.8)'; ctx.lineWidth = 2 * U;
      ctx.beginPath(); ctx.moveTo(G.shore0 + 4 * U, ay); ctx.lineTo(G.shoreX - 4 * U, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(G.shoreX - 10 * U, ay - 5 * U); ctx.lineTo(G.shoreX - 3 * U, ay); ctx.lineTo(G.shoreX - 10 * U, ay + 5 * U); ctx.stroke();
      tag((G.shore0 + G.shoreX) / 2, ay - 6 * U, `Kıyı ${Math.round(km)} km uzaklaştı`, { fs: small ? 11 : 13, color: '#a0402a' });

    }
    // gölün tuzu: okyanusla karşılaştırma
    const showSal = vis.sal > 11.5 || mode === 'sandbox', showFish = vis.F < 0.95 || mode === 'sandbox';
    const salTxt = vis.sal > 35 ? `🧂 Tuz ${Math.round(vis.sal)} g/L · okyanustan tuzlu!` : `🧂 Tuz ${Math.round(vis.sal)} g/L (okyanus 35)`;
    if (showSal) tag(Math.max(G.shoreX + 70 * U, G.x1 * 0.8), G.waterY + 44 * U, salTxt, { fs: small ? 11 : 13, color: vis.sal > 25 ? '#a0402a' : rgb(PAL.ink) });
    // fabrika: yıllık balık avı; tarla: pamuk
    const fx = G.x1 * 0.43, ty = G.gt + G.gh * 0.1;
    const tons = Math.round(vis.F * 43) * 1000;
    if (showFish) tag(fx + 17 * U, ty - 46 * U, vis.F < 0.05 ? '🐟 Av: 0 ton' : `🐟 Av: ${tons.toLocaleString('tr-TR')} ton/yıl`, { fs: small ? 11 : 12, color: vis.F < 0.3 ? '#a0402a' : rgb(PAL.ink) });
    tag(G.x1 * 0.33, G.gt + G.gh * 0.36, `☁️ Pamuk ${fmtX(vis.C)}`, { fs: small ? 11 : 13 });
    if (vis.soil < 0.92) tag(G.x1 * 0.33, G.gt + G.gh * 0.94, `Toprak tuzlanıyor: verim %${Math.round(vis.soil * 100)}`, { fs: small ? 10 : 12, color: '#a0402a' });
  }
  // uydudan Aral: kuşbakışı göl şekli yıl yıl küçülür, ikiye ayrılır
  const SAT_N = [[0.18, 0.08], [0.34, 0.04], [0.42, 0.14], [0.36, 0.26], [0.22, 0.28], [0.14, 0.18]];
  const SAT_S = [[0.3, 0.3], [0.52, 0.24], [0.72, 0.3], [0.86, 0.5], [0.84, 0.78], [0.66, 0.96], [0.44, 0.94], [0.3, 0.78], [0.24, 0.52]];
  function drawSat(G, t) {
    if ((mode !== 'game' && mode !== 'sandbox') || view.k > 0.5) return;
    const w = mobile ? 92 * U : 130 * U, h = w * 0.95;
    // gölün sağ alt köşesinde: üstteki bildirim kartlarıyla çakışmaz
    const x = G.x1 - w - (mobile ? 8 : 18) * U, y = G.gb - h - (mobile ? 30 : 34) * U;
    if (y < G.waterY + 60 * U) return;
    ctx.save();
    ctx.fillStyle = 'rgba(232,222,196,.94)'; ctx.strokeStyle = rgb(PAL.ink, 0.5); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h + 18 * U, 10) : ctx.rect(x, y, w, h + 18 * U); ctx.fill(); ctx.stroke();
    const P = (pt, cx, cy, k) => [x + (cx + (pt[0] - cx) * k) * w, y + 4 * U + (cy + (pt[1] - cy) * k) * h];
    const poly = (pts, cx, cy, k, fill, dash) => {
      ctx.beginPath(); pts.forEach((pt, i) => { const [px, py] = P(pt, cx, cy, k); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath();
      if (dash) { ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(64,116,158,.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.fillStyle = fill; ctx.fill(); }
    };
    // 1960 kıyısının hayaleti
    poly(SAT_N, 0.28, 0.16, 1, null, true); poly(SAT_S, 0.55, 0.6, 1, null, true);
    const a = clamp(vis.A), split = vis.Vn > 0.5 || a < 0.5;
    const water = rgb(mixC(PAL.water, PAL.waterSalty, smooth(15, 80, vis.sal)));
    // güney havzası doğudan çekilir; kuzey ayrılınca kendi suyuyla yaşar
    const kS = Math.sqrt(clamp((a - (split ? 0.04 : 0)) / 0.9, 0.02, 1));
    poly(SAT_S, 0.4, 0.62, kS, water);
    const kN = split ? Math.sqrt(clamp((vis.Vn || 8) / 26, 0.15, 1.1)) : Math.sqrt(Math.max(0.3, a));
    poly(SAT_N, 0.28, 0.16, kN, rgb(PAL.water));
    if (!split) { const [ax, ay] = P([0.3, 0.27], 0, 0, 1); ctx.fillStyle = water; ctx.fillRect(ax - 4 * U, ay - 3 * U, 10 * U, 8 * U); }
    ctx.fillStyle = rgb(PAL.ink, 0.75); ctx.font = `${11 * U}px "Patrick Hand"`; ctx.textAlign = 'center';
    ctx.fillText(`🛰️ %${Math.round(a * 100)} · dokun: büyüt`, x + w / 2, y + h + 13 * U); ctx.textAlign = 'left';
    ctx.restore();
    drawSat.box = { x, y, w, h };
  }
  function drawPulses(t) {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i], k = (t - p.t0) / 2400;
      if (k > 1) { pulses.splice(i, 1); continue; }
      const [x, y] = p.getPos(); if (x === undefined) continue;
      for (let j = 0; j < 2; j++) { const kk = (k * 2 + j * 0.5) % 1; ctx.strokeStyle = p.col; ctx.globalAlpha = (1 - kk) * 0.9; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.arc(x, y, (10 + kk * 40) * U, 0, 6.283); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }

  // =====================================================================
  // KONUŞMALAR VE MİZAH
  // =====================================================================
  function lines(kind) {
    const F = vis.F, dry = clamp(1 - vis.A), C = vis.C;
    const P = {
      picker: vis.dust > 0.3 ? ['Toz yine geldi,\ngözüm yanıyor.', 'Pamuğun üstü\ntuz tuttu.', 'Bu toz denizden\ngeliyormuş.'] : vis.soil < 0.85 ? ['Toprak tuz bağladı,\npamuk cılız.', 'Su çok ama\ntoprak yorgun.', 'Eskiden bu tarla\ndaha cömertti.'] : C > 1.6 ? ['Bu yıl rekor\npamuk!', 'Beyaz altın\nbizden sorulur!', 'Sırtım ağrıyor\nama plan tutacak.'] : vis.w < 0.25 ? ['Su az, pamuk az.\nMoskova kızacak.', 'Tarla susadı.', 'Biraz daha su\nolsa ya...'] : ['Bir koza, iki koza...\nbin koza!', 'Güneş yakıyor,\npamuk açıyor.', 'Akşama çuval\ndolacak.'],
      elder: F > 0.7 ? ['Ağlar dolu!\nBugün şanslı gün.', 'Kırk yıldır bu\nsularda balık tutarım.', 'Aral cömerttir,\nevlat.'] : F > 0.25 ? ['Su her yıl biraz\ndaha geri çekiliyor.', 'Ağlar yarı boş\ngeliyor.', 'Babam bu iskeleden\nyüzerdi.'] : ['Deniz gitti,\nbalık gitti.', 'Teknem kumda\nyatıyor.', 'Oltayı alışkanlıktan\natıyorum.'],
      kid: dry < 0.08 ? ['Dede, yüzmeye\ngidelim mi?', 'Bugün kaç balık\ntutacağız?', 'Dalga sesi\nçok güzel!'] : dry < 0.4 ? ['Dede, deniz neden\nuzaklaşıyor?', 'Su eskiden buraya\nkadar mıydı?', 'İskele niye\nkuruda kaldı?'] : game.saved ? ['Dede, dalga sesi\ngeri geldi!', 'Kuzeyde balık\nvarmış!'] : ['Dede, deniz\nnereye gitti?', 'Gemiler neden\nkumda?', 'Ben hiç deniz\ngörmedim.'],
      camel: ['Gemi mi? Ben\nçölün gemisiyim.', 'Burası benim\nçölüm artık.', 'Tuzlu ot,\nkötü değil.'],
      puddle: ['Burası çok tuzlu!\nOkyanustan beter!', 'Bir yudum tatlı\nsu lütfen...', 'Arkadaşlarım\nnereye gitti?'],
      shipStuck: ['Eskiden dalgaları\nyarardım...', 'Bir gün deniz\ngeri gelir mi?', 'Pas tuttum,\nkimse sormaz.'],
      shipFloat: ['Düüüt! Ağlar\nhazır mı?', 'Bugün açıkta\nbalık bol!', 'Rüzgâr iyi,\nyola çıkalım.'],
      gull: dry > 0.4 ? ['Deniz nerede?\nBalık nerede?', 'Kumda balık\naranmaz ki!', 'Bu kıyı her yıl\nkaçıyor.'] : ['Balık var,\nkeyif var!', 'Bugün ziyafet!', 'Hey, o balık\nbenim!'],
      boat: ['Ağları çek!', 'Bugün iyi\nbir av.', 'Moynak\'a dönüş!'],
      official: ['Plan kutsaldır,\nyoldaş!', 'Daha çok pamuk,\ndaha çok su!', 'Göl mü? Gölü\nplanda görmedim.'],
    };
    return pick(P[kind] || ['...']);
  }

  // dokununca en yakın karakter konuşur (mesafe sınırı yok)
  function talkAt(x, y) {
    const c = [];
    // her karakter, baloncuğun takip edeceği x/y ile sarılır (bazı nesnelerde x var ama y yok)
    const add = (o, kind, fn) => { if (o && o.sx !== undefined && !isNaN(o.sy)) c.push({ d: Math.hypot(o.sx - x, o.sy - y), o: { get x() { return o.sx; }, get y() { return o.sy; } }, kind, fn }); };
    pickers.forEach(p => add(p, 'picker'));
    add({ sx: elder.x, sy: elder.sy, get x() { return elder.x; }, get y() { return elder.sy; } }, 'elder');
    add({ sx: kid.x, sy: kid.sy, get x() { return kid.x; }, get y() { return kid.sy; } }, 'kid');
    if (camel.on > 0.5) add({ sx: camel.sx, sy: camel.sy, get x() { return camel.sx; }, get y() { return camel.sy; } }, 'camel', () => { if (tapCount('camel') >= 2) award('aral-deve'); });
    if (puddle.on > 0.5) add({ sx: puddle.x, sy: puddle.y - 10 * U, get x() { return puddle.x; }, get y() { return puddle.y - 8 * U; } }, 'puddle', () => award('aral-tuz'));
    SHIPS.forEach(sh => add({ sx: sh.x, sy: sh.y - 24 * U, get x() { return sh.x; }, get y() { return sh.y - 26 * U; } }, sh.stuck > 0.5 ? 'shipStuck' : 'shipFloat', () => { if (sh.stuck > 0.5 && tapCount('ship' + sh.i) >= 3) award('aral-gemi'); if (sh.stuck <= 0.5) horn(); }));
    gulls.forEach(g => add({ sx: g.sx, sy: g.sy, get x() { return g.sx; }, get y() { return g.sy; } }, 'gull', gullCry));
    boats.forEach(b => add({ sx: b.sx, sy: b.sy, get x() { return b.sx; }, get y() { return b.sy; } }, 'boat'));
    if (official && official.x) add({ sx: official.x, sy: official.y, get x() { return official.x; }, get y() { return official.y; } }, 'official');
    if (!c.length) return false;
    c.sort((a, b) => a.d - b.d);
    const best = c[0];
    sayAt(best.o, lines(best.kind)); blip();
    if (best.fn) best.fn();
    return true;
  }
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || bubbles.length) return;
    if (!nextChat) nextChat = t + 7000;
    if (t < nextChat) return;
    nextChat = t + rnd(9000, 16000);
    const opts = [['kid', kid], ['elder', elder]];
    if (pickers.length) opts.push(['picker', pick(pickers)]);
    if (camel.on > 0.5) opts.push(['camel', camel]);
    const [kind, o] = pick(opts);
    const obj = kind === 'camel' ? { get x() { return camel.sx; }, get y() { return camel.sy; } } : kind === 'picker' ? { get x() { return o.sx; }, get y() { return o.sy; } } : { get x() { return o.x; }, get y() { return o.sy; } };
    sayAt(obj, lines(kind));
  }

  // mizahi küçük sahneler: duruma göre seçilir
  let nextGag = 0;
  function startGag(t) {
    const G = geo(), opts = [];
    if (camel.on > 0.6 && pickers.length) opts.push('camel');
    if (SHIPS.some(s => s.stuck > 0.7)) opts.push('gull');
    if (puddle.on > 0.6) opts.push('puddle');
    if (vis.dust > 0.25 && pickers.length) opts.push('hat');
    if (vis.F < 0.15 && G.dry > 0.3) opts.push('truck');
    if (vis.C > 1.5 && pickers.length > 2) opts.push('banner');
    if (vis.F > 0.6 && boats.length >= 2) opts.push('race');
    if (G.dry > 0.35) opts.push('ball');
    const km = M.shoreKm(vis.A * M.A0);
    if (km > 6 && km < 45 && vis.F > 0.1) opts.push('dig');
    if (!opts.length) return;
    const type = pick(opts);
    gags.push({ type, t0: t, dur: type === 'truck' ? 9000 : 6500 });
    if (type === 'hat') { const p = pick(pickers); p.hatFly = performance.now(); sayAt({ get x() { return p.sx; }, get y() { return p.sy; } }, 'Şapkam!\nTuz fırtınası!'); for (let i = 0; i < 30; i++) dust.push({ x: rnd(G.shore0, G.x1), y: G.water0 + rnd(-40, 10) * U, vx: -rnd(0.25, 0.45) * U, vy: -rnd(0, 0.04) * U, life: 1, r: rnd(4, 10) * U }); }
    if (type === 'camel') { camel.eat = true; const p = pickers[0]; setTimeout(() => { sayAt({ get x() { return p.sx; }, get y() { return p.sy; } }, 'Hey! O pamuk\nplana yazılı!'); }, 1800); setTimeout(() => { camel.eat = false; }, 5000); }
    if (type === 'gull') { const s = SHIPS.find(x => x.stuck > 0.7); sayAt({ get x() { return s.x; }, get y() { return s.y - 30 * U; } }, 'Martı: Deniz nereye\ntaşındı acaba?'); gullCry(); }
    if (type === 'puddle') sayAt({ get x() { return elder.x; }, get y() { return elder.sy; } }, 'Belki bir tane\nkalmıştır...');
    if (type === 'truck') { game.truck = true; horn(); setTimeout(() => { game.truck = false; }, 9000); }
    if (type === 'banner') sayAt({ get x() { return pickers[1].sx; }, get y() { return pickers[1].sy; } }, 'Beyaz altın!\nPlan tamam!');
    if (type === 'race') { sayAt({ get x() { return boats[0].sx; }, get y() { return boats[0].sy; } }, 'Moynak\'a ilk\nvaran kazanır!'); boats[0].v = 0.00012; boats[1].v = 0.00011; }
    if (type === 'ball') sayAt({ get x() { return kid.x; }, get y() { return kid.sy; } }, 'Burada top oynuyoruz.\nEskiden denizdi!');
    if (type === 'dig') sayAt({ get x() { return elder.x; }, get y() { return elder.sy; } }, 'Kanal kazalım,\nteknemiz denize insin!');
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
        const x = lerp(-60 * U, G.x1 * 0.42, smooth(0, 0.45, k)) + (k > 0.75 ? (k - 0.75) * -G.x1 * 2 : 0), y = G.gt + G.gh * 0.12;
        ctx.fillStyle = '#c0503a'; ctx.fillRect(x - 30 * U, y - 18 * U, 34 * U, 18 * U); ctx.fillStyle = '#e8e2d0'; ctx.fillRect(x + 4 * U, y - 14 * U, 14 * U, 14 * U);
        ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(x - 20 * U, y, 4 * U, 0, 6.283); ctx.arc(x + 10 * U, y, 4 * U, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `${9 * U}px Inter`; ctx.fillText('HAZAR', x - 27 * U, y - 6 * U);
        if (k > 0.45 && k < 0.47 && !g.said) { g.said = 1; sayAt({ x: x, y: y - 26 * U }, 'Hazar\'dan taze balık!\n2.000 km yol!'); }
      }
      if (g.type === 'banner') {
        const a = pickers[1], b = pickers[2]; if (!a || !b) continue;
        const up = Math.sin(clamp(k * 3) * Math.PI / 2) * 22 * U;
        ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.sx, a.sy + 20 * U); ctx.lineTo(a.sx, a.sy - up); ctx.moveTo(b.sx, b.sy + 20 * U); ctx.lineTo(b.sx, b.sy - up); ctx.stroke();
        ctx.fillStyle = '#c0503a'; ctx.fillRect(Math.min(a.sx, b.sx), a.sy - up - 14 * U, Math.abs(b.sx - a.sx), 14 * U);
        ctx.fillStyle = '#fff'; ctx.font = `${11 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText('BEYAZ ALTIN!', (a.sx + b.sx) / 2, a.sy - up - 3 * U); ctx.textAlign = 'left';
      }
      if (g.type === 'ball') {
        const bx = lerp(G.shore0 + 30 * U, G.shoreX - 20 * U, 0.5 + Math.sin(k * 12) * 0.3), by = G.water0 + G.gh * 0.12 - Math.abs(Math.sin(k * 24)) * 14 * U;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx, by, 4 * U, 0, 6.283); ctx.fill(); ctx.stroke();
        person(bx - 20 * U, G.water0 + G.gh * 0.12 + 10 * U, U * 0.65, { dir: 1, cap: '#3a6a9a', shirt: '#7aa7d6', step: Math.sin(t * 0.03) * 3 });
        person(bx + 22 * U, G.water0 + G.gh * 0.12 + 10 * U, U * 0.65, { dir: -1, shirt: '#e0b04a', step: Math.sin(t * 0.03 + 1) * 3 });
      }
      if (g.type === 'dig') {
        ctx.strokeStyle = 'rgba(120,96,64,.6)'; ctx.lineWidth = 3 * U; ctx.setLineDash([5 * U, 4 * U]);
        ctx.beginPath(); ctx.moveTo(G.shore0 + 30 * U, G.water0 + 4 * U); ctx.lineTo(lerp(G.shore0 + 30 * U, G.shoreX, clamp(k * 1.4)), G.water0 + 6 * U); ctx.stroke(); ctx.setLineDash([]);
      }
      if (g.type === 'race') { if (k > 0.95) boats.forEach(b => { b.v = rnd(-1, 1) * 0.00004; }); }
    }
  }

  // planlamacı: plan değerlendirmesinde yanına gelir
  let official = null;
  function drawOfficialBody(g, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = '#5a6470'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    g.fillStyle = '#3a3f46'; g.beginPath(); g.ellipse(0, -44, 9, 4, 0, 0, 6.283); g.fill(); g.fillRect(-7, -50, 14, 6); // kalpak
    g.fillStyle = rgb(PAL.ink); g.beginPath(); g.arc(-2.6, -37, 1.2, 0, 6.283); g.arc(2.6, -37, 1.2, 0, 6.283); g.fill();
    g.fillStyle = '#efe9da'; g.fillRect(9, -28, 12, 15); g.fillStyle = '#c0503a'; g.fillRect(11, -25, 8, 2); g.fillRect(11, -20, 6, 2); // plan dosyası
  }
  function drawEngineerBody(g, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = '#3a7a9a'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = '#e9c49d'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    g.fillStyle = '#f2c94c'; g.beginPath(); g.arc(0, -40, 8.5, Math.PI, 0); g.fill(); g.fillRect(-10, -41, 20, 3); // baret
    g.fillStyle = rgb(PAL.ink); g.beginPath(); g.arc(-2.6, -37, 1.2, 0, 6.283); g.arc(2.6, -37, 1.2, 0, 6.283); g.fill();
    g.strokeStyle = '#9aa0a6'; g.lineWidth = 2; g.beginPath(); g.moveTo(9, -20); g.lineTo(18, -32); g.stroke(); // anahtar
  }
  function portrait(who) {
    const c = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 120, h = 150;
    c.width = w * dpr; c.height = h * dpr; c.className = 'portrait';
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(w / 2, h - 8); g.scale(2.7, 2.7);
    (who === 'eng' ? drawEngineerBody : drawOfficialBody)(g, 0);
    return c;
  }
  function drawOfficial(G, t) {
    if (!official) return;
    const now = performance.now(), e = now - official.t0;
    const stopX = G.x1 * (mobile ? 0.3 : 0.36), startX = -40;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    if (official.leave && now > official.leave) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = G.gt + G.gh * 0.3, s = 1.15 * U, walk = e < 1500 || (official.leave && now > official.leave);
    official.x = x; official.y = y - 52 * U;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (official.leave && now > official.leave ? -1 : 1), s);
    (official.who === 'eng' ? drawEngineerBody : drawOfficialBody)(ctx, walk ? Math.sin(t * 0.02) * 4 : 0);
    ctx.restore();
    const text = official.reply || (e > 1300 ? official.say : null);
    if (text && official.lastText !== text) { official.lastText = text; sayAt(official, text); }
  }

  // =====================================================================
  // SLAYTLAR
  // =====================================================================
  const slides = [...document.querySelectorAll('.slide')];
  let cur = 0, maxSeen = 0, mode = 'title';
  const DONE_KEY = 'bny-bitti-aral';
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
    [['sandbox', '🧪 Laboratuvar'], ['facts', '📜 Gerçekte ne oldu?'], ['lessons', '💡 Ne öğrendik?']].forEach(([m, l]) => {
      const b = document.createElement('button'); b.textContent = l; b.onclick = () => goTo(slideOf(m)); nav.appendChild(b);
    });
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
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-aral', 'Başladı: Çöle Dönen Deniz'); enterGame(); }
    if (mode === 'result') renderResult();
    if (mode === 'sandbox') enterSandbox();
  }
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => { initAudio(); goTo(cur + 1); }));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { resetGame(); goTo(slideOf(b.dataset.goto)); }));
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && cur < maxSeen) goTo(cur + 1);
    if (e.key === 'ArrowLeft' && cur > 0) goTo(cur - 1);
  });

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
    // yıla bağlı durduran kartlar beklemeden öne geçer (yıl birimi hızlı akar)
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
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 4500 + plain.length * 65)));
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const YEAR = 4750 / FAST;
  let gs = M.newState();
  const game = {};
  const gW = $('g-w'), gFix = $('g-fix');
  const award = id => (window.Badges ? window.Badges.award(id) : false);

  function makeFlow() {
    const f = Array.from({ length: TOTAL + 2 }, () => 1 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.09);
    const pickYears = (n, a, b) => { const out = []; while (out.length < n) { const y = Math.round(rnd(a, b)); if (out.every(o => Math.abs(o - y) > 3)) out.push(y); } return out; };
    pickYears(3, 1964, 2007).forEach(y => { f[y - M.Y0] = rnd(0.58, 0.68); });
    pickYears(2, 1963, 2008).forEach(y => { if (f[y - M.Y0] > 0.9) f[y - M.Y0] = rnd(1.18, 1.28); });
    return f;
  }
  const flowOf = y => (game.flow && game.flow[y - M.Y0]) || 1;
  function resetGame() {
    gs = M.newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, fired: new Set(), hist: [], speed: 1, touched: false, reading: 0,
      story: false, endAfter: false, flow: makeFlow(), w: 0.2, fix: 0, trust: 70, missYears: 0, reviews: [], replaced: false, inspected: false, siberia: false, dam: false, saved: false, truck: false, unlockedFix: false,
    });
    gW.value = 20; gW.disabled = false; gFix.value = 0; gFix.disabled = true; $('w-fix').classList.add('locked'); $('o-fix').textContent = "🔒 1967'de açılır";
    document.querySelectorAll('.coach').forEach(uncoach);
    readGameSliders();
    $('g-pause').textContent = '❚❚ Durdur'; setSpeed(1);
    $('modal').hidden = true; $('harvest').hidden = true; $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone');
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {};
    choiceQ.length = 0; pickers.length = 0; gags.length = 0; setView('shore'); nextGag = 0; official = null; dust.length = 0;
    Object.assign(vis, { A: 1, sal: 10, F: 1, C: 1, w: 0.2, dust: 0, soil: 1, Vn: 0 });
    $('trust-lbl').textContent = " Moskova'nın güveni";
  }
  function readGameSliders() {
    game.w = gW.value / 100; game.fix = game.unlockedFix ? gFix.value / 100 : 0;
    $('o-w').textContent = '%' + gW.value;
    if (game.unlockedFix) $('o-fix').textContent = '%' + gFix.value;
  }
  [gW, gFix].forEach(el => el.addEventListener('input', () => {
    initAudio(); readGameSliders();
    if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); }
  }));
  $('g-view').onclick = e => { e.stopPropagation(); initAudio(); setView(view.want === 'map' ? 'shore' : 'map'); };
  $('g-pause').onclick = () => { game.paused = !game.paused; $('g-pause').textContent = game.paused ? '▶ Devam' : '❚❚ Durdur'; };
  function setSpeed(v) {
    game.speed = v; $('g-speed').textContent = v + '×';
    $('yb-speed').querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.s) === v));
  }
  $('g-speed').onclick = () => setSpeed(game.speed === 1 ? 2 : game.speed === 2 ? 4 : 1);
  $('yb-speed').querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); initAudio(); setSpeed(Number(b.dataset.s)); });

  function coach(input, text, ms = 14000) {
    const card = input.closest('.sl'); if (!card || input.disabled) return;
    document.querySelectorAll('.coach').forEach(uncoach); // aynı anda tek ipucu
    card.classList.add('coach');
    const tip = document.createElement('div'); tip.className = 'coach-tip'; tip.textContent = text; card.appendChild(tip);
    input.addEventListener('input', () => uncoach(card), { once: true });
    if (ms) card._coachT = setTimeout(() => uncoach(card), ms);
  }
  function uncoach(card) { card.classList.remove('coach'); card.querySelectorAll('.coach-tip').forEach(t => t.remove()); clearTimeout(card._coachT); }
  function once(key, fn) { if (game.fired && !game.fired.has(key)) { game.fired.add(key); fn(); } }

  const MOYNAQ = '../../assets/img/cards/moynaq-aral-sea-6226807306.jpg';
  const STORY = [
    ['🌊', 'Aral Gölü · 1960', 'Dünyanın <b>4. büyük gölü</b>. Kıyıda balıkçı kasabası Moynak.', '', { pause: true }],
    ['🏛️', 'Moskova', 'Pamuk istiyoruz! Pamuk için su lazım: suyu gölü besleyen nehirden alacaksın.', '', { pause: true }],
    ['📋', 'Plan', '1965 hedefi: pamuk <b>1,3×</b>. Hedef sol üstte.', 'warn', { ms: 7000 }],
  ];
  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (game.started) return;
    game.started = true; game.story = true; // görev kartı kapanana kadar zaman durur
    const show = i => {
      if (mode !== 'game') return;
      if (i >= STORY.length) { game.story = false; return game.w <= 0.3 ? coach(gW, '👉 Kaydır: tarlaya daha çok su', 0) : null; }
      const [ic, from, text, tone, opt0] = STORY[i];
      const opt = wasDone ? { ...opt0, pause: false, ms: 6000 } : opt0; // tekrar oynayışta hikâye durdurmaz
      toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
      if (!opt.pause) setTimeout(() => show(i + 1), 6500 / Math.max(1, FAST / 2));
    };
    const start = () => { if (wasDone) game.story = false; setView("map", 7000); setTimeout(() => show(0), 300); };
    if (window.Mission && !window.__mSeen && (window.__mSeen = 1)) window.Mission.show($('modal'), MISSION, start); else start();
  }

  function updateGame(dt) {
    if (mode !== 'game' || game.paused || game.reading || game.story || game.state !== 'play' || gs.y > M.Y1) return;
    const visible = $('toasts').querySelector('.toast:not(.out)');
    const pace = visible ? 1.5 : toastQueue.length ? 0.95 : 0.47;
    const dur = YEAR * (gs.y < M.Y0 + 2 ? 1.6 : 1) / game.speed;
    game.frac += dt / (dur * pace);
    if (game.frac >= 1) { game.frac -= 1; yearTick(); }
  }

  const choiceQ = [];
  function choice(from, title, text, opts, who) {
    // aynı yıl iki karar gelirse ikincisi sıraya girer, üst üste yazılmaz
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
  const milestone = (ic, from, text, tone, then) => { if (game.speed > 1) setSpeed(1); showToast(ic, from, text, tone, { pause: true, then }); };
  const comeOfficial = (who, say) => { official = { t0: performance.now(), leave: 0, who, say }; };

  function yearTick() {
    const y = gs.y;
    M.step(gs, { w: game.w, fix: game.fix, warm: 1, dam: game.dam ? 1 : 0, q: flowOf(y) });
    game.qNow = flowOf(y);
    // gelecek yılın nehri: dağlardaki kar bir yıl önceden haber verir
    const qn = flowOf(y + 1);
    if (y < M.Y1 && qn < 0.75) milestone('☀️', 'Dağlardan haber', `Dağlarda kar az: <b>gelecek yıl</b> nehir yalnız %${Math.round(qn * 100)} akacak. Planı mı korursun, gölü mü?`, 'warn');
    else if (y < M.Y1 && qn > 1.15) toast('🌨️', 'Dağlardan haber', `Bol kar yağdı: gelecek yıl nehir %${Math.round(qn * 100)} akacak.`, 'good');
    const h = gs.hist[gs.hist.length - 1];
    game.hist.push(h);
    const tgt = targetFor(y);
    // Moskova her yıl sayar: hedefin altında kalan yıl güvenden ciddi puan götürür
    if (y > M.Y0 && !game.replaced && h.C < tgt - 0.02) { game.missYears = (game.missYears || 0) + 1; game.trust = clamp(game.trust - 6, 0, 100); if (!PLAN[y]) once('miss' + Math.floor(y / 3), () => toast('📉', 'Moskova', `${y}: plan tutmadı (${fmtX(h.C)} / ${fmtX(tgt)}).`, 'warn')); }
    // güven: plan hedefine ne kadar yakınsan; kanal onarımı sürerken para "boruya" gider
    if (!game.replaced) {
      const building = game.fix > 0 && gs.eff < 0.5 + 0.35 * game.fix - 0.02;
      game.trust = clamp(game.trust + (h.C / tgt - 0.95) * 20 - (building ? 4 * game.fix : 0), 0, 100);
      if (building) once('build', () => toast('🔧', 'Moskova', 'Onarım sürüyor, pamuk biraz düştü. "Para neden boruya?" diyorlar.', 'warn'));
    }
    const km = M.shoreKm(h.A);
    $('yb-harvest').textContent = `🌊 %${Math.round(h.A / M.A0 * 100)}`;
    $('yb-harvest').style.color = h.A / M.A0 > 0.7 ? 'var(--green)' : h.A / M.A0 > 0.4 ? 'var(--grain)' : 'var(--danger)';

    if (game.w > 0.3 && y >= 1962) once('canal', () => toast('🚜', 'Kanal inşaatı', 'Yeni kanallar kazılıyor. Çoğu toprak: suyun yarısı yolda sızıyor.'));
    if (km > 8) once('km8', () => { const G = geo(); pulseAt(() => [(geo().shore0 + geo().shoreX) / 2, geo().water0 + geo().gh * 0.3]); toast('⚓', 'Moynak', 'Kıyı limandan uzaklaşıyor. Kırmızı ok ne kadar gittiğini gösteriyor.', 'warn'); });
    if (h.sal > 14) once('sal14', () => { pulseAt(() => [Math.max(geo().shoreX + 70 * U, geo().x1 * 0.8), geo().waterY + 34 * U]); toast('🔬', 'Biyolog', 'Su azalınca tuz yoğunlaşıyor. Balıklar zorlanıyor.', 'warn'); });
    if (h.F < 0.5) once('f50', () => { pulseAt(() => [geo().x1 * 0.43 + 17 * U, geo().gt + geo().gh * 0.1 - 20 * U]); toast('🐟', 'Konserve fabrikası', 'Balık yarıya indi. Fabrika yarım gün çalışıyor.', 'warn'); });
    if (h.F < 0.1) once('f10', () => toast('🚂', 'Moynak', 'Gölde balık kalmadı. Fabrika balığı 2.000 km öteden getiriyor.', 'bad'));
    if (h.dust > 0.25) once('dust', () => { pulseAt(() => [geo().x1 * 0.33, geo().gt + geo().gh * 0.5], '#c0503a'); toast('🌪️', 'Tuz fırtınası', 'Kuruyan tabandan tuzlu toz kalkıyor. Tarla ve insanlar zarar görüyor.', 'bad'); });
    if (h.Vn !== null) once('split', () => { setView('map', 8000); milestone('🛰️', 'Uydu görüntüsü', 'Göl ikiye ayrıldı: kuzeyde Küçük Aral, güneyde Büyük Aral. Haritada gör.', 'bad'); });
    if (h.A / M.A0 > 0.85 && y >= 1980) once('alive', () => toast('🌊', 'Moynak', 'Aral hâlâ dalgalı. Balıkçılar mutlu.', 'good'));
    if (game.saved && h.saln < 15) once('north', () => { toast('🐟', 'Kuzey Aral', 'Kuzey Aral\'da tuz azaldı, balıklar geri döndü!', 'good'); });

    // kanal onarımı 1970'te açılır
    if (y === 1967 && !game.unlockedFix) {
      game.unlockedFix = true; gFix.disabled = false; $('w-fix').classList.remove('locked'); readGameSliders(); if (game.speed > 1) setSpeed(1);
      milestone('🔧', 'Su mühendisi', 'Yeni araç: <b>kanal onarımı</b>. Aynı pamuk, daha az su. Ama birkaç yıl pamuk düşer.', '', () => { if (Number(gFix.value) < 50) coach(gFix, '👉 Kaydır: kanalları onar'); });
    }
    // Sibirya projesi: hayal mi, çözüm mü?
    if (y === 1975) {
      comeOfficial('off', 'Büyük bir proje var!');
      choice('Moskova\'dan planlamacı', 'Sibirya nehirleri', '"Yoldaş, kuzeydeki Sibirya nehirlerini binlerce kilometrelik kanallarla güneye çevireceğiz. Su gelecek, Aral dolacak! Şimdilik sulamaya devam."', [
        { label: 'Harika, sulamaya devam!', sub: 'Proje gelince her şey düzelir', fn: () => { game.siberia = true; award('aral-sibirya'); } },
        { label: 'Gelecek suya güvenmem', sub: 'Bugünkü suyu idareli kullan', fn: () => { toast('🤔', 'Moskova', 'Planlamacı omuz silkti: "Sen bilirsin."'); coach(gW, '👉 İstersen suyu azalt', 9000); } },
      ]);
    }
    if (y === 1986) milestone('📜', 'Moskova', 'Sibirya projesi <b>iptal edildi</b>. Aral\'a dışarıdan su gelmeyecek.', game.siberia ? 'bad' : '');
    if (y === 1991) { $('trust-lbl').textContent = ' Hükümetin güveni'; milestone('🗺️', 'Haber', 'Sovyetler Birliği dağıldı. Göl artık birkaç ülkenin ortak sorunu.', ''); }
    // Kokaral seti: kuzeydeki küçük gölü kurtarmak
    if (y === 2003 && h.Vn !== null) {
      setView('map', 9000);
      comeOfficial('eng', 'Bir set fikrimiz var.');
      choice('Kazak su mühendisi', 'Kokaral seti', '"Kuzeydeki küçük gölü 13 km\'lik bir setle ayıralım. Siri Derya\'nın suyu orada kalır, göl yükselir, tuz azalır. Büyük Aral\'a giden su ise daha da azalır."', [
        { label: 'Seti yap', sub: 'Kuzey Aral kurtulabilir', fn: () => { game.dam = true; game.saved = true; award('aral-kokaral'); toast('🧱', 'Kokaral', 'Set inşa ediliyor. 2005\'te bitecek.', 'good'); } },
        { label: 'Yapma', sub: 'İki göl de aynı yolda', fn: () => toast('🧱', 'Kokaral', 'Set yapılmadı. Kuzey göl de tuzlanmaya devam ediyor.', 'warn') },
      ], 'eng');
    }
    // beş yıllık plan değerlendirmesi
    if (PLAN[y] && !game.replaced) {
      const ok = h.C >= PLAN[y] - 0.02;
      game.reviews.push({ y, ok, C: h.C, t: PLAN[y] });
      comeOfficial('off', ok ? 'Plan tuttu mu?\nBakalım...' : 'Rakamlar nerede,\nyoldaş?');
      const from = y <= 1990 ? 'Moskova\'dan planlamacı' : 'Taşkent\'ten bakan yardımcısı', hey = y <= 1990 ? 'yoldaş' : 'sayın planlamacı';
      const nextY = Object.keys(PLAN).map(Number).find(k => k > y), nextT = nextY ? ` Sıradaki hedef: <b>${fmtX(PLAN[nextY])}</b> (${nextY}).` : '';
      const alive = h.A / M.A0 < 0.85;
      if (ok) choice(from, `${y}: plan tuttu`, `"Hedef ${fmtX(PLAN[y])} idi, sen <b>${fmtX(h.C)}</b> yaptın. Tebrikler, ${hey}!"${nextT}`, [
        { label: 'Teşekkürler', sub: 'Güven artar', fn: () => { game.trust = clamp(game.trust + 15, 0, 100); } },
      ]);
      else choice(from, `${y}: plan tutmadı`, `"Hedef ${fmtX(PLAN[y])} idi, sen yalnız <b>${fmtX(h.C)}</b> yaptın. Tarlaya daha çok su ver, ${hey}!"${nextT}`, [
        { label: 'Söz, suyu artıracağım', sub: 'Pamuğa giden su +%15', fn: () => { gW.value = Math.min(100, Number(gW.value) + 15); readGameSliders(); game.trust = clamp(game.trust - 5, 0, 100); } },
        { label: alive ? 'Göl ölüyor, daha fazla veremem' : 'Göle de su kalmalı', sub: 'Güven çok düşer', fn: () => { game.trust = clamp(game.trust - 20, 0, 100); if (game.trust <= 0) inspector(); } },
      ]);
    }
    if (game.trust < 30 && !game.replaced) once('warn-trust', () => { toast('📞', 'Moskova', 'Telefon çalıyor: "Pamuk planı ciddiye alınmıyor mu?"', 'warn'); if (game.w < 0.6) coach(gW, '👉 Moskova kızıyor: suyu artır'); });
    if (game.trust <= 0 && !game.replaced && game.state === 'play') inspector();

    if (gs.y > M.Y1 && game.state === 'play') endGame();
    else if (gs.y > M.Y1) game.endAfter = true;
  }

  function inspector() {
    if (game.inspected || game.replaced) return;
    game.inspected = true; comeOfficial('off', 'Son uyarı, yoldaş.');
    choice('Moskova\'dan müfettiş', 'Sabır tükendi', '"Pamuk planının gerisindesin. Tarlaya giden suyu hemen <b>en az %80</b> yap, yoksa görevden alınırsın."', [
      { label: 'Tamam, suyu artırıyorum', sub: 'Pamuğa giden su en az %80 olur', fn: () => { gW.value = Math.max(Number(gW.value), 80); readGameSliders(); game.trust = 35; toast('🏛️', 'Moskova', 'Müfettiş memnun ayrıldı. Göl memnun değil.', 'warn'); } },
      { label: 'Hayır, gölü kurutmayacağım', sub: 'Görevden alınırsın, oyun biter', fn: () => { game.replaced = true; toast('📜', 'Moskova', 'Görevden alındın. Yerine gelen ilk iş suyu açtı.', 'bad'); endGame(); } },
    ]);
  }

  function awardEnd() {
    if (game.replaced || gs.y <= M.Y1) return;
    const last = game.hist[game.hist.length - 1];
    if (last.A / M.A0 >= 0.6) award('aral-deniz');
    if (Math.min(...game.hist.map(h => h.F)) >= 0.5) award('aral-balik');
    if ((game.missYears || 0) <= 1 && last.A / M.A0 >= 0.5) award('aral-plan');
  }
  function endGame() {
    if (game.state === 'end') return;
    setView('map', 4000);
    awardEnd();
    game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-aral', 'Bitirdi: Çöle Dönen Deniz');
    maxSeen = slides.length - 1; paintDots(); replayNav();
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 1600);
  }

  function renderResult() {
    if (!game.hist.length || (gs.y <= M.Y1 && !game.replaced)) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const last = game.hist[game.hist.length - 1], hy = HISTORY.hist[Math.min(HISTORY.hist.length - 1, game.hist.length - 1)];
    const aY = Math.round(last.A / M.A0 * 100), aH = Math.round(hy.A / M.A0 * 100);
    const cAvg = game.hist.reduce((s, h) => s + h.C, 0) / game.hist.length, cH = HISTORY.hist.slice(0, game.hist.length).reduce((s, h) => s + h.C, 0) / game.hist.length;
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'Gölü savundun ve koltuğunu kaybettin. Tarihte de plana itiraz edenler kenara itildi. Doğruyu bilmek yetmiyor; sistemin de seni dinlemesi gerekiyor.'; }
    else if (aY >= 60) { title = last.F < 0.3 ? 'Göl yaşıyor, balık zor durumda' : 'Deniz yaşıyor'; text = last.F < 0.3 ? 'Gölü kurtardın ama tuz balıkları öldürdü. Biraz daha su göle gitseydi Moynak\'ın ağları da dolardı.' : 'Hem pamuk yetiştirdin hem gölü korudun. Bunun sırrı suyu boşa harcamamaktı. Tarihte bu yol denenmedi.'; }
    else if (aY >= 40) { title = 'Yarım bir deniz'; text = 'Göl küçüldü ama ölmedi. Moynak\'ta balıkçılar zor durumda, yine de dalga sesi duyuluyor.'; }
    else { const planOk = game.reviews.filter(r => r.ok).length >= game.reviews.length / 2; title = 'Gemiler kumda kaldı'; text = planOk ? 'Pamuk planı tuttu, göl kayboldu. Tebrikler, tarihi başarıyla tekrarladın. Toz fırtınaları ve tuzlu toprak, kazandığın pamuğun bir kısmını geri aldı.' : 'Göl kayboldu, pamuk planı da çoğu zaman tutmadı. Su ne tarlaya ne göle yetti.'; }
    if (game.saved) text += ' Kokaral setiyle kuzeydeki küçük gölü kurtardın.';
    const col = v => v >= 60 ? 'var(--green)' : v >= 40 ? 'var(--grain)' : 'var(--danger)';
    const yEnd = game.replaced ? gs.y - 1 : M.Y1;
    $('result').innerHTML = `
      <div class="kicker">${yEnd}${game.replaced ? ' · görevden alındın' : ' · görev süren doldu'}</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${window.SceneUtils ? window.SceneUtils.bestLine('aral', aY, 'göl alanı', !game.replaced) : ''}
      <div class="rgrid">
        <div><div class="y">Göl alanı</div><div class="v" style="color:${col(aY)}">%${aY}</div><div class="h">tarihte: %${aH}</div></div>
        <div><div class="y">Tuzluluk</div><div class="v" style="color:${last.sal < 20 ? 'var(--green)' : last.sal < 40 ? 'var(--grain)' : 'var(--danger)'}">${Math.round(last.sal)} g/L</div><div class="h">tarihte: ${Math.round(hy.sal)} g/L</div></div>
        <div><div class="y">Ortalama pamuk</div><div class="v">${fmtX(cAvg)}</div><div class="h">tarihte: ${fmtX(cH)}</div></div>
      </div>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return d ? `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>` : ''; }).join('')}</div>` : ''}
      <canvas class="rchart" id="rchart"></canvas>
      <div class="legend"><span style="--c:#5b93b8">Göl alanı</span><span style="--c:#b9a98a">Tuz</span><span style="--c:#6d8fa0">Balık</span><span style="--c:#c29a2e">Pamuk</span><span style="--c:#9aa59a">Tarihteki göl (kesikli)</span></div>
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
    for (let k = 10; k < n; k += 10) { g.beginPath(); g.moveTo(X(k), pad); g.lineTo(X(k), h - pad); g.stroke(); }
    series.forEach(s => {
      if (!s.data.length) return;
      g.strokeStyle = s.color; g.lineWidth = s.dash ? 1.8 : 3; g.lineJoin = 'round'; g.lineCap = 'round';
      g.setLineDash(s.dash ? [5, 5] : []);
      g.beginPath(); s.data.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke();
    });
    g.setLineDash([]);
  }
  const series = hist => [
    { data: hist.map(d => d.C / 2.5), color: '#c29a2e', label: 'Pamuk', fmt: v => (v * 2.5).toFixed(1).replace('.', ',') + '×' },
    { data: hist.map(d => d.F), color: '#6d8fa0', label: 'Balık', fmt: v => '%' + Math.round(v * 100) },
    { data: hist.map(d => d.sal / 120), color: '#b9a98a', label: 'Tuz', fmt: v => Math.round(v * 120) + ' g/L' },
    { data: hist.map(d => d.A / M.A0), color: '#5b93b8', label: 'Göl', fmt: v => '%' + Math.round(v * 100) },
  ];
  function drawResultChart() { lineChart($('rchart'), [{ data: HISTORY.hist.map(d => d.A / M.A0), color: '#9aa59a', dash: true, label: 'Tarihte göl', fmt: v => '%' + Math.round(v * 100) }, ...series(game.hist)], TOTAL, { y0: M.Y0 }); }

  // =====================================================================
  // LABORATUVAR (1960–2060)
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: M.newState(), p: { ...M.DEF } };
  function readSliders() {
    sb.p.w = $('p-w').value / 100; sb.p.fix = $('p-fix').value / 100; sb.p.warm = $('p-warm').value / 100; sb.p.dam = Number($('p-dam').value);
    $('o-pw').textContent = '%' + $('p-w').value; $('o-pfix').textContent = '%' + $('p-fix').value;
    $('o-pwarm').textContent = '×' + sb.p.warm.toFixed(2).replace('.', ','); $('o-pdam').textContent = sb.p.dam ? 'var' : 'yok';
  }
  ['p-w', 'p-fix', 'p-warm', 'p-dam'].forEach(id => $(id).addEventListener('input', () => { readSliders(); sb.preset = null; document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: null, none: [20, 0, 100, 0], smart: [50, 100, 100, 0], hot: [50, 100, 125, 0] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset];
    sb.preset = b.dataset.preset;
    if (v) ['p-w', 'p-fix', 'p-warm', 'p-dam'].forEach((id, i) => $(id).value = v[i]);
    readSliders();
    sb.st = M.newState(); sb.frac = 0; updateSbStats(); drawSbChart();
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
      if (sb.st.y > 2060) sb.st = M.newState();
      if (sb.preset === 'history') { const hp = M.histP(sb.st.y); sb.p.w = hp.w; sb.p.dam = hp.dam; $('p-w').value = Math.round(hp.w * 100); $('p-dam').value = hp.dam; $('o-pw').textContent = '%' + Math.round(hp.w * 100); $('o-pdam').textContent = hp.dam ? 'var' : 'yok'; }
      M.step(sb.st, sb.p);
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() {
    const h = sb.st.hist[sb.st.hist.length - 1];
    $('sb-year').textContent = String(sb.st.hist.length ? h.y : 1960);
    $('sb-harvest').textContent = `Göl: %${h ? Math.round(h.A / M.A0 * 100) : 100} · Tuz: ${h ? Math.round(h.sal) : 10} g/L`;
  }
  function drawSbChart() { lineChart($('sb-chart'), series(sb.st.hist), 101, { y0: M.Y0, step: 20 }); }

  // =====================================================================
  // DOKUNMA
  // =====================================================================
  cv.addEventListener('pointerdown', e => {
    initAudio();
    if (view.k > 0.5 && mode === 'game') { setView('shore'); return; }
    // uydu görüntüsüne dokununca harita ekranı kaplar
    const sbx = drawSat.box;
    if (mode === 'game' && sbx && e.clientX > sbx.x && e.clientX < sbx.x + sbx.w && e.clientY > sbx.y && e.clientY < sbx.y + sbx.h + 20 * U) { setView('map'); blip(); return; }
    if (mode === 'game' || mode === 'sandbox' || mode === 'title') talkAt(e.clientX, e.clientY);
  });

  // =====================================================================
  // DÖNGÜ
  // =====================================================================
  let last = performance.now(), bgTick = 0, lastBg = '';
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    updateGame(dt); updateSandbox(dt); ambientChat(now);
    if (game.endAfter && game.state === 'play') { game.endAfter = false; endGame(); }
    const src = mode === 'sandbox' ? sb.st : (mode === 'game' || mode === 'result') ? gs : null;
    const h = src && src.hist.length ? src.hist[src.hist.length - 1] : null;
    if (h) Object.assign(target, { A: h.A / M.A0, sal: h.sal, F: h.F, C: h.C, dust: h.dust, soil: h.soil, Vn: h.Vn || 0, w: mode === 'sandbox' ? sb.p.w : game.w });
    else Object.assign(target, { A: 1, sal: 10, F: 1, C: 1, dust: 0, soil: 1, Vn: 0, w: mode === 'game' ? game.w : 0.2 });
    if (mode === 'game' && !h) target.w = game.w;
    const k = 1 - Math.pow(0.93, dt / 16);
    for (const key of Object.keys(target)) vis[key] = lerp(vis[key], target[key], key === 'w' ? k * 2 : k * 0.5);
    const health = 0.5 * vis.A + 0.3 * vis.F + 0.2 * (1 - vis.dust);
    vis.bad = lerp(vis.bad, smooth(0.15, 0.7, 1 - health), k * 0.5);
    if (view.until && (game.reading || game.state === 'choice')) view.until += dt; // kart okunurken harita kapanmasın
    if (view.until && performance.now() > view.until && !view.user) setView('shore');
    if (mode !== 'game' && view.want === 'map' && mode !== 'result') setView('shore');
    view.k = lerp(view.k, view.want === 'map' && (mode === 'game' || mode === 'result') ? 1 : 0, 1 - Math.pow(0.9, dt / 16));
    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);
    render(now, dt);

    if (mode === 'game') {
      // yıl çubuğu son işlenen yılı gösterir; kartlar da o yıla aittir
      const yy = String(Math.max(M.Y0, Math.min(gs.y - 1, M.Y1)));
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = planName(Math.min(gs.y, M.Y1));
      $('g-date').textContent = yy;
      $('yb-fill').style.width = clamp((gs.hist.length + game.frac) / TOTAL) * 100 + '%';
      const tgt = targetFor(Math.min(gs.y, M.Y1));
      $('pl-n').textContent = fmtX(vis.C); $('pl-t').textContent = fmtX(tgt);
      $('pl-bar').style.width = clamp(vis.C / tgt) * 100 + '%';
      $('g-plan').classList.toggle('done', vis.C >= tgt - 0.02);
      $('m-a').style.width = clamp(vis.A) * 100 + '%';
      $('m-sal').style.width = clamp(vis.sal / 120) * 100 + '%';
      $('m-fish').style.width = clamp(vis.F) * 100 + '%';
      $('m-c').style.width = clamp(vis.C / 2.2) * 100 + '%';
      $('m-trust').style.width = game.trust + '%';
      $('m-trust').parentElement.parentElement.classList.toggle('low', game.trust < 30);
    }
    if (++bgTick % 6 === 0) {
      const bg = rgb(mixC(PAL.bgOk, PAL.bgBad, vis.bad));
      if (bg !== lastBg) { document.documentElement.style.setProperty('--bg', bg); lastBg = bg; }
    }
    if (AC && waveGain && bgTick % 10 === 0) { waveGain.gain.setTargetAtTime(clamp(vis.A - 0.15) * 0.05, AC.currentTime, 0.8); windGain.gain.setTargetAtTime(0.03 + vis.dust * 0.06, AC.currentTime, 0.8); }
    if (AC && Math.random() < 0.002 && vis.A > 0.3) gullCry();
    requestAnimationFrame(frame);
  }

  resetGame();
  if (wasDone) { paintDots(); replayNav(); }
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, sb, vis, SHIPS, camel, puddle, pickers, gags, M, get gs() { return gs; }, get mode() { return mode; }, gag: () => { nextGag = 1; }, go: m => { maxSeen = slides.length; goTo(slideOf(m)); } };
  window.addEventListener('resize', resize);
  resize();
  goTo(0);
  requestAnimationFrame(frame);
})();
