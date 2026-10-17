// Milyarlardan Sıfıra modeli: göçmen güvercin, yıllık adım, 1860–1914.
// P: güvercin sayısı (milyar), F: meşe-kayın ormanı (1 = ilk ormanlar), nest: o yılki yuva başarısı.
// Güvercin yılda tek yumurta yapar ve yalnız dev kolonilerde ürer (Allee etkisi): sürü küçülünce üreme çöker.
(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const Y0 = 1860, Y1 = 1914;
  // nest: yuva koruması, quota: pazar yasağı/av sınırı, forest: orman koruma (0–1)
  // guard: o yıl koloniye bekçi gönderildi mi (0/1), colony: o yılki koloninin büyüklük çarpanı, mast: palamut-kayın yemişi bolluğu
  const DEF = { nest: 0, quota: 0, forest: 0, guard: 0, colony: 1, mast: 1 };
  const allee = P => smooth(0.03, 0.6, P);
  function newState() { return { y: Y0, P: 4.2, F: 0.95, hist: [] }; }
  function step(st, p0 = DEF) {
    const y = st.y, p = { ...DEF, ...p0 };
    // demiryolu ve telgraf: avcılar koloniye kuşlarla birlikte varır
    const reach = 0.04 + 0.27 * smooth(1866, 1890, y);
    // yuva yasağı tek başına yetmez: telgrafla haber alınan dev kolonide bekçi yoksa avcılar yasağı çiğner
    const enforce = clamp(p.guard ? 0.95 : p.nest * (p.colony > 1 ? 0.35 : 0.8));
    // avın %60'ı yuvalarda (yuva yasağıyla azalır), %40'ı göç yolunda (yalnız av sınırıyla azalır)
    const kill = reach * (1 - 0.8 * clamp(p.quota)) * (0.4 + 0.6 * (1 - enforce)) * (p.colony > 1 && !p.guard ? 1.5 : 1);
    const nest = clamp(1 - 0.7 * clamp(reach / 0.31) * (1 - enforce) * (1 - 0.6 * clamp(p.quota))) * p.mast; // avcı yuvayı bozar
    const K = 8.5 * (0.3 + 0.7 * st.F);
    const births = 0.58 * st.P * allee(st.P) * nest * Math.max(0, 1 - st.P / K);
    const deaths = 0.22 * st.P + kill * st.P;
    st.P = Math.max(0, st.P + births - deaths);
    if (st.P < 1e-9) st.P = 0;
    const clear = (0.004 + 0.011 * smooth(1855, 1890, y)) * (1 - 0.75 * clamp(p.forest));
    st.F = Math.max(0.3, st.F - clear);
    st.hist.push({ y, P: st.P, F: st.F, kill: kill * st.P, killRate: kill, nest, reach, allee: allee(st.P) });
    st.y++;
    return st;
  }
  const histP = y => ({ nest: y >= 1875 ? 0.08 : 0, quota: y >= 1897 ? 0.5 : 0, forest: 0 });
  function run(years, pOf) { const st = newState(); for (let i = 0; i < years; i++) step(st, pOf(st.y)); return st; }
  const api = { Y0, Y1, DEF, newState, step, run, histP, allee, clamp, smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GuvercinModel = api;
})(typeof window !== 'undefined' ? window : this);
