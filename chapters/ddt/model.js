// Kuşlar Neden Sustu? modeli: yıllık adım, 1946–1990.
// P: zararlı böcek (taşıma kapasitesi 4), N: faydalı böcekler (uğur böceği vb., 1 = sağlıklı), R: zararlıların DDT direnci,
// D: çevredeki DDT (toprak ve suda birikir, yavaş yıkılır), B: yırtıcı kuşlar (kartal, balıkçıl; 1 = sağlıklı), S: ötücü kuşlar.
// DDT besin zincirinde her basamakta katlanır: su → plankton → balık → kuş. Kuştaki DDE yumurta kabuğunu inceltir.
(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const Y0 = 1946, Y1 = 1990, PK = 4;
  // z: ilaçlanan yerler. f: tarla (zararlıyı azaltır), g: bahçeler/ağaçlar (ötücü kuşlar zehirlenir), m: bataklık (sivrisinek azalır, DDT doğrudan suya ve balığa gider)
  const DEF = { s: 0, ipm: 0, ban: 0, res: 1, z: { f: 1, g: 1, m: 1 } };

  // besin zinciri (ppm): Woodwell ve ark. 1967'deki Long Island ölçümlerine göre ölçeklendi
  const chain = D => ({ water: 0.000015 * D, plankton: 0.012 * D, fish: 0.6 * D, bird: 22 * D });
  const thinOf = D => 20 * smooth(4, 70, chain(D).bird); // yumurta kabuğu incelmesi (%)

  function newState() { return { y: Y0, P: 1.56, N: 1, R: 0, D: 0, B: 1, S: 1, Y: 1, hist: [] }; }
  const yieldOf = P => clamp(1.2 - 0.18 * P, 0, 1.25);
  // ürün, zararlının çok az olduğu bir tarlaya göre ölçülür: ilaçsız tarla ~%84 verir
  const Y_BASE = yieldOf(0.6);

  function step(st, p = DEF) {
    const s = p.ban ? 0 : clamp(p.s || 0), ipm = clamp(p.ipm || 0), z = p.z || DEF.z;
    const sf = s * z.f, sg = s * z.g, sm = s * z.m;
    const kill = 0.85 * sf * (1 - st.R);
    st.N = clamp(st.N + 0.35 * st.N * (1 - st.N) + 0.03 + 0.3 * ipm * (1 - st.N) - 0.45 * sf * st.N, 0.03, 1);
    st.P = clamp(st.P + 0.9 * (p.heat || 1) * st.P * (1 - st.P / PK) - kill * st.P - 0.55 * st.N * st.P - 0.25 * ipm * st.P, 0.05, PK);
    st.R = clamp(st.R + 0.11 * Math.max(sf, sm) * (p.res || 1) * (1 - st.R) - 0.03 * st.R * (1 - Math.max(sf, sm)), 0, 0.7);
    // bataklığa sıkılan DDT besin zincirine en çok onu taşır
    st.D = Math.max(0, st.D + 0.35 * (0.25 * sf + 0.15 * sg + 0.6 * sm) - 0.09 * st.D);
    const thin = thinOf(st.D), hatch = 1 - smooth(4, 13, thin);
    st.B = clamp(st.B + 0.13 * st.B * hatch * (1 - st.B) - 0.16 * st.B * (1 - hatch) + 0.004, 0.03, 1);
    st.S = clamp(st.S + 0.3 * st.S * (1 - st.S) + 0.01 - 0.55 * (0.35 * sf + 0.65 * sg) * 1.6 * st.S * smooth(0.1, 0.6, s + st.D / 6), 0.03, 1);
    st.Y = yieldOf(st.P) / Y_BASE;
    const c = chain(st.D);
    st.hist.push({ y: st.y, P: st.P, N: st.N, R: st.R, D: st.D, B: st.B, S: st.S, Y: st.Y, thin, hatch, bird: c.bird, s, ipm, mosq: 1 - 0.8 * sm });
    st.y++;
    return st;
  }
  // tarihteki yol: savaş sonrası hızla artan ilaçlama, 1972 sonunda yasak
  const histS = y => y < 1946 ? 0 : y < 1953 ? 0.3 + 0.085 * (y - 1946) : y <= 1972 ? 0.9 : 0;
  const histP = y => ({ s: histS(y), ipm: y >= 1975 ? 0.4 : 0, ban: y >= 1973 ? 1 : 0 });
  function run(years, pOf) { const st = newState(); for (let i = 0; i < years; i++) step(st, pOf(st.y)); return st; }

  const api = { Y0, Y1, PK, DEF, chain, thinOf, newState, step, run, histS, histP, clamp, smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DdtModel = api;
})(typeof window !== 'undefined' ? window : this);
