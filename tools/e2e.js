// Uçtan uca duman testi: her bölümü ?debug&hizli&sessiz ile açar, kartları/kararları otomatik geçer,
// oyunu sonuna kadar oynatır; JS hatalarını, takılmaları ve sonuç ekranını raporlar.
// Kullanım (yerel sunucuda ana sayfa açıkken): eval(await (await fetch('/tools/e2e.js')).text()); sonra window.__e2e okunur.
window.__e2e = { done: false, log: [] };
(async () => {
  const CH = window.E2E_CHAPTERS || ['serce', 'kurbaga', 'aral', 'ddt', 'bakteri', 'plastik', 'guvercin', 'ozon', 'tavsan'];
  const STRATS = window.E2E_STRATS || ['pick0', 'pickLast'];
  const R = window.__e2e;
  for (const ch of CH) for (const strat of STRATS) {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:0;top:0;width:${window.E2E_W || 1024}px;height:${window.E2E_H || 768}px;border:0;z-index:99999;opacity:0.01`;
    document.body.appendChild(f);
    f.src = `/chapters/${ch}/?debug&hizli&sessiz&e2e&t=${Date.now()}`;
    await new Promise(r => (f.onload = r));
    const W = f.contentWindow, d = f.contentDocument, errs = [];
    W.addEventListener('error', e => errs.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
    W.addEventListener('unhandledrejection', e => errs.push('promise: ' + e.reason));
    const ce = W.console.error.bind(W.console); W.console.error = (...a) => { errs.push('console: ' + a.map(String).join(' ').slice(0, 160)); ce(...a); };
    await new Promise(r => setTimeout(r, 300));
    W.__dbg.go('game');
    let lastY = null, stuck = 0, t0 = Date.now(), choices = 0, tick = 0; const overlaps = new Set();
    const yearOf = () => (d.getElementById('yb-year') || {}).textContent + '|' + ((d.getElementById('yb-fill') || { style: {} }).style.width || '');
    while (Date.now() - t0 < 240000) {
      d.querySelectorAll('.mission button, .toast.pause .go').forEach(b => b.click());
      d.querySelectorAll('#harvest:not([hidden]), #milestone:not([hidden])').forEach(hv => hv.dispatchEvent(new W.PointerEvent('pointerdown', { bubbles: true })));
      const opts = d.querySelectorAll('#modal:not([hidden]) .opt');
      if (opts.length) { (strat === 'pick0' ? opts[0] : opts[opts.length - 1]).click(); choices++; }
      if (W.__dbg.mode === 'result') break;
      // üst üste binme denetimi: görünen arayüz öğeleri birbirinin üstüne geçmesin
      if (++tick % 8 === 0) {
        const SEL = ['.yb-year', '.yb-sub', '.yb-track', '.yb-harvest', '.yb-speed', '.yb-view', '.ticker.on', '.toast:not(.out)', '.gp-hud', '.adv:not([hidden])', '.gpanel .sl', '.coach-tip', '.prev.on'];
        const els = SEL.flatMap(q => [...d.querySelectorAll(q)].map(el => [q, el])).filter(([, el]) => { const r = el.getBoundingClientRect(), cs = W.getComputedStyle(el); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && +cs.opacity > 0.2 && !el.closest('[hidden]'); });
        for (let a = 0; a < els.length; a++) for (let b = a + 1; b < els.length; b++) {
          const [qa, A] = els[a], [qb, B] = els[b]; if (A.contains(B) || B.contains(A) || qa === qb || (qa + qb).match(/yb-year.*yb-sub|yb-sub.*yb-year/)) continue;
          const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
          const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ox > 4 && oy > 4) overlaps.add(qa + ' × ' + qb);
        }
        // kanvas etiketleri: birbirleriyle ve yıl çubuğu / bant / kartlarla
        const P = (W.SceneUtils && W.SceneUtils.placed) ? W.SceneUtils.placed.slice() : [];
        const dom = els.filter(([q]) => /yb-|ticker|toast|gp-hud|adv/.test(q)).map(([q, el]) => [q, el.getBoundingClientRect()]);
        const hit = (a, b) => Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]) > 4 && Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]) > 4;
        for (let i = 0; i < P.length; i++) { for (let j = i + 1; j < P.length; j++) if (hit(P[i], P[j])) overlaps.add('etiket × etiket'); dom.forEach(([q, r]) => { if (hit(P[i], [r.left, r.top, r.width, r.height])) overlaps.add('etiket × ' + q); }); }
      }
      const y = yearOf();
      if (y === lastY) stuck++; else { stuck = 0; lastY = y; }
      if (stuck > 100) { errs.push('takıldı: yıl ' + y + ' state=' + JSON.stringify({ st: W.__dbg.game && W.__dbg.game.state, rd: W.__dbg.game && W.__dbg.game.reading, story: W.__dbg.game && W.__dbg.game.story, paused: W.__dbg.game && W.__dbg.game.paused, toasts: d.querySelectorAll('.toast:not(.out)').length, modal: !d.getElementById('modal').hidden })); break; }
      await new Promise(r => setTimeout(r, 250));
    }
    const res = d.getElementById('result');
    const head = res ? (res.querySelector('h2') || {}).textContent : '';
    const nan = res && /NaN|undefined|Infinity/.test(res.innerText);
    // sonuç → laboratuvar → metin sayfaları
    for (const m of ['sandbox', 'facts', 'lessons']) { try { W.__dbg.go(m); await new Promise(r => setTimeout(r, 600)); } catch (e) { errs.push(m + ': ' + e.message); } }
    const sbNaN = /NaN|undefined/.test((d.querySelector('.sb-stats') || {}).textContent || '');
    R.log.push({ ch, strat, overlaps: [...overlaps], mode: W.__dbg.mode, year: lastY, secs: Math.round((Date.now() - t0) / 1000), choices, result: head, nan, sbNaN, errs: [...new Set(errs)].slice(0, 6) });
    f.remove();
  }
  R.done = true;
})();
