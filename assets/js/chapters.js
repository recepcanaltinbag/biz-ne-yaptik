// Bölüm listesi: yeni bölüm eklemek için buraya bir satır ekle.
// status: 'live' (oynanabilir) | 'soon' (yakında) | 'hope' (umut hikâyesi, yakında)
window.SEASONS = [
  { icon: '🐦', title: 'Doğayla Oynamak', desc: 'Bir türü ekle ya da çıkar. Ne olabilir ki?', chapters: [
    { year: '1958', title: 'Serçelere Savaş', status: 'live', href: 'chapters/serce/', text: 'Çin tahılını kurtarmak için serçeleri yok etmeye karar veriyor. Çekirgeler buna çok seviniyor.',
      img: 'assets/img/cards/kill-bird-and-insect.jpg', pos: '50% 20%', credit: 'Kampanya afişi, kamu malı', src: 'File:Kill_bird_and_insect.jpg' },
    { year: '1935', title: 'Kurtarıcı Kurbağa', status: 'live', href: 'chapters/kurbaga/', text: 'Avustralya şeker kamışı böceğine karşı kurbağa getiriyor. Kurbağa böceği yemiyor, kıtayı ele geçiriyor.',
      img: 'assets/img/cards/cane-toad-bufo-marinus.jpg', credit: 'Charles J. Sharp, CC BY-SA 4.0', src: 'File:Cane_toad_(Bufo_marinus).jpg' },
    { year: '1859', title: '24 Tavşanlık Felaket', status: 'soon', text: 'Bir çiftlik sahibi avlanmak için 24 tavşan salıyor. Yarım asır geçmeden yüz milyonlarca tavşan kıtanın otlarını kemiriyor.',
      img: 'assets/img/cards/csiro-scienceimage-2232-releasing-the-myxoma-virus-for-rabbi.jpg', credit: 'CSIRO Arşivi, CC BY 3.0', src: 'File:CSIRO_ScienceImage_2232_Releasing_the_Myxoma_Virus_for_Rabbits.jpg' },
    { year: '1954', title: 'Gölün Yeni Patronu', status: 'soon', text: 'Victoria Gölü\'ne iri ve lezzetli bir yırtıcı balık bırakılıyor. Göldeki yüzlerce yerli balık türünün çoğu ortadan kayboluyor.',
      img: 'assets/img/cards/fishing-on-lake-victoria-06.jpg', credit: 'Jöseph Ashaba, CC BY-SA 4.0', src: 'File:Fishing_on_lake_Victoria_06.jpg' },
    { year: '1932', title: 'Ordu Emulara Yenildi', status: 'soon', text: 'Batı Avustralya\'da 20.000 kadar emu buğday tarlalarına iniyor. Ordu makineli tüfeklerle "savaş" açıyor. Kazanan emular oluyor.',
      img: 'assets/img/cards/emu-1-tidbinbilla.jpg', pos: '50% 30%', credit: 'JJ Harrison, CC BY-SA 4.0', src: 'File:Emu_1_-_Tidbinbilla.jpg' },
    { year: '1959', title: 'Kaplumbağanın Yemeğini Kim Yedi?', status: 'soon', text: 'Denizcilerin Galápagos adalarına bıraktığı birkaç keçi çoğalıp her şeyi kemiriyor. Dev kaplumbağalara ot kalmıyor. Geri toplamak için 100.000\'den fazla keçi yakalanıyor.',
      img: 'assets/img/cards/capra-hircus-dt-w-i-floreana-1-21255933153.jpg', credit: 'Diego Tirira, CC BY-SA 2.0', src: 'File:Capra_hircus_DT_-W_I_Floreana-_(1)_(21255933153).jpg' },
    { year: '1938', title: 'Tarzan\'ın Maymunları', status: 'soon', text: 'Bir tekne işletmecisi, turist çeksin diye Florida\'da bir adaya altı maymun bırakıyor. Kimse maymunların yüzebildiğini düşünmemiş.',
      img: 'assets/img/cards/rhesus-macaque-monkey-2.jpg', credit: 'Joseph Gage, CC BY-SA 2.0', src: 'File:Rhesus_macaque_monkey_2.jpg' },
    { year: '1935', title: 'Güneyi Yutan Sarmaşık', status: 'soon', text: 'ABD, toprak kaymasın diye çiftçilere milyonlarca kudzu fidesi dağıtıyor. Sarmaşık ağaçları, evleri, direkleri yutmaya başlıyor.',
      img: 'assets/img/cards/kudzu-on-trees-in-atlanta-georgia.jpg', credit: 'Scott Ehardt, kamu malı', src: 'File:Kudzu_on_trees_in_Atlanta,_Georgia.jpg' },
    { year: '1989', title: 'Mor Halı', status: 'soon', text: 'Mor çiçekli güzel bir süs bitkisi Victoria Gölü\'ne ulaşıyor ve kıyıları halı gibi kaplıyor. Tekneler limandan çıkamıyor.',
      img: 'assets/img/cards/hyacinth-menace-lake-victoria.jpg', credit: 'Mwe17, CC BY-SA 4.0', src: 'File:Hyacinth_menace_Lake_Victoria.jpg' },
  ]},
  { icon: '🌊', title: 'Su Her Şeyi Hatırlar', desc: 'Su her şeyi taşır: atığı da, sonuçlarını da.', chapters: [
    { year: '1960', title: 'Çöle Dönen Deniz', status: 'live', href: 'chapters/aral/', text: 'Aral Gölü\'nün suyu pamuğa gidiyor. Dünyanın dördüncü büyük gölünden geriye bir çöl ve paslı gemiler kalıyor.',
      img: 'assets/img/cards/moynaq-aral-sea-6226807306.jpg', credit: 'Arian Zwegers, CC BY 2.0', src: 'File:Moynaq,_Aral_Sea_(6226807306).jpg' },
    { year: '1969', title: 'Nehir Alev Aldı!', status: 'soon', text: 'Cleveland\'da bir nehir alev alıyor. Nehir yağ ve atıkla o kadar dolu ki bu ilk yangını bile değil.',
      img: 'assets/img/cards/harshaw-chemical-company-discharges-waste-water-into-the-cuy.jpg', credit: 'F. J. Aleksandrowicz / NARA, kamu malı', src: 'File:HARSHAW_CHEMICAL_COMPANY_DISCHARGES_WASTE_WATER_INTO_THE_CUYAHOGA_RIVER_-_NARA_-_550193.jpg' },
    { year: '1990–', title: 'Nehirden Tabağa', status: 'soon', text: 'Sanayi atıkları nehre karışıyor, nehrin suyu tarlaları sulamaya devam ediyor. Peki toprağa ve ürüne ne oluyor?',
      img: 'assets/img/cards/ergene-de-yasam.jpg', credit: 'Tarkyldz, CC0', src: "File:Ergene'de_Yaşam.jpg" },
    { year: '2021', title: 'Marmara Nefes Alamıyor', status: 'soon', text: 'Marmara\'nın yüzeyi kalın, gri bir tabakayla kaplanıyor. Arıtılmadan akan atık sular ve ısınan deniz onu besliyor.',
      img: 'assets/img/cards/mucilage-in-the-marmara-3.jpg', soft: true, credit: 'Hilmi Hacaloğlu, kamu malı', src: 'File:Mucilage_in_the_Marmara_(3).jpg' },
    { year: '2000–', title: 'Ova Çöküyor', status: 'soon', text: 'Konya Ovası\'nda kuyular derinleştikçe yeraltı suyu çekiliyor ve tarlaların ortasında dev çukurlar açılıyor.',
      img: 'assets/img/cards/trockene-riesendoline-bei-cral-karapinar-provinz-konya.jpg', credit: 'Christian1311, CC BY-SA 4.0', src: 'File:Trockene_Riesendoline_bei_Çıralı_(Karapinar,_Provinz_Konya).jpg' },
    { year: '1956', title: 'Dans Eden Kediler', status: 'soon', text: 'Bir fabrika cıvalı atığını koya döküyor. Cıva balıkta, balık insanda birikiyor. İlk belirtiyi kediler veriyor.',
      img: 'assets/img/cards/minamata-disease-museum-20230226-09.jpg', credit: 'Minamata Hastalığı Müzesi, CC0', src: 'File:Minamata_Disease_Museum_20230226_09.jpg' },
    { year: '1982', title: 'Hamsiyi Kim Yedi?', status: 'soon', text: 'Gemilerin safra suyuyla gelen ceviz büyüklüğünde bir taraklı denizanası Karadeniz\'de patlıyor. 1989\'da hamsi avı çöküyor.',
      img: 'assets/img/cards/mnemiopsis-leidyi-meerwalnuss-3.jpg', credit: 'Holger Krisp, CC BY 3.0', src: 'File:Mnemiopsis_leidyi_Meerwalnuss_3.jpg' },
    { year: '2000–', title: 'Göl Nereye Gitti?', status: 'soon', text: 'Akşehir Gölü\'nü besleyen sular bahçe sulamak için kuyulardan çekiliyor. Kuraklık da eklenince koca göl neredeyse tamamen kuruyor.',
      img: 'assets/img/cards/lake-aksehir.jpg', credit: 'Kerem Ekmekçi, CC BY-SA 4.0', src: 'File:Lake_Akşehir.jpg' },
  ]},
  { icon: '🧪', title: 'Tarlada Kimya Dersi', desc: 'Daha çok ürün için her şey. Ya faturası?', chapters: [
    { year: '1962', title: 'Kuşlar Neden Sustu?', status: 'live', href: 'chapters/ddt/', text: 'DDT mucize gibi görünüyor: sivrisinek ölüyor, ürün artıyor. Sonra kartalların yumurta kabukları incelmeye başlıyor.',
      img: 'assets/img/cards/statelibqld-2-162299-cloud-spraying-for-mosquitos-at-norman-.jpg', credit: 'State Library of Queensland, kamu malı', src: 'File:StateLibQld_2_162299_Cloud_spraying_for_mosquitos_at_Norman_Park,_1947.jpg' },
    { year: '2018', title: 'Arılar Nerede?', status: 'soon', text: 'Tohumu ilaçla kaplamak pratik. Ama tarlayı ziyaret eden arılar da o ilaçtan payını alıyor.',
      img: 'assets/img/cards/european-honey-bee-extracts-nectar.jpg', credit: 'John Severns, kamu malı', src: 'File:European_honey_bee_extracts_nectar.jpg' },
    { year: 'Her yaz', title: 'Boğulan Körfez', status: 'soon', text: 'Tarlalardaki gübre nehirle denize akıyor. Her yaz Meksika Körfezi\'nde balıkların yaşayamadığı dev bir alan oluşuyor.',
      img: 'assets/img/cards/dead-zone-nasa-noaa.jpg', credit: 'NOAA, kamu malı', src: 'File:Dead_Zone_NASA_NOAA.jpg' },
    { year: '1930', title: 'Toprak Gökyüzüne Uçtu', status: 'soon', text: 'Büyük Ovalar\'ın çayırları sürülüyor, sonra kuraklık geliyor. Toprak kara bulutlar hâlinde göğe yükseliyor.',
      img: 'assets/img/cards/son-of-farmer-in-dust-bowl-area-cimarron-county-oklahoma-8b3.jpg', credit: 'Arthur Rothstein, kamu malı', src: 'File:Son_of_farmer_in_dust_bowl_area,_Cimarron_County,_Oklahoma,_8b38282.jpg' },
    { year: '1950–', title: 'Birecik\'in Son Kelaynakları', status: 'soon', text: 'Binlerce yıldır Birecik\'in kayalıklarında yuva yapan kelaynaklar, tarlalara sıkılan ilaçlarla hızla azalıyor. Bugün yalnız korunan bir koloni kaldı.',
      img: 'assets/img/cards/birecikwaldrapp.jpg', credit: 'Kpisimon, CC BY-SA 3.0', src: 'File:BirecikWaldrapp.jpg' },
  ]},
  { icon: '🦠', title: 'Görünmez Düşmanlar', desc: 'En uzun süre kalanlar, gözle göremediklerimiz.', chapters: [
    { year: '1945', title: 'Bakterilerin İntikamı', status: 'soon', text: 'Fleming uyarıyor: penisilini az ve yanlış kullanırsanız bakteriler direnç kazanır. Haklı çıkıyor. Evrimi petri kabında izle.',
      img: 'assets/img/cards/antibiotic-susceptibility-disk-diffusion.jpg', credit: 'Microrao, CC BY-SA 4.0', src: 'File:Antibiotic_susceptibility_disk_diffusion.jpg' },
    { year: '2015', title: 'İlaçla Büyüyen Tavuk', status: 'soon', text: 'Antibiyotiklerin büyük kısmı hasta insanlara değil, daha hızlı büyüsün diye çiftlik hayvanlarına gidiyor.',
      img: 'assets/img/cards/broiler-chicken-at-a-farm.jpg', pos: '50% 40%', credit: 'Umar2z, CC BY-SA 4.0', src: 'File:Broiler_Chicken_at_a_farm.jpg' },
    { year: '1987–', title: 'Son Antibiyotik', status: 'soon', text: 'Penisilinden sonra antibiyotikler birbiri ardına bulundu, sonra onlarca yıl neredeyse yeni sınıf çıkmadı. Neden bu kadar zor?',
      img: 'assets/img/cards/penicillin-past-present-and-future-the-development-and-produ.jpg', credit: 'Imperial War Museum, kamu malı', src: 'File:Penicillin_Past,_Present_and_Future-_the_Development_and_Production_of_Penicillin,_England,_1944_D17802.jpg' },
    { year: '1921', title: 'Bir Mucit, İki Felaket', status: 'soon', text: 'Bir mucit benzine kurşun ekliyor ve motorlardaki vuruntu bitiyor. Aynı mucit birkaç yıl sonra CFC\'yi de icat ediyor.',
      img: 'assets/img/cards/ethylcorporationsign.jpg', credit: 'Plazak, CC BY-SA 3.0', src: 'File:EthylCorporationSign.jpg' },
    { year: '1902', title: 'Kuyruksuz Fareler', status: 'soon', text: 'Hanoi\'de yönetim her fare kuyruğu için para ödüyor. İnsanlar fareleri yakalayıp kuyruğunu kesiyor ve geri salıyor. Hatta fare yetiştirmeye başlıyorlar.',
      img: 'assets/img/cards/hanoi-sewer-map-1939.jpg', credit: 'Hanoi Belediyesi (1939), kamu malı', src: 'File:Hanoi_sewer_map_(1939).jpg' },
    { year: '1952', title: 'Beş Günlük Karanlık', status: 'soon', text: 'Londra\'yı kömür dumanıyla karışık bir sis kaplıyor. Gözle zor görülen küçük parçacıklar binlerce insanı öldürüyor.',
      img: 'assets/img/cards/nelson-s-column-during-the-great-smog-of-1952.jpg', credit: 'N T Stobbs, CC BY-SA 2.0', src: 'File:Nelson\'s_Column_during_the_Great_Smog_of_1952.jpg' },
  ]},
  { icon: '🧴', title: 'Plastik Çağı', desc: 'Birkaç dakika kullan, yüzlerce yıl sakla.', chapters: [
    { year: '1997', title: 'Plastik Çorba', status: 'soon', text: 'Bir kaptan Pasifik\'in ortasında, karadan çok uzakta, plastikle dolu bir deniz buluyor. Akıntılar şişeleri nereye taşıyor?',
      img: 'assets/img/cards/plastic-pollution-in-santa-luzia-cape-verde.jpg', soft: true, credit: 'CaptainDarwin, CC BY-SA 4.0', src: 'File:Plastic_Pollution_in_Santa_Luzia,_Cape_Verde.jpg' },
    { year: 'Bugün', title: 'Şişe Sofrana Döner', status: 'soon', text: 'Fabrikadan çıkıyor, birkaç dakika kullanılıyor, parçalanıp mikroplastik oluyor. Sonra balığa, oradan sofraya geliyor.',
      img: 'assets/img/cards/bales-of-pet-bottles-closeup.jpg', soft: true, credit: 'Grendelkhan, CC BY-SA 4.0', src: 'File:Bales_of_PET_bottles_closeup.jpg' },
  ]},
  { icon: '🕊️', title: 'Son Örnekler', desc: '"Bunlar bitmez" dediğimiz şeyler.', chapters: [
    { year: '1914', title: 'Milyarlardan Sıfıra', status: 'soon', text: 'Gökyüzünü günlerce karartan milyarlarca göçmen güvercin ağlarla toplu hâlde avlanıyor. 1914\'te sonuncusu, Martha, bir hayvanat bahçesinde ölüyor.',
      img: 'assets/img/cards/passenger-pigeon-net-cockburn-1829.jpg', credit: 'James Pattison Cockburn (1829), kamu malı', src: 'File:Passenger_Pigeon_Net_Cockburn_1829.jpg' },
    { year: '1992', title: 'Balık Bitmez Sanıyorduk', status: 'soon', text: 'Newfoundland\'de 500 yıllık balıkçılık bir yazda çöküyor. Av kotalarını sen belirle; ama diğer gemiler de avlanıyor.',
      img: 'assets/img/cards/gadus-morhua-gervais.jpg', fit: 'contain', credit: 'Gervais ve Boulart, kamu malı', src: 'File:Gadus_morhua_Gervais.jpg' },
    { year: '1870', title: 'Kafatası Dağı', status: 'soon', text: 'On milyonlarca bizondan 1889\'da yalnızca birkaç yüzü kalıyor. Kafatası yığınları gübre fabrikalarına gidiyor.',
      img: 'assets/img/cards/bison-skull-pile-edit.jpg', credit: 'Bilinmiyor (1870\'ler), kamu malı', src: 'File:Bison_skull_pile_edit.jpg' },
    { year: '1999–', title: 'Orman İnsanı Evsiz', status: 'soon', text: 'Ormanlar kesilip avlanma artınca Borneo 16 yılda yaklaşık 150.000 orangutan kaybediyor. Bu, nüfusun yarısından fazlası.',
      img: 'assets/img/cards/bornean-orangutan-pongo-pygmaeus-tanjung-putting-national-pa.jpg', credit: 'Thomas Fuhrmann, CC BY-SA 4.0', src: 'File:Bornean_orangutan_(Pongo_pygmaeus),_Tanjung_Putting_National_Park_01.jpg' },
  ]},
  { icon: '🌱', title: 'Düzeltebildiklerimiz', desc: 'Düzeltebildiğimiz zamanlar da oldu.', chapters: [
    { year: '1987', title: 'Dünyanın Anlaştığı Gün', status: 'hope', text: 'Bir kez olsun bütün dünya anlaşıyor ve işe yarıyor. Montreal Protokolü\'nü sen müzakere et.',
      img: 'assets/img/cards/hole-in-the-ozone-layer-over-antarctica-gpn-2002-000117.jpg', credit: 'NASA, kamu malı', src: 'File:Hole_in_the_Ozone_Layer_Over_Antarctica_-_GPN-2002-000117.jpg' },
    { year: '1995', title: 'Nehirleri Değiştiren Kurtlar', status: 'hope', text: 'Yellowstone\'a 14 kurt getiriliyor ve nehirlerin akışına kadar her şey değişiyor.',
      img: 'assets/img/cards/wolf-moving-through-fresh-snow-38346213996.jpg', credit: 'Yellowstone NP (NPS), kamu malı', src: 'File:Wolf_moving_through_fresh_snow_(38346213996).jpg' },
    { year: '1957', title: 'Ölü Nehre Fok Geldi', status: 'hope', text: 'Bilim insanları Thames\'i "biyolojik olarak ölü" ilan ediyor. Bugün nehirde foklar ve denizatları yaşıyor.',
      img: 'assets/img/cards/thames-with-seals-at-crayford-ness-2020-09-27.jpg', credit: 'The wub, CC BY-SA 4.0', src: 'File:Thames_with_seals_at_Crayford_Ness_-_2020-09-27.jpg' },
    { year: '1926', title: 'Kaktüsü Yiyen Güve', status: 'hope', text: 'Avustralya\'da kaktüs 24 milyon hektarı kaplıyor. Önce dikkatle test edilen küçük bir güve getiriliyor ve birkaç yılda tarlaları geri veriyor. Kurbağanın tam tersi!',
      img: 'assets/img/cards/prickly-pear-after-cactoblastis-10869285966.jpg', credit: 'John Tann, CC BY 2.0', src: 'File:Prickly_pear_after_Cactoblastis_(10869285966).jpg' },
  ]},
];

(() => {
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const badge = { live: '<span class="badge live">Oyna</span>', soon: '<span class="badge">Yakında</span>', hope: '<span class="badge hope">Umut · yakında</span>' };
  const root = document.getElementById('seasons');
  root.innerHTML = window.SEASONS.map((s, i) => `
    <section class="season" id="sezon-${i + 1}">
      <header class="season-head"><span class="num">Sezon ${i + 1}</span><h2>${s.icon} ${esc(s.title)}</h2><p>${esc(s.desc)}</p></header>
      <div class="grid">${s.chapters.map(c => {
        const tag = c.status === 'live' ? `a class="card" href="${c.href}"` : 'div class="card soon"';
        const end = c.status === 'live' ? 'a' : 'div';
        return `<${tag}>
          <div class="thumb"><img src="${c.img}" data-toon="${c.img}"${c.soft ? ' data-soft' : ''} alt="${esc(c.title)}" loading="lazy"${c.pos ? ` style="object-position:${c.pos}"` : ''}${c.fit ? ` class="fit-${c.fit}"` : ''}>${badge[c.status]}<span class="year">${esc(c.year)}</span></div>
          <div class="body"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${c.status === 'live' && window.Badges && c.href ? (() => { const id = c.href.split('/')[1]; const [g, n] = window.Badges.count(id); return (n ? `<span class="card-badges">🏅 ${g}/${n}</span>` : '') + `<span class="card-plays" data-count="bitti-${id}" data-label="🏁 {n} kişi bitirdi" hidden></span>`; })() : ''}</div>
        </${end}>`;
      }).join('')}</div>
    </section>`).join('');
  if (window.Toon) window.Toon.apply(root);
  const credits = document.getElementById('credits');
  if (credits) credits.innerHTML = window.SEASONS.flatMap(s => s.chapters).map(c =>
    `<li>${esc(c.title)}: ${esc(c.credit)} · <a href="https://commons.wikimedia.org/wiki/${encodeURI(c.src)}" target="_blank" rel="noopener">Wikimedia Commons</a></li>`).join('');
})();
