// Plastik Çorba modeli: yıllık adım, 1950–2030.
// prod: dünyadaki plastik üretimi (milyon ton/yıl), I: okyanusa giren plastik (Mt/yıl),
// M: okyanusta yüzen büyük parçalar (Mt), m: mikroplastik (Mt), G: Büyük Pasifik Çöp Alanı'ndaki kütle (bin ton).
// Büyük parçalar güneş ve dalgayla yavaşça mikroplastiğe dönüşür; mikroplastik toplanamaz.
(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const Y0 = 1950, Y1 = 2030;
  // waste: atık yönetimi, tax: tek kullanımlık plastiğe vergi, clean: temizlik gemileri (hepsi 0–1)
  // export: atığı yurt dışına satmak (yerel sayılar iyi görünür, bir kısmı başka kıyıdan denize gider), storm: o yılın sel/fırtına çarpanı
  const DEF = { waste: 0.2, tax: 0, clean: 0, export: 0, storm: 1 };

  function newState() { return { y: Y0, prodK: 1, M: 0.3, m: 0.02, G: 0, hist: [] }; }

  function step(st, p0 = DEF) {
    const y = st.y, p = { ...DEF, ...p0 };
    // üretim her yıl büyür; vergi büyümeyi yavaşlatır (tek kullanımlıklar azalır)
    // tarihî büyüme: 1950–75 hızlı, sonra yavaşlar (üretim 2015'te ~390 Mt)
    const g = y < 1975 ? 0.12 : y < 2000 ? 0.07 : 0.035;
    st.prodK *= Math.exp(g * (1 - 0.6 * clamp(p.tax)) - (y >= 2000 ? 0.02 * clamp(p.tax) : 0));
    const prod = 2 * st.prodK;
    // kötü yönetilen atık payı: atık yönetimi azaltır; yurt dışına satılan atığın bir kısmı yine kötü yönetilir
    const mis = 0.5 * (1 - 0.85 * clamp(p.waste)) + 0.18 * clamp(p.export);
    const I = prod * 0.1 * mis * (p.storm || 1);
    const nets = 0.6 + 0.004 * (y - 1950); // kaybolan balıkçı ağları ("hayalet ağlar")
    const clean = 0.9 * clamp(p.clean) * smooth(0, 3, st.M) * (y >= 2013 ? 1 : 0); // temizlik yalnız büyük parçayı toplar
    st.M = Math.max(0, st.M + 0.4 * I + nets * 0.5 - 0.04 * st.M - 0.12 * st.M - clean);
    st.m = Math.max(0, st.m + 0.04 * st.M - 0.008 * st.m);
    // çöp alanı: yüzen büyük parçaların küçük bir kısmı girdabın ortasında birikir (2015 ≈ 79 bin ton)
    st.G = Math.max(0, st.G + 0.0043 * (0.4 * I + nets * 0.5) * 1000 * 0.3 - 0.06 * st.G - clean * 9);
    st.hist.push({ y, prod, I, M: st.M, m: st.m, G: st.G, mis, clean, turtle: 1 - smooth(8, 110, st.M), fishMicro: st.m });
    st.y++;
    return st;
  }
  // tarihteki yol: atık yönetimi yavaş iyileşir, vergi ancak 2015'ten sonra az, temizlik 2019'dan sonra küçük; 2018'den sonra ihracat
  const histP = y => ({ waste: y < 1970 ? 0.2 : y < 2000 ? 0.2 + 0.006 * (y - 1970) : 0.38 + 0.004 * (y - 2000), tax: y >= 2015 ? 0.1 : 0, clean: y >= 2019 ? 0.05 : 0, export: y >= 2018 ? 0.5 : 0, storm: 1 });
  function run(years, pOf) { const st = newState(); for (let i = 0; i < years; i++) step(st, pOf(st.y)); return st; }
  const api = { Y0, Y1, DEF, newState, step, run, histP, clamp, smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PlastikModel = api;
})(typeof window !== 'undefined' ? window : this);
