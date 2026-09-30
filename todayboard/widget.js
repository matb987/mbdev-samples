/*! Today Board widget (beta concept by MBDEV).
 * Embed:  <div data-todayboard="crumb-kettle" data-view="board"></div>
 *         <script src=".../todayboard/widget.js" async></script>
 * Views:  badge (open/closed pill), board (today's items + notice), hours (opening hours + holiday hours), page (everything).
 * Theme:  set --tb-* CSS custom properties on the host element (see CSS below); fonts inherit from the page.
 * Demo build: the board comes from configs/<id>.json, or from edits saved in the Today Board editor in this browser.
 * Nothing is sent anywhere. Open tabs update live when the board changes.
 */
(function () {
  'use strict';
  var w = window, d = document;
  if (w.TodayBoard && w.TodayBoard.version) { w.TodayBoard.scan(); return; }

  var me = d.currentScript || d.querySelector('script[src*="todayboard/widget.js"]');
  var BASE = me ? me.src.replace(/[^\/?#]*([?#].*)?$/, '') : './';
  var mem = {}, widgets = [], cache = {};

  // ---------- storage (localStorage, with an in-memory fallback) ----------
  function key(id) { return 'todayboard:board:' + id; }
  var store = {
    board: function (id) { try { return JSON.parse(localStorage.getItem(key(id))); } catch (e) { return mem[id] || null; } },
    save: function (id, b) {
      b.updatedAt = new Date().toISOString();
      mem[id] = b; cache[id] = b;
      try { localStorage.setItem(key(id), JSON.stringify(b)); } catch (e) {}
      w.dispatchEvent(new CustomEvent('todayboard:update', { detail: { id: id } }));
    },
    clear: function (id) { delete mem[id]; delete cache[id]; try { localStorage.removeItem(key(id)); } catch (e) {} }
  };
  function load(id) {
    var saved = store.board(id);
    if (saved) return Promise.resolve(cache[id] = saved);
    return fetch(BASE + 'configs/' + encodeURIComponent(id) + '.json').then(function (r) {
      if (!r.ok) throw new Error('Today Board: no board called "' + id + '"');
      return r.json();
    }).then(function (b) { return (cache[id] = b); });
  }

  // ---------- time (always in the business's own time zone) ----------
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function forced() { var m = /[?&]tbnow=([\d\-T:]+)/.exec(location.search); return m ? m[1] : null; }
  function now(tz) {
    var f = forced();
    if (f) { var m = /^(\d{4}-\d\d-\d\d)(?:T(\d\d):(\d\d))?/.exec(f); if (m) return { date: m[1], mins: (+m[2] || 0) * 60 + (+m[3] || 0) }; }
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: tz || 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { date: p.year + '-' + p.month + '-' + p.day, mins: (+p.hour % 24) * 60 + +p.minute };
  }
  function addDays(date, n) { var t = new Date(date + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
  function dow(date) { return (new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7; } // 0 = Monday
  function mins(t) { var m = /^(\d{1,2}):(\d\d)$/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; }
  function hm(t) { var m = mins(t); if (m == null) return ''; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function niceDate(date) { var t = new Date(date + 'T12:00:00Z'); return DAYS[dow(date)].slice(0, 3) + ' ' + t.getUTCDate() + ' ' + MON[t.getUTCMonth()]; }

  // An exception matches one date (YYYY-MM-DD) or, with repeat: "yearly", the same day every year.
  function exceptionFor(b, date) {
    var ex = b.exceptions || [];
    for (var i = 0; i < ex.length; i++) {
      var e = ex[i];
      if (e.date === date || (e.repeat === 'yearly' && e.date && e.date.slice(5) === date.slice(5))) return e;
    }
    return null;
  }
  // What are the hours on a given date? { closed, open, close, label, exception }
  function dayHours(b, date) {
    var e = exceptionFor(b, date);
    if (e) return { closed: !!e.closed || mins(e.open) == null || mins(e.close) == null, open: e.open, close: e.close, label: e.label || '', exception: e };
    var h = (b.hours || [])[dow(date)] || { closed: true };
    return { closed: !!h.closed || mins(h.open) == null || mins(h.close) == null, open: h.open, close: h.close, label: '' };
  }
  function status(b) {
    var n = now(b.tz), today = dayHours(b, n.date), o = mins(today.open), c = mins(today.close);
    if (!today.closed && n.mins >= o && n.mins < c) {
      return { open: true, soon: c - n.mins <= 30, today: today, text: (c - n.mins <= 30 ? 'Closing soon · ' : 'Open now · until ') + hm(today.close), note: today.label };
    }
    // find the next opening time, up to 3 weeks ahead
    for (var i = 0; i < 21; i++) {
      var date = addDays(n.date, i), h = dayHours(b, date);
      if (h.closed || (i === 0 && n.mins >= mins(h.open))) continue;
      var when = i === 0 ? '' : i === 1 ? 'tomorrow ' : i < 7 ? DAYS[dow(date)].slice(0, 3) + ' ' : niceDate(date) + ' ';
      var lead = today.closed && today.exception ? 'Closed today' : 'Closed';
      return { open: false, today: today, text: lead + ' · opens ' + when + hm(h.open), note: today.closed ? today.label : '' };
    }
    return { open: false, today: today, text: 'Closed for now', note: today.label };
  }
  function upcoming(b, days) {
    var n = now(b.tz), out = [];
    for (var i = 0; i < (days || 45); i++) {
      var date = addDays(n.date, i), e = exceptionFor(b, date);
      if (e) out.push({ date: date, e: e, h: dayHours(b, date) });
    }
    return out;
  }
  function ago(iso) {
    if (!iso) return '';
    var m = Math.round((Date.now() - new Date(iso)) / 60000);
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' hr ago' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function price(p) { p = String(p == null ? '' : p).trim(); return /^\d+(\.\d{1,2})?$/.test(p) ? '£' + (+p).toFixed(p.indexOf('.') > -1 || +p % 1 ? 2 : 0) : p; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  var TAGS = { special: 'Special', vg: 'vg', v: 'v', gf: 'gf', new: 'New' };

  // ---------- styles (shadow DOM; theme through --tb-* custom properties set on the host) ----------
  var CSS = ':host{display:block;color:var(--tb-ink,inherit);font:inherit;line-height:1.5}:host([data-view=badge]){display:inline-block}'
    + '*{box-sizing:border-box}[hidden]{display:none!important}'
    + '.badge{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;font-size:var(--tb-badge-size,.85rem);background:var(--tb-badge-bg,rgba(0,0,0,.06));color:inherit;padding:var(--tb-badge-pad,7px 14px);border-radius:999px;line-height:1.3}'
    + '.dot{width:8px;height:8px;border-radius:50%;background:var(--tb-open,#22a55b);flex:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--tb-open,#22a55b) 25%,transparent)}'
    + '.dot.shut{background:var(--tb-shut,#e0703c);box-shadow:0 0 0 3px color-mix(in srgb,var(--tb-shut,#e0703c) 25%,transparent)}.dot.soon{background:var(--tb-soon,#f2b53c)}'
    + '.notice{display:flex;gap:10px;align-items:flex-start;background:var(--tb-notice-bg,#fff3c4);color:var(--tb-notice-ink,#4a3500);border-radius:14px;padding:10px 14px;margin:0 0 18px;font-size:.95rem;font-weight:600;line-height:1.4}'
    + '.notice svg{flex:none;margin-top:2px}'
    + '.closed{display:flex;gap:12px;align-items:center;background:var(--tb-closed-bg,#fde8df);color:var(--tb-closed-ink,#7a2a0c);border-radius:14px;padding:12px 16px;margin:0 0 18px;font-weight:700;line-height:1.35}'
    + '.closed small{display:block;font-weight:500;opacity:.85}'
    + '.items{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(var(--tb-cols,1),minmax(0,1fr));gap:var(--tb-gap,6px 48px);font-family:var(--tb-list-font,inherit);font-size:var(--tb-list-size,1rem)}'
    + '.items li{display:flex;align-items:baseline;gap:10px;min-width:0}'
    + '.items .nm{min-width:0;overflow-wrap:anywhere}'
    + '.items i{flex:1;min-width:16px;border-bottom:2px dotted var(--tb-leader,rgba(0,0,0,.25))}'
    + '.items b{color:var(--tb-price,inherit);font-weight:var(--tb-price-weight,700);white-space:nowrap}'
    + '.tag{font-family:var(--tb-tag-font,system-ui,sans-serif);font-size:.72rem;font-weight:700;font-style:normal;background:var(--tb-tag-bg,#dff5e6);color:var(--tb-tag-ink,#14532d);padding:1px 6px;border-radius:6px;vertical-align:.25em;margin-left:6px;white-space:nowrap;letter-spacing:.02em}'
    + '.tag.special{background:var(--tb-special-bg,#ffe08a);color:var(--tb-special-ink,#4a3500)}.tag.new{background:var(--tb-new-bg,#dbe8ff);color:var(--tb-new-ink,#1e3a8a)}'
    + 'li.out .nm span,li.out b{text-decoration:line-through;text-decoration-thickness:2px;opacity:.55}li.out i{opacity:.4}'
    + '.so{font-family:var(--tb-tag-font,system-ui,sans-serif);font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;background:var(--tb-out-bg,#fde8df);color:var(--tb-out-ink,#9a3412);padding:1px 7px;border-radius:6px;vertical-align:.25em;margin-left:6px;white-space:nowrap}'
    + '.empty{opacity:.7;font-style:italic}'
    + '.meta{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px 14px;margin-top:18px;font-size:.78rem;color:var(--tb-muted,#6b7280);font-family:var(--tb-meta-font,inherit)}'
    + '.meta a{color:inherit;font-weight:700;text-decoration:none}.meta a:hover{text-decoration:underline}'
    + '.beta{background:var(--tb-muted,#6b7280);color:#fff;border-radius:4px;padding:1px 5px;font-size:.6rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-left:5px}'
    + '.live{display:inline-flex;align-items:center;gap:6px}.live::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--tb-open,#22a55b)}'
    + 'dl{margin:0}.hrs div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--tb-line,rgba(0,0,0,.12));max-width:var(--tb-hours-width,360px)}'
    + '.hrs dt{margin:0}.hrs dd{margin:0;font-weight:600;text-align:right}.hrs .now{font-weight:700}.hrs .now dt::after{content:" (today)";font-weight:500;opacity:.7}'
    + '.hrs .chg dd{color:var(--tb-accent,#b04a22)}'
    + '.hol{margin:16px 0 0;max-width:var(--tb-hours-width,360px);background:var(--tb-hol-bg,rgba(0,0,0,.04));border-radius:12px;padding:10px 14px;font-size:.9rem}'
    + '.hol b{display:block;margin-bottom:4px}.hol ul{list-style:none;padding:0;margin:0;display:grid;gap:2px}.hol li{display:flex;justify-content:space-between;gap:10px}.hol li span:last-child{font-weight:600}'
    + '.pg{display:grid;gap:22px}.pg h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px;color:var(--tb-muted,#6b7280);font-weight:700}'
    + '.big{display:flex;align-items:center;gap:12px;font-size:1.25rem;font-weight:700;line-height:1.25}.big .dot{width:12px;height:12px}'
    + '.big small{display:block;font-size:.85rem;font-weight:500;color:var(--tb-muted,#6b7280)}'
    + '.err{font:14px system-ui;color:#b42318}';

  var ICON_INFO = '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9v5M10 6.2v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  // ---------- views ----------
  function badge(b) {
    var s = status(b);
    return '<span class="badge" role="status"><i class="dot' + (s.open ? (s.soon ? ' soon' : '') : ' shut') + '"></i>' + esc(s.text) + '</span>';
  }
  function closedBanner(b) {
    var s = status(b);
    if (s.open || !s.today.closed || !s.today.exception) return '';
    return '<div class="closed" role="status"><i class="dot shut"></i><span>Closed today' + (s.note && s.note !== 'Closed today' ? ': ' + esc(s.note) : '') + '<small>' + esc(s.text.replace(/^Closed today · /, 'We ').replace(/^We opens/, 'We open')) + '.</small></span></div>';
  }
  function notice(b) { return b.notice ? '<div class="notice" role="note">' + ICON_INFO + '<span>' + esc(b.notice) + '</span></div>' : ''; }
  function items(b) {
    var list = (b.items || []).slice(0, 10);
    if (!list.length) return '<p class="empty">Nothing on the board right now. Check back soon!</p>';
    return '<ul class="items">' + list.map(function (it) {
      return '<li' + (it.soldOut ? ' class="out"' : '') + '><span class="nm"><span>' + esc(it.name) + '</span>'
        + (it.tag && TAGS[it.tag] ? '<em class="tag ' + esc(it.tag) + '">' + TAGS[it.tag] + '</em>' : '')
        + (it.soldOut ? '<em class="so">Sold out</em>' : '') + '</span><i></i><b>' + esc(price(it.price)) + '</b></li>';
    }).join('') + '</ul>';
  }
  function meta(b, o) {
    return '<p class="meta"><span class="live">Updated ' + esc(b.updatedAt ? ago(b.updatedAt) : 'today') + '</span>'
      + (o.powered === false ? '' : '<span>Live board by <a href="' + BASE + '" target="_blank" rel="noopener">Today Board</a><span class="beta">Beta</span></span>') + '</p>';
  }
  function hours(b) {
    var n = now(b.tz), rows = '', t = dow(n.date);
    // this week from Monday, with any changes for the coming days shown in place
    for (var i = 0; i < 7; i++) {
      var date = addDays(n.date, i - t), h = b.hours[i] || { closed: true }, ex = date >= n.date ? exceptionFor(b, date) : null;
      var eff = ex ? dayHours(b, date) : { closed: !!h.closed || mins(h.open) == null, open: h.open, close: h.close };
      rows += '<div class="' + (i === t ? 'now' : '') + (ex ? ' chg' : '') + '"><dt>' + DAYS[i] + '</dt><dd>' + (eff.closed ? 'Closed' : hm(eff.open) + ' – ' + hm(eff.close)) + '</dd></div>';
    }
    var up = upcoming(b, 60).filter(function (u) { return u.date > addDays(n.date, 6 - t) || u.date === n.date; });
    var hol = up.length ? '<div class="hol"><b>Changes to our hours</b><ul>' + up.slice(0, 6).map(function (u) {
      return '<li><span>' + niceDate(u.date) + (u.e.label ? ' · ' + esc(u.e.label) : '') + '</span><span>' + (u.h.closed ? 'Closed' : hm(u.h.open) + ' – ' + hm(u.h.close)) + '</span></li>';
    }).join('') + '</ul></div>' : '';
    return '<dl class="hrs">' + rows + '</dl>' + hol;
  }
  function page(b, o) {
    var s = status(b);
    return '<div class="pg"><div class="big"><i class="dot' + (s.open ? (s.soon ? ' soon' : '') : ' shut') + '"></i><span>' + esc(s.text) + (s.note ? '<small>' + esc(s.note) + '</small>' : '') + '</span></div>'
      + '<div>' + notice(b) + '<h3>' + esc(b.itemsTitle || 'Today') + '</h3>' + items(b) + '</div>'
      + '<div><h3>Opening hours</h3>' + hours(b) + '</div></div>' + meta(b, o);
  }
  var VIEWS = {
    badge: function (b) { return badge(b); },
    board: function (b, o) { return closedBanner(b) + notice(b) + items(b) + meta(b, o); },
    hours: function (b) { return hours(b); },
    page: page
  };

  function Widget(host, id, opts) {
    this.host = host; this.id = id; this.opts = opts || {};
    this.view = VIEWS[this.opts.view] ? this.opts.view : 'board';
    host.setAttribute('data-view', this.view);
    this.root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  }
  Widget.prototype.render = function () {
    var b = this.opts.board || cache[this.id];
    if (!b) return;
    this.root.innerHTML = '<style>' + CSS + '</style>' + VIEWS[this.view](b, this.opts);
  };

  function mount(el, id, opts) {
    var wg = new Widget(el, id, opts);
    widgets.push(wg);
    if (wg.opts.board) { wg.render(); return Promise.resolve(wg); }
    return load(id).then(function () { wg.render(); return wg; }, function (e) {
      wg.root.innerHTML = '<p class="err" style="font:14px system-ui;color:#b42318">' + esc(e.message) + '</p>';
      throw e;
    });
  }
  function refresh(id) {
    widgets.forEach(function (wg) { if (!id || wg.id === id) wg.render(); });
  }
  function scan() {
    [].forEach.call(d.querySelectorAll('[data-todayboard]:not([data-tb-done])'), function (el) {
      el.setAttribute('data-tb-done', '');
      var id = el.getAttribute('data-todayboard'), host = el;
      if (el.tagName === 'SCRIPT') { host = d.createElement('div'); host.className = 'todayboard'; el.parentNode.insertBefore(host, el); }
      mount(host, id, { view: el.getAttribute('data-view') || 'board', powered: el.getAttribute('data-powered') !== 'false' });
    });
  }
  // live updates: other tabs (storage event), this tab (custom event), and the clock (open/closed changes)
  w.addEventListener('storage', function (e) {
    if (!e.key || e.key.indexOf('todayboard:board:') !== 0) return;
    var id = e.key.slice(17);
    try { cache[id] = JSON.parse(e.newValue); } catch (x) {}
    if (!cache[id]) { delete cache[id]; load(id).then(function () { refresh(id); }); } else refresh(id);
  });
  w.addEventListener('todayboard:update', function (e) { refresh(e.detail && e.detail.id); });
  setInterval(function () { refresh(); }, 30000);

  w.TodayBoard = { version: '0.1.0-beta', mount: mount, scan: scan, load: load, store: store, refresh: refresh, base: BASE,
    status: status, dayHours: dayHours, upcoming: upcoming, now: now, addDays: addDays, dow: dow, hm: hm, niceDate: niceDate, price: price, esc: esc, ago: ago, DAYS: DAYS };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', scan); else scan();
})();
