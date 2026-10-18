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
    { id: 'pla-musluk', ch: 'plastik', icon: '🚰', name: 'Musluğu kapat', hint: 'Taşan küvette önce paspas aranmaz.',
      fact: 'Okyanusa yılda kabaca 5–13 milyon ton plastik giriyor (Jambeck 2015, 2010 verisi).' },
    { id: 'pla-kaplumbaga', ch: 'plastik', icon: '🐢', name: 'Deniz anası değil', hint: 'Kabuklu dostun midesi hep boş kalsın.',
      fact: 'Deniz kaplumbağaları yüzen poşetleri sık sık deniz anası sanıp yutar.' },
    { id: 'pla-evde', ch: 'plastik', icon: '🏠', name: 'Halının altı yok', hint: 'Kendi çöpün, kendi kapın.',
      fact: '2018\'de Çin atık ithalatını durdurunca Avrupa\'nın plastik atığının büyük kısmı Türkiye\'ye yöneldi.' },
    { id: 'pla-vergi', ch: 'plastik', icon: '🛍️', name: 'Bez çanta', hint: 'Kasada sorulan küçük soru, uzun yıllar sorulsun.',
      fact: 'Türkiye 2019\'da plastik poşeti ücretli yaptı; poşet kullanımı ilk yılda belirgin düştü.' },
    { id: 'pla-sise', ch: 'plastik', icon: '🍾', name: 'Şişe postası', hidden: true,
      fact: 'Kuzey Pasifik\'teki girdap akıntısı yüzen çöpü yıllar içinde ortada toplar.' },
    { id: 'pla-avuc', ch: 'plastik', icon: '🔬', name: 'Bir avuç deniz', hidden: true,
      fact: 'Büyük Pasifik Çöp Alanı\'ndaki parçaların %94\'ü mikroplastiktir.' },
    { id: 'pla-kapl', ch: 'plastik', icon: '🪼', name: 'Yanlış menü', hidden: true,
      fact: 'Plastik yutan hayvan midesi dolu sanar ama aç kalır.' },
    { id: 'pla-ag', ch: 'plastik', icon: '🕸️', name: 'Hayalet avcı', hidden: true,
      fact: 'Çöp alanındaki plastik kütlesinin en az %46\'sı balıkçı ağlarından oluşuyor.' },
    { id: 'guv-gokyuzu', ch: 'guvercin', icon: '🕊️', name: 'Kararan gökyüzü', hint: 'Son yılda da gökyüzü kararsın.',
      fact: 'Audubon 1813\'te bir güvercin sürüsünün üç gün boyunca geçtiğini yazdı.' },
    { id: 'guv-bekci', ch: 'guvercin', icon: '🛡️', name: 'Telgrafa karşı', hint: 'Haber gelince sen de yola çık.',
      fact: 'Avcılar kolonilerin yerini telgrafla öğrenip trenle oraya varıyordu.' },
    { id: 'guv-petoskey', ch: 'guvercin', icon: '🌲', name: 'Petoskey baharı', hint: 'Kuzeyin en büyük yuvası, bir bahar.',
      fact: '1878\'de Petoskey kolonisinde aylarca günde yaklaşık 50.000 güvercin avlandı.' },
    { id: 'guv-orman', ch: 'guvercin', icon: '🌰', name: 'Palamut ağacı', hint: 'Yemişsiz yuva olmaz.',
      fact: 'Güvercinler kayın yemişi ve palamutla beslenirdi; orman kesildikçe yiyecek azaldı.' },
    { id: 'guv-yumurta', ch: 'guvercin', icon: '🥚', name: 'Tek yumurta', hidden: true,
      fact: 'Göçmen güvercin yılda yalnız bir yumurta yapardı.' },
    { id: 'guv-telgraf', ch: 'guvercin', icon: '📨', name: 'Tık tık tık', hidden: true,
      fact: 'Telgraf ve demiryolu, avı bir mevsimlik işten büyük bir sanayiye çevirdi.' },
    { id: 'guv-audubon', ch: 'guvercin', icon: '🎨', name: 'Audubon\'un gözü', hidden: true,
      fact: 'Alexander Wilson 1808\'de tek bir sürüde 2 milyardan fazla kuş olduğunu hesapladı.' },
    { id: 'guv-martha', ch: 'guvercin', icon: '🏛️', name: 'Martha', hidden: true,
      fact: 'Martha, 1 Eylül 1914\'te Cincinnati Hayvanat Bahçesi\'nde öldü; türün son bireyiydi.' },
    { id: 'ozon-kapandi', ch: 'ozon', icon: '🛡️', name: 'Gökyüzünü yamadın', hint: 'Deliği tarihten önce kapat.',
      fact: 'Antarktika\'daki ozon deliğinin 2066 civarında kapanması bekleniyor.' },
    { id: 'ozon-herkes', ch: 'ozon', icon: '🤝', name: 'Yedi imza', hint: 'Masada kimse eksik kalmasın, erkenden.',
      fact: 'Montreal Protokolü, dünyadaki bütün ülkelerin onayladığı ilk anlaşmalardan biri (2009).' },
    { id: 'ozon-fon', ch: 'ozon', icon: '💰', name: 'Adil pay', hint: 'Yoksulun buzdolabını da düşün.',
      fact: '1990\'da kurulan Çok Taraflı Fon, gelişmekte olan ülkelerin CFC\'yi bırakmasına yardım etti.' },
    { id: 'ozon-kacak', ch: 'ozon', icon: '🔎', name: 'Kaçağı yakala', hint: 'Gökyüzünü dinlemeyi bırakma.',
      fact: '2018\'de havada beklenmedik CFC-11 bulundu ve kaynağı Çin\'in doğusuna kadar izlendi.' },
    { id: 'ozon-klor', ch: 'ozon', icon: '🧪', name: 'Tek bir klor', hidden: true,
      fact: 'Stratosferdeki tek bir klor atomu, ortadan kalkmadan önce binlerce ozon molekülünü yıkabilir.' },
    { id: 'ozon-sapka', ch: 'ozon', icon: '👒', name: 'Şapka ve gözlük', hidden: true,
      fact: '1987\'de bir ABD bakanının "şapka ve gözlük takın" önerisi gazetelerde alay konusu oldu.' },
    { id: 'ozon-molina', ch: 'ozon', icon: '🏅', name: 'Molina ve Rowland', hidden: true,
      fact: 'Molina, Rowland ve Crutzen 1995\'te Nobel Kimya Ödülü\'nü aldı.' },
    { id: 'ozon-penguen', ch: 'ozon', icon: '🐧', name: 'Kutupta bahar', hidden: true,
      fact: 'Ozon deliği her yıl Güney Yarımküre\'nin ilkbaharında, eylül–ekimde en büyük hâline gelir.' },
    { id: 'tav-hedef', ch: 'tavsan', icon: '🐇', name: 'Gri halı toplandı', hint: 'Üç hedef birden, son yılda.',
      fact: 'Tavşanlar Avustralya\'ya yılda yaklaşık 100 km hızla yayıldı.' },
    { id: 'tav-otlak', ch: 'tavsan', icon: '🌾', name: 'Yeşil otlak', hint: 'Koyunlar son yılda tok olsun.',
      fact: 'Tavşanların çıplak bıraktığı topraklar 1930\'ların kuraklığında toz fırtınalarıyla uçtu.' },
    { id: 'tav-bilbi', ch: 'tavsan', icon: '🦘', name: 'Yerlilerin dostu', hint: 'Zehir seçmez; sen seç.',
      fact: 'Tavşanlar bilbi gibi yerli hayvanların yuvasını ve yiyeceğini kaptı; zehir onları da öldürdü.' },
    { id: 'tav-cit', ch: 'tavsan', icon: '🧱', name: 'Vaktinde çit', hint: 'Çit, cepheden önce gelir.',
      fact: 'Batı Avustralya\'nın tavşan çiti 1907\'de bittiğinde tavşanlar çoktan karşıya geçmişti.' },
    { id: 'tav-austin', ch: 'tavsan', icon: '🎩', name: 'Biraz av, biraz memleket', hidden: true,
      fact: 'Thomas Austin tavşanları 1859\'da avlanmak için saldı.' },
    { id: 'tav-yuva', ch: 'tavsan', icon: '🕳️', name: 'Yuva söküm', hidden: true,
      fact: 'Tek bir tavşan yuvası onlarca tünel ve yüzlerce tavşan barındırabilir; söküm en etkili yöntemlerden biridir.' },
    { id: 'tav-bilbi-dost', ch: 'tavsan', icon: '🐭', name: 'Kulaklı yerli', hidden: true,
      fact: 'Avustralya\'da Paskalya\'da tavşan yerine çikolata bilbi satılıyor: istilacıya karşı yerli bir kahraman.' },
    { id: 'tav-pire', ch: 'tavsan', icon: '🪳', name: 'Pire postası', hidden: true,
      fact: 'Avrupa tavşan piresi 1960\'ların sonunda virüsü kurak iç bölgelere taşımak için getirildi.' },
  ];

  // rozet madalyonları: bölüm fotoğrafından (çizgi film filtresiyle) rozete özel bir kesit + renkli çerçeve + simge
  // fotoğraflar sitede barındırılır; yol, bu betiğin adresine göre çözülür (ana sayfa ve bölüm sayfaları için aynı)
  const BASE = new URL('../img/cards/', (document.currentScript && document.currentScript.src) || location.href).href;
  const IMG = { S: BASE + 'kill-bird-and-insect.jpg', K: BASE + 'cane-toad-bufo-marinus.jpg', A: BASE + 'moynaq-aral-sea-6226807306.jpg', D: BASE + 'statelibqld-2-162299-cloud-spraying-for-mosquitos-at-norman-.jpg', B: BASE + 'antibiotic-susceptibility-disk-diffusion.jpg', P: BASE + 'plastic-pollution-in-santa-luzia-cape-verde.jpg', G: BASE + 'passenger-pigeon-net-cockburn-1829.jpg', O: BASE + 'hole-in-the-ozone-layer-over-antarctica-gpn-2002-000117.jpg', T: BASE + 'csiro-scienceimage-2232-releasing-the-myxoma-virus-for-rabbi.jpg' };
  const ART = {"serce-dost": ["S", "50% 12%", 230, "#7fb069"], "serce-durust": ["S", "25% 55%", 260, "#e0b04a"], "serce-vicdan": ["S", "75% 35%", 250, "#6aa6c9"], "serce-bolluk": ["S", "50% 92%", 220, "#d9a441"], "serce-gozluk": ["S", "85% 8%", 300, "#f08a4b"], "serce-defter": ["S", "15% 30%", 280, "#9a7bd1"], "serce-rock": ["S", "60% 65%", 320, "#d0587e"], "serce-rekor": ["S", "35% 85%", 300, "#8a6fd8"], "kurbaga-yok": ["K", "30% 40%", 260, "#c96a5a"], "kurbaga-kakadu": ["K", "70% 55%", 240, "#7fb069"], "kurbaga-hedef": ["K", "50% 30%", 300, "#e0b04a"], "kurbaga-bilim": ["K", "20% 70%", 280, "#6aa6c9"], "kurbaga-tasmanya": ["K", "85% 20%", 320, "#5f9fb5"], "kurbaga-gemi": ["K", "10% 15%", 300, "#7d74d4"], "kurbaga-otostop": ["K", "60% 85%", 280, "#c98a4b"], "kurbaga-bacak": ["K", "90% 80%", 260, "#a46fd0"], "aral-deniz": ["A", "80% 30%", 230, "#5b93b8"], "aral-balik": ["A", "20% 50%", 260, "#6d8fa0"], "aral-plan": ["A", "50% 80%", 240, "#7fb069"], "aral-kokaral": ["A", "65% 20%", 280, "#e0b04a"], "aral-deve": ["A", "35% 70%", 300, "#c49a6c"], "aral-gemi": ["A", "50% 50%", 320, "#8a6fd8"], "aral-tuz": ["A", "10% 85%", 300, "#b9a98a"], "aral-sibirya": ["A", "90% 60%", 280, "#a46fd0"], "ddt-kartal": ["D", "70% 30%", 240, "#7a5a3a"], "ddt-carson": ["D", "20% 60%", 260, "#5a7a5a"], "ddt-hasat": ["D", "50% 85%", 230, "#c0302a"], "ddt-erken": ["D", "85% 70%", 280, "#e0b04a"], "ddt-afis": ["D", "30% 20%", 300, "#c0503a"], "ddt-yumurta": ["D", "60% 50%", 320, "#d8d2c0"], "ddt-sinek": ["D", "10% 40%", 300, "#8a6fd8"], "ddt-kamyon": ["D", "90% 15%", 280, "#3a6a4a"], "bak-basari": ["B", "50% 50%", 230, "#4f7a4a"], "bak-yedek": ["B", "20% 30%", 260, "#5a6470"], "bak-dengeli": ["B", "80% 70%", 250, "#e0b04a"], "bak-fleming": ["B", "30% 80%", 280, "#3e9696"], "bak-kuf": ["B", "70% 20%", 300, "#7aa85a"], "bak-mikroskop": ["B", "50% 40%", 340, "#8a6fd8"], "bak-grip": ["B", "10% 60%", 300, "#7aa7d6"], "bak-tavuk": ["B", "90% 40%", 280, "#c0503a"], "pla-musluk": ["P", "50% 50%", 230, "#3a8adc"], "pla-kaplumbaga": ["P", "20% 70%", 260, "#4f9a7a"], "pla-evde": ["P", "80% 30%", 250, "#c49a6c"], "pla-vergi": ["P", "30% 20%", 280, "#e0b04a"], "pla-sise": ["P", "70% 80%", 300, "#7aa7d6"], "pla-avuc": ["P", "50% 30%", 340, "#8a6fd8"], "pla-kapl": ["P", "10% 50%", 300, "#7ac0a0"], "pla-ag": ["P", "90% 60%", 280, "#3a7a6a"], "guv-gokyuzu": ["G", "50% 20%", 230, "#6a7fb0"], "guv-bekci": ["G", "30% 60%", 260, "#4f7a5a"], "guv-petoskey": ["G", "70% 40%", 250, "#3a6a4a"], "guv-orman": ["G", "20% 80%", 280, "#8a6a3a"], "guv-yumurta": ["G", "60% 70%", 320, "#e0d8c0"], "guv-telgraf": ["G", "85% 30%", 300, "#e0b04a"], "guv-audubon": ["G", "40% 15%", 300, "#8a6fd8"], "guv-martha": ["G", "50% 50%", 340, "#7a6a9a"], "ozon-kapandi": ["O", "50% 50%", 230, "#5a8ad0"], "ozon-herkes": ["O", "30% 40%", 260, "#4f9a7a"], "ozon-fon": ["O", "70% 60%", 250, "#e0b04a"], "ozon-kacak": ["O", "20% 70%", 280, "#c0503a"], "ozon-klor": ["O", "60% 30%", 320, "#7ac070"], "ozon-sapka": ["O", "80% 20%", 300, "#e8dcc0"], "ozon-molina": ["O", "40% 80%", 300, "#8a6fd8"], "ozon-penguen": ["O", "50% 40%", 340, "#16233a"], "tav-hedef": ["T", "50% 50%", 230, "#9a7a5a"], "tav-otlak": ["T", "30% 70%", 260, "#7ab060"], "tav-bilbi": ["T", "70% 40%", 250, "#c08a4a"], "tav-cit": ["T", "20% 30%", 280, "#7a8a9a"], "tav-austin": ["T", "60% 20%", 300, "#5a6a4a"], "tav-yuva": ["T", "40% 80%", 320, "#6a5038"], "tav-bilbi-dost": ["T", "80% 60%", 300, "#9a8a9a"], "tav-pire": ["T", "50% 30%", 340, "#8a5ac0"]};
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
    // oyundaysa kaydırıcı panelinin ve ipucu balonunun üstünde dursun (hiçbir şeyi örtmesin)
    const pnl = document.querySelector('.slide.active[data-mode="game"] .gpanel');
    if (pnl) { box.style.top = 'auto'; box.style.bottom = (innerHeight - pnl.getBoundingClientRect().top + 48) + 'px'; } else { box.style.top = ''; box.style.bottom = ''; }
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
