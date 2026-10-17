// Bölüm sayfalarının üst bilgisi ana sayfa verisiyle (chapters.js) tutarlı mı?
// Kullanım: node tools/check-meta.js  → sorun yoksa "Üst bilgi: sorun yok"
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
global.window = {}; global.document = { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({}) };
try { require(path.join(root, 'assets/js/chapters.js')); } catch (e) { /* ana sayfa çizimi burada çalışmaz, veri yeter */ }
const out = [];
window.SEASONS.forEach((s, i) => s.chapters.forEach((c, j) => {
  if (c.status !== 'live') return;
  const id = c.href.split('/')[1], file = path.join(root, 'chapters', id, 'index.html');
  if (!fs.existsSync(file)) return out.push(`${id}: index.html yok`);
  const html = fs.readFileSync(file, 'utf8');
  const want = `Sezon ${i + 1} · Bölüm ${j + 1}`;
  const kicker = (html.match(/<div class="kicker">([^<]*)<\/div>/) || [])[1] || '';
  if (!kicker.includes(want)) out.push(`${id}: kicker "${kicker}" olmalı "… ${want}"`);
  const title = (html.match(/<h1 class="title">([^<]*)<\/h1>/) || [])[1];
  if (title && title !== c.title) out.push(`${id}: başlık "${title}" ≠ kart "${c.title}"`);
  if (!/mission\.js/.test(html)) out.push(`${id}: mission.js yüklenmiyor`);
  if (!/scene-utils\.js/.test(html)) out.push(`${id}: scene-utils.js yüklenmiyor`);
  const js = path.join(root, 'chapters', id, id + '.js');
  if (fs.existsSync(js) && !new RegExp(`bny-bitti-${id}`).test(fs.readFileSync(js, 'utf8'))) out.push(`${id}: DONE_KEY bny-bitti-${id} değil`);
}));
const badges = fs.readFileSync(path.join(root, 'assets/js/badges.js'), 'utf8');
window.SEASONS.flatMap(s => s.chapters).filter(c => c.status === 'live').forEach(c => {
  const id = c.href.split('/')[1], n = (badges.match(new RegExp(`ch: '${id}'`, 'g')) || []).length;
  if (n !== 8) out.push(`${id}: ${n} rozet (8 olmalı)`);
});
console.log(out.length ? out.join('\n') : 'Üst bilgi: sorun yok');
process.exitCode = out.length ? 1 : 0;
