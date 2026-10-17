// Aral Gölü modeli: yıllık adım, 1960'tan başlar.
// V: göl hacmi (km³), A: alan (km²), tuz: g/L, F: balık (1 = 1960 avı), C: pamuk (1 = 1960 üretimi), soil: toprak sağlığı.
// Nehirlerin doğal getirdiği su Qnat; w kadarı pamuğa çevrilir, kalanı göle akar.
// Buharlaşma alanla orantılı: büyük göl çok buharlaştırır, küçük göl az. Böylece göl yeni bir dengeye doğru küçülür.
(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  const Y0 = 1960, Y1 = 2010;
  const V0 = 1093, A0 = 68000, S0 = 10;        // 1960: hacim, alan, tuzluluk
  const QNAT = 70;                              // nehirlerin yıllık doğal suyu (km³)
  const NET_EVAP = 0.82;                        // m/yıl (buharlaşma − yağış)
  const NEED = 7;                               // 1960 pamuğu için tarlaya ulaşan etkin su (km³)
  // q: o yılın nehir debisi (1 = ortalama; kurak yıl ~0,6, bereketli ~1,25)
  const DEF = { w: 0.2, fix: 0, warm: 1, dam: 0, q: 1 };

  const areaOf = V => A0 * Math.pow(Math.max(0, V) / V0, 0.6);
  const salOf = V => Math.min(280, S0 * V0 / Math.max(5, V)); // göl neredeyse kuruyunca tuz kabuğa döner
  // Moynak limanının kıyıya uzaklığı (km): göl küçüldükçe su çekilir
  const shoreKm = A => Math.max(0, 150 * (1 - Math.pow(A / A0, 0.9)) - 4);

  function newState() {
    return { y: Y0, V: V0, A: A0, sal: S0, F: 1, C: 1, soil: 1, eff: 0.5, Vn: null, saln: null, dam: false, hist: [] };
  }

  function step(st, p = DEF) {
    // kanal onarımı yavaş yavaş verimi artırır (yıllar sürer)
    const effT = 0.5 + 0.35 * clamp(p.fix);
    st.eff += (effT - st.eff) * 0.18;
    const q = p.q === undefined ? 1 : p.q;
    const inflow = QNAT * q * (1 - clamp(p.w));
    const evap = NET_EVAP * p.warm * st.A / 1000;
    st.V = clamp(st.V + inflow - evap, 8, V0 * 1.02); // fazlası taşar
    st.A = areaOf(st.V);
    st.sal = salOf(st.V);
    // 1987'den sonra göl ikiye ayrılır; kuzeydeki küçük göl Seyhun'dan beslenir. Baraj onu ayrı tutar.
    if (st.Vn === null && st.V < 420) { st.Vn = 22; st.saln = st.sal; }
    if (st.Vn !== null) {
      if (p.dam && !st.dam) st.dam = true;
      const nIn = 0.3 * inflow * (st.dam ? 1 : 0.55);
      const An = 3300 * Math.pow(st.Vn / 22, 0.8);
      st.Vn = clamp(st.Vn + nIn - NET_EVAP * p.warm * An / 1000, 4, st.dam ? 27 : 30);
      st.saln = st.dam ? Math.max(8, st.saln + (9 * 22 / st.Vn - st.saln) * 0.5) : Math.max(st.saln, 0.6 * st.sal);
    }
    // balık: tuz yükselince ölür; kıyı uzaklaşınca tutulamaz
    const live = 1 - smooth(12, 26, st.sal);
    st.F = clamp(st.F + 0.35 * st.F * (live - st.F) - 0.45 * st.F * smooth(16, 30, st.sal) + 0.01 * live);
    // pamuk: tarlaya ulaşan su arttıkça artar ama azalan getiriyle; tuzlanan toprak verimi düşürür
    const wd = QNAT * q * clamp(p.w) * st.eff;
    const dry = clamp(1 - st.A / A0);
    st.soil = clamp(st.soil - 0.006 * smooth(0.45, 0.95, p.w) * (st.eff < 0.7 ? 1 : 0.4) - 0.012 * smooth(0.35, 0.8, dry) + 0.004);
    st.C = Math.pow(wd / NEED, 0.45) * (0.55 + 0.45 * st.soil);
    // kanal onarımı sürerken kanallar kapanır, birkaç yıl pamuk düşer (onarımın bedeli)
    st.C *= 1 - 0.22 * clamp((effT - st.eff) / 0.35);
    st.dust = smooth(0.3, 0.75, dry);
    st.hist.push({ y: st.y, V: st.V, A: st.A, sal: st.sal, F: st.F, C: st.C, soil: st.soil, dust: st.dust, Vn: st.Vn, saln: st.saln });
    st.y++;
    return st;
  }

  // tarihteki yol: suyun giderek daha büyük kısmı pamuğa
  const histW = y => y < 1960 ? 0.2 : y < 1970 ? 0.2 + 0.04 * (y - 1960) : y < 1978 ? 0.6 + 0.031 * (y - 1970) : y < 1989 ? 0.95 : 0.88;
  const histP = y => ({ ...DEF, w: histW(y), dam: y >= 2005 ? 1 : 0 });

  function run(years, pOf) { const st = newState(); for (let i = 0; i < years; i++) step(st, pOf(st.y)); return st; }

  const api = { Y0, Y1, V0, A0, S0, QNAT, DEF, areaOf, salOf, shoreKm, newState, step, run, histW, histP, clamp, smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AralModel = api;
})(typeof window !== 'undefined' ? window : this);
