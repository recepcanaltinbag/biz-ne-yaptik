// Sinematik sahneler: tarihî anlarda kısa, atlanabilir bir "film kesiti".
// Görseller yalnız arşiv fotoğrafları (kamu malı / CC, sitede barındırılır) ve kodla çizilen animasyonlardır; yapay zekâ üretimi görsel yok.
// Kullanım: Cinema.play({ id, year, title, credit, shots: [{ img, kb: [x0, y0, z0, x1, y1, z1], text, dur, draw(g, t, w, h, k) }] }, done)
//  - img: yerel görsel yolu (toon.js varsa baskı görünümüne çevrilir), kb: Ken Burns başlangıç ve bitiş (merkez 0–1, yakınlık)
//  - draw: üstüne çizilen animasyon (t: sahnedeki ms, k: 0–1 ilerleme)
//  - Atla düğmesi / Esc: hepsini geçer; dokunma / boşluk: sonraki karta geçer
(() => {
  'use strict';
  const FAST = /[?&](hizli|e2e)\b/.test(location.search) ? 8 : 1;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t * t * (3 - 2 * t);
  const cache = {};
  function loadImg(url) {
    if (cache[url]) return cache[url];
    const raw = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
    cache[url] = (window.Toon ? window.Toon.process(url, { maxW: 1400 }).then(u => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => raw.then(res); im.src = u; })).catch(() => raw) : raw);
    return cache[url];
  }
  function seen(id) { try { return !!localStorage.getItem('bny-cine-' + id); } catch (e) { return false; } }
  function mark(id) { try { localStorage.setItem('bny-cine-' + id, '1'); } catch (e) {} }

  let active = null;
  function play(spec, done) {
    if (active) { active.finish(); }
    if (spec.skipIfSeen && seen(spec.id)) { if (done) setTimeout(done, 0); return; }
    const el = document.createElement('div'); el.className = 'cine';
    el.innerHTML = `<canvas></canvas><div class="cine-top"><span class="cine-year"></span><span class="cine-title"></span></div><div class="cine-cap"></div><div class="cine-credit"></div><button type="button" class="cine-skip">Atla ⏭</button><div class="cine-bar"><i></i></div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('canvas'), g = cv.getContext('2d');
    const cap = el.querySelector('.cine-cap'), bar = el.querySelector('.cine-bar i');
    el.querySelector('.cine-year').textContent = spec.year || '';
    el.querySelector('.cine-title').textContent = spec.title || '';
    el.querySelector('.cine-credit').textContent = spec.credit || '';
    // kare süresi: yazının yazılması + okunması (saniyede ~12 karakter) kadar en az; dokununca yine geçilir
    const readMs = t => 1500 + String(t || '').length * (18 + 83);
    const shots = spec.shots.map(s => ({ ...s, dur: Math.max(s.dur || 4200, readMs(s.text)) / FAST }));
    const total = shots.reduce((a, s) => a + s.dur, 0);
    const imgs = shots.map(s => s.img ? loadImg(s.img) : Promise.resolve(null));
    let W = 0, H = 0, dpr = 1;
    function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
    resize(); addEventListener('resize', resize);
    const loaded = [];
    imgs.forEach((p, i) => p.then(im => { loaded[i] = im; }));
    let i = 0, t0 = performance.now(), shown = -1, typed = 0, raf = 0, finished = false, start = 0;
    const capText = () => shots[i].text || '';
    function next() { if (i < shots.length - 1) { i++; t0 = performance.now(); shown = -1; } else finish(); }
    function finish() {
      if (finished) return; finished = true; cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('keydown', key);
      el.classList.add('out'); mark(spec.id); active = null;
      setTimeout(() => el.remove(), 450);
      if (done) done();
    }
    function key(e) { if (e.key === 'Escape') { e.preventDefault(); finish(); } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); } }
    addEventListener('keydown', key);
    el.querySelector('.cine-skip').onclick = e => { e.stopPropagation(); finish(); };
    el.addEventListener('pointerdown', e => { if (!e.target.closest('.cine-skip')) next(); });
    function drawImg(im, s, k, alpha) {
      const [x0, y0, z0, x1, y1, z1] = s.kb || [0.5, 0.5, 1.05, 0.5, 0.5, 1.2];
      const z = z0 + (z1 - z0) * ease(k), cx = x0 + (x1 - x0) * ease(k), cy = y0 + (y1 - y0) * ease(k);
      const sc = Math.max(W / im.width, H / im.height) * z, w = im.width * sc, h = im.height * sc;
      let x = W / 2 - cx * w, y = H / 2 - cy * h;
      x = Math.min(0, Math.max(W - w, x)); y = Math.min(0, Math.max(H - h, y));
      g.globalAlpha = alpha; g.drawImage(im, x, y, w, h); g.globalAlpha = 1;
    }
    function frame(now) {
      if (finished) return;
      if (!start) start = now;
      let e = now - t0, s = shots[i];
      if (e >= s.dur) { next(); if (finished) return; e = now - t0; s = shots[i]; }
      const k = clamp(e / s.dur);
      g.fillStyle = s.bg || '#14120f'; g.fillRect(0, 0, W, H);
      const im = loaded[i];
      if (im) drawImg(im, s, k, clamp(e / 600));
      // önceki kare yavaşça söner (geçiş)
      if (i > 0 && e < 600 && loaded[i - 1] && shots[i - 1].img) drawImg(loaded[i - 1], shots[i - 1], 1, 1 - e / 600);
      if (s.draw) { g.save(); try { s.draw(g, e * FAST, W, H, k); } catch (err) { /* animasyon hatası sahneyi durdurmasın */ } g.restore(); }
      // eski film: kenar karartma ve gren
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,250,235,.035)'; for (let n = 0; n < 60; n++) g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
      if (Math.random() < 0.04) { g.fillStyle = 'rgba(255,250,235,.06)'; g.fillRect(Math.random() * W, 0, 1, H); }
      // geniş ekran bantları
      const bh = Math.max(28, H * 0.09); g.fillStyle = '#000'; g.fillRect(0, 0, W, bh); g.fillRect(0, H - bh, W, bh);
      // alt yazı: daktilo gibi
      if (shown !== i) { shown = i; typed = 0; cap.textContent = ''; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
      const txt = capText(), want = Math.min(txt.length, Math.floor(e / (18 / FAST)));
      if (want !== typed) { typed = want; cap.textContent = txt.slice(0, typed); }
      el.querySelector('.cine-credit').style.opacity = im && s.img ? 0.8 : 0;
      bar.style.width = clamp((shots.slice(0, i).reduce((a, x) => a + x.dur, 0) + e) / total) * 100 + '%';
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    active = { finish };
    return active;
  }
  // küçük çizim yardımcıları (kodla çizilen animasyonlar için)
  const fx = {
    birds(g, t, W, H, n, o = {}) { g.strokeStyle = o.col || 'rgba(30,30,40,.85)'; g.lineWidth = o.lw || 1.6; g.lineCap = 'round'; for (let i = 0; i < n; i++) { const ph = i * 1.37, x = ((i * 97.3 + t * (o.v || 0.06)) % (W + 80)) - 40, y = (o.y || H * 0.3) + Math.sin(ph + t * 0.0012) * (o.spread || H * 0.12) * ((i % 7) / 7), w = Math.sin(t * 0.02 + ph) * 3, s = o.s || 1; g.beginPath(); g.moveTo(x - 5 * s, y - w * s); g.quadraticCurveTo(x - 2 * s, y, x, y); g.quadraticCurveTo(x + 2 * s, y, x + 5 * s, y - w * s); g.stroke(); } },
    stamp(g, W, H, text, k, o = {}) { const a = clamp(k * 3) * (o.fade === false ? 1 : 1 - clamp((k - 0.85) * 6)); g.save(); g.globalAlpha = a; g.translate(o.x || W * 0.5, o.y || H * 0.5); g.rotate(o.rot || -0.08); g.font = `${o.fs || Math.min(W, H) * 0.09}px "Patrick Hand", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = o.col || 'rgba(230,220,200,.95)'; g.fillText(text, 0, 0); g.restore(); },
    counter(g, W, H, from, to, k, o = {}) { const v = Math.round(from * Math.pow(to / from, ease(clamp(k)))); g.save(); g.font = `${o.fs || Math.min(W, H) * 0.12}px "Patrick Hand", sans-serif`; g.textAlign = 'center'; g.fillStyle = o.col || '#f4ecd8'; g.fillText((o.prefix || '') + v.toLocaleString('tr-TR') + (o.suffix || ''), o.x || W / 2, o.y || H / 2); g.restore(); },
  };
  window.Cinema = { play, fx, seen };
})();
