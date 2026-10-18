// Görev kartı: oyun başlamadan önce oyuncuya kim olduğunu, neyi kontrol ettiğini ve hedefini gösterir.
// Kullanım: Mission.show(modalEl, { title, role, control, goal, watch, hist }, onStart)
// hist: tarih filminden sonra 'tarihte ne oldu' satırı (görev kartı filmden hemen sonra, oyuncu başlarken açılır)
(() => {
  'use strict';
  window.Mission = {
    show(modal, d, onStart) {
      modal.innerHTML = `<div class="card mission"><div class="from">🎯 Görevin</div><h2>${d.title}</h2>
        <ul class="mlist">
          ${d.hist ? `<li class="mhist"><span class="mi">📼</span><div><b>Tarihte</b>${String(d.hist).replace(/<b>/g, '<b class="inl">')}</div></li>` : ''}
          <li><span class="mi">👤</span><div><b>Sen</b>${d.role}</div></li>
          <li><span class="mi">🕹️</span><div><b>Kontrolün</b>${d.control}</div></li>
          <li><span class="mi">🏆</span><div><b>Hedefin</b>${d.goal}</div></li>
          ${d.watch ? `<li><span class="mi">👀</span><div><b>Dikkat</b>${d.watch}</div></li>` : ''}
        </ul>
        <button class="hbtn go-m">Anladım, başla →</button></div>`;
      modal.hidden = false;
      const btn = modal.querySelector('.go-m');
      let done = false; // çift tıklama hikâyeyi iki kez başlatmasın
      btn.onclick = () => { if (done) return; done = true; modal.hidden = true; onStart(); };
      setTimeout(() => btn.focus(), 50);
    },
  };
})();
