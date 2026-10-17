// Rozetler: her bölümde 4 açık (hedefi görünür) ve 4 kapalı (gizli) rozet.
// Tarayıcının yerel hafızasında saklanır; "rozet kodu" ile başka cihaza taşınabilir.
(() => {
  'use strict';
  const KEY = 'bny-rozetler-v1';
  const DEFS = [
    // --- Serçelere Savaş ---
    { id: 'serce-dost', ch: 'serce', icon: '🕊️', name: 'Serçelerin dostu', hint: 'Gökyüzünde tek bir kanat bile eksilmesin.',
      fact: 'Bir serçe çifti yavru beslerken günde yüzlerce böcek taşıyabilir.' },
    { id: 'serce-durust', ch: 'serce', icon: '📏', name: 'Dürüst bakan', hint: 'Rakamlar şişkin, vicdan rahat olmaz.',
      fact: 'Büyük İleri Atılım\'da şişirilen raporlar yüzünden devlet, aslında olmayan tahılı topladı.' },
    { id: 'serce-vicdan', ch: 'serce', icon: '🧭', name: 'Vicdan', hint: 'Bazen en cesur cevap tek kelimedir.',
      fact: 'Kampanyaya itiraz eden bilim insanları vardı. Kuşbilimci Zheng Zuoxin bunlardan biriydi.' },
    { id: 'serce-bolluk', ch: 'serce', icon: '🌾', name: 'Bolluk yılları', hint: 'Ambarlar üç kez dolup taşsın.',
      fact: 'Serçeler hem tahıl hem böcek yer; denge korunursa tarlanın dostudurlar.' },
    { id: 'serce-gozluk', ch: 'serce', icon: '😎', name: 'Güneş de bıktı', hidden: true,
      fact: 'Tanıklar, durmadan çalan tencereler yüzünden konamayan serçelerin yorgunluktan düştüğünü anlatır.' },
    { id: 'serce-defter', ch: 'serce', icon: '📓', name: 'Zheng\'in defteri', hidden: true,
      fact: 'Kuşbilimciler serçelerin mide içeriğini incelediler: yavru döneminde çoğunlukla böcek yiyorlardı.' },
    { id: 'serce-rock', ch: 'serce', icon: '🎸', name: 'Tencere Rock', hidden: true,
      fact: 'Kampanyada insanlar tencere, gong ve davul çaldı; bazıları çatılara çıkıp bayrak salladı.' },
    { id: 'serce-rekor', ch: 'serce', icon: '📈', name: 'Rakam sihirbazı', hidden: true,
      fact: '1958\'de bazı yerlerde hasat, gerçeğin birkaç katı olarak raporlandı.' },
    // --- Kurtarıcı Kurbağa ---
    { id: 'kurbaga-yok', ch: 'kurbaga', icon: '🚫', name: 'Kurbağasız Avustralya', hint: 'Bazı kasalar hiç açılmasa daha iyi.',
      fact: 'Froggatt\'ın uyarısıyla kurbağa salmaya kısa bir ara verildi, ama 1936\'da yeniden başlandı.' },
    { id: 'kurbaga-kakadu', ch: 'kurbaga', icon: '🐾', name: 'Kakadu\'nun koruyucusu', hint: 'Kuzeydeki küçük aile hikâyenin sonunu görsün.',
      fact: 'Kurbağalar gelmeden önce bazı kuzey kedileri kurbağasız adalara taşınarak korundu.' },
    { id: 'kurbaga-hedef', ch: 'kurbaga', icon: '🎯', name: 'Hedef tuttu', hint: 'Çizginin altına düşme.',
      fact: 'Kurbağalar geldikten sonra bazı yılanlar yaklaşık 70 yılda kurbağadan kaçınmayı öğrendi ya da zehre karşı direnç kazandı.' },
    { id: 'kurbaga-bilim', ch: 'kurbaga', icon: '🧪', name: 'Bilime kulak ver', hint: 'Bilim insanını dinlemenin zamanı vardır.',
      fact: 'Biyolojik kontrol işe yarayabilir, ama önce yöntemin hedef türe gerçekten etki edip etmediği sınanmalı.' },
    { id: 'kurbaga-tasmanya', ch: 'kurbaga', icon: '🏝️', name: 'Soğuk ada', hidden: true,
      fact: 'Tasmanya\'da yerleşmiş kamış kurbağası yok; soğuk iklim ve Bass Boğazı doğal bir engel oluşturuyor.' },
    { id: 'kurbaga-gemi', ch: 'kurbaga', icon: '🚢', name: 'Kaptanın sırrı', hidden: true,
      fact: 'Avustralya\'ya gelen kurbağalar Hawaii\'den getirildi. Hawaii\'ye de 1932\'de Porto Riko\'dan getirilmişlerdi.' },
    { id: 'kurbaga-otostop', ch: 'kurbaga', icon: '🚚', name: 'Otostopçu', hidden: true,
      fact: 'Kurbağalar zaman zaman araçlara ve yüklere saklanarak yeni bölgelere taşındı.' },
    { id: 'kurbaga-bacak', ch: 'kurbaga', icon: '🦵', name: 'Uzun bacaklar', hidden: true,
      fact: 'Yayılma cephesindeki kurbağaların bacakları, arkadakilere göre belirgin şekilde daha uzun.' },
  ];

  // rozet madalyonları: bölüm fotoğrafından (çizgi film filtresiyle) rozete özel bir kesit + renkli çerçeve + simge
  const W = 'https://upload.wikimedia.org/wikipedia/commons/';
  const IMG = { S: W + '6/6f/Kill_bird_and_insect.jpg', K: W + 'thumb/2/2b/Cane_toad_%28Bufo_marinus%29.jpg/960px-Cane_toad_%28Bufo_marinus%29.jpg' };
  const ART = {"serce-dost": ["S", "50% 12%", 230, "#7fb069"], "serce-durust": ["S", "25% 55%", 260, "#e0b04a"], "serce-vicdan": ["S", "75% 35%", 250, "#6aa6c9"], "serce-bolluk": ["S", "50% 92%", 220, "#d9a441"], "serce-gozluk": ["S", "85% 8%", 300, "#f08a4b"], "serce-defter": ["S", "15% 30%", 280, "#9a7bd1"], "serce-rock": ["S", "60% 65%", 320, "#d0587e"], "serce-rekor": ["S", "35% 85%", 300, "#8a6fd8"], "kurbaga-yok": ["K", "30% 40%", 260, "#c96a5a"], "kurbaga-kakadu": ["K", "70% 55%", 240, "#7fb069"], "kurbaga-hedef": ["K", "50% 30%", 300, "#e0b04a"], "kurbaga-bilim": ["K", "20% 70%", 280, "#6aa6c9"], "kurbaga-tasmanya": ["K", "85% 20%", 320, "#5f9fb5"], "kurbaga-gemi": ["K", "10% 15%", 300, "#7d74d4"], "kurbaga-otostop": ["K", "60% 85%", 280, "#c98a4b"], "kurbaga-bacak": ["K", "90% 80%", 260, "#a46fd0"]};
  function medal(def, on) {
    const [im, pos, zoom, ring] = ART[def.id] || ['S', '50% 50%', 200, '#e0b04a'];
    const ic = on ? def.icon : def.hidden ? '?' : '🔒';
    return `<span class="medal ${on ? 'on' : ''} ${def.hidden ? 'secret' : ''}" style="--ring:${ring}"><i class="m-photo" data-src="${IMG[im]}" style="background-position:${pos};background-size:${zoom}%"></i><b class="m-ic">${ic}</b></span>`;
  }
  function paint(root) {
    (root || document).querySelectorAll('.m-photo[data-src]').forEach(el => {
      const src = el.dataset.src; el.removeAttribute('data-src');
      const set = u => { el.style.backgroundImage = `url("${u}")`; };
      if (window.Toon && window.Toon.process) window.Toon.process(src, { maxW: 480 }).then(set, () => set(src)); else set(src);
    });
  }

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const write = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  let got = read();
  const session = [];

  function toastEl() {
    let el = document.getElementById('badge-toast-box');
    if (!el) { el = document.createElement('div'); el.id = 'badge-toast-box'; document.body.appendChild(el); }
    return el;
  }
  function show(def) {
    const box = toastEl();
    const t = document.createElement('div');
    t.className = 'badge-toast' + (def.hidden ? ' secret' : '');
    t.innerHTML = `<div class="bt-ic">${medal(def, true)}</div><div><div class="bt-k">${def.hidden ? 'Gizli rozet bulundu!' : 'Rozet kazanıldı'}</div><div class="bt-n">${def.name}</div><div class="bt-f">🔍 ${def.fact}</div></div>`;
    t.onclick = () => t.remove();
    box.appendChild(t); paint(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 500); }, 7000);
    try { if (window.AudioContext && Badges._ac) Badges._ac(); } catch (e) {}
  }

  const Badges = {
    DEFS, medal, paint,
    has: id => !!got[id],
    award(id) {
      const def = DEFS.find(d => d.id === id);
      if (!def || got[id]) return false;
      got[id] = new Date().toISOString().slice(0, 10); write(got); session.push(id); show(def);
      if (window.Stat) window.Stat.event('rozet-' + id, 'Rozet: ' + def.name);
      return true;
    },
    session: () => session.slice(),
    resetSession: () => { session.length = 0; },
    list: ch => DEFS.filter(d => !ch || d.ch === ch),
    count: ch => { const l = DEFS.filter(d => !ch || d.ch === ch); return [l.filter(d => got[d.id]).length, l.length]; },
    date: id => got[id],
    exportCode: () => btoa(unescape(encodeURIComponent(JSON.stringify(got)))),
    importCode(code) {
      try { const d = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (typeof d !== 'object') return false; got = { ...got, ...d }; write(got); return true; } catch (e) { return false; }
    },
  };
  window.Badges = Badges;
})();
