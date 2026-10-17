// Bölüm listesi: yeni bölüm eklemek için buraya bir satır ekle.
// status: 'live' (oynanabilir) | 'soon' (yakında) | 'hope' (umut hikâyesi, yakında)
const C = 'https://upload.wikimedia.org/wikipedia/commons/';
window.SEASONS = [
  { icon: '🐦', title: 'Doğayla Oynamak', desc: 'Bir türü ekle ya da çıkar. Ne olabilir ki?', chapters: [
    { year: '1958', title: 'Serçelere Savaş', status: 'live', href: 'chapters/serce/', text: 'Çin tahılını kurtarmak için serçeleri yok etmeye karar veriyor. Çekirgeler buna çok seviniyor.',
      img: C + '6/6f/Kill_bird_and_insect.jpg', pos: '50% 20%', credit: 'Kampanya afişi, kamu malı', src: 'File:Kill_bird_and_insect.jpg' },
    { year: '1935', title: 'Kurtarıcı Kurbağa', status: 'soon', text: 'Avustralya şeker kamışı böceğine karşı kurbağa getiriyor. Kurbağa böceği yemiyor, kıtayı ele geçiriyor.',
      img: C + 'thumb/2/2b/Cane_toad_%28Bufo_marinus%29.jpg/960px-Cane_toad_%28Bufo_marinus%29.jpg', credit: 'Charles J. Sharp, CC BY-SA 4.0', src: 'File:Cane_toad_(Bufo_marinus).jpg' },
    { year: '1859', title: '24 Tavşanlık Felaket', status: 'soon', text: 'Bir çiftlik sahibi avlanmak için 24 tavşan salıyor. Birkaç on yıl sonra yüz milyonlarca tavşan kıtanın otlarını kemiriyor.',
      img: C + 'thumb/1/14/CSIRO_ScienceImage_2232_Releasing_the_Myxoma_Virus_for_Rabbits.jpg/960px-CSIRO_ScienceImage_2232_Releasing_the_Myxoma_Virus_for_Rabbits.jpg', credit: 'CSIRO Arşivi, CC BY 3.0', src: 'File:CSIRO_ScienceImage_2232_Releasing_the_Myxoma_Virus_for_Rabbits.jpg' },
    { year: '1954', title: 'Gölün Yeni Patronu', status: 'soon', text: 'Victoria Gölü\'ne iri ve lezzetli bir avcı balık bırakılıyor. Göldeki yüzlerce yerli balık türünün çoğu ortadan kayboluyor.',
      img: C + 'thumb/b/b9/Fishing_on_lake_Victoria_06.jpg/960px-Fishing_on_lake_Victoria_06.jpg', credit: 'Jöseph Ashaba, CC BY-SA 4.0', src: 'File:Fishing_on_lake_Victoria_06.jpg' },
  ]},
  { icon: '🌊', title: 'Su Her Şeyi Hatırlar', desc: 'Su her şeyi taşır: atığı da, sonuçlarını da.', chapters: [
    { year: '1960', title: 'Çöle Dönen Deniz', status: 'soon', text: 'Aral Gölü\'nün suyu pamuğa gidiyor. Dünyanın dördüncü büyük gölünden geriye bir çöl ve paslı gemiler kalıyor.',
      img: C + 'thumb/c/cf/Moynaq%2C_Aral_Sea_%286226807306%29.jpg/960px-Moynaq%2C_Aral_Sea_%286226807306%29.jpg', credit: 'Arian Zwegers, CC BY 2.0', src: 'File:Moynaq,_Aral_Sea_(6226807306).jpg' },
    { year: '1969', title: 'Nehir Alev Aldı!', status: 'soon', text: 'Cleveland\'da bir nehir alev alıyor. Nehir yağ ve atıkla o kadar dolu ki bu ilk yangını bile değil.',
      img: C + 'thumb/3/32/HARSHAW_CHEMICAL_COMPANY_DISCHARGES_WASTE_WATER_INTO_THE_CUYAHOGA_RIVER_-_NARA_-_550193.jpg/960px-HARSHAW_CHEMICAL_COMPANY_DISCHARGES_WASTE_WATER_INTO_THE_CUYAHOGA_RIVER_-_NARA_-_550193.jpg', credit: 'F. J. Aleksandrowicz / NARA, kamu malı', src: 'File:HARSHAW_CHEMICAL_COMPANY_DISCHARGES_WASTE_WATER_INTO_THE_CUYAHOGA_RIVER_-_NARA_-_550193.jpg' },
    { year: '1990–', title: 'Nehirden Tabağa', status: 'soon', text: 'Sanayi atıkları nehre karışıyor, nehrin suyu tarlaları sulamaya devam ediyor. Peki toprağa ve ürüne ne oluyor?',
      img: C + 'thumb/b/b7/Ergene%27de_Ya%C5%9Fam.jpg/960px-Ergene%27de_Ya%C5%9Fam.jpg', credit: 'Tarkyldz, CC0', src: "File:Ergene'de_Yaşam.jpg" },
    { year: '2021', title: 'Marmara Nefes Alamıyor', status: 'soon', text: 'Marmara\'nın yüzeyi kalın, gri bir tabakayla kaplanıyor. Arıtılmadan akan atık sular ve ısınan deniz onu besliyor.',
      img: C + 'thumb/1/1b/Mucilage_in_the_Marmara_%283%29.jpg/960px-Mucilage_in_the_Marmara_%283%29.jpg', soft: true, credit: 'Hilmi Hacaloğlu, kamu malı', src: 'File:Mucilage_in_the_Marmara_(3).jpg' },
    { year: '2000–', title: 'Ova Çöküyor', status: 'soon', text: 'Konya Ovası\'nda kuyular derinleştikçe yeraltı suyu çekiliyor ve tarlaların ortasında dev çukurlar açılıyor.',
      img: C + 'thumb/0/05/Trockene_Riesendoline_bei_%C3%87%C4%B1ral%C4%B1_%28Karapinar%2C_Provinz_Konya%29.jpg/960px-Trockene_Riesendoline_bei_%C3%87%C4%B1ral%C4%B1_%28Karapinar%2C_Provinz_Konya%29.jpg', credit: 'Christian1311, CC BY-SA 4.0', src: 'File:Trockene_Riesendoline_bei_Çıralı_(Karapinar,_Provinz_Konya).jpg' },
    { year: '1956', title: 'Dans Eden Kediler', status: 'soon', text: 'Bir fabrika cıvalı atığını koya döküyor. Cıva balıkta, balık insanda birikiyor. İlk belirtiyi kediler veriyor.',
      img: C + 'thumb/6/6a/Minamata_Disease_Museum_20230226_09.jpg/960px-Minamata_Disease_Museum_20230226_09.jpg', credit: 'Minamata Hastalığı Müzesi, CC0', src: 'File:Minamata_Disease_Museum_20230226_09.jpg' },
  ]},
  { icon: '🧪', title: 'Tarlada Kimya Dersi', desc: 'Daha çok ürün için her şey. Ya faturası?', chapters: [
    { year: '1962', title: 'Kuşlar Neden Sustu?', status: 'soon', text: 'DDT mucize gibi görünüyor: sivrisinek ölüyor, ürün artıyor. Sonra kartalların yumurta kabukları incelmeye başlıyor.',
      img: C + 'thumb/2/28/StateLibQld_2_162299_Cloud_spraying_for_mosquitos_at_Norman_Park%2C_1947.jpg/960px-StateLibQld_2_162299_Cloud_spraying_for_mosquitos_at_Norman_Park%2C_1947.jpg', credit: 'State Library of Queensland, kamu malı', src: 'File:StateLibQld_2_162299_Cloud_spraying_for_mosquitos_at_Norman_Park,_1947.jpg' },
    { year: '2018', title: 'Arılar Nerede?', status: 'soon', text: 'Tohumu ilaçla kaplamak pratik. Ama tarlayı ziyaret eden arılar da o ilaçtan payını alıyor.',
      img: C + 'thumb/1/1d/European_honey_bee_extracts_nectar.jpg/960px-European_honey_bee_extracts_nectar.jpg', credit: 'John Severns, kamu malı', src: 'File:European_honey_bee_extracts_nectar.jpg' },
    { year: 'Her yaz', title: 'Boğulan Körfez', status: 'soon', text: 'Tarlalardaki gübre nehirle denize akıyor. Her yaz Meksika Körfezi\'nde balıkların yaşayamadığı dev bir alan oluşuyor.',
      img: C + 'thumb/3/35/Dead_Zone_NASA_NOAA.jpg/960px-Dead_Zone_NASA_NOAA.jpg', credit: 'NOAA, kamu malı', src: 'File:Dead_Zone_NASA_NOAA.jpg' },
    { year: '1930', title: 'Toprak Gökyüzüne Uçtu', status: 'soon', text: 'Büyük Ovalar\'ın çayırları sürülüyor, sonra kuraklık geliyor. Toprak kara bulutlar hâlinde göğe yükseliyor.',
      img: C + 'thumb/b/b0/Son_of_farmer_in_dust_bowl_area%2C_Cimarron_County%2C_Oklahoma%2C_8b38282.jpg/960px-Son_of_farmer_in_dust_bowl_area%2C_Cimarron_County%2C_Oklahoma%2C_8b38282.jpg', credit: 'Arthur Rothstein, kamu malı', src: 'File:Son_of_farmer_in_dust_bowl_area,_Cimarron_County,_Oklahoma,_8b38282.jpg' },
  ]},
  { icon: '🦠', title: 'Görünmez Düşmanlar', desc: 'Gözle göremediğimiz şeyler en uzun süre kalanlar.', chapters: [
    { year: '1945', title: 'Bakterilerin İntikamı', status: 'soon', text: 'Fleming uyarıyor: penisilini az ve yanlış kullanırsanız bakteriler direnç kazanır. Haklı çıkıyor. Evrimi petri kabında izle.',
      img: C + 'thumb/f/f5/Antibiotic_susceptibility_disk_diffusion.jpg/960px-Antibiotic_susceptibility_disk_diffusion.jpg', credit: 'Microrao, CC BY-SA 4.0', src: 'File:Antibiotic_susceptibility_disk_diffusion.jpg' },
    { year: '2015', title: 'İlaçla Büyüyen Tavuk', status: 'soon', text: 'Antibiyotiklerin büyük kısmı hasta insanlara değil, daha hızlı büyüsün diye çiftlik hayvanlarına gidiyor.',
      img: C + 'thumb/2/22/Broiler_Chicken_at_a_farm.jpg/960px-Broiler_Chicken_at_a_farm.jpg', pos: '50% 40%', credit: 'Umar2z, CC BY-SA 4.0', src: 'File:Broiler_Chicken_at_a_farm.jpg' },
    { year: '1987–', title: 'Son Antibiyotik', status: 'soon', text: 'Penisilinden sonra antibiyotikler birbiri ardına bulundu, sonra on yıllarca neredeyse yeni sınıf çıkmadı. Neden bu kadar zor?',
      img: C + 'a/a6/Penicillin_Past%2C_Present_and_Future-_the_Development_and_Production_of_Penicillin%2C_England%2C_1944_D17802.jpg', credit: 'Imperial War Museum, kamu malı', src: 'File:Penicillin_Past,_Present_and_Future-_the_Development_and_Production_of_Penicillin,_England,_1944_D17802.jpg' },
    { year: '1921', title: 'Bir Mucit, İki Felaket', status: 'soon', text: 'Bir mucit benzine kurşun ekliyor ve motorlardaki vuruntu bitiyor. Aynı mucit birkaç yıl sonra CFC\'yi de icat ediyor.',
      img: C + 'thumb/b/bd/EthylCorporationSign.jpg/960px-EthylCorporationSign.jpg', credit: 'Plazak, CC BY-SA 3.0', src: 'File:EthylCorporationSign.jpg' },
  ]},
  { icon: '🧴', title: 'Plastik Çağı', desc: 'Birkaç dakika kullan, yüzlerce yıl sakla.', chapters: [
    { year: '1997', title: 'Plastik Çorba', status: 'soon', text: 'Bir kaptan Pasifik\'in ortasında, karadan çok uzakta, plastikle dolu bir deniz buluyor. Akıntılar şişeleri nereye taşıyor?',
      img: C + 'thumb/e/e4/Plastic_Pollution_in_Santa_Luzia%2C_Cape_Verde.jpg/960px-Plastic_Pollution_in_Santa_Luzia%2C_Cape_Verde.jpg', soft: true, credit: 'CaptainDarwin, CC BY-SA 4.0', src: 'File:Plastic_Pollution_in_Santa_Luzia,_Cape_Verde.jpg' },
    { year: 'Bugün', title: 'Şişe Sofrana Döner', status: 'soon', text: 'Fabrikadan çıkıyor, birkaç dakika kullanılıyor, parçalanıp mikroplastik oluyor. Sonra balığa, oradan sofraya geliyor.',
      img: C + 'thumb/2/26/Bales_of_PET_bottles_closeup.jpg/960px-Bales_of_PET_bottles_closeup.jpg', soft: true, credit: 'Grendelkhan, CC BY-SA 4.0', src: 'File:Bales_of_PET_bottles_closeup.jpg' },
  ]},
  { icon: '🕊️', title: 'Son Örnekler', desc: '"Bunlar bitmez" dediğimiz şeyler.', chapters: [
    { year: '1914', title: 'Milyarlardan Sıfıra', status: 'soon', text: 'Gökyüzünü günlerce karartan milyarlarca göçmen güvercin ağlarla toplu hâlde avlanıyor. 1914\'te sonuncusu, Martha, bir hayvanat bahçesinde ölüyor.',
      img: C + '7/76/Passenger_Pigeon_Net_Cockburn_1829.jpg', credit: 'James Pattison Cockburn (1829), kamu malı', src: 'File:Passenger_Pigeon_Net_Cockburn_1829.jpg' },
    { year: '1992', title: 'Balık Bitmez Sanıyorduk', status: 'soon', text: 'Newfoundland\'de 500 yıllık balıkçılık bir yazda çöküyor. Av kotalarını sen belirle, diğer gemiler de avlansın.',
      img: C + 'thumb/4/4b/Gadus_morhua_Gervais.jpg/960px-Gadus_morhua_Gervais.jpg', fit: 'contain', credit: 'Gervais ve Boulart, kamu malı', src: 'File:Gadus_morhua_Gervais.jpg' },
    { year: '1870', title: 'Kafatası Dağı', status: 'soon', text: 'On milyonlarca bizon birkaç on yılda birkaç yüze iniyor. Kafatası yığınları gübre fabrikalarına gidiyor.',
      img: C + 'thumb/e/e9/Bison_skull_pile_edit.jpg/960px-Bison_skull_pile_edit.jpg', credit: 'Bilinmiyor (1870\'ler), kamu malı', src: 'File:Bison_skull_pile_edit.jpg' },
  ]},
  { icon: '🌱', title: 'Düzeltebildiklerimiz', desc: 'Düzeltebildiğimiz zamanlar da oldu.', chapters: [
    { year: '1987', title: 'Dünyanın Anlaştığı Gün', status: 'hope', text: 'Bir kez olsun bütün dünya anlaşıyor ve işe yarıyor. Montreal Protokolü\'nü sen müzakere et.',
      img: C + 'thumb/b/b6/Hole_in_the_Ozone_Layer_Over_Antarctica_-_GPN-2002-000117.jpg/960px-Hole_in_the_Ozone_Layer_Over_Antarctica_-_GPN-2002-000117.jpg', credit: 'NASA, kamu malı', src: 'File:Hole_in_the_Ozone_Layer_Over_Antarctica_-_GPN-2002-000117.jpg' },
    { year: '1995', title: 'Nehirleri Değiştiren Kurtlar', status: 'hope', text: 'Yellowstone\'a 14 kurt getiriliyor ve nehirlerin akışına kadar her şey değişiyor.',
      img: C + 'thumb/f/f0/Wolf_moving_through_fresh_snow_%2838346213996%29.jpg/960px-Wolf_moving_through_fresh_snow_%2838346213996%29.jpg', credit: 'Yellowstone NP (NPS), kamu malı', src: 'File:Wolf_moving_through_fresh_snow_(38346213996).jpg' },
    { year: '1957', title: 'Ölü Nehre Fok Geldi', status: 'hope', text: 'Bilim insanları Thames\'i "biyolojik olarak ölü" ilan ediyor. Bugün nehirde foklar ve denizatları yaşıyor.',
      img: C + 'thumb/6/67/Thames_with_seals_at_Crayford_Ness_-_2020-09-27.jpg/960px-Thames_with_seals_at_Crayford_Ness_-_2020-09-27.jpg', credit: 'The wub, CC BY-SA 4.0', src: 'File:Thames_with_seals_at_Crayford_Ness_-_2020-09-27.jpg' },
  ]},
];

(() => {
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const badge = { live: '<span class="badge live">Oyna</span>', soon: '<span class="badge">Yakında</span>', hope: '<span class="badge hope">Umut · yakında</span>' };
  const root = document.getElementById('seasons');
  root.innerHTML = window.SEASONS.map((s, i) => `
    <section class="season">
      <header class="season-head"><span class="num">Sezon ${i + 1}</span><h2>${s.icon} ${esc(s.title)}</h2><p>${esc(s.desc)}</p></header>
      <div class="grid">${s.chapters.map(c => {
        const tag = c.status === 'live' ? `a class="card" href="${c.href}"` : 'div class="card soon"';
        const end = c.status === 'live' ? 'a' : 'div';
        return `<${tag}>
          <div class="thumb"><img src="${c.img}" data-toon="${c.img}"${c.soft ? ' data-soft' : ''} alt="${esc(c.title)}" loading="lazy"${c.pos ? ` style="object-position:${c.pos}"` : ''}${c.fit ? ` class="fit-${c.fit}"` : ''}>${badge[c.status]}<span class="year">${esc(c.year)}</span></div>
          <div class="body"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div>
        </${end}>`;
      }).join('')}</div>
    </section>`).join('');
  if (window.Toon) window.Toon.apply(root);
  const credits = document.getElementById('credits');
  if (credits) credits.innerHTML = window.SEASONS.flatMap(s => s.chapters).map(c =>
    `<li>${esc(c.title)}: ${esc(c.credit)} · <a href="https://commons.wikimedia.org/wiki/${encodeURI(c.src)}" target="_blank" rel="noopener">Wikimedia Commons</a></li>`).join('');
})();
