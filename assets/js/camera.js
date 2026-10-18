// Kamera: sahnede dokunulan yere yumuşak yakınlaşma.
// Ana kanvasın (#world) bir bölgesini, üstüne konan ikinci bir kanvasa büyüterek canlı çizer; bölüm kodu değişmez.
// Bölüm yalnız şunu çağırır: Camera.focus(x, y) (ör. dokunulan karakterin yeri). Dokunmalar yakınken dünya koordinatına çevrilir.
(() => {
  'use strict';
  const world = document.getElementById('world'); if (!world) return;
  const cv = document.createElement('canvas'); cv.className = 'zoomcv'; cv.setAttribute('aria-hidden', 'true');
  world.after(cv);
  const g = cv.getContext('2d');
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'zoom-out'; btn.textContent = '🔍 Uzaklaş'; document.body.appendChild(btn);
  const st = { k: 0, want: 0, cx: 0, cy: 0, tx: 0, ty: 0, z: 1.7, until: 0 };
  const ease = t => t * t * (3 - 2 * t);
  let W = 0, H = 0, dpr = 1;
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; }
  size(); addEventListener('resize', size);
  const inGame = () => !!document.querySelector('.slide.active[data-mode="game"]') && !document.body.classList.contains('fullview') && !document.querySelector('.cine, .spot');
  function view() {
    const z = 1 + (st.z - 1) * ease(st.k), sw = W / z, sh = H / z;
    const sx = Math.max(0, Math.min(W - sw, st.cx - sw / 2)), sy = Math.max(0, Math.min(H - sh, st.cy - sh * 0.55));
    return { z, sx, sy, sw, sh };
  }
  function focus(x, y, o = {}) {
    if (!inGame()) return;
    if (st.want === 0) { st.cx = x; st.cy = y; }
    st.tx = x; st.ty = y; st.want = 1; st.z = o.z || (W < 760 ? 1.55 : 1.75); st.until = performance.now() + (o.ms || 6500);
  }
  function out() { st.want = 0; }
  btn.onclick = e => { e.stopPropagation(); out(); };
  // yakınken dokunma: ekran koordinatını dünya koordinatına çevirip yeniden gönder
  world.addEventListener('pointerdown', e => {
    if (e.__cam || st.k < 0.5) return;
    e.stopImmediatePropagation();
    const v = view(), wx = v.sx + e.clientX / v.z, wy = v.sy + e.clientY / v.z;
    const ev = new PointerEvent('pointerdown', { clientX: wx, clientY: wy, bubbles: true, pointerId: e.pointerId, pointerType: e.pointerType });
    ev.__cam = true; world.dispatchEvent(ev);
    st.until = performance.now() + 6500;
  }, true);
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    if (st.want && (performance.now() > st.until || !inGame())) st.want = 0;
    st.k += (st.want - st.k) * (1 - Math.pow(0.9, dt / 16));
    if (Math.abs(st.k - st.want) < 0.002) st.k = st.want;
    st.cx += (st.tx - st.cx) * (1 - Math.pow(0.92, dt / 16)); st.cy += (st.ty - st.cy) * (1 - Math.pow(0.92, dt / 16));
    const on = st.k > 0.003;
    cv.style.display = on ? 'block' : 'none'; btn.classList.toggle('on', st.k > 0.4 && st.want === 1);
    if (on) {
      const v = view();
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      try { g.drawImage(world, v.sx * dpr, v.sy * dpr, v.sw * dpr, v.sh * dpr, 0, 0, W * dpr, H * dpr); } catch (err) { /* ilk karede boyut yoksa */ }
      // kenarlarda hafif karartma: odak hissi
      const vg = g.createRadialGradient(W / 2 * dpr, H / 2 * dpr, Math.min(W, H) * 0.35 * dpr, W / 2 * dpr, H / 2 * dpr, Math.max(W, H) * 0.75 * dpr);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(20,20,10,${0.25 * st.k})`); g.fillStyle = vg; g.fillRect(0, 0, cv.width, cv.height);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.Camera = { focus, out, get active() { return st.k > 0.5; } };
})();
