// Ziyaret sayacı (GoatCounter): çerezsiz, kişisel veri toplamaz.
// CODE boşken hiçbir şey gönderilmez. Yerel geliştirmede (localhost) de sayılmaz.
// Olaylar: bölüme başlama (basla-<bölüm>), bölümü bitirme (bitti-<bölüm>), rozet (rozet-<id>).
(() => {
  'use strict';
  const CODE = 'recepcan'; // GoatCounter kod adı, ör. 'biz-ne-yaptik' → https://biz-ne-yaptik.goatcounter.com
  const pending = [];
  const sent = new Set();
  const Stat = {
    event(path, title) {
      if (!CODE || sent.has(path)) return;
      sent.add(path);
      const gc = window.goatcounter;
      if (gc && gc.count) gc.count({ path, title: title || path, event: true });
      else pending.push([path, title]);
    },
  };
  // herkese açık sayaçlar: GoatCounter ayarlarında "Allow adding visitor counts on your website" açık olmalı.
  // Kapalıysa ya da hata olursa öğe gizli kalır.
  Stat.fill = root => {
    if (!CODE) return;
    (root || document).querySelectorAll('[data-count]').forEach(el => {
      const path = el.dataset.count;
      fetch(`https://${CODE}.goatcounter.com/counter/${encodeURIComponent(path)}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d || !d.count || d.count === '0') return;
          el.textContent = (el.dataset.label || '{n}').replace('{n}', d.count);
          el.hidden = false;
        })
        .catch(() => {});
    });
  };
  document.addEventListener('DOMContentLoaded', () => Stat.fill());
  // tek bir sayıyı getirir: hiç kaydı yoksa 0, sayaç kapalıysa ya da hata olursa null
  Stat.get = (path, start) => {
    if (!CODE) return Promise.resolve(null);
    const q = start ? '?start=' + encodeURIComponent(start) : '';
    return fetch(`https://${CODE}.goatcounter.com/counter/${encodeURIComponent(path)}.json${q}`)
      .then(r => r.status === 404 ? { count: '0' } : r.ok ? r.json() : null)
      .then(d => d ? parseInt(String(d.count).replace(/\D/g, ''), 10) || 0 : null)
      .catch(() => null);
  };
  window.Stat = Stat;
  if (!CODE || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /\.(localhost|test)$/.test(location.hostname)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
  s.onload = () => {
    const tick = () => {
      const gc = window.goatcounter;
      if (!gc || !gc.count) return setTimeout(tick, 300);
      pending.splice(0).forEach(([path, title]) => gc.count({ path, title: title || path, event: true }));
    };
    tick();
  };
  document.head.appendChild(s);
})();
