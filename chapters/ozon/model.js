// Dünyanın Anlaştığı Gün modeli: yıllık adım, 1974–2060.
// Bloklar CFC kullanır; ikna (p) yükselince anlaşmaya imza atar, sonra anlaşmanın takvimine göre CFC'yi bırakır.
// Stratosferdeki klor (Cl) gecikmeyle birikir (CFC havada 50–100 yıl kalır); ozon deliği klor 1980 düzeyini aşınca açılır.
(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const Y0 = 1974, Y1 = 2060;
  // share: 1986'daki CFC payı; dev: gelişmekte olan ülke (talebi büyür, 10 yıl ek süre alır, fona muhtaç); base: başlangıç isteği; ind: sanayinin direnci
  const BLOCS = [
    { id: 'abd', name: 'ABD', share: 0.29, dev: false, base: 0.45, ind: 0.35, col: '#3a6a9a' },
    { id: 'avr', name: 'Avrupa', share: 0.30, dev: false, base: 0.35, ind: 0.45, col: '#4f7a5a' },
    { id: 'jap', name: 'Japonya', share: 0.10, dev: false, base: 0.35, ind: 0.4, col: '#c0503a' },
    { id: 'ssc', name: 'SSCB', share: 0.10, dev: false, base: 0.3, ind: 0.35, col: '#8a3a3a' },
    { id: 'cin', name: 'Çin', share: 0.05, dev: true, base: 0.25, ind: 0.3, col: '#d0a030' },
    { id: 'hin', name: 'Hindistan', share: 0.02, dev: true, base: 0.25, ind: 0.3, col: '#e08a3a' },
    { id: 'gel', name: 'Diğer ülkeler', share: 0.14, dev: true, base: 0.3, ind: 0.25, col: '#8a6fd8' },
  ];
  // sci: bilim ve ölçüm, dip: diplomasi, fund: çok taraflı fon (0–1); S: anlaşmanın sıkılığı (0 = yalnız %50 kesinti, 1 = hızlı tam yasak); cheat: kaçak üretim
  const DEF = { sci: 0.2, dip: 0.2, fund: 0, S: 0.5, cheat: 0, slide: -1, hcfc: 0, noTreaty: 0 };
  const CL80 = 1.0;
  const K = { up: 0.02, dec: 245, cl0: 0.9 }; // 1980'deki klor (birim)
  function newState() { return { y: Y0, C: 0.05, Cl: K.cl0, p: BLOCS.map(b => b.base), sign: BLOCS.map(() => 0), hole: 0, hist: [] }; }
  const demand = (b, y) => b.share * (b.dev ? Math.exp(0.04 * (y - 1986)) : (y < 1986 ? 0.75 + 0.25 * smooth(1974, 1986, y) : 1));
  function step(st, p0 = DEF) {
    const y = st.y, p = { ...DEF, ...p0 };
    const alt = smooth(1985, 1995, y); // CFC'siz soğutucu ve spreyler hazırlanıyor
    // kamuoyu kaygısı: bilim büyütür; 1985'te delik bulununca sıçrar; delik büyüdükçe kaygı artar
    st.C = clamp(st.C + 0.035 * p.sci * (1 - st.C) + (y === 1985 ? 0.45 * (0.5 + p.sci) : 0) + 0.03 * st.hole / 27 - 0.015 * st.C);
    let E = 0;
    BLOCS.forEach((b, i) => {
      const fundK = b.dev ? (y >= 1990 ? p.fund : 0) : 1;
      const tgt = clamp(b.base + 0.7 * st.C + 0.25 * alt - 0.6 * b.ind * (1 - alt) - (y >= 1987 ? 0.25 * p.S * (1 - alt) : 0) - (b.dev ? 0.6 * (1 - fundK) : 0));
      const tgtF = b.dev && fundK < 0.15 ? Math.min(tgt, 0.38) : tgt; // fonsuz gelişmekte olan ülke imzalamaz
      if (p.slide === i) st.p[i] = Math.max(0, st.p[i] - 0.6); // ekonomik kriz ya da hükümet değişikliği: blok geri adım atar
      st.p[i] += (0.08 + 0.3 * p.dip) * (tgtF - st.p[i]);
      if (!st.sign[i] && !p.noTreaty && y >= 1987 && st.p[i] >= 0.45) st.sign[i] = y;
      const grace = b.dev ? 4 : 0, T = 26 - 20 * clamp(p.S); // tam bırakma süresi
      const cut = st.sign[i] && y >= st.sign[i] + 1 ? clamp(0.5 * clamp(p.S < 0.3 ? 1 : 0) + clamp((y - st.sign[i] - grace) / T)) : 0;
      const resid = 0.08 * (1 - smooth(p.hcfc ? 2008 : 2015, (p.hcfc ? 2025 : 2035) + (b.dev ? 10 : 0), y)); // geçiş gazları (HCFC) bir süre kalır
      const comply = st.p[i] < 0.45 ? 0.8 * (0.45 - st.p[i]) / 0.45 : 0; // imzalayıp uymayan
      const keep = st.sign[i] ? Math.min(1, Math.max(1 - cut, p.S < 0.3 ? 0.5 : 0, resid) + comply) : 1;
      E += demand(b, y) * keep;
    });
    E += p.cheat * 0.07; // kaçak üretim (yakalanana kadar) // kaçak üretim: ölçüm ağı güçlüyse çabuk yakalanır
    st.Cl = Math.max(0, st.Cl + K.up * E - st.Cl / K.dec);
    st.hole = 27 * smooth(CL80, 1.28, st.Cl); // milyon km² (Eylül–Ekim ortalaması)
    st.hist.push({ y, E, Cl: st.Cl, hole: st.hole, C: st.C, p: st.p.slice(), sign: st.sign.slice(), signed: st.sign.filter(Boolean).length, uv: 1 + 1.6 * smooth(CL80, 1.45, st.Cl) });
    st.y++;
    return st;
  }
  // geleceğe bak: bugünkü kurallar sürerse delik hangi yıl kapanır? (klor 1980 düzeyine iner)
  function recoveryYear(st, p0) {
    const hs = st.hist; let above = -1;
    for (let i = 0; i < hs.length; i++) if (hs[i].Cl > CL80) above = i;
    if (above < 0) return null; // delik hiç açılmadı
    if (above < hs.length - 1) return hs[above + 1].y;
    const s = JSON.parse(JSON.stringify(st)); s.hist = [];
    for (let k = 0; k < 150; k++) { step(s, p0); if (s.Cl <= CL80) return s.y - 1; }
    return 9999;
  }
  const histP = y => ({ hcfc: y >= 2007 ? 1 : 0, sci: 0.3, dip: 0.3, fund: y >= 1990 ? 0.6 : 0, S: y < 1990 ? 0.1 : y < 1992 ? 0.6 : 0.75, cheat: y >= 2013 && y <= 2018 ? 1 : 0 });
  function run(years, pOf) { const st = newState(); for (let i = 0; i < years; i++) step(st, pOf(st.y)); return st; }
  const api = { K, Y0, Y1, BLOCS, DEF, CL80, newState, step, run, histP, recoveryYear, demand, clamp, smooth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OzonModel = api;
})(typeof window !== 'undefined' ? window : this);
