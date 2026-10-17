// Bakterilerin İntikamı modeli: yıllık adım, 1945–2015.
// Her antibiyotiğin kendi direnç oranı r var (0 = hepsi duyarlı, 1 = hepsi dirençli).
// İlaç ne kadar çok kullanılırsa duyarlılar o kadar ölür, dirençliler kalır ve çoğalır (doğal seçilim).
// Kullanılmayan ilaçta direnç yavaşça azalır (direncin bakteriye küçük bir bedeli var).
(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const Y0 = 1945, Y1 = 2015;
  // yeni antibiyotik sınıfları (tarihî yaklaşık yıllar); 1987'den sonra yeni sınıf neredeyse hiç gelmedi
  const DRUGS = [
    { id: 'pen', name: 'Penisilin', y: 1945 },
    { id: 'tet', name: 'Tetrasiklin', y: 1950 },
    { id: 'met', name: 'Metisilin', y: 1959 },
    { id: 'cef', name: 'Sefalosporin', y: 1964 },
    { id: 'kin', name: 'Kinolon', y: 1987 },
  ];
  // p: reçete kolaylığı (0 çok sıkı, 1 herkese), h: hijyen ve aşı, reserve: yedekte tutulan ilaçlar
  const DEF = { p: 0.3, h: 0, reserve: {} };

  function newState() { return { y: Y0, r: {}, avail: [], I: 1, succ: 1, missed: 0, hist: [] }; }

  function step(st, p = DEF) {
    const y = st.y;
    for (const d of DRUGS) if (d.y === y && !st.avail.includes(d.id)) { st.avail.push(d.id); st.r[d.id] = 0.01; }
    const pr = clamp(p.p === undefined ? 0.3 : p.p), h = clamp(p.h || 0), reserve = p.reserve || {};
    // enfeksiyon yükü: hijyen ve aşı azaltır
    st.I = 1 - 0.45 * h;
    // gerçek bakteriyel enfeksiyonların ne kadarı tedavi ediliyor; fazlası gereksiz (grip, soğuk algınlığı)
    const cover = clamp(0.45 + 1.3 * pr), extra = Math.max(0, pr - 0.42) * 1.6;
    const U = st.I * (cover * 0.5 + extra);
    // ilk tercih: yedekte olmayan, en az dirençli ilaç; yedekler yalnız ağır hastalara
    const front = st.avail.filter(id => !reserve[id]);
    const resv = st.avail.filter(id => reserve[id]);
    const frontSorted = front.slice().sort((a, b) => st.r[a] - st.r[b]);
    const use = {};
    st.avail.forEach(id => { use[id] = 0; });
    // kullanım çoğunlukla en iyi ön ilaca, biraz da diğerlerine gider
    frontSorted.forEach((id, i) => { use[id] = U * (i === 0 ? 0.65 : 0.35 / Math.max(1, frontSorted.length - 1)); });
    if (!frontSorted.length) resv.forEach(id => { use[id] = U / resv.length; });
    // yedek ilaç yalnız ilk ilacın işe yaramadığı ağır hastalara gider
    const bestFront = frontSorted.length ? st.r[frontSorted[0]] : 1;
    resv.forEach(id => { use[id] += U * 0.3 * bestFront / resv.length; });
    for (const id of st.avail) {
      const r = st.r[id], u = use[id];
      st.r[id] = clamp(r + 0.85 * u * (1 - 0.5 * h) * r * (1 - r) + 0.003 * u - 0.05 * (1 - Math.min(1, u * 2)) * r * (1 - r), 0.001, 0.99);
    }
    // tedavi başarısı: ilk ilaç işe yaramazsa ikinci denenir (biraz geç ve daha az etkili)
    const best = frontSorted.length ? st.r[frontSorted[0]] : 1;
    const backup = [...frontSorted.slice(1), ...resv].reduce((m, id) => Math.min(m, st.r[id]), 1);
    const rescue = resv.length ? 0.9 : 0.7; // yedekte taze ilaç varsa ikinci deneme daha başarılı
    const work = (1 - best) + best * (1 - backup) * rescue;
    st.succ = clamp(work * cover + (1 - cover) * 0.15);
    st.missed = 1 - cover;
    st.extra = extra;
    st.hist.push({ y, succ: st.succ, r: { ...st.r }, best, I: st.I, U, cover, extra, missed: st.missed, nAvail: st.avail.length });
    st.y++;
    return st;
  }
  // tarihteki yol: reçete kolay, yeni ilaçlar herkese, hijyen ancak 1980'lerden sonra
  const histP = y => ({ p: y < 1960 ? 0.75 : y < 1995 ? 0.68 : 0.5, h: y < 1985 ? 0.1 : 0.35, reserve: {} });
  function run(years, pOf) { const st = newState(); for (let i = 0; i < years; i++) step(st, pOf(st.y)); return st; }
  const api = { Y0, Y1, DRUGS, DEF, newState, step, run, histP, clamp, smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BakteriModel = api;
})(typeof window !== 'undefined' ? window : this);
