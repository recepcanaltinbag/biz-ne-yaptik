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
  // MODEL — S: serçe (1 = sağlıklı), P: zararlı böcek (~0.8 normal), F: tarla (0–1), tox: kirlilik
  // =====================================================================
  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const TOTAL = 36;
  const calMonth = m => (2 + m) % 12;
  const calYear = m => 1958 + Math.floor((2 + m) / 12);
  const isWarm = cm => cm >= 3 && cm <= 8;
  const DEF = { hunt: 0, pest: 0, nest: 0, heat: 1 };

  const newState = () => ({ m: 0, S: 1, P: 0.5, F: 1, tox: 0, harvests: [], hist: [] });

  function applyPesticide(st) {
    st.P *= 0.35; st.S *= 0.88; st.tox = Math.min(1, st.tox + 0.35);
  }

  function step(st, p = DEF) {
    const cm = calMonth(st.m);
    if (cm === 2) st.F = 1; // yeni ekim
    // serçeler Nisan–Temmuz arası ürer; yuvalar hem üremeyi hem dışarıdan gelişi artırır
    if (cm >= 3 && cm <= 6) st.S += (0.15 + 0.2 * p.nest) * st.S * (1 - st.S) + 0.004 * (1 + 3 * p.nest) * (1 - st.S);
    st.S -= p.hunt * 0.2 * st.S;
    st.S -= st.tox * 0.04 * st.S;
    st.tox = Math.min(1, st.tox + p.pest * 0.1);
    if (isWarm(cm)) st.P += 0.5 * p.heat * st.P * (1 - st.P / 4) - 0.4 * st.S * st.P - (st.tox * 0.15 + p.pest * 0.3) * st.P;
    else st.P = Math.max(0.08, st.P * 0.8);
    if (isWarm(cm)) st.F -= st.F * 0.055 * st.P;
    if (cm >= 6 && cm <= 8) st.F -= st.F * 0.025 * st.S;
    if (cm === 9) st.harvests.push(st.F);
    st.tox *= 0.92;
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
    if (m === 'game') L.gt = 0.58;
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

  const birds = [], bugs = [], rings = [], floats = [], bubbles = [];
  const clouds = Array.from({ length: 4 }, (_, i) => ({ x: rnd(0, 1), y: rnd(0.12, 0.3), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000014) }));
  const vis = { S: 1, P: 0.6, Fr: 1, tox: 0, c: 6.3, warm: 1, bad: 0 };

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
    ctx.beginPath(); ctx.moveTo(0, gb);
    for (let x = 0; x <= x1 + 10; x += 12) ctx.lineTo(x, gt - 26 * U - Math.sin(x * 0.004 + 0.8) * 22 * U - Math.sin(x * 0.011) * 8 * U);
    ctx.lineTo(x1, gb); ctx.closePath(); ctx.fill();

    // tarla
    let grass = mixC(PAL.grass, PAL.grassBad, clamp(vis.bad * 1.1));
    if (winter) grass = mixC(grass, PAL.grassWinter, 0.6);
    ctx.fillStyle = rgb(grass);
    ctx.beginPath(); ctx.moveTo(0, gb);
    for (let x = 0; x <= x1 + 10; x += 10) ctx.lineTo(x, groundY(x));
    ctx.lineTo(x1, gb); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgb(PAL.ink, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); for (let x = 0; x <= x1 + 10; x += 10) x ? ctx.lineTo(x, groundY(x)) : ctx.moveTo(x, groundY(x)); ctx.stroke();

    // başaklar: arkadan öne sıralar
    const rows = [0.1, 0.26, 0.44, 0.64, 0.86], bandH = gb - gt;
    let stem = mixC(PAL.stem, PAL.stemRipe, ripe); stem = mixC(stem, PAL.stemDry, clamp(dmg * 0.9));
    const head = mixC(PAL.head, PAL.stemDry, clamp(dmg * 0.8));
    const headK = smooth(0.45, 0.85, g) * (0.45 + 0.55 * clamp(vis.Fr));
    ctx.lineCap = 'round';
    rows.forEach((rf, ri) => {
      const sc = (0.65 + rf * 0.75) * U, gap = 15 * sc;
      const y0 = gt + rf * bandH;
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

    // ilaç sisi
    if (vis.tox > 0.03) { ctx.fillStyle = `rgba(160,110,200,${vis.tox * 0.16})`; ctx.fillRect(0, gt - 40 * U, x1, gb - gt + 40 * U); }

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

    // ülke çapında kampanya: ufukta uzak tencere halkaları
    if (mode === 'game' && game.campaign && game.state === 'play' && Math.random() < 0.012 * (dt / 16)) {
      rings.push({ x: rnd(30, x1 - 30), y: gt - rnd(0, 18) * U, r: 2, life: 1, big: false });
    }

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
      if (bb.life <= 0) { bubbles.splice(i, 1); continue; }
      drawBubble(bb);
    }

    // nişan halkası (fare)
    if (pointer.on && (mode === 'game' || mode === 'sandbox') && pointer.x < x1) {
      ctx.strokeStyle = rgb(PAL.ink, 0.25); ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 95 * U, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    }
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
      const b = alive[Math.floor(Math.random() * alive.length)];
      if (vis.tox > 0.08 && mode !== 'title') fallBird(b, false); else b.leave = true;
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
      Object.assign(target, { S: 1, P: 0.6, Fr: 1, tox: 0, warm: 1 }); vis.c = 6.3;
    }
  }
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => { initAudio(); goTo(cur + 1); }));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { resetGame(); goTo(Number(b.dataset.goto)); }));
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && cur < maxSeen) goTo(cur + 1);
    if (e.key === 'ArrowLeft' && cur > 0) goTo(cur - 1);
  });

  // =====================================================================
  // BİLDİRİMLER
  // =====================================================================
  function toast(ic, from, text, tone = '') {
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + tone;
    el.innerHTML = `<div class="ic">${ic}</div><div><span class="from">${from}</span>${text}</div>`;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 6500);
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const FAST = /[?&]hizli\b/.test(location.search) ? 8 : 1; // test için: ?hizli
  const MONTH_WARM = 5200 / FAST, MONTH_COLD = 2400 / FAST;
  const BMAX_GAME = 40;
  let gs = newState();
  const game = {};
  function resetGame() {
    gs = newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, campaign: true, quota: 25, yearKills: 0, totalKills: 0,
      lastTap: performance.now(), fired: new Set(), hist: [], usedPesticide: false, stoppedBy: null, stoppedAt: undefined, sAtStop: 0, firstTap: false,
    });
    $('modal').hidden = true; $('harvest').hidden = true; $('toasts').innerHTML = '';
    $('g-intro').classList.remove('gone');
    birds.forEach(b => { if (b.fallen) b.a = 0; });
    renderQuota();
  }
  resetGame();

  function once(key, fn) { if (!game.fired.has(key)) { game.fired.add(key); fn(); } }
  const yearKey = () => calYear(Math.min(gs.m, TOTAL - 1));

  function enterGame() {
    game.paused = false;
    if (!game.started) {
      game.started = true; game.lastTap = performance.now();
      setTimeout(() => toast('📻', 'Köy hoparlörü', 'Dört Zararlı Kampanyası başladı! Herkes tencere başına!'), 900);
    }
  }

  function renderQuota() {
    const q = $('g-quota');
    if (!game.campaign) {
      q.classList.add('off'); q.classList.remove('done');
      q.innerHTML = `<span class="lbl">${game.stoppedBy === 'auto' ? 'Serçeler listeden çıkarıldı' : 'Kampanya durduruldu'}</span>`;
      return;
    }
    if (!$('q-n')) q.innerHTML = '<span class="lbl">Kota</span> <b id="q-n">0</b>/<span id="q-t">25</span> <span class="track"><i id="q-bar"></i></span>';
    q.classList.remove('off');
    $('q-n').textContent = game.yearKills; $('q-t').textContent = game.quota;
    $('q-bar').style.width = clamp(game.yearKills / game.quota) * 100 + '%';
    q.classList.toggle('done', game.yearKills >= game.quota);
  }

  function onKill(b) {
    if (mode === 'sandbox') { sb.st.S = Math.max(0, sb.st.S - 1 / 34); return; }
    if (mode !== 'game') return;
    gs.S = Math.max(0, gs.S - 1 / BMAX_GAME);
    game.totalKills++; game.yearKills++;
    floats.push({ x: b.x, y: b.y - 14 * U, text: '+1', life: 1 });
    renderQuota();
    const y = yearKey(), q = game.quota;
    once('first', () => toast('🏅', 'Kooperatif', 'İlk serçe düştü. Tebrikler, örnek vatandaş!', 'good'));
    if (game.yearKills === Math.ceil(q / 2)) once('half' + y, () => toast('📻', 'Köy hoparlörü', 'Kotanın yarısı doldu. Hoparlörden marşlar çalıyor.'));
    if (game.yearKills === q) once('full' + y, () => toast('🏆', 'Pekin', 'Kota doldu! Adın övgü listesine yazıldı.', 'good'));
    if (game.yearKills === q + 5) once('over' + y, () => toast('📈', 'Rapor', 'Kotayı aştın. Pekin\'e "iki katı" diye rapor edilecek.'));
  }

  function gameTap(x, y) {
    game.lastTap = performance.now();
    if (!game.firstTap) { game.firstTap = true; $('g-intro').classList.add('gone'); }
    if (!game.campaign) {
      rings.push({ x, y, r: 4, life: 0.6, big: false });
      once('calm' + yearKey(), () => toast('🕊️', 'İç ses', 'Kampanya bitti. Bırak kuşlar dönsün.'));
      return;
    }
    scare(x, y, true);
    if (y > lay.gt * H && vis.P > 1.5) once('bugs', () => toast('🦗', 'Gözlem', 'Çekirgeler tencereden korkmuyor.'));
  }

  function monthDur() { return isWarm(calMonth(gs.m)) ? MONTH_WARM : MONTH_COLD; }

  function updateGame(dt) {
    if (mode !== 'game' || game.paused || game.state !== 'play' || gs.m >= TOTAL) return;
    game.frac += dt / monthDur();
    if (game.frac >= 1) { game.frac -= 1; monthTick(); }
    const now = performance.now(), y = yearKey(), cm = calMonth(gs.m);
    if (game.campaign && isWarm(cm) && game.yearKills < game.quota && now - game.lastTap > 16000)
      once('idle' + y, () => toast('📞', 'Parti sekreteri', 'Tencereler neden sustu? Kota bekliyor.', 'warn'));
    const alive = birds.filter(b => !b.fallen && !b.leave).length;
    if (game.campaign && game.quota - game.yearKills > alive + 1)
      once('impossible' + y, () => toast('🤷', 'Rapor', 'Kotayı dolduracak kadar serçe kalmadı. Raporda yine de "aşıldı" yazacak.'));
  }

  function monthTick() {
    step(gs, DEF);
    const base = BASE.hist[gs.m - 1].F;
    game.hist.push({ S: gs.S, P: gs.P, Fr: clamp(gs.F / base) });
    if (gs.S < 0.75) once('zheng', () => toast('🔬', 'Kuşbilimci Zheng', 'Serçeler yavrularını böcekle besler. Bunu yapmasak mı?'));
    if (gs.S < 0.5) once('s50', () => toast('🐦', 'Gözlem', 'Gökyüzü seyreldi. Serçeler yarı yarıya azaldı.'));
    if (gs.S < 0.2) once('s20', () => toast('🔇', 'Gözlem', 'Sabahları artık kuş sesi gelmiyor.', 'bad'));
    if (gs.P > 1.3) once('p13', () => toast('🍃', 'Tarla raporu', 'Yapraklarda küçük delikler var. Önemsiz, herhalde.', 'warn'));
    if (gs.P > 2.2) once('p22', () => toast('🦗', 'Tarla raporu', 'Tarlada bir hışırtı var. Bir değil, binlerce.', 'bad'));
    if (gs.P > 3) once('p30', () => toast('⚠️', 'Acil', 'Çekirge sürüleri gökyüzünü karartıyor!', 'bad'));
    if (gs.tox > 0.3) once('tox', () => toast('🐟', 'Nehir', 'Nehirde ölü balıklar görüldü. Herhalde tesadüftür.', 'bad'));
    if (!game.campaign && gs.S > 0.45 && game.stoppedAt !== undefined && gs.S > game.sAtStop + 0.15)
      once('back', () => toast('🐣', 'Gözlem', 'Serçeler dönüyor. Yavaş ama dönüyorlar.', 'good'));

    if (gs.m === 25 && game.campaign) {
      game.campaign = false; game.stoppedBy = 'auto'; game.stoppedAt = gs.m; game.sAtStop = gs.S;
      toast('📜', 'Pekin · Nisan 1960', 'Serçeler sessizce listeden çıkarıldı. Yerlerine tahtakuruları kondu.');
      renderQuota();
    }
    if (calMonth(gs.m - 1) === 9) showHarvest(gs.harvests.length - 1);
    else if (gs.m >= TOTAL) endGame();
  }

  function showHarvest(i) {
    game.state = 'harvest';
    const v = hIdx(gs, i, BASE);
    const el = $('harvest');
    const col = v >= 90 ? 'var(--green)' : v >= 70 ? 'var(--grain)' : 'var(--danger)';
    el.innerHTML = `<div><div class="k">${1958 + i} hasadı</div><div class="n" style="color:${col}">%<span id="hv-n">0</span></div><div class="s">normal bir yılın yüzdesi olarak</div><div class="tap">devam etmek için dokun</div></div>`;
    el.hidden = false;
    const t0 = performance.now();
    (function count() {
      const k = clamp((performance.now() - t0) / 1100);
      const n = $('hv-n'); if (!n) return;
      n.textContent = Math.round(v * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(count);
    })();
    let done = false;
    const next = () => { if (done) return; done = true; el.hidden = true; afterHarvest(i); };
    el.onpointerdown = next;
    setTimeout(next, 4200);
  }

  function choice(from, title, text, opts) {
    game.state = 'choice';
    const m = $('modal');
    m.innerHTML = `<div class="card"><div class="from">${from}</div><h2>${title}</h2><p>${text}</p><div class="opts"></div></div>`;
    const box = m.querySelector('.opts');
    opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'opt';
      b.innerHTML = `${o.label}<small>${o.sub}</small>`;
      b.onclick = () => { m.hidden = true; game.state = 'play'; game.lastTap = performance.now(); o.fn(); renderQuota(); };
      box.appendChild(b);
    });
    m.hidden = false;
  }

  function stopCampaign(msg) {
    game.campaign = false; game.stoppedBy = 'player'; game.stoppedAt = gs.m; game.sAtStop = gs.S;
    toast('🕊️', 'Karar', msg, 'good');
  }
  function newYear(q) { game.quota = q; game.yearKills = 0; }

  function afterHarvest(i) {
    if (gs.m >= TOTAL) return endGame();
    if (i === 0 && game.campaign) {
      if (game.yearKills >= 5) {
        choice('Ekim 1958', 'Pekin hasattan memnun', 'Kooperatiflerden "rekor hasat" raporları yağıyor. 1959 kotası 40 serçeye çıkarıldı.', [
          { label: 'Kampanyaya devam', sub: 'Kota: 40 serçe', fn: () => newYear(40) },
          { label: 'Kuşbilimcileri dinle', sub: 'Kampanyayı durdurmayı öner', fn: () => stopCampaign('Önerin "sağcı sapma" olarak dosyana işlendi. Ama tarlalar sana teşekkür edecek.') },
        ]);
      } else {
        choice('Ekim 1958', 'Pekin memnun değil', 'Kotanın çok gerisinde kaldın. Komşu köyler serçe torbalarıyla övünüyor.', [
          { label: 'Bu yıl daha çok çalışacağım', sub: 'Kota: 40 serçe', fn: () => newYear(40) },
          { label: 'Serçelere dokunmayacağım', sub: 'Kampanyadan çekil', fn: () => stopCampaign('Adın "geri kalmış köyler" listesine yazıldı. Serçelerin umurunda değil.') },
        ]);
      }
      return;
    }
    if (i === 1 && game.campaign) {
      choice('Ekim 1959', gs.P > 1.5 ? 'Çekirgeler geldi' : 'Tarlada bir tuhaflık var',
        'Serçeler azaldı, böcekler arttı. Raporlar hâlâ "rekor" diyor ama ambarlar başka bir şey söylüyor.', [
          { label: 'Böcek ilacı sık', sub: 'Hızlı çözüm. Kuşlar ve su da etkilenir.', fn: () => { applyPesticide(gs); game.usedPesticide = true; newYear(40); toast('✈️', 'Tarım bakanlığı', 'İlaç uçakları kalktı. Böcekler azaldı... kuşlar da.', 'warn'); } },
          { label: 'Kampanyayı durdur', sub: 'Serçeler dönsün', fn: () => stopCampaign('Geç de olsa durdun. Serçeler dönecek ama acele etmeyecekler.') },
          { label: 'Tencereye devam', sub: 'Kota kotadır', fn: () => newYear(40) },
        ]);
      return;
    }
    game.state = 'play';
  }

  function endGame() {
    game.state = 'end';
    setTimeout(() => { if (mode === 'game') goTo(4); }, 1500);
  }

  function renderResult() {
    if (gs.harvests.length < 3) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn" data-g="3">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(3); return; }
    const you = [0, 1, 2].map(i => hIdx(gs, i, BASE)), his = [0, 1, 2].map(i => hIdx(HISTORY, i, BASE));
    const avg = you.reduce((a, b) => a + b) / 3, k = game.totalKills;
    let title, text;
    if (k === 0) { title = 'Tencereni hiç çalmadın'; text = 'Kota tutmadı ve adın övgü listesine girmedi. Ama ambarların doldu, kuşlar hâlâ ötüyor. Tarih kitapları seni yazmayacak ve en iyi sonuç bu.'; }
    else if (avg >= 93) { title = 'Erken durdun'; text = 'Kampanyaya katıldın ama ekosistemi kırmadan bıraktın. Bazen en iyi politika bir şey yapmamaktır, ama bunun için kimse heykel dikmez.'; }
    else if (avg >= 78) { title = 'Geç de olsa fark ettin'; text = 'Serçeler geri dönüyor ama acele etmiyorlar: yılda yalnızca bir iki kez kuluçkaya yatarlar. Bazı köyler yine de aç kaldı.'; }
    else { title = 'Serçelere karşı savaşı kazandın'; text = 'Çekirgeler de kazandı. Kaybeden sadece insanlar oldu. Tebrikler, tarihi başarıyla tekrarladın.'; }
    if (game.usedPesticide) text += ' Üstelik geride ilaç kirliliği bıraktın.';
    const col = v => v >= 90 ? 'var(--green)' : v >= 70 ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">Şubat 1961 · görev süren doldu</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      <div class="rgrid">${you.map((v, i) => `<div><div class="y">${1958 + i} hasadı</div><div class="v" style="color:${col(v)}">%${v}</div><div class="h">tarihte: %${his[i]}</div></div>`).join('')}</div>
      <p class="verdict">Düşürdüğün serçe: <b>${k}</b>. Gerçekte bu sayı yüz milyonlarcaydı.</p>
      <canvas class="rchart" id="rchart"></canvas>
      <div class="legend"><span style="--c:var(--bird)">Serçe</span><span style="--c:var(--bug)">Böcek</span><span style="--c:var(--grain)">Tahıl</span><span style="--c:#9aa59a">Tarihteki serçe (kesikli)</span></div>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button></div>`;
    $('r-again').onclick = () => { resetGame(); goTo(3); };
    $('r-next').onclick = () => goTo(5);
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
  const SL = { hunt: 'p-hunt', pest: 'p-pest', nest: 'p-nest', heat: 'p-heat' };
  function readSliders() {
    sb.p.hunt = $('p-hunt').value / 100; sb.p.pest = $('p-pest').value / 100;
    sb.p.nest = $('p-nest').value / 100; sb.p.heat = $('p-heat').value / 100;
    $('o-hunt').textContent = '%' + $('p-hunt').value; $('o-pest').textContent = '%' + $('p-pest').value;
    $('o-nest').textContent = '%' + $('p-nest').value; $('o-heat').textContent = '×' + (sb.p.heat).toFixed(1);
  }
  Object.values(SL).forEach(id => $(id).addEventListener('input', () => { readSliders(); document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: [80, 0, 0, 100], none: [0, 0, 0, 100], spray: [60, 60, 0, 100], nature: [0, 0, 70, 100] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset];
    ['p-hunt', 'p-pest', 'p-nest', 'p-heat'].forEach((id, i) => $(id).value = v[i]);
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
    if (mode === 'game') { if (game.state === 'play') gameTap(x, y); return; }
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
  const target = { S: 1, P: 0.6, Fr: 1, tox: 0, warm: 1 };
  let last = performance.now(), bgTick = 0, lastBg = '';
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    updateGame(dt); updateSandbox(dt);

    // hangi dünya gösteriliyor?
    if (mode === 'game' || mode === 'result') {
      const base = gs.m > 0 ? BASE.hist[gs.m - 1].F : 1;
      Object.assign(target, { S: gs.S, P: gs.P, Fr: clamp(gs.F / base), tox: gs.tox, warm: isWarm(calMonth(Math.min(gs.m, TOTAL - 1))) ? 1 : 0 });
      vis.c = 2 + Math.min(gs.m, TOTAL) + (game.state === 'play' ? game.frac : 0);
    } else if (mode === 'sandbox') {
      const cm = calMonth(Math.max(0, sb.st.m - 1));
      Object.assign(target, { S: sb.st.S, P: sb.st.P, Fr: sb.st.m ? clamp(sb.st.F / EQ_F[cm]) : 1, tox: sb.st.tox, warm: isWarm(calMonth(sb.st.m)) ? 1 : 0 });
      vis.c = 2 + sb.st.m + sb.frac;
    }
    const k = 1 - Math.pow(0.92, dt / 16);
    vis.S = lerp(vis.S, target.S, k * 1.5 > 1 ? 1 : k * 1.5);
    vis.P = lerp(vis.P, target.P, k * 0.6); vis.Fr = lerp(vis.Fr, target.Fr, k * 0.6);
    vis.tox = lerp(vis.tox, target.tox, k * 0.6); vis.warm = lerp(vis.warm, target.warm, k * 0.25);
    const health = 0.45 * clamp(vis.Fr) + 0.35 * vis.S + 0.2 * (1 - clamp(vis.P / 4));
    vis.bad = lerp(vis.bad, smooth(0.08, 0.6, 1 - health), k * 0.5);

    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);

    render(now, dt);

    // HUD ve arka plan rengi
    if (mode === 'game') {
      const mm = Math.min(gs.m, TOTAL - 1);
      $('g-date').textContent = `${MONTHS[calMonth(mm)]} ${calYear(mm)}`;
      $('m-s').style.width = vis.S * 100 + '%';
      $('m-p').style.width = clamp(vis.P / 4) * 100 + '%';
      $('m-f').style.width = clamp(vis.Fr) * 100 + '%';
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
