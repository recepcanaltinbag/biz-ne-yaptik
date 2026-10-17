// Bölüm 2 — Kurtarıcı Kurbağa (Avustralya, 1935–2025)
(() => {
  'use strict';
  const MISSION = {"title": "Kurtarıcı Kurbağa · Avustralya, 1935", "role": "Queensland'de tarım danışmanısın. Kamış böceği şeker kamışını yiyor.", "control": "Önce kurbağaları salıp salmama kararı. Sonra yıllar içinde açılan araçlar: 🪣 toplama, 🎓 öğretmen kurbağa, 🚧 çit. Hepsi 100 puanlık ortak bütçeden.", "goal": "2025'e kadar yerli yırtıcıları (kuzey kedisi, goanna, yılan) <b class=\"inl\">%45'in üstünde</b> tut.", "watch": "Kurbağa bir kez salınırsa geri toplanamaz. Haritada yayılışı izle."};
  const M = window.ToadModel;
  const $ = id => document.getElementById(id);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const smooth = M.smooth;
  const FAST = /[?&]hizli\b/.test(location.search) ? 6 : 1;
  const TOAD_IMG = '../../assets/img/cards/cane-toad-bufo-marinus.jpg';
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
  // yumuşak, alçak bir "vıraak": iki kısa vurgu, süzgeçten geçmiş, kulak tırmalamaz
  function trill() {
    if (!AC) return;
    const t0 = AC.currentTime, f0 = rnd(150, 190);
    [0, 0.2].forEach((dt, k) => {
      const t = t0 + dt, o = AC.createOscillator(), lp = AC.createBiquadFilter(), e = AC.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * (k ? 0.9 : 1), t); o.frequency.exponentialRampToValueAtTime(f0 * 0.75, t + 0.16);
      lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 2;
      o.connect(lp); lp.connect(e); e.connect(master);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.03, t + 0.03); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      o.start(t); o.stop(t + 0.2);
    });
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
  // harita kamerası: odak noktası (taban projeksiyon pikseli) ve yakınlık; hedefe yumuşakça yaklaşır
  const cam = { fx: 0, fy: 0, z: 1, init: false }, camT = { fx: 0, fy: 0, z: 1 };
  function camCenter() { const r = mapRect(); return [r.x + r.w / 2, r.y + r.h / 2]; }
  const toScreen = (x, y) => { const [cx, cy] = camCenter(); return [cx + (x - cam.fx) * cam.z, cy + (y - cam.fy) * cam.z]; };
  const toBase = (x, y) => { const [cx, cy] = camCenter(); return [cam.fx + (x - cx) / cam.z, cam.fy + (y - cy) / cam.z]; };
  function camTarget(st, now) {
    const [cx, cy] = camCenter();
    if (mode !== 'game' || game.phase !== 'map' || game.state === 'end') return { fx: cx, fy: cy, z: 1 };
    if (game.focus && now < game.focus.until) { const [fx, fy] = P(game.focus.lon, game.focus.lat); return { fx, fy, z: game.focus.z }; }
    const b = game.bbox;
    if (!b) { const [fx, fy] = P(147, -20); return { fx, fy, z: 2.6 }; }
    // kurbağaların yayıldığı alanı ve cepheyi çerçevele
    const r = mapRect(), [x0, y0] = P(b.minLon, b.maxLat), [x1, y1] = P(b.maxLon, b.minLat);
    const z = clamp(Math.min(r.w / ((x1 - x0) * 1.35 + 60), r.h / ((y1 - y0) * 1.35 + 60)), 1, 2.6);
    let fx = (x0 + x1) / 2, fy = (y0 + y1) / 2;
    if (b.west) { const [wx, wy] = P(b.west[0], b.west[1]); fx = lerp(fx, wx, 0.25); fy = lerp(fy, wy, 0.2); }
    return { fx, fy, z };
  }
  function updateCam(st, now, dt) {
    const t = camTarget(st, now);
    if (!cam.init) { Object.assign(cam, t); cam.init = true; }
    const k = 1 - Math.pow(0.965, dt / 16.67);
    cam.fx = lerp(cam.fx, t.fx, k); cam.fy = lerp(cam.fy, t.fy, k); cam.z = lerp(cam.z, t.z, k * 0.8);
  }
  function focus(lon, lat, z = 2.3, ms = 5000) { game.focus = { lon, lat, z, until: performance.now() + ms / FAST }; }
  function mapRect() {
    if (mobile) {
      const pnl = document.querySelector('.slide.active .gpanel, .slide.active .sb-panel');
      const bottom = pnl ? pnl.getBoundingClientRect().top - 8 : H * 0.56;
      return { x: 4, y: 130, w: W - 8, h: Math.max(120, bottom - 130) };
    }
    const right = mode === 'sandbox' ? 380 : 366;
    if (mode === 'game' && document.body.classList.contains('dock')) {
      const pnl = document.querySelector('.slide.active .gpanel');
      const bottom = pnl ? pnl.getBoundingClientRect().top - 10 : H - 60;
      return { x: 12, y: 150, w: W - 24, h: Math.max(160, bottom - 150) };
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
    const LQ = Math.min(DPR * 2, Math.sqrt(9e6 / (W * H))); // yakınlaşınca da keskin kalsın (bellek sınırlı)
    land.width = W * LQ; land.height = H * LQ; lctx.setTransform(LQ, 0, 0, LQ, 0, 0); lctx.clearRect(0, 0, W, H);
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
  const field = { seaW: 0, gt: 0, floor: 0 };
  const ship = { t0: 0, docked: false, smoke: [] };
  function buildField() {
    stalks.length = 0; beetles.length = 0;
    for (let row = 0; row < 2; row++) for (let x = 20 + row * 30; x < W + 20; x += 62 * U) stalks.push({ x: x + rnd(-8, 8), row, h: rnd(0.85, 1.1), ph: rnd(0, 6.28) });
    const fieldStalks = stalks.filter(s => s.x > W * (mobile ? 0.3 : 0.22) + 40 * U);
    for (let i = 0; i < Math.round(W / 140); i++) { const s = pick(fieldStalks); beetles.push({ st: s, dy: rnd(0.02, 0.15), ph: rnd(0, 6.28) }); }
  }

  // Hawaii'den gelen gemi: oyun başında yanaşır, kasaları indirir
  function drawShip(t, seaW, gt) {
    if (!ship.t0) ship.t0 = t;
    const q = smooth(0, 1, (t - ship.t0) / 3800);
    const x = lerp(-260 * U, seaW - 175 * U, q), y = gt + 6 * U + Math.sin(t * 0.0025) * 2.5 * U, s = U * (mobile ? 0.8 : 1);
    if (q >= 1 && !ship.docked) { ship.docked = true; horn(); if (ship.onDock) { const f = ship.onDock; ship.onDock = null; f(); } }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#b04a3a'; ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(170, -18); ctx.lineTo(150, 6); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); // gövde
    ctx.fillStyle = '#2b3a2e'; ctx.fillRect(-6, -22, 172, 5);
    ctx.fillStyle = '#f3ecd8'; ctx.fillRect(90, -46, 48, 24); ctx.fillStyle = '#9cc8d8'; [96, 110, 124].forEach(wx => ctx.fillRect(wx, -40, 8, 8)); // köprü üstü
    ctx.fillStyle = '#2b3a2e'; ctx.fillRect(112, -66, 12, 20); ctx.fillStyle = '#c0503a'; ctx.fillRect(112, -66, 12, 5); // baca
    ctx.fillStyle = '#b8894f'; [[16, -36], [40, -36], [28, -50]].forEach(([cx, cy]) => { ctx.fillRect(cx, cy, 22, 14); ctx.strokeStyle = '#7a5a30'; ctx.strokeRect(cx, cy, 22, 14); }); // kasalar
    ctx.fillStyle = rgb(INK); ctx.font = '11px "Patrick Hand"'; ctx.fillText('HAWAII', 30, -4);
    ctx.restore();
    if (Math.random() < 0.08) ship.smoke.push({ x: x + 118 * s, y: y - 66 * s, r: 5 * s, a: 0.6 });
    for (let i = ship.smoke.length - 1; i >= 0; i--) {
      const p = ship.smoke[i]; p.y -= 0.5 * U; p.x += 0.3 * U; p.r += 0.15; p.a -= 0.006;
      if (p.a <= 0) { ship.smoke.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(120,120,120,${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ship.x = x + 80 * s; ship.y = y - 70 * s;
  }
  function horn() {
    if (!AC) return;
    const t0 = AC.currentTime, o = AC.createOscillator(), e = AC.createGain();
    o.type = 'sawtooth'; o.frequency.value = 110; o.connect(e); e.connect(master);
    e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.06, t0 + 0.1); e.gain.setValueAtTime(0.06, t0 + 0.9); e.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    o.start(t0); o.stop(t0 + 1.5);
  }

  function drawField(t, dt, crowd) {
    const pnl = (mobile || document.body.classList.contains('dock')) && mode === 'game' ? document.querySelector('.slide.active .gpanel') : null;
    const floor = pnl ? pnl.getBoundingClientRect().top - 6 : H;
    const gt = mobile ? Math.min(H * 0.46, floor - 150) : Math.min(H * 0.74, floor - 170), sh = H * (mobile ? 0.24 : 0.34);
    const seaW = W * (mobile ? 0.3 : 0.22);
    field.seaW = seaW; field.gt = gt; field.floor = floor;
    // deniz ve dalgalar
    ctx.fillStyle = '#9cc8d8'; ctx.fillRect(0, gt - 6 * U, seaW, H - gt + 6 * U);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let k = 0; k < 7; k++) { const y = gt + k * 22 * U + 4 * U; ctx.beginPath(); for (let x = 0; x <= seaW; x += 10) { const yy = y + Math.sin(x * 0.05 + t * 0.002 + k) * 3 * U; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); }
    // kıyı ve tarla
    ctx.fillStyle = '#c9b48a'; ctx.fillRect(seaW, gt, W - seaW, H - gt);
    ctx.strokeStyle = rgb(INK, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(seaW, gt); ctx.lineTo(W, gt); ctx.stroke();
    ctx.fillStyle = 'rgba(120,90,50,.18)'; for (let i = 0; i < 6; i++) ctx.fillRect(seaW, gt + 14 + i * i * 6, W - seaW, 2);
    // iskele
    ctx.fillStyle = '#9a7247'; ctx.fillRect(seaW - 70 * U, gt - 4 * U, 80 * U, 8 * U);
    ctx.fillStyle = '#7a5a3a'; for (let k = 0; k < 3; k++) ctx.fillRect(seaW - 66 * U + k * 26 * U, gt + 4 * U, 5 * U, 26 * U);
    drawShip(t, seaW, gt);
    for (const s of stalks) {
      if (s.x < seaW + 30 * U) continue;
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
      scientists.forEach((p, i) => { p.x = seaW + (30 + i * 70) * U; p.y = gt + 46 * U; drawPerson(p.x, p.y, 1.3 * U, '#f4f4f0', t, p.ph, 'crate'); if (p.toadHat > t) drawToad(p.x, p.y - 50 * U, 0.8 * U, t, 1, 1, 2); });
    }
    // kurbağalar
    const want = crowd;
    while (fieldToads.length < want) {
      const sx = scientists[0] ? scientists[0].x + 30 * U : W * 0.2;
      fieldToads.push({ x: sx + rnd(-30, 90) * U, y: gt + rnd(26, Math.max(40, (floor - gt) * 0.85)), tx: rnd(seaW + 20, W - (mobile || document.body.classList.contains('dock') ? 20 : 380)), ph: rnd(0, 6.28), hop: 0, s: rnd(0.9, 1.25), jump: 0 });
    }
    fieldToads.length = Math.max(0, want);
    const f = dt / 16.67;
    for (const td of fieldToads) {
      if (Math.abs(td.tx - td.x) < 4) td.tx = rnd(seaW + 20, W - (mobile || document.body.classList.contains('dock') ? 20 : 380));
      const talking = bubbles.some(bb => bb.obj && bb.obj._toad === td);
      if (!talking) td.x += Math.sign(td.tx - td.x) * 0.5 * U * f;
      td.hop = Math.max(0, Math.sin(t * 0.006 + td.ph * 3)) * 6 * U;
      if (!td.jump && Math.random() < 0.0016 * f) { td.jump = 1; td.jh = rnd(80, 140); }
      if (td.jump) { td.jump += 0.03 * f; if (td.jump > 2) td.jump = 0; }
      // böceğe yetişmeye çalışır ama kamışın tepesine hiç ulaşamaz
      const jy = td.jump ? Math.sin((td.jump - 1) * Math.PI) * (td.super > t ? td.jh * U : Math.min((td.jh || 100) * U, sh * 0.62)) : 0;
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
    let minLon = 999, maxLon = -999, minLat = 999, maxLat = -999, west = null;
    for (const c of M.G.cells) if (st.d[c] > 0.03) {
      const lo = M.G.lon[c], la = M.G.lat[c];
      minLon = Math.min(minLon, lo); maxLon = Math.max(maxLon, lo); minLat = Math.min(minLat, la); maxLat = Math.max(maxLat, la);
      if (la > -22 && (!west || lo < west[0])) west = [lo, la];
    }
    if (st === game.st) game.bbox = maxLon > 0 ? { minLon, maxLon, minLat, maxLat, west } : null;
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
    const zs = 1 / Math.sqrt(cam.z); // yakınlaşınca simgeler aşırı büyümesin
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
    // yerli yırtıcılar
    ctx.textAlign = 'center';
    for (const s of SITES) {
      const [x, y] = P(s.lon, s.lat); s.x = x; s.y = y - 10 * U;
      const health = sitePred(st, s);
      // yerli yırtıcı: emoji değil, çizilmiş ve hareket eden bir hayvan
      const dead = health < 0.45, S = 1.05 * U * zs;
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x, y + 2 * S, 18 * S, 4 * S, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = dead ? 0.55 : 1;
      if (s.ic === '🦎') drawGoanna(x, y - 4 * S, S, 1, dead, t);
      else if (s.ic === '🐊') drawCroc(x, y - 3 * S, S, dead, t);
      else if (s.ic === '🐍') drawSnake(x, y - 3 * S, S, dead, t);
      else drawQuoll(x - 4 * S, y + 2 * S, S, 1, t, null, dead);
      ctx.globalAlpha = 1;
      if (dead) { ctx.fillStyle = rgb([192, 80, 58]); ctx.font = `${13 * S}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText('✕', x + 16 * S, y - 16 * S); }
    }
    drawFamily(st, t);
    // ön cephede zıplayan kurbağalar
    for (const sp of sprites) {
      const [x, y] = P(M.G.lon[sp.c] + sp.dx, M.G.lat[sp.c] + sp.dy);
      const hop = Math.max(0, Math.sin(t * 0.007 + sp.ph * 4)) * 5 * U;
      sp.x = x; sp.y = y - hop - 10 * U;
      drawToad(x, y - hop * zs, 0.75 * U * zs, t, sp.ph, Math.sin(sp.ph) > 0 ? -1 : 1);
    }
    // gönüllüler fenerle kurbağa topluyor
    for (const v of volunteers) {
      const [x, y] = P(M.G.lon[v.c] + 0.25, M.G.lat[v.c] - 0.25);
      v.x = x; v.y = y - 30 * U;
      drawPerson(x, y, 0.75 * U * zs, '#5b7f5a', t, v.ph, 'bucket');
      if (t > v.next) { v.next = t + rnd(1200, 2600); floats.push({ x: x + 10 * U, y: y - 30 * U, text: '−1', life: 1 }); if (Math.random() < 0.3) blip(700); }
    }
  }
  function sitePred(st, s) {
    let sum = 0, n = 0;
    for (const c of M.G.cells) { if (Math.abs(M.G.lon[c] - s.lon) < 1.2 && Math.abs(M.G.lat[c] - s.lat) < 1.2) { sum += st.pred[c]; n++; } }
    return n ? sum / n : 1;
  }



  // ---- harita karakterleri: goanna, kuzey kedisi, araba, bulut ----
  function drawGoanna(x, y, s, dir, dead, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); if (dead) ctx.rotate(Math.PI);
    ctx.fillStyle = '#7d7a3a';
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 5, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(15, -1, 6, 4, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#7d7a3a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const w = dead ? 0 : Math.sin(t * 0.02) * 3;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-24, 2 + w, -32, -2); ctx.stroke();
    ctx.lineWidth = 2; [[-6, 1], [6, 1]].forEach(([lx, k]) => { ctx.beginPath(); ctx.moveTo(lx, 3); ctx.lineTo(lx + w, 8); ctx.moveTo(lx, -3); ctx.lineTo(lx - w, -8); ctx.stroke(); });
    ctx.fillStyle = '#e8dcb0'; [-8, -2, 4].forEach(sx => { ctx.beginPath(); ctx.arc(sx, -1, 1.2, 0, 6.283); ctx.fill(); });
    ctx.fillStyle = rgb(INK); ctx.beginPath(); ctx.arc(17, -2.5, 1.2, 0, 6.283); ctx.fill();
    if (!dead && Math.sin(t * 0.012) > 0.7) { ctx.strokeStyle = '#d96a6a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(21, -1); ctx.lineTo(26, -1); ctx.moveTo(26, -1); ctx.lineTo(28, -3); ctx.moveTo(26, -1); ctx.lineTo(28, 1); ctx.stroke(); }
    ctx.restore();
  }
  function drawQuoll(x, y, s, dir, t, mood, dead) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); if (dead) { ctx.rotate(Math.PI / 2); ctx.translate(-6, -6); }
    ctx.fillStyle = '#9a6a3c'; ctx.beginPath(); ctx.ellipse(0, -6, 11, 7, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -10, 5.5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -15, 2, 0, 6.283); ctx.arc(13, -15, 2, 0, 6.283); ctx.fill();
    const wag = dead ? 0 : Math.sin(t * 0.008) * 4;
    ctx.strokeStyle = '#9a6a3c'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-20, -10 + wag, -22, -2 + wag); ctx.stroke();
    ctx.fillStyle = '#f3ecd8'; [[-5, -8], [0, -4], [4, -9], [-3, -11]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 1.3, 0, 6.283); ctx.fill(); });
    ctx.fillStyle = rgb(INK); ctx.beginPath(); ctx.arc(12, -11, 1.1, 0, 6.283); ctx.fill();
    if (mood === 'bleh') { ctx.fillStyle = '#d96a6a'; ctx.fillRect(15, -9, 4, 2); }
    ctx.restore();
  }

  function drawCroc(x, y, s, dead, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (dead) ctx.rotate(Math.PI);
    const jaw = dead ? 0 : Math.max(0, Math.sin(t * 0.004)) * 0.35;
    ctx.fillStyle = '#5f7a3a';
    ctx.beginPath(); ctx.ellipse(-2, 0, 16, 5, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16, -1); ctx.lineTo(-30, 1); ctx.lineTo(-16, 3); ctx.fill(); // kuyruk
    ctx.save(); ctx.translate(12, -1); ctx.rotate(-jaw); ctx.fillRect(0, -3, 14, 3); ctx.restore(); // üst çene
    ctx.fillRect(12, 0, 14, 3); // alt çene
    ctx.fillStyle = '#f3ecd8'; if (jaw > 0.05) for (let k = 0; k < 4; k++) ctx.fillRect(14 + k * 3, -1, 1.2, 1.6);
    ctx.fillStyle = '#4a6230'; [-8, -2, 4].forEach(bx => { ctx.beginPath(); ctx.arc(bx, -4, 1.6, 0, 6.283); ctx.fill(); });
    ctx.fillStyle = rgb(INK); ctx.beginPath(); ctx.arc(11, -4, 1.2, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function drawSnake(x, y, s, dead, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#3d3a32'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) { const px = -18 + k * 3, py = dead ? 0 : Math.sin(k * 0.8 + t * 0.006) * 4; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.strokeStyle = '#c0503a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 1); ctx.lineTo(10, 1); ctx.stroke(); // kırmızı karın çizgisi
    const hy = dead ? 0 : Math.sin(12 * 0.8 + t * 0.006) * 4;
    ctx.fillStyle = '#3d3a32'; ctx.beginPath(); ctx.ellipse(19, hy, 4.5, 3.4, 0, 0, 6.283); ctx.fill();
    if (!dead && Math.sin(t * 0.01) > 0.6) { ctx.strokeStyle = '#c0503a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(23, hy); ctx.lineTo(27, hy - 1); ctx.moveTo(27, hy - 1); ctx.lineTo(29, hy - 3); ctx.moveTo(27, hy - 1); ctx.lineTo(29, hy + 1); ctx.stroke(); }
    ctx.fillStyle = '#f3ecd8'; ctx.beginPath(); ctx.arc(20, hy - 1, 1, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  // Kakadu'da bir kuzey kedisi ailesi: kurbağa gelince anne ya yer ve kaybolur ya da (eğitimliyse) yemez
  const family = { lastSay: 0 };
  function drawFamily(st, t) {
    const site = SITES[0]; if (!site.x) return;
    const zs = 1 / Math.sqrt(cam.z), s = 0.9 * U * zs, x = site.x + 26 * U * zs, y = site.y + 26 * U * zs;
    const invaded = sitePred(st, site) < 0.75, trained = st.p.teach >= 0.25;
    if (mode === 'game' && invaded && !trained) family.lost = true;
    const momGone = mode === 'game' ? !!family.lost : invaded && !trained;
    if (!momGone) drawQuoll(x, y, s, -1, t, invaded && trained ? 'bleh' : null);
    drawQuoll(x + 16 * s, y + 6 * s, s * 0.55, -1, t); drawQuoll(x + 26 * s, y + 4 * s, s * 0.5, 1, t);
    family.x = x; family.y = y - 18 * s;
    if (mode === 'game' && invaded && t - family.lastSay > 20000 && !bubbles.length && game.state === 'play') {
      family.lastSay = t;
      say(family, momGone ? pick(['Anne? Neredesin?', 'Annem o kurbağayı\nyedi ve...']) : pick(['Iyy! Bu kurbağayı\nasla yemem!', 'Öğrendik:\nkurbağa yok!']));
    }
  }

  // ---- mizahi küçük sahneler (tarla ve harita) ----
  const gags = [];
  let nextGag = 0;
  const ROUTE = [[146.8, -19.3], [143.5, -20.5], [139.5, -20.7], [134.2, -19.6], [132.3, -14.5]];
  function gagTick(t) {
    if (mode !== 'game' || game.state !== 'play' || game.paused || game.reading || game.noToads || !game.released) return;
    if (!nextGag) nextGag = t + 9000;
    if (t < nextGag || gags.length) return;
    nextGag = t + rnd(16000, 26000);
    const opts = [];
    if (game.phase === 'field') { if (scientists.length) opts.push('toadhat'); if (fieldToads.length) opts.push('jumpfail', 'jumpfail'); }
    else {
      opts.push('truck', 'chorus', 'goanna', 'goanna', 'parade', 'rain', 'farmer');
      if (game.st.year >= 1985) opts.push('legs', 'legs');
      if (volunteers.length) opts.push('volunteer');
      if (game.st.p.fence > 0) opts.push('fence', 'fence');
    }
    if (!opts.length) return;
    const kind = pick(opts);
    if (kind === 'toadhat') { const p = pick(scientists); p.toadHat = t + 6500; say({ get x() { return p.x; }, get y() { return p.y - 70 * U; } }, pick(['Kafamda bir şey\nmi var?', 'Bu deney planda\nyoktu...'])); }
    if (kind === 'jumpfail') {
      const td = pick(fieldToads); td.jump = 1;
      say({ get x() { return td.sx; }, get y() { return td.sy - 14 * U; } }, pick(['Az kaldı!..\nDeğil.', 'Böcek, gel aşağı\nkonuşalım!']));
      const b = pick(beetles); setTimeout(() => { if (b && b.x !== undefined) say({ get x() { return b.x; }, get y() { return b.y; } }, pick(['Hah! Yine ıskaladı.', 'Ben buradayım,\nyukarıda!'])); }, 3200);
    }
    if (kind === 'truck') gags.push({ kind, t0: t, dur: 11000 });
    if (kind === 'chorus' && sprites.length) { gags.push({ kind, t0: t, dur: 6000 }); const sp = pick(sprites); say(sp, pick(['Gece konseri!\nVrrrrr!', 'Hep bir ağızdan:\nVRRRR!'])); trill(); }
    if (['goanna', 'legs', 'parade', 'rain', 'farmer', 'fence'].includes(kind)) {
      const sp = sprites.length ? pick(sprites) : null;
      const anchor = kind === 'farmer' ? { lon: 146.2, lat: -18.6 } : kind === 'parade' ? pick([{ lon: 130.85, lat: -12.6 }, { lon: 152.6, lat: -27.3 }, { lon: 145.8, lat: -17.0 }])
        : kind === 'rain' ? { lon: game.bbox && game.bbox.west ? game.bbox.west[0] + 2 : 140, lat: -14 } : sp ? { lon: M.G.lon[sp.c], lat: M.G.lat[sp.c] } : { lon: 140, lat: -18 };
      if (kind === 'fence') { const dams = M.G.cells.filter(c => game.st.fenced[c]); if (dams.length) { const c = pick(dams); anchor.lon = M.G.lon[c]; anchor.lat = M.G.lat[c]; } }
      gags.push({ kind, t0: t, dur: kind === 'rain' ? 9000 : 8000, ...anchor, trained: game.st.p.teach >= 0.25 });
    }
    if (kind === 'volunteer') { const v = pick(volunteers); say(v, pick(['Bu gece bin kurbağa\ntopladık... yarın iki bin!', 'Kovam doldu,\nkurbağa bitmedi.'])); }
  }
  function drawGagsMap(t) {
    for (let i = gags.length - 1; i >= 0; i--) {
      const g = gags[i], p = (t - g.t0) / g.dur;
      if (p >= 1 || game.phase !== 'map') { gags.splice(i, 1); continue; }
      if (g.kind === 'truck') {
        // kurbağalar araçlarla da taşındı: kamyon üstünde otostop
        const seg = Math.min(ROUTE.length - 2, Math.floor(p * (ROUTE.length - 1))), q = p * (ROUTE.length - 1) - seg;
        const lon = lerp(ROUTE[seg][0], ROUTE[seg + 1][0], q), lat = lerp(ROUTE[seg][1], ROUTE[seg + 1][1], q);
        const [x, y] = P(lon, lat), dir = ROUTE[seg + 1][0] < ROUTE[seg][0] ? -1 : 1, s = U;
        ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
        ctx.fillStyle = '#c0503a'; ctx.fillRect(-18, -16, 26, 14); ctx.fillStyle = '#4a5866'; ctx.fillRect(8, -12, 10, 10);
        ctx.fillStyle = '#9cc8d8'; ctx.fillRect(10, -10, 6, 4);
        ctx.fillStyle = rgb(INK); [-12, 2, 13].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -1, 3.2, 0, 6.283); ctx.fill(); });
        ctx.restore();
        drawToad(x - 4 * dir * s, y - 18 * s, 0.6 * U, t, 0, dir);
        g.x = x; g.y = y - 30 * U;
        if (!g.said && p > 0.08) { g.said = 1; say(g, pick(['Batıya bedava\nyolculuk!', 'Otostop çekmek\nyürümekten iyi!'])); }
      }
      if (['goanna', 'legs', 'parade', 'rain', 'farmer', 'fence'].includes(g.kind)) {
        const [ax, ay] = P(g.lon, g.lat), zs = 1 / Math.sqrt(cam.z), S = U * zs;
        g.x = ax; g.y = ay - 34 * S;
        if (g.kind === 'goanna') {
          // goanna kurbağaya yaklaşır: eğitimliyse vazgeçer, değilse zehirlenir
          const tx = ax + 4 * S, gx = lerp(ax - 60 * S, tx - 14 * S, Math.min(1, p * 2.2));
          const ate = !g.trained && p > 0.5, away = g.trained && p > 0.5;
          if (!ate) drawToad(tx, ay, 0.7 * S, t, 0, -1);
          drawGoanna(away ? lerp(gx, gx - 70 * S, (p - 0.5) * 2) : gx, ay - 2 * S, 0.9 * S, away ? -1 : 1, ate && p > 0.62, t);
          if (p > 0.5 && !g.said) { g.said = 1; say(g, g.trained ? pick(['Iyy! Tadı berbat,\nyemem!', 'Bu kurbağa?\nAsla!']) : pick(['Bu kurbağa...\nzehirliymiş.', 'Ah! Midem...'])); }
        }
        if (g.kind === 'legs') {
          drawToad(ax, ay, 0.8 * S, t, 0, 1);
          drawPerson(ax + 22 * S, ay + 2 * S, 0.8 * S, '#f4f4f0', t, 0);
          ctx.strokeStyle = '#d9b45a'; ctx.lineWidth = 3 * S; ctx.beginPath(); ctx.moveTo(ax - 10 * S, ay + 4 * S); ctx.lineTo(ax + 12 * S, ay + 4 * S); ctx.stroke();
          if (!g.said && p > 0.15) { g.said = 1; say(g, pick(['Öndekilerin bacakları\ndaha uzun!', 'Öndekiler en uzun\nbacaklılar. Evrim!'])); }
        }
        if (g.kind === 'parade') {
          ctx.strokeStyle = 'rgba(80,80,80,.7)'; ctx.lineWidth = 6 * S; ctx.beginPath(); ctx.moveTo(ax - 50 * S, ay); ctx.lineTo(ax + 50 * S, ay); ctx.stroke();
          ctx.setLineDash([5 * S, 6 * S]); ctx.strokeStyle = '#f3ecd8'; ctx.lineWidth = 1.2 * S; ctx.beginPath(); ctx.moveTo(ax - 50 * S, ay); ctx.lineTo(ax + 50 * S, ay); ctx.stroke(); ctx.setLineDash([]);
          for (let k = 0; k < 7; k++) { const q = ((p * 1.4 + k * 0.12) % 1); drawToad(ax - 6 * S + k * 2 * S, lerp(ay + 22 * S, ay - 22 * S, q) - Math.abs(Math.sin(t * 0.01 + k)) * 3 * S, 0.5 * S, t, k, 1); }
          ctx.fillStyle = '#5b8fc0'; ctx.fillRect(ax - 46 * S, ay - 7 * S, 20 * S, 8 * S); ctx.fillStyle = '#9cc8d8'; ctx.fillRect(ax - 40 * S, ay - 11 * S, 10 * S, 5 * S);
          if (!g.said && p > 0.2) { g.said = 1; say({ x: ax - 36 * S, y: ay - 16 * S }, pick(['Kurbağa trafiği!\nBekliyoruz...', 'Her akşam aynı\ngeçit töreni!'])); }
        }
        if (g.kind === 'rain') {
          const cx = ax + Math.sin(p * 3) * 30 * S, cy = ay - 40 * S;
          ctx.fillStyle = 'rgba(120,130,140,.85)'; [[0, 0, 16], [14, 3, 12], [-14, 4, 11]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx + dx * S, cy + dy * S, r * S, 0, 6.283); ctx.fill(); });
          ctx.strokeStyle = 'rgba(90,140,200,.8)'; ctx.lineWidth = 1.4;
          for (let k = 0; k < 9; k++) { const rx = cx + (k - 4) * 4 * S, ry = cy + 12 * S + ((t * 0.12 + k * 7) % (22 * S)); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 1, ry + 4 * S); ctx.stroke(); }
          if (Math.random() < 0.08) floats.push({ x: cx + rnd(-16, 16) * S, y: ay + 6 * S, text: '•', life: 0.9 });
          g.y = cy - 10 * S;
          if (!g.said && p > 0.2) { g.said = 1; say(g, pick(['Yağmur!\nYumurta zamanı!', 'Muson geldi,\nhavuzlar doldu!'])); }
        }
        if (g.kind === 'farmer') {
          drawPerson(ax, ay, 0.9 * S, '#4f6f8f', t, 0);
          drawBeetle(ax + 16 * S, ay - 20 * S, 0.8 * S, t, 0);
          if (!g.said && p > 0.15) { g.said = 1; say(g, pick(['Böcek hâlâ kamışımda!\nKurbağalar nerede?', 'Kurbağa geldi,\nböcek gitmedi.'])); }
        }
        if (g.kind === 'fence') {
          drawPerson(ax - 10 * S, ay, 0.8 * S, '#8a5a3a', t, 0);
          const a = Math.sin(t * 0.03); ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.moveTo(ax - 4 * S, ay - 18 * S); ctx.lineTo(ax + 4 * S, ay - 18 * S - a * 8 * S); ctx.stroke();
          if (a > 0.95) floats.push({ x: ax + 8 * S, y: ay - 26 * S, text: 'tak', life: 0.8 });
          if (!g.said && p > 0.2) { g.said = 1; say(g, pick(['Bu gölete kurbağa\ngiremez artık!', 'Çölü kurumuş tutalım,\nkurbağa geçemesin.'])); }
        }
      }
      if (g.kind === 'chorus' && Math.random() < 0.15 && sprites.length) { const sp = pick(sprites); floats.push({ x: sp.x, y: sp.y - 10 * U, text: pick(['♪', 'vrr']), life: 1 }); }
    }
  }

  // =====================================================================
  // SLAYTLAR
  // =====================================================================
  const slides = [...document.querySelectorAll('.slide')];
  let cur = 0, maxSeen = 0, mode = 'title';
  // bölüm bir kez bitirildiyse (bu tarayıcıda) bütün slaytlar seçilebilir
  const DONE_KEY = 'bny-bitti-kurbaga';
  const wasDone = (() => { try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; } })();
  if (wasDone) maxSeen = slides.length - 1;
  const slideOf = m => slides.findIndex(x => x.dataset.mode === m);
  const dotsEl = $('dots');
  slides.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', `Adım ${i + 1}`); b.onclick = () => { if (i <= maxSeen) goTo(i); }; dotsEl.appendChild(b); });
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
    if (mode === 'sandbox') sb.running = false;
    slides[cur].classList.remove('active');
    cur = i; maxSeen = Math.max(maxSeen, i);
    slides[cur].classList.add('active'); slides[cur].scrollTop = 0;
    mode = slides[cur].dataset.mode; landKey = '';
    paintDots();
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-kurbaga', 'Başladı: Kurtarıcı Kurbağa'); enterGame(); }
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
    // hikâye kartları zamanı zaten durdurur; seçilen hız korunur
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
      st: M.newState(), frac: 0, bbox: null, focus: null, speed: 1, paused: false, reading: 0, fired: new Set(), hist: [], fade: 0, unlocked: {},
    });
    Object.values(sliders).forEach(s => { s.value = 0; s.disabled = true; });
    document.querySelectorAll('.coach').forEach(uncoach);
    ['collect', 'teach', 'fence'].forEach(k => { $('w-' + k).classList.add('locked'); $('o-' + k).textContent = '🔒 ' + UNLOCK[k] + "'de açılır"; });
    $('g-pause').textContent = '❚❚ Durdur'; if (typeof setSpeed === 'function') setSpeed(1);
    $('modal').hidden = true; $('milestone').hidden = true; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {}; family.lost = false;
    fieldToads.length = 0; scientists.length = 0; bubbles.length = 0; sprites = []; volunteers = []; gags.length = 0; nextGag = 0;
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
      if (game.unlocked[k]) $('o-' + k).textContent = v + ' puan';
      const seg = document.querySelector('.bbar .b-' + k); if (seg) { seg.style.width = v + '%'; seg.textContent = v >= 14 ? { collect: '🪣', teach: '🎓', fence: '🚧' }[k] : ''; }
    });
    $('g-budget').textContent = `${100 - used} puan boşta`;
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

  // konuşan karakterin portresi (kartın solunda)
  function portrait(kind) {
    const c = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 120, h = 150;
    c.width = w * dpr; c.height = h * dpr; c.className = 'portrait';
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(w / 2, h - 6);
    const coat = kind === 'gov' ? '#4a5866' : kind === 'froggatt' ? '#6b5a44' : '#f4f4f0';
    g.fillStyle = coat; g.beginPath(); g.roundRect ? g.roundRect(-34, -70, 68, 72, 22) : g.rect(-34, -70, 68, 72); g.fill();
    g.strokeStyle = 'rgba(43,58,46,.35)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -96, 30, 0, 6.283); g.fill();
    g.fillStyle = rgb(INK); g.beginPath(); g.arc(-10, -98, 3.4, 0, 6.283); g.arc(10, -98, 3.4, 0, 6.283); g.fill();
    g.strokeStyle = rgb(INK); g.lineWidth = 3; g.beginPath(); g.arc(0, -88, 10, 0.25, 2.9); g.stroke();
    if (kind === 'sci') { g.lineWidth = 2.4; g.beginPath(); g.arc(-10, -98, 8, 0, 6.283); g.arc(10, -98, 8, 0, 6.283); g.moveTo(-2, -98); g.lineTo(2, -98); g.stroke(); }
    if (kind === 'froggatt') { g.fillStyle = '#2b3a2e'; g.beginPath(); g.ellipse(0, -122, 34, 7, 0, 0, 6.283); g.fill(); g.fillRect(-20, -146, 40, 26); g.fillStyle = '#e8dcc0'; g.fillRect(-28, -10, 22, 8); }
    if (kind === 'gov') { g.fillStyle = '#2b3a2e'; g.beginPath(); g.ellipse(0, -124, 30, 8, 0, 0, 6.283); g.fill(); g.fillStyle = '#c0503a'; g.fillRect(-4, -60, 8, 30); }
    return c;
  }
  function choice(from, title, text, opts, who) {
    game.state = 'choice';
    const m = $('modal');
    m.innerHTML = who
      ? `<div class="card talk"><div class="who"></div><div><div class="from">${from}</div><h2>${title}</h2><p class="speech">${text}</p><div class="opts"></div></div></div>`
      : `<div class="card"><div class="from">${from}</div><h2>${title}</h2><p>${text}</p><div class="opts"></div></div>`;
    if (who) m.querySelector('.who').appendChild(portrait(who));
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
    game.started = true; game.state = 'mission';
    const go = () => {
    game.state = 'intro'; ship.t0 = 0; ship.docked = false;
    // giriş oyun içi akıştan farklı: kart sırasını beklemez, gemi hemen gelir
    setTimeout(() => { if (mode === 'game') showToast('🇦🇺', 'Queensland, Avustralya · 1935', 'Şeker kamışını <b>kamış böceği</b> kemiriyor. Çözüm Hawaii\'den gemiyle geliyor: <b>102 kamış kurbağası</b>.', '', { img: TOAD_IMG, ms: 9000 }); }, 300);
    ship.onDock = () => {
      if (mode !== 'game' || game.state !== 'intro') return;
      say(ship, 'Düüüt! Hawaii\'den\n102 kurbağa geldi!');
      setTimeout(() => { if (mode === 'game' && game.state === 'intro') askRelease(); }, 1600);
    };
    };
    if (window.Mission && !window.__mSeen && (window.__mSeen = 1)) window.Mission.show($('modal'), MISSION, go); else go();
  }

  function askRelease() {
    choice('Gordonvale deneme istasyonu · bilim insanı', 'Yavrular hazır', '"Laboratuvarda binlerce yavru kurbağa büyüdü. Tarlalara salalım mı?"', [
      { label: 'Salın!', sub: 'Doğal, ucuz, hızlı bir çözüm', fn: doRelease },
      { label: 'Önce araştıralım', sub: 'Kurbağa bu böceği gerçekten yer mi?', fn: () => {
        (window.Badges ? window.Badges.award : () => {})('kurbaga-bilim');
        game.refused = 1;
        setTimeout(() => choice('Böcek bilimci Walter Froggatt', 'Bir uyarı', '"Kurbağa böceği değil, önüne gelen her şeyi yer. Salarsak onları geri toplayamayız."', [
          { label: 'Anladım →', sub: 'Peki şimdi ne olacak?', fn: () => setTimeout(() => choice('Hükümet yetkilisi', 'Şeker üreticileri bastırıyor', '"Böcekler kamışı yemeye devam ediyor. Yasağı kaldırmamız isteniyor. Kararın?"', [
            { label: 'Peki, salın', sub: 'Baskıya dayanamadın', fn: doRelease },
            { label: 'Hayır, kurbağa yok', sub: 'Böceği başka bir yolla çöz', fn: noRelease },
          ], 'gov'), 400) },
        ], 'froggatt'), 300);
      } },
    ], 'sci');
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
    // yayılma hızlandıktan sonra (1975+) yıllar daha yavaş aksın: oyuncu cepheyi takip edebilsin
    let ms = game.phase === 'field' ? 6500 : y < 1975 ? 1050 : 2300;
    if (game.noToads) ms = 900;
    // kart okunurken zaman yavaşlar; yapılacak bir şey yokken hızlanır
    ms *= ($('toasts').querySelector('.toast:not(.out)') ? 1.5 : toastQueue.length ? 0.95 : 0.53) * 1.08;
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
      if (y === 1936) toast('🐸', 'Tarla gözlemi', 'Kurbağalar tarlada. Ama böcekler kamışın tepesinde, larvaları toprağın altında. Kurbağalar ikisine de ulaşamıyor.', 'warn');
      if (y === 1937) toast('🥚', 'Biyoloji notu', 'Bir dişi kurbağa bir seferde <b>30 bine kadar</b> yumurta bırakabiliyor.', '');
      if (y === 1938) toast('🍽️', 'Tarla gözlemi', 'Kurbağalar böcek yerine önlerine çıkan her şeyi yiyor: başka böcekler, kurbağalar, hatta küçük hayvanlar.', 'warn');
      if (y >= 1939) toMap();
      updatePanel(); return;
    }
    if (y === 1947) toast('🧪', 'Kamış böceği', 'Böcek sonunda kimyasal ilaçlarla kontrol altına alındı. Kurbağalarla değil. Kurbağalar ise kaldı.', 'warn');
    if (y === 1990) toast('🦵', 'Bilim insanları', 'Öndeki kurbağaların bacakları uzuyor! En hızlılar öne geçip birbirleriyle çiftleşiyor. Cephe her yıl hızlanıyor.', 'warn');
    if (y === 2020) toast('🐍', 'Biraz umut', 'Bazı yılanlar ve kuşlar kurbağadan kaçınmayı ya da onu zehirsiz yerinden yemeyi öğrendi. Ama bu onlarca yıl sürüyor.', 'good');
    for (const k of ['collect', 'teach', 'fence']) if (!game.unlocked[k] && y >= UNLOCK[k]) {
      unlock(k, k === 'collect' ? 'Gönüllüler geceleri fenerle kurbağa topluyor. Bütçenden pay ayır; ön cephede yayılmayı yavaşlatır.'
        : k === 'teach' ? 'Avcılara kusturucu, küçük bir kurbağa parçası yedir; tadından tiksinip bir daha dokunmasınlar. Bu yöntem 2010\'larda gerçekten denendi.'
        : 'Çöllerde kurbağalar çiftlik göletlerine muhtaç. Göletleri çitle, çölün içinden geçen yolu kes.');
      break;
    }
    for (const site of SITES) {
      if (site.hit) continue;
      if (sitePred(st, site) < 0.75) {
        site.hit = true;
        if (!game.focus || performance.now() > game.focus.until) focus(site.lon, site.lat, 2.2, 4200);
        say(site, st.p.teach >= 0.25 ? 'Iyy! Bu kurbağanın tadı\nberbat. Bir daha asla!' : 'Bu da ne? Lezzetli\ngörünüyor...');
        once('site-' + site.name, () => toast(site.ic, site.name, st.p.teach >= 0.25 ? 'Eğitilmiş yırtıcılar kurbağalardan uzak duruyor. Kayıplar beklenenden az.' : 'Kurbağayı yiyen yırtıcılar zehirlenip ölüyor. Bazı bölgelerde sayıları %90\'dan fazla azalabiliyor.', st.p.teach >= 0.25 ? 'good' : 'bad'));
      }
    }
    const MS = [
      ['nsw', 'Yeni Güney Galler', 'Kurbağalar güneyde Yeni Güney Galler\'e ulaştı.', null],
      ['nt', 'Kuzey Bölgesi', 'Kurbağalar Kuzey Bölgesi sınırını geçti.', 1984],
      ['darwin', 'Darwin', 'Kurbağalar Kuzey Bölgesi\'nin başkenti Darwin\'e ulaştı.', 2005],
      ['wa', 'Batı Avustralya', 'Kurbağalar Batı Avustralya\'ya girdi. Önlerinde Kimberley var.', 2009],
    ];
    const FOCUS = { nsw: [153, -28.6], nt: [137.6, -17.5], darwin: [130.85, -12.45], wa: [128.6, -15.8] };
    for (const [k, title, text, hy] of MS) if (st.firsts[k] && !game.fired.has('ms-' + k)) { game.fired.add('ms-' + k); focus(...FOCUS[k], 2.4, 6500); milestone(st.firsts[k], title, text, hy); break; }
    if (y % 2 === 0) refreshFront(st);
    if (y >= 2025) return endGame();
    updatePanel();
  }

  function toMap() {
    cam.init = false; game.focus = null;
    game.phase = 'map'; game.fade = 1; landKey = '';
    refreshFront(game.st);
    $('g-phase').textContent = 'Avustralya';
    if (!game.noToads) toast('🗺️', 'Kurbağalar tarlalardan taştı', 'Artık tarlaya bakmak yetmez. Bütün kıtaya bakalım. Kahverengi alan kurbağaların yayıldığı yer.', '', { pause: true });
  }

  function milestone(year, title, text, histYear) {
    game.state = 'milestone'; if (game.speed > 1) setSpeed(1);
    const el = $('milestone');
    el.innerHTML = `<div><div class="k">${title}</div><div class="n">${year}</div><div class="s">${text}${histYear ? `<br>Tarihte: ${histYear}` : ''}</div><button class="hbtn sm go-h">Devam →</button></div>`;
    el.hidden = false; trill();
    let done = false;
    const next = () => { if (done) return; done = true; el.hidden = true; game.state = 'play'; };
    el.onpointerdown = next; // yalnız dokununca geçer
  }

  function awardEnd() {
    const A = (window.Badges ? window.Badges.award : () => {}), last = game.hist[game.hist.length - 1];
    if (game.noToads) { A('kurbaga-yok'); return; }
    if (!last || game.st.year < 2025) return;
    if (last.pred >= 0.45) A('kurbaga-hedef');
    if (!family.lost) A('kurbaga-kakadu');
  }
  function endGame() {
    if (game.state !== 'end') awardEnd();
    game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-kurbaga', 'Bitirdi: Kurtarıcı Kurbağa');
    maxSeen = slides.length - 1; paintDots(); replayNav();
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
    $('v-pred').textContent = '%' + Math.round(s.pred * 100); $('v-pred').style.color = s.pred < 0.45 ? 'var(--danger)' : 'var(--green)';
    $('m-pred').style.background = s.pred < 0.45 ? 'var(--danger)' : 'var(--green)';
  }

  // =====================================================================
  // SONUÇ
  // =====================================================================
  function renderResult() {
    const last = game.hist[game.hist.length - 1];
    if (!last || game.state !== 'end') { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    let title, text;
    if (game.noToads) { title = 'Kurbağasız Avustralya'; text = 'Uyarıyı dinledin. Kamış böceği birkaç yıl sonra kimyasallarla kontrol altına alındı; kurbağaya hiç gerek yokmuş. Kuzey kedileri, goannalar ve timsahlar bu kararı hiç bilmeyecek.'; }
    else if (last.pred >= 0.45 || last.areaPct <= H_END.areaPct * 0.8) { title = 'Fark yarattın'; text = 'Kurbağaları durduramadın, kimse durduramazdı. Ama doğru araçlara bütçe ayırarak yerli yırtıcıların çoğunu korudun. Salmak bir günde oldu, telafisi bir asır sürüyor.'; }
    else { title = 'Kıtayı kurbağalara verdin'; text = 'Tarih tekrarlandı: 102 kurbağa, 200 milyonu aşan bir ordu oldu. Kamış böceği ise hiç umursamadı.'; }
    const pct = v => `%${Math.round(v * 100)}`;
    $('result').innerHTML = `
      <div class="kicker">2025 · 90 yıl sonra</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>`; }).join('')}</div>` : ''}
      <div class="rgrid">
        <div><div class="y">Yayıldığı alan</div><div class="v">%${last.areaPct.toFixed(0)}</div><div class="h">tarihte: %${H_END.areaPct.toFixed(0)}</div></div>
        <div><div class="y">Kurbağa</div><div class="v">${game.noToads ? '0' : fmtToads(last.toads)}</div><div class="h">tarihte: ${fmtToads(H_END.toads)}</div></div>
        <div><div class="y">Yerli yırtıcılar</div><div class="v" style="color:${last.pred >= 0.45 ? 'var(--green)' : 'var(--danger)'}">${pct(last.pred)}</div><div class="h">tarihte: ${pct(H_END.pred)}</div></div>
      </div>
      <canvas class="rchart" id="rchart"></canvas>
      <div class="legend"><span style="--c:#8a7a3a">Alan</span><span style="--c:#4f7a4a">Yerli yırtıcılar</span><span style="--c:#9aa59a">Tarihteki alan (kesikli)</span></div>
      <div class="rbtns"><button class="hbtn" id="r-again">↺ Tekrar oyna</button><button class="hbtn" id="r-next">Kendin dene →</button><a class="hbtn" href="../../#bolumler">☰ Tüm bölümler</a></div>`;
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
    toad: ['Böcek nerede? Yukarıda mı?\nO kadar zıplayamam.', 'Ben sadece böcek değil,\nher şeyi yerim!', 'Vrrrrr! Burası\nçok güzelmiş.'],
    beetle: ['Ben tepedeyim, larvalarım\ntoprağın altında. Bol şans!', 'Kurbağa mı? Hiç\nyukarı bakmıyor ki.'],
    sci: ['Kurbağa böceği yer.\nBasit biyoloji!', 'Hawaii\'de işe yaradı.\nGaliba.', 'Bu kurbağalar neden\nböceğe bakmıyor?'],
    ship: ['Düüüt! Hawaii\'den\n102 yolcu getirdim.', 'Dönüş biletleri\nalınmadı galiba...'],
    truck: ['Batıya bedava\nyolculuk!', 'Şoför fark etmedi\nbile!'],
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
    if (game.phase === 'field' && mode === 'game' && ship.x !== undefined) out.push([ship.x, ship.y, 'ship', ship]);
    gags.forEach(g => { if (g.kind === 'truck' && g.x !== undefined) out.push([g.x, g.y, 'truck', g]); });
    return out.filter(c => c[0] !== undefined);
  }
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};
  function talk(c) {
    const [x, y, kind, obj] = c;
    if (mode === 'game') {
      const A = (window.Badges ? window.Badges.award : () => {});
      if (kind === 'ship' && tapCount('ship') >= 3) { A('kurbaga-gemi'); say({ x, y }, 'Kaptan: "Bir dahakine\nonları Hawaii\'de bırakın!"'); return; }
      if (kind === 'truck') A('kurbaga-otostop');
      if (kind === 'toad' && obj) {
        obj._taps = (performance.now() - (obj._tapT || 0) < 3000) ? (obj._taps || 0) + 1 : 1; obj._tapT = performance.now();
        if (obj._taps >= 2) { obj.super = performance.now() + 2600; obj.jump = 1; obj.jh = 900; A('kurbaga-bacak'); say({ get x() { return obj.sx; }, get y() { return Math.max(70, obj.sy); } }, 'Süper zıplayış!\nBen cephenin\nen hızlısıyım!'); trill(); return; }
      }
    }
    const st = mode === 'sandbox' ? sb.st : game.st;
    let text = kind === 'site' ? (sitePred(st, obj) < 0.45 ? (st.p.teach >= 0.25 ? 'Kurbağaya dokunmamayı\nöğrendik. Zor oldu.' : 'Burada eskiden\nçok kalabalıktık...') : 'Bu da ne? Lezzetli\ngörünüyor...') : pick(LINES[kind]);
    say({ _toad: kind === 'toad' ? obj : null, get x() { return kind === 'beetle' ? obj.x : kind === 'toad' && obj ? obj.sx : x; }, get y() { return kind === 'toad' && obj ? obj.sy - 10 * U : y; } }, text);
    if (kind === 'toad' || kind === 'mtoad') trill(); else blip(kind === 'beetle' ? 1400 : 600);
  }
  cv.addEventListener('pointerdown', e => {
    initAudio();
    if (mode !== 'game' && mode !== 'sandbox' && mode !== 'title') return;
    const cs = candidates(); let best = null, bd = Infinity; // en yakın karakter, mesafe sınırı yok
    const onMap = mode === 'sandbox' || mode === 'result' || (mode === 'game' && game.phase === 'map');
    const [px, py] = onMap ? toBase(e.clientX, e.clientY) : [e.clientX, e.clientY];
    if (onMap && mode === 'game') {
      const [lon, lat] = unP(px, py);
      if (lon > 143.3 && lon < 149.2 && lat < -39.7 && lat > -44.2) {
        (window.Badges ? window.Badges.award : () => {})('kurbaga-tasmanya');
        say({ x: px, y: py }, 'Burada kurbağa yok!\nHava çok soğuk.'); return;
      }
    }
    for (const c of cs) { const d = Math.hypot(c[0] - px, c[1] - py); if (d < bd) { bd = d; best = c; } }
    if (best) talk(best);
  });
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || game.paused || game.reading) return;
    if (!nextChat) nextChat = t + 8000;
    if (t < nextChat || bubbles.length || gags.length) return;
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
    if (showMap) {
      updateCam(st, now, dt);
      const [ccx, ccy] = camCenter();
      ctx.save(); ctx.translate(ccx, ccy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.fx, -cam.fy);
      drawMap(st, now, dt); if (mode === 'game') drawGagsMap(now);
      ctx.restore();
    }
    else {
      const crowd = mode === 'game' && game.released ? Math.min(70, 8 + Math.floor((game.st.year - 1935 + game.frac) * 20)) : mode === 'title' ? 6 : 0;
      drawField(now, dt, crowd);
    }
    if (game.fade > 0 && mode === 'game') { game.fade = Math.max(0, game.fade - dt / 900); ctx.fillStyle = `rgba(233,240,222,${game.fade})`; ctx.fillRect(0, 0, W, H); }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.life -= 0.015 * (dt / 16); f.y -= 0.4 * U * (dt / 16);
      if (f.life <= 0) { floats.splice(i, 1); continue; }
      const [fx, fy] = showMap ? toScreen(f.x, f.y) : [f.x, f.y];
      ctx.fillStyle = rgb(INK, f.life); ctx.font = `${18 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText(f.text, fx, fy);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bb = bubbles[i]; bb.life -= 0.0035 * (dt / 16);
      if (bb.obj) { bb.x = bb.obj.x; bb.y = bb.obj.y; }
      if (bb.life <= 0) { bubbles.splice(i, 1); continue; }
      if (showMap) { const [sx, sy] = toScreen(bb.x, bb.y); drawBubble({ ...bb, x: sx, y: sy }); } else drawBubble(bb);
    }
    ambientChat(now); gagTick(now);
    if (mode === 'game' && ++tick % 4 === 0) updatePanel();

    // arka plan: yerli yırtıcılar azaldıkça kırmızıya kayar
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
  if (wasDone) { paintDots(); replayNav(); }
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, sb, fieldToads, gags, cam, ship, family, P, toScreen, get mode() { return mode; }, gag: () => { nextGag = 1; }, go: m => { maxSeen = slides.length; goTo(slideOf(m)); } };
  requestAnimationFrame(frame);
})();
