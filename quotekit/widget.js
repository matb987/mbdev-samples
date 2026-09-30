/*! QuoteKit widget (beta concept by MBDEV).
 * Embed:  <script src=".../quotekit/widget.js" data-quotekit="sparrow" async></script>
 * Demo build: price rules come from configs/<id>.json (or edits saved in the QuoteKit dashboard in this browser).
 * Requests are stored in this browser's localStorage only. Nothing is sent anywhere.
 */
(function () {
  'use strict';
  var w = window, d = document;
  if (w.QuoteKit && w.QuoteKit.version) { w.QuoteKit.scan(); return; }

  var me = d.currentScript || d.querySelector('script[src*="quotekit/widget.js"]');
  var BASE = me ? me.src.replace(/[^\/?#]*([?#].*)?$/, '') : './';
  var mem = {};

  // ---------- storage (localStorage, with an in-memory fallback) ----------
  function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return mem[k] || null; } }
  function set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var store = {
    config: function (id) { return get('quotekit:config:' + id); },
    saveConfig: function (id, c) { set('quotekit:config:' + id, c); },
    clearConfig: function (id) { delete mem['quotekit:config:' + id]; try { localStorage.removeItem('quotekit:config:' + id); } catch (e) {} },
    leads: function (id) { return get('quotekit:leads:' + id) || []; },
    saveLeads: function (id, l) { set('quotekit:leads:' + id, l); },
    addLead: function (id, lead) {
      var l = store.leads(id); l.unshift(lead); store.saveLeads(id, l);
      w.dispatchEvent(new CustomEvent('quotekit:lead', { detail: { id: id, lead: lead } }));
    }
  };

  function loadConfig(id) {
    var saved = store.config(id);
    if (saved) return Promise.resolve(saved);
    return fetch(BASE + 'configs/' + encodeURIComponent(id) + '.json').then(function (r) {
      if (!r.ok) throw new Error('QuoteKit: no config for "' + id + '"');
      return r.json();
    });
  }

  // ---------- pricing ----------
  function outward(pc) {
    pc = String(pc || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pc.length >= 5 && /\d[A-Z]{2}$/.test(pc)) pc = pc.slice(0, -3);
    return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(pc) ? pc : '';
  }
  function matchArea(c, pc) {
    var o = outward(pc);
    if (!o) return null;
    for (var i = 0; i < (c.areas || []).length; i++) {
      var a = c.areas[i];
      if (String(a.codes || '').toUpperCase().split(/[\s,]+/).indexOf(o) > -1) return { name: a.name, surcharge: +a.surcharge || 0, code: o };
    }
    return { name: 'Outside our area', surcharge: 0, code: o, outside: true };
  }
  function num(v, f) { v = parseFloat(v); return isFinite(v) ? v : (f || 0); }

  function quote(c, s) {
    var svc = c.services[s.service] || c.services[0] || { name: 'Job', rate: 0, factor: 1, suffix: '' };
    var rooms = s.rooms, hours = null, base;
    if (c.mode === 'hour') {
      hours = (num(c.baseHours) + rooms * num(c.hoursPerRoom)) * num(svc.factor, 1);
      base = hours * num(svc.rate);
    } else {
      base = (num(c.baseFee) + rooms * num(svc.rate)) * num(svc.factor, 1);
    }
    var extras = (c.addons || []).filter(function (a, i) { return s.addons.indexOf(i) > -1; });
    var addonTotal = extras.reduce(function (t, a) { return t + num(a.price); }, 0);
    var area = matchArea(c, s.postcode);
    var surcharge = area ? area.surcharge : 0;
    var raw = base + addonTotal + surcharge, min = num(c.minimum);
    var total = Math.max(raw, min), sp = num(c.spread) / 100, r = num(c.rounding, 1) || 1;
    var low = Math.max(min, Math.floor(total * (1 - sp) / r) * r), high = Math.max(low, Math.ceil(total * (1 + sp) / r) * r);
    return { service: svc, rooms: rooms, hours: hours, base: base, extras: extras, addonTotal: addonTotal, area: area,
      surcharge: surcharge, total: total, low: low, high: high, minApplied: raw < min };
  }
  function money(n) { return '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { maximumFractionDigits: n % 1 ? 2 : 0 }); }
  function range(q) { return q.low === q.high ? money(q.low) : money(q.low) + '–' + money(q.high); }
  function hrs(h) { var r = Math.round(h * 2) / 2; return 'about ' + r + (r === 1 ? ' hour' : ' hours'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function unit(n, label) { label = String(label || 'rooms').toLowerCase(); return n + ' ' + (n === 1 ? label.replace(/s$/, '') : label); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---------- styles (inside shadow DOM, so host site CSS can't break it) ----------
  var CSS = ':host{all:initial;display:block;font-family:inherit;color:#1d2b36;--a:#0f766e;--a-soft:color-mix(in srgb,var(--a) 11%,#fff);--a-mid:color-mix(in srgb,var(--a) 30%,#fff);--line:#dfe5ea;--muted:#5b6875}'
    + '*{box-sizing:border-box}[hidden]{display:none!important}'
    + '.qk{background:#fff;border-radius:24px;padding:28px;box-shadow:0 30px 70px -30px rgba(29,43,54,.35),0 0 0 1px rgba(29,43,54,.04);font-size:16px;line-height:1.5;font-family:inherit;text-align:left}'
    + 'h2{font-size:1.5rem;line-height:1.15;margin:0 0 4px;font-weight:800;letter-spacing:-.01em}'
    + '.sub{margin:0 0 18px;color:var(--muted);font-size:.93rem}'
    + 'fieldset{border:0;margin:0 0 16px;padding:0;min-width:0}'
    + 'legend,.lbl{display:block;font-weight:800;font-size:.88rem;margin-bottom:7px;padding:0}'
    + '.opts{display:grid;grid-template-columns:1fr 1fr;gap:6px}'
    + '.opt{position:relative}.opt input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}'
    + '.opt span{display:block;border:1.5px solid var(--line);border-radius:12px;padding:9px 12px;font-weight:700;font-size:.92rem;line-height:1.25;transition:.12s}'
    + '.opt span small{display:block;font-weight:600;color:var(--muted);font-size:.78rem}'
    + '.opt input:checked+span{border-color:var(--a);background:var(--a-soft);color:color-mix(in srgb,var(--a) 80%,#000)}'
    + '.opt input:focus-visible+span,.chip input:focus-visible+span{outline:2px solid var(--a);outline-offset:2px}'
    + '.row{display:grid;grid-template-columns:auto 1fr;gap:14px;margin-bottom:0;align-items:end}'
    + '.step{display:flex;align-items:center;border:1.5px solid var(--line);border-radius:12px;height:44px}'
    + '.step button{width:40px;height:100%;border:0;background:none;font-weight:700;font-size:1.25rem;line-height:1.2;font-family:inherit;color:var(--a);cursor:pointer;border-radius:10px}'
    + '.step button:disabled{color:#b8c2cb;cursor:default}.step button:not(:disabled):hover{background:var(--a-soft)}'
    + '.step output{min-width:34px;text-align:center;font-weight:800;font-size:1.05rem}'
    + 'input[type=text],input[type=email],input[type=tel],select,textarea{width:100%;height:44px;border:1.5px solid var(--line);border-radius:12px;padding:0 12px;font-weight:600;font-size:.95rem;line-height:1.2;font-family:inherit;color:inherit;background:#fff}'
    + 'textarea{height:70px;padding:9px 12px;resize:vertical}'
    + 'input:focus,select:focus,textarea:focus{outline:none;border-color:var(--a);box-shadow:0 0 0 3px var(--a-mid)}'
    + '.pc{text-transform:uppercase}.pc::placeholder{text-transform:none}'
    + '.note{font-size:.78rem;color:var(--muted);margin:5px 0 12px;min-height:1.1em}.note.warn{color:#9a4b00}'
    + '.chips{display:flex;flex-wrap:wrap;gap:6px}'
    + '.chip{position:relative}.chip input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}'
    + '.chip span{display:inline-block;border:1.5px solid var(--line);border-radius:999px;padding:5px 12px;font-weight:700;font-size:.85rem}'
    + '.chip span i{font-style:normal;color:var(--muted);font-weight:600}'
    + '.chip input:checked+span{border-color:var(--a);background:var(--a);color:#fff}.chip input:checked+span i{color:inherit;opacity:.85}'
    + '.price{background:var(--a-soft);border-radius:16px;padding:14px 18px;margin:4px 0 14px;display:flex;justify-content:space-between;align-items:center;gap:12px}'
    + '.price .k{font-weight:700;font-size:.85rem;color:var(--muted);display:block}'
    + '.price b{display:block;font-size:2rem;line-height:1.1;letter-spacing:-.02em;color:color-mix(in srgb,var(--a) 80%,#000)}'
    + '.price small{display:block;font-size:.82rem;font-weight:700;color:var(--muted)}'
    + '.price .per{text-align:right}'
    + '.btn{display:flex;width:100%;align-items:center;justify-content:center;gap:8px;height:52px;border:0;border-radius:999px;background:var(--a);color:#fff;font-weight:800;font-size:1rem;line-height:1.2;font-family:inherit;cursor:pointer;box-shadow:0 10px 24px -12px var(--a)}'
    + '.btn:hover{filter:brightness(.92)}.btn:focus-visible{outline:3px solid var(--a-mid);outline-offset:2px}'
    + '.link{background:none;border:0;padding:0;font-weight:700;font-size:.88rem;line-height:1.2;font-family:inherit;color:var(--a);cursor:pointer;text-decoration:underline;text-underline-offset:3px}'
    + '.sum{display:flex;justify-content:space-between;gap:10px;align-items:center;background:var(--a-soft);border-radius:14px;padding:10px 14px;margin-bottom:14px;font-size:.88rem}'
    + '.sum b{font-size:1.1rem}'
    + '.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
    + '.f{margin-bottom:10px}.f label{display:block;font-weight:800;font-size:.85rem;margin-bottom:4px}.f label i{font-style:normal;font-weight:600;color:var(--muted)}'
    + '.demo{display:flex;gap:10px;align-items:flex-start;background:#fff7e6;border:1px solid #f5d9a6;color:#6b4200;border-radius:12px;padding:9px 12px;font-size:.8rem;line-height:1.4;margin-bottom:12px}'
    + '.demo .link{color:#6b4200;font-size:.8rem;white-space:nowrap}'
    + '.err{color:#b42318;font-size:.82rem;font-weight:700;margin:0 0 8px}'
    + '.done{text-align:center;padding:10px 0 4px}.done .tick{width:64px;height:64px;border-radius:50%;background:var(--a);display:grid;place-items:center;margin:0 auto 14px}'
    + '.done p{color:var(--muted);margin:0 0 12px}.done .ref{font-size:.8rem}'
    + '.foot{display:flex;justify-content:center;align-items:center;gap:6px;margin:16px 0 0;font-size:.75rem;color:var(--muted)}'
    + '.foot a{color:inherit;font-weight:800;text-decoration:none}.foot a:hover{text-decoration:underline}'
    + '.beta{background:#1d2b36;color:#fff;border-radius:4px;padding:1px 5px;font-size:.62rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}'
    + '@media (max-width:420px){.qk{padding:22px 18px}.two{grid-template-columns:1fr}.price b{font-size:1.7rem}}';

  var SAMPLE = [
    { name: 'Alex Sample', email: 'alex@example.com', phone: '07700 900123', day: 'Weekday mornings', notes: 'We have a friendly dog.' },
    { name: 'Sam Testperson', email: 'sam@example.com', phone: '07700 900456', day: 'Any time', notes: '' },
    { name: 'Jordan Demo', email: 'jordan@example.com', phone: '', day: 'Weekends', notes: 'Keys with the neighbour.' }
  ];

  // ---------- widget ----------
  function Widget(host, id, opts) {
    opts = opts || {};
    this.id = id; this.opts = opts;
    this.root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    this.s = { service: 0, rooms: 2, addons: [], postcode: '' };
    this.step = 'quote';
  }
  Widget.prototype.setConfig = function (c) {
    this.c = c;
    var s = this.s;
    s.service = Math.min(s.service, Math.max(0, c.services.length - 1));
    s.rooms = Math.min(Math.max(s.rooms, +c.roomMin || 0), +c.roomMax || 10);
    s.addons = s.addons.filter(function (i) { return i < (c.addons || []).length; });
    this.render();
  };
  Widget.prototype.render = function () {
    var c = this.c, s = this.s, self = this, uidp = 'qk' + Math.random().toString(36).slice(2, 6);
    var accent = /^#[0-9a-f]{3,8}$/i.test(c.accent || '') ? c.accent : '#0f766e';
    var svcs = c.services.map(function (v, i) {
      return '<label class="opt"><input type="radio" name="svc" value="' + i + '"' + (i === s.service ? ' checked' : '') + '><span>' + esc(v.name) + '</span></label>';
    }).join('');
    var adds = (c.addons || []).map(function (a, i) {
      return '<label class="chip"><input type="checkbox" name="add" value="' + i + '"' + (s.addons.indexOf(i) > -1 ? ' checked' : '') + '><span>' + esc(a.name) + ' <i>+' + money(num(a.price)) + '</i></span></label>';
    }).join('');
    var demo = this.opts.demo !== false;
    this.root.innerHTML = '<style>' + CSS + '</style>'
      + '<div class="qk" style="--a:' + accent + '">'
      // step 1: quote
      + '<form class="s-quote" novalidate' + (this.step !== 'quote' ? ' hidden' : '') + '>'
      + '<h2>' + esc(c.title || 'Get an instant price') + '</h2>'
      + (c.intro ? '<p class="sub">' + esc(c.intro) + '</p>' : '')
      + (c.services.length > 1 ? '<fieldset><legend>What do you need?</legend><div class="opts">' + svcs + '</div></fieldset>' : '')
      + '<div class="row"><div><span class="lbl" id="' + uidp + 'r">' + esc(c.roomLabel || 'Rooms') + '</span>'
      + '<div class="step" role="group" aria-labelledby="' + uidp + 'r"><button type="button" data-d="-1" aria-label="Fewer">−</button><output aria-live="polite">' + s.rooms + '</output><button type="button" data-d="1" aria-label="More">+</button></div></div>'
      + '<div><label class="lbl" for="' + uidp + 'p">Postcode</label><input class="pc" id="' + uidp + 'p" type="text" name="postcode" autocomplete="postal-code" placeholder="e.g. NG2 5AB" value="' + esc(s.postcode) + '" maxlength="9"></div></div>'
      + '<p class="note area" aria-live="polite"></p>'
      + (adds ? '<fieldset><legend>Extras</legend><div class="chips">' + adds + '</div></fieldset>' : '')
      + '<div class="price"><div><span class="k">Estimated price</span><b aria-live="polite"></b></div><div class="per"><small class="p1"></small><small class="p2"></small></div></div>'
      + '<button class="btn" type="submit">Request this quote</button>'
      + '</form>'
      // step 2: details
      + '<form class="s-details" novalidate' + (this.step !== 'details' ? ' hidden' : '') + '>'
      + '<h2 tabindex="-1">Your details</h2><p class="sub">' + esc(c.business) + ' will confirm the price and a start date.</p>'
      + '<div class="sum"><span class="sumtxt"></span><b class="sumprice"></b></div>'
      + (demo ? '<div class="demo"><span><b>Demo:</b> please use made-up details. Nothing is sent. The request is saved in this browser only.</span><button type="button" class="link fill">Fill sample</button></div>' : '')
      + '<div class="two"><div class="f"><label for="' + uidp + 'n">Name</label><input id="' + uidp + 'n" type="text" name="name" autocomplete="name" required></div>'
      + '<div class="f"><label for="' + uidp + 'e">Email</label><input id="' + uidp + 'e" type="email" name="email" autocomplete="email" required></div></div>'
      + '<div class="two"><div class="f"><label for="' + uidp + 't">Phone <i>(optional)</i></label><input id="' + uidp + 't" type="tel" name="phone" autocomplete="tel"></div>'
      + '<div class="f"><label for="' + uidp + 'd">Best time</label><select id="' + uidp + 'd" name="day"><option>Any time</option><option>Weekday mornings</option><option>Weekday afternoons</option><option>Weekends</option></select></div></div>'
      + '<div class="f"><label for="' + uidp + 'm">Anything we should know? <i>(optional)</i></label><textarea id="' + uidp + 'm" name="notes"></textarea></div>'
      + '<p class="err" role="alert"></p>'
      + '<button class="btn" type="submit">Send request</button>'
      + '<p style="text-align:center;margin:10px 0 0"><button type="button" class="link back">← Change my quote</button></p>'
      + '</form>'
      // step 3: done
      + '<div class="s-done done"' + (this.step !== 'done' ? ' hidden' : '') + '>'
      + '<div class="tick"><svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
      + '<h2 tabindex="-1">Request sent</h2><p class="donetxt"></p>'
      + (demo ? '<p class="ref"><b>Demo:</b> this request is now in the <a href="' + BASE + '#leads" target="_blank" rel="noopener">QuoteKit leads dashboard</a>.</p>' : '')
      + '<button type="button" class="link again">Get another quote</button>'
      + '</div>'
      + '<p class="foot">Powered by <a href="' + BASE + '" target="_blank" rel="noopener">QuoteKit</a><span class="beta">Beta</span></p>'
      + '</div>';

    var r = this.root, fq = r.querySelector('.s-quote'), fd = r.querySelector('.s-details');
    fq.addEventListener('change', function (e) {
      if (e.target.name === 'svc') s.service = +e.target.value;
      if (e.target.name === 'add') s.addons = [].map.call(fq.querySelectorAll('[name=add]:checked'), function (x) { return +x.value; });
      self.update();
    });
    fq.postcode.addEventListener('input', function () { s.postcode = fq.postcode.value; self.update(); });
    [].forEach.call(fq.querySelectorAll('.step button'), function (b) {
      b.addEventListener('click', function () {
        s.rooms = Math.min(Math.max(s.rooms + +b.dataset.d, +c.roomMin || 0), +c.roomMax || 10);
        self.update();
      });
    });
    fq.addEventListener('submit', function (e) { e.preventDefault(); self.go('details'); });
    fd.addEventListener('submit', function (e) { e.preventDefault(); self.submit(fd); });
    r.querySelector('.back').addEventListener('click', function () { self.go('quote'); });
    r.querySelector('.again').addEventListener('click', function () { self.go('quote'); });
    var fill = r.querySelector('.fill');
    if (fill) fill.addEventListener('click', function () {
      var p = SAMPLE[Math.floor(Math.random() * SAMPLE.length)];
      ['name', 'email', 'phone', 'day', 'notes'].forEach(function (k) { fd[k].value = p[k]; });
    });
    this.update();
  };
  Widget.prototype.update = function () {
    var c = this.c, s = this.s, r = this.root, q = quote(c, s);
    this.q = q;
    r.querySelector('output').textContent = s.rooms;
    var bs = r.querySelectorAll('.step button');
    bs[0].disabled = s.rooms <= (+c.roomMin || 0); bs[1].disabled = s.rooms >= (+c.roomMax || 10);
    r.querySelector('.price b').textContent = range(q);
    r.querySelector('.p1').textContent = q.service.suffix || '';
    r.querySelector('.p2').textContent = q.hours != null ? hrs(q.hours) : (q.minApplied ? 'minimum charge' : '');
    var note = r.querySelector('.area'), a = q.area;
    note.className = 'note area' + (a && a.outside ? ' warn' : '');
    note.textContent = !a ? '' : a.outside
      ? a.code + ' is outside our usual area.' + (c.acceptOutside ? ' Send a request and we’ll check.' : '')
      : a.code + ': ' + a.name + (a.surcharge ? ' (includes ' + money(a.surcharge) + ' travel)' : ', no travel charge');
    var bits = [q.service.name, unit(s.rooms, c.roomLabel)].concat(q.extras.map(function (x) { return x.name; }));
    r.querySelector('.sumtxt').textContent = bits.join(' · ');
    r.querySelector('.sumprice').textContent = range(q);
    var blocked = a && a.outside && !c.acceptOutside;
    r.querySelector('.s-quote .btn').disabled = !!blocked;
    r.querySelector('.s-quote .btn').style.opacity = blocked ? .5 : '';
  };
  Widget.prototype.go = function (step) {
    this.step = step;
    var r = this.root;
    ['quote', 'details', 'done'].forEach(function (k) { r.querySelector('.s-' + k).hidden = k !== step; });
    var h = r.querySelector('.s-' + step + ' h2');
    if (h && step !== 'quote') h.focus();
  };
  Widget.prototype.submit = function (f) {
    var err = f.querySelector('.err'), name = f.name.value.trim(), email = f.email.value.trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.textContent = !name ? 'Please add your name.' : 'Please add a valid email address.';
      (!name ? f.name : f.email).focus();
      return;
    }
    err.textContent = '';
    var c = this.c, s = this.s, q = this.q;
    var lead = {
      id: uid(), at: new Date().toISOString(), status: 'new',
      name: name.slice(0, 80), email: email.slice(0, 120), phone: f.phone.value.trim().slice(0, 30),
      day: f.day.value, notes: f.notes.value.trim().slice(0, 500),
      service: q.service.name, suffix: q.service.suffix || '', rooms: s.rooms, roomLabel: c.roomLabel || 'Rooms',
      addons: q.extras.map(function (x) { return { name: x.name, price: num(x.price) }; }),
      postcode: s.postcode.toUpperCase().trim().slice(0, 9), area: q.area ? q.area.name : '', outside: !!(q.area && q.area.outside),
      hours: q.hours, surcharge: q.surcharge, low: q.low, high: q.high, minApplied: q.minApplied,
      source: this.opts.source || (location.pathname.split('/').filter(Boolean).slice(-1)[0] || location.hostname)
    };
    store.addLead(this.id, lead);
    this.root.querySelector('.donetxt').textContent = 'Thanks, ' + name.split(' ')[0] + '. ' + c.business + ' has your request for ' + range(q) + '. ' + (c.replyPromise || '');
    f.reset();
    this.go('done');
  };

  function mount(el, id, opts) {
    var wg = new Widget(el, id, opts);
    if (opts && opts.config) { wg.setConfig(opts.config); return Promise.resolve(wg); }
    return loadConfig(id).then(function (c) { wg.setConfig(c); return wg; }, function (e) {
      wg.root.innerHTML = '<p style="font:14px system-ui;color:#b42318">' + esc(e.message) + '</p>';
      throw e;
    });
  }
  function scan() {
    [].forEach.call(d.querySelectorAll('script[data-quotekit]:not([data-qk-done]),[data-quotekit-mount]:not([data-qk-done])'), function (el) {
      el.setAttribute('data-qk-done', '');
      var id = el.getAttribute('data-quotekit') || el.getAttribute('data-quotekit-mount'), host = el;
      if (el.tagName === 'SCRIPT') { host = d.createElement('div'); host.className = 'quotekit'; el.parentNode.insertBefore(host, el); }
      mount(host, id, { demo: el.getAttribute('data-demo') !== 'false' });
    });
  }

  w.QuoteKit = { version: '0.1.0-beta', mount: mount, scan: scan, quote: quote, range: range, money: money, store: store, loadConfig: loadConfig, base: BASE, esc: esc, unit: unit };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', scan); else scan();
})();
