# Akış şablonu (her bölüm için)

Kullanıcının geri bildirimi: "çok bilgi var, anlamak zor, oyunun içine girmek zor, akışta kopukluklar var".
Bu şablon, araştırma (Case, Victor, Mayer, Sweller, Nintendo'nun dört adımı, Valve/Portal, Chen'in akış kanalı, Schell'in ilgi eğrisi, Jonasson ve Purho'nun "juice" anlatımı) ve testçi raporları üzerine kuruldu. Hedef süre ~5 dakika.

## Vuruşlar (beats)

| # | Ne zaman | Vuruş | Ne olur | Ne olmaz |
|---|---|---|---|---|
| 0 | 0:00 | **Kanca** | Başlık + **tek soru** ("24 tavşan 50 yılda ne yapar?") + Başla | Uzun görev metni |
| 1 | 0:10 | **Sinema** | 2–3 karelik sahne: olay başlıyor (arşiv fotoğrafı ya da kodla çizim). Atlanabilir | Aynı şeyi sonra kartla tekrar anlatmak |
| 2 | 0:30 | **📼 Önce tarih** | Tarihteki ayarlarla hızlı film (~18 sn): sahne, sayaç, haber bandı. Sonunda **tarihin skoru** | Kaydırıcı oynatmak (kilitli) |
| 3 | 0:50 | **🎯 Görev kartı** | Geri sarılır. Görev kartı açılır: 📼 Tarihte X oldu · Sen · Kontrolün · Hedefin · Dikkat (`missionCard`) | Ayrı ayrı kartlar |
| 4 | 1:00 | **Tanıt** | Yalnız **ilk araç** açık. Spot ışığı kaydırıcıyı gösterir. Oynayınca **"Ne olur?"** önizlemesi ve sahnede anında tepki | Aynı anda 3 kaydırıcı, 4 gösterge |
| 5 | 1:30–3:00 | **Geliştir** | Yeni araç **ihtiyaç anında** açılır (1 durduran kart + spot ışığı). Haberler bant olarak akar. 💡 satırı tek adımı söyler | Bilgi kartları yağmuru |
| 6 | ~3:00 | **Ters köşe** | Sistemin sürprizi (direnç, geç kalan çit, eşik). Kısa sinema + **önce göster, sonra sor** kararı | Bağlamsız karar kartı |
| 7 | 4:00 | **Bitiş** | Son yıllar hızlanır. Sonuç: **sen ve tarih** yan yana | Uzun metin |
| 8 | sonra | **Hikâye** | "Gerçekte ne oldu?" resimli kartlar (İleri →). Dersler. Laboratuvara bir meydan okuma cümlesiyle geçiş | Paragraflar |

## Kurallar

1. **Kesinti bütçesi.** Oyunu durduran şey en fazla 4 olsun: araç tanıtımı, ders veren dönüm noktası, karar. Gerisi haber bandına gider.
2. **Önce göster, sonra sor.** Oyuncunun bilmediği bir yer ya da şey (Kokaral, çit, koloni) önce haritada ya da sahnede spot ışığıyla gösterilir, karar sonra gelir.
3. **Bilgi nesnenin yanında.** Sayı ve uyarı sahnedeki nesnenin yanında bir etiket olur. Ayrı kart açılmaz.
4. **Aynı bilgi iki yerde olmaz.** Sahne gösteriyorsa yazma. Sayaç sahnedeyse yıl çubuğunda tekrarlama.
5. **Hareket → hemen sonuç.** Kaydırıcı oynayınca sahne o anda tepki verir, önizleme "5 yıl sonra"yı gösterir.
6. **Göstergeler kademeli.** Bir gösterge, ilgili araç ya da olay gelene kadar gizli ya da sönük durur.
7. **Kart en fazla 2 cümle ve 1 sayı taşır.**
8. **Hiçbir şey üst üste binmez.** Etiketler yıl çubuğundan, banttan, kartlardan ve HUD'dan kaçar. e2e testi çakışmaları raporlar.
9. **Sahne içi etkileşim:** sahne başına en fazla 1 dokunuş. Süre sınırı ve başarısızlık yok; dokununca hemen karşılık gelir; ~3 sn içinde kendiliğinden ilerler. Jest kendini anlatmıyorsa koyma.
10. **İlgi eğrisi.** Kartlar eşit aralıklı serpiştirilmez. Tepeler (karar, ters köşe), vadiler (sahne akar) ve sona doğru artan tempo olur.
11. **Tekrar oynayanı yorma.** Bölümü bitiren için sinema, önce tarih filmi ve spot ışığı turları atlanır.

## Bir bölümü şablona geçirme listesi
- [ ] Başlıkta tek soru
- [ ] 1–3 sinema (açılış, ters köşe, gerekiyorsa son)
- [ ] 📼 önce tarih ve ⏪ şimdi sen kartı
- [ ] İlk araç tek başına; spot ışığı ve "Ne olur?" önizlemesi
- [ ] Durduran kart sayısı ≤ 4 (+ kararlar); gerisi haber bandında
- [ ] Her karardan önce göster (harita veya spot ışığı)
- [ ] Göstergeler kademeli
- [ ] Sonuçta sen ve tarih
- [ ] Gerçekte ne oldu: resimli hikâye
- [ ] e2e: hata yok, takılma yok, çakışma yok (masaüstü ve telefon)
