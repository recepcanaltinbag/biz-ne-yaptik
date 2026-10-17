---
name: ekoloji-oyun-bolumu
description: "Biz Ne Yaptık?" ekoloji oyunu sitesine (~/Documents/ekoloji-oyunu) yeni oynanabilir bölüm eklerken ya da mevcut bölümün oynanışını, akışını, düzenini veya metinlerini düzenlerken kullan. Serçelere Savaş ve Kurtarıcı Kurbağa bölümlerinde kullanıcıyla birlikte oturtulan oynanış, tempo, düzen, ton, karakter, model ve test kurallarını içerir.
---

# Biz Ne Yaptık? · Bölüm yapma rehberi

Bu kurallar kullanıcının geri bildirimleriyle tek tek oturtuldu. Yeni bölümde baştan uygula; sapacaksan kullanıcıya sor.

## Proje
- Kod: `~/Documents/ekoloji-oyunu` · Repo: `recepcanaltinbag/biz-ne-yaptik` · Yayın: https://recepcanaltinbag.github.io/biz-ne-yaptik/ (GitHub Pages, `main` / kök).
- Push keychain'deki HTTPS kimliğiyle çalışır (`GIT_TERMINAL_PROMPT=0 git push`). `gh` oturumu yok.
- Yapı:
  - `assets/css/chapter.css`: bütün bölümlerin ortak stili (slaytlar, HUD, bildirimler, kaydırıcılar, laboratuvar, metin sayfaları).
  - `assets/js/chapters.js`: ana sayfadaki sezon/bölüm kartlarının verisi. Yeni bölüm açılınca `status: 'live', href:` yap.
  - `assets/js/toon.js`: fotoğrafları canvas ile "baskı/çizgi film" görünümüne çevirir (SVG filtresi kullanma, Safari'de kayar).
  - `chapters/<ad>/index.html`, `<ad>.js`, gerekirse `model.js` (node ile test edilebilir, `module.exports` destekli).
  - `ROADMAP.md`: sezonlar ve bölüm fikirleri. Durumu güncelle.
- Her yayından önce bütün `?v=` sürüm parametrelerini artır (tarayıcı önbelleği yüzünden eski CSS ile yeni HTML karışınca sayfa "kayıyor"):
  `V=$(date +%Y%m%d%H%M) && sed -i '' -E "s#\?v=[0-9]+\"#?v=$V\"#g" index.html chapters/*/index.html`

## Üretim süreci (yönetici rolü)
- Ayrıntı: repo kökündeki `PROCESS.md`. Döngü şöyle işler:
  1. seç (sezonlar sırayla);
  2. araştır;
  3. bölüme özgü mekaniği tasarla;
  4. modeli kur ve ayarla;
  5. yap;
  6. kendi kontrol listeni uygula;
  7. yayınla;
  8. testçi oturumu aç (`tools/tester-brief.md`);
  9. raporu ayıkla ve düzelt;
  10. öğrendiğini skill'e yaz;
  11. tekrarla.
- Testçiler `start_session` ile ayrı oturum olarak açılır, her bölüme bir testçi (`use_worktree: false`, salt okur). Kodu yalnız yönetici oturumu değiştirir.
- Bölümler arasında kullanıcıya onay sorulmaz. Kullanıcının araya giren geri bildirimi sıradaki işin önüne geçer.

## Ton ve içerik
- Bir çocuğun anlayacağı kadar basit, bilimi hafife almayan; hafif alaycı ama ciddi. Ağır siyasi jargon kullanma ("sağcı sapma" gibi ifadeler fazla bulundu).
- **Çocuk dili, ama bilimden kopmadan:** cümleler kısa ve anlaşılır olsun. Ama doğru sayılar (ör. 102 kurbağa, 200 milyon, 1,2 milyon km²) ve önemli bilimsel terimler kalsın; terimler parantez içinde ya da tek cümleyle açıklansın ("derisindeki zehir (*bufotoksin*)", "en hızlıların öne geçip çiftleşmesi (*mekânsal ayıklanma*)"). Sadeleştirirken bilgi kaybetme.
- **Bir bölüm, bir mekanizma.** Konuları karıştırma: serçe bölümünde ilaç/pestisit yok (o "Kuşlar Neden Sustu?" bölümünün konusu). Tarihte olmayan aracı oyuna koyma.
- **Doğal Türkçe yaz, çeviri kokmasın.** İngilizceden kalıp aktarma: "birkaç on yılda" (*within a few decades*) yerine "onlarca yılda", "yarım asırda" ya da somut sayı ("70 yıl kadar içinde"). "On yıllarca" yerine "onlarca yıl". Edilgen ve uzun isim tamlamalarından kaçın. Yıl ve özel adlara eki kesmeyle ekle (1889'da, Pekin'in); JS dizesi içinde kesmeyi kaçır (`\'`). Yayından önce bütün görünen metni bir kez "bir Türk çocuğu böyle konuşur mu?" diye oku.
- **Terimleri Türkçe karşılığıyla doğru çevir:** *predator* "yırtıcı" (ya da "yırtıcı hayvan") olur, "avcı" değil. "Avcı" insan avcısını çağrıştırır. *Predatory fish* da "yırtıcı balık" olur. Doğrudan çeviri yapmadan önce kelimenin Türkçede hangi anlamı çağrıştırdığını düşün.
- **Sayının kaynağını kontrol et:** çok paylaşılan bir istatistik bilimsel olmayabilir. Örneğin "bir tişört 2.700 litre su" bir pazarlama kampanyasından çıkmıştır. Onun yerine hakemli bir çalışma kullan (Chapagain ve ark. 2006: bir kilo pamuklu kumaş için ortalama 10.000 litre kadar su).
- **Konuşma balonları da bilimle tutarlı olsun:** bir bireyin bacağı "uzamaz", uzun bacak kuşaklar içinde cephede seçilir. Balon esprili olabilir ama yanlış bilgi vermesin.
- Olgular doğrulanmış olsun. Tartışmalı rakamlar aralıkla verilsin, belirsiz iddialar "belgelenmiş değil" diye işaretlensin. Gerekiyorsa "asıl sebep bu değildi" diye dürüst bir not düş.
- "Gerçekte ne oldu?" kısa olsun: **üç madde** (yıl / sonra / bugün) ve **bir "ama" kutusu**. Uzun paragraf yazma. Madde etiketi solda, metindeki diğer kalın ifadeler satır içinde kalsın (ızgara hücresine bölünmesin).
- "Ne öğrendik?" de öz olsun: **üç tek cümlelik ders kartı**, **"Sen ne yapabilirsin?" için üç tek satırlık öneri**, kaynaklar ve model notu `<details>` içinde katlı.
- Laboratuvar paneli kaydırmasız sığar: kısa ekranlarda açıklama ve lejant gizlenir, telefonda başlık gizlenir, hazır ayarlar tek satırda.
- Başlıklar merak uyandırsın ("Serçelere Savaş", "Kafatası Dağı", "Dans Eden Kediler"). Düz isim ("Bizon") olmasın.
- Dersler bölümünde Türkiye'den örnek ve "sen ne yapabilirsin" kartları olsun.

## Akış
1. Başlık slaytı → **doğrudan oyun.** Ayrı tanıtım slaytı yok.
2. Olaylar oyun akarken **hikâye kartlarıyla** anlatılır. İlk bir iki kart oyunu durdurur ("Devam →"), gerisi akarken gelir.
3. Sonuç (sen ve tarih karşılaştırması, grafik) → Laboratuvar (kaydırıcılı serbest simülasyon) → Gerçekte ne oldu → Dersler ve kaynaklar.
   - Sonuç ekranında üç düğme olur: "↺ Tekrar oyna", "Kendin dene →" ve "☰ Tüm bölümler" (ana sayfaya, `../../#bolumler`). Rozet için tekrar oynayan, bölümden çıkmak isteyen oyuncu buradan geri döner.
- Oyun toplamda **3–4 dakika** sürsün. Sıkıcı dönemler hızlı geçsin, önemli anlarda kısa durulsun.
- Hikâyenin ölçeği değişince **sahne değiştir** (ör. kamış tarlası → Avustralya haritası) ve geçişi bir kartla anlat.

## Bölüme özgü mekanik ve görsel anlatım (kullanıcının özellikle istediği)
- **Her bölüm konusuna özgü yaratıcı bir mekanik içersin.** Yalnız "bir kaydırıcı + kartlar" yetmez. Örnekler:
  - Kurbağa: harita kamerası ve yayılma cephesi.
  - Aral: nehrin bölüşümü, kuşbakışı harita ve uydu görüntüsü.
  - DDT: **nereye** ilaçlanacağı (tarla, bahçe, bataklık). Her yerin bedeli farklı, zehrin nereye gittiğini oyuncu seçer.
  - Bölümü tasarlarken "bu konunun kendine has ikilemi ne, bunu oyuncunun eline nasıl veririm?" diye sor.
- **Bilgiyi yazıyla değil sahnede göster.** Önemli sayılar sahnedeki ilgili nesnenin yanında küçük etiketlerle (`tag()`) durur. Örnekler: "Tarlaya %X · Göle %Y", "Kıyı 30 km uzaklaştı" oku, "Tuz 16 g/L (okyanus 35)", "Av 39.000 ton/yıl", "Kabuk %12 ince", besin zinciri şeridi. Bir kart bir yerden bahsediyorsa o yer sahnede halkayla parlar (`pulseAt`). Kullanıcı "çoğu bilgiyi anlamıyorum, ne oluyor göremiyorum" dedi.
- **Ölçek değiştir:** yerel sahnenin yanında geniş bir bakış olsun (kurbağada harita, Aral'da kuşbakışı havza). Önemli anlarda kendiliğinden ona geçilsin, düğmeyle de açılabilsin. Geçiş yakınlaşma ve uzaklaşmayla yumuşak olsun.
- **Görev kartı:** oyun başlamadan `Mission.show()` ile "Sen / Kontrolün / Hedefin / Dikkat" kartı gösterilir (sayfa başına bir kez). HUD'da sürekli bir "🎯 Hedef" satırı bulunur. Kullanıcı "oyuna girerken ne görevi olduğu anlaşılmıyor" dedi.
- **Dokunma testi:** her karakter için baloncuğun izleyeceği nesnede `x` ve `y` olmalı. Nesneyi `{ get x(), get y() }` ile sar, yoksa baloncuk NaN olur ve karakter "konuşmaz" (Aral'daki işçi hatası).

## Oyuncunun rolü
- **Karakterler eylemi kendileri yapar** (köylüler tencere çalar, yetkili gelir, gönüllüler toplar). Oyuncu **politikayı** kaydırıcılarla yönetir. Doğrudan dokunarak öldürme ya da refleks isteyen mekanik kullanma; "zorladı, içine çekmedi" geri bildirimi geldi.
- En fazla **1–3 kaydırıcı.** Başlangıç değeri sıfır olmasın (ör. %10), sahne ilk saniyede canlı görünsün.
- Seçenekleri **kademeli aç.** Kilitli araç "🔒 1980'de açılır" diye görünür (telefonda gizli). Açılınca durduran bir kartla tanıtılır ve ardından rehber ipucu gösterilir.
- **Rehber ipucu (coach):** kaydırıcı nabız gibi parlar, üstünde "👉 Kaydır: …" balonu çıkar. İlk ipucu oyuncu dokunana kadar kalır, diğerleri ~14 sn kalır. Kritik anlarda (ör. güven düşünce) yeniden gösterilir. Yalnız anlamlıysa göster: kaydırıcı zaten yüksekken "artır" deme.
- İkilemleri **oyun içi bir karakterle karar kartına** dönüştür. Örnek: hasattan sonra devlet yetkilisi gelir ve sorar; seçenekler "Gerçeği yaz / Biraz yuvarla / Rekor yaz!". Kaydırıcı kalabalığından iyidir.
- Bir **baskı ölçeği** kullan (Pekin'in güveni gibi). Ölçek sıfırlanınca kontrol oyuncudan alınır, böylece sistemle ilgili ders oyunun içinde yaşanır.
- Hedef bir eşikse göstergeye **sınır çizgisi** çiz ve güncel yüzdeyi yaz (ör. yerli yırtıcılar çubuğunda %45 çizgisi).
- Net bir **hedef** cümlesi koy ("2025'e kadar yerli yırtıcıları %45'in üstünde tut"). Ortak bütçe ödünleşim yaratır.
- **Etkiler abartılı ve gözle görülür olsun** (simülasyon oyunu, kullanıcı abartı istedi): zincirleme sonuç (serçe azalınca böcek patlaması) dramatik ve okunur olmalı; göstergeler ve sahne bunu açıkça yansıtmalı.
- **Hile kontrolü:** her aracın gerçekçi bir bedeli olsun. "Hep maksimum" stratejisi kazanmamalı. Node ile senaryo tablosu çıkarıp kontrol et.

## Tempo (bildirimler)
- Akış hızı: kullanıcı biraz (yaklaşık %10) daha yavaş istedi. Boştayken çarpan ~0,47, kuyrukta kart varken 0,95, kart açıkken 1,5. Ay birimi ~5,2 sn (sıcak ay), yıl birimi ~4,75 sn.
- Kartlar kuyruğa girer:
  - iki kart arası en az **9 sn**;
  - bir kart kapandıktan sonra en az **5 sn**;
  - ekranda masaüstünde en fazla 2, telefonda 1 kart;
  - durduran kartlar sırada öne geçer;
  - kuyruk 6'yı aşarsa en eski küçük haber atılır.
- Bir kartın ekranda kalma süresi = 4,5 sn + metin uzunluğu × 65 ms (en fazla 16 sn).
- Kart açıkken zaman ×1,5 yavaşlar, sırada kart varken ×0,9, ekranda hiçbir şey yokken ×0,42 hızlanır (kullanıcı boş anlarda daha hızlı istedi). İlk aylar biraz daha yavaş akar.
- Yılın yanında **[1×][2×][4×]** üç düğmeli hız seçici bulunur. Hız yalnız bir olayın **başında bir kez** (hasat, dönüm noktası) 1×'e döner. Küçük haberler, hikâye kartları ve olayın devamındaki ardışık kartlar hızı sıfırlamaz; oyuncunun seçtiği hız korunur. Bunu bir testle doğrula: 2×'e bas, kartlar gelsin, hız 2× kalmalı.
- Hasat, dönüm noktası ve karar kartları **kendiliğinden kapanmaz**; oyuncu dokunur ya da "Devam →" der.
- **Zaman birimi yılsa (ör. Aral, 1960–2010) yıla bağlı kartlar kuyruğa girmez.** Kart kuyruğundaki 9 sn'lik boşluk birkaç yıla denk gelir, "1991" kartı 1994'te çıkar. Bu yüzden dönüm noktası kartları `milestone()` ile hemen açılır ve zamanı durdurur. Küçük haberler kuyrukta kalır. Açılış hikâyesi bitene kadar (`game.story`) yıl ilerlemez.
- **Karar kartları sıraya girer (`choiceQ`).** Aynı yıl iki karar gelirse (plan değerlendirmesi ve Sibirya projesi gibi) ikincisi birincinin üstüne yazılmasın. Testte bu durumu ayrıca dene.
- Kart başlıklarında yılı tekrar etme, yıl zaten üstte görünüyor.

## Düzen ("dock")
- **Üst orta:** büyük yıl, zeminsiz ve beyaz parıltılı. Altında ay/sahne adı, zaman çizgisi, solda son sonuç (ör. "🌾 %97"), sağda hız düğmesi. Hemen altında ince haber şeridi olur ve bu ikisi `.topbox` içinde birlikte durur.
- **Sol üst:** zeminsiz HUD (kota, göstergeler, istatistikler). Telefonda 128 px genişliğinde ve yalnızca simgeli.
- **Alt:** yalnız kaydırıcılar, ayrı beyaz kartlarda. Sahne (toprak, başaklar) ekranın en altına kadar uzanır, kontroller sahnenin üzerinde yüzer.
- **Orta:** durduran hikâye kartları, hasat kartı (başaklar ve "normal yıl" çizgili çubuk) ve karar kartları. Bu katmanlar `z-index` ile haber kutusunun üstünde durmalı.
- **Her ekran pencereye sığmalı** (bilgisayar ve telefon). Sonuç ekranı gibi kartlarda ölçüleri `vh` ile ölçekle (`clamp(…, 5vh, …)`), kısa ekranlarda (`max-height: 720px`) açıklama ve lejantı gizle. 1024×768, 1440×900, 375×812 ve 360×640'ta `scrollHeight <= innerHeight` olduğunu JS ile ölçerek doğrula. Uzun metin sayfaları kendi içinde kayar.
- **Bilgisayarda yıl ekranın tam ortasında** (merkezini JS ile ölçerek doğrula). Yılın altında ay, zaman çizgisi, son sonuç ve hız düğmeleri; haberler hemen sağında. Telefonda yıl ve haber alt alta, HUD'un sağında durur.
- `position: fixed` kartın atalarında `transform` ya da `backdrop-filter` olmasın, yoksa kart ekran yerine kutuya göre konumlanır.
- Telefonda: kilitli araçlar ve durdur düğmesi gizli, yazılar küçük. 375×812 ve 360×640'ta mutlaka bak.

## Karakterler ve mizah
- Sade, ncase tarzı çizimler (yuvarlak kafa, iki nokta göz). Konuşma balonları el yazısı fontuyla.
- Ortam sohbeti 9–16 sn'de bir gelir. **Ekrana nereye dokunulursa dokunulsun en yakın karakter konuşur** (mesafe sınırı yok). Konuşabilenler: hayvanlar, insanlar, görevli, yuvadaki yavrular, gemi, kamyon gibi her canlı ya da canlandırılmış öğe.
- **Konuşan karakter yavaşlar:** baloncuğu ekrandayken uçan ya da yürüyen karakter neredeyse durur, baloncuk okunabilsin. (Serçede ~10 kat yavaşlama ölçüldü.)
- Replikler duruma göre değişen havuzlardan seçilsin, her durumda en az üç seçenek olsun. Esprili olsun ("Annemin tenceresini ödünç aldım.").
- **Mizahi sahne (gag) sistemi:** 17–27 sn'de bir, duruma uygun küçük bir sahne. Örnekler: sapanlı çocukların taşı birbirine çarpar, tencere kafaya geçer, serçe şapka kapar, köylü uyuya kalır, çiftçi süpürgeyle çekirge kovalar, tencere konseri, takılıp düşen köylü, serçe kovalayan köpek, ekmeği yiyen çekirgeler, yavrularını besleyen serçe. Havuz geniş olsun, duruma göre seçilsin. Şiddet içermeyen, çizgi film tarzı şakalar olsun.

- **Karar anında karakter yanına gelir:** karar kartı, kararı soran karakterin portresiyle (sahnedeki çizimden canvas'a) ve konuşma balonuyla açılır. Karakter sahnede de yürüyüp yanında durur, kartın arkasında kalmayacak şekilde konumlanır.
- **Kalıcı duygusal öğe:** sahnede sürekli duran ve politikaya tepki veren küçük bir hikâye (ör. ağaçtaki yuva: kampanya yüksekken anne konamaz, yavrular "Anne, yemek yok mu?" der; serçe tükenince yuva sessizleşir).
- **Abartı ödüllendirilsin:** oyuncu bir kaydırıcıyı uca götürünce ona özel, büyük bir sahne gelsin (ör. %70 üstü seferberlikte 5 kişilik tencere rock grubu).
- **Karakterler ışınlanmaz.** Sahnede bir yer (ev, iskele, kapı) olsun. Kaydırıcı artınca karakterler oradan yürüyerek gelir, azalınca yürüyerek geri döner. Arada vardiya değişimi gibi küçük döngüler olsun ("Vardiya bitti, ben yatıyorum!").
- **Harita sahnelerinde kamera:** yumuşak yakınlaşma ve uzaklaşma kullan. Kamera cepheyi takip eder, olay olunca oraya odaklanır, sonda bütün alanı gösterir. Simgeler yakınlıkla `1/√z` ölçeklensin, baloncuk ve dokunma koordinatları kamera dönüşümüne çevrilsin.
- **Hikâyenin ilk cümlesi sahnede canlansın.** Kart "gemiyle geldi" diyorsa gemi gerçekten yanaşsın, kasalar insin. Kartta anlatılan her şey mümkünse sahnede de görünsün.
- **Hareket akıcı olsun:** kuşlarda rastgele titreme yok; yavaş dönen yön (wander), seyir hızına yumuşak yaklaşma, ivme sınırı, dönüşte yatma, tırmanırken hızlı çırpma ve alçalırken süzülme. İnsanlar birbirinin içinden geçmez, gruplar yan yana yürür. Figür çevirirken yalnız yatay ölçekle (`scale(dir * s, s)`), dikeyi asla ters çevirme.

## Tutarlılık kuralları (kullanıcının yakaladığı hatalardan, bir daha yapma)
- **Oyuncunun kararını asla gizlice ezme.** Sistem baskısı (güven, kota) bir karar anına dönüşsün: karakter gelir, sorar, oyuncu seçer. Kaydırıcıyı oyuncu habersizce değiştirmek yok. Direnmeyi seçerse oyun dürüstçe biter ("görevden alındın" sonucu).
- **Her değişimin ekranda görünür bir nedeni olsun.** Bir gösterge düşüyorsa bunu yapan karakter ya da olay sahnede görünmeli ve bir kartla söylenmeli.
- **Ses ve görüntü modelle tutarlı olsun.** Tencere çalan yoksa tencere sesi yok. Kaydırıcıya bağlı sahneler (grup, konser, çocuklar) kaydırıcı inince hemen biter.
- **İpucu bağlama uysun.** Kaydırıcı zaten yüksekken "artır" deme.
- **Figürler doğru yöne baksın.** Yalnız yatayda çevir, ters yürüyen ya da baş aşağı çizilen karakter olmasın.
- **Kartlar okunmadan kapanmasın.** Önemli kartlar dokununca geçer.

## Yayından önce kontrol listesi (zorunlu)
1. **Uç değer testleri** (node ya da `?debug&hizli` ile): her kaydırıcı %0 ve %100'de baştan sona oynatılır. Sonra şu sorular sorulur:
   - Kaydırıcı %0'dayken "olmaması gereken" bir şey oluyor mu? (ör. seferberlik %0'da serçe azalmamalı: `minS == 1`)
   - Hep-maksimum stratejisi kazanıyor mu? Kazanmamalı.
   - Kimse kaydırıcıyı oyuncudan habersiz değiştiriyor mu?
2. **Ses ve görüntü tutarlılığı:** her ses ve her sahne için "bunu sahnede kim yapıyor?" sorusunun cevabı olmalı.
3. **Akış logu:** gerçek hızda kart açılış ve kapanış zamanları loglanır. Arka arkaya kart, 15 saniyeden uzun boşluk ya da kendiliğinden kapanan önemli kart olmamalı.
4. **Sığma:** `tools/layout-audit.js` çalıştırılır. Bu betik her bölümün her slaytını 1440×900, 1024×768, 375×812 ve 360×640'ta açıp pencereden taşan öğeleri listeler (yerel sunucuda ana sayfayı aç, sonra `await eval(await (await fetch('/tools/layout-audit.js')).text())`). Çıktı **"sorun yok"** olmadan yayına çıkma. Metin sayfaları ve laboratuvar paneli dahil hiçbir ekran kaydırma gerektirmemeli.
5. Bütün dosyalarda `node --check` çalıştırılır, konsolda hata kalmamalı. Ardından `?v=` sürümü artırılır, push edilir ve canlı sürüm curl ile kontrol edilir.

## Rozetler
- Ortak sistem `assets/js/badges.js` (+ `assets/css/badges.css`). Her bölümde **4 açık rozet** (iyi senaryolar, ipucu görünür) ve **4 kapalı rozet** (gizli; tek dokunuş, 2–3 dokunuş ya da sürpriz oyun anı). Her rozet gerçek bir "Biliyor muydun?" bilgisiyle gelir. "Yakında" bölümlere rozet konmaz.
- Rozet koşulları **sahnede görüneni** izlesin (ör. Kakadu annesi bir kez kaybolursa geri gelmez, rozet de gelmez). Eşikler oyun içinde her yerde aynı olsun (ör. öğretmen kurbağa ≥ 25 puan).
- **Her rozet kazanılabilir olmalı:** node ya da `?debug&hizli` ile her rozet için bir senaryo oynatılıp gerçekten açıldığı doğrulanır. Ayrıca rozetin yanlışlıkla açılmadığı da kontrol edilir (ör. yalan söyleyen "Dürüst bakan" almamalı).
- **Rozet ahlaki çelişki yaratmasın:** "iyi" bir rozete yalnız "kötü" bir yolla (ör. yalan raporla) ulaşılabiliyorsa koşulu düzelt. Dürüst yolun da bir çıkışı olsun (ör. görevden alınsan bile hiç serçe düşürmediysen "Serçelerin dostu").
- Sistem testleri: tekrar kazanım `false` döner, bilinmeyen kimlik reddedilir, kodla dışa ve içe aktarma çalışır, bozuk kod reddedilir, panel 16 kart çizer, gizliler "???" görünür.

- **Rozet görselleri bölüme özel:** düz emoji kutusu değil, madalyon kullanılır. Madalyon bölüm fotoğrafının `toon.js` ile işlenmiş, rozete özel bir kesitinden yapılır (`ART` tablosu: fotoğraf, konum, yakınlık, çerçeve rengi). Simge sağ alttaki rozet kapağında durur. Kilitli rozet gri ve bulanık görünür, gizli rozet daha da bulanık ve "?" simgelidir. Yeni bölümde `badges.js` içindeki `IMG` ve `ART` tablolarına o bölümün 8 rozeti eklenir. Bildirim ve panel aynı `Badges.medal()` ve `Badges.paint()` fonksiyonlarını kullanır.
- **İpuçları üstü kapalı (bilmece gibi):** açık rozetin ipucu ne yapılacağını doğrudan söylemez, ima eder. Örnek: "Hiç serçe düşürmeden bitir" yerine "Gökyüzünde tek bir kanat bile eksilmesin"; "Müfettişe hayır de" yerine "Bazen en cesur cevap tek kelimedir"; "Kurbağaları hiç salma" yerine "Bazı kasalar hiç açılmasa daha iyi". İpucu oyunda görülen bir şeye (çizgi, kasa, aile) gönderme yapsın ki çözülebilsin. Kelime oyunu yaparken gerçeği kontrol et ("iki harfli" deyip "hayır"ı kastetme).
- **İpuçları biraz gizli:** paneldeki açık rozet ipucu bulanık durur. Üstüne gelince ya da dokununca (👁 ipucu) okunur. Sonuç ekranında kaçan rozetlerin nedeni yazılmaz, keşif oyuncuya kalır.
- Rozetler `localStorage` içinde saklanır (`bny-rozetler-v1`). Güncelleme yayınlamak onları silmez. **Anahtarın adını asla değiştirme**; şema değişecekse eski veriyi okuyup taşı. Yalnız tarayıcı verisi silinirse ya da gizli pencerede kaybolurlar, bunun için rozet kodu var.
- **Rozet kaçtı şikâyeti gelince önce sürümü kontrol et:** düzeltme yeni yayınlandıysa oyuncu muhtemelen eski sürümle oynamıştır. Sonra senaryoyu `?debug&hizli` ile oyuncunun anlattığı gibi yeniden oyna (ör. "kaydırıcıyı baştan %0'a çektim, müfettişe hayır dedim"). Oyuncunun oyun başlamadan yapabileceği bir şeyi (kaydırıcıyı %0'a çekmek) koşuldan muaf tutmaya gerek yok.


## Ana sayfa
- Üst menü yapışıktır (`.topbar { position: sticky }`). Sayfa kayınca hafif gölge alır (`.scrolled`).
- Menüde "Sezonlar ▾" açılır listesi vardır. Liste `window.SEASONS`'tan üretilir, her sezon bölümü `id="sezon-N"` ile işaretlenir. Kaydırınca düğme bulunulan sezonu gösterir (scroll-spy: "🌊 Sezon 2"). Oynanabilir bölümü olan sezonlarda "▶ oynanabilir" yazar. Yeni sezon eklenince ek kod gerekmez.
- Açılır paneller (sezon, rozet) `position: fixed` olur, biri açılınca öteki kapanır. Dışarı tıklayınca ve Esc ile kapanırlar. Telefonda rozet paneli alttan çıkan sayfa olur, sezon menüsü tam genişlikte açılır.
- Telefonda üst menü tek satır kalmalı (`white-space: nowrap`, çok dar ekranda "Rozetler" kelimesi gizlenir). 375 px'de `scrollWidth == innerWidth` olduğunu ölç.
- **Rozet paneli büyümeye hazır (akordeon):** bölümler `window.SEASONS`'tan gelir ve sezon başlıklarıyla gruplanır. Her bölüm tek satırdır: ad, kazanılan rozetlerin minik madalyonları, ilerleme çubuğu, g/n. Satıra dokununca yalnız o bölümün 8 kartı açılır, aynı anda tek bölüm açık kalır. Varsayılan olarak son rozetin kazanıldığı bölüm açılır. En üstte "Son kazanılanlar" şeridi durur. Yeni bölüm için panel koduna dokunulmaz.
  - Sezonlar da açılır kapanır: sezon başlığı düğmedir ve sezonun toplam g/n'sini gösterir. Varsayılan olarak son rozetin kazanıldığı sezon açılır.
- **İstatistik paneli:** `Stat.get(path, start)` GoatCounter'ın açık sayaç arayüzünü okur (`TOTAL`, `basla-<bölüm>`, `bitti-<bölüm>`, `rozet-<id>`; dönem `week`/`month`). 404 sıfır, hata `null` döner. Gizli rozetler oyuncu kazanmadıkça istatistikte de "???" görünür.

## Tekrar oynama
- Bölüm bir kez bitince `localStorage['bny-bitti-<bölüm>'] = 1` yazılır. Sonraki ziyaretlerde alttaki noktaların hepsi seçilebilir olur (`maxSeen = slides.length - 1`). Başlık kartında "Bu bölümü bitirdin. Doğrudan geç:" ve Laboratuvar / Gerçekte ne oldu? / Ne öğrendik? kısayolları çıkar (`replayNav()`). Yeni bölümde de aynı kalıp (`DONE_KEY`, `paintDots`, `replayNav`) kullanılır.

## Bölüm fikri seçerken
- İyi bölüm: **tek bir insan kararı**, **beklenmedik bir doğa tepkisi** ve bir **ironi** içerir (ör. Emu Savaşı'nda ordu kaybeder, kuşlar kazanır). Bu sahnede oynanabilir ve komik bir şey demektir. Oyuncu politika kaydırıcısıyla aynı hatayı tekrarlayabilmeli ya da önleyebilmeli.
- Konular doğrulanmış tarihî olaylardan seçilir. Hayvan davranışıyla ilgili ilginç bilgiler (ör. primatlar) "Biliyor muydun?" kartı ya da rozet bilgisi olarak kullanılır. Bir bölümün ana mekanizması yine insan müdahalesi olmalı.

## Görsel ve ses
- Palet: doğal yeşil (`#e9f0de`). Ekosistem bozuldukça arka plan `#f4dbd1` tonuna kayar. Yazıların arkasında yarı saydam beyaz zemin olur.
- Fotoğraflar Wikimedia Commons'tan (kamu malı veya CC) alınır, atıflı kullanılır ve `toon.js` ile işlenir. Fotoğraf seçerken kırpma ve içerik uyumuna dikkat et (ör. morina bölümünde balık görseli olsun).
- **Fotoğraflar sitede barındırılır** (`assets/img/cards/`, 960 px). Wikimedia'dan doğrudan bağlanırsa kısa sürede çok istek gelince 429 hatası verip görselleri kesiyor. Commons API'siyle (`prop=imageinfo&iiurlwidth=960`) adres ve lisans alınır, istekler arasında 2–3 sn beklenir, dosya `curl` ya da Python ile indirilir. Kaynak ve lisans `chapters.js` içindeki `credit` ve `src` alanlarında kalır. Büyük push'tan önce `git config http.postBuffer 157286400` ayarlanır.

- Ses Web Audio ile sentezlenir (ortam, cıvıltı, koro, tık). "Ses" düğmesiyle kapatılabilir.

## Model
- **Su dengesi örneği (Aral):** her yıl `V += gelen − buharlaşma`. Buharlaşma alanla orantılıdır, alan da `A = A0·(V/V0)^0.6` ile hesaplanır. Tuz sabit kalır, yani `tuz = S0·V0/V`. Hacim–alan üssünü ve tarihî su çekme yolunu (`histW`) 1960, 1989 ve 2010 ölçümlerine göre node ile ayarla. Ardından bir senaryo tablosu çıkar (hiç sulama yok / sabit / hep maksimum / tarih / akıllı). Akıllı yol en az iki rozet kazandırmalı, hep-maksimum yolu ise kazandırmamalı.
- Basit ve açıklanabilir bir model yaz. Zamanlamayı **tarihî noktalara göre ayarla** (ör. kurbağada Darwin 2005, Batı Avustralya 2009) ve bunu node ile doğrula.
- Bir `HISTORY` senaryosu tut. Sonuç ekranı ve grafik oyuncunun sonucunu tarihle karşılaştırsın.
- Laboratuvar daha uzun zaman ufku ve ek "ya olsaydı?" kaydırıcıları sunsun (ör. ısınma, evrim).

## Test
- `?hizli` zamanı hızlandırır, `?debug` `window.__dbg` nesnesini açar, `?layout=klasik` eski düzeni gösterir.
- Tarayıcı paneli gizliyken `requestAnimationFrame` çalışmaz. Çözüm: rAF'ı `setTimeout` ya da MessageChannel ile sür, sonra bir ekran görüntüsü alarak ilk kareyi tetikle. Ekran görüntüleri bazen bayat çıkar; DOM'u JS ile ölç.
- Akışı gerçek hızda test et: kart açılış ve kapanış zamanlarını bir MutationObserver ile logla. Sıkıcı boşluk ya da üst üste kart var mı bak.
- Her değişiklikten sonra `node --check` çalıştır. Yayından sonra `curl` ile yeni sürümün canlıya çıktığını doğrula.

## Yayın
`git add -A && git commit` (mesaj Türkçe, sonunda `Co-Authored-By` satırı) → `GIT_TERMINAL_PROMPT=0 git push -q origin main` → curl ile canlı sürüm kontrolü.
