// Bölüm 1 — Serçelere Savaş (Çin, 1958–1961)
(() => {
  'use strict';

  // ---------- Hikâye ----------
  const STORY = [
    { big: '🇨🇳', date: '1958, Çin',
      text: 'Mao Zedong <b>Büyük İleri Atılım</b>ı başlatıyor. Plana göre ülke birkaç yılda sanayileşecek, tarımda rekorlar kırılacak. Plan iddialı, eleştiriye ise pek açık değil.' },
    { big: '🐀🪰🦟🐦', date: 'Dört Zararlı',
      text: 'Bir de <b>Dört Zararlı Kampanyası</b> var. Hedefte fareler, sinekler, sivrisinekler ve serçeler. Serçelerin suçu tarladaki tahılı yemek. Dönemin hesabına göre her serçe yılda kilolarca tahıl yiyor. Serçeyi öldürürsen tahıl senin olur.' },
    { big: '🥁', date: 'Yöntem',
      text: 'Milyonlarca insan gün boyu tencere, tava ve davul çalıyor. Serçeler konacak yer bulamıyor, yorgunluktan havada düşüp ölüyor. Yuvalar bozuluyor, yumurtalar kırılıyor. Okullarda en çok serçe toplayana ödül var.' },
    { big: '🔬', date: 'Bir itiraz',
      text: 'Bazı kuşbilimciler itiraz ediyor: serçeler tahıl yer ama yavrularını beslerken çok sayıda böcek de yer. Ancak ortam itiraz dinleyecek ortam değil.' },
    { big: '🎖️', date: 'Şimdi sıra sende',
      text: 'Tarım Bakanı sensin ve 3 yılın var (Mart 1958 – Şubat 1961). Kampanyanın şiddetini sen belirliyorsun, gerekirse böcek ilacı da kullanabilirsin. Amaç halkı doyurmak. Kolay görünüyor.' },
  ];

  // ---------- Model ----------
  // S: serçe (1 = sağlıklı nüfus), P: zararlı böcek (~0.8 = normal), F: tarla sağlığı (0–1), tox: ilaç kirliliği
  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const TOTAL = 36;
  const calMonth = m => (2 + m) % 12;
  const calYear = m => 1958 + Math.floor((2 + m) / 12);
  const isWarm = cm => cm >= 3 && cm <= 8;

  function newState() {
    return { m: 0, S: 1, P: 0.5, F: 1, tox: 0, harvests: [], hist: [], pesticides: 3 };
  }

  function applyPesticide(st) {
    st.P *= 0.35;
    st.S *= 0.9;
    st.tox = Math.min(1, st.tox + 0.35);
  }

  function step(st, k) {
    const cm = calMonth(st.m);
    if (cm === 2) st.F = 1; // yeni ekim sezonu

    // Serçeler: yalnızca Nisan–Temmuz arası ürer, kampanya ve ilaç öldürür
    if (cm >= 3 && cm <= 6) st.S += 0.15 * st.S * (1 - st.S);
    st.S -= k * 0.2 * st.S;
    st.S -= st.tox * 0.04 * st.S;

    // Böcekler: sıcak aylarda lojistik büyüme, serçeler onları yer
    if (isWarm(cm)) {
      st.P += 0.5 * st.P * (1 - st.P / 4) - 0.4 * st.S * st.P - st.tox * 0.15 * st.P;
    } else {
      st.P = Math.max(0.08, st.P * 0.8);
    }

    // Tarla: böcekler büyüme boyunca, serçeler olgun başakları yer
    if (isWarm(cm)) st.F -= st.F * 0.055 * st.P;
    if (cm >= 6 && cm <= 8) st.F -= st.F * 0.025 * st.S;
    if (cm === 9) st.harvests.push(st.F);

    st.tox *= 0.92;
    st.S = Math.max(0.002, Math.min(1, st.S));
    st.P = Math.max(0.05, st.P);
    st.F = Math.max(0, st.F);
    st.hist.push({ S: st.S, P: st.P, F: st.F });
    st.m++;
  }

  function runScenario(kOf) {
    const st = newState();
    while (st.m < TOTAL) step(st, kOf(st.m));
    return st;
  }
  const BASELINE = runScenario(() => 0);
  // Tarihe yakın senaryo: 1959 baharına kadar tam seferberlik, sonra azalma, 1960'ta bırakılması
  const HISTORICAL = runScenario(m => (m < 14 ? 1 : m < 26 ? 0.5 : 0));
  const harvestIndex = (st, i) => Math.round((st.harvests[i] / BASELINE.harvests[i]) * 100);

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const screens = ['story', 'game', 'result'];
  function show(name) {
    screens.forEach(s => $('screen-' + s).classList.toggle('active', s === name));
    window.scrollTo({ top: 0 });
    if (name === 'game') resizeScene();
  }

  // Hikâye
  let storyIdx = 0;
  function renderStory() {
    const c = STORY[storyIdx];
    $('story-card').innerHTML = `<div class="big">${c.big}</div><div class="date">${c.date}</div><p>${c.text}</p>`;
    $('story-dots').innerHTML = STORY.map((_, i) => `<span class="${i === storyIdx ? 'on' : ''}"></span>`).join('');
    $('story-prev').disabled = storyIdx === 0;
    $('story-next').textContent = storyIdx === STORY.length - 1 ? 'Göreve başla →' : 'İleri →';
  }
  $('story-prev').onclick = () => { if (storyIdx > 0) { storyIdx--; renderStory(); } };
  $('story-next').onclick = () => {
    if (storyIdx < STORY.length - 1) { storyIdx++; renderStory(); } else show('game');
  };
  $('story-skip').onclick = e => { e.preventDefault(); show('game'); };
  renderStory();

  // ---------- Oyun durumu ----------
  let st = newState();
  let running = false, speed = 1, acc = 0, everCampaigned = false;
  let fired = new Set();
  const kInput = $('k');
  const k = () => Number(kInput.value) / 100;

  kInput.oninput = () => {
    $('k-val').textContent = '%' + kInput.value;
    if (k() > 0) everCampaigned = true;
  };

  $('pesticide').onclick = () => {
    if (st.pesticides <= 0 || st.m >= TOTAL) return;
    st.pesticides--;
    applyPesticide(st);
    say('İlaç uçakları kalktı. Böcekler azaldı, kuşlar da. Kimse nehre bakmıyor.');
    updatePanel();
  };

  $('play').onclick = () => {
    if (st.m >= TOTAL) return;
    running = !running;
    $('play').textContent = running ? '❚❚ Duraklat' : '▶ Devam';
  };
  $('speed').onclick = () => {
    speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    $('speed').textContent = speed + '×';
  };
  $('replay').onclick = () => {
    st = newState(); running = false; acc = 0; everCampaigned = false; fired = new Set();
    kInput.value = 0; kInput.oninput();
    $('play').textContent = '▶ Başlat';
    say('Yeni bir bakan, yeni bir umut. Kampanya şiddetini ayarla ve başlat.');
    birds.length = 0; insects.length = 0;
    updatePanel();
    show('game');
  };

  function say(msg) {
    const date = `${MONTHS[calMonth(Math.min(st.m, TOTAL - 1))]} ${calYear(Math.min(st.m, TOTAL - 1))}`;
    $('ticker').innerHTML = `<span class="muted small">${date} ·</span> ${msg}`;
  }
  function once(key, cond, msg) {
    if (cond && !fired.has(key)) { fired.add(key); say(msg); }
  }

  function checkEvents() {
    const lastH = st.harvests.length ? harvestIndex(st, st.harvests.length - 1) : null;
    const justHarvested = calMonth(st.m - 1) === 9;
    once('start', k() > 0, 'Gazete manşeti: "Halk, tahıl düşmanı serçelere karşı seferber oldu!"');
    once('s50', st.S < 0.5, 'Pekin\'den müjde: serçe nüfusu yarıya indi. Şenlikler düzenleniyor.');
    once('s15', st.S < 0.15, 'Kırsalda tuhaf bir sessizlik var. Sabahları kuş sesi gelmiyor.');
    once('p15', st.P > 1.5, 'Köylülerden haber: "Yapraklarda bir şeyler var. Çok sayıda."');
    once('p28', st.P > 2.8, 'Çekirge sürüleri güneşi karartıyor. Bakanlık "geçici bir durum" açıklaması yaptı.');
    once('tox', st.tox > 0.5, 'Nehir kenarında ölü balıklar görüldü. Herhalde tesadüftür.');
    once('stop', everCampaigned && k() === 0 && st.S < 0.6,
      'Kampanyayı durdurdun. Serçeler geri dönecek ama yavaşça: yılda yalnızca bir iki kez kuluçkaya yatarlar.');
    if (justHarvested && lastH !== null) {
      const y = calYear(st.m - 1);
      if (lastH < 60) once('h60-' + y, true, `${y} hasadı: normalin %${lastH}'i. Ambarlar boş ama raporlarda kotalar doldu.`);
      else if (lastH < 85) once('h85-' + y, true, `${y} hasadı: normalin %${lastH}'i. Rapor yukarıya iletilirken nedense biraz "iyileştiriliyor".`);
      else if (lastH >= 97) once('ok-' + y, true, `${y} hasadı normal. Seni tebrik eden yok, çünkü önlenen felaket haber olmuyor.`);
      else once('mid-' + y, true, `${y} hasadı: normalin %${lastH}'i. Biraz eksik ama idare eder.`);
    }
  }

  function pestLabel(p) { return p < 1 ? 'Normal' : p < 2 ? 'Artıyor' : p < 3 ? 'Yüksek' : 'Felaket'; }
  function updatePanel() {
    const mm = Math.min(st.m, TOTAL - 1);
    $('clock').textContent = `${MONTHS[calMonth(mm)]} ${calYear(mm)}`;
    $('v-s').textContent = '%' + Math.round(st.S * 100);
    $('b-s').style.width = st.S * 100 + '%';
    $('v-p').textContent = pestLabel(st.P);
    $('b-p').style.width = Math.min(100, (st.P / 4) * 100) + '%';
    $('v-f').textContent = '%' + Math.round(st.F * 100);
    $('b-f').style.width = st.F * 100 + '%';
    $('v-t').textContent = '%' + Math.round(st.tox * 100);
    $('b-t').style.width = st.tox * 100 + '%';
    $('pest-left').textContent = st.pesticides;
    $('pesticide').disabled = st.pesticides <= 0;
    for (let i = 0; i < 3; i++) {
      const el = $('h' + i);
      if (st.harvests[i] === undefined) { el.textContent = '–'; el.style.color = ''; continue; }
      const v = harvestIndex(st, i);
      el.textContent = '%' + v;
      el.style.color = v >= 90 ? 'var(--good)' : v >= 70 ? 'var(--warn)' : 'var(--bad)';
    }
  }

  function finish() {
    running = false;
    $('play').textContent = '▶ Başlat';
    setTimeout(() => { renderResult(); show('result'); drawChart(); }, 900);
  }

  // ---------- Sonuç ----------
  function renderResult() {
    const idx = [0, 1, 2].map(i => harvestIndex(st, i));
    const hidx = [0, 1, 2].map(i => harvestIndex(HISTORICAL, i));
    const avg = idx.reduce((a, b) => a + b, 0) / 3;
    let title, text;
    if (avg >= 95) {
      title = 'Tarih kitaplarına girmedin';
      text = 'Serçelere ya hiç dokunmadın ya da çok az dokundun. Hasat normal ve kimse adını bilmiyor. Bazen en iyi politika bir şey yapmamaktır, ama bunun için kimse heykel dikmez.';
    } else if (avg >= 80) {
      title = 'Ekosistemi biraz sarstın';
      text = 'O da seni biraz sarstı. Kaybın tarihtekinden azdı ama birileri yine aç kaldı.';
    } else {
      title = 'Serçelere karşı savaşı kazandın';
      text = 'Çekirgeler de kazandı. Kaybeden sadece insanlar oldu. Tebrikler, tarihî gerçekliği başarıyla yeniden ürettin.';
    }
    if (st.pesticides < 3) text += ' Üstelik geride ilaç kirliliği bıraktın, onu da bir sonraki bakan temizler.';
    $('verdict-title').textContent = title;
    $('verdict-text').textContent = text;

    $('compare').innerHTML = [0, 1, 2].map(i => {
      const bar = (v, c) => `<i style="height:${Math.max(4, v * 1.15)}px;background:${c}"><span>%${v}</span></i>`;
      return `<div class="yr"><div class="vbars">${bar(100, 'var(--muted)')}${bar(idx[i], 'var(--accent)')}${bar(hidx[i], 'var(--bad)')}</div>${1958 + i} hasadı</div>`;
    }).join('');
  }

  function drawChart() {
    const c = $('chart');
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const col = n => css.getPropertyValue(n).trim();
    const pad = { l: 8, r: 8, t: 10, b: 24 };
    const X = i => pad.l + (i / (TOTAL - 1)) * (w - pad.l - pad.r);
    const Y = v => pad.t + (1 - v) * (h - pad.t - pad.b);
    g.clearRect(0, 0, w, h);
    g.strokeStyle = col('--line'); g.lineWidth = 1;
    g.fillStyle = col('--muted'); g.font = '12px Inter, sans-serif'; g.textAlign = 'center';
    [0, 10, 22, 34].forEach((m, i) => {
      if (i === 0) return;
      g.beginPath(); g.moveTo(X(m), pad.t); g.lineTo(X(m), h - pad.b); g.stroke();
    });
    ['1958', '1959', '1960'].forEach((y, i) => g.fillText(y, X(4 + i * 12), h - 6));
    g.beginPath(); g.moveTo(pad.l, Y(0)); g.lineTo(w - pad.r, Y(0)); g.stroke();
    const line = (key, scale, color) => {
      g.strokeStyle = color; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath();
      st.hist.forEach((d, i) => { const y = Y(Math.min(1, d[key] / scale)); i ? g.lineTo(X(i), y) : g.moveTo(X(i), y); });
      g.stroke();
    };
    line('F', 1, col('--field'));
    line('P', 4, col('--pest'));
    line('S', 1, col('--sparrow'));
  }
  window.addEventListener('resize', () => { if ($('screen-result').classList.contains('active')) drawChart(); });

  // ---------- Sahne ----------
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540, HORIZON = 250;
  function resizeScene() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeScene();

  const rnd = (a, b) => a + Math.random() * (b - a);
  const stalks = Array.from({ length: 520 }, () => {
    const y = rnd(HORIZON + 10, H - 4);
    return { x: rnd(0, W), y, p: (y - HORIZON) / (H - HORIZON), sway: rnd(0, 6.28) };
  }).sort((a, b) => a.y - b.y);
  const birds = [], insects = [];

  function mix(a, b, t) {
    const pa = a.match(/\w\w/g).map(h => parseInt(h, 16));
    const pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
  }

  function spawnBird() {
    const left = Math.random() < 0.5;
    birds.push({ x: left ? -10 : W + 10, y: rnd(40, 220), vx: left ? rnd(1, 2.5) : -rnd(1, 2.5), vy: 0, ph: rnd(0, 6.28), fall: false, a: 1 });
  }

  function drawBird(b, t) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalAlpha = b.a;
    if (b.fall) ctx.rotate(1.2);
    const flap = b.fall ? 0.2 : Math.sin(t * 0.02 + b.ph) * 5;
    ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-7, -flap); ctx.quadraticCurveTo(-3, 0, 0, 0); ctx.quadraticCurveTo(3, 0, 7, -flap); ctx.stroke();
    ctx.fillStyle = '#7a5230';
    ctx.beginPath(); ctx.ellipse(0, 1, 3.5, 2.5, 0, 0, 6.28); ctx.fill();
    ctx.restore();
  }

  function render(t) {
    const cm = calMonth(Math.min(st.m, TOTAL - 1));
    const warm = isWarm(cm);
    const winter = cm >= 10 || cm <= 1;

    // gökyüzü
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
    if (winter) { sky.addColorStop(0, '#aeb8bf'); sky.addColorStop(1, '#e3e6e7'); }
    else { sky.addColorStop(0, '#8ccbec'); sky.addColorStop(1, '#eaf5f7'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HORIZON);
    ctx.fillStyle = winter ? 'rgba(255,255,255,.5)' : '#ffd66b';
    ctx.beginPath(); ctx.arc(820, 70, 34, 0, 6.28); ctx.fill();

    // çekirge sürüsü gökyüzünü karartır
    if (st.P > 2 && warm) {
      ctx.fillStyle = `rgba(60,50,20,${Math.min(0.35, (st.P - 2) * 0.18)})`;
      ctx.fillRect(0, 0, W, HORIZON);
    }

    // toprak
    const groundBase = winter ? '#cfc8b6' : mix('8fb55a', 'a68a4b', Math.min(1, (1 - st.F) * 1.3));
    ctx.fillStyle = groundBase; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    for (let i = 0; i < 8; i++) ctx.fillRect(0, HORIZON + 12 + i * i * 4.2, W, 2);

    // başaklar
    const growth = warm ? Math.min(1, (cm - 2) / 6) : 0;
    const ripe = cm >= 7 && cm <= 9;
    const healthy = ripe ? 'd9a92e' : '5f9e3a';
    const stalkCol = mix(healthy, '6e5129', Math.min(1, (1 - st.F) * 0.9));
    ctx.lineCap = 'round';
    for (const s of stalks) {
      const scale = 0.4 + s.p * 1.1;
      if (winter || cm === 2) {
        ctx.strokeStyle = '#9b8c6a'; ctx.lineWidth = 1.2 * scale;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - 4 * scale); ctx.stroke();
        continue;
      }
      const hgt = (8 + 22 * growth) * scale * (0.45 + 0.55 * st.F);
      const sw = Math.sin(t * 0.0015 + s.sway) * 2 * scale;
      ctx.strokeStyle = stalkCol; ctx.lineWidth = 1.6 * scale;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(s.x, s.y - hgt / 2, s.x + sw, s.y - hgt); ctx.stroke();
      if (growth > 0.6) {
        ctx.fillStyle = stalkCol;
        ctx.beginPath(); ctx.ellipse(s.x + sw, s.y - hgt - 2 * scale, 1.6 * scale, 4 * scale * st.F + 1, 0, 0, 6.28); ctx.fill();
      }
    }

    // ilaç sisi
    if (st.tox > 0.03) {
      ctx.fillStyle = `rgba(150,90,220,${st.tox * 0.22})`;
      ctx.fillRect(0, HORIZON - 30, W, H - HORIZON + 30);
    }

    // böcekler
    const iTarget = warm ? Math.round(Math.min(st.P, 4) * 55) : 0;
    while (insects.length < iTarget) insects.push({ x: rnd(0, W), y: rnd(HORIZON + 10, H), air: Math.random() < 0.25, ph: rnd(0, 6.28) });
    if (insects.length > iTarget) insects.splice(0, Math.min(insects.length - iTarget, 6));
    ctx.fillStyle = '#2f3a12';
    for (const b of insects) {
      if (b.air && st.P > 1.5) {
        b.x += 1.5 + Math.sin(t * 0.003 + b.ph); if (b.x > W) b.x = 0;
        const y = HORIZON - 40 + Math.sin(t * 0.004 + b.ph) * 30 + b.ph * 6;
        ctx.fillRect(b.x, y, 3, 2);
      } else {
        const hop = Math.max(0, Math.sin(t * 0.008 + b.ph * 3)) * 3;
        ctx.fillRect(b.x + Math.sin(b.ph + t * 0.001) * 2, b.y - hop, 2.5, 2.5);
      }
    }

    // tencere çalan insanlar
    const people = Math.round(k() * 7);
    for (let i = 0; i < people; i++) {
      const x = 80 + i * ((W - 160) / Math.max(1, 6));
      const y = HORIZON + 46;
      ctx.strokeStyle = '#3b2f25'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y - 30, 5, 0, 6.28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 25); ctx.lineTo(x, y - 8); ctx.lineTo(x - 5, y); ctx.moveTo(x, y - 8); ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 20); ctx.lineTo(x + 9, y - 28 + Math.sin(t * 0.03 + i) * 3); ctx.stroke();
      ctx.fillStyle = '#7b7f84'; ctx.beginPath(); ctx.arc(x + 12, y - 30, 4.5, 0, 6.28); ctx.fill();
      const r = (t * 0.06 + i * 13) % 40;
      ctx.strokeStyle = `rgba(194,65,12,${1 - r / 40})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + 12, y - 30, 6 + r, -2.2, -0.9); ctx.stroke();
    }

    // serçeler
    const bTarget = Math.round(st.S * 36);
    const alive = birds.filter(b => !b.fall);
    if (alive.length < bTarget && Math.random() < 0.15) spawnBird();
    if (alive.length > bTarget) {
      const v = alive[Math.floor(Math.random() * alive.length)];
      if (k() > 0 || st.tox > 0.1) { v.fall = true; v.vy = 0; } else { v.leave = true; }
    }
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      if (b.fall) {
        b.vy += 0.15; b.y += b.vy; b.x += b.vx * 0.2;
        if (b.y > HORIZON + 20) { b.y = HORIZON + 20; b.vy = 0; b.a -= 0.01; }
        if (b.a <= 0) { birds.splice(i, 1); continue; }
      } else {
        b.vy += (Math.random() - 0.5) * 0.15; b.vy *= 0.96;
        if (b.y < 30) b.vy += 0.1; if (b.y > 230) b.vy -= 0.12;
        b.x += b.vx; b.y += b.vy;
        if (b.x < -20 || b.x > W + 20) {
          if (b.leave) { birds.splice(i, 1); continue; }
          b.vx = -b.vx;
        }
      }
      drawBird(b, t);
    }
  }

  // ---------- Döngü ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(100, now - last); last = now;
    if (running && st.m < TOTAL) {
      acc += dt;
      const monthMs = 1800 / speed;
      while (acc >= monthMs && st.m < TOTAL) {
        acc -= monthMs;
        step(st, k());
        checkEvents();
        updatePanel();
        if (st.m >= TOTAL) finish();
      }
    }
    if ($('screen-game').classList.contains('active')) render(now);
    requestAnimationFrame(frame);
  }
  updatePanel();
  requestAnimationFrame(frame);
})();
