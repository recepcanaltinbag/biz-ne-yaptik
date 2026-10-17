// Bölümlerin ortak sahne yardımcıları
// - SceneUtils.avoidHud(x, y, w, h): baloncuk/etiket sol üstteki gösterge panelinin altına girmesin
// - SceneUtils.lineChart(canvas, series, n, opts): her çizginin ucunda adı ve değeri, altta yıl ekseni
(() => {
  'use strict';
  let hud = null, hudAt = 0;
  function hudRect() {
    const now = performance.now();
    if (now - hudAt > 250) {
      hudAt = now;
      const el = document.querySelector('.slide.active[data-mode="game"] .gp-hud');
      hud = el ? el.getBoundingClientRect() : null;
      if (hud && (!hud.width || !hud.height)) hud = null;
    }
    return hud;
  }
  function avoidHud(x, y, w, h) {
    const r = hudRect();
    if (!r) return { x, y };
    const hit = x < r.right + 6 && x + w > r.left - 6 && y < r.bottom + 6 && y + h > r.top - 6;
    if (!hit) return { x, y };
    if (r.right + 10 + w < window.innerWidth - 8) return { x: r.right + 10, y };
    return { x, y: r.bottom + 10 };
  }

  // series: [{ data: [0..1], color, label?, dash?, fmt? }] · opts: { y0, step, unit }
  function lineChart(c, series, n, opts = {}) {
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const labels = series.some(s => s.label);
    const padL = 8, padR = labels ? Math.min(150, w * 0.38) : 10, padT = 10, padB = (opts.y0 || opts.xLabel) ? 18 : 10;
    const X = i => padL + (i / Math.max(1, n - 1)) * (w - padL - padR), Y = v => padT + (1 - Math.max(0, Math.min(1, v))) * (h - padT - padB);
    // yıl ekseni
    g.strokeStyle = 'rgba(43,58,46,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(43,58,46,.6)'; g.font = '11px Inter, sans-serif'; g.textAlign = 'center';
    const step = opts.step || 10, y0 = opts.y0;
    for (let i = 0; i < n; i++) {
      const yr = y0 !== undefined ? y0 + i : null;
      const lab = opts.xLabel ? opts.xLabel(i) : null;
      const tick = opts.xLabel ? lab !== null : yr !== null ? yr % step === 0 : i % step === 0 && i > 0;
      if (!tick) continue;
      g.beginPath(); g.moveTo(X(i), padT); g.lineTo(X(i), h - padB); g.stroke();
      if (lab !== null && lab !== undefined) g.fillText(String(lab), X(i), h - 4); else if (yr !== null) g.fillText(String(yr), X(i), h - 4);
    }
    g.textAlign = 'left';
    // çizgiler
    const ends = [];
    series.forEach(s => {
      if (!s.data.length) return;
      g.strokeStyle = s.color; g.lineWidth = s.dash ? 1.8 : 3; g.lineJoin = 'round'; g.lineCap = 'round';
      g.setLineDash(s.dash ? [5, 5] : []);
      g.beginPath(); s.data.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke();
      if (s.label) {
        const i = s.data.length - 1, v = s.data[i];
        g.setLineDash([]); g.fillStyle = s.color; g.beginPath(); g.arc(X(i), Y(v), 3.5, 0, 6.283); g.fill();
        ends.push({ y: Y(v), text: s.label + (s.fmt ? ' ' + s.fmt(v, i) : ''), color: s.color, x: X(i) });
      }
    });
    g.setLineDash([]);
    // uç etiketleri: üst üste binmesin diye aralarına yer açılır
    ends.sort((a, b) => a.y - b.y);
    for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 13) ends[k].y = ends[k - 1].y + 13;
    const over = ends.length ? ends[ends.length - 1].y - (h - padB) : 0;
    if (over > 0) ends.forEach(e => { e.y -= over; });
    g.font = '600 11.5px Inter, sans-serif';
    const lx = w - padR + 8;
    ends.forEach(e => {
      g.strokeStyle = e.color; g.lineWidth = 1; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(e.x + 4, e.y); g.lineTo(lx - 3, e.y); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = e.color; g.fillText(e.text, lx, e.y + 4);
    });
  }
  // telefonda da durdurulabilsin: yıl çubuğundaki hız düğmelerinin yanına bir duraklat düğmesi
  function addPause() {
    const sp = document.getElementById('yb-speed'), gp = document.getElementById('g-pause');
    if (!sp || !gp || sp.querySelector('.yb-pause')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'yb-pause'; b.textContent = '❚❚'; b.setAttribute('aria-label', 'Durdur / devam');
    b.onclick = e => { e.stopPropagation(); gp.click(); };
    sp.appendChild(b);
    new MutationObserver(() => { b.textContent = /Devam/.test(gp.textContent) ? '▶' : '❚❚'; b.classList.toggle('on', /Devam/.test(gp.textContent)); }).observe(gp, { childList: true, characterData: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPause); else addPause();
  window.SceneUtils = { avoidHud, lineChart };
})();
