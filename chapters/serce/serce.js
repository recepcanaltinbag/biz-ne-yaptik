// Bölüm 1 — Serçelere Savaş (Çin, 1958–1961)
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // =====================================================================
  // MODEL — S: serçe (1 = sağlıklı), P: zararlı böcek (~0.8 normal), F: tarla (0–1)
  // =====================================================================
  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const TOTAL = 36;
  const calMonth = m => (2 + m) % 12;
  const calYear = m => 1958 + Math.floor((2 + m) / 12);
  const isWarm = cm => cm >= 3 && cm <= 8;
  const DEF = { hunt: 0, nest: 0, heat: 1 };
  const PK = 6; // böcek taşıma kapasitesi (serçe yokken ulaşılabilecek en yüksek seviye)

  const newState = () => ({ m: 0, S: 1, P: 0.5, F: 1, harvests: [], hist: [] });

  function step(st, p = DEF) {
    const cm = calMonth(st.m);
    if (cm === 2) st.F = 1; // yeni ekim
    // serçeler Nisan–Temmuz arası ürer; yuvalar hem üremeyi hem dışarıdan gelişi artırır
    if (cm >= 3 && cm <= 6) st.S += (0.15 + 0.2 * p.nest) * st.S * (1 - st.S) + 0.004 * (1 + 3 * p.nest) * (1 - st.S);
    st.S -= p.hunt * 0.2 * st.S;
    if (isWarm(cm)) st.P += 0.85 * p.heat * st.P * (1 - st.P / PK) - 0.62 * st.S * st.P;
    else st.P = Math.max(0.08, st.P * 0.8);
    if (isWarm(cm)) st.F -= st.F * 0.05 * st.P;
    if (cm >= 6 && cm <= 8) st.F -= st.F * 0.025 * st.S;
    if (cm === 9) st.harvests.push(st.F);
    st.S = clamp(st.S); st.P = Math.max(0.05, st.P); st.F = clamp(st.F);
    st.hist.push({ S: st.S, P: st.P, F: st.F });
    st.m++;
  }

  function run(months, pOf) {
    const st = newState();
    while (st.m < months) step(st, pOf(st.m));
    return st;
  }
  const BASE = run(TOTAL, () => DEF);
  const HISTORY = run(TOTAL, m => ({ ...DEF, hunt: m < 14 ? 1 : m < 26 ? 0.5 : 0 }));
  const EQ = run(120, () => DEF); // laboratuvar için denge yılı
  const EQ_F = Array.from({ length: 12 }, (_, cm) => EQ.hist[108 + ((cm - 2 + 12) % 12)].F);
  const EQ_H = EQ.harvests[EQ.harvests.length - 1];
  const hIdx = (st, i, base) => Math.round((st.harvests[i] / base.harvests[i]) * 100);

  // =====================================================================
  // SES — tamamen sentezlenmiş: rüzgâr, cıvıltı, tencere, böcek vızıltısı
  // =====================================================================
  let AC = null, master, buzzGain, noiseBuf, muted = false;
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
      loop(420, 'lowpass', 0.5, 0.035);           // rüzgâr
      buzzGain = loop(560, 'bandpass', 3, 0);     // böcek vızıltısı
    } catch (e) { AC = null; }
  }
  function pan(x) {
    if (!AC.createStereoPanner) return master;
    const p = AC.createStereoPanner(); p.pan.value = clamp((x / W) * 2 - 1, -1, 1) * 0.6; p.connect(master); return p;
  }
  function clang(x) {
    if (!AC) return;
    if (mode === 'game' && (!game.campaign || game.k <= 0)) return; // tencere çalan yoksa ses de yok
    const t = AC.currentTime, out = pan(x);
    [[523, .2], [1187, .11], [1873, .07], [2650, .04]].forEach(([f, g], i) => {
      const o = AC.createOscillator(), e = AC.createGain();
      o.frequency.value = f * rnd(0.98, 1.02); o.connect(e); e.connect(out);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.004);
      e.gain.exponentialRampToValueAtTime(0.0001, t + 0.9 - i * 0.15);
      o.start(t); o.stop(t + 1);
    });
  }
  function chirp(x) {
    if (!AC) return;
    const t0 = AC.currentTime, out = pan(x), base = rnd(3400, 4400), n = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const t = t0 + k * 0.12, o = AC.createOscillator(), e = AC.createGain();
      o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base + 1300, t + 0.04);
      o.frequency.linearRampToValueAtTime(base + 300, t + 0.09);
      o.connect(e); e.connect(out);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.025, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.start(t); o.stop(t + 0.12);
    }
  }
  function thud() {
    if (!AC) return;
    const t = AC.currentTime, o = AC.createOscillator(), e = AC.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.18);
    o.connect(e); e.connect(master);
    e.gain.setValueAtTime(0.09, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.start(t); o.stop(t + 0.22);
  }
  $('sound').onclick = () => {
    muted = !muted; initAudio();
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

  // her slayt için tarlanın ekrandaki yeri
  function layoutFor(m) {
    const L = { gt: 0.66, gb: 1, x1: 1 };
    if (m === 'intro') L.gt = 0.6;
    if (m === 'poster') L.gt = 0.82;
    if (m === 'game') {
      if (mobile || document.body.classList.contains('dock')) {
        // tarla, panelin hemen üstünde biter: panel küçüldükçe sahne büyür
        const pnl = document.querySelector('.slide.active .gpanel');
        const top = pnl ? pnl.getBoundingClientRect().top : H * 0.56;
        L.gb = clamp((top - 6) / H, 0.4, 0.86); L.gt = Math.max(0.24, L.gb - (mobile ? 0.3 : 0.36));
      } else { L.gt = 0.6; L.x1 = (W - 366) / W; }
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') L.gt = 0.9;
    if (m === 'sandbox') { if (mobile) { L.gt = 0.3; L.gb = 0.47; } else { L.gt = 0.58; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.66, gb: 1, x1: 1 };

  const PAL = {
    bgOk: [233, 240, 222], bgBad: [244, 219, 209],
    grass: [186, 210, 150], grassBad: [216, 186, 160], grassWinter: [206, 204, 180],
    hill: [205, 222, 180], hillBad: [228, 205, 186],
    stem: [104, 146, 78], stemRipe: [196, 160, 70], stemDry: [168, 128, 96],
    head: [214, 170, 62], stubble: [176, 154, 112],
    ink: [43, 58, 46], bird: [156, 107, 71], birdDark: [118, 78, 50], belly: [226, 196, 156], beak: [232, 160, 60],
    bug: [88, 118, 48], locust: [128, 112, 40], sun: [246, 210, 104],
  };

  const birds = [], bugs = [], rings = [], floats = [], bubbles = [], villagers = [];
  const clouds = Array.from({ length: 4 }, (_, i) => ({ x: rnd(0, 1), y: rnd(0.12, 0.3), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000014) }));
  const vis = { S: 1, P: 0.6, Fr: 1, c: 6.3, warm: 1, bad: 0 };

  function groundY(x) { return lay.gt * H + Math.sin(x * 0.009) * 5 * U + Math.sin(x * 0.021 + 1.3) * 3 * U; }

  function spawnBird(anywhere) {
    const left = Math.random() < 0.5, x1 = lay.x1 * W;
    const skyB = Math.max(110, lay.gt * H - 40 * U);
    birds.push({
      x: anywhere ? rnd(40, x1 - 40) : (left ? -20 : x1 + 20), y: rnd(90, skyB),
      vx: (left ? 1 : -1) * rnd(1, 2) * U, vy: rnd(-0.5, 0.5),
      ph: rnd(0, 6.28), sz: rnd(0.85, 1.12), hits: 0, lastHit: 0, panic: 0,
      fallen: false, a: 1, dive: null, leave: false,
    });
  }

  function fallBird(b, byPlayer) {
    b.fallen = true; b.vy = -2 * U; b.vr = rnd(-0.12, 0.12); b.rot = 0;
    b.landY = rnd(lay.gt * H + 8 * U, lerp(lay.gt * H, lay.gb * H, 0.45));
    thud();
    if (byPlayer) onKill(b);
  }

  // dokunma: halka yay, yakındaki serçeleri korkut; canKill ise iki darbe düşürür
  function scare(x, y, canKill) {
    initAudio(); clang(x);
    rings.push({ x, y, r: 6, life: 1, big: true });
    const R = 95 * U, now = performance.now();
    let n = 0;
    for (const b of birds) {
      if (b.fallen || b.leave) continue;
      const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
      if (d > R) continue;
      b.panic = 60; b.dive = null;
      b.vx += (dx / (d || 1)) * 5 * U; b.vy += (dy / (d || 1)) * 5 * U;
      if (!canKill) continue;
      b.hits = now - b.lastHit < 5000 ? b.hits + 1 : 1; b.lastHit = now;
      if (b.hits >= 2) { fallBird(b, true); n++; }
    }
    return n;
  }

  function drawBird(b, t) {
    const s = 9 * U * b.sz;
    ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = b.a;
    const dir = b.vx >= 0 || b.fallen ? 1 : -1;
    if (b.fallen) ctx.rotate(b.rot);
    else ctx.rotate(dir * clamp(Math.atan2(b.vy, Math.abs(b.vx) + 0.001) * 0.55, -0.5, 0.5)); // dönüşte yatar
    ctx.scale(dir, 1);
    const flap = b.fallen ? 0.3 : b.flap !== undefined ? b.flap : Math.sin(t * (b.panic > 0 ? 0.045 : 0.018) + b.ph) * 0.7;
    // kuyruk
    ctx.fillStyle = rgb(PAL.birdDark);
    ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.1); ctx.lineTo(-s * 1.55, -s * 0.45); ctx.lineTo(-s * 1.45, s * 0.25); ctx.closePath(); ctx.fill();
    // gövde ve göğüs
    ctx.fillStyle = rgb(PAL.bird); ctx.beginPath(); ctx.arc(0, 0, s, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgb(PAL.belly); ctx.beginPath(); ctx.ellipse(s * 0.18, s * 0.4, s * 0.68, s * 0.45, 0, 0, 6.283); ctx.fill();
    // kanat
    ctx.save(); ctx.translate(-s * 0.15, -s * 0.05); ctx.rotate(-flap);
    ctx.fillStyle = rgb(PAL.birdDark); ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.15, s * 0.78, s * 0.38, -0.3, 0, 6.283); ctx.fill();
    ctx.restore();
    // gaga
    ctx.fillStyle = rgb(PAL.beak);
    ctx.beginPath(); ctx.moveTo(s * 0.88, -s * 0.18); ctx.lineTo(s * 1.45, -s * 0.02); ctx.lineTo(s * 0.88, s * 0.14); ctx.closePath(); ctx.fill();
    // göz
    if (b.fallen) {
      ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 1.6 * U;
      const ex = s * 0.42, ey = -s * 0.3, r = s * 0.17;
      ctx.beginPath(); ctx.moveTo(ex - r, ey - r); ctx.lineTo(ex + r, ey + r); ctx.moveTo(ex + r, ey - r); ctx.lineTo(ex - r, ey + r); ctx.stroke();
    } else {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.42, -s * 0.3, s * 0.27, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(s * 0.48, -s * 0.3, s * 0.14, 0, 6.283); ctx.fill();
    }
    ctx.restore();
    // korku ve yorgunluk işaretleri
    if (!b.fallen && b.panic > 0) {
      ctx.fillStyle = rgb(PAL.ink, 0.85); ctx.font = `${16 * U}px "Patrick Hand"`; ctx.textAlign = 'center';
      ctx.fillText(b.hits >= 1 ? '!!' : '!', b.x, b.y - s * 1.6);
    }
    if (!b.fallen && b.hits === 1 && performance.now() - b.lastHit < 5000) {
      ctx.fillStyle = 'rgba(120,170,220,.9)';
      ctx.beginPath(); ctx.ellipse(b.x - s * 0.9, b.y - s * 0.9, s * 0.18, s * 0.28, 0.3, 0, 6.283); ctx.fill();
    }
  }

  function drawBug(g, t, air) {
    const sc = (air ? 1.1 + smooth(2.5, 5, vis.P) * 0.6 : 0.7 + g.d * 0.7) * U;
    const col = vis.P > 2.2 ? PAL.locust : PAL.bug;
    ctx.save(); ctx.translate(g.x, g.y); if (g.dir < 0) ctx.scale(-1, 1);
    if (air) {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      const w = Math.sin(t * 0.08 + g.ph) * 2 * sc;
      ctx.beginPath(); ctx.ellipse(-0.5 * sc, -2.4 * sc - w * 0.3, 3.2 * sc, 1.4 * sc, -0.4, 0, 6.283); ctx.fill();
    }
    ctx.fillStyle = rgb(col);
    ctx.beginPath(); ctx.ellipse(0, 0, 4 * sc, 2.1 * sc, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(3.6 * sc, -0.6 * sc, 1.6 * sc, 0, 6.283); ctx.fill();
    if (!air) {
      ctx.strokeStyle = rgb(col); ctx.lineWidth = 0.9 * sc;
      ctx.beginPath(); ctx.moveTo(-1 * sc, 1 * sc); ctx.lineTo(-3.6 * sc, 3.2 * sc); ctx.moveTo(1.2 * sc, 1 * sc); ctx.lineTo(2.4 * sc, 3.4 * sc); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBubble(bb) {
    const pad = 10 * U, fs = 17 * U;
    ctx.font = `${fs}px "Patrick Hand"`;
    const lines = bb.text.split('\n');
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2, h = lines.length * fs * 1.15 + pad * 1.4;
    let x = clamp(bb.x - w / 2, 8, W - w - 8), y = bb.y - h - 22 * U;
    ctx.globalAlpha = clamp(bb.life * 3);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 12) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bb.x - 7, y + h - 1); ctx.lineTo(bb.x, y + h + 12 * U); ctx.lineTo(bb.x + 7, y + h - 1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgb(PAL.ink); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad * 0.7 + i * fs * 1.15));
    ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  }

  // ekin büyümesi takvime bağlı: Mart filiz, Ağustos olgun, Ekim sonu hasat
  function growthAt(c) {
    c = ((c % 12) + 12) % 12;
    if (c >= 2.2 && c < 7.6) return smooth(2.2, 7.6, c);
    if (c >= 7.6 && c < 9.85) return 1;
    if (c >= 9.85 && c < 10) return 1 - smooth(9.85, 10, c);
    return 0;
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H;
    const c = ((vis.c % 12) + 12) % 12;
    const winter = c >= 10.5 || c < 2;
    const g = growthAt(vis.c), ripe = smooth(5.8, 8.2, c);
    const dmg = clamp(1 - vis.Fr) * 1.4;

    // çekirge sürüsü gökyüzünü karartır
    const dark = smooth(1.8, 5, vis.P) * vis.warm * 1.6;
    if (dark > 0.01) { ctx.fillStyle = `rgba(100,76,34,${Math.min(0.42, dark * 0.2)})`; ctx.fillRect(0, 0, x1, gt); }

    // güneş ve bulutlar
    ctx.fillStyle = rgb(PAL.sun, winter ? 0.55 : 0.95);
    ctx.beginPath(); ctx.arc(x1 * 0.84, H * 0.17 + (winter ? 30 * U : 0), 30 * U, 0, 6.283); ctx.fill();
    for (const cl of clouds) {
      cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15;
      const cx = cl.x * x1, cy = cl.y * H, s = 26 * U * cl.s;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283);
      ctx.fill(); ctx.fillRect(cx - s * 1.6, cy + s * 0.2, s * 3.3, s * 0.75);
    }

    // arka tepe
    const hillC = mixC(PAL.hill, PAL.hillBad, vis.bad);
    ctx.fillStyle = rgb(winter ? mixC(hillC, PAL.grassWinter, 0.5) : hillC);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= x1 + 10; x += 12) ctx.lineTo(x, gt - 26 * U - Math.sin(x * 0.004 + 0.8) * 22 * U - Math.sin(x * 0.011) * 8 * U);
    ctx.lineTo(x1, H); ctx.closePath(); ctx.fill();

    // tarla
    let grass = mixC(PAL.grass, PAL.grassBad, clamp(vis.bad * 1.1));
    if (winter) grass = mixC(grass, PAL.grassWinter, 0.6);
    ctx.fillStyle = rgb(grass);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= x1 + 10; x += 10) ctx.lineTo(x, groundY(x));
    ctx.lineTo(x1, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgb(PAL.ink, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); for (let x = 0; x <= x1 + 10; x += 10) x ? ctx.lineTo(x, groundY(x)) : ctx.moveTo(x, groundY(x)); ctx.stroke();

    if (mode === 'game' || mode === 'title') drawNestTree(t, gt, x1);

    // başaklar: arkadan öne sıralar
    const rows = [0.06, 0.16, 0.28, 0.41, 0.55, 0.7, 0.86], bandH = gb - gt, stalkH = Math.max(bandH, H - gt);
    let stem = mixC(PAL.stem, PAL.stemRipe, ripe); stem = mixC(stem, PAL.stemDry, clamp(dmg * 0.9));
    const head = mixC(PAL.head, PAL.stemDry, clamp(dmg * 0.8));
    const headK = smooth(0.45, 0.85, g) * (0.45 + 0.55 * clamp(vis.Fr));
    const bare = clamp((1 - vis.Fr) * 1.4 - 0.12, 0, 0.8); // böceklerin yediği başaklar
    ctx.lineCap = 'round';
    rows.forEach((rf, ri) => {
      const sc = (0.65 + rf * 0.75) * U, gap = 15 * sc;
      const y0 = gt + rf * stalkH;
      ctx.strokeStyle = rgb(g < 0.04 ? PAL.stubble : stem); ctx.lineWidth = 2.2 * sc;
      ctx.beginPath();
      const tips = [];
      for (let x = (ri % 2) * gap * 0.5 + 4; x < x1; x += gap) {
        const y = y0 + Math.sin(x * 0.37 + ri) * 3 * sc;
        const eaten = ((Math.sin(x * 12.9898 + ri * 78.233) * 43758.5453) % 1 + 1) % 1 < bare;
        if (g < 0.04 || eaten) { ctx.moveTo(x, y); ctx.lineTo(x + 1, y - 4 * sc); continue; }
        const h = (6 + 30 * g) * sc * (0.55 + 0.45 * clamp(vis.Fr));
        const sw = Math.sin(t * 0.0012 + x * 0.008 - ri * 0.6) * (1 + 3 * g) * sc;
        ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - h * 0.6, x + sw, y - h);
        tips.push(x + sw, y - h, sw);
      }
      ctx.stroke();
      if (headK > 0.02) {
        ctx.fillStyle = rgb(head);
        for (let i = 0; i < tips.length; i += 3) {
          ctx.beginPath(); ctx.ellipse(tips[i], tips[i + 1] - 4 * sc * headK, 2.6 * sc, 6 * sc * headK, tips[i + 2] * 0.05, 0, 6.283); ctx.fill();
        }
      }
    });


    // böcekler
    const bugTarget = Math.round(clamp(vis.P / PK) * (mode === 'sandbox' ? 240 : 340) * vis.warm);
    while (bugs.length < bugTarget) {
      const d = Math.random();
      bugs.push({ x: rnd(4, x1 - 4), d, y: gt + (0.08 + d * 0.88) * bandH, ph: rnd(0, 6.28), r: Math.random(), dir: Math.random() < 0.5 ? 1 : -1, ax: rnd(0, x1), ay: rnd(0.3, 1) });
    }
    if (bugs.length > bugTarget) bugs.splice(0, Math.min(bugs.length - bugTarget, 6));
    const airFrac = smooth(1.8, 4.5, vis.P) * 0.7;
    for (const bg of bugs) {
      if (bg.r < airFrac) {
        bg.ax += (1.2 + Math.sin(t * 0.002 + bg.ph)) * U * bg.dir; if (bg.ax > x1 + 10) bg.ax = -10; if (bg.ax < -10) bg.ax = x1 + 10;
        const ay = lerp(H * 0.2, gt + 10 * U, bg.ay) + Math.sin(t * 0.003 + bg.ph * 4) * 24 * U;
        drawBug({ x: bg.ax, y: ay, d: 1, ph: bg.ph, dir: bg.dir }, t, true);
      } else {
        const hop = Math.max(0, Math.sin(t * 0.006 + bg.ph * 5)) * 4 * U;
        drawBug({ x: bg.x, y: bg.y - hop, d: bg.d, ph: bg.ph, dir: bg.dir }, t, false);
      }
    }

    if (mode === 'game') { drawFarmers(t, dt, gt, gb, x1); drawCampaign(t, dt, gt, gb, x1); drawGags(t, dt, gt, gb, x1); drawOfficial(t, gt, gb, x1); ambientChat(t); }

    // serçeler
    updateBirds(t, dt, gt, gb, x1);
    for (const b of birds) drawBird(b, t);

    // halkalar
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= (r.big ? 0.022 : 0.015) * (dt / 16);
      if (r.life <= 0) { rings.splice(i, 1); continue; }
      const max = r.big ? 95 * U : 22 * U;
      const rr = lerp(6, max, 1 - Math.pow(r.life, 2));
      ctx.strokeStyle = rgb(PAL.ink, r.life * (r.big ? 0.8 : 0.35)); ctx.lineWidth = (r.big ? 3 : 1.5) * r.life + 0.5;
      ctx.beginPath();
      for (let a = 0; a <= 6.3; a += 0.25) {
        const wob = rr + Math.sin(a * 5 + r.x) * 1.5;
        a ? ctx.lineTo(r.x + Math.cos(a) * wob, r.y + Math.sin(a) * wob) : ctx.moveTo(r.x + wob, r.y);
      }
      ctx.closePath(); ctx.stroke();
      if (r.big && r.life > 0.55) {
        const r2 = rr * 0.55;
        ctx.beginPath(); ctx.arc(r.x, r.y, r2, 0, 6.283); ctx.stroke();
      }
    }

    // yüzen yazılar ve konuşma balonları
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.life -= 0.012 * (dt / 16); f.y -= 0.5 * U * (dt / 16);
      if (f.life <= 0) { floats.splice(i, 1); continue; }
      ctx.fillStyle = rgb(f.col || PAL.ink, f.life); ctx.font = `${22 * U}px "Patrick Hand"`; ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bb = bubbles[i]; bb.life -= 0.0045 * (dt / 16);
      if (bb.bird && !bb.bird.fallen) { bb.x = bb.bird.x; bb.y = bb.bird.y; }
      if (bb.obj) { bb.x = bb.obj.x; bb.y = bb.obj.y - (bb.oy || 0); }
      if (bb.life <= 0) { bubbles.splice(i, 1); continue; }
      drawBubble(bb);
    }

    // nişan halkası (fare)
    if (pointer.on && (mode === 'game' || mode === 'sandbox') && pointer.x < x1) {
      ctx.strokeStyle = rgb(PAL.ink, 0.25); ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 95 * U, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    }
  }



  // ---- çiftçiler: mevsime göre sürer, çapalar, biçer ----
  const farmers = [{ x: 0.25, dir: 1, ph: 0 }, { x: 0.7, dir: -1, ph: 2 }];
  function drawFarmers(t, dt, gt, gb, x1) {
    const c = ((vis.c % 12) + 12) % 12;
    const job = c >= 2 && c < 3 ? 'plough' : c >= 3 && c < 8.3 ? 'hoe' : c >= 8.3 && c < 10 ? 'reap' : null;
    if (!job) { farmers.forEach(fm => { fm.sx = undefined; }); return; }
    const f = dt / 16.67;
    farmers.forEach((fm, i) => {
      fm.x += fm.dir * (job === 'plough' ? 0.00045 : 0.00018) * f;
      for (const o of farmers) if (o !== fm && Math.abs(o.x - fm.x) < 0.07 && Math.sign(o.x - fm.x) === fm.dir) fm.dir = -fm.dir;
      if (fm.x > 0.92) fm.dir = -1; if (fm.x < 0.08) fm.dir = 1;
      const x = fm.x * x1, y = gt + (gb - gt) * (0.42 + i * 0.22), s = U * (1.05 + i * 0.15);
      fm.sx = x; fm.sy = y - 40 * s; // baloncuk için
      ctx.save(); ctx.translate(x, y); ctx.scale(fm.dir * s, s);
      if (job === 'plough') { // öküz ve saban
        ctx.fillStyle = '#8a5a3a';
        ctx.beginPath(); ctx.ellipse(34, -16, 20, 11, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.ellipse(55, -20, 8, 7, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 4;
        const st = Math.sin(t * 0.008 + fm.ph) * 4;
        [22, 30, 40, 46].forEach((lx, k) => { ctx.beginPath(); ctx.moveTo(lx, -8); ctx.lineTo(lx + (k % 2 ? st : -st), 4); ctx.stroke(); });
        ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(52, -26); ctx.lineTo(48, -33); ctx.moveTo(58, -26); ctx.lineTo(62, -33); ctx.stroke();
        ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(14, -12); ctx.lineTo(4, -2); ctx.lineTo(-4, 4); ctx.stroke();
      }
      // gövde, şapka
      const bob = Math.sin(t * 0.006 + fm.ph) * 1.5;
      ctx.fillStyle = '#4f6f8f'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -26 + bob, 14, 22, 6) : ctx.rect(-7, -26, 14, 22); ctx.fill();
      ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -32 + bob, 7, 0, 6.283); ctx.fill();
      if (!(fm.hatGone > t)) { ctx.fillStyle = '#d9b45a'; ctx.beginPath(); ctx.moveTo(-12, -35 + bob); ctx.lineTo(0, -45 + bob); ctx.lineTo(12, -35 + bob); ctx.closePath(); ctx.fill(); }
      if (fm.broom > t) { const a = Math.sin(t * 0.02) * 0.9; ctx.save(); ctx.translate(6, -18); ctx.rotate(a); ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 14); ctx.stroke(); ctx.strokeStyle = '#d9b45a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(18, 12); ctx.lineTo(26, 20); ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2.4;
      if (job === 'hoe') { const a = Math.sin(t * 0.006 + fm.ph); ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(18, -4 + a * 8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(18, -4 + a * 8); ctx.lineTo(22, 0 + a * 8); ctx.stroke(); }
      if (job === 'reap') { const a = Math.sin(t * 0.01 + fm.ph) * 0.6; ctx.save(); ctx.translate(6, -16); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(14, -4, 6, -0.3, 2.6); ctx.stroke(); ctx.restore(); }
      ctx.restore();
    });
  }

  // ---- karakterler ara ara konuşur; dokununca da konuşurlar ----
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function lines(kind) {
    const pests = vis.P > 2, fewBirds = vis.S < 0.4, campaign = game.campaign && game.k > 0.2;
    if (kind === 'bird') return pick(campaign ? ['Konacak yer yok!\nKanatlarım yandı!', 'Bu gürültü de ne?!', 'Tencere konseri mi var?', 'Ben sadece bir serçeyim!', 'Tahıl mı? Ben böcek\nyemeye gelmiştim!', 'Bir dakika otursam...']
      : fewBirds ? ['Arkadaşlarım nerede?', 'Burası çok sessiz...', 'Son serçe ben miyim?']
      : ['Cik! Bugün yüzlerce\nböcek yakaladım.', 'Yavrularım böceğe bayılır!', 'Bu çekirgeyi kim\nısmarladı? Ben!', 'Cik cik! Yavrular aç.', 'Biraz tahıl, bol böcek.']);
    if (kind === 'villager') return pick(fewBirds ? ['Kuş kalmadı ki\nneye vuruyoruz?', 'Kotayı nasıl dolduracağız?', 'Komşunun kuşunu\nsayabilir miyiz?']
      : ['Kolum koptu\nama kota kota!', 'Bang! Bang! Bang!', 'Komşu köy 2 katını yapmış!', 'Kulaklarım çınlıyor!', 'Annemin tenceresini\nödünç aldım.', 'Bu ritim fena değil,\ngrup mu kursak?', 'Kaşık eğildi, devam!']);
    if (kind === 'farmer') return pick(pests ? ['Yapraklar delik deşik...', 'Böcekler her yerde!\nNereden çıktılar?', 'Bu yıl ambar dolmaz.', 'Çekirgeler tencereden\nkorkmuyor mu?!']
      : fewBirds ? ['Serçe yok, şimdilik\ntahıl bize kalır.', 'Kuşlar gidince\nbiraz rahatladık mı?', 'Neden bu kadar\nsessiz burası?']
      : ['Hava güzel,\nbaşaklar dolgun.', 'Serçeler biraz yer,\nama dert değil.', 'Serçeler bana yardım\nediyordu aslında.']);
  }
  function say(obj, kind, oy) {
    bubbles.length = Math.min(bubbles.length, 1);
    bubbles.push({ obj, x: obj.x, y: obj.y - oy, oy, text: lines(kind), life: 1 });
  }
  // dokununca ekrandaki en yakın karakter konuşur (mesafe sınırı yok)
  function talkAt(x, y) {
    const cands = [];
    const add = (cx, cy, fn) => cands.push([Math.hypot(cx - x, cy - y), fn]);
    birds.forEach(b => { if (!b.fallen && !b.leave) add(b.x, b.y, () => { bubbles.length = 0; bubbles.push({ bird: b, x: b.x, y: b.y, text: lines('bird'), life: 1 }); chirp(b.x); }); });
    villagers.forEach(v => { if (!(v.hidden > performance.now())) add(v.x, v.y - 30 * U, () => say(v, 'villager', 46 * U)); });
    leavers.forEach(v => add(v.x, v.y - 30 * U, () => { bubbles.length = 0; bubbles.push({ obj: v, x: v.x, y: v.y, oy: 46 * U, text: pick(['Eve gidiyorum,\nrahatsız etme!', 'Yarın yine\ntencere mi?']), life: 1 }); }));
    farmers.forEach(fm => { if (fm.sx !== undefined) add(fm.sx, fm.sy, () => say({ get x() { return fm.sx; }, get y() { return fm.sy; } }, 'farmer', 8 * U)); });
    if (official && official.x !== undefined) add(official.x, official.y, () => { bubbles.length = 0; bubbles.push({ obj: official, x: official.x, y: official.y, text: pick(['Rakamlar, yoldaş.\nRakamlar!', 'Pekin bekliyor.']), life: 1 }); });
    if (nest.x !== undefined && vis.S > 0.06) add(nest.x, nest.y, () => { bubbles.length = 0; bubbles.push({ obj: { get x() { return nest.x; }, get y() { return nest.y; } }, x: 0, y: 0, text: game.campaign && game.k > 0.25 ? 'Anne, yemek yok mu?' : pick(['Cik cik! Annem\nböcek getirdi!', 'Daha çok çekirge!']), life: 1 }); chirp(nest.x); });
    if (!cands.length) return false;
    cands.sort((a, b) => a[0] - b[0]);
    cands[0][1]();
    return true;
  }
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || game.paused) return;
    if (!nextChat) nextChat = t + 9000;
    if (t < nextChat || bubbles.length || gags.length) return;
    nextChat = t + rnd(9000, 16000);
    const opts = [];
    const alive = birds.filter(b => !b.fallen && !b.leave);
    if (alive.length) opts.push(() => { const b = pick(alive); bubbles.push({ bird: b, x: b.x, y: b.y, text: lines('bird'), life: 1 }); });
    if (villagers.length) opts.push(() => { const v = pick(villagers); say(v, 'villager', 46 * U); });
    farmers.forEach(fm => { if (fm.sx !== undefined) opts.push(() => say({ get x() { return fm.sx; }, get y() { return fm.sy; } }, 'farmer', 8 * U)); });
    if (opts.length) pick(opts)();
  }


  // ---- ara sıra mizahi küçük sahneler ----
  const gags = [];
  let nextGag = 0;
  function sayAt(getPos, text) { bubbles.length = 0; bubbles.push({ obj: { get x() { return getPos()[0]; }, get y() { return getPos()[1]; } }, x: 0, y: 0, text, life: 1 }); }

  // ---- tarlanın arkasında kalıcı ağaç ve yuva: anne serçe yavrularına böcek taşır ----
  const nest = { next: 0, phase: 'idle', t0: 0, lastCry: 0 };
  function drawNestTree(t, gt, x1) {
    const tx = x1 * (mobile ? 0.86 : 0.9), base = gt + 6 * U, s = U;
    // gövde ve dallar
    ctx.strokeStyle = '#7a5a3a'; ctx.lineCap = 'round';
    ctx.lineWidth = 12 * s; ctx.beginPath(); ctx.moveTo(tx, base); ctx.quadraticCurveTo(tx + 4 * s, base - 70 * s, tx - 4 * s, base - 130 * s); ctx.stroke();
    ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(tx - 2 * s, base - 95 * s); ctx.lineTo(tx - 46 * s, base - 112 * s); ctx.stroke();
    // yaprak kümesi (kışın seyrek)
    const leaf = vis.warm > 0.5 ? [116, 160, 84] : [150, 150, 120];
    ctx.fillStyle = rgb(leaf, vis.warm > 0.5 ? 0.95 : 0.55);
    [[0, -150, 42], [-30, -134, 30], [30, -132, 32], [-8, -176, 28], [22, -166, 24]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(tx + dx * s, base + dy * s, r * s, 0, 6.283); ctx.fill(); });
    // yuva ve yavrular
    const nx = tx - 44 * s, ny = base - 112 * s;
    const fed = nest.phase === 'feed';
    const chicks = vis.S > 0.06;
    if (chicks) for (let k = -1; k <= 1; k++) {
      const open = fed || nest.phase === 'approach' ? Math.sin(t * 0.02 + k) > -0.3 : false;
      ctx.fillStyle = '#c9a07a'; ctx.beginPath(); ctx.arc(nx + k * 7 * s, ny - 4 * s, 5 * s, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(nx + k * 7 * s + 2 * s, ny - 5 * s, 1 * s, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#e8a03c'; ctx.beginPath(); ctx.moveTo(nx + k * 7 * s - 2 * s, ny - 7 * s); ctx.lineTo(nx + k * 7 * s, ny - (open ? 15 : 10) * s); ctx.lineTo(nx + k * 7 * s + 2 * s, ny - 7 * s); ctx.fill();
    }
    ctx.fillStyle = '#a8865a'; ctx.beginPath(); ctx.ellipse(nx, ny, 17 * s, 8 * s, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(nx + k * 6 * s - 6 * s, ny + 2 * s); ctx.lineTo(nx + k * 6 * s + 6 * s, ny + 5 * s); ctx.stroke(); }
    nest.x = nx; nest.y = ny - 14 * s;

    // anne serçenin ziyareti
    if (!nest.next) nest.next = t + 6000;
    const canPlay = (mode === 'game' && game.state === 'play' && !game.paused && !game.reading) || mode === 'title';
    if (nest.phase === 'idle' && t > nest.next && canPlay && vis.S > 0.06 && vis.warm > 0.4) { nest.phase = 'approach'; nest.t0 = t; }
    if (nest.phase === 'idle' && t > nest.next && vis.S <= 0.06 && mode === 'game' && t - nest.lastCry > 22000 && !bubbles.length) {
      nest.lastCry = t; nest.next = t + 20000;
      bubbles.push({ obj: { get x() { return nest.x; }, get y() { return nest.y; } }, x: 0, y: 0, text: 'Anne...? Neredesin?', life: 1 });
    }
    const sx = nx + 200 * s, sy = ny - 120 * s, e = t - nest.t0;
    let bx = null, by = null, panic = 0;
    if (nest.phase === 'approach') {
      const q = Math.min(1, e / 2200);
      bx = lerp(sx, nx + 10 * s, q); by = lerp(sy, ny - 18 * s, q) - Math.sin(q * Math.PI) * 20 * s;
      if (q >= 1) {
        const scared = mode === 'game' && game.campaign && game.k > 0.25;
        nest.phase = scared ? 'scared' : 'feed'; nest.t0 = t;
        if (!scared) floats.push({ x: nx, y: ny - 24 * s, text: 'hap!', life: 0.9, col: PAL.bird });
      }
    } else if (nest.phase === 'feed') {
      bx = nx + 10 * s; by = ny - 18 * s;
      if (e > 1600) { nest.phase = 'leave'; nest.t0 = t; }
    } else if (nest.phase === 'scared') {
      // tencere sesi: anne konamadan kaçar
      const q = Math.min(1, e / 1400); panic = 30;
      bx = lerp(nx + 10 * s, sx + 60 * s, q); by = lerp(ny - 18 * s, sy - 60 * s, q);
      if (q >= 1) {
        nest.phase = 'idle'; nest.next = t + rnd(9000, 14000);
        if (!bubbles.length) bubbles.push({ obj: { get x() { return nest.x; }, get y() { return nest.y; } }, x: 0, y: 0, text: pick(['Anne, yemek yok mu?', 'Anneee! Açız!', 'Yine mi gürültü?\nAnne gelemedi...']), life: 1 });
      }
    } else if (nest.phase === 'leave') {
      const q = Math.min(1, e / 1600);
      bx = lerp(nx + 10 * s, sx, q); by = lerp(ny - 18 * s, sy, q);
      if (q >= 1) { nest.phase = 'idle'; nest.next = t + rnd(8000, 13000); }
    }
    if (bx !== null) drawBird({ x: bx, y: by, vx: nest.phase === 'approach' ? -1 : 1, sz: 1, ph: 0, panic, hits: 0, a: 1, fallen: false }, t);
    if (bx !== null && (nest.phase === 'approach' || nest.phase === 'feed')) { ctx.fillStyle = rgb(PAL.bug); ctx.fillRect(bx - 12 * s, by + 1 * s, 4 * s, 2.5 * s); }
  }

  function drawKid(x, y, s, shirt, t, ph, aim, dir = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const run = Math.sin(t * 0.03 + ph);
    ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-5 - run * 4, 2); ctx.moveTo(3, -6); ctx.lineTo(5 + run * 4, 2); ctx.stroke();
    ctx.fillStyle = shirt; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-6, -20, 12, 15, 5) : ctx.rect(-6, -20, 12, 15); ctx.fill();
    ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -25, 6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#c0503a'; ctx.beginPath(); ctx.arc(0, -27, 6, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -28, 9, 2.5);
    if (aim) { ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(12, -22); ctx.moveTo(12, -22); ctx.lineTo(10, -27); ctx.moveTo(12, -22); ctx.lineTo(15, -26); ctx.stroke(); }
    ctx.restore();
  }
  function startGag(t, gt, gb, x1) {
    const opts = [];
    const fieldY = gt + (gb - gt) * 0.32;
    if (game.campaign && game.k > 0.15) opts.push('kids', 'kids');
    if (villagers.length) opts.push('pothead');
    if (villagers.length >= 2) opts.push('sleepy');
    if (farmers.some(f => f.sx !== undefined) && birds.some(b => !b.fallen)) opts.push('hat');
    if (vis.P > 2 && farmers.some(f => f.sx !== undefined)) opts.push('broom', 'lunch');
    if (villagers.length >= 2 && game.k > 0.3) opts.push('concert');
    if (game.campaign && game.k >= 0.7) opts.push('band', 'band', 'band');
    if (villagers.length) opts.push('tumble');
    if (birds.some(b => !b.fallen)) opts.push('dog');
    if (!opts.length) return;
    const kind = pick(opts);
    if (kind === 'kids') {
      const dir = Math.random() < 0.5 ? 1 : -1;
      gags.push({ kind, t0: t, dur: 9000, dir, y: fieldY, x1, said: 0, peb: null });
    } else if (kind === 'pothead') {
      const v = pick(villagers); v.pothead = t + 6000; v.next = t + 6000;
      clang(v.x); sayAt(() => [v.x, v.y - 50 * U], pick(['Kim söndürdü ışıkları?', 'Tencere nerede?\nAh, buldum.', 'Biraz fazla\nhevesliydim galiba.']));
    } else if (kind === 'sleepy') {
      const v = pick(villagers), o = villagers.find(w => w !== v) || v;
      v.sleep = t + 7000;
      sayAt(() => [o.x, o.y - 46 * U], pick(['Uyuma! Kota var!', 'Hey! Pekin\nseni izliyor!', 'Daha yeni başladık!']));
    } else if (kind === 'hat') {
      const f = farmers.find(fm => fm.sx !== undefined);
      f.hatGone = t + 6500;
      gags.push({ kind, t0: t, dur: 6500, f, sx: f.sx, sy: f.sy });
      sayAt(() => [f.sx, f.sy], 'Hey! Şapkam!');
    } else if (kind === 'band') {
      const cx = x1 * rnd(0.3, 0.6), y = gt + (gb - gt) * 0.12 + 40 * U;
      gags.push({ kind, t0: t, dur: 10000, cx, y, beat: 0 });
      sayAt(() => [cx, y - 70 * U], pick(['Tencere Rock Grubu\nsahnede!', 'Bu şarkı serçelere\ngelsin!', 'Bir, iki, üç, dört!']));
    } else if (kind === 'concert') {
      const [a, b] = villagers.slice(0, 2);
      gags.push({ kind, t0: t, dur: 7000, a, b });
      sayAt(() => [a.x, a.y - 46 * U], pick(['Bu ritim fena değil!\nGrup kuralım!', 'Bir, iki, üç... BANG!']));
    } else if (kind === 'tumble') {
      const v = pick(villagers);
      gags.push({ kind, t0: t, dur: 3200, v, x: v.x, y: v.y });
      v.hidden = t + 3200;
      sayAt(() => [v.x, v.y - 30 * U], pick(['Ayak! Ayağım!', 'Kim koydu bu\ntaşı buraya?!', 'İyiyim, iyiyim!']));
    } else if (kind === 'dog') {
      const dir = Math.random() < 0.5 ? 1 : -1;
      gags.push({ kind, t0: t, dur: 7000, dir, y: fieldY + 10 * U, x1 });
    } else if (kind === 'lunch') {
      const f = farmers.find(fm => fm.sx !== undefined);
      gags.push({ kind, t0: t, dur: 6000, f, x: f.sx + 26 * U, y: f.sy + 40 * U });
      sayAt(() => [f.sx, f.sy], 'Ekmeğim! Ekmeğimi\nyiyorlar!');
    } else if (kind === 'nest') {
      gags.push({ kind, t0: t, dur: 8000, x: x1 * rnd(0.15, 0.85), y: gt - 30 * U });
    } else if (kind === 'broom') {
      const f = farmers.find(fm => fm.sx !== undefined);
      f.broom = t + 6000;
      sayAt(() => [f.sx, f.sy], pick(['Kış kış! Bunlara\ntencere işlemiyor!', 'Bir serçe olsaydı\nşimdi...']));
    }
  }
  function drawGags(t, dt, gt, gb, x1) {
    if (mode !== 'game') return;
    if (game.state === 'play' && !game.paused && !game.reading) {
      if (!nextGag) nextGag = t + 14000;
      if (t > nextGag && !gags.length) { nextGag = t + rnd(17000, 27000); startGag(t, gt, gb, x1); }
    }
    for (let i = gags.length - 1; i >= 0; i--) {
      const g = gags[i], p = (t - g.t0) / g.dur;
      // oyuncu kaydırıcıyı indirince ona bağlı sahne de biter
      if (p >= 1 || (g.kind === 'band' && game.k < 0.7) || (g.kind === 'concert' && game.k < 0.3) || (g.kind === 'kids' && game.k <= 0)) { gags.splice(i, 1); continue; }
      if (g.kind === 'kids') {
        const X = q => g.dir > 0 ? lerp(-40, x1 + 40, q) : lerp(x1 + 40, -40, q);
        const bx = X(p + 0.12), by = g.y - 70 * U + Math.sin(t * 0.01) * 10 * U;
        drawBird({ x: bx, y: by, vx: g.dir, sz: 1, ph: 0, panic: 30, hits: 0, a: 1, fallen: false }, t);
        const k1 = [X(p), g.y], k2 = [X(p - 0.015), g.y + 22 * U];
        drawKid(k1[0], k1[1], 1.1 * U, '#5b8fc0', t, 0, true, g.dir);
        drawKid(k2[0], k2[1], 1.1 * U, '#d9b45a', t, 1.5, false, g.dir);
        g.k1 = k1; g.k2 = k2;
        if (!g.said) { g.said = 1; sayAt(() => g.k1 ? [g.k1[0], g.k1[1] - 34 * U] : [0, 0], pick(['Bu sefer kesin\nvuracağım!', 'Kaçma serçe!', 'Bir puan bana!'])); }
        if (p > 0.42 && !g.peb) g.peb = { t0: t, x0: k1[0], y0: k1[1] - 24 * U };
        if (g.peb) {
          const q = (t - g.peb.t0) / 900;
          if (q < 1) {
            // taş serçeye değil, arkadakine gider: yay çizerek geri döner
            const tx = k2[0], ty = k2[1] - 26 * U;
            const px = lerp(g.peb.x0, tx, q), py = lerp(g.peb.y0, ty, q) - Math.sin(q * Math.PI) * 60 * U;
            ctx.fillStyle = '#7d7468'; ctx.beginPath(); ctx.arc(px, py, 3 * U, 0, 6.283); ctx.fill();
          } else if (!g.hit) {
            g.hit = 1; floats.push({ x: k2[0], y: k2[1] - 40 * U, text: 'tık!', life: 1 }); blipHit();
            sayAt(() => g.k2 ? [g.k2[0], g.k2[1] - 34 * U] : [0, 0], pick(['Ayy! Bana değil!', 'Serçe orada,\nben burdayım!', 'Annemeee söylicem!']));
          }
        }
      } else if (g.kind === 'band') {
        // abartılı kampanya: beş kişilik tencere grubu
        const beat = Math.floor((t - g.t0) / 420);
        if (beat !== g.beat) { g.beat = beat; if (beat % 2 === 0) thud(); else clang(g.cx); }
        const bounce = Math.abs(Math.sin((t - g.t0) * 0.0075)) * 5 * U;
        const members = [
          { dx: -100, shirt: [196, 72, 52], inst: 'drum' }, { dx: -50, shirt: [64, 110, 160], inst: 'guitar' },
          { dx: 0, shirt: [170, 120, 50], inst: 'sing' }, { dx: 50, shirt: [92, 130, 70], inst: 'horn' }, { dx: 100, shirt: [120, 90, 160], inst: 'cymbal' },
        ];
        // küçük sahne
        ctx.fillStyle = 'rgba(122,90,58,.85)'; ctx.fillRect(g.cx - 130 * U, g.y - 2 * U, 260 * U, 10 * U);
        members.forEach((m, k) => {
          const x = g.cx + m.dx * U, y = g.y - (k % 2 ? bounce : 5 * U - bounce), s = 1.1 * U;
          ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
          ctx.fillStyle = rgb(m.shirt); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-8, -26, 16, 24, 7) : ctx.rect(-8, -26, 16, 24); ctx.fill();
          ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -33, 8, 0, 6.283); ctx.fill();
          ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(-2.6, -34, 1.3, 0, 6.283); ctx.arc(2.6, -34, 1.3, 0, 6.283); ctx.fill();
          ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, -31, 3.4, 0.1, 3.0); ctx.stroke();
          const hit = Math.sin((t - g.t0) * 0.015 + k) > 0;
          if (m.inst === 'drum') {
            ctx.fillStyle = '#c0503a'; ctx.beginPath(); ctx.ellipse(0, -4, 13, 9, 0, 0, 6.283); ctx.fill();
            ctx.fillStyle = '#f3ecd8'; ctx.beginPath(); ctx.ellipse(0, -11, 13, 4, 0, 0, 6.283); ctx.fill();
            ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-4, hit ? -12 : -22); ctx.moveTo(8, -18); ctx.lineTo(4, hit ? -22 : -12); ctx.stroke();
          } else if (m.inst === 'guitar') {
            ctx.save(); ctx.rotate(-0.5);
            ctx.fillStyle = '#d9a95a'; ctx.beginPath(); ctx.ellipse(2, -10, 8, 6, 0, 0, 6.283); ctx.fill();
            ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(24, -16); ctx.stroke();
            ctx.restore();
          } else if (m.inst === 'sing') {
            ctx.fillStyle = '#8b9096'; ctx.beginPath(); ctx.arc(10, -30, 4, 0, 6.283); ctx.fill();
            ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, -26); ctx.lineTo(14, -14); ctx.stroke();
          } else if (m.inst === 'horn') {
            ctx.strokeStyle = '#d9b45a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, -30); ctx.lineTo(18, -36); ctx.stroke();
            ctx.fillStyle = '#d9b45a'; ctx.beginPath(); ctx.moveTo(18, -40); ctx.lineTo(26, -42); ctx.lineTo(24, -30); ctx.lineTo(18, -32); ctx.closePath(); ctx.fill();
          } else {
            ctx.fillStyle = '#8b9096'; [-12, 12].forEach((dx, q) => { ctx.beginPath(); ctx.ellipse(dx, hit === !!q ? -30 : -22, 7, 2.5, 0, 0, 6.283); ctx.fill(); });
          }
          ctx.restore();
          if (Math.random() < 0.05) floats.push({ x: x + rnd(-8, 8) * U, y: y - 54 * U, text: pick(['♪', '♫', '♬', 'BANG!']), life: 1, col: [192, 80, 58] });
        });
        // çevredeki serçeler kaçışır
        for (const b of birds) if (!b.fallen && Math.hypot(b.x - g.cx, b.y - g.y) < 220 * U) { b.panic = 30; }
        if (p > 0.55 && !g.said) { g.said = 1; sayAt(() => [g.cx + 50 * U, g.y - 70 * U], pick(['Bis! Bis!', 'Serçeler kaçtı ama\nseyirci kalmadı!', 'Turne Pekin\'e!'])); }
      } else if (g.kind === 'concert') {
        if (Math.random() < 0.12) { const v = Math.random() < 0.5 ? g.a : g.b; floats.push({ x: v.x + rnd(-10, 10) * U, y: v.y - 50 * U, text: pick(['♪', '♫', '♬']), life: 1, col: [192, 80, 58] }); if (Math.random() < 0.3) clang(v.x); }
        if (p > 0.5 && !g.said) { g.said = 1; sayAt(() => [g.b.x, g.b.y - 46 * U], pick(['Turneye çıkalım!', 'Serçeler bile\ndans ediyor!'])); }
      } else if (g.kind === 'tumble') {
        // takılıp yuvarlanan köylü
        const q = p, x = g.x + q * 90 * U, y = g.y - Math.abs(Math.sin(q * Math.PI * 2)) * 18 * U;
        ctx.save(); ctx.translate(x, y - 16 * U); ctx.rotate(q * Math.PI * 4);
        ctx.fillStyle = rgb(g.v.hue); ctx.beginPath(); ctx.arc(0, 0, 12 * U, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -12 * U, 7 * U, 0, 6.283); ctx.fill();
        ctx.restore();
        if (q > 0.85 && !g.said) { g.said = 1; floats.push({ x, y: y - 40 * U, text: 'pat!', life: 1 }); blipHit(); }
      } else if (g.kind === 'dog') {
        const X = q => g.dir > 0 ? lerp(-60, g.x1 + 60, q) : lerp(g.x1 + 60, -60, q);
        const bx = X(p + 0.1), by = g.y - 80 * U + Math.sin(t * 0.012) * 12 * U;
        drawBird({ x: bx, y: by, vx: g.dir, sz: 1, ph: 0, panic: 30, hits: 0, a: 1, fallen: false }, t);
        const dx = X(p), dy = g.y, hop = Math.abs(Math.sin(t * 0.03)) * 6 * U;
        ctx.save(); ctx.translate(dx, dy - hop); ctx.scale(g.dir * U * 1.1, U * 1.1);
        ctx.fillStyle = '#9a6a3c'; ctx.beginPath(); ctx.ellipse(0, -10, 16, 8, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -18, 7, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(13, -24, 3, 6, -0.4, 0, 6.283); ctx.fill();
        ctx.strokeStyle = '#9a6a3c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        const l = Math.sin(t * 0.04) * 5;
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-12 - l, 4); ctx.moveTo(10, -4); ctx.lineTo(12 + l, 4); ctx.moveTo(-15, -12); ctx.lineTo(-23, -20); ctx.stroke();
        ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(18, -19, 1.4, 0, 6.283); ctx.fill();
        ctx.restore();
        if (Math.random() < 0.02) floats.push({ x: dx + 20 * U * g.dir, y: dy - 40 * U, text: 'hav!', life: 1 });
        if (p > 0.35 && !g.said) { g.said = 1; sayAt(() => [bx, by], pick(['Köpek de mi\nkampanyada?!', 'Cik! Yakalayamazsın!'])); }
      } else if (g.kind === 'lunch') {
        // çekirge bulutu ekmeği kemirir
        const sz = (1 - p) * 12 * U;
        ctx.fillStyle = '#d9a95a'; ctx.beginPath(); ctx.ellipse(g.x, g.y - 6 * U, Math.max(0, sz * 1.4), Math.max(0, sz * 0.6), 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = rgb(PAL.locust);
        for (let k = 0; k < 18; k++) { const a = t * 0.01 + k; ctx.fillRect(g.x + Math.cos(a * 1.3) * 22 * U, g.y - 10 * U + Math.sin(a) * 12 * U, 3 * U, 2 * U); }
        if (p > 0.6 && !g.said) { g.said = 1; floats.push({ x: g.x, y: g.y - 30 * U, text: 'çıtır çıtır', life: 1, col: PAL.locust }); }
      } else if (g.kind === 'nest') {
        // ağaç dalında yuva: serçe yavrulara böcek taşır
        ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 6 * U; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(g.x - 60 * U, g.y + 8 * U); ctx.lineTo(g.x + 40 * U, g.y - 4 * U); ctx.stroke();
        ctx.fillStyle = '#a8865a'; ctx.beginPath(); ctx.ellipse(g.x, g.y, 18 * U, 9 * U, 0, 0, Math.PI); ctx.fill();
        for (let k = -1; k <= 1; k++) {
          const open = Math.sin(t * 0.015 + k) > 0;
          ctx.fillStyle = '#c9a07a'; ctx.beginPath(); ctx.arc(g.x + k * 8 * U, g.y - 2 * U, 5 * U, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#e8a03c'; ctx.beginPath(); ctx.moveTo(g.x + k * 8 * U - 2 * U, g.y - 6 * U); ctx.lineTo(g.x + k * 8 * U, g.y - (open ? 14 : 9) * U); ctx.lineTo(g.x + k * 8 * U + 2 * U, g.y - 6 * U); ctx.fill();
        }
        const q = (p * 3) % 1, bx = lerp(g.x + 160 * U, g.x + 14 * U, Math.min(1, q * 1.6)), by = lerp(g.y - 90 * U, g.y - 12 * U, Math.min(1, q * 1.6));
        drawBird({ x: bx, y: by, vx: -1, sz: 1, ph: 0, panic: 0, hits: 0, a: 1, fallen: false }, t);
        if (!g.said) { g.said = 1; sayAt(() => [g.x, g.y - 20 * U], pick(['Ağzınızı açın,\nböcek geliyor!', 'Bugünkü menü:\nçekirge!'])); }
      } else if (g.kind === 'hat') {
        // serçe şapkayı kapıp gökyüzüne götürür
        const hx = g.sx + (p * 220 - 40) * U, hy = g.sy - p * 140 * U - Math.sin(p * 9) * 8 * U;
        drawBird({ x: hx, y: hy - 8 * U, vx: 1, sz: 1, ph: 0, panic: 0, hits: 0, a: 1, fallen: false }, t);
        ctx.fillStyle = '#d9b45a'; ctx.beginPath(); ctx.moveTo(hx - 10 * U, hy + 4 * U); ctx.lineTo(hx, hy - 4 * U); ctx.lineTo(hx + 10 * U, hy + 4 * U); ctx.closePath(); ctx.fill();
        if (p > 0.45 && !g.said) { g.said = 1; sayAt(() => [hx, hy], 'Cik! Yakıştı mı?'); }
      }
    }
  }
  function blipHit() { if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), e = AC.createGain(); o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(400, t + 0.08); o.connect(e); e.connect(master); e.gain.setValueAtTime(0.06, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.start(t); o.stop(t + 0.13); }


  // tarlanın kenarındaki köy evleri
  const leavers = [];
  function drawHouses(t, gt, gb, x1) {
    const xs = mobile ? [0.07, 0.93] : [0.04, 0.5, 0.96];
    const out = xs.map((fx, k) => {
      const x = x1 * fx, y = gt + 30 * U, s = U * (mobile ? 0.85 : 1);
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 2, 34, 5, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#e6d3ac'; ctx.fillRect(-28, -34, 56, 36);
      ctx.fillStyle = '#a0583a'; ctx.beginPath(); ctx.moveTo(-34, -32); ctx.lineTo(0, -56); ctx.lineTo(34, -32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-7, -20, 14, 22);
      ctx.fillStyle = vis.warm > 0.5 ? '#f3d27a' : '#f7c75a'; ctx.fillRect(12, -24, 10, 9);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(14, -58, 7, 14);
      ctx.restore();
      if (Math.random() < 0.03) floats.push({ x: x + 17 * s, y: y - 60 * s, text: '·', life: 0.8, col: [150, 150, 150] });
      return { x, y: y + 2 * U };
    });
    return out;
  }
  function drawLeavers(t, dt) {
    const f = dt / 16.67;
    for (let i = leavers.length - 1; i >= 0; i--) {
      const v = leavers[i], dx = v.tx - v.x, dy = v.ty - v.y, d = Math.hypot(dx, dy);
      if (d < 4) { leavers.splice(i, 1); continue; }
      const sp = 1.6 * U * f; v.x += dx / d * Math.min(sp, d); v.y += dy / d * Math.min(sp, d);
      const s = U, bob = Math.abs(Math.sin(t * 0.02 + v.ph)) * 3 * U;
      ctx.save(); ctx.translate(v.x, v.y - bob); ctx.scale(s * (dx < 0 ? -1 : 1), s);
      ctx.fillStyle = rgb(v.hue); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-8, -26, 16, 24, 7) : ctx.rect(-8, -26, 16, 24); ctx.fill();
      ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -33, 8, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#8b9096'; ctx.beginPath(); ctx.ellipse(10, -16, 6, 3.5, 0, 0, 6.283); ctx.fill();
      ctx.restore();
      if (v.zz && Math.random() < 0.03) floats.push({ x: v.x + 8 * U, y: v.y - 46 * U, text: 'z', life: 1 });
    }
  }

  // köylüler tencere çalar: kampanya kaydırıcısına bağlı
  function drawCampaign(t, dt, gt, gb, x1) {
    const f = dt / 16.67;
    const want = game.campaign ? Math.round(game.k * 9) : 0;
    const houses = drawHouses(t, gt, gb, x1);
    const door = x => houses.reduce((a, h) => Math.abs(h.x - x) < Math.abs(a.x - x) ? h : a, houses[0]);
    const HUES = [[196, 72, 52], [64, 110, 160], [92, 130, 70], [170, 120, 50], [120, 90, 160]];
    // kampanya artınca köylüler evlerden çıkıp yürüyerek gelir, azalınca evlerine döner
    while (villagers.length < want) {
      const i = villagers.length, slotX = x1 * (0.08 + 0.84 * ((i + 0.5) / Math.max(want, 1))), h = door(slotX);
      villagers.push({ x: h.x, y: h.y, ph: rnd(0, 6.28), next: t + rnd(200, 1200), hue: pick(HUES) });
    }
    while (villagers.length > want) { const v = villagers.pop(); const h = door(v.x); leavers.push({ ...v, tx: h.x, ty: h.y }); }
    // vardiya değişimi: biri eve gidip uyur, yerine başkası çıkar
    if (game.campaign && villagers.length >= 2 && game.state === 'play' && t > (game.nextShift || (game.nextShift = t + 22000))) {
      game.nextShift = t + rnd(20000, 32000);
      const k = Math.floor(Math.random() * villagers.length), v = villagers[k], h = door(v.x);
      leavers.push({ ...v, tx: h.x, ty: h.y, zz: true });
      if (!bubbles.length) bubbles.push({ obj: leavers[leavers.length - 1], x: v.x, y: v.y, oy: 46 * U, text: pick(['Vardiya bitti,\nben yatıyorum!', 'Kolum koptu,\nbiraz uyuyacağım.', 'Sıra sende komşu!']), life: 1 });
      const h2 = pick(houses);
      villagers[k] = { x: h2.x, y: h2.y, ph: rnd(0, 6.28), next: t + 2000, hue: pick(HUES) };
    }
    drawLeavers(t, dt);
    villagers.forEach((v, i) => {
      const slots = Math.max(want, 1);
      const tx = x1 * (0.08 + 0.84 * ((i + 0.5) / slots)) + Math.sin(v.ph) * 10 * U;
      const ty = gt + (gb - gt) * (i % 2 ? 0.2 : 0.08) + 34 * U;
      const dx = tx - v.x, dy = ty - v.y, d = Math.hypot(dx, dy), sp = 1.6 * U * f;
      v.walking = d > 3;
      if (v.walking) { v.x += dx / d * Math.min(sp, d); v.y += dy / d * Math.min(sp, d); } else { v.x = tx; v.y = ty; }
      if (v.hidden > t) return;
      const asleep = v.sleep > t, pothead = v.pothead > t;
      const bang = !asleep && !v.walking && Math.sin(t * 0.025 + v.ph) > 0.2;
      const s = U * (1 + (i % 2) * 0.12);
      ctx.save(); ctx.translate(v.x, v.y - (v.walking ? Math.abs(Math.sin(t * 0.02 + v.ph)) * 3 * U : 0)); if (asleep) ctx.rotate(0.35);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 2 * s, 12 * s, 3 * s, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgb(v.hue); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-8 * s, -26 * s, 16 * s, 24 * s, 7 * s) : ctx.rect(-8 * s, -26 * s, 16 * s, 24 * s); ctx.fill();
      ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -33 * s, 8 * s, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(-2.6 * s, -34 * s, 1.3 * s, 0, 6.283); ctx.arc(2.6 * s, -34 * s, 1.3 * s, 0, 6.283); ctx.fill();
      ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.arc(0, -31 * s, 3 * s, 0.2, 2.9); ctx.stroke();
      // tencere ve kaşık (bazen kafada!)
      ctx.fillStyle = '#8b9096';
      if (pothead) { ctx.beginPath(); ctx.ellipse(0, -38 * s, 10 * s, 7 * s, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-10 * s, -38 * s, 20 * s, 4 * s); }
      else { ctx.beginPath(); ctx.ellipse(-13 * s, -20 * s, 7 * s, 4 * s, 0, 0, 6.283); ctx.fill(); }
      ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.moveTo(8 * s, -18 * s); ctx.lineTo(-6 * s, bang ? -24 * s : -32 * s); ctx.stroke();
      ctx.restore();
      if (asleep && Math.random() < 0.02) floats.push({ x: v.x + 10 * U, y: v.y - 46 * U, text: 'z', life: 1 });
      if (t > v.next && !asleep && !v.walking) {
        v.next = t + rnd(500, 1300) / (0.4 + game.k);
        rings.push({ x: v.x - 13 * U, y: v.y - 20 * U, r: 4, life: 0.8, big: false });
        if (Math.random() < 0.25) clang(v.x);
        for (const b of birds) if (!b.fallen && Math.hypot(b.x - v.x, b.y - v.y) < 140 * U) { b.panic = 40; b.vy -= 1.2 * U; }
      }
    });

  }


  function updateBirds(t, dt, gt, gb, x1) {
    const f = dt / 16.67;
    const BMAX = mode === 'game' || mode === 'result' ? 40 : mode === 'sandbox' ? 34 : mode === 'title' || mode === 'intro' ? 22 : 14;
    const target = Math.round(vis.S * BMAX);
    const alive = birds.filter(b => !b.fallen && !b.leave);
    if (alive.length < target && (t - (updateBirds.last || 0)) > 280) {
      updateBirds.last = t; spawnBird(birds.length === 0);
      if (birds.length < 3) for (let i = 0; i < target - 1; i++) spawnBird(true);
    }
    if (alive.length > target) {
      if (mode === 'game' && game.k > 0) {
        const byPot = game.campaign && game.k > 0 && true;
        let b = alive[Math.floor(Math.random() * alive.length)];
        if (byPot && villagers.length) {
          const v = villagers[Math.floor(Math.random() * villagers.length)];
          b = alive.reduce((best, o) => Math.hypot(o.x - v.x, o.y - v.y) < Math.hypot(best.x - v.x, best.y - v.y) ? o : best, alive[0]);
          rings.push({ x: v.x + 12 * U, y: v.y - 30 * U, r: 6, life: 1, big: true });
        }
        fallBird(b, byPot);
      } else {
        const b = alive[Math.floor(Math.random() * alive.length)];
        b.leave = true;
      }
    }
    const top = 80, bottom = Math.max(top + 40, gt - 34 * U);
    const R = 70 * U;
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      if (b.fallen) {
        b.vy += 0.18 * U * f; b.y += b.vy * f; b.rot += b.vr * f;
        if (b.y >= b.landY) { b.y = b.landY; b.vy = 0; b.vr = 0; b.a -= 0.006 * f; }
        if (b.a <= 0) birds.splice(i, 1);
        continue;
      }
      b.panic = Math.max(0, b.panic - f);
      // sürü kuralları
      let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
      for (const o of birds) {
        if (o === b || o.fallen) continue;
        const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > R * R) continue;
        n++; cx += o.x; cy += o.y; ax += o.vx; ay += o.vy;
        if (d2 < 400 * U * U) { sx -= dx / (d2 + 1); sy -= dy / (d2 + 1); }
      }
      if (n) {
        b.vx += ((cx / n - b.x) * 0.0007 + (ax / n - b.vx) * 0.025) * f;
        b.vy += ((cy / n - b.y) * 0.0007 + (ay / n - b.vy) * 0.025) * f;
      }
      b.wa = (b.wa === undefined ? rnd(0, 6.28) : b.wa) + Math.sin(t * 0.0008 + b.ph * 2.3) * 0.035 * f;
      b.vx += (sx * 14 * U + Math.cos(b.wa) * 0.03 * U) * f;
      b.vy += (sy * 14 * U + Math.sin(b.wa) * 0.022 * U) * f;

      // böcek avı: sağlıklı tarlada serçeler zaman zaman tarlaya dalar
      if (!b.dive && !b.panic && !b.leave && vis.warm > 0.5 && bugs.length && Math.random() < 0.0016 * f) {
        const bg = bugs[Math.floor(Math.random() * bugs.length)];
        if (bg && bg.r >= smooth(1.8, 4.5, vis.P) * 0.7) b.dive = bg;
      }
      if (b.dive) {
        const bg = b.dive, dx = bg.x - b.x, dy = bg.y - 6 * U - b.y, d = Math.hypot(dx, dy);
        b.vx += (dx / (d || 1)) * 0.25 * U * f; b.vy += (dy / (d || 1)) * 0.25 * U * f;
        if (d < 10 * U || !bugs.includes(bg)) {
          const k = bugs.indexOf(bg);
          if (k >= 0) { bugs.splice(k, 1); floats.push({ x: b.x, y: b.y - 12 * U, text: 'hap!', life: 0.7, col: PAL.bird }); }
          b.dive = null; b.vy = -3 * U;
        }
      } else if (!b.leave) {
        if (b.y < top) b.vy += 0.06 * U * f;
        if (b.y > bottom) b.vy -= 0.09 * U * f;
        if (b.x < 30) b.vx += 0.06 * U * f;
        if (b.x > x1 - 30) b.vx -= 0.06 * U * f;
      } else {
        b.vx += (b.x < x1 / 2 ? -0.08 : 0.08) * U * f; b.vy -= 0.02 * f;
      }
      const sp = Math.hypot(b.vx, b.vy) || 0.001, cruise = (b.panic ? 4.6 : b.dive ? 3.2 : 1.7 + Math.sin(b.ph) * 0.3) * U;
      const kf = 1 + ((cruise - sp) / sp) * 0.06 * f;            // seyir hızına yumuşakça yaklaş
      b.vx *= kf; b.vy *= kf;
      const hard = cruise * 1.7; if (sp > hard) { b.vx *= hard / sp; b.vy *= hard / sp; }
      // tırmanırken hızlı çırpar, alçalırken süzülür
      const climb = clamp(-b.vy / (2 * U), -1, 1);
      b.fp = (b.fp || b.ph) + (b.panic ? 0.5 : 0.16 + Math.max(0, climb) * 0.22) * f;
      const amp = b.panic ? 0.85 : climb < -0.25 ? 0.18 : 0.62;
      b.fa = lerp(b.fa || amp, amp, 0.08 * f);
      b.flap = Math.sin(b.fp) * b.fa;
      b.x += b.vx * f; b.y += b.vy * f;
      if (b.leave && (b.x < -40 || b.x > x1 + 40 || b.y < -40)) { birds.splice(i, 1); continue; }
    }
    // cıvıltılar: serçe azaldıkça sessizleşir
    const n = birds.filter(b => !b.fallen).length;
    if (AC && !muted && n && Math.random() < n * 0.0011 * f * (0.4 + 0.6 * vis.warm)) chirp(birds[Math.floor(Math.random() * birds.length)].x);
  }

  // =====================================================================
  // SLAYTLAR
  // =====================================================================
  const slides = [...document.querySelectorAll('.slide')];
  let cur = 0, maxSeen = 0, mode = 'title';
  const dotsEl = $('dots');
  slides.forEach((_, i) => {
    const b = document.createElement('button'); b.setAttribute('aria-label', `Adım ${i + 1}`);
    b.onclick = () => { if (i <= maxSeen) goTo(i); };
    dotsEl.appendChild(b);
  });
  function goTo(i) {
    if (i < 0 || i >= slides.length) return;
    if (mode === 'game' && game.state !== 'end') game.paused = true;
    if (mode === 'sandbox') sb.running = false;
    slides[cur].classList.remove('active');
    cur = i; maxSeen = Math.max(maxSeen, i);
    slides[cur].classList.add('active'); slides[cur].scrollTop = 0;
    mode = slides[cur].dataset.mode;
    [...dotsEl.children].forEach((d, k) => { d.classList.toggle('on', k === cur); d.classList.toggle('seen', k <= maxSeen); d.disabled = k > maxSeen; });
    if (mode === 'game') enterGame();
    if (mode === 'result') renderResult();
    if (mode === 'sandbox') enterSandbox();
    if (mode === 'title' || mode === 'intro' || mode === 'poster' || mode === 'facts' || mode === 'lessons') {
      Object.assign(target, { S: 1, P: 0.6, Fr: 1, warm: 1 }); vis.c = 6.3;
    }
  }
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => { initAudio(); goTo(cur + 1); }));
  const slideOf = m => slides.findIndex(x => x.dataset.mode === m);
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { resetGame(); goTo(slideOf(b.dataset.goto)); }));
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && cur < maxSeen) goTo(cur + 1);
    if (e.key === 'ArrowLeft' && cur > 0) goTo(cur - 1);
  });

  // =====================================================================
  // BİLDİRİMLER
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
    if (opt.pause) { el.classList.add('pause'); game.reading = (game.reading || 0) + 1; }
    const close = () => {
      if (el.classList.contains('out')) return;
      el.classList.add('out');
      lastToastAt = Math.max(lastToastAt, performance.now() - 9000 / (typeof FAST === 'number' ? FAST : 1) + 5000 / (typeof FAST === 'number' ? FAST : 1));
      if (opt.pause) game.reading = Math.max(0, (game.reading || 1) - 1);
      if (opt.then) setTimeout(opt.then, 3000 / (typeof FAST === 'number' ? FAST : 1));
      setTimeout(() => { el.remove(); pumpToasts(); }, 400);
    };
    el.onclick = close;
    if (opt.img && window.Toon) window.Toon.process(opt.img, { maxW: 320 }).then(u => { const im = el.querySelector('img'); if (im) im.src = u; }).catch(() => {});
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    if (toastQueue.length > 4) toastQueue.splice(0, toastQueue.length - 4);
    // okuma süresi metnin uzunluğuna göre; durduran kartlar oyuncu kapatana kadar kalır
    const plain = text.replace(/<[^>]+>/g, '');
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 4500 + plain.length * 65)));
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const FAST = /[?&]hizli\b/.test(location.search) ? 8 : 1; // test için: ?hizli
  const MONTH_WARM = 4700 / FAST, MONTH_COLD = 2300 / FAST;
  let gs = newState();
  const game = {};
  const gK = $('g-k');

  function resetGame() {
    gs = newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, campaign: true, quota: 25, yearKills: 0, totalKills: 0,
      fired: new Set(), hist: [], stoppedBy: null, stoppedAt: undefined, sAtStop: 0,
      k: 0, lies: 0, food: [], inspected: false, trust: 70, replaced: false, speed: 1, touched: false, reading: 0,
    });
    gK.value = 10; gK.disabled = false;
    document.querySelectorAll('.coach').forEach(uncoach);
    readGameSliders();
    $('g-pause').textContent = '❚❚ Durdur'; if (typeof setSpeed === 'function') setSpeed(1);
    $('modal').hidden = true; $('harvest').hidden = true; if ($('yb-harvest')) $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone');
    birds.forEach(b => { if (b.fallen) b.a = 0; });
    villagers.length = 0; leavers.length = 0; game.nextShift = 0; official = null; if (typeof gags !== 'undefined') { gags.length = 0; nextGag = 0; }
    renderQuota();
  }

  function readGameSliders() {
    game.k = gK.value / 100;
    $('o-k').textContent = '%' + gK.value;
  }
  [gK].forEach(el => el.addEventListener('input', () => {
    initAudio(); readGameSliders();
    if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); }
    if (el === gK && game.k > 0) once('start-k', () => toast('📣', 'Köy hoparlörü', 'Herkes tencere başına! Serçeler konamasın!'));
  }));
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

  // oyun akarken olayları adım adım anlatan kartlar
  const POSTER = 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Kill_bird_and_insect.jpg';
  const STORY = [
    [0, '🇨🇳', 'Çin', 'Mao Zedong <b>Büyük İleri Atılım</b>ı başlattı. Hedef birkaç yılda sanayileşmek, tarımda rekor kırmak.', '', { pause: true }],
    [0, '', 'Dört Zararlı Kampanyası', 'Dört düşman ilan edildi: <b>fare, sinek, sivrisinek ve serçe</b>. Serçenin suçu tahıl yemek.', '', { img: POSTER, pause: true }],
    [13500, '🥁', 'Yöntem', 'Köylüler tencere çalınca serçeler konamıyor, yorulup düşüyor. Ne kadar çok tencere, o kadar az serçe.', '', { ms: 9000 }],
    [21000, '🌾', 'Tarladan not', 'Bu tarlada tahıl büyüyor, böcekler tahılı yiyor, serçeler de böcekleri. Bir de bunu aklında tut.', '', { ms: 9000 }],
    [28000, '📻', 'Pekin', 'Kampanya başladı. 1958 kotası: köy başına <b>25 serçe</b>. Seferberliği sen ayarla.', 'warn', { ms: 9000 }],
  ];

  // rehber ipucu: bir kaydırıcıyı parlatır, üstüne kısa bir yönerge koyar
  function coach(input, text, ms = 14000) {
    const card = input.closest('.sl'); if (!card || input.disabled) return;
    uncoach(card);
    card.classList.add('coach');
    const tip = document.createElement('div'); tip.className = 'coach-tip'; tip.textContent = text; card.appendChild(tip);
    const done = () => uncoach(card);
    input.addEventListener('input', done, { once: true });
    if (ms) card._coachT = setTimeout(done, ms);
  }
  function uncoach(card) { card.classList.remove('coach'); card.querySelectorAll('.coach-tip').forEach(t => t.remove()); clearTimeout(card._coachT); }

  function once(key, fn) { if (!game.fired.has(key)) { game.fired.add(key); fn(); } }
  const yearKey = () => calYear(Math.min(gs.m, TOTAL - 1));

  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (!game.started) {
      game.started = true;
      const show = i => {
        if (mode !== 'game') return;
        if (i >= STORY.length) return gK.value <= 20 ? coach(gK, '👉 Kaydır: daha çok tencere', 0) : null;
        const [, ic, from, text, tone, opt] = STORY[i];
        toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
        if (!opt.pause) setTimeout(() => show(i + 1), 9000 / Math.max(1, FAST / 2));
      };
      setTimeout(() => show(0), 500);
    }
  }

  function renderQuota() {
    const q = $('g-quota');
    if (!game.campaign) {
      q.classList.add('off'); q.classList.remove('done');
      q.innerHTML = `<span class="lbl">${game.stoppedBy === 'auto' ? 'Serçeler listeden çıkarıldı' : 'Kampanya bitti'}</span>`;
      return;
    }
    if (!$('q-n')) q.innerHTML = '<span class="lbl">Kota</span> <b id="q-n">0</b>/<span id="q-t">25</span> <span class="track"><i id="q-bar"></i></span>';
    q.classList.remove('off');
    $('q-n').textContent = game.yearKills; $('q-t').textContent = game.quota;
    $('q-bar').style.width = clamp(game.yearKills / game.quota) * 100 + '%';
    q.classList.toggle('done', game.yearKills >= game.quota);
  }

  // köylülerin tenceresiyle düşen her serçe kotaya yazılır
  function onKill(b) {
    if (mode !== 'game' || !game.campaign) return;
    game.totalKills++; game.yearKills++;
    floats.push({ x: b.x, y: b.y - 14 * U, text: '+1', life: 1 });
    renderQuota();
    const y = yearKey(), q = game.quota;
    once('first', () => toast('🏅', 'Kooperatif', 'İlk serçe düştü. Köylüler sevinç içinde!', 'good'));
    if (game.yearKills === Math.ceil(q / 2)) once('half' + y, () => toast('📻', 'Köy hoparlörü', 'Kotanın yarısı doldu. Hoparlörden marşlar çalıyor.'));
    if (game.yearKills === q) once('full' + y, () => { game.trust = Math.min(100, game.trust + 15); toast('🏆', 'Pekin', 'Kota doldu! Adın övgü listesine yazıldı.', 'good'); });
    if (game.yearKills === q + 6) once('over' + y, () => toast('📈', 'Rapor', 'Kotayı aştın. Pekin\'e "iki katı" diye rapor edilecek.'));
  }

  function monthDur() { return (isWarm(calMonth(gs.m)) ? MONTH_WARM : MONTH_COLD) * (gs.m < 2 ? 1.7 : 1) / game.speed; }

  function updateGame(dt) {
    if (mode !== 'game' || game.paused || game.reading || game.state !== 'play' || gs.m >= TOTAL) return;
    // kart okunurken zaman yavaşlar; yapılacak bir şey yokken hızlanır
    const visible = $('toasts').querySelector('.toast:not(.out)');
    const pace = visible ? 1.5 : toastQueue.length ? 0.9 : 0.42;
    game.frac += dt / (monthDur() * pace);
    if (game.frac >= 1) { game.frac -= 1; monthTick(); }
  }

  // güven sıfırlanınca müfettiş gelir; karar yine oyuncunundur
  function replaceMinister() {
    if (game.inspected) return;
    game.inspected = true; game.state = 'visit'; if (game.speed > 1) setSpeed(1);
    const m = $('modal');
    m.innerHTML = `<div class="card talk"><div class="who"></div><div><div class="from">Pekin'den müfettiş</div><h2>Pekin'in sabrı tükendi</h2><p class="speech">"Yoldaş, köyün kampanyada en geride. Seferberliği hemen artırmazsan görevden alınacaksın."</p><div class="opts"></div></div></div>`;
    m.querySelector('.who').appendChild(officialPortrait());
    const box = m.querySelector('.opts');
    [
      { label: 'Tamam, artırıyorum', sub: 'Seferberlik en az %60 olur, oyun sürer', fn: () => {
        gK.value = Math.max(Number(gK.value), 60); readGameSliders(); game.trust = 35; game.state = 'play';
        toast('📣', 'Köy hoparlörü', 'Seferberlik artırıldı. Müfettiş memnun ayrıldı.', 'warn');
      } },
      { label: 'Hayır, serçelere dokunmayacağım', sub: 'Görevden alınırsın ve oyun burada biter', fn: () => {
        game.replaced = true; game.state = 'play';
        toast('📜', 'Pekin', 'Görevden alındın. Ama vicdanın rahat.', 'bad');
        endGame();
      } },
    ].forEach(o => { const btn = document.createElement('button'); btn.className = 'opt'; btn.innerHTML = `${o.label}<small>${o.sub}</small>`; btn.onclick = () => { m.hidden = true; o.fn(); }; box.appendChild(btn); });
    m.hidden = false;
  }


  function monthTick() {
    const cm = calMonth(gs.m);
    step(gs, { ...DEF, hunt: game.campaign ? game.k : 0 });
    const base = BASE.hist[gs.m - 1].F;
    game.hist.push({ S: gs.S, P: gs.P, Fr: clamp(gs.F / base) });

    // Pekin'in güveni: kampanya kısıldıkça düşer
    if (game.campaign && !game.replaced) {
      game.trust = clamp(game.trust + (game.k - 0.35) * 8, 0, 100);
      if (game.k < 0.3 && game.trust < 60) once('warn1-' + yearKey(), () => toast('📞', 'Parti sekreteri', 'Tencereler neden bu kadar sessiz? Komşu köyler kotayı çoktan doldurdu.', 'warn'));
      if (game.trust < 40 && game.k < 0.6) once('coach-trust', () => coach(gK, '👉 Pekin kızıyor: seferberliği artır'));
      if (game.trust < 25) once('warn2', () => toast('⚠️', 'Pekin', 'Pekin\'den sert bir mektup geldi: "Kampanyayı ciddiye alın." Son uyarı.', 'bad'));
      if (game.trust <= 0) replaceMinister();
    }
    if (game.campaign && isWarm(cm)) {
      const alive = birds.filter(b => !b.fallen && !b.leave).length;
      if (game.quota - game.yearKills > alive + 1)
        once('impossible' + yearKey(), () => toast('🤷', 'Rapor', 'Kotayı dolduracak kadar serçe kalmadı. Raporda yine de "aşıldı" yazacak.'));
    }

    if (gs.S < 0.75) once('zheng', () => toast('🔬', 'Kuşbilimci Zheng', 'Serçeler yavrularını böcekle besler. Bunu yapmasak mı?'));
    if (gs.S < 0.5) once('s50', () => toast('🐦', 'Gözlem', 'Gökyüzü seyreldi. Serçeler yarı yarıya azaldı.'));
    if (gs.S < 0.2) once('s20', () => toast('🔇', 'Gözlem', 'Sabahları artık kuş sesi gelmiyor.', 'bad'));
    if (gs.P > 1.6) once('p13', () => toast('🍃', 'Tarla raporu', 'Yapraklarda küçük delikler var. Önemsiz, herhalde.', 'warn'));
    if (gs.P > 2.8) once('p22', () => toast('🦗', 'Tarla raporu', 'Tarlada bir hışırtı var. Bir değil, binlerce.', 'bad'));
    if (gs.P > 4) once('p30', () => toast('⚠️', 'Acil', 'Çekirge sürüleri gökyüzünü karartıyor!', 'bad'));
    if ((!game.campaign || game.k === 0) && gs.S > 0.45 && game.hist.length > 6 && gs.S > Math.min(...game.hist.map(h => h.S)) + 0.15)
      once('back', () => toast('🐣', 'Gözlem', 'Serçeler dönüyor. Yavaş ama dönüyorlar.', 'good'));

    if (gs.m === 25 && game.campaign) {
      game.campaign = false; game.stoppedBy = 'auto'; game.stoppedAt = gs.m;
      gK.value = 0; gK.disabled = true; readGameSliders();
      toast('📜', 'Pekin', 'Serçeler sessizce listeden çıkarıldı. Yerlerine tahtakuruları kondu.');
      renderQuota();
    }
    if (calMonth(gs.m - 1) === 9) showHarvest(gs.harvests.length - 1);
    else if (gs.m >= TOTAL) endGame();
  }

  function showHarvest(i) {
    game.state = 'harvest'; if (game.speed > 1) setSpeed(1);
    const v = hIdx(gs, i, BASE);
    const el = $('harvest');
    const col = v >= 90 ? 'var(--green)' : v >= 70 ? 'var(--grain)' : 'var(--danger)';
    const sheaves = Array.from({ length: 5 }, (_, k) => `<span style="opacity:${clamp(v / 100 * 5 - k, 0.15, 1)}">🌾</span>`).join('');
    el.innerHTML = `<div class="hcard"><div class="k">${1958 + i} hasadı</div><div class="sheaves">${sheaves}</div>
      <div class="n" style="color:${col}">%<span id="hv-n">0</span></div>
      <div class="hbar"><i style="width:0;background:${col}" id="hv-bar"></i><b title="normal yıl"></b></div>
      <div class="s">normal bir yılın yüzdesi · çizgi: normal yıl</div><button class="hbtn sm go-h">Devam →</button></div>`;
    $('yb-harvest').textContent = `🌾 %${v}`; $('yb-harvest').style.color = col;
    el.hidden = false;
    const t0 = performance.now();
    (function count() {
      const k = clamp((performance.now() - t0) / 1100);
      const n = $('hv-n'); if (!n) return;
      n.textContent = Math.round(v * (1 - Math.pow(1 - k, 3)));
      const bar = $('hv-bar'); if (bar) bar.style.width = Math.min(100, (v / 120) * 100 * (1 - Math.pow(1 - k, 3))) + '%';
      if (k < 1) requestAnimationFrame(count);
    })();
    let done = false;
    const next = () => { if (done) return; done = true; el.hidden = true; afterHarvest(i, v); };
    el.onpointerdown = next; // okuyabilsin diye yalnız dokununca geçer
  }

  function afterHarvest(i, v) {
    game.state = 'visit';
    official = { t0: performance.now(), leave: 0, say: pick(['Hasat ne kadar, yoldaş?', 'Rapor zamanı!\nNe yazalım?', 'Pekin rakam bekliyor.']) };
    setTimeout(() => askReport(i, v), 1700);
  }
  function askReport(i, v) {
    const m = $('modal');
    m.innerHTML = `<div class="card talk"><div class="who"></div><div><div class="from">Devlet yetkilisi</div><h2>${1958 + i} hasadı: gerçekte %${v}</h2><p class="speech">"Yoldaş, Pekin'e giden rapora ne yazalım? Devlet <b>raporlanan</b> hasadın üçte birini toplayacak."</p><div class="opts"></div></div></div>`;
    m.querySelector('.who').appendChild(officialPortrait());
    const box = m.querySelector('.opts');
    [
      { label: `Gerçeği yaz (%${v})`, sub: v < 90 ? 'Dürüst ama Pekin pek sevinmez' : 'Dürüst ve güvenli', mult: 1, trust: v < 90 ? -15 : 5, reply: 'Hmm... Pekin\'e\nbunu mu yollayayım?' },
      { label: `Biraz yuvarla (%${Math.round(v * 1.3)})`, sub: 'Herkes yapıyor, değil mi?', mult: 1.3, trust: 10, reply: 'Güzel, güzel.\nDaha iyi oldu.' },
      { label: `Rekor yaz! (%${Math.round(v * 2)})`, sub: 'Pekin bayılır. Ambar boşalır.', mult: 2, trust: 25, reply: 'Harika! Pekin\'de\nbayram olacak!' },
    ].forEach(o => {
      const btn = document.createElement('button'); btn.className = 'opt';
      btn.innerHTML = `${o.label}<small>${o.sub}</small>`;
      btn.onclick = () => { m.hidden = true; settleReport(i, v, o); };
      box.appendChild(btn);
    });
    m.hidden = false;
  }
  function settleReport(i, v, o) {
    const reported = v * o.mult, left = Math.max(0, v - 0.33 * reported), food = Math.round(left / 0.67);
    game.food[i] = food;
    if (o.mult > 1) game.lies++;
    if (!game.replaced && game.campaign) game.trust = clamp(game.trust + o.trust, 0, 100);
    if (official) { official.reply = o.reply; official.leave = performance.now() + 2600; }
    if (food < 60) toast('🍚', 'Köy ambarı', `Devlet raporlanan hasadın üçte birini aldı. Köylünün payı normalin %${food}'i. Kış zor geçecek.`, 'bad');
    else if (o.mult > 1) toast('🍚', 'Köy ambarı', `Şişirilmiş rapor yüzünden fazla tahıl teslim edildi. Köylünün payı: normalin %${food}'i.`, 'warn');
    if (gs.m >= TOTAL) return endGame();
    game.state = 'play';
    if (!game.campaign) return;
    const met = game.yearKills >= game.quota;
    if (!met && !game.replaced) { game.trust = clamp(game.trust - 10, 0, 100); if (game.trust <= 0) replaceMinister(); }
    if (i === 0) toast('📻', 'Pekin', met ? 'Kooperatiflerden "rekor hasat" raporları yağıyor. 1959 kotası 40 serçe!' : 'Kotanın gerisinde kaldın. 1959 kotası yine de 40 serçe.', met ? '' : 'warn');
    game.quota = 40; game.yearKills = 0; renderQuota();
  }

  // devlet yetkilisi: takım elbise, dosya, kalem
  let official = null;
  function drawOfficialBody(g, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = '#4a5866'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    g.fillStyle = '#3a4652'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(0, -25 + k * 7, 1.2, 0, 6.283); g.fill(); }
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    g.fillStyle = '#4a5866'; g.beginPath(); g.ellipse(0, -43, 9, 3.5, 0, 0, 6.283); g.fill(); g.fillRect(-6, -48, 12, 5); // kasket
    g.fillStyle = '#c0503a'; g.beginPath(); g.arc(0, -46, 1.6, 0, 6.283); g.fill();
    g.fillStyle = rgb(PAL.ink); g.beginPath(); g.arc(-2.6, -37, 1.2, 0, 6.283); g.arc(2.6, -37, 1.2, 0, 6.283); g.fill();
    g.fillStyle = '#e8dcc0'; g.fillRect(-20, -26, 11, 14); g.strokeStyle = '#8a7a5a'; g.lineWidth = 1; g.strokeRect(-20, -26, 11, 14); // dosya
  }
  function officialPortrait() {
    const c = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 120, h = 150;
    c.width = w * dpr; c.height = h * dpr; c.className = 'portrait';
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(w / 2 + 6, h - 8); g.scale(2.7, 2.7);
    drawOfficialBody(g, 0);
    return c;
  }
  function drawOfficial(t, gt, gb, x1) {
    if (!official) return;
    const now = performance.now(), e = now - official.t0;
    const stopX = x1 * (mobile ? 0.78 : 0.85), startX = x1 + 50;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    if (official.leave && now > official.leave) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = gt + (gb - gt) * 0.18 + 36 * U, s = 1.2 * U, walk = e < 1500 || (official.leave && now > official.leave);
    official.x = x; official.y = y - 52 * U;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    drawOfficialBody(ctx, walk ? Math.sin(t * 0.02) * 4 : 0);
    ctx.restore();
    // konuşma
    const text = official.reply || (e > 1300 ? official.say : null);
    if (text && official.lastText !== text) { official.lastText = text; bubbles.length = 0; bubbles.push({ obj: official, x, y: official.y, text, life: 1 }); }
  }

  function endGame() {
    game.state = 'end';
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 1500);
  }
  resetGame();
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, gags, get gs() { return gs; }, get mode() { return mode; }, gag: () => { nextGag = 1; }, go: m => { maxSeen = slides.length; goTo(slideOf(m)); } };


  function renderResult() {
    if (gs.harvests.length < 3 && !game.replaced) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn" data-g="3">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const you = [0, 1, 2].map(i => gs.harvests[i] === undefined ? null : hIdx(gs, i, BASE)), his = [0, 1, 2].map(i => hIdx(HISTORY, i, BASE));
    const done = you.filter(v => v !== null), avg = done.length ? done.reduce((a, b) => a + b) / done.length : 100, k = game.totalKills;
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'Doğru bildiğini yaptın ve koltuğunu kaybettin. Tarihte kampanya yine de sürdü; itiraz edenler çoğu zaman susturuldu. Doğru şeyi bilmek yetmiyor, sistemin de dinlemesi gerekiyor.'; }
    else if (k === 0) { title = 'Tencereni hiç çalmadın'; text = 'Kota tutmadı ve Pekin\'in güvenini zor korudun. Ama ambarların doldu, kuşlar hâlâ ötüyor. Tarih kitapları seni yazmayacak ve en iyi sonuç bu.'; }
    else if (avg >= 93) { title = 'Erken durdun'; text = 'Kampanyaya katıldın ama ekosistemi kırmadan bıraktın. Bazen en iyi politika bir şey yapmamaktır, ama bunun için kimse heykel dikmez.'; }
    else if (avg >= 78) { title = 'Geç de olsa fark ettin'; text = 'Serçeler geri dönüyor ama acele etmiyorlar: yılda yalnızca bir iki kez kuluçkaya yatarlar. Bazı köyler yine de aç kaldı.'; }
    else { title = 'Serçelere karşı savaşı kazandın'; text = 'Çekirgeler de kazandı. Kaybeden sadece insanlar oldu. Tebrikler, tarihi başarıyla tekrarladın.'; }
    if (game.lies >= 2) text += ' Raporları şişirerek Pekin\'i mutlu ettin; bedelini köylüler ödedi.';
    const col = v => v >= 90 ? 'var(--green)' : v >= 70 ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">${game.replaced ? `${MONTHS[calMonth(Math.min(gs.m, TOTAL - 1))]} ${calYear(Math.min(gs.m, TOTAL - 1))} · görevden alındın` : 'Şubat 1961 · görev süren doldu'}</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      <div class="rgrid">${you.map((v, i) => `<div><div class="y">${1958 + i} hasadı</div><div class="v" style="color:${v === null ? 'var(--ink-soft)' : col(v)}">${v === null ? '—' : '%' + v}</div><div class="h">tarihte: %${his[i]}</div></div>`).join('')}</div>
      <p class="verdict">Düşürdüğün serçe: <b>${k}</b>. Gerçekte bu sayı yüz milyonlarcaydı.${game.food.some(f => f < 70) ? ` Şişirilmiş raporlar yüzünden köylünün payı bir yıl normalin <b>%${Math.min(...game.food)}</b>'ine düştü. Gerçek kıtlığı en çok bu büyüttü.` : ''}</p>
      <canvas class="rchart" id="rchart"></canvas>
      <div class="legend"><span style="--c:var(--bird)">Serçe</span><span style="--c:var(--bug)">Böcek</span><span style="--c:var(--grain)">Tahıl</span><span style="--c:#9aa59a">Tarihteki serçe (kesikli)</span></div>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(slideOf('game')); };
    $('r-next').onclick = () => goTo(slideOf('sandbox'));
    requestAnimationFrame(drawResultChart);
  }

  function lineChart(c, series, months) {
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const pad = 10, X = i => pad + (i / Math.max(1, months - 1)) * (w - pad * 2), Y = v => pad + (1 - clamp(v)) * (h - pad * 2);
    g.strokeStyle = 'rgba(43,58,46,.12)'; g.lineWidth = 1;
    for (let m = 10; m < months; m += 12) { g.beginPath(); g.moveTo(X(m), pad); g.lineTo(X(m), h - pad); g.stroke(); }
    series.forEach(s => {
      if (!s.data.length) return;
      g.strokeStyle = s.color; g.lineWidth = s.dash ? 1.8 : 3; g.lineJoin = 'round'; g.lineCap = 'round';
      g.setLineDash(s.dash ? [5, 5] : []);
      g.beginPath(); s.data.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke();
    });
    g.setLineDash([]);
  }
  function drawResultChart() {
    lineChart($('rchart'), [
      { data: HISTORY.hist.map(d => d.S), color: '#9aa59a', dash: true },
      { data: game.hist.map(d => d.Fr), color: '#c29a2e' },
      { data: game.hist.map(d => d.P / PK), color: '#b5543c' },
      { data: game.hist.map(d => d.S), color: '#9c6b47' },
    ], TOTAL);
  }

  // =====================================================================
  // LABORATUVAR
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: newState(), p: { ...DEF }, hist: [], lastH: null };
  const SL = { hunt: 'p-hunt', nest: 'p-nest', heat: 'p-heat' };
  function readSliders() {
    sb.p.hunt = $('p-hunt').value / 100;
    sb.p.nest = $('p-nest').value / 100; sb.p.heat = $('p-heat').value / 100;
    $('o-hunt').textContent = '%' + $('p-hunt').value;
    $('o-nest').textContent = '%' + $('p-nest').value; $('o-heat').textContent = '×' + (sb.p.heat).toFixed(1);
  }
  Object.values(SL).forEach(id => $(id).addEventListener('input', () => { readSliders(); document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: [80, 0, 100], none: [0, 0, 100], nature: [0, 70, 100], hot: [40, 0, 140] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset];
    ['p-hunt', 'p-nest', 'p-heat'].forEach((id, i) => $(id).value = v[i]);
    readSliders();
    document.querySelectorAll('.pbtn').forEach(x => x.classList.toggle('on', x === b));
  });
  $('sb-play').onclick = () => { sb.running = !sb.running; $('sb-play').textContent = sb.running ? '❚❚ Durdur' : '▶ Devam'; };
  $('sb-speed').onclick = () => { sb.speed = sb.speed === 1 ? 2 : sb.speed === 2 ? 4 : 1; $('sb-speed').textContent = sb.speed + '×'; };
  $('sb-reset').onclick = () => { sb.st = newState(); sb.hist = []; sb.lastH = null; sb.frac = 0; updateSbStats(); drawSbChart(); };
  readSliders();

  function enterSandbox() { sb.running = true; $('sb-play').textContent = '❚❚ Durdur'; updateSbStats(); setTimeout(drawSbChart, 50); }
  function updateSandbox(dt) {
    if (mode !== 'sandbox' || !sb.running) return;
    sb.frac += dt / (900 / sb.speed);
    while (sb.frac >= 1) {
      sb.frac -= 1;
      const before = sb.st.harvests.length;
      step(sb.st, sb.p);
      const cm = calMonth(sb.st.m - 1);
      sb.hist.push({ S: sb.st.S, P: sb.st.P, Fr: clamp(sb.st.F / EQ_F[cm]) });
      if (sb.hist.length > 72) sb.hist.shift();
      if (sb.st.harvests.length > before) sb.lastH = Math.round(sb.st.harvests[sb.st.harvests.length - 1] / EQ_H * 100);
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() {
    $('sb-year').textContent = `Yıl ${Math.floor(sb.st.m / 12) + 1} · ${MONTHS[calMonth(sb.st.m)]}`;
    $('sb-harvest').textContent = sb.lastH === null ? 'Son hasat: –' : `Son hasat: %${sb.lastH}`;
  }
  function drawSbChart() {
    lineChart($('sb-chart'), [
      { data: sb.hist.map(d => d.Fr), color: '#c29a2e' },
      { data: sb.hist.map(d => d.P / PK), color: '#b5543c' },
      { data: sb.hist.map(d => d.S), color: '#9c6b47' },
    ], 72);
  }

  // =====================================================================
  // DOKUNMA
  // =====================================================================
  const pointer = { x: 0, y: 0, on: false };
  cv.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = e.pointerType === 'mouse'; });
  cv.addEventListener('pointerleave', () => { pointer.on = false; });
  cv.addEventListener('pointerdown', e => {
    const x = e.clientX, y = e.clientY;
    initAudio();
    if (mode === 'game') { if (!talkAt(x, y)) rings.push({ x, y, r: 4, life: 0.5, big: false }); return; }
    if (mode === 'sandbox') { if (x < lay.x1 * W) scare(x, y, true); return; }
    if (mode === 'intro') {
      let best = null, bd = 50 * U;
      for (const b of birds) { if (b.fallen) continue; const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; best = b; } }
      if (best) {
        const lines = ['Bu yaz yavrularıma\nbinlerce böcek taşıyacağım!', 'Tahıl mı? Biraz.\nAma asıl böcek severim.', 'Cik! Çekirgeler\nbenden korkar.'];
        bubbles.length = 0;
        bubbles.push({ bird: best, x: best.x, y: best.y, text: lines[Math.floor(Math.random() * lines.length)], life: 1 });
        chirp(best.x);
      } else rings.push({ x, y, r: 4, life: 0.6, big: false });
      return;
    }
    if (mode === 'title') scare(x, y, false);
  });

  // =====================================================================
  // DÖNGÜ
  // =====================================================================
  const target = { S: 1, P: 0.6, Fr: 1, warm: 1 };
  let last = performance.now(), bgTick = 0, lastBg = '';
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    updateGame(dt); updateSandbox(dt);

    // hangi dünya gösteriliyor?
    if (mode === 'game' || mode === 'result') {
      const base = gs.m > 0 ? BASE.hist[gs.m - 1].F : 1;
      Object.assign(target, { S: gs.S, P: gs.P, Fr: clamp(gs.F / base), warm: isWarm(calMonth(Math.min(gs.m, TOTAL - 1))) ? 1 : 0 });
      vis.c = 2 + Math.min(gs.m, TOTAL) + (game.state === 'play' ? game.frac : 0);
    } else if (mode === 'sandbox') {
      const cm = calMonth(Math.max(0, sb.st.m - 1));
      Object.assign(target, { S: sb.st.S, P: sb.st.P, Fr: sb.st.m ? clamp(sb.st.F / EQ_F[cm]) : 1, warm: isWarm(calMonth(sb.st.m)) ? 1 : 0 });
      vis.c = 2 + sb.st.m + sb.frac;
    }
    const k = 1 - Math.pow(0.92, dt / 16);
    vis.S = lerp(vis.S, target.S, k * 1.5 > 1 ? 1 : k * 1.5);
    vis.P = lerp(vis.P, target.P, k * 0.6); vis.Fr = lerp(vis.Fr, target.Fr, k * 0.6);
    vis.warm = lerp(vis.warm, target.warm, k * 0.25);
    const health = 0.45 * clamp(vis.Fr) + 0.35 * vis.S + 0.2 * (1 - clamp(vis.P / PK));
    vis.bad = lerp(vis.bad, smooth(0.08, 0.6, 1 - health), k * 0.5);

    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);

    render(now, dt);

    // HUD ve arka plan rengi
    if (mode === 'game') {
      const mm = Math.min(gs.m, TOTAL - 1);
      $('g-date').textContent = `${MONTHS[calMonth(mm)]} ${calYear(mm)}`;
      const yy = String(calYear(mm));
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = MONTHS[calMonth(mm)];
      $('yb-fill').style.width = clamp((gs.m + game.frac) / TOTAL) * 100 + '%';
      $('m-s').style.width = vis.S * 100 + '%';
      $('m-p').style.width = clamp(vis.P / PK) * 100 + '%';
      $('m-f').style.width = clamp(vis.Fr) * 100 + '%';
      const lastFood = game.food.length ? game.food[game.food.length - 1] : 100;
      $('m-t').style.width = clamp(lastFood / 100) * 100 + '%';
      $('m-trust').style.width = game.trust + '%';
      $('m-trust').parentElement.parentElement.classList.toggle('low', game.trust < 30);
    }
    if (++bgTick % 6 === 0) {
      const bg = rgb(mixC(PAL.bgOk, PAL.bgBad, vis.bad));
      if (bg !== lastBg) { document.documentElement.style.setProperty('--bg', bg); lastBg = bg; }
    }
    if (AC && buzzGain && bgTick % 10 === 0) buzzGain.gain.setTargetAtTime(clamp((vis.P - 0.6) / 3.4) * 0.09 * vis.warm, AC.currentTime, 0.6);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  goTo(0);
  requestAnimationFrame(frame);
})();
