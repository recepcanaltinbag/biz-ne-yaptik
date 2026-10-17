# Biz Ne Yaptık?

İnsanlığın doğayla imtihanının oynanabilir tarihi. Her bölüm gerçek bir ekolojik olayı kısa bir hikâye, basit bir simülasyon, gerçek sonuçlar ve bugün ne yapılabileceği bölümleriyle anlatır.

## Yerelde çalıştırma

```bash
python3 -m http.server 8790
```

Sonra http://localhost:8790 adresini aç.

## Yapı

```
index.html                 Ana sayfa ve bölüm listesi
assets/css/style.css       Ortak stil (açık ve koyu tema)
chapters/<bolum>/          Her bölüm kendi index.html + js dosyasıyla
```

## GitHub Pages

Repo'yu GitHub'a gönder, sonra Settings → Pages → "Deploy from a branch" → `main` / `(root)` seç.
