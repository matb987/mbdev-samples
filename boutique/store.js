// Fold & Fern concept shop: menu, bag drawer (localStorage), quick add, newsletter.
(() => {
  const FREE = 60, KEY = 'ff-bag';
  const $ = id => document.getElementById(id);
  const byId = id => CATALOG.find(p => p.id === id);
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { bag = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {} };
  const drawer = $('drawer'), bagBtn = $('bagBtn');
  let lastFocus;

  function render() {
    const n = bag.reduce((a, l) => a + l.q, 0), sub = bag.reduce((a, l) => a + l.q * byId(l.id).price, 0);
    $('bagCount').textContent = n;
    $('subtotal').textContent = '£' + sub.toFixed(2).replace('.00', '');
    $('shipTxt').innerHTML = sub >= FREE ? '<b>You\'ve got free delivery.</b>' : `Spend <b>£${(FREE - sub).toFixed(2).replace('.00', '')}</b> more for free delivery`;
    $('shipBar').style.width = Math.min(100, sub / FREE * 100) + '%';
    $('lines').innerHTML = bag.length ? bag.map((l, i) => {
      const p = byId(l.id), c = p.colours[l.c];
      return `<li><img src="${c.img}" width="600" height="750" alt=""><div><b>${p.name}</b><span>${c.n}</span><div class="lq"><button type="button" data-d="${i}" aria-label="Decrease">−</button><span>${l.q}</span><button type="button" data-i="${i}" aria-label="Increase">+</button></div></div><div class="lp">£${p.price * l.q}<button type="button" class="rm" data-r="${i}">Remove</button></div></li>`;
    }).join('') : '<li class="emptybag">Your bag is empty.</li>';
    $('checkout').disabled = !bag.length;
  }
  function open() { lastFocus = document.activeElement; drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('on')); $('bagClose').focus(); }
  function close() { drawer.classList.remove('on'); setTimeout(() => drawer.hidden = true, 250); lastFocus && lastFocus.focus(); }

  window.Store = {
    add(id, c = 0, q = 1) {
      const l = bag.find(x => x.id === id && x.c === c);
      l ? l.q = Math.min(9, l.q + q) : bag.push({ id, c, q });
      save(); render(); open();
    }
  };
  bagBtn.onclick = open;
  $('bagClose').onclick = close;
  drawer.addEventListener('click', e => { if (e.target === drawer) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) close(); });
  $('lines').addEventListener('click', e => {
    const t = e.target.dataset;
    if (t.i) bag[t.i].q = Math.min(9, bag[t.i].q + 1);
    if (t.d) { bag[t.d].q--; if (!bag[t.d].q) bag.splice(t.d, 1); }
    if (t.r) bag.splice(t.r, 1);
    save(); render();
  });
  $('checkout').onclick = () => { $('coMsg').textContent = 'This is a concept shop, so checkout is switched off. On a live Shopify store this goes to secure checkout.'; };
  document.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (b) Store.add(b.dataset.add); });

  const mb = $('menuBtn'), nav = $('nav');
  mb.onclick = () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); };
  $('news').addEventListener('submit', e => { e.preventDefault(); const f = e.target; f.querySelector('.fine').textContent = f.checkValidity() ? 'Thanks! Concept shop only, so no email was saved.' : 'Please enter a valid email.'; });
  render();
})();
