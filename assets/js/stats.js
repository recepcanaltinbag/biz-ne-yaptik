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
