// 24 Tavşanlık Felaket modeli: yıllık adım, 1859–2000.
// A: tavşanların ulaştığı alan (uygun alanın oranı), R: tavşan sayısı (milyon), G: otlak (1 = sağlam).
// Virüs zamanla yumuşar (çok öldüren soy, tavşan çabuk ölünce yayılamaz), tavşanlar direnç kazanır: ikisi birlikte evrilir.
(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const Y0 = 1859, Y1 = 2000;
  const WA = 0.25;
  const T = { poison: 0.06, pm: 17, ph: 330, r: 0.7, p0: 0.45, p1: 0.45, dens: 100, qk: 0.1, va: 0.1 }; // Batı Avustralya'nın uygun alandaki payı (çitin arkası)
  // trap: tuzak, zehir ve yuva sökme; fence: çit bakımı; vir: virüs programı (yeniden salım, pire); rain: o yılın yağışı (kuraklık < 1)
  const DEF = { trap: 0, fence: 0, vir: 0, rain: 1, fenceBuilt: 0, myxo: 0, rhdv: 0, flea: 0 };
  function newState() { return { y: Y0, N: 1, A: 0.0005, R: 0.000024, G: 1, v: 0, q: 0, prev: 0, v2: 0, q2: 0, prev2: 0, hist: [] }; }
  function step(st, p0 = DEF) {
    const y = st.y, p = { ...DEF, ...p0 };
    // yayılma: cephe yılda ~100 km ilerler; çit yapıldığında cephe Batı'ya varmadıysa arkası korunur (bakım kadar)
    let cap = 1;
    if (p.fenceBuilt && p.fenceBuilt.A < 1 - WA) cap = 1 - WA * clamp(0.35 + 0.6 * p.fence);
    st.A = Math.min(cap, st.A + 0.22 * st.A * (1 - st.A / cap) + 0.0003);
    // otlak: tavşan yer, yağmur büyütür
    const K0 = 3000; // tavşan taşıma kapasitesi (milyon), tam alan ve sağlam otlak
    const graze = st.R / (K0 * Math.max(0.02, st.A));
    st.G = clamp(st.G + 0.22 * (1 - st.G) * p.rain - 0.2 * graze * st.G);
    const K = K0 * st.A * (0.25 + 0.75 * st.G) * (0.6 + 0.4 * p.rain);
    // virüs 1: miksomatozis; ilk soy çok öldürür, zamanla yumuşar; program (vir) yeni ve sert soy salar, pire yayar
    if (p.myxo && st.v === 0) { st.v = 0.99; st.prev = 0.6; }
    let kV = 0;
    if (st.v > 0) {
      const fresh = 0.35 * clamp(p.vir);
      st.v = st.v + T.va * (0.62 - st.v) + fresh * (0.97 - st.v);
      // sivrisinek yağmurda, pire kuraklıkta da taşır; program yeni soylar salar
      st.prev = clamp(0.45 + 0.35 * p.rain + (p.flea ? 0.12 + 0.35 * (1 - p.rain) : 0) + 0.2 * clamp(p.vir)) * smooth(0, T.dens, st.R);
      kV = st.prev * st.v * (1 - st.q) * 0.95;
      st.q = clamp(st.q + T.qk * kV * (0.75 - st.q)); // direnç bir yerde doyar: virüs öldürmeye devam eder ama eskisi kadar değil
    }
    // virüs 2: kalisivirüs (1995)
    let kV2 = 0;
    if (p.rhdv && st.v2 === 0) { st.v2 = 0.9; }
    if (st.v2 > 0) { st.prev2 = clamp(0.5 * (1.3 - 0.5 * p.rain) + 0.2 * clamp(p.vir)) * smooth(0, 70, st.R); kV2 = st.prev2 * st.v2 * (1 - st.q2) * 0.9; st.q2 = clamp(st.q2 + 0.12 * kV2 * (0.75 - st.q2)); }
    const kT = 0.5 * clamp(p.trap) * (0.4 + 0.6 * smooth(0, 700, st.R)) * (p.rain < 0.7 ? 2.0 : p.rain > 1.2 ? 1.6 : 1); // tuzakçı, tavşan bolken çok yakalar; kuraklıkta tavşan su başında toplanır
    const r = T.r * (p.rain > 1.2 ? 1.8 : 1); // yağışlı yılda tavşan patlaması
    const grow = r * st.R * Math.max(0, 1 - st.R / Math.max(1, K));
    // tilki ve yabani kedi: sabit bir sayı yer; tavşan azken payı büyür (yırtıcı çukuru)
    const kP = y >= 1871 ? T.pm / (st.R + T.ph) : 0;
    const kill = st.R * clamp(kT + kV + kV2 + kP, 0, 0.97);
    st.R = Math.max(0, st.R + grow - kill - (st.R > K ? 0.5 * (st.R - K) : 0));
    // yerli hayvanlar (bilbi, kanguru faresi...): tavşan otu ve yuvayı kapar; zehir ve tuzak onları da öldürür
    st.N = clamp(st.N + 0.06 * (1 - st.N) * st.G - (0.05 * clamp(st.R / (K0 * 0.5 * Math.max(0.05, st.A))) * st.A + T.poison * clamp(p.trap) * st.A) * st.N);
    const Gtot = st.G * st.A + (1 - st.A); // tavşanın ulaşmadığı otlak sağlam
    st.hist.push({ y, Gtot, N: st.N, kP, A: st.A, R: st.R, G: st.G, K, v: st.v, q: st.q, v2: st.v2, q2: st.q2, kT, kV, kV2, cap, trapCatch: kT * st.R });
    st.y++;
    return st;
  }
  // tarihteki yol: tuzak 1880'lerden, çit 1901–07 (cephe çoktan geçmişti), miksomatozis 1950, pire 1969, kalisivirüs 1995
  const histP = (y, st) => ({ trap: y < 1880 ? 0 : y < 1950 ? 0.35 : 0.2, fence: y >= 1907 ? 0.5 : 0, vir: y >= 1952 ? 0.25 : 0, rain: 1, fenceBuilt: y >= 1907 ? { y: 1901, A: st ? st.histA1901 || 0.99 : 0.99 } : 0, myxo: y >= 1950 ? 1 : 0, rhdv: y >= 1995 ? 1 : 0, flea: y >= 1969 ? 1 : 0 });
  function run(years, pOf) { const st = newState(); for (let i = 0; i < years; i++) step(st, pOf(st.y, st)); return st; }
  const api = { T, Y0, Y1, WA, DEF, newState, step, run, histP, clamp, smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TavsanModel = api;
})(typeof window !== 'undefined' ? window : this);
