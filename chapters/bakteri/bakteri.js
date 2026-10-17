// Bölüm 5 — Bakterilerin İntikamı (1945–2015)
(() => {
  'use strict';
  const MISSION = {
    title: 'Bakterilerin İntikamı · 1945',
    role: 'Kasabanın sağlık müdürüsün. Hastalar kapıya gelir, doktorlar reçete yazar.',
    control: '💊 <b class="inl">Reçete kolaylığı</b>: azsa gerçek hastalar ilaçsız kalır, çoksa nezleye de antibiyotik gider. Her yeni ilaç gelince <b class="inl">herkese ver</b> ya da <b class="inl">yedekte tut</b> kararı senin. 1960\'ta 🧼 hijyen ve aşı açılır.',
    goal: '2015\'e kadar tedavi başarısını yüksek tut: ilaçlar işe yaramaya devam etsin.',
    watch: 'Sağdaki mikroskopta yeşil bakteriler ilaca duyarlı, kırmızılar dirençli. Soldaki ilaç dolabında her ilacın ne kadar "yorulduğunu" gör.',
  };
  const M = window.BakteriModel;
  const $ = id => document.getElementById(id);
  const { clamp, smooth } = M;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, al = 1) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const pct = v => '%' + Math.round(v * 100);
  const nameOf = id => (M.DRUGS.find(d => d.id === id) || {}).name || id;

  const TOTAL = M.Y1 - M.Y0 + 1;
  const HISTORY = M.run(TOTAL, M.histP);
  const eraName = y => y < 1960 ? 'Mucize ilaç' : y < 1987 ? 'Yeni ilaç yarışı' : 'Yeni ilaç bulunamıyor';

  // =====================================================================
  // SES
  // =====================================================================
  let AC = null, master, noiseBuf, muted = /[?&](debug|hizli|sessiz)\b/.test(location.search) || (() => { try { return localStorage.getItem('bny-ses') === '0'; } catch (e) { return false; } })(); // test sırasında ya da oyuncu kapattıysa ses çıkmasın
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; const g = AC.createGain(); g.gain.value = 0.02;
      s.connect(f); f.connect(g); g.connect(master); s.start();
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
  const pop = () => tone(520, 260, 0.08, 0.025, 'sine');
  const wave = () => tone(300, 900, 0.5, 0.02, 'sine');
  const cluck = () => { tone(700, 500, 0.08, 0.03, 'square'); setTimeout(() => tone(760, 520, 0.08, 0.025, 'square'), 120); };
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
      L.gb = clamp((top - 6) / H, 0.4, 0.88); L.gt = Math.max(0.3, L.gb - (mobile ? 0.3 : 0.36));
      if (!document.body.classList.contains('dock') && !mobile) { L.gt = 0.55; L.gb = 1; L.x1 = (W - 366) / W; }
    }
    if (m === 'result' || m === 'facts' || m === 'lessons') L.gt = 0.8;
    if (m === 'sandbox') { if (mobile) { L.gt = 0.24; L.gb = 0.46; } else { L.gt = 0.55; L.x1 = (W - 380) / W; } }
    return L;
  }
  const lay = { gt: 0.62, gb: 1, x1: 1 };
  const PAL = {
    bgOk: [233, 240, 222], bgBad: [240, 222, 218],
    sky: [216, 232, 236], ground: [196, 214, 168], road: [214, 206, 186], ink: [43, 58, 46],
    clinic: [244, 238, 226], roof: [120, 150, 160], teal: [62, 150, 150],
    sens: [96, 170, 96], res: [200, 70, 60], lens: [250, 252, 246],
  };
  const vis = { succ: 1, best: 0.01, extra: 0, missed: 0, U: 0.3, bad: 0 };
  const target = { ...vis };
  const bubbles = [], floats = [], patients = [], bugs = [];
  const clouds = Array.from({ length: 3 }, () => ({ x: rnd(0, 1), y: rnd(0.08, 0.22), s: rnd(0.7, 1.2), v: rnd(0.000006, 0.000012) }));
  const lensBox = { x: 0, y: 0, r: 0 }, bread = { x: 0, y: 0 }, chicken = { x: 0, y: 0, dir: 1, ph: 0 }, doctor = { x: 0, y: 0 };
  const shelf = [];
  const dose = { t0: -1e9, k: 0, dur: 1400 };
  const tapCount = (key, win = 3500) => { const n = performance.now(); const c = tapCount.m[key] || { n: 0, t: 0 }; c.n = n - c.t < win ? c.n + 1 : 1; c.t = n; tapCount.m[key] = c; return c.n; };
  tapCount.m = {};
  const N_BUGS = 64;
  for (let i = 0; i < N_BUGS; i++) bugs.push({ a: rnd(0, 6.283), d: Math.sqrt(Math.random()) * 0.88, rot: rnd(0, 6.28), res: false, k: 1, die: 0, ph: rnd(0, 6) });

  function geo() {
    const x1 = lay.x1 * W, gt = lay.gt * H, gb = lay.gb * H, gh = gb - gt;
    return { x1, gt, gb, gh, door: x1 * 0.44, road: gt + gh * 0.62 };
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
  const at = (gx, gy) => ({ get x() { return gx(); }, get y() { return gy(); } });
  function tag(x, y, text, o = {}) {
    const fs = (o.fs || 13) * U;
    ctx.font = `${fs}px "Patrick Hand"`;
    const w = ctx.measureText(text).width + 12 * U, h = fs + 8 * U;
    let bx = clamp(x - w / 2, 4, lay.x1 * W - w - 4), by = y - h;
    if (window.SceneUtils && mode === 'game') ({ x: bx, y: by } = window.SceneUtils.avoidHud(bx, by, w, h));
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(43,58,46,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, h, h / 2) : ctx.rect(bx, by, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.color || rgb(PAL.ink); ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 6 * U, by + h / 2 + 1); ctx.textBaseline = 'alphabetic';
  }
  function person(x, y, s, o = {}) {
    const dir = o.dir || 1, st = o.step || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.beginPath(); ctx.ellipse(0, 1, 10, 2.6, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(-3 - st, 0); ctx.moveTo(2, -9); ctx.lineTo(3 + st, 0); ctx.stroke();
    ctx.fillStyle = o.shirt || '#6b8db5'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -27, 14, 19, 5) : ctx.rect(-7, -27, 14, 19); ctx.fill();
    ctx.fillStyle = o.skin || '#e9c49d'; ctx.beginPath(); ctx.arc(0, -33, 6.5, 0, 6.283); ctx.fill();
    if (o.hair) { ctx.fillStyle = o.hair; ctx.beginPath(); ctx.arc(0, -35, 7, Math.PI, 0); ctx.fill(); }
    if (o.scarf) { ctx.fillStyle = o.scarf; ctx.fillRect(-6, -28, 12, 3); }
    ctx.fillStyle = rgb(PAL.ink); ctx.beginPath(); ctx.arc(2.2, -34, 1.1, 0, 6.283); ctx.arc(-1.8, -34, 1.1, 0, 6.283); ctx.fill();
    if (o.sad) { ctx.strokeStyle = rgb(PAL.ink); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0.5, -29, 2.2, 3.6, 5.8); ctx.stroke(); }
    if (o.coat) { ctx.fillStyle = '#fbfaf6'; ctx.fillRect(-8, -27, 16, 21); ctx.fillStyle = PAL.teal ? rgb(PAL.teal) : '#3e9696'; ctx.fillRect(-1, -24, 2, 8); ctx.fillRect(-4, -21, 8, 2); }
    ctx.restore();
  }

  // mikroskop: yeşil duyarlı, kırmızı dirençli; her yıl bir ilaç dalgası geçer
  const mview = { want: 0, k: 0, until: 0, user: false };
  const setMicro = (on, ms) => { mview.want = on ? 1 : 0; mview.user = on && !ms; mview.until = ms ? performance.now() + ms : 0; };
  function drawLens(G, t, dt) {
    const r0 = Math.min(G.gh * (mobile ? 0.62 : 0.72), G.x1 * (mobile ? 0.2 : 0.17));
    const cx0 = G.x1 - r0 - (mobile ? 10 : 26) * U, cy0 = Math.max(r0 + 60 * U, G.gt - r0 * 0.15);
    // dokununca mercek ekranı kaplar
    const big = smooth(0, 1, mview.k), top = 150 * U, rB = Math.min((G.gb - top) * 0.4, G.x1 * 0.3);
    const r = Math.max(10, lerp(r0, rB, big)), cx = lerp(cx0, G.x1 / 2, big), cy = lerp(cy0, top + (G.gb - top) * 0.45, big);
    if (!(G.x1 > 50 && G.gh > 20)) return;
    if (big > 0.01) { ctx.fillStyle = `rgba(30,40,36,${0.55 * big})`; ctx.fillRect(0, 0, G.x1, H); }
    lensBox.x = cx; lensBox.y = cy; lensBox.r = r;
    // gövde
    ctx.fillStyle = '#5a6470'; ctx.beginPath(); ctx.moveTo(cx - r * 0.25, cy + r * 0.9); ctx.lineTo(cx + r * 0.25, cy + r * 0.9); ctx.lineTo(cx + r * 0.42, cy + r * 1.2); ctx.lineTo(cx - r * 0.42, cy + r * 1.2); ctx.fill();
    ctx.fillStyle = '#3a4250'; ctx.beginPath(); ctx.arc(cx, cy, r + 8 * U, 0, 6.283); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.clip();
    ctx.fillStyle = rgb(PAL.lens); ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(200,220,190,.35)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(cx + Math.cos(i * 1.7) * r * 0.5, cy + Math.sin(i * 2.3) * r * 0.5, r * 0.18, 0, 6.283); ctx.fill(); }
    // ilaç dalgası
    const dk = (t - dose.t0) / dose.dur;
    if (dk >= 0 && dk < 1) { const wx = cx - r + dk * r * 2.2; const gr = ctx.createLinearGradient(wx - r * 0.4, 0, wx, 0); gr.addColorStop(0, 'rgba(110,160,220,0)'); gr.addColorStop(1, 'rgba(110,160,220,.45)'); ctx.fillStyle = gr; ctx.fillRect(wx - r * 0.4, cy - r, r * 0.4, r * 2); }
    const bl = Math.max(5, r0 * 0.1) * (1 + 0.5 * big);
    for (const b of bugs) {
      b.ph += dt * 0.003; b.rot += Math.sin(b.ph) * 0.004 * dt / 16;
      const bx = cx + Math.cos(b.a) * b.d * r + Math.sin(b.ph * 0.7) * 2 * U, by = cy + Math.sin(b.a) * b.d * r + Math.cos(b.ph * 0.5) * 2 * U;
      // dalga geçerken duyarlı olan ölür
      if (b.die === 1 && dk >= 0 && dk < 1.2 && bx < cx - r + dk * r * 2.2) b.die = 2;
      if (b.die === 2) b.k = Math.max(0, b.k - dt / 500);
      if (b.die === 3) b.k = Math.min(1, b.k + dt / 600);
      if (b.k <= 0 && b.die === 2) respawn(b);
      if (b.k <= 0.01) continue;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(b.rot); ctx.scale(b.k, b.k);
      ctx.fillStyle = rgb(b.res ? PAL.res : PAL.sens, b.die === 2 ? 0.5 : 0.95);
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-bl, -bl * 0.42, bl * 2, bl * 0.84, bl * 0.42) : ctx.rect(-bl, -bl * 0.42, bl * 2, bl * 0.84); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-bl * 0.6, -bl * 0.2, bl * 0.5, bl * 0.12);
      ctx.restore();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3 * U; ctx.beginPath(); ctx.arc(cx, cy, r - 4 * U, 3.6, 4.6); ctx.stroke();
    const nres = bugs.filter(b => b.res && b.k > 0.3).length, nall = bugs.filter(b => b.k > 0.3).length || 1;
    tag(cx, cy + r + 30 * U, `🔬 ${frontName()}'e dirençli: %${Math.round(nres / nall * 100)}`, { fs: mobile ? 11 : 13, color: nres / nall > 0.4 ? '#a0402a' : undefined });
    if (dk >= 0 && dk < 1) tag(cx, cy - r - 8 * U, '💊 ilaç dalgası: yeşiller ölüyor', { fs: mobile ? 10 : 12 });
    if (big > 0.5) {
      tag(cx, cy + r + 56 * U, '🟢 ilaca duyarlı: ilaç öldürür · 🔴 dirençli: hayatta kalır, bölünür', { fs: mobile ? 11 : 14 });
      tag(cx, cy + r + 80 * U, '🔬 dokun: sahneye dön', { fs: 12 });
    } else tag(cx, cy - r - (dk >= 0 && dk < 1 ? 30 : 8) * U, '🔍 dokun: büyüt', { fs: mobile ? 10 : 11 });
  }
  // her yıl: duyarlıların bir kısmı ilaçla ölür; boşluklar dirençli oranına göre dolar
  // ölen yerine yenisi doğar: dirençliyse hayatta kalan bir dirençlinin hemen yanında (bölünme)
  function respawn(b) {
    b.res = Math.random() < (b.nextRes ?? 0); b.die = 3; b.k = 0.05;
    const par = b.res ? bugs.filter(o => o !== b && o.res && o.die !== 2 && o.k > 0.5) : [];
    if (par.length) { const p = pick(par); b.a = p.a + rnd(-0.12, 0.12); b.d = clamp(p.d + rnd(-0.06, 0.06), 0.05, 0.88); b.rot = p.rot + rnd(-0.4, 0.4); }
    else { b.a = rnd(0, 6.283); b.d = Math.sqrt(Math.random()) * 0.88; }
  }
  function doseYear(h, frontR, yearMs = 1400) {
    // önceki dalga bitmeden yeni yıl geldiyse bekleyen ölümler hemen işlenir (2×/4× hızda da doğru oran)
    bugs.forEach(b => { if (b.die === 1 || b.die === 2) respawn(b); });
    dose.dur = clamp(yearMs * 0.7, 250, 1400);
    const kill = Math.min(0.85, h.U * 1.2);
    const target = clamp(frontR);
    const sens = bugs.filter(b => !b.res && b.die !== 2);
    sens.forEach(b => { if (Math.random() < kill) b.die = 1; });
    // yeni gelenlerin dirençli olma olasılığı: son oran modelin oranına uysun
    const nRes = bugs.filter(b => b.res && b.die !== 1).length, dying = bugs.filter(b => b.die === 1).length;
    const want = Math.round(target * N_BUGS), need = Math.max(0, want - nRes);
    const q = dying ? clamp(need / dying) : 0;
    bugs.forEach(b => { if (b.die === 1) b.nextRes = q; });
    // dirençli fazlaysa (ilaç bırakıldı) bazı dirençliler yerini duyarlıya bırakır
    if (nRes > want + 2) bugs.filter(b => b.res).slice(0, nRes - want).forEach(b => { b.die = 2; b.nextRes = 0; });
    dose.t0 = performance.now(); if (h.U > 0.05) wave();
  }
  function resetBugs(frac = 0.01) { bugs.forEach(b => { b.res = Math.random() < frac; b.k = 1; b.die = 0; }); }

  function drawShelf(G) {
    // ilaç dolabı: her şişede kırmızı = direnç; kilit = yedekte
    const avail = curState().avail || [];
    const bw = (mobile ? 18 : 24) * U, gap = 7 * U, x0 = G.x1 * 0.03, y0 = G.gb - 34 * U;
    const w = Math.max(avail.length, 1) * (bw + gap) + gap;
    ctx.fillStyle = '#c9b48a'; ctx.fillRect(x0 - gap, y0 + 4 * U, w, 6 * U);
    ctx.fillStyle = '#8a7350'; ctx.fillRect(x0 - gap, y0 + 10 * U, 4 * U, 30 * U); ctx.fillRect(x0 - gap + w - 4 * U, y0 + 10 * U, 4 * U, 30 * U);
    shelf.length = 0;
    avail.forEach((id, i) => {
      const x = x0 + i * (bw + gap), y = y0 - bw * 1.5, r = (curState().r || {})[id] || 0;
      shelf.push({ id, x: x + bw / 2, y });
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.strokeStyle = rgb(PAL.ink, 0.6); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw, bw * 1.5, 4) : ctx.rect(x, y, bw, bw * 1.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgb(PAL.sens, 0.8); ctx.fillRect(x + 2, y + 2, bw - 4, (bw * 1.5 - 4) * (1 - r));
      ctx.fillStyle = rgb(PAL.res, 0.85); ctx.fillRect(x + 2, y + 2 + (bw * 1.5 - 4) * (1 - r), bw - 4, (bw * 1.5 - 4) * r);
      ctx.fillStyle = '#5a6470'; ctx.fillRect(x + bw * 0.25, y - 5 * U, bw * 0.5, 5 * U);
      if (curReserve()[id]) { ctx.font = `${12 * U}px sans-serif`; ctx.fillText('🔒', x + bw * 0.15, y + bw * 0.9); }
      ctx.fillStyle = rgb(PAL.ink); ctx.font = `${(mobile ? 8 : 10) * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillText(nameOf(id).slice(0, mobile ? 5 : 9), x + bw / 2, y0 + 22 * U); ctx.textAlign = 'left';
    });
    if (avail.length) tag(x0 + w / 2 - gap, y0 - bw * 1.5 - 8 * U, Object.keys(curReserve()).length ? '🧴 İlaç dolabı · kırmızı = direnç · 🔒 dokun: aç' : '🧴 İlaç dolabı · kırmızı = direnç', { fs: mobile ? 10 : 12 });
  }

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);
    const G = geo(), { x1, gt, gb, gh } = G;
    const sky = ctx.createLinearGradient(0, 0, 0, gt); sky.addColorStop(0, rgb(PAL.sky, 0.9)); sky.addColorStop(1, 'rgba(240,244,232,.5)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, x1, gt);
    for (const cl of clouds) { cl.x += cl.v * dt; if (cl.x > 1.15) cl.x = -0.15; const cx = cl.x * x1, cy = cl.y * H, s = 20 * U * cl.s; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(cx, cy, s, 0, 6.283); ctx.arc(cx + s * 1.1, cy + s * 0.2, s * 0.8, 0, 6.283); ctx.arc(cx - s * 1.1, cy + s * 0.25, s * 0.7, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = rgb(PAL.ground); ctx.fillRect(0, gt, x1, H - gt);
    ctx.fillStyle = rgb(PAL.road); ctx.fillRect(0, G.road - 8 * U, x1 * 0.62, 18 * U);
    // sağlık ocağı
    const cx0 = x1 * 0.3, cw = x1 * 0.17, ch = Math.min(gh * 0.55, 90 * U), cy0 = G.road - 8 * U;
    ctx.fillStyle = rgb(PAL.clinic); ctx.fillRect(cx0, cy0 - ch, cw, ch);
    ctx.fillStyle = rgb(PAL.roof); ctx.beginPath(); ctx.moveTo(cx0 - 6 * U, cy0 - ch); ctx.lineTo(cx0 + cw / 2, cy0 - ch - 26 * U); ctx.lineTo(cx0 + cw + 6 * U, cy0 - ch); ctx.fill();
    ctx.fillStyle = rgb(PAL.teal); ctx.fillRect(cx0 + cw / 2 - 3 * U, cy0 - ch + 8 * U, 6 * U, 18 * U); ctx.fillRect(cx0 + cw / 2 - 9 * U, cy0 - ch + 14 * U, 18 * U, 6 * U);
    ctx.fillStyle = '#7a8a96'; ctx.fillRect(G.door - 9 * U, cy0 - 30 * U, 18 * U, 30 * U);
    ctx.fillStyle = '#9ac4d8'; ctx.fillRect(cx0 + 8 * U, cy0 - ch * 0.6, 18 * U, 14 * U);
    bread.x = cx0 + 17 * U; bread.y = cy0 - ch * 0.6 - 2 * U;
    ctx.fillStyle = '#d8b878'; ctx.beginPath(); ctx.ellipse(bread.x, bread.y, 8 * U, 4 * U, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#7aa85a'; [[-3, -1], [2, -2], [4, 1]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(bread.x + dx * U, bread.y + dy * U, 1.8 * U, 0, 6.283); ctx.fill(); });
    ctx.fillStyle = rgb(PAL.ink, 0.7); ctx.font = `${10 * U}px "Patrick Hand"`; ctx.fillText('SAĞLIK OCAĞI', cx0 + 4 * U, cy0 - ch - 4 * U);
    // doktor kapıda
    doctor.x = G.door + 18 * U; doctor.y = G.road + 4 * U; doctor.sx = doctor.x; doctor.sy = doctor.y - 46 * U;
    person(doctor.x, doctor.y, U * (mobile ? 0.85 : 1), { dir: -1, coat: true, hair: '#5a4030' });
    drawShelf(G);
    drawPatients(G, t, dt);
    // tavuk (arka bahçede)
    chicken.ph += dt * 0.01; chicken.x = x1 * 0.26 + Math.sin(chicken.ph * 0.05) * 20 * U; chicken.y = G.road + 30 * U;
    const cd = Math.cos(chicken.ph * 0.05) > 0 ? 1 : -1;
    ctx.save(); ctx.translate(chicken.x, chicken.y); ctx.scale(U * cd, U);
    ctx.fillStyle = '#f4efe2'; ctx.beginPath(); ctx.ellipse(0, -8, 9, 7, 0, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.arc(7, -15, 4.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#c0503a'; ctx.beginPath(); ctx.arc(7, -20, 2, 0, 6.283); ctx.fill(); ctx.fillStyle = '#e0b04a'; ctx.beginPath(); ctx.moveTo(11, -15); ctx.lineTo(14, -14); ctx.lineTo(11, -13); ctx.fill();
    ctx.strokeStyle = '#e0b04a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-2, 2); ctx.moveTo(2, -2); ctx.lineTo(2, 2); ctx.stroke();
    ctx.restore(); chicken.sx = chicken.x; chicken.sy = chicken.y - 22 * U;
    if (mode === 'game' || mode === 'sandbox') {
      const h = curHist();
      if (h) {
        tag(G.door, G.road - 52 * U - Math.min(gh * 0.55, 90 * U) + 40 * U, `💊 Nezleye reçete: ${pct(clamp(h.extra / 0.93))} · Tedavisiz: ${pct(h.missed)}`, { fs: mobile ? 10 : 12, color: h.extra > 0.3 || h.missed > 0.2 ? '#a0402a' : undefined });
      }
    }
    drawOfficial(G, t);
    drawLens(G, t, dt);
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt / 1300; f.y -= dt * 0.025; if (f.life <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = clamp(f.life * 2); ctx.font = `${16 * U}px "Patrick Hand"`; ctx.textAlign = 'center'; ctx.fillStyle = f.col || rgb(PAL.ink); ctx.fillText(f.text, f.x, f.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.life -= dt / 4200; if (b.life <= 0) { bubbles.splice(i, 1); continue; } drawBubble(b); }
  }

  // hasta kuyruğu: 🤒 bakteri, 🤧 nezle (virüs). Kapıda doktor reçete yazar ya da yazmaz.
  let nextPatient = 0;
  function drawPatients(G, t, dt) {
    const live = mode === 'game' || mode === 'sandbox' || mode === 'title';
    if (live && t > nextPatient && patients.length < (mobile ? 4 : 6)) {
      nextPatient = t + rnd(1800, 3200);
      const vir = Math.random() < 0.5;
      patients.push({ x: -20 * U, vir, st: 'walk', t0: 0, shirt: vir ? '#7aa7d6' : '#e0a060', scarf: vir ? '#c0503a' : null, ph: rnd(0, 6) });
    }
    const h = curHist(), extraP = h ? clamp(h.extra / 0.93) : 0.2, cover = h ? h.cover : 0.85;
    const best = h ? h.best : 0.01;
    for (let i = patients.length - 1; i >= 0; i--) {
      const p = patients[i];
      const qx = G.door - 26 * U - patients.filter(o => o !== p && o.st === 'walk' && o.x > p.x).length * 24 * U;
      if (p.st === 'walk') { p.x = Math.min(qx, p.x + 0.05 * dt * U); if (p.x >= G.door - 27 * U && !patients.some(o => o.st === 'visit')) { p.st = 'visit'; p.t0 = t; } }
      else if (p.st === 'visit' && t - p.t0 > 900) {
        p.pill = p.vir ? Math.random() < extraP : Math.random() < cover;
        p.ok = p.vir ? true : p.pill ? Math.random() < (1 - best) + best * 0.5 : Math.random() < 0.3;
        p.st = 'leave';
        if (p.pill) floats.push({ x: doctor.x - 10 * U, y: doctor.y - 30 * U, text: '💊', life: 1 });
        if (p.vir && p.pill) floats.push({ x: p.x, y: G.road - 50 * U, text: 'gereksiz!', life: 1.1, col: '#a0402a' });
      } else if (p.st === 'leave') { p.x += 0.06 * dt * U; p.y2 = (p.y2 || 0) + 0.04 * dt * U; }
      const y = G.road + 4 * U + (p.st === 'leave' ? Math.min(28 * U, p.y2 || 0) : 0);
      p.sx = p.x; p.sy = y - 44 * U;
      if (p.x > G.x1 * 0.62) { patients.splice(i, 1); continue; }
      person(p.x, y, U * (mobile ? 0.8 : 0.95), { dir: 1, shirt: p.shirt, scarf: p.scarf, step: p.st !== 'visit' ? Math.sin(t * 0.02 + p.ph) * 3 : 0, sad: p.st === 'leave' && !p.ok });
      ctx.font = `${18 * U}px sans-serif`; ctx.fillText(p.vir ? '🤧' : '🤒', p.x - 10 * U, y - 46 * U);
      if (p.st === 'leave') { ctx.font = `${14 * U}px "Patrick Hand"`; ctx.fillStyle = p.ok ? '#3a7a3a' : '#a0402a'; ctx.fillText(p.ok ? '✓' : '✗', p.x + 9 * U, y - 40 * U); }
    }
  }

  // =====================================================================
  // KONUŞMALAR
  // =====================================================================
  function lines(kind, o) {
    const h = curHist() || { extra: 0.2, missed: 0.1, best: 0.01 };
    const P = {
      vir: ['Sadece nezleyim ama\nilaç istiyorum!', 'Antibiyotik yazar\nmısınız? Garanti olsun.', 'Komşum bir kutu\naldı, ben de isterim.'],
      bact: h.best > 0.5 ? ['İlaç işe\nyaramadı...', 'İkinci ilacı\nbekliyorum.', 'Hastanede daha\nuzun kalacakmışım.'] : ['Boğazım yanıyor,\nateşim var.', 'Doktor bey,\nyardım edin!', 'Bu ilaç mucize!'],
      doctor: h.extra > 0.4 ? ['Al bir kutu,\nsen de al bir kutu!', 'Herkes istiyor,\nben de yazıyorum.', 'Hasta memnun,\nben memnun.'] : h.missed > 0.25 ? ['Reçete kuralı çok\nsıkı, hasta kaçırıyorum.', 'Bu hastaya ilaç\nlazımdı ama...', 'Kural kuraldır.'] : ['Gribe antibiyotik\nyazmam!', 'Önce bir\ntahlil yapalım.', 'Bol sıvı ve\nistirahat.'],
      chicken: ['Gıdak! Bana da yemle\nantibiyotik veriyorlar!', 'Ben hasta değilim,\nbüyüyeyim diye!', 'Gıdak gıdak!'],
      bread: ['Küf mü? Fleming\nde böyle başladı.', 'Penicillium!\nBen bir efsaneyim.'],
      lens: h.best > 0.4 ? ['Kırmızılar artıyor:\nilaç onlara işlemiyor!', 'Dirençliler\nboşlukları dolduruyor.'] : ['Yeşiller duyarlı,\nilaç onları öldürür.', 'Bir bakteri 20 dakikada\nikiye bölünebilir.'],
      shelf: ['Her şişe bir ilaç.\nKırmızı = yorgunluk.', 'Kilitli şişe yedekte:\nyalnız ağır hastaya.'],
      official: ['Kararınızı\nbekliyoruz.', 'Hastalar\nkapıda.'],
    };
    return pick(P[kind] || ['...']);
  }
  function talkAt(x, y) {
    const c = [], add = (sx, sy, kind, fn) => { if (sx !== undefined && !isNaN(sy)) c.push({ d: Math.hypot(sx - x, sy - y), kind, fn, obj: { x: sx, y: sy } }); };
    if (mview.k > 0.5) { setMicro(false); return true; }
    if (Math.hypot(x - lensBox.x, y - lensBox.y) < lensBox.r) { setMicro(true); sayAt({ x: lensBox.x, y: lensBox.y - lensBox.r }, lines('lens')); blip(); if (tapCount('lens') >= 3) award('bak-mikroskop'); return true; }
    patients.forEach(p => add(p.sx, p.sy, p.vir ? 'vir' : 'bact', p.vir ? () => award('bak-grip') : null));
    add(doctor.sx, doctor.sy, 'doctor');
    add(chicken.sx, chicken.sy, 'chicken', () => { cluck(); award('bak-tavuk'); });
    add(bread.x, bread.y - 6 * U, 'bread', () => award('bak-kuf'));
    // kilitli şişeye dokunmak yedeği açar
    for (const sh of shelf) if (mode === 'game' && game.reserve[sh.id] && Math.abs(x - sh.x) < 16 * U && y > sh.y - 10 * U && y < sh.y + 50 * U) { delete game.reserve[sh.id]; sayAt({ x: sh.x, y: sh.y }, nameOf(sh.id) + ' artık\nherkese veriliyor.'); blip(); return true; }
    shelf.forEach(s => add(s.x, s.y, 'shelf'));
    if (official && official.x) add(official.x, official.y, 'official');
    if (!c.length) return false;
    c.sort((a, b) => a.d - b.d);
    const best = c[0];
    sayAt(best.obj, lines(best.kind)); blip(); if (best.fn) best.fn();
    if (best.kind === 'vir') setTimeout(() => sayAt({ x: doctor.sx, y: doctor.sy }, 'Nezle bir virüs.\nAntibiyotik virüsü öldürmez.'), 2200);
    return true;
  }
  let nextChat = 0;
  function ambientChat(t) {
    if (mode !== 'game' || game.state !== 'play' || bubbles.length) return;
    if (!nextChat) nextChat = t + 8000;
    if (t < nextChat) return;
    nextChat = t + rnd(10000, 17000);
    const p = patients.find(q => q.st === 'walk');
    const opts = [['doctor', { x: doctor.sx, y: doctor.sy }]];
    if (p) opts.push([p.vir ? 'vir' : 'bact', { get x() { return p.sx; }, get y() { return p.sy; } }]);
    opts.push(['lens', { x: lensBox.x, y: lensBox.y - lensBox.r }]);
    const [k, o] = pick(opts); sayAt(o, lines(k));
  }

  let official = null;
  function drawBody(g, who, st) {
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(0, 2, 12, 3, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#2f3b46'; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -6); g.lineTo(-4 - st, 2); g.moveTo(3, -6); g.lineTo(4 + st, 2); g.stroke();
    g.fillStyle = who === 'fleming' ? '#4a5866' : who === 'patient' ? '#e0a060' : '#fbfaf6'; g.beginPath(); g.roundRect ? g.roundRect(-9, -30, 18, 26, 5) : g.rect(-9, -30, 18, 26); g.fill();
    if (who === 'fleming') { g.fillStyle = '#c0503a'; g.beginPath(); g.moveTo(-3, -30); g.lineTo(3, -30); g.lineTo(0, -22); g.fill(); } // papyon
    if (who === 'sci') { g.fillStyle = '#3e9696'; g.fillRect(-1, -26, 2, 8); g.fillRect(-4, -23, 8, 2); }
    g.fillStyle = '#f2d2b0'; g.beginPath(); g.arc(0, -37, 7.5, 0, 6.283); g.fill();
    g.fillStyle = who === 'fleming' ? '#d8d2c0' : '#5a4030'; g.beginPath(); g.arc(0, -40, 7.8, Math.PI, 0); g.fill();
    g.fillStyle = rgb(PAL.ink); g.beginPath(); g.arc(-2.6, -37, 1.2, 0, 6.283); g.arc(2.6, -37, 1.2, 0, 6.283); g.fill();
    if (who === 'fleming') { g.strokeStyle = rgb(PAL.ink); g.lineWidth = 1; g.beginPath(); g.arc(-2.6, -37, 2.6, 0, 6.283); g.arc(2.6, -37, 2.6, 0, 6.283); g.stroke(); } // gözlük
  }
  function portrait(who) {
    const c = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 120, h = 150;
    c.width = w * dpr; c.height = h * dpr; c.className = 'portrait';
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(w / 2, h - 8); g.scale(2.7, 2.7);
    drawBody(g, who, 0); return c;
  }
  function drawOfficial(G, t) {
    if (!official) return;
    const now = performance.now(), e = now - official.t0;
    const stopX = G.x1 * (mobile ? 0.22 : 0.24), startX = -40;
    let x = e < 1500 ? lerp(startX, stopX, smooth(0, 1, e / 1500)) : stopX;
    const leaving = official.leave && now > official.leave;
    if (leaving) x = lerp(stopX, startX, smooth(0, 1, (now - official.leave) / 1500));
    if (official.leave && now > official.leave + 1500) { official = null; return; }
    const y = G.road + 4 * U, s = 1.1 * U, walk = e < 1500 || leaving;
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
  const DONE_KEY = 'bny-bitti-bakteri';
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
    if (mode === 'game') { if (window.Stat) window.Stat.event('basla-bakteri', 'Başladı: Bakterilerin İntikamı'); enterGame(); }
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
    if (visible >= (mobile ? 1 : 2) || (k < 0 && performance.now() - lastToastAt < 9000 / FAST)) return;
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
    if (!opt.pause) setTimeout(close, Math.min(16000, Math.max(opt.ms || 0, 4500 + plain.length * 65)));
  }

  // =====================================================================
  // OYUN
  // =====================================================================
  const YEAR = 3600 / FAST;
  let gs = M.newState();
  const game = {};
  const gP = $('g-p'), gH = $('g-h');
  const award = id => (window.Badges ? window.Badges.award(id) : false);
  const choiceQ = [];
  const curState = () => mode === 'sandbox' ? sb.st : gs;
  const curReserve = () => mode === 'sandbox' ? sb.p.reserve : game.reserve || {};
  const curHist = () => { const s = curState(); return s.hist.length ? s.hist[s.hist.length - 1] : null; };
  let lensDrug = 'pen';
  function pickLensDrug(s, res) { const f = (s.avail || []).filter(id => !res[id]).sort((a, b) => s.r[a] - s.r[b]); if (!f.length) return lensDrug; if (!s.r[lensDrug] || res[lensDrug] || !f.includes(lensDrug) || s.r[lensDrug] > s.r[f[0]] + 0.12) lensDrug = f[0]; return lensDrug; }
  const frontName = () => nameOf(lensDrug);

  function resetGame() {
    gs = M.newState();
    Object.assign(game, {
      started: false, paused: false, state: 'play', frac: 0, fired: new Set(), hist: [], speed: 1, touched: false, reading: 0, story: false, endAfter: false,
      p: 0.35, h: 0, reserve: {}, decisions: [], lockUntil: 0, events: [], test: false, otc: false, sat: 70, replaced: false, inspected: false, unlockedH: false,
    });
    gP.value = 35; gP.disabled = false; gH.value = 0; gH.disabled = true; $('w-h').classList.add('locked'); $('o-h').textContent = "🔒 1960'ta açılır";
    document.querySelectorAll('.coach').forEach(uncoach);
    readGameSliders();
    $('g-pause').textContent = '❚❚ Durdur'; setSpeed(1);
    $('modal').hidden = true; $('yb-harvest').textContent = ''; $('toasts').innerHTML = ''; toastQueue.length = 0; lastToastAt = -1e9;
    $('g-intro').classList.remove('gone');
    if (window.Badges) window.Badges.resetSession(); tapCount.m = {};
    choiceQ.length = 0; official = null; patients.length = 0; resetBugs(); planEvents(); lensDrug = 'pen';
  }
  function readGameSliders() {
    game.p = gP.value / 100; game.h = game.unlockedH ? gH.value / 100 : 0;
    $('o-p').textContent = '%' + gP.value; if (game.unlockedH) $('o-h').textContent = '%' + gH.value;
  }
  [gP, gH].forEach(el => el.addEventListener('input', () => { initAudio();
    if (el === gP && game.lockUntil && gs.y < game.lockUntil && Number(gP.value) < 70) { gP.value = 70; once('lock' + game.lockUntil, () => toast('📜', 'Hasta derneği', `Söz verdin: ${game.lockUntil}'e kadar reçete en az %70.`, 'warn')); }
    readGameSliders(); if (!game.touched) { game.touched = true; setTimeout(() => $('g-intro').classList.add('gone'), 2500); } }));
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

  const STORY = [
    ['🧪', 'Londra · 1945', 'Penisilin savaşta mucize oldu. Şimdi her eve giriyor. Bulan <b>Alexander Fleming</b> Nobel ödülünü alırken bir uyarı yaptı.', '', { pause: true }],
    ['🔬', 'Fleming\'in uyarısı', '"İlacı az ya da gereksiz kullanırsanız, ölmeyen mikroplar dirençli olur ve çoğalır." Sağdaki mikroskopta bunu izleyeceksin: <b>yeşiller ilaca duyarlı, kırmızılar dirençli</b>.', '', { pause: true }],
    ['💊', 'Senin işin', 'Kaydırıcı doktorların ne kadar kolay reçete yazacağını belirler. Az olursa gerçek hastalar ilaçsız kalır, çok olursa nezleye de ilaç gider.', '', { ms: 9000 }],
    ['🚪', 'Kapıda kuyruk', 'Gelenler: 🤒 bakteri enfeksiyonu (ilaç işe yarar) ve 🤧 nezle (virüs, ilaç yaramaz). İkisi de ilaç istiyor.', '', { ms: 9000 }],
  ];
  function enterGame() {
    game.paused = false; $('g-pause').textContent = '❚❚ Durdur';
    if (game.started) return;
    game.started = true; game.story = true; // görev kartı kapanana kadar zaman durur
    const show = i => {
      if (mode !== 'game') return;
      if (i >= STORY.length) { game.story = false; return; }
      const [ic, from, text, tone, opt0] = STORY[i];
      const opt = wasDone ? { ...opt0, pause: false, ms: 6000 } : opt0; // tekrar oynayışta hikâye durdurmaz
      toast(ic, from, text, tone, { ...opt, then: opt.pause ? () => show(i + 1) : undefined });
      if (!opt.pause) setTimeout(() => show(i + 1), 4500 / Math.max(1, FAST / 2));
    };
    const start = () => { if (wasDone) game.story = false; setTimeout(() => show(0), 300); };
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
    game.state = 'choice'; // seçilen hız korunur (testçi: her kartta 1×'e dönmesin)
    const m = $('modal');
    m.innerHTML = `<div class="card talk"><div class="who"></div><div><div class="from">${from}</div><h2>${title}</h2><p class="speech">${text}</p><div class="opts"></div></div></div>`;
    m.querySelector('.who').appendChild(portrait(who || 'sci'));
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

  // her oyunda 3 rastgele olay (yeniden oynamada farklı bir dünya)
  const EVENTS = [
    { id: 'grip', ic: '🤧', from: 'Salgın', text: 'Büyük bir grip salgını! Kapıda kuyruk iki katı. Herkes ilaç istiyor ama grip bir <b>virüs</b>: antibiyotik işe yaramaz.', fn: () => { game.gripYear = gs.y; } },
    { id: 'test', ic: '🧪', from: 'Laboratuvar', text: 'Hızlı tanı testi geldi! Doktor artık nezleyi bakteri enfeksiyonundan daha kolay ayırıyor. Gereksiz reçete azalacak.', fn: () => { game.test = true; } },
    { id: 'travel', ic: '✈️', from: 'Havalimanı', text: 'Uzak bir ülkeden dönen yolcularla dirençli bakteri kasabaya geldi. Dirençli bakteri sınır tanımaz.', fn: () => { const f = gs.avail.filter(id => !game.reserve[id]); f.forEach(id => { gs.r[id] = Math.min(0.99, gs.r[id] + 0.12); }); } },
    { id: 'vaccine', ic: '💉', from: 'Sağlık bakanlığı', text: 'Yeni bir aşı kampanyası başladı: aşılanan hastalanmaz, hastalanmayan ilaç kullanmaz.', fn: () => { game.hBonus = 0.25; } },
    { id: 'farm', ic: '🐔', from: 'Çiftlik', text: 'Çiftliklerde hayvan yemine antibiyotik katılıyor, hayvanlar hızlı büyüsün diye. Dirençli bakteriler oradan da yayılıyor.', fn: () => { gs.avail.forEach(id => { gs.r[id] = Math.min(0.99, gs.r[id] + 0.06); }); } },
  ];
  function planEvents() {
    const pool = EVENTS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const years = [rnd(1966, 1976), rnd(1978, 1992), rnd(1994, 2008)].map(Math.round);
    game.events = pool.map((e, i) => ({ ...e, y: years[i] }));
  }
  function yearTick() {
    const y = gs.y;
    // reçetesiz satış (1951'e kadar) gereksiz kullanımı artırır
    const ev = game.events.find(e => e.y === y);
    if (ev) { ev.fn(); milestone(ev.ic, ev.from, ev.text, ev.id === 'test' || ev.id === 'vaccine' ? 'good' : 'warn'); }
    const pEff = clamp(game.p + (game.otc && y < 1951 ? 0.25 : 0) + (game.gripYear === y ? 0.25 : 0));
    M.step(gs, { p: pEff, h: clamp(game.h + (game.hBonus || 0)), reserve: game.reserve, test: game.test });
    const h = gs.hist[gs.hist.length - 1];
    game.hist.push({ ...h, p: game.p });
    const front = gs.avail.filter(id => !game.reserve[id]).sort((a, b) => gs.r[a] - gs.r[b]);
    const ld = pickLensDrug(gs, game.reserve);
    doseYear(h, gs.r[ld] || 0, YEAR * (gs.y < M.Y0 + 3 ? 1.5 : 1) / game.speed * 0.6);
    // hasta memnuniyeti: insanlar ilaç almayı sever; tedavisiz kalan ve iyileşmeyen kızar
    if (!game.replaced) game.sat = clamp(game.sat + (pEff - 0.42) * 10 - h.missed * 12 - (1 - h.succ) * 14 - game.h * 2 + 2.5, 0, 100);
    $('yb-harvest').textContent = `✅ %${Math.round(h.succ * 100)}`; $('yb-harvest').style.color = h.succ >= 0.85 ? 'var(--green)' : h.succ >= 0.6 ? 'var(--grain)' : 'var(--danger)';

    if (y === 1946) {
      comeOfficial('sci', 'Eczaneler soruyor.');
      choice('Eczacılar odası', 'Penisilin reçetesiz satılsın mı?', '"Halk penisilini pastil, merhem, burun spreyi olarak tezgâhtan almak istiyor. Bazı ülkelerde şimdiden reçetesiz satılıyor."', [
        { label: 'Reçeteye bağla', sub: 'Yalnız doktor yazarsa', fn: () => { award('bak-fleming'); game.sat = clamp(game.sat - 8, 0, 100); } },
        { label: 'Serbest bırak', sub: 'Herkes istediği gibi alsın', fn: () => { game.otc = true; toast('🏪', 'Eczane', 'Penisilin pastili tezgâhta! Herkes boğazı gıcık edince bir tane alıyor.', 'warn'); } },
      ]);
    }
    if (y === 1950 && game.otc) milestone('⚖️', 'Yasa', '1951\'den sonra antibiyotikler yalnız reçeteyle satılacak. Pastil dönemi bitti.', '');
    // yeni ilaç: herkese mi, yedeğe mi?
    for (const d of M.DRUGS) if (d.y === y && d.y > M.Y0) {
      comeOfficial('sci', 'Yeni bir ilaç bulduk!');
      choice('İlaç araştırmacısı', `Yeni antibiyotik: ${d.name}`, `"${d.name} bugün bütün bakterileri öldürüyor. Herkese verirsek bugün çok hasta iyileşir. Yedekte tutarsak yalnız öteki ilaçların yetmediği ağır hastalara gider ve direnç çok daha yavaş gelir."`, [
        { label: 'Herkese ver', sub: 'Bugün çok hasta iyileşir', fn: () => { game.decisions.push({ id: d.id, reserve: false }); game.sat = clamp(game.sat + 6, 0, 100); } },
        { label: 'Yedekte tut', sub: 'Yalnız ağır hastalara', fn: () => { game.reserve[d.id] = 1; game.decisions.push({ id: d.id, reserve: true }); toast('🔒', 'İlaç dolabı', `${d.name} kilitli rafa kondu: yalnız ilk ilacın işe yaramadığı hastalara.`); } },
      ]);
    }
    const bestR = front.length ? gs.r[front[0]] : 1;
    if (bestR > 0.3) once('res30', () => { setMicro(true, 7000); toast('🔬', 'Laboratuvar', `${nameOf(front[0])} artık bazı bakterilere işlemiyor. Mikroskopta kırmızılar çoğalıyor.`, 'warn'); });
    if (bestR > 0.6) once('res60', () => toast('🏥', 'Hastane', 'İlk verilen ilaç çoğu hastada işe yaramıyor. Hastalar daha uzun yatıyor.', 'bad'));
    if (h.extra > 0.35) once('extra', () => toast('🤧', 'Doktor', 'Nezleye bile antibiyotik yazıyoruz. Virüse hiçbir faydası yok, ama bakterileri eğitiyor.', 'warn'));
    if (h.missed > 0.25) once('missed', () => { toast('😷', 'Doktor', 'Reçete kuralı çok sıkı: gerçek enfeksiyonu olan hastalar da ilaçsız dönüyor.', 'warn'); coach(gP, '👉 Biraz gevşet: gerçek hastalar ilaç alsın', 10000); });
    if (y === 1960) {
      game.unlockedH = true; gH.disabled = false; $('w-h').classList.remove('locked'); readGameSliders();
      setMicro(true, 8000);
      milestone('🦠', 'Londra · 1960', game.reserve.met ? 'Sen Metisilin\'i yedekte tuttun; ama dünyanın başka yerinde ona dirençli stafilokok bulundu: <b>MRSA</b>. Dirençli bakteri sınır tanımaz. El yıkama ve aşı yeni bir silah olabilir.' : 'Metisilin bir yıl önce gelmişti; şimdi ona da dirençli stafilokok bulundu: <b>MRSA</b>. Hastanelerde elden ele yayılıyor. El yıkama ve aşı yeni bir silah olabilir.', 'bad', () => coach(gH, '👉 Kaydır: hijyen ve aşı'));
    }
    if (y === 1995) milestone('🧫', 'Araştırmacılar', '1987\'den beri yeni bir antibiyotik sınıfı bulunamadı. Bulmak çok zor, şirketler için kârı az. Elimizdekileri korumak zorundayız.', 'warn');
    if (game.sat < 25 && !game.replaced) once('warn-sat', () => toast('📞', 'Belediye', 'Hastalar şikâyetçi: "Doktor ilaç yazmıyor!"', 'warn'));
    if (game.sat <= 0 && !game.replaced && game.p < 0.6) patientsUnion();
    if (gs.y > M.Y1 && game.state === 'play') endGame(); else if (gs.y > M.Y1) game.endAfter = true;
  }
  function patientsUnion() {
    if (game.inspected || game.replaced) return;
    game.inspected = true; comeOfficial('patient', 'İlaç istiyoruz!');
    choice('Hasta derneği başkanı', 'Sabır tükendi', '"Herkes ilaç istiyor! Reçete kolaylığını <b>en az %70</b> yap, yoksa seni görevden aldıracağız."', [
      { label: 'Tamam, kolaylaştırıyorum', sub: 'Reçete kolaylığı 5 yıl boyunca en az %70', fn: () => { gP.value = Math.max(Number(gP.value), 70); game.lockUntil = gs.y + 5; readGameSliders(); game.sat = 45; } },
      { label: 'Hayır, ilaçları koruyacağım', sub: 'Görevden alınırsın, oyun biter', fn: () => { game.replaced = true; toast('📜', 'Belediye', 'Görevden alındın. Yerine gelen ilk iş reçeteyi serbest bıraktı.', 'bad'); endGame(); } },
    ], 'patient');
  }
  function awardEnd() {
    if (game.replaced || gs.y <= M.Y1) return;
    const hs = game.hist, last = hs[hs.length - 1];
    if (last.succ >= 0.8) award('bak-basari');
    if (game.decisions.length >= 3 && game.decisions.every(d => d.reserve)) award('bak-yedek');
    const avgP = hs.reduce((a, h) => a + h.p, 0) / hs.length, avgMiss = hs.reduce((a, h) => a + h.missed, 0) / hs.length;
    if (avgP >= 0.3 && avgP <= 0.5 && avgMiss < 0.12) award('bak-dengeli');
  }
  function endGame() {
    if (game.state === 'end') return;
    awardEnd(); game.state = 'end';
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    if (window.Stat) window.Stat.event('bitti-bakteri', 'Bitirdi: Bakterilerin İntikamı');
    maxSeen = slides.length - 1; paintDots(); replayNav();
    setTimeout(() => { if (mode === 'game') goTo(slideOf('result')); }, 1600);
  }
  function renderResult() {
    if (!game.hist.length || (gs.y <= M.Y1 && !game.replaced)) { $('result').innerHTML = '<h2>Önce oyunu bitir</h2><button class="hbtn">← Oyuna dön</button>'; $('result').querySelector('button').onclick = () => goTo(slideOf('game')); return; }
    const hs = game.hist, last = hs[hs.length - 1], n = hs.length, hh = HISTORY.hist.slice(0, n), hl = hh[hh.length - 1];
    const sY = Math.round(last.succ * 100), sH = Math.round(hl.succ * 100);
    const rY = Math.round(Math.max(...hs.map(h => h.best)) * 100), rH = Math.round(Math.max(...hh.map(h => h.best)) * 100);
    const eY = Math.round(hs.reduce((a, h) => a + clamp(h.extra / 0.93), 0) / n * 100), eH = Math.round(hh.reduce((a, h) => a + clamp(h.extra / 0.93), 0) / n * 100);
    let title, text;
    if (game.replaced) { title = 'Görevden alındın'; text = 'İlaçları korumak istedin ama hastalar bekleyemedi. Gerçekte de doktorlar "hasta ilaç istiyor" baskısıyla her gün karşılaşıyor.'; }
    else if (sY >= 80) { title = 'İlaçlar hâlâ çalışıyor'; text = 'Gerektiği kadar ilaç verdin, yeni ilaçları korudun. Bakteriler de evrimleşti, ama sen onlara ders çalıştırmadın.'; }
    else if (hs.reduce((a, h) => a + h.missed, 0) / n > 0.22) { title = 'Hastalar ilaçsız kaldı'; text = 'Direnç az kaldı, ama kural o kadar sıkıydı ki gerçek enfeksiyonu olan pek çok hasta ilaçsız döndü. İlaç saklanacak değil, doğru kişiye verilecek bir şey.'; }
    else if (sY >= 50) { title = 'Zor ama ayakta'; text = 'Bazı ilaçlar tükendi, ama elde hâlâ işe yarayanlar var. Bir sonraki ilaç ne zaman bulunacak? Kimse bilmiyor.'; }
    else { title = 'Bakteriler kazandı'; text = 'Her yeni ilaç birkaç yıl kurtardı, sonra o da yoruldu. Tebrikler, tarihi başarıyla tekrarladın. Fleming haklıydı.'; }
    const col = v => v >= 80 ? 'var(--green)' : v >= 50 ? 'var(--grain)' : 'var(--danger)';
    $('result').innerHTML = `
      <div class="kicker">${game.replaced ? (gs.y - 1) + ' · görevden alındın' : '2015 · görev süren doldu'}</div>
      <h2>${title}</h2>
      <p class="verdict">${text}</p>
      ${window.SceneUtils ? window.SceneUtils.bestLine('bakteri', sY, 'tedavi başarısı', !game.replaced) : ''}
      <div class="rgrid">
        <div><div class="y">Tedavi başarısı</div><div class="v" style="color:${col(sY)}">%${sY}</div><div class="h">tarihte: %${sH}</div></div>
        <div><div class="y">En yüksek direnç</div><div class="v" style="color:${col(100 - rY)}">%${rY}</div><div class="h">tarihte: %${rH}</div></div>
        <div><div class="y">Nezleye reçete</div><div class="v" style="color:${col(100 - eY)}">%${eY}</div><div class="h">tarihte: %${eH}</div></div>
      </div>
      ${(window.Badges && window.Badges.session().length) ? `<div class="run-badges">${window.Badges.session().map(id => { const d = window.Badges.DEFS.find(x => x.id === id); return d ? `<span class="${d.hidden ? 'secret' : ''}">${d.icon} ${d.name}</span>` : ''; }).join('')}</div>` : ''}
      <canvas class="rchart" id="rchart"></canvas>
      <div class="legend"><span style="--c:#4f7a4a">Tedavi başarısı</span><span style="--c:#c0503a">İlk ilaçta direnç</span><span style="--c:#c29a2e">Gereksiz reçete</span><span style="--c:#9aa59a">Tarihteki başarı (kesikli)</span></div>
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
    for (let k = 5; k < n; k += 10) { g.beginPath(); g.moveTo(X(k), pad); g.lineTo(X(k), h - pad); g.stroke(); }
    series.forEach(s => {
      if (!s.data.length) return;
      g.strokeStyle = s.color; g.lineWidth = s.dash ? 1.8 : 3; g.lineJoin = 'round'; g.lineCap = 'round';
      g.setLineDash(s.dash ? [5, 5] : []);
      g.beginPath(); s.data.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke();
    });
    g.setLineDash([]);
  }
  const series = hist => [
    { data: hist.map(d => clamp(d.extra / 0.93)), color: '#c29a2e', label: 'Gereksiz reçete', fmt: v => '%' + Math.round(v * 100) },
    { data: hist.map(d => d.best), color: '#c0503a', label: 'Direnç', fmt: v => '%' + Math.round(v * 100) },
    { data: hist.map(d => d.succ), color: '#4f7a4a', label: 'Başarı', fmt: v => '%' + Math.round(v * 100) },
  ];
  function drawResultChart() { lineChart($('rchart'), [{ data: HISTORY.hist.map(d => d.succ), color: '#9aa59a', dash: true, label: 'Tarihte başarı', fmt: v => '%' + Math.round(v * 100) }, ...series(game.hist)], TOTAL, { y0: M.Y0 }); }

  // =====================================================================
  // LABORATUVAR
  // =====================================================================
  const sb = { running: false, speed: 1, frac: 0, st: M.newState(), p: { p: 0.3, h: 0, reserve: {} }, preset: null, resAll: false };
  function readSliders() {
    sb.p.p = $('p-p').value / 100; sb.p.h = $('p-h').value / 100; sb.resAll = $('p-r').value === '1';
    sb.p.reserve = sb.resAll ? { met: 1, kin: 1 } : {};
    $('o-pp').textContent = '%' + $('p-p').value; $('o-ph').textContent = '%' + $('p-h').value; $('o-pr').textContent = sb.resAll ? 'evet' : 'hayır';
  }
  ['p-p', 'p-h', 'p-r'].forEach(id => $(id).addEventListener('input', () => { readSliders(); sb.preset = null; document.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); }));
  const PRESETS = { history: null, all: [100, 0, 0], smart: [40, 80, 1], strict: [0, 0, 0] };
  document.querySelectorAll('.pbtn').forEach(b => b.onclick = () => {
    const v = PRESETS[b.dataset.preset]; sb.preset = b.dataset.preset;
    if (v) ['p-p', 'p-h', 'p-r'].forEach((id, i) => $(id).value = v[i]);
    readSliders(); sb.st = M.newState(); sb.frac = 0; resetBugs(); updateSbStats(); drawSbChart();
    document.querySelectorAll('.pbtn').forEach(x => x.classList.toggle('on', x === b));
  });
  $('sb-play').onclick = () => { sb.running = !sb.running; $('sb-play').textContent = sb.running ? '❚❚ Durdur' : '▶ Devam'; };
  $('sb-speed').onclick = () => { sb.speed = sb.speed === 1 ? 2 : sb.speed === 2 ? 4 : 1; $('sb-speed').textContent = sb.speed + '×'; };
  $('sb-reset').onclick = () => { sb.st = M.newState(); sb.frac = 0; resetBugs(); updateSbStats(); drawSbChart(); };
  readSliders();
  function enterSandbox() { sb.running = true; $('sb-play').textContent = '❚❚ Durdur'; resetBugs(); updateSbStats(); setTimeout(drawSbChart, 50); }
  function updateSandbox(dt) {
    if (mode !== 'sandbox' || !sb.running) return;
    sb.frac += dt / (900 / sb.speed);
    while (sb.frac >= 1) {
      sb.frac -= 1;
      if (sb.st.y > M.Y1) { sb.st = M.newState(); resetBugs(); }
      const pp = sb.preset === 'history' ? M.histP(sb.st.y) : sb.p;
      if (sb.preset === 'history') { $('p-p').value = Math.round(pp.p * 100); $('p-h').value = Math.round(pp.h * 100); $('o-pp').textContent = '%' + Math.round(pp.p * 100); $('o-ph').textContent = '%' + Math.round(pp.h * 100); }
      M.step(sb.st, pp);
      const h = sb.st.hist[sb.st.hist.length - 1], res = pp.reserve || {};
      const ld = pickLensDrug(sb.st, res);
      doseYear(h, sb.st.r[ld] || 0, 900 / sb.speed);
      updateSbStats(); drawSbChart();
    }
  }
  function updateSbStats() { const h = sb.st.hist[sb.st.hist.length - 1]; $('sb-year').textContent = String(h ? h.y : 1945); $('sb-harvest').textContent = `Başarı: %${h ? Math.round(h.succ * 100) : 100} · İlaç: ${frontName()}`; }
  function drawSbChart() { lineChart($('sb-chart'), series(sb.st.hist), TOTAL, { y0: M.Y0, step: 20 }); }

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
    if (h) Object.assign(target, { succ: h.succ, best: h.best, extra: h.extra, missed: h.missed, U: h.U });
    else Object.assign(target, { succ: 1, best: 0.01, extra: 0, missed: 0, U: 0.3 });
    const k = 1 - Math.pow(0.93, dt / 16);
    for (const key of Object.keys(target)) vis[key] = lerp(vis[key], target[key], k * 0.5);
    vis.bad = lerp(vis.bad, smooth(0.15, 0.6, 1 - vis.succ), k * 0.5);
    if (mview.until && performance.now() > mview.until && !mview.user) setMicro(false);
    if (mode !== 'game' && mode !== 'sandbox') mview.want = 0;
    mview.k = lerp(mview.k, mview.want, 1 - Math.pow(0.9, dt / 16));
    const L = layoutFor(mode);
    lay.gt = lerp(lay.gt, L.gt, k * 0.6); lay.gb = lerp(lay.gb, L.gb, k * 0.6); lay.x1 = lerp(lay.x1, L.x1, k * 0.6);
    try { render(now, dt); } catch (e) { if (!frame.err) { frame.err = 1; console.error(e); } } // çizim hatası döngüyü durdurmasın
    if (mode === 'game') {
      // yıl çubuğu son işlenen yılı gösterir; kartlar da o yıla aittir
      const yy = String(Math.max(M.Y0, Math.min(gs.y - 1, M.Y1)));
      if ($('yb-year').textContent !== yy) { const el = $('yb-year'); el.textContent = yy; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      $('yb-sub').textContent = eraName(Math.min(gs.y, M.Y1)); $('g-date').textContent = yy;
      $('yb-fill').style.width = clamp((gs.hist.length + game.frac) / TOTAL) * 100 + '%';
      const resv = Object.keys(game.reserve).map(nameOf);
      $('d-name').textContent = frontName() + (resv.length ? ` · 🔒 ${resv.join(', ')}` : '');
      $('m-succ').style.width = clamp(vis.succ) * 100 + '%';
      $('m-res').style.width = clamp(vis.best) * 100 + '%';
      $('m-extra').style.width = clamp(vis.extra / 0.93) * 100 + '%';
      $('m-miss').style.width = clamp(vis.missed / 0.45) * 100 + '%';
      $('m-trust').style.width = game.sat + '%';
      $('m-trust').parentElement.parentElement.classList.toggle('low', game.sat < 30);
    }
    if (++bgTick % 6 === 0) { const bg = rgb(mixC(PAL.bgOk, PAL.bgBad, vis.bad)); if (bg !== lastBg) { document.documentElement.style.setProperty('--bg', bg); lastBg = bg; } }
    requestAnimationFrame(frame);
  }

  resetGame();
  if (wasDone) { paintDots(); replayNav(); }
  if (/[?&]debug\b/.test(location.search)) window.__dbg = { game, sb, vis, bugs, patients, lensBox, bread, chicken, M, get gs() { return gs; }, get mode() { return mode; }, go: m => { maxSeen = slides.length; goTo(slideOf(m)); } };
  window.addEventListener('resize', resize);
  resize();
  goTo(0);
  requestAnimationFrame(frame);
})();
