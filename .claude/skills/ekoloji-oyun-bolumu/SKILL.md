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

## Ton ve içerik
- Bir çocuğun anlayacağı kadar basit, bilimi hafife almayan; hafif alaycı ama ciddi. Ağır siyasi jargon kullanma ("sağcı sapma" gibi ifadeler fazla bulundu).
- **Bir bölüm, bir mekanizma.** Konuları karıştırma: serçe bölümünde ilaç/pestisit yok (o "Kuşlar Neden Sustu?" bölümünün konusu). Tarihte olmayan aracı oyuna koyma.
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
- Oyun toplamda **3–4 dakika** sürsün. Sıkıcı dönemler hızlı geçsin, önemli anlarda kısa durulsun.
- Hikâyenin ölçeği değişince **sahne değiştir** (ör. kamış tarlası → Avustralya haritası) ve geçişi bir kartla anlat.

## Oyuncunun rolü
- **Karakterler eylemi kendileri yapar** (köylüler tencere çalar, yetkili gelir, gönüllüler toplar). Oyuncu **politikayı** kaydırıcılarla yönetir. Doğrudan dokunarak öldürme ya da refleks isteyen mekanik kullanma; "zorladı, içine çekmedi" geri bildirimi geldi.
- En fazla **1–3 kaydırıcı.** Başlangıç değeri sıfır olmasın (ör. %10), sahne ilk saniyede canlı görünsün.
- Seçenekleri **kademeli aç.** Kilitli araç "🔒 1980'de açılır" diye görünür (telefonda gizli). Açılınca durduran bir kartla tanıtılır ve ardından rehber ipucu gösterilir.
- **Rehber ipucu (coach):** kaydırıcı nabız gibi parlar, üstünde "👉 Kaydır: …" balonu çıkar. İlk ipucu oyuncu dokunana kadar kalır, diğerleri ~14 sn kalır. Kritik anlarda (ör. güven düşünce) yeniden gösterilir. Yalnız anlamlıysa göster: kaydırıcı zaten yüksekken "artır" deme.
- İkilemleri **oyun içi bir karakterle karar kartına** dönüştür. Örnek: hasattan sonra devlet yetkilisi gelir ve sorar; seçenekler "Gerçeği yaz / Biraz yuvarla / Rekor yaz!". Kaydırıcı kalabalığından iyidir.
- Bir **baskı ölçeği** kullan (Pekin'in güveni gibi). Ölçek sıfırlanınca kontrol oyuncudan alınır, böylece sistemle ilgili ders oyunun içinde yaşanır.
- Net bir **hedef** cümlesi koy ("2025'e kadar yerli avcıları %45'in üstünde tut"). Ortak bütçe ödünleşim yaratır.
- **Etkiler abartılı ve gözle görülür olsun** (simülasyon oyunu, kullanıcı abartı istedi): zincirleme sonuç (serçe azalınca böcek patlaması) dramatik ve okunur olmalı; göstergeler ve sahne bunu açıkça yansıtmalı.
- **Hile kontrolü:** her aracın gerçekçi bir bedeli olsun. "Hep maksimum" stratejisi kazanmamalı. Node ile senaryo tablosu çıkarıp kontrol et.

## Tempo (bildirimler)
- Kartlar kuyruğa girer:
  - iki kart arası en az **9 sn**;
  - bir kart kapandıktan sonra en az **5 sn**;
  - ekranda masaüstünde en fazla 2, telefonda 1 kart;
  - durduran kartlar sırada öne geçer;
  - kuyruk 6'yı aşarsa en eski küçük haber atılır.
- Bir kartın ekranda kalma süresi = 4,5 sn + metin uzunluğu × 65 ms (en fazla 16 sn).
- Kart açıkken zaman ×1,5 yavaşlar, sırada kart varken ×0,9, ekranda hiçbir şey yokken ×0,42 hızlanır (kullanıcı boş anlarda daha hızlı istedi). İlk aylar biraz daha yavaş akar.
- Yılın yanında **[1×][2×][4×]** üç düğmeli hız seçici bulunur. Yeni bir olay, hasat ya da dönüm noktası gelince hız 1×'e döner.
- Hasat, dönüm noktası ve karar kartları **kendiliğinden kapanmaz**; oyuncu dokunur ya da "Devam →" der.
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
- Replikler duruma göre değişen havuzlardan seçilsin, her durumda en az üç seçenek olsun. Esprili olsun ("Annemin tenceresini ödünç aldım.").
- **Mizahi sahne (gag) sistemi:** 17–27 sn'de bir, duruma uygun küçük bir sahne. Örnekler: sapanlı çocukların taşı birbirine çarpar, tencere kafaya geçer, serçe şapka kapar, köylü uyuya kalır, çiftçi süpürgeyle çekirge kovalar, tencere konseri, takılıp düşen köylü, serçe kovalayan köpek, ekmeği yiyen çekirgeler, yavrularını besleyen serçe. Havuz geniş olsun, duruma göre seçilsin. Şiddet içermeyen, çizgi film tarzı şakalar olsun.

- **Karar anında karakter yanına gelir:** karar kartı, kararı soran karakterin portresiyle (sahnedeki çizimden canvas'a) ve konuşma balonuyla açılır. Karakter sahnede de yürüyüp yanında durur, kartın arkasında kalmayacak şekilde konumlanır.
- **Kalıcı duygusal öğe:** sahnede sürekli duran ve politikaya tepki veren küçük bir hikâye (ör. ağaçtaki yuva: kampanya yüksekken anne konamaz, yavrular "Anne, yemek yok mu?" der; serçe tükenince yuva sessizleşir).
- **Abartı ödüllendirilsin:** oyuncu bir kaydırıcıyı uca götürünce ona özel, büyük bir sahne gelsin (ör. %70 üstü seferberlikte 5 kişilik tencere rock grubu).
- **Karakterler ışınlanmaz.** Sahnede bir yer (ev, iskele, kapı) olsun. Kaydırıcı artınca karakterler oradan yürüyerek gelir, azalınca yürüyerek geri döner. Arada vardiya değişimi gibi küçük döngüler olsun ("Vardiya bitti, ben yatıyorum!").
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

## Görsel ve ses
- Palet: doğal yeşil (`#e9f0de`). Ekosistem bozuldukça arka plan `#f4dbd1` tonuna kayar. Yazıların arkasında yarı saydam beyaz zemin olur.
- Fotoğraflar Wikimedia Commons'tan (kamu malı veya CC) alınır, atıflı kullanılır ve `toon.js` ile işlenir. Fotoğraf seçerken kırpma ve içerik uyumuna dikkat et (ör. morina bölümünde balık görseli olsun).
- Ses Web Audio ile sentezlenir (ortam, cıvıltı, koro, tık). "Ses" düğmesiyle kapatılabilir.

## Model
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
