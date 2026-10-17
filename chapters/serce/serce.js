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

  const newState = () => ({ m: 0, S: 1, P: 0.5, F: 1, harvests: [], hist: [] });

  function step(st, p = DEF) {
    const cm = calMonth(st.m);
    if (cm === 2) st.F = 1; // yeni ekim
    // serçeler Nisan–Temmuz arası ürer; yuvalar hem üremeyi hem dışarıdan gelişi artırır
    if (cm >= 3 && cm <= 6) st.S += (0.15 + 0.2 * p.nest) * st.S * (1 - st.S) + 0.004 * (1 + 3 * p.nest) * (1 - st.S);
    st.S -= p.hunt * 0.2 * st.S;
    if (isWarm(cm)) st.P += 0.65 * p.heat * st.P * (1 - st.P / 4) - 0.5 * st.S * st.P;
    else st.P = Math.max(0.08, st.P * 0.8);
    if (isWarm(cm)) st.F -= st.F * 0.045 * st.P;
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
    if (b.fallen) ctx.rotate(b.rot);
    ctx.scale(b.vx >= 0 || b.fallen ? 1 : -1, 1);
    const flapSpeed = b.panic > 0 ? 0.045 : 0.018;
    const flap = b.fallen ? 0.3 : Math.sin(t * flapSpeed + b.ph) * 0.7;
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
    const sc = (air ? 1.1 : 0.7 + g.d * 0.7) * U;
    const col = vis.P > 1.8 ? PAL.locust : PAL.bug;
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
    const dark = smooth(1.8, 3.6, vis.P) * vis.warm;
    if (dark > 0.01) { ctx.fillStyle = `rgba(110,84,40,${dark * 0.18})`; ctx.fillRect(0, 0, x1, gt); }

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

    // başaklar: arkadan öne sıralar
    const rows = [0.06, 0.16, 0.28, 0.41, 0.55, 0.7, 0.86], bandH = gb - gt, stalkH = Math.max(bandH, H - gt);
    let stem = mixC(PAL.stem, PAL.stemRipe, ripe); stem = mixC(stem, PAL.stemDry, clamp(dmg * 0.9));
    const head = mixC(PAL.head, PAL.stemDry, clamp(dmg * 0.8));
    const headK = smooth(0.45, 0.85, g) * (0.45 + 0.55 * clamp(vis.Fr));
    ctx.lineCap = 'round';
    rows.forEach((rf, ri) => {
      const sc = (0.65 + rf * 0.75) * U, gap = 15 * sc;
      const y0 = gt + rf * stalkH;
      ctx.strokeStyle = rgb(g < 0.04 ? PAL.stubble : stem); ctx.lineWidth = 2.2 * sc;
      ctx.beginPath();
      const tips = [];
      for (let x = (ri % 2) * gap * 0.5 + 4; x < x1; x += gap) {
        const y = y0 + Math.sin(x * 0.37 + ri) * 3 * sc;
        if (g < 0.04) { ctx.moveTo(x, y); ctx.lineTo(x + 1, y - 4 * sc); continue; }
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
    const bugTarget = Math.round(clamp(vis.P / 4) * (mode === 'sandbox' ? 170 : 230) * vis.warm);
    while (bugs.length < bugTarget) {
      const d = Math.random();
      bugs.push({ x: rnd(4, x1 - 4), d, y: gt + (0.08 + d * 0.88) * bandH, ph: rnd(0, 6.28), r: Math.random(), dir: Math.random() < 0.5 ? 1 : -1, ax: rnd(0, x1), ay: rnd(0.3, 1) });
    }
    if (bugs.length > bugTarget) bugs.splice(0, Math.min(bugs.length - bugTarget, 6));
    const airFrac = smooth(1.6, 3.2, vis.P) * 0.55;
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
    const pests = vis.P > 1.6, fewBirds = vis.S < 0.4, campaign = game.campaign && game.k > 0.2;
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
  function talkAt(x, y) {
    const cands = [];
    birds.forEach(b => { if (!b.fallen) cands.push([Math.hypot(b.x - x, b.y - y), () => { bubbles.push({ bird: b, x: b.x, y: b.y, text: lines('bird'), life: 1 }); chirp(b.x); }]); });
    villagers.forEach(v => cands.push([Math.hypot(v.x - x, v.y - 30 * U - y), () => say(v, 'villager', 46 * U)]));
    farmers.forEach(fm => { if (fm.sx !== undefined) cands.push([Math.hypot(fm.sx - x, fm.sy - y), () => say({ get x() { return fm.sx; }, get y() { return fm.sy; } }, 'farmer', 8 * U)]); });
    cands.sort((a, b) => a[0] - b[0]);
    if (cands.length && cands[0][0] < 55 * U) { if (bubbles.length > 1) bubbles.shift(); cands[0][1](); return true; }
    return false;
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
  function drawKid(x, y, s, shirt, t, ph, aim) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
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
    if (vis.P > 1.6 && farmers.some(f => f.sx !== undefined)) opts.push('broom');
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
      if (p >= 1) { gags.splice(i, 1); continue; }
      if (g.kind === 'kids') {
        const X = q => g.dir > 0 ? lerp(-40, x1 + 40, q) : lerp(x1 + 40, -40, q);
        const bx = X(p + 0.12), by = g.y - 70 * U + Math.sin(t * 0.01) * 10 * U;
        drawBird({ x: bx, y: by, vx: g.dir, sz: 1, ph: 0, panic: 30, hits: 0, a: 1, fallen: false }, t);
        const k1 = [X(p), g.y], k2 = [X(p - 0.05), g.y + 6 * U];
        drawKid(k1[0], k1[1], 1.1 * U * g.dir, '#5b8fc0', t, 0, true);
        drawKid(k2[0], k2[1], 1.1 * U * g.dir, '#d9b45a', t, 1.5, false);
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

  // köylüler tencere çalar: kampanya kaydırıcısına bağlı
  function drawCampaign(t, dt, gt, gb, x1) {
    const f = dt / 16.67;
    const want = game.campaign ? Math.round(game.k * 9) : 0;
    while (villagers.length < want) {
      const i = villagers.length;
      villagers.push({ x: 0, y: 0, slot: i, ph: rnd(0, 6.28), next: t + rnd(200, 1200), hue: [[196, 72, 52], [64, 110, 160], [92, 130, 70], [170, 120, 50]][i % 4] });
    }
    villagers.length = want;
    villagers.forEach((v, i) => {
      const slots = Math.max(want, 1);
      v.x = x1 * (0.08 + 0.84 * ((i + 0.5) / slots)) + Math.sin(v.ph) * 10 * U;
      v.y = gt + (gb - gt) * (i % 2 ? 0.2 : 0.08) + 34 * U;
      const asleep = v.sleep > t, pothead = v.pothead > t;
      const bang = !asleep && Math.sin(t * 0.025 + v.ph) > 0.2;
      const s = U * (1 + (i % 2) * 0.12);
      ctx.save(); ctx.translate(v.x, v.y); if (asleep) ctx.rotate(0.35);
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
      if (t > v.next && !asleep) {
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
      b.vx += (sx * 14 * U + (Math.random() - 0.5) * 0.08) * f;
      b.vy += (sy * 14 * U + (Math.random() - 0.5) * 0.08) * f;

      // böcek avı: sağlıklı tarlada serçeler zaman zaman tarlaya dalar
      if (!b.dive && !b.panic && !b.leave && vis.warm > 0.5 && bugs.length && Math.random() < 0.0016 * f) {
        const bg = bugs[Math.floor(Math.random() * bugs.length)];
        if (bg && bg.r >= smooth(1.6, 3.2, vis.P) * 0.55) b.dive = bg;
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
      const sp = Math.hypot(b.vx, b.vy), max = (b.panic ? 5.5 : b.dive ? 3.6 : 2.3) * U, min = 0.9 * U;
      if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; } else if (sp < min) { b.vx *= min / (sp || 1); b.vy *= min / (sp || 1); }
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
  const MONTH_WARM = 5200 / FAST, MONTH_COLD = 2600 / FAST;
  let gs = newState();
  const game = {};
  const gK = $('g-k');

  function resetGame() {
    gs = newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, campaign: true, quota: 25, yearKills: 0, totalKills: 0,
      fired: new Set(), hist: [], stoppedBy: null, stoppedAt: undefined, sAtStop: 0,
      k: 0, lies: 0, food: [], trust: 70, replaced: false, speed: 1, touched: false, reading: 0,
    });
    gK.value = 10; gK.disabled = false;
    document.querySelectorAll('.coach').forEach(uncoach);
    readGameSliders();
    $('g-pause').textContent = '❚❚ Durdur'; if (typeof setSpeed === 'function') setSpeed(1);
    $('modal').hidden = true; $('harvest').hidden = true; if ($('yb-harvest')) $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone');
    birds.forEach(b => { if (b.fallen) b.a = 0; });
    villagers.length = 0; official = null; if (typeof gags !== 'undefined') { gags.length = 0; nextGag = 0; }
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
    const pace = visible ? 1.5 : toastQueue.length ? 1 : 0.55;
    game.frac += dt / (monthDur() * pace);
    if (game.frac >= 1) { game.frac -= 1; monthTick(); }
  }

  function replaceMinister() {
    game.replaced = true; game.trust = 0;
    gK.value = 100; gK.disabled = true; readGameSliders();
    toast('📜', 'Pekin', 'Görevden alındın. Yerine gelen bakan kampanyayı sonuna kadar açtı.', 'bad');
  }

  function monthTick() {
    const cm = calMonth(gs.m);
    step(gs, { ...DEF, hunt: game.campaign ? game.k : 0 });
    const base = BASE.hist[gs.m - 1].F;
    game.hist.push({ S: gs.S, P: gs.P, Fr: clamp(gs.F / base) });

    // Pekin'in güveni: kampanya kısıldıkça düşer
    if (game.campaign && !game.replaced) {
      game.trust = clamp(game.trust + (game.k - 0.45) * 14, 0, 100);
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
    if (gs.P > 1.3) once('p13', () => toast('🍃', 'Tarla raporu', 'Yapraklarda küçük delikler var. Önemsiz, herhalde.', 'warn'));
    if (gs.P > 2.2) once('p22', () => toast('🦗', 'Tarla raporu', 'Tarlada bir hışırtı var. Bir değil, binlerce.', 'bad'));
    if (gs.P > 3) once('p30', () => toast('⚠️', 'Acil', 'Çekirge sürüleri gökyüzünü karartıyor!', 'bad'));
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
      <div class="s">normal bir yılın yüzdesi · çizgi: normal yıl</div><div class="tap">devam etmek için dokun</div></div>`;
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
    el.onpointerdown = next;
    setTimeout(next, 4200);
  }

  function afterHarvest(i, v) {
    game.state = 'visit';
    official = { t0: performance.now(), leave: 0, say: pick(['Hasat ne kadar, yoldaş?', 'Rapor zamanı!\nNe yazalım?', 'Pekin rakam bekliyor.']) };
    setTimeout(() => askReport(i, v), 1700);
  }
  function askReport(i, v) {
    const m = $('modal');
    m.innerHTML = `<div class="card"><div class="from">Devlet yetkilisi</div><h2>${1958 + i} hasadı: gerçekte %${v}</h2><p>Pekin'e giden rapora ne yazalım? Devlet, <b>raporlanan</b> hasadın üçte birini toplayacak.</p><div class="opts"></div></div>`;
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
    if (!met && !game.replaced) { game.trust = clamp(game.trust - 20, 0, 100); if (game.trust <= 0) replaceMinister(); }
    if (i === 0) toast('📻', 'Pekin', met ? 'Kooperatiflerden "rekor hasat" raporları yağıyor. 1959 kotası 40 serçe!' : 'Kotanın gerisinde kaldın. 1959 kotası yine de 40 serçe.', met ? '' : 'warn');
    game.quota = 40; game.yearKills = 0; renderQuota();
  }

  // devlet yetkilisi: takım elbise, dosya, kalem
  let official = null;
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
    const st = walk ? Math.sin(t * 0.02) * 4 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(0, 2, 12, 3, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#2f3b46'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-4 - st, 2); ctx.moveTo(3, -6); ctx.lineTo(4 + st, 2); ctx.stroke();
    ctx.fillStyle = '#4a5866'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-9, -30, 18, 26, 5) : ctx.rect(-9, -30, 18, 26); ctx.fill();
    ctx.fillStyle = '#3a4652'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, -25 + k * 7, 1.2, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = '#f2d2b0'; ctx.beginPath(); ctx.arc(0, -37, 7.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#4a5866'; ctx.beginPath(); ctx.ellipse(0, -43, 9, 3.5, 0, 0, 6.283); ctx.fill(); ctx.fillRect(-6, -48, 12, 5); // kasket
    ctx.fillStyle = '#c0503a'; ctx.beginPath(); ctx.arc(0, -46, 1.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(-2.6, -37, 1.2, 0, 6.283); ctx.arc(2.6, -37, 1.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-20, -26, 11, 14); ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1; ctx.strokeRect(-20, -26, 11, 14); // dosya
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
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, get gs() { return gs; }, get mode() { return mode; } };


  function renderResult() {
    if (gs.harvests.length < 3) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn" data-g="3">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const you = [0, 1, 2].map(i => hIdx(gs, i, BASE)), his = [0, 1, 2].map(i => hIdx(HISTORY, i, BASE));
    const avg = you.reduce((a, b) => a + b) / 3, k = game.totalKills;
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'Kuşbilimcileri dinledin ve koltuğunu kaybettin. Yerine gelen bakan tarihi tekrarladı. Doğru şeyi bilmek yetmiyor; sistemin de dinlemesi gerekiyor.'; }
    else if (k === 0) { title = 'Tencereni hiç çalmadın'; text = 'Kota tutmadı ve Pekin\'in güvenini zor korudun. Ama ambarların doldu, kuşlar hâlâ ötüyor. Tarih kitapları seni yazmayacak ve en iyi sonuç bu.'; }
    else if (avg >= 93) { title = 'Erken durdun'; text = 'Kampanyaya katıldın ama ekosistemi kırmadan bıraktın. Bazen en iyi politika bir şey yapmamaktır, ama bunun için kimse heykel dikmez.'; }
    else if (avg >= 78) { title = 'Geç de olsa fark ettin'; text = 'Serçeler geri dönüyor ama acele etmiyorlar: yılda yalnızca bir iki kez kuluçkaya yatarlar. Bazı köyler yine de aç kaldı.'; }
    else { title = 'Serçelere karşı savaşı kazandın'; text = 'Çekirgeler de kazandı. Kaybeden sadece insanlar oldu. Tebrikler, tarihi başarıyla tekrarladın.'; }
    if (game.lies >= 2) text += ' Raporları şişirerek Pekin\'i mutlu ettin; bedelini köylüler ödedi.';
    const col = v => v >= 90 ? 'var(--green)' : v >= 70 ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">Şubat 1961 · görev süren doldu</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      <div class="rgrid">${you.map((v, i) => `<div><div class="y">${1958 + i} hasadı</div><div class="v" style="color:${col(v)}">%${v}</div><div class="h">tarihte: %${his[i]}</div></div>`).join('')}</div>
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
      { data: game.hist.map(d => d.P / 4), color: '#b5543c' },
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
      { data: sb.hist.map(d => d.P / 4), color: '#b5543c' },
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
    const health = 0.45 * clamp(vis.Fr) + 0.35 * vis.S + 0.2 * (1 - clamp(vis.P / 4));
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
      $('m-p').style.width = clamp(vis.P / 4) * 100 + '%';
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
