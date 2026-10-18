// test kancası: ?e2e ile, gizli pencerede de karelerin akması için requestAnimationFrame zamanlayıcıyla sürülür
if (/[?&]e2e\b/.test(location.search)) {
  // tek bekleyen zamanlayıcı: kareler yavaşlayınca zamanlayıcılar birikmesin
  const ch = new MessageChannel(); let q = [], pending = false;
  ch.port1.onmessage = () => { pending = false; const l = q; q = []; const t = performance.now(); l.forEach(f => f(t)); };
  window.requestAnimationFrame = f => { q.push(f); if (!pending) { pending = true; setTimeout(() => ch.port2.postMessage(0), 16); } return 1; };
}
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
  // sahne etiketleri ekrandaki kutuların altına girmesin: sol HUD, yıl çubuğu, haber bandı, kartlar, alttaki panel
  let obsT = 0, obs = [];
  function obstacles() {
    const now = performance.now(); if (now - obsT < 120) return obs; obsT = now;
    const sel = ['.slide.active .yearbar', '.ticker', '.slide.active #toasts .toast:not(.out)'];
    const list = []; const hr = hudRect(); if (hr) list.push(hr);
    sel.forEach(q => document.querySelectorAll(q).forEach(el => { if (q === '.ticker' && !el.textContent) return; const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) list.push(r); }));
    obs = list; return obs;
  }
  // test için: bu karede yerleştirilen kanvas etiketleri (e2e çakışma denetimi okur)
  const placed = []; let placedT = 0;
  function place(x, y, w, h) { placedT = performance.now(); placed.push([x, y, w, h]); }
  function avoidHud(x, y, w, h) {
    if (performance.now() - placedT > 6) placed.length = 0; // yeni kare: önceki karenin etiketleri sayılmaz
    const list = obstacles().concat(placed.map(p => ({ left: p[0], top: p[1], right: p[0] + p[2], bottom: p[1] + p[3] }))), pad = 6, maxY = (() => { const p = document.querySelector('.slide.active .gpanel'); return p ? p.getBoundingClientRect().top - h - 4 : innerHeight - h - 4; })();
    for (let pass = 0; pass < 5; pass++) {
      const r = list.find(r => x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad && r.top < maxY + h);
      if (!r) { const out = { x, y: Math.min(y, Math.max(0, maxY)) }; place(out.x, out.y, w, h); return out; }
      if (r.bottom + pad <= maxY) y = r.bottom + pad;           // önce aşağı kay
      else if (r.right + pad + w < innerWidth - 8) x = r.right + pad; // sığmazsa sağa
      else if (r.left - pad - w > 8) x = r.left - pad - w;       // ya da sola
      else return { x, y };
    }
    return { x, y };
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
  // kişisel rekor: sonuç ekranında "en iyi sonucun" ve "bu sefer"; yalnız tamamlanan oyunlar sayılır
  function bestLine(id, score, label, ok = true) {
    const key = 'bny-rekor-' + id;
    let best = null; try { best = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    const now = Math.round(score), rec = ok && (!best || now > best.score);
    if (rec) { try { localStorage.setItem(key, JSON.stringify({ score: now, date: new Date().toISOString().slice(0, 10) })); } catch (e) {} }
    const d = b => b.date.split('-').reverse().join('.');
    if (!ok) return best ? `<p class="best-line">🏆 En iyi ${label}: <b>%${best.score}</b> (${d(best)})</p>` : '';
    if (!best) return `<p class="best-line first">🏆 İlk rekorun: ${label} <b>%${now}</b>. Tekrar oyna, geçebilir misin?</p>`;
    if (rec) return `<p class="best-line new">🎉 Yeni rekor! ${label}: <b>%${now}</b> (önceki: %${best.score})</p>`;
    return `<p class="best-line">🏆 En iyi ${label}: <b>%${best.score}</b> (${d(best)}) · bu sefer: %${now}</p>`;
  }
  // Türkçe yıl eki: yilEk(2059, 'de') → "2059'da", yilEk(1903, 'den') → "1903'ten"; okunuşun son sesine göre
  function yilEk(n, ek = 'de') {
    const x = Math.abs(Math.round(n)), o = x % 10, t = Math.floor(x / 10) % 10, h = Math.floor(x / 100) % 10;
    const word = o ? ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'][o] : t ? ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'][t] : h ? 'yüz' : 'bin';
    const vow = [...word].reverse().find(c => 'aeıioöuü'.includes(c)), back = 'aıou'.includes(vow), hard = 'çfhkpsşt'.includes(word[word.length - 1]);
    const base = { de: back ? 'da' : 'de', den: back ? 'dan' : 'den' }[ek] || ek;
    return `${n}'${hard ? base.replace('d', 't') : base}`;
  }
  // yol gösterici: HUD'da tek satır "şimdi ne yapmalı?"; metin değişince kısa bir parlama
  let advLast = '';
  function advise(text, tone) {
    const el = document.getElementById('g-adv'); if (!el) return;
    if (text === advLast) return; advLast = text;
    el.innerHTML = text ? '💡 ' + text : ''; el.hidden = !text;
    el.className = 'adv' + (tone ? ' ' + tone : '');
    el.classList.remove('flash'); void el.offsetWidth; if (text) el.classList.add('flash');
  }
  // "Ne olur?" önizlemesi: kaydırıcı oynayınca birkaç yıl sonrası önce → sonra; panelin hemen üstünde
  let prevEl = null, prevT = 0;
  function preview(html, tone) {
    if (!prevEl) { prevEl = document.createElement('div'); prevEl.className = 'prev'; document.body.appendChild(prevEl); }
    const pnl = document.querySelector('.slide.active .gpanel');
    if (!pnl || !html) { prevEl.classList.remove('on'); return; }
    const r = pnl.getBoundingClientRect();
    prevEl.innerHTML = html; prevEl.className = 'prev on' + (tone ? ' ' + tone : '');
    prevEl.style.bottom = (innerHeight - r.top + 8) + 'px';
    clearTimeout(prevT); prevT = setTimeout(() => prevEl.classList.remove('on'), 6500);
  }
  // kaydırıcıya bağla: oynamaya başlamadan önceki ayarı saklar, bırakınca sim(eski, yeni) çağrılır
  function watchSliders(inputs, getPolicy, sim) {
    let before = null, t = 0;
    inputs.forEach(el => {
      const grab = () => { if (!before) before = JSON.parse(JSON.stringify(getPolicy())); };
      el.addEventListener('pointerdown', grab); el.addEventListener('keydown', grab); el.addEventListener('focus', grab);
      el.addEventListener('input', () => { grab(); clearTimeout(t); t = setTimeout(() => { const now = JSON.parse(JSON.stringify(getPolicy())); try { const out = sim(before, now); if (out) preview(out.html, out.tone); } catch (e) {} before = null; }, 450); });
    });
  }
  // spot ışığı turu: ekran kararır, yalnız gösterilen yer açık kalır; dokun → sonraki adım
  // steps: [{ el: '#g-view' | Element, rect: () => [x, y, w, h], text, pad }]
  function tour(steps, done) {
    const ov = document.createElement('div'); ov.className = 'spot';
    ov.innerHTML = '<div class="spot-hole"></div><div class="spot-tip"><span></span><small>dokun: devam</small></div><button type="button" class="spot-skip">Geç ⏭</button>';
    document.body.appendChild(ov);
    const hole = ov.querySelector('.spot-hole'), tip = ov.querySelector('.spot-tip'), txt = tip.querySelector('span');
    let i = -1, raf = 0, over = false;
    const rectOf = st => { if (st.rect) return st.rect(); const el = typeof st.el === 'string' ? document.querySelector(st.el) : st.el; if (!el) return null; const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
    function place() {
      if (over) return;
      const st = steps[i]; const r = rectOf(st);
      if (r && r[2] > 0) {
        const pad = st.pad === undefined ? 8 : st.pad, x = r[0] - pad, y = r[1] - pad, w = r[2] + pad * 2, h = r[3] + pad * 2;
        Object.assign(hole.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: (st.round || 14) + 'px' });
        const below = y + h + 120 < innerHeight, tw = Math.min(340, innerWidth - 24);
        tip.style.width = tw + 'px'; tip.style.left = Math.max(12, Math.min(innerWidth - tw - 12, x + w / 2 - tw / 2)) + 'px';
        tip.style.top = below ? (y + h + 14) + 'px' : Math.max(12, y - tip.offsetHeight - 14) + 'px';
      }
      raf = requestAnimationFrame(place);
    }
    function next() { i++; if (i >= steps.length) return end(); txt.innerHTML = steps[i].text; tip.classList.remove('in'); void tip.offsetWidth; tip.classList.add('in'); if (steps[i].onShow) steps[i].onShow(); }
    function end() { if (over) return; over = true; cancelAnimationFrame(raf); ov.classList.add('out'); setTimeout(() => ov.remove(), 300); if (done) done(); }
    ov.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target.closest('.spot-skip')) end(); else next(); });
    next(); raf = requestAnimationFrame(place);
    if (/[?&](hizli|e2e)\b/.test(location.search)) setTimeout(end, 600);
  }
  // atmosfer: eski yıllar sepya ve grenli (eski fotoğraf gibi), sonra renk gelir; kriz büyüdükçe kenarlar kararır, hafif kızarır
  function atmo(g, W, H, o = {}) {
    const y = o.year || 2000, old = Math.max(0, Math.min(1, (1960 - y) / 90)), bad = Math.max(0, Math.min(1, o.bad || 0));
    if (old > 0.01) {
      g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = `rgba(160,130,90,${0.55 * old})`; g.fillRect(0, 0, W, H); g.restore();
      g.fillStyle = `rgba(255,248,230,${0.05 * old})`; for (let n = 0; n < 50 * old; n++) g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
      if (Math.random() < 0.05 * old) { g.fillStyle = `rgba(60,50,40,${0.12 * old})`; g.fillRect(Math.random() * W, 0, 1, H); }
    }
    const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(${Math.round(40 + 60 * bad)},20,15,${0.12 + 0.3 * bad + 0.12 * old})`);
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  // on yıl geçişi: büyük yarı saydam "1950'ler" ve tek satır manşet; oyunu durdurmaz
  let decEl = null, decLast = 0;
  function decade(y, line) {
    const d = Math.floor(y / 10) * 10; if (d === decLast) return; decLast = d;
    if (!decEl) { decEl = document.createElement('div'); decEl.className = 'decade'; document.body.appendChild(decEl); }
    const suf = yilEk(d, 'de').slice(String(d).length + 1).replace(/^d/, 'l').replace(/^t/, 'l').replace(/a$/, 'ar').replace(/e$/, 'er');
    decEl.innerHTML = `<b>${d}'${suf}</b>${line ? `<span>${line}</span>` : ''}`;
    decEl.classList.remove('on'); void decEl.offsetWidth; decEl.classList.add('on');
  }
  function decadeReset() { decLast = 0; }
  // haber bandı: durdurmayan haberler kart yerine yıl çubuğunun altında tek satır manşet olur
  let tickEl = null, tickT = 0, tickI = 0;
  // yıl çubuğu ve içindeki her şeyin (hız, harita düğmesi) birleşik kutusunun altı; telefonda bant bu genişliğe sığar
  function tickPos() {
    const yb = document.querySelector('.slide.active .yearbar'); if (!yb || !tickEl) return;
    let r = yb.getBoundingClientRect(), L = r.left, R = r.right, B = r.bottom;
    yb.querySelectorAll('*').forEach(el => { const q = el.getBoundingClientRect(); if (q.width && q.height) { L = Math.min(L, q.left); R = Math.max(R, q.right); B = Math.max(B, q.bottom); } });
    tickEl.style.top = (B + 4) + 'px'; tickEl.style.left = ((L + R) / 2) + 'px'; tickEl.style.maxWidth = innerWidth < 760 ? Math.max(140, R - L) + 'px' : '';
  }
  function ticker(ic, from, html, tone, ms) {
    const yb = document.querySelector('.slide.active .yearbar'); if (!yb) return false;
    if (!tickEl) { tickEl = document.createElement('div'); tickEl.className = 'ticker'; tickEl.setAttribute('aria-live', 'polite'); document.body.appendChild(tickEl); }
    // yıl çubuğunun hemen altında, ortasına hizalı
    tickPos(); clearInterval(tickI); tickI = setInterval(() => { if (tickEl.classList.contains('on')) tickPos(); else clearInterval(tickI); }, 250);
    let plain = String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const first = plain.match(/^.*?[.!?](\s|$)/); if (first && first[0].length > 24) plain = first[0].trim();
    if (plain.length > 96) plain = plain.slice(0, 93).replace(/\s+\S*$/, '') + '…';
    tickEl.innerHTML = `<span class="ic">${ic}</span><span class="tx">${plain}</span>`;
    tickEl.className = 'ticker on ' + (tone || ''); tickEl.title = from || '';
    clearTimeout(tickT); tickT = setTimeout(() => tickEl && tickEl.classList.remove('on'), Math.max(ms || 0, readMs(plain, 6000) / (/[?&](hizli|e2e)\b/.test(location.search) ? 8 : 1)));
    return true;
  }
  // tam ekran görünüm (harita, zincir, kutup, mikroskop) açıkken HUD söner; görünüm yıl çubuğunun altından başlar
  let fvOn = false;
  function fullView(on) { on = !!on; if (on === fvOn) return; fvOn = on; document.body.classList.toggle('fullview', on); }
  function viewTop(min = 96) { const yb = document.querySelector('.slide.active .yearbar'); const r = yb && yb.getBoundingClientRect(); return Math.max(min, r && r.height ? r.bottom + 10 : min); }
  // okuma süresi: saniyede ~12 karakter + 1,5 sn nefes (çocuk okuru için)
  const readMs = (text, min = 4000) => Math.max(min, 1500 + String(text || '').replace(/<[^>]+>/g, '').length * 83);
  // 📼 önce tarih: tarihteki ayarlarla hızlı film; haber çıkınca okunacak kadar yavaşlar; sonra geri sarılır
  // o: { n, ms, yearAt(i), news: { yıl: [ikon, metin] }, onIndex(i | null), card: () => [ikon, kimden, metin], showCard(ikon, kimden, metin, then), then }
  function replay(o) {
    const sls = [...document.querySelectorAll('.slide.active .gpanel .sl')]; sls.forEach(el => el.classList.add('replaying'));
    const b = document.createElement('div'); b.className = 'rbanner'; b.innerHTML = '<span>📼 <b>Önce tarih:</b> gerçekte ne oldu? (hızlı)</span><button type="button">Geç ⏭</button>';
    document.body.appendChild(b);
    const pnl = document.querySelector('.slide.active .gpanel'); if (pnl) b.style.bottom = (innerHeight - pnl.getBoundingClientRect().top + 10) + 'px';
    const FASTK = /[?&](hizli|e2e)\b/.test(location.search) ? 8 : 1;
    let i = 0, phase = 'play', hold = 0, endHold = 0, rw = 0, from = 0, last = performance.now(), done = false, lastY = o.yearAt(0) - 1;
    const step = o.ms / o.n;
    b.querySelector('button').onclick = () => { if (phase === 'play') { phase = 'rewind'; from = i; rw = 0; b.querySelector('span').innerHTML = '⏪ <b>Geri sarılıyor…</b>'; } };
    function tick(now) {
      if (done) return;
      const dt = Math.max(0, Math.min(50, now - last)); last = now;
      if (phase === 'play') {
        if (hold > 0) hold -= dt * FASTK;
        else {
          i = Math.max(0, Math.min(o.n - 1, i + dt / step)); const y = o.yearAt(Math.floor(i));
          for (let yy = lastY + 1; yy <= y; yy++) if (o.news && o.news[yy]) { const [ic, tx] = o.news[yy], text = `${yy}: ${tx}`, ms = readMs(text, 3500); ticker(ic, 'Tarih', text, 'warn', ms / FASTK); hold = ms * 0.8; }
          lastY = y;
          if (i >= o.n - 1) { endHold += dt * FASTK; if (endHold > 1500) { phase = 'rewind'; from = i; rw = 0; b.querySelector('span').innerHTML = '⏪ <b>Geri sarılıyor…</b>'; } }
        }
        o.onIndex(Math.floor(i));
      } else {
        rw += dt * FASTK; const k = Math.min(1, rw / 1500); i = from * (1 - k); o.onIndex(Math.floor(i));
        if (k >= 1) {
          done = true; b.remove(); sls.forEach(el => el.classList.remove('replaying')); o.onIndex(null);
          const [ic, fr, tx] = o.card(); o.showCard(ic, fr, tx, o.then); return;
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  window.SceneUtils = { readMs, replay, placed, fullView, viewTop, avoidHud, lineChart, bestLine, yilEk, advise, preview, watchSliders, tour, atmo, decade, decadeReset, ticker };
})();
