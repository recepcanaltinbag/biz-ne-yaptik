// Fotoğrafları sitenin "baskı / çizgi film" diline çevirir: doygunluk azaltma, posterize, mürekkep kenarları.
// SVG filtresi yerine canvas kullanılır; böylece her tarayıcıda (Safari dahil) aynı ve kaymasız görünür.
(() => {
  'use strict';
  const LEVELS = [
    [0.14, 0.32, 0.52, 0.72, 0.88, 0.97],
    [0.18, 0.36, 0.56, 0.75, 0.90, 0.98],
    [0.14, 0.30, 0.48, 0.66, 0.82, 0.92],
  ];
  const INK = [44, 59, 46];
  const cache = new Map();

  function load(url) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = url;
    });
  }

  function boxBlur(src, w, h) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, l = x ? i - 1 : i, r = x < w - 1 ? i + 1 : i;
      tmp[i] = (src[l] + src[i] + src[r]) / 3;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, u = y ? i - w : i, d = y < h - 1 ? i + w : i;
      out[i] = (tmp[u] + tmp[i] + tmp[d]) / 3;
    }
    return out;
  }

  async function process(url, opt = {}) {
    const key = url + (opt.soft ? '|s' : '');
    if (cache.has(key)) return cache.get(key);
    const p = (async () => {
      const img = await load(url);
      const maxW = opt.maxW || 640, k = Math.min(1, maxW / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d'); g.drawImage(img, 0, 0, w, h);
      const im = g.getImageData(0, 0, w, h), d = im.data, n = w * h;
      const gray = new Float32Array(n);
      for (let i = 0; i < n; i++) gray[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
      let edge = null;
      if (!opt.soft) {
        const b = boxBlur(boxBlur(gray, w, h), w, h);
        edge = new Float32Array(n);
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          const e = 8 * b[i] - b[i - 1] - b[i + 1] - b[i - w] - b[i + w] - b[i - w - 1] - b[i - w + 1] - b[i + w - 1] - b[i + w + 1];
          edge[i] = Math.max(0, Math.min(1, 15 * e - 0.5));
        }
      }
      for (let i = 0; i < n; i++) {
        const gr = gray[i];
        for (let c = 0; c < 3; c++) {
          let v = d[i * 4 + c] / 255;
          v = gr + (v - gr) * 0.7;                                   // doygunluğu azalt
          const L = LEVELS[c];
          v = L[Math.min(L.length - 1, Math.max(0, Math.floor(v * L.length)))]; // posterize
          v = (v - 0.5) * 1.12 + 0.5;                                // kontrast
          if (edge) v = v * (1 - edge[i]) + (INK[c] / 255) * edge[i]; // mürekkep çizgisi
          d[i * 4 + c] = Math.max(0, Math.min(255, v * 255));
        }
      }
      g.putImageData(im, 0, 0);
      return cv.toDataURL('image/jpeg', 0.86);
    })();
    cache.set(key, p);
    p.catch(() => cache.delete(key));
    return p;
  }

  // <img data-toon> öğelerini görünür olduklarında işler; aslı alttaki görselde kalır (üzerine gelince görünür)
  function apply(root = document) {
    const imgs = [...root.querySelectorAll('img[data-toon]')];
    const run = img => {
      if (img.dataset.done) return; img.dataset.done = '1';
      process(img.dataset.toon || img.src, { soft: img.hasAttribute('data-soft') }).then(url => {
        const t = document.createElement('img');
        t.className = 'toon-layer ' + (img.className || '');
        t.alt = ''; t.setAttribute('aria-hidden', 'true');
        t.style.cssText = img.style.cssText;
        t.src = url;
        img.after(t);
      }).catch(() => {});
    };
    if (!('IntersectionObserver' in window)) return imgs.forEach(run);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }), { rootMargin: '300px' });
    imgs.forEach(i => io.observe(i));
  }

  window.Toon = { process, apply };
})();
