// Kiln & Co. concept shop — product data, SVG product art, filter, quick view and basket.
const FREE_SHIP = 50;

const products = [
  { id: 1, type: 'mug',   name: 'Rust Speckle Mug',    price: 24, glaze: '#b4532a', rim: '#f1e4d3', bg: '#efe3d4', tag: 'Bestseller', desc: 'Our most-loved mug. A deep rust glaze with iron speckles and a generous thumb-rest handle.', spec: ['350ml', 'Stoneware', 'Dishwasher safe'] },
  { id: 2, type: 'bowl',  name: 'Oat Breakfast Bowl',  price: 28, glaze: '#d9c3a1', rim: '#8a6a4a', bg: '#f1ebe1', tag: '', desc: 'A wide, shallow bowl for porridge, noodles or salads, finished in a soft oat glaze.', spec: ['16cm across', 'Stoneware', 'Microwave safe'] },
  { id: 3, type: 'vase',  name: 'Moss Bud Vase',       price: 32, glaze: '#6f7d4f', rim: '#4d5836', bg: '#e6e8dc', tag: 'New', desc: 'A small bottle vase for single stems and dried grasses, in a satin moss green.', spec: ['14cm tall', 'Watertight glaze', 'Hand wash'] },
  { id: 4, type: 'plate', name: 'Ink Side Plate',      price: 22, glaze: '#2f3a4a', rim: '#c9b79c', bg: '#e4e2de', tag: '', desc: 'Deep indigo side plate with a raw clay rim. Looks great stacked.', spec: ['21cm across', 'Stoneware', 'Dishwasher safe'] },
  { id: 5, type: 'mug',   name: 'Chalk Tumbler Mug',   price: 20, glaze: '#ece5da', rim: '#b9a58c', bg: '#e9e1d6', tag: '', desc: 'Handle-free tumbler with a chalky white glaze and a natural clay foot.', spec: ['250ml', 'Stoneware', 'Dishwasher safe'] },
  { id: 6, type: 'vase',  name: 'Terracotta Tall Vase', price: 58, glaze: '#c9774c', rim: '#8a4b2c', bg: '#f0dfd0', tag: 'Limited', desc: 'A statement vase with hand-carved rings. Only a handful made each firing.', spec: ['28cm tall', 'Watertight glaze', 'Hand wash'] },
  { id: 7, type: 'bowl',  name: 'Honey Nesting Bowls', price: 42, glaze: '#d49a3a', rim: '#8a5f22', bg: '#f3e6cd', tag: 'Set of 3', desc: 'Three nesting bowls in a warm honey glaze — for dips, snacks and prep.', spec: ['10 / 13 / 16cm', 'Stoneware', 'Dishwasher safe'] },
  { id: 8, type: 'mug',   name: 'Sage Latte Cup',      price: 26, glaze: '#9aa785', rim: '#f0ebe0', bg: '#e8ebdf', tag: 'New', desc: 'A wide latte cup that holds heat well, glazed in pale sage with a cream rim.', spec: ['300ml', 'Stoneware', 'Dishwasher safe'] },
];

const art = (p, big) => {
  const g = p.glaze, r = p.rim, s = 'rgba(0,0,0,.12)';
  const shapes = {
    mug: `<ellipse cx="100" cy="168" rx="52" ry="9" fill="${s}"/>
      <path d="M142 92c26 0 26 44 0 44" stroke="${g}" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M52 70h96l-6 90c-1 8-6 10-12 10H70c-6 0-11-2-12-10z" fill="${g}"/>
      <path d="M52 70h96l-1 14H53z" fill="${r}"/><ellipse cx="100" cy="70" rx="48" ry="8" fill="${r}"/>
      <ellipse cx="100" cy="70" rx="42" ry="5.5" fill="rgba(0,0,0,.25)"/>
      <path d="M66 92l3 64" stroke="rgba(255,255,255,.25)" stroke-width="6" stroke-linecap="round"/>
      ${p.id === 1 ? '<g fill="rgba(40,20,10,.35)"><circle cx="90" cy="110" r="1.6"/><circle cx="118" cy="130" r="1.4"/><circle cx="104" cy="145" r="1.8"/><circle cx="80" cy="138" r="1.2"/><circle cx="128" cy="104" r="1.5"/><circle cx="96" cy="124" r="1.1"/></g>' : ''}`,
    bowl: `<ellipse cx="100" cy="160" rx="58" ry="9" fill="${s}"/>
      <path d="M30 96h140c0 36-28 64-70 64S30 132 30 96z" fill="${g}"/>
      <ellipse cx="100" cy="96" rx="70" ry="16" fill="${r}"/><ellipse cx="100" cy="97" rx="63" ry="12" fill="${g}" opacity=".85"/>
      <path d="M80 158h40v6H80z" fill="${r}"/>
      <path d="M44 110c6 20 22 34 42 40" stroke="rgba(255,255,255,.28)" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${p.id === 7 ? `<ellipse cx="100" cy="97" rx="44" ry="8" fill="${r}" opacity=".5"/><ellipse cx="100" cy="98" rx="28" ry="5" fill="${r}" opacity=".5"/>` : ''}`,
    vase: p.id === 6
      ? `<ellipse cx="100" cy="178" rx="40" ry="7" fill="${s}"/>
        <path d="M86 22h28v14c0 10 26 30 26 70 0 40-14 64-18 72H78c-4-8-18-32-18-72 0-40 26-60 26-70z" fill="${g}"/>
        <ellipse cx="100" cy="22" rx="14" ry="4" fill="${r}"/>
        <g stroke="${r}" stroke-width="3" fill="none" opacity=".7"><path d="M64 96c24 8 48 8 72 0"/><path d="M62 112c26 8 50 8 76 0"/><path d="M64 128c24 8 48 8 72 0"/></g>
        <path d="M74 80c-6 20-6 50 2 80" stroke="rgba(255,255,255,.25)" stroke-width="6" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="100" cy="170" rx="42" ry="7" fill="${s}"/>
        <path d="M90 50h20v24c24 8 36 30 36 54 0 26-18 40-46 40s-46-14-46-40c0-24 12-46 36-54z" fill="${g}"/>
        <ellipse cx="100" cy="50" rx="10" ry="3" fill="${r}"/>
        <path d="M100 50C98 30 88 18 76 12M100 48c4-18 16-30 30-34" stroke="#8b7a5a" stroke-width="2" fill="none"/>
        <circle cx="76" cy="12" r="4" fill="#d6b56d"/><circle cx="130" cy="14" r="3.5" fill="#c9a45a"/>
        <path d="M68 118c0 20 8 34 18 40" stroke="rgba(255,255,255,.25)" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    plate: `<ellipse cx="100" cy="146" rx="80" ry="14" fill="${s}"/>
      <ellipse cx="100" cy="116" rx="84" ry="34" fill="${r}"/>
      <ellipse cx="100" cy="112" rx="76" ry="29" fill="${g}"/>
      <ellipse cx="100" cy="114" rx="50" ry="17" fill="rgba(0,0,0,.12)"/>
      <path d="M44 104c10-10 30-16 50-17" stroke="rgba(255,255,255,.25)" stroke-width="5" fill="none" stroke-linecap="round"/>`
  };
  return `<svg viewBox="0 0 200 200" ${big ? '' : 'loading="lazy"'} role="img" aria-label="${p.name}">${shapes[p.type]}</svg>`;
};

const gbp = n => '£' + n.toFixed(2);
const $ = s => document.querySelector(s);

// Hero art: three pieces arranged together
$('#heroArt').innerHTML = [products[5], products[0], products[6]].map(p => `<div>${art(p, true)}</div>`).join('');

// Grid + filter
const grid = $('#grid');
const render = f => {
  grid.innerHTML = products.filter(p => f === 'all' || p.type === f).map(p => `
    <article class="product" data-id="${p.id}">
      <button class="product__img" style="background:${p.bg}" data-view="${p.id}" aria-label="Quick view ${p.name}">
        ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}${art(p)}
        <span class="qv">Quick view</span>
      </button>
      <div class="product__meta">
        <div><h3>${p.name}</h3><p>${gbp(p.price)}</p></div>
        <button class="add" data-add="${p.id}" aria-label="Add ${p.name} to basket">+</button>
      </div>
    </article>`).join('');
};
render('all');
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === c));
  render(c.dataset.f);
}));

// Basket (persisted in localStorage)
let cart = JSON.parse(localStorage.getItem('kiln-cart') || '{}');
const save = () => localStorage.setItem('kiln-cart', JSON.stringify(cart));
const add = (id, q = 1) => { cart[id] = (cart[id] || 0) + q; save(); drawCart(); toast(`Added ${products.find(p => p.id == id).name}`); };
const drawCart = () => {
  const ids = Object.keys(cart).filter(k => cart[k] > 0);
  const count = ids.reduce((a, k) => a + cart[k], 0);
  const sub = ids.reduce((a, k) => a + cart[k] * products.find(p => p.id == k).price, 0);
  $('#cartCount').textContent = count;
  $('#cartCount').classList.toggle('show', count > 0);
  $('#subtotal').textContent = gbp(sub);
  const left = FREE_SHIP - sub;
  $('#shipText').innerHTML = left > 0 ? `You're <b>${gbp(left)}</b> away from free delivery` : `<b>Free UK delivery</b> unlocked`;
  $('#shipBar').style.width = Math.min(100, sub / FREE_SHIP * 100) + '%';
  $('#lines').innerHTML = ids.length ? ids.map(k => {
    const p = products.find(x => x.id == k);
    return `<li><div class="line__img" style="background:${p.bg}">${art(p)}</div>
      <div class="line__info"><b>${p.name}</b><span>${gbp(p.price)}</span>
        <div class="qty qty--sm"><button data-dec="${k}" aria-label="Less">−</button><span>${cart[k]}</span><button data-inc="${k}" aria-label="More">+</button></div></div>
      <b class="line__total">${gbp(p.price * cart[k])}</b></li>`;
  }).join('') : '<li class="empty">Your basket is empty.<br>Start with a mug — everyone does.</li>';
};
drawCart();

const drawer = $('#drawer');
const openCart = () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); };
const closeCart = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); };
$('#cartOpen').addEventListener('click', openCart);

// Quick view
const modal = $('#modal');
let current = null, qty = 1;
const openModal = id => {
  current = products.find(p => p.id == id); qty = 1;
  $('#mArt').innerHTML = art(current, true); $('#mArt').style.background = current.bg;
  $('#mCat').textContent = current.type.charAt(0).toUpperCase() + current.type.slice(1) + (current.tag ? ' · ' + current.tag : '');
  $('#mTitle').textContent = current.name;
  $('#mPrice').textContent = gbp(current.price);
  $('#mDesc').textContent = current.desc;
  $('#mSpec').innerHTML = current.spec.map(s => `<li>${s}</li>`).join('');
  $('#qVal').textContent = qty;
  modal.hidden = false;
};
$('#qMinus').onclick = () => { qty = Math.max(1, qty - 1); $('#qVal').textContent = qty; };
$('#qPlus').onclick = () => { qty++; $('#qVal').textContent = qty; };
$('#mAdd').onclick = () => { add(current.id, qty); modal.hidden = true; openCart(); };

document.addEventListener('click', e => {
  const t = e.target.closest('[data-view],[data-add],[data-inc],[data-dec],[data-close],[data-close-cart]');
  if (!t) return;
  if (t.dataset.view) openModal(t.dataset.view);
  else if (t.dataset.add) add(t.dataset.add);
  else if (t.dataset.inc) { cart[t.dataset.inc]++; save(); drawCart(); }
  else if (t.dataset.dec) { cart[t.dataset.dec]--; if (cart[t.dataset.dec] <= 0) delete cart[t.dataset.dec]; save(); drawCart(); }
  else if ('close' in t.dataset) modal.hidden = true;
  else if ('closeCart' in t.dataset) closeCart();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { modal.hidden = true; closeCart(); } });

$('#checkout').onclick = () => toast('Demo shop — in a live build this goes to Shopify / Stripe checkout.');
$('#signup').addEventListener('submit', e => { e.preventDefault(); e.target.reset(); toast('Thanks! (Demo form — nothing is sent.)'); });

let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }

