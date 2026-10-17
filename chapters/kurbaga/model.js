// Kamış kurbağası yayılma modeli: Avustralya'yı 0,5°'lik hücrelere bölen basit bir hücresel otomat.
// Sayılar temsilidir; zamanlama tarihî yayılma çizgisine (Kuzey Bölgesi ~1984, Darwin ~2005, Batı Avustralya ~2009) göre ayarlanmıştır.
(function (root) {
  'use strict';
  const LON0 = 112.5, LAT0 = -9.5, CELL = 0.5, NX = 84, NY = 69;
  // basitleştirilmiş kıyı çizgisi (boylam, enlem)
  const COAST = [
    [142.5,-10.7],[143.5,-14],[145.3,-15],[145.8,-17],[146.3,-18.9],[146.8,-19.3],[148.7,-20.3],[149.2,-21.1],[150.5,-22.5],
    [151.2,-23.8],[152.9,-25.3],[153.1,-26.5],[153.6,-28.2],[153.4,-29.4],[153.1,-31],[152.5,-32.4],[151.3,-33.8],[150.8,-35],
    [150.1,-36.5],[149.9,-37.5],[148,-37.8],[146.3,-39.1],[144.9,-37.9],[144.5,-38.3],[143.5,-38.8],[141.5,-38.4],[140,-37.5],
    [139.6,-36.8],[139.1,-35.6],[138.5,-35.6],[138.1,-34.4],[137.8,-32.8],[137.4,-34.2],[135.9,-34.8],[135.2,-33.6],[134.2,-32.6],
    [133.2,-32.1],[131.2,-31.5],[129,-31.7],[126,-32.3],[124,-33],[123.5,-33.9],[121.9,-33.9],[119.8,-34],[117.9,-35.1],
    [115.6,-34.3],[115.7,-33.3],[115.8,-32],[115,-30],[114.6,-28.7],[113.6,-26.5],[113.5,-24.5],[113.7,-22.6],[114.6,-21.8],
    [116.7,-20.6],[118.6,-20.3],[121,-19.6],[122.2,-18],[123.5,-17],[124.5,-15.5],[125.8,-14.4],[127,-13.8],[128.2,-14.9],
    [129.4,-14.9],[130.1,-13.3],[130.8,-12.4],[131.8,-11.3],[132.6,-11.5],[133.9,-11.8],[135,-12.2],[136.6,-12],[136.9,-12.9],
    [135.9,-13.6],[135.5,-14.8],[136.8,-15.9],[138.3,-16.8],[139.5,-17.5],[140.8,-17.5],[141.5,-15.5],[141.6,-13.5],[142,-12],
  ];
  const TAS = [[144.6,-40.7],[148.3,-40.9],[148.3,-42.2],[147,-43.6],[145.2,-42.2]];
  // 1935–37'de kurbağaların salındığı Queensland şeker bölgeleri
  const RELEASES = [[145.78,-17.1],[146.03,-17.52],[146.16,-18.65],[147.4,-19.57],[149.18,-21.14],[152.35,-24.87]];
  const PLACES = {
    gordonvale: [145.78, -17.1], brisbane: [153.0, -27.5], darwin: [130.85, -12.45], broome: [122.24, -17.96],
    sydney: [151.2, -33.87], perth: [115.86, -31.95], kakadu: [132.4, -12.8], alice: [133.88, -23.7],
  };

  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function pip(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---- ızgara ----
  const N = NX * NY;
  const G = { inside: new Uint8Array(N), lon: new Float32Array(N), lat: new Float32Array(N), dist: new Float32Array(N), moist: new Float32Array(N), dam: new Uint8Array(N), area: new Float32Array(N), cells: [] };
  const idx = (i, j) => j * NX + i;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const c = idx(i, j), lon = LON0 + (i + 0.5) * CELL, lat = LAT0 - (j + 0.5) * CELL;
    G.lon[c] = lon; G.lat[c] = lat;
    G.inside[c] = pip(lon, lat, COAST) || pip(lon, lat, TAS) ? 1 : 0;
    G.area[c] = 55.6 * 55.6 * Math.cos(lat * Math.PI / 180) * 0.25 * 4; // ~km² (0,5° × 0,5°)
    if (G.inside[c]) G.cells.push(c);
  }
  // kıyıya uzaklık (hücre)
  G.dist.fill(1e9);
  const q = [];
  for (const c of G.cells) {
    const i = c % NX, j = (c / NX) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= NX || jj >= NY || !G.inside[idx(ii, jj)]) { G.dist[c] = 0; }
    }
    if (G.dist[c] === 0) q.push(c);
  }
  for (let k = 0; k < q.length; k++) {
    const c = q[k], i = c % NX, j = (c / NX) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) continue;
      const n = idx(ii, jj);
      if (G.inside[n] && G.dist[n] > G.dist[c] + 1) { G.dist[n] = G.dist[c] + 1; q.push(n); }
    }
  }
  const R0 = rng(7);
  for (const c of G.cells) {
    const lat = G.lat[c], lon = G.lon[c], d = G.dist[c];
    const north = smooth(-22, -15, lat);
    const east = lon > 145.5 ? smooth(7, 2, d) : 0;
    let m = Math.max(north, east);
    if (lon < 125 && lat < -19.5) m *= 0.25;      // Pilbara ve batı çölleri
    if (lat < -20 && lon > 125 && lon < 145.5 && d > 4) m *= 0.5; // iç kurak bölge
    G.moist[c] = m;
    if (m < 0.35 && lat > -28 && R0() < 0.3) G.dam[c] = 1; // çiftlik göletleri ve su noktaları
  }

  const neighbors = c => {
    const i = c % NX, j = (c / NX) | 0, out = [];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) continue; const n = idx(ii, jj); if (G.inside[n]) out.push(n);
    }
    return out;
  };
  const NB = new Array(N); for (const c of G.cells) NB[c] = neighbors(c);

  // ---- durum ----
  const DEF = { evo: 1, collect: 0, fence: 0, teach: 0, warm: 0, speedCal: 1.1 };
  function suitOf(st, c) {
    const shift = st.p.warm * 1.3;
    const temp = smooth(-35 - shift, -29.5 - shift, G.lat[c]) * (G.lat[c] < -40 ? 0 : 1);
    let s = temp * Math.min(1, 0.12 + 0.95 * G.moist[c]);
    if (G.dam[c] && temp > 0.5 && !st.fenced[c]) s = Math.max(s, 0.3);
    return s;
  }
  function newState(p = {}, seed = 1) {
    const st = {
      year: 1935, p: { ...DEF, ...p }, rnd: rng(seed), acc: 0, released: false,
      d: new Float32Array(N), invaded: new Int16Array(N).fill(-1), pred: new Float32Array(N).fill(1),
      fenced: new Uint8Array(N), hist: [], firsts: {},
    };
    st.fenceRoll = new Float32Array(N); for (const c of G.cells) st.fenceRoll[c] = st.rnd();
    return st;
  }
  function release(st) {
    st.released = true;
    for (const [lon, lat] of RELEASES) {
      const i = Math.floor((lon - LON0) / CELL), j = Math.floor((LAT0 - lat) / CELL), c = idx(i, j);
      if (G.inside[c]) { st.d[c] = 0.15; st.invaded[c] = st.year; }
    }
  }
  // dokunarak/toplayarak bir bölgeden kurbağa uzaklaştır
  function removeAt(st, lon, lat, radius, frac) {
    for (const c of G.cells) {
      if (st.d[c] <= 0) continue;
      const dx = (G.lon[c] - lon) * 0.86, dy = G.lat[c] - lat, r = Math.hypot(dx, dy);
      if (r < radius) st.d[c] *= 1 - frac * (1 - r / radius);
      if (st.d[c] < 0.02) st.d[c] = 0;
    }
  }
  const SPEED = 0.85; // kalibrasyon katsayısı
  function step(st) {
    const y = st.year, p = st.p;
    for (const c of G.cells) st.fenced[c] = G.dam[c] && st.fenceRoll[c] < p.fence ? 1 : 0;
    if (st.released) {
      // ön cephedeki kurbağalar evrimleşir: bacaklar uzar, hız artar
      const km = 8 + 52 * p.evo * smooth(1960, 2005, y);
      st.acc += (km / 55) * SPEED * p.speedCal;
      let it = Math.floor(st.acc); st.acc -= it;
      while (it-- > 0) {
        const add = [];
        for (const c of G.cells) {
          if (st.d[c] > 0) continue;
          const s = suitOf(st, c); if (s < 0.22) continue;
          let src = false; for (const n of NB[c]) if (st.d[n] > 0.04) { src = true; break; }
          if (!src) continue;
          let prob = s * 0.9 * (1 - 0.55 * p.collect);
          if (G.moist[c] < 0.35) prob *= 0.35; // çöl koridorları yavaş
          if (st.rnd() < prob) add.push(c);
        }
        for (const c of add) { st.d[c] = 0.05; if (st.invaded[c] < 0) st.invaded[c] = y; }
      }
      for (const c of G.cells) {
        if (st.d[c] <= 0) continue;
        const s = Math.max(0.05, suitOf(st, c));
        st.d[c] += 0.7 * st.d[c] * (1 - st.d[c] / s);
        if (p.collect > 0 && y - st.invaded[c] < 8) st.d[c] *= 1 - 0.3 * p.collect; // gönüllüler ön cephede toplar
        if (st.d[c] < 0.02) st.d[c] = 0;
      }
    }
    // yerli avcılar: kurbağayı yiyen kuzey kedisi, goanna, timsah, yılan
    for (const c of G.cells) {
      const base = suitOf(st, c) >= 0.22;
      if (!base) continue;
      if (st.d[c] > 0.12) {
        const floor = 0.12 + 0.45 * p.teach + 0.3 * smooth(0, 45, y - st.invaded[c]);
        st.pred[c] += (Math.min(1, floor) - st.pred[c]) * 0.35;
      } else st.pred[c] += (1 - st.pred[c]) * 0.04;
    }
    st.year++;
    const s = stats(st); st.hist.push(s);
    if (!st.firsts.nt && s.west <= 138) st.firsts.nt = y;
    if (!st.firsts.darwin && s.west <= 131) st.firsts.darwin = y;
    if (!st.firsts.wa && s.west <= 129) st.firsts.wa = y;
    if (!st.firsts.nsw && s.south <= -28.4) st.firsts.nsw = y;
    return s;
  }
  let K = 1;
  function stats(st) {
    let area = 0, toads = 0, predSum = 0, predN = 0, west = 999, south = 0;
    for (const c of G.cells) {
      if (st.d[c] > 0) {
        area += G.area[c]; toads += st.d[c] * G.area[c];
        if (G.lat[c] > -20 && G.lon[c] < west) west = G.lon[c];
        if (G.lon[c] > 150 && G.lat[c] < south) south = G.lat[c];
      }
      if (G.moist[c] > 0.3 && G.lat[c] > -29) { predSum += st.pred[c]; predN++; }
    }
    return { year: st.year, area, areaPct: area / 7.69e6 * 100, toads: toads * K, pred: predN ? predSum / predN : 1, west, south };
  }
  function run(p, until = 2025, seed = 1) {
    const st = newState(p, seed); release(st);
    while (st.year < until) step(st);
    return st;
  }
  // kurbağa sayısını ölçekle: tarihî senaryoda 2010'larda ~200 milyon
  { const h = run({}, 2015); let raw = 0; for (const c of G.cells) raw += h.d[c] * G.area[c]; K = 2e8 / raw; }

  root.ToadModel = { G, NX, NY, LON0, LAT0, CELL, COAST, TAS, PLACES, RELEASES, DEF, newState, release, step, stats, run, suitOf, removeAt, smooth };
  if (typeof module !== 'undefined') module.exports = root.ToadModel;
})(typeof window !== 'undefined' ? window : globalThis);
