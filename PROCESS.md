# Üretim süreci

Site sürekli dönen bir döngüyle büyür. Yönetici (ana Claude oturumu) bölümleri yapar, testçi oturumlarını yönetir, geri bildirimleri işler ve öğrenilenleri skill'e yazar. Kullanıcı istediği an yön verir, en sonda toplu bakar.

## Döngü

1. **Seç:** `ROADMAP.md` içinden sıradaki sezonun ilk yapılmamış bölümü seçilir. Sezonlar sırayla dolaşılır: her sezondan bir bölüm, sonra başa dönülür.
2. **Araştır:** olaylar ve sayılar güvenilir kaynaklarla doğrulanır. Çok paylaşılan ama kaynağı belirsiz rakamlar (ör. "tişört 2.700 litre") kullanılmaz.
3. **Tasarla:** önce bölüme özgü mekanik ve ikilem belirlenir. Sorulacak soru: "Bu konunun kendine has kararı ne, oyuncunun eline nasıl veririm?" Ardından rol, kaydırıcılar, baskı ölçeği, karar kartları, sahne ve geniş bakış tasarlanır.
4. **Model:** `model.js` yazılır, node ile tarihe göre ayarlanır. Bir senaryo tablosu çıkarılır (hiç / tarih / hep maksimum / akıllı). Hep-maksimum yolu kazanmamalı.
5. **Yap:** `chapters/<ad>/` altına yazılır. Ortak parçalar kullanılır: görev kartı (`mission.js`), rozetler (`badges.js`, 4 açık ve 4 gizli), sahne etiketleri, dönüm noktası kartları, karar kuyruğu.
6. **Kendi kontrolü:** skill'deki yayın öncesi kontrol listesi uygulanır.
   - uç değer ve rozet senaryoları;
   - gerçek hızda akış logu;
   - `tools/layout-audit.js` çıktısı "sorun yok";
   - telefon görünümü;
   - `node --check`.
7. **Yayın:** sürüm `?v=` artırılır, push edilir, canlı site curl ile doğrulanır. `chapters.js` içinde bölüm `live` yapılır, `ROADMAP.md` içinde ✅ işaretlenir.
8. **Test:** yeni (ya da büyük ölçüde değişen) bölüm için `tools/tester-brief.md` şablonuyla ayrı bir testçi oturumu açılır. Testçi dosya düzenlemez, yalnız rapor verir.
9. **Ayıkla ve düzelt:** rapordaki sorunlar önem sırasına göre ele alınır.
   - Yüksek önemliler hemen düzeltilir.
   - Ortalar toplanır.
   - Düşükler `ROADMAP.md` içindeki "Bekleyen iyileştirmeler" bölümüne yazılır.
   - Düzeltmeler yayınlanır.
10. **Öğren:** birden fazla bölümü ilgilendiren her ders skill'e yazılır (`~/.claude/skills/ekoloji-oyun-bolumu/SKILL.md`, kopyası `.claude/skills/`). Gerekiyorsa eski bölümlere de geri uygulanır.
11. **Tekrar:** 1. adıma dönülür.

## Kurallar

- Kullanıcıya bölüm arasında onay sorulmaz. Yalnız gerçekten onun vereceği bir karar varsa sorulur.
- Kullanıcının araya giren geri bildirimi her zaman sıradaki işin önüne geçer.
- Testçi oturumları yalnız okur ve oynar. Kod değişikliği yalnız yönetici oturumunda yapılır; böylece iki yazar aynı dosyaya dokunmaz.
- Paylaşılan dosyalar (`badges.js`, `chapters.js`, `chapter.css`, `style.css`) yalnız yönetici tarafından düzenlenir.
