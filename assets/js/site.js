/* Trendi Tots Boutique preview site.
   Sample listings live in products.js. When the shop moves to Shopify, replace that file's
   data with products from Shopify and point the checkout button at the Shopify cart. */
(function () {
  'use strict';
  var P = window.TT_PRODUCTS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var byId = function (id) { return P.filter(function (p) { return p.id === id; })[0]; };
  var money = function (n) { return '$' + n; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var img = function (p, suffix) { return 'assets/img/products/' + p.id + (suffix || '') + '.svg'; };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- bag ---------- */
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem('tt-bag') || '[]') || []; } catch (e) { bag = []; }
  bag = bag.filter(function (l) { return byId(l.id); });
  function saveBag() { try { localStorage.setItem('tt-bag', JSON.stringify(bag)); } catch (e) { /* storage can be unavailable; the bag still works for this visit */ } }
  function bagCount() { return bag.reduce(function (n, l) { return n + l.qty; }, 0); }
  function addToBag(id, size) {
    var line = bag.filter(function (l) { return l.id === id && l.size === size; })[0];
    if (line) line.qty += 1; else bag.push({ id: id, size: size, qty: 1 });
    saveBag(); renderBag(); bump();
  }
  function bump() { $$('.bagcount').forEach(function (b) { b.classList.add('bump'); setTimeout(function () { b.classList.remove('bump'); }, 280); }); }
  function renderBag() {
    $$('.bagcount').forEach(function (b) { b.textContent = bagCount(); });
    var list = $('#bag-items'), foot = $('#bag-foot'), empty = $('#bag-empty');
    if (!list) return;
    if (!bag.length) { list.innerHTML = ''; foot.hidden = true; empty.hidden = false; return; }
    empty.hidden = true; foot.hidden = false;
    list.innerHTML = bag.map(function (l, i) {
      var p = byId(l.id);
      return '<li><div class="th" style="--bg:var(--bg-' + p.bg + ')"><img src="' + img(p) + '" alt=""></div>' +
        '<div><div class="nm">' + esc(p.name) + '</div><div class="sz">' + esc(l.size) + '</div>' +
        '<div class="qty"><button type="button" data-q="-1" data-i="' + i + '" aria-label="Remove one ' + esc(p.name) + '">&minus;</button><span>' + l.qty + '</span>' +
        '<button type="button" data-q="1" data-i="' + i + '" aria-label="Add one ' + esc(p.name) + '">+</button></div></div>' +
        '<b>' + money(p.price * l.qty) + '</b></li>';
    }).join('');
    $('#bag-subtotal').textContent = money(bag.reduce(function (n, l) { return n + byId(l.id).price * l.qty; }, 0));
  }
  function openBag(open) {
    $('#bag').classList.toggle('open', open); $('#scrim').classList.toggle('open', open);
    $('#bag').setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) $('#bag .x').focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-q]');
    if (t) { var l = bag[+t.dataset.i]; l.qty += +t.dataset.q; if (l.qty < 1) bag.splice(+t.dataset.i, 1); saveBag(); renderBag(); return; }
    if (e.target.closest('[data-open-bag]')) { openBag(true); return; }
    if (e.target.closest('[data-close-bag]')) { openBag(false); return; }
    var a = e.target.closest('[data-add]');
    if (a) { addToBag(a.dataset.add, a.dataset.size || 'One size'); confetti(a); a.textContent = 'Added'; setTimeout(function () { a.textContent = 'Add to bag'; }, 1400); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openBag(false); });
  var co = $('#bag-checkout');
  if (co) co.addEventListener('click', function () { $('#bag-note').textContent = 'Checkout opens soon. This is a preview of the new shop.'; });

  /* ---------- little bows that pop out of a button ---------- */
  function confetti(el) {
    if (reduced) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 9; i++) {
      var b = document.createElement('img');
      b.src = 'assets/img/' + (i % 3 === 0 ? 'bow-rose.svg' : i % 3 === 1 ? 'bow-blush.svg' : 'flower.svg'); b.alt = ''; b.className = 'confetti';
      var ang = (Math.PI * 2 * i) / 9 + Math.random() * 0.5, dist = 70 + Math.random() * 70;
      b.style.left = (cx - 13) + 'px'; b.style.top = (cy - 10) + 'px';
      b.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); b.style.setProperty('--dy', (Math.sin(ang) * dist - 40) + 'px'); b.style.setProperty('--r', (Math.random() * 240 - 120) + 'deg');
      document.body.appendChild(b); (function (n) { setTimeout(function () { n.remove(); }, 950); })(b);
    }
  }

  /* ---------- product cards ---------- */
  function card(p) {
    var tag = p.tag ? '<span class="tag' + (p.tag === 'Holiday' ? ' holiday' : '') + '">' + esc(p.tag) + '</span>' : '';
    var action = p.type === 'bow'
      ? '<button type="button" class="btn small" data-add="' + p.id + '">Add to bag</button>'
      : '<a class="btn small ghost" href="product.html?id=' + p.id + '">Pick a size</a>';
    return '<li class="card">' + tag + '<a class="frame" href="product.html?id=' + p.id + '" tabindex="-1" aria-hidden="true" style="--bg:var(--bg-' + p.bg + ')">' +
      '<img' + (p.type === 'bow' ? ' class="bow"' : '') + ' src="' + img(p) + '" alt=""></a>' +
      '<div class="info"><h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h3><p class="fabric">' + esc(p.fabric) + '</p>' +
      '<div class="row"><span class="price">' + money(p.price) + '</span>' + action + '</div></div></li>';
  }
  $$('[data-grid]').forEach(function (g) {
    var ids = g.dataset.grid.split(',');
    g.innerHTML = ids.map(byId).filter(Boolean).map(card).join('');
  });

  /* ---------- header menu ---------- */
  var mb = $('.menubtn');
  if (mb) mb.addEventListener('click', function () { var o = $('.nav.left').classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); });

  /* ---------- home: twirl the rail ---------- */
  var tb = $('#twirl');
  if (tb) tb.addEventListener('click', function () {
    $$('.rail a').forEach(function (a, i) {
      setTimeout(function () { a.classList.remove('twirl'); void a.offsetWidth; a.classList.add('twirl'); }, i * 140);
    });
    confetti(tb);
  });

  /* ---------- newsletter (preview only, nothing is sent anywhere) ---------- */
  var nf = $('#news-form');
  if (nf) nf.addEventListener('submit', function (e) { e.preventDefault(); $('#news-msg').textContent = 'Thank you. Sign-ups open when the shop launches.'; nf.reset(); confetti(nf.querySelector('button')); });

  /* ---------- shop page ---------- */
  var shop = $('#shop-grid');
  if (shop) {
    var current = new URLSearchParams(location.search).get('occasion') || 'all';
    var draw = function () {
      var list = P.filter(function (p) { return current === 'all' || (current === 'new' ? p.tag === 'New' : p.occ.indexOf(current) > -1); });
      shop.innerHTML = list.map(card).join('');
      $('#shop-empty').hidden = list.length > 0;
      $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.f === current ? 'true' : 'false'); });
    };
    $$('.chip').forEach(function (c) { c.addEventListener('click', function () { current = c.dataset.f; history.replaceState(null, '', current === 'all' ? 'shop.html' : 'shop.html?occasion=' + current); draw(); }); });
    draw();
  }

  /* ---------- product page ---------- */
  var pv = $('#product');
  if (pv) {
    var p = byId(new URLSearchParams(location.search).get('id')) || P[0];
    var isBow = p.type === 'bow', size = isBow ? 'One size' : null, cls = isBow ? ' class="bow"' : '';
    document.title = p.name + ' | Trendi Tots Boutique';
    $('#crumb-name').textContent = p.name;
    var views = isBow ? [['', 'Front', 'bow']] : [['', 'Front', ''], ['-detail', 'Close up', 'detail'], ['', 'Back', 'back']];
    pv.innerHTML =
      '<div class="gallery" style="--bg:var(--bg-' + p.bg + ')"><div class="main"><img id="main-img"' + cls + ' src="' + img(p) + '" alt="' + esc(p.name + ', ' + p.fabric.toLowerCase()) + '"></div>' +
      (views.length > 1 ? '<div class="thumbs">' + views.map(function (v, i) { return '<button type="button" aria-pressed="' + (i === 0) + '" data-view="' + i + '" aria-label="' + v[1] + ' view"><img class="' + v[2] + '" src="' + img(p, v[0]) + '" alt=""></button>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="pinfo"><h1>' + esc(p.name) + '</h1><p class="price">' + money(p.price) + '</p><p class="lede">' + esc(p.fabric) + '. ' + esc(p.blurb) + '</p>' +
      (isBow ? '' : '<div class="caps">Size</div><div class="sizes">' + p.sizes.map(function (s) { return '<button type="button" aria-pressed="false" data-size="' + s + '">' + s + '</button>'; }).join('') + '</div>') +
      '<div class="buy"><button type="button" class="btn" id="add-btn">Add to bag</button>' + (isBow ? '' : '<button type="button" class="btn ghost" id="spin-btn">Give it a twirl</button>') + '</div>' +
      '<p class="hint" id="add-hint" role="status"></p>' +
      '<details open><summary>The details</summary><ul>' + p.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></details>' +
      '<details><summary>Sizing help</summary><p>Between sizes? Send us her height and weight and we will help you pick. A full size chart will be added here.</p></details>' +
      '<details><summary>Shipping and returns</summary><p>Shipping times and the return policy will be listed here when the shop opens.</p></details></div>';
    $$('.sizes button').forEach(function (b) { b.addEventListener('click', function () { size = b.dataset.size; $$('.sizes button').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); $('#add-hint').textContent = ''; }); });
    $('#add-btn').addEventListener('click', function () {
      if (!size) { $('#add-hint').textContent = 'Pick a size first.'; return; }
      addToBag(p.id, isBow ? size : 'Size ' + size); confetti(this); $('#add-hint').textContent = 'Added to your bag.'; openBag(true);
    });
    var sb = $('#spin-btn');
    if (sb) sb.addEventListener('click', function () { var m = $('#main-img'); m.classList.remove('spin'); void m.offsetWidth; m.classList.add('spin'); });
    $$('.thumbs button').forEach(function (b) { b.addEventListener('click', function () {
      var v = views[+b.dataset.view], m = $('#main-img'); m.className = v[2]; m.src = img(p, v[0]);
      $$('.thumbs button').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    }); });
    var more = $('#more-grid');
    if (more) more.innerHTML = P.filter(function (o) { return o.id !== p.id && o.type === p.type; }).slice(0, 4).map(card).join('');
  }

  renderBag();
})();
