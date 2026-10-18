// Kamera: sahnede dokunulan yere yumuşak yakınlaşma.
// Ana kanvası (#world) CSS dönüşümüyle büyütür (ekran kartında, kopyalama yok); bölüm kodu değişmez.
// Bölüm yalnız şunu çağırır: Camera.focus(x, y) (ör. dokunulan karakterin yeri). Yakınken dokunmalar dünya koordinatına çevrilir.
(() => {
  'use strict';
  const world = document.getElementById('world'); if (!world) return;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'zoom-out'; btn.textContent = '🔍 Uzaklaş'; document.body.appendChild(btn);
  const st = { k: 0, want: 0, cx: 0, cy: 0, tx: 0, ty: 0, z: 1.7, until: 0 };
  const ease = t => t * t * (3 - 2 * t);
  world.style.transformOrigin = '0 0';
  const inGame = () => !!document.querySelector('.slide.active[data-mode="game"]') && !document.body.classList.contains('fullview') && !document.querySelector('.cine, .spot, .toast.pause:not(.out), #modal:not([hidden]), .milestone:not([hidden]), #harvest:not([hidden])');
  function view() {
    const W = innerWidth, H = innerHeight, z = 1 + (st.z - 1) * ease(st.k), sw = W / z, sh = H / z;
    const sx = Math.max(0, Math.min(W - sw, st.cx - sw / 2)), sy = Math.max(0, Math.min(H - sh, st.cy - sh * 0.55));
    return { z, sx, sy };
  }
  function focus(x, y, o = {}) {
    if (!inGame()) return;
    if (st.want === 0 && st.k < 0.05) { st.cx = x; st.cy = y; }
    st.tx = x; st.ty = y; st.want = 1; st.z = o.z || (innerWidth < 760 ? 1.55 : 1.75); st.until = performance.now() + (o.ms || 6500);
  }
  function out() { st.want = 0; }
  btn.onclick = e => { e.stopPropagation(); out(); };
  // yakınken dokunma: ekran koordinatını dünya koordinatına çevirip yeniden gönder
  world.addEventListener('pointerdown', e => {
    if (e.__cam || st.k < 0.02) return;
    e.stopImmediatePropagation();
    const v = view(), wx = v.sx + e.clientX / v.z, wy = v.sy + e.clientY / v.z;
    const ev = new PointerEvent('pointerdown', { clientX: wx, clientY: wy, bubbles: true, pointerId: e.pointerId, pointerType: e.pointerType });
    ev.__cam = true; world.dispatchEvent(ev);
    st.until = performance.now() + 6500;
  }, true);
  let last = performance.now(), applied = '';
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    if (st.want && (now > st.until || !inGame())) st.want = 0;
    st.k += (st.want - st.k) * (1 - Math.pow(0.9, dt / 16));
    if (Math.abs(st.k - st.want) < 0.002) st.k = st.want;
    st.cx += (st.tx - st.cx) * (1 - Math.pow(0.92, dt / 16)); st.cy += (st.ty - st.cy) * (1 - Math.pow(0.92, dt / 16));
    const v = view(), tf = st.k > 0.002 ? `translate(${(-v.sx * v.z).toFixed(1)}px, ${(-v.sy * v.z).toFixed(1)}px) scale(${v.z.toFixed(4)})` : '';
    if (tf !== applied) { world.style.transform = tf; applied = tf; }
    btn.classList.toggle('on', st.k > 0.4 && st.want === 1);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.Camera = { focus, out, get active() { return st.k > 0.5; } };
})();
