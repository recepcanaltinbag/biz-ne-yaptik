// "Gerçekte ne oldu?" sayfasını resimli, adım adım bir hikâyeye çevirir.
// Her <li> bir kart olur (ilk <b> yıl, kalanı metin), "Ama…" kutusu son karttır.
// Görsel: <li data-img> (sitede barındırılan arşiv fotoğrafı, toon.js ile baskı görünümü) ya da kodla çizilen kart:
// <li data-ic="🦅" data-big="417 → 71.000" data-sub="kel kartal çifti">. Her kart kendi görselini taşır; aynı foto tekrar etmez.
// İkisi de yoksa yalnız ilk kart <article data-img> fotoğrafını kullanır.
(() => {
  'use strict';
  function build(paper) {
    const list = paper.querySelector('ul.facts'); if (!list || paper.querySelector('.story')) return;
    const items = [...list.querySelectorAll('li')].map((li, i) => {
      const b = li.querySelector('b'), year = b ? b.textContent : '';
      const tmp = li.cloneNode(true); const bb = tmp.querySelector('b'); if (bb) bb.remove();
      return { year, html: tmp.innerHTML.trim(), ill: li.dataset.ic ? { ic: li.dataset.ic, big: li.dataset.big || '', sub: li.dataset.sub || '' } : null, img: li.dataset.img || (!li.dataset.ic && i === 0 ? paper.dataset.img : ''), pos: li.dataset.pos || ['30% 40%', '70% 55%', '50% 30%'][i % 3] };
    });
    const call = paper.querySelector('.callout');
    if (call) items.push({ year: '', html: call.innerHTML, ill: call.dataset.ic ? { ic: call.dataset.ic, big: call.dataset.big || '', sub: call.dataset.sub || '' } : null, img: call.dataset.img || '', pos: '50% 70%', but: true });
    const st = document.createElement('div'); st.className = 'story';
    st.innerHTML = `<div class="story-stage"></div><div class="story-nav"><button type="button" class="hbtn sm story-prev">← Geri</button><span class="story-dots"></span><button type="button" class="hbtn sm story-next">İleri →</button></div><button type="button" class="story-all">Hepsini liste olarak oku</button>`;
    list.before(st); list.style.display = 'none'; if (call) call.style.display = 'none';
    const next = paper.querySelector('[data-next], .end-nav');
    const stage = st.querySelector('.story-stage'), dots = st.querySelector('.story-dots');
    items.forEach((it, i) => {
      const c = document.createElement('div'); c.className = 'story-card' + (it.but ? ' but' : '') + (it.ill || it.img ? ' has-vis' : '') + (it.ill ? ' ill v' + (i % 4) : '');
      const vis = it.ill ? `<div class="ph ill"><div class="ill-ic">${it.ill.ic}</div><div class="ill-big">${it.ill.big}</div><div class="ill-sub">${it.ill.sub}</div></div>` : `<div class="ph" style="background-position:${it.pos}"></div>`;
      c.innerHTML = `${vis}<div class="tx">${it.year ? `<div class="yr">${it.year}</div>` : ''}<p>${it.html}</p></div>`;
      stage.appendChild(c);
      const ph = c.querySelector('.ph');
      if (it.img) { ph.style.backgroundImage = `url("${it.img}")`; if (window.Toon) window.Toon.process(it.img, { maxW: 900 }).then(u => { ph.style.backgroundImage = `url("${u}")`; }).catch(() => {}); }
      const d = document.createElement('i'); dots.appendChild(d);
    });
    let k = 0;
    const show = j => {
      k = Math.max(0, Math.min(items.length - 1, j));
      [...stage.children].forEach((c, i) => c.classList.toggle('on', i === k));
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i <= k));
      st.querySelector('.story-prev').disabled = k === 0;
      const last = k === items.length - 1;
      st.querySelector('.story-next').hidden = last;
      if (next) next.classList.toggle('story-wait', !last);
    };
    st.querySelector('.story-prev').onclick = () => show(k - 1);
    st.querySelector('.story-next').onclick = () => show(k + 1);
    stage.addEventListener('click', () => show(k + 1));
    st.querySelector('.story-all').onclick = () => { st.style.display = 'none'; st.hidden = true; list.style.display = ''; if (call) call.style.display = ''; if (next) next.classList.remove('story-wait'); };
    // ok tuşları hikâyede gezinir (bölüm slaytını değiştirmeden)
    addEventListener('keydown', e => {
      if (st.hidden || !paper.closest('.slide.active')) return;
      if (e.key === 'ArrowRight' && k < items.length - 1) { e.stopImmediatePropagation(); show(k + 1); }
      else if (e.key === 'ArrowLeft' && k > 0) { e.stopImmediatePropagation(); show(k - 1); }
    }, true);
    show(0);
  }
  function init() { document.querySelectorAll('.slide[data-mode="facts"] .paper').forEach(build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
