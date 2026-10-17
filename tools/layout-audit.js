// Düzen denetimi: her bölümün her slaytını 4 ekran boyutunda açar ve pencereden taşan öğeleri listeler.
// Kullanım: yerel sunucuda (python3 -m http.server 8790) ana sayfayı aç, bu dosyanın içeriğini tarayıcı konsoluna yapıştır
// ya da bir otomasyon aracıyla çalıştır. Bölümlerin ?debug modunda window.__dbg.go(mod) sunması gerekir.
(async () => {
  const CHAPTERS = ['serce', 'kurbaga', 'aral', 'ddt', 'bakteri', 'plastik'];
  const SIZES = [[1440, 900], [1024, 768], [375, 812], [360, 640]];
  const MODES = ['title', 'game', 'result', 'sandbox', 'facts', 'lessons'];
  const out = [];
  const f = document.createElement('iframe'); document.body.appendChild(f);
  for (const ch of CHAPTERS) for (const [w, h] of SIZES) {
    f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;z-index:99999;opacity:0.01`;
    f.src = `/chapters/${ch}/?debug&t=${Date.now()}`;
    await new Promise(r => (f.onload = r)); await new Promise(r => setTimeout(r, 400));
    const W = f.contentWindow, d = f.contentDocument;
    if (!W.__dbg || !W.__dbg.go) { out.push(`${ch}: ?debug kancası yok`); continue; }
    for (const m of MODES) {
      W.__dbg.go(m); await new Promise(r => setTimeout(r, 250));
      const s = d.querySelector('.slide.active'), scroll = s.classList.contains('scroll'), bad = [];
      if (d.documentElement.scrollWidth > w + 1) bad.push('yatay taşma ' + d.documentElement.scrollWidth);
      if (s.scrollHeight > h + 1) bad.push((scroll ? 'kayan sayfa ' : 'dikey taşma ') + s.scrollHeight);
      s.querySelectorAll('*').forEach(e => {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
        const cs = W.getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || e.closest('[hidden]') || e.closest('details:not([open])')) return;
        if (r.right > w + 2 || r.left < -2) bad.push('x:' + (e.id || e.className || e.tagName));
        if (!scroll && (r.bottom > h + 2 || r.top < -2)) bad.push('y:' + (e.id || e.className || e.tagName));
      });
      if (bad.length) out.push(`${ch} ${w}x${h} ${m}: ${[...new Set(bad)].slice(0, 5).join(' | ')}`);
    }
  }
  f.remove();
  console.log(out.length ? out.join('\n') : 'Düzen denetimi: sorun yok');
  return out;
})();
