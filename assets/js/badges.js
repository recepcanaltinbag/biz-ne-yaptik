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
    { id: 'serce-bolluk', ch: 'serce', icon: '🌾', name: 'Bolluk yılları', hint: 'Tarla üç yıl da cömert olsun.',
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
      fact: 'Kurbağa gelmeden önce "tat tiksinmesi" eğitimi alan kuzey kedileri kurbağaya daha az saldırdı ve daha uzun yaşadı.' },
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
    // --- Çöle Dönen Deniz ---
    { id: 'aral-deniz', ch: 'aral', icon: '🌊', name: 'Deniz yaşıyor', hint: 'Martılar hâlâ dalgaya konabilsin.',
      fact: '1960\'ta Aral 68.000 km² idi: Van Gölü\'nün 18 katı.' },
    { id: 'aral-balik', ch: 'aral', icon: '🐟', name: 'Balıkçının dostu', hint: 'Konserve fabrikasının bacası hiç sönmesin.',
      fact: '1960\'ta Aral\'da yılda 40.000 tonu aşkın balık tutuluyordu.' },
    { id: 'aral-plan', ch: 'aral', icon: '🔧', name: 'Hem pamuk hem deniz', hint: 'Kurak yılı önceden gören, gölü de korur.',
      fact: 'Bazı tahminlere göre Orta Asya\'da sulama suyunun yarısı tarlaya ulaşmadan kayboluyordu.' },
    { id: 'aral-kokaral', ch: 'aral', icon: '🧱', name: 'Kuzey\'in umudu', hint: 'Küçük bir set, büyük bir umut.',
      fact: 'Gerçekte Kokaral seti 2005\'te bitti; birkaç yılda Kuzey Aral\'ın tuzu azaldı ve balıklar geri döndü.' },
    { id: 'aral-deve', ch: 'aral', icon: '🐫', name: 'Çölün gemisi', hidden: true,
      fact: 'Aralkum, dünyanın en genç çöllerinden biri: yarım asırdan kısa sürede oluştu.' },
    { id: 'aral-gemi', ch: 'aral', icon: '⚓', name: 'Gemi mezarlığı', hidden: true,
      fact: 'Moynak\'taki gemiler bir zamanlar limanda yüzüyordu. Bugün en yakın su onlarca kilometre ötede.' },
    { id: 'aral-tuz', ch: 'aral', icon: '🧂', name: 'Son balık', hidden: true,
      fact: '2010\'larda Güney Aral\'ın suyu okyanustan üç kat daha tuzluydu.' },
    { id: 'aral-sibirya', ch: 'aral', icon: '🗺️', name: 'Hayal projesi', hidden: true,
      fact: 'Sibirya nehirlerini Orta Asya\'ya çevirme projesi 1986\'da iptal edildi.' },
    // --- Kuşlar Neden Sustu? ---
    { id: 'ddt-kartal', ch: 'ddt', icon: '🦅', name: 'Kartallar uçuyor', hint: 'Gökyüzünün kralları tahttan inmesin.',
      fact: 'ABD\'de 1963\'te 417 kel kartal çifti kalmıştı; 2020\'de 71.000\'den fazla çift vardı.' },
    { id: 'ddt-carson', ch: 'ddt', icon: '📖', name: 'Carson\'ı dinle', hint: 'Bazen bir kitap bir fabrikadan güçlüdür.',
      fact: 'Rachel Carson\'ın Sessiz Bahar\'ı 1962\'de çıktı ve ABD\'de çevre hareketini başlattı.' },
    { id: 'ddt-hasat', ch: 'ddt', icon: '🐞', name: 'İlaçsız bolluk', hint: 'Uğur böceği de bir çiftçidir.',
      fact: 'Bir uğur böceği hayatı boyunca binlerce yaprak biti yiyebilir.' },
    { id: 'ddt-erken', ch: 'ddt', icon: '⏳', name: 'Yasayı bekleme', hint: 'Bazı kararlar yasayı beklemez.',
      fact: 'ABD 1972\'de, Türkiye 1980\'lerde DDT\'yi tarımda yasakladı.' },
    { id: 'ddt-afis', ch: 'ddt', icon: '📰', name: 'Eski reklam', hidden: true,
      fact: '1947\'de bir dergi reklamı "DDT benim için iyidir!" diyordu.' },
    { id: 'ddt-yumurta', ch: 'ddt', icon: '🥚', name: 'İnce kabuk', hidden: true,
      fact: 'Ratcliffe 1967\'de yırtıcı kuş yumurtalarının 1947\'den sonra belirgin biçimde inceldiğini gösterdi.' },
    { id: 'ddt-sinek', ch: 'ddt', icon: '🦟', name: 'Dirençli sinek', hidden: true,
      fact: 'DDT\'ye dirençli karasinekler daha 1940\'ların sonunda görülmüştü.' },
    { id: 'ddt-kamyon', ch: 'ddt', icon: '🚚', name: 'Sis kamyonu', hidden: true,
      fact: '1940\'lar ve 50\'lerde çocuklar sokaklarda ilaç sisi püskürten kamyonların arkasından koşardı.' },
    // --- Bakterilerin İntikamı ---
    { id: 'bak-basari', ch: 'bakteri', icon: '✅', name: 'Hâlâ işe yarıyor', hint: 'Son yılda da ilaçlar işini yapsın.',
      fact: '2019\'da dünyada 1,27 milyon ölüm doğrudan ilaca dirençli bakterilere bağlandı.' },
    { id: 'bak-yedek', ch: 'bakteri', icon: '🔒', name: 'Yedek lastik', hint: 'En iyi kılıç kınında saklanır.',
      fact: 'Bazı antibiyotikler "son çare" olarak yalnız başka ilaç işe yaramadığında kullanılır.' },
    { id: 'bak-dengeli', ch: 'bakteri', icon: '⚖️', name: 'Ne eksik ne fazla', hint: 'Ne eksik ne fazla.',
      fact: 'Soğuk algınlığı ve grip virüslerle olur; antibiyotik onlara etki etmez.' },
    { id: 'bak-fleming', ch: 'bakteri', icon: '🧪', name: 'Fleming\'i dinle', hint: 'Eczane tezgâhı her derde deva değildir.',
      fact: 'Fleming 1945\'te, ilacı kendi kendine az kullananların mikroplarını dirençli yapacağını söyledi.' },
    { id: 'bak-kuf', ch: 'bakteri', icon: '🍞', name: 'Küflü ekmek', hidden: true,
      fact: 'Fleming 1928\'de, küf bulaşmış bir kapta bakterilerin öldüğünü fark etti: Penicillium.' },
    { id: 'bak-mikroskop', ch: 'bakteri', icon: '🔬', name: 'Yakın bakış', hidden: true,
      fact: 'Bazı bakteriler uygun koşulda yaklaşık 20 dakikada ikiye bölünebilir.' },
    { id: 'bak-grip', ch: 'bakteri', icon: '🤧', name: 'Nezle virüsü', hidden: true,
      fact: 'Antibiyotik virüsü öldürmez; ama vücuttaki bakterilere direnç kazandırabilir.' },
    { id: 'bak-tavuk', ch: 'bakteri', icon: '🐔', name: 'Tavuk da alıyor', hidden: true,
      fact: 'Dünyada satılan antimikrobiyallerin yaklaşık dörtte üçü çiftlik hayvanlarında kullanılıyor.' },
  ];

  // rozet madalyonları: bölüm fotoğrafından (çizgi film filtresiyle) rozete özel bir kesit + renkli çerçeve + simge
  // fotoğraflar sitede barındırılır; yol, bu betiğin adresine göre çözülür (ana sayfa ve bölüm sayfaları için aynı)
  const BASE = new URL('../img/cards/', (document.currentScript && document.currentScript.src) || location.href).href;
  const IMG = { S: BASE + 'kill-bird-and-insect.jpg', K: BASE + 'cane-toad-bufo-marinus.jpg', A: BASE + 'moynaq-aral-sea-6226807306.jpg', D: BASE + 'statelibqld-2-162299-cloud-spraying-for-mosquitos-at-norman-.jpg', B: BASE + 'antibiotic-susceptibility-disk-diffusion.jpg' };
  const ART = {"serce-dost": ["S", "50% 12%", 230, "#7fb069"], "serce-durust": ["S", "25% 55%", 260, "#e0b04a"], "serce-vicdan": ["S", "75% 35%", 250, "#6aa6c9"], "serce-bolluk": ["S", "50% 92%", 220, "#d9a441"], "serce-gozluk": ["S", "85% 8%", 300, "#f08a4b"], "serce-defter": ["S", "15% 30%", 280, "#9a7bd1"], "serce-rock": ["S", "60% 65%", 320, "#d0587e"], "serce-rekor": ["S", "35% 85%", 300, "#8a6fd8"], "kurbaga-yok": ["K", "30% 40%", 260, "#c96a5a"], "kurbaga-kakadu": ["K", "70% 55%", 240, "#7fb069"], "kurbaga-hedef": ["K", "50% 30%", 300, "#e0b04a"], "kurbaga-bilim": ["K", "20% 70%", 280, "#6aa6c9"], "kurbaga-tasmanya": ["K", "85% 20%", 320, "#5f9fb5"], "kurbaga-gemi": ["K", "10% 15%", 300, "#7d74d4"], "kurbaga-otostop": ["K", "60% 85%", 280, "#c98a4b"], "kurbaga-bacak": ["K", "90% 80%", 260, "#a46fd0"], "aral-deniz": ["A", "80% 30%", 230, "#5b93b8"], "aral-balik": ["A", "20% 50%", 260, "#6d8fa0"], "aral-plan": ["A", "50% 80%", 240, "#7fb069"], "aral-kokaral": ["A", "65% 20%", 280, "#e0b04a"], "aral-deve": ["A", "35% 70%", 300, "#c49a6c"], "aral-gemi": ["A", "50% 50%", 320, "#8a6fd8"], "aral-tuz": ["A", "10% 85%", 300, "#b9a98a"], "aral-sibirya": ["A", "90% 60%", 280, "#a46fd0"], "ddt-kartal": ["D", "70% 30%", 240, "#7a5a3a"], "ddt-carson": ["D", "20% 60%", 260, "#5a7a5a"], "ddt-hasat": ["D", "50% 85%", 230, "#c0302a"], "ddt-erken": ["D", "85% 70%", 280, "#e0b04a"], "ddt-afis": ["D", "30% 20%", 300, "#c0503a"], "ddt-yumurta": ["D", "60% 50%", 320, "#d8d2c0"], "ddt-sinek": ["D", "10% 40%", 300, "#8a6fd8"], "ddt-kamyon": ["D", "90% 15%", 280, "#3a6a4a"], "bak-basari": ["B", "50% 50%", 230, "#4f7a4a"], "bak-yedek": ["B", "20% 30%", 260, "#5a6470"], "bak-dengeli": ["B", "80% 70%", 250, "#e0b04a"], "bak-fleming": ["B", "30% 80%", 280, "#3e9696"], "bak-kuf": ["B", "70% 20%", 300, "#7aa85a"], "bak-mikroskop": ["B", "50% 40%", 340, "#8a6fd8"], "bak-grip": ["B", "10% 60%", 300, "#7aa7d6"], "bak-tavuk": ["B", "90% 40%", 280, "#c0503a"]};
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
