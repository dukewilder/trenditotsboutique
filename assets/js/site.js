/* Trendi Tots Boutique site.
   Listings come from one of two places:
   1. Shopify, when assets/js/config.js has the store filled in. Products, photos, prices, sizes and stock
      are read from Shopify on every visit, and Checkout hands the bag to Shopify's checkout.
   2. The sample listings in products.js, while config.js is empty.
   SHOPIFY.md in the repo explains the mapping. */
(function () {
  'use strict';
  var CFG = window.TT_SHOPIFY || {};
  var LIVE = !!(CFG.domain || CFG.endpoint);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$' + (n % 1 ? n.toFixed(2) : n); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage can be unavailable; the site still works for this visit */ } return null; };

  /* ---------- Shopify ---------- */
  function gql(query, variables) {
    var url = CFG.endpoint || ('https://' + CFG.domain + '/api/' + (CFG.apiVersion || '2026-10') + '/graphql.json');
    var head = { 'Content-Type': 'application/json' };
    if (CFG.token) head['X-Shopify-Storefront-Access-Token'] = CFG.token;
    return fetch(url, { method: 'POST', headers: head, body: JSON.stringify({ query: query, variables: variables || {} }) })
      .then(function (r) { if (!r.ok) throw new Error('Shopify answered ' + r.status); return r.json(); })
      .then(function (j) { if (j.errors && j.errors.length) throw new Error(j.errors[0].message); return j.data; });
  }
  /* Tags need the public token. Without one the listings still load and the occasion filters stay empty. */
  var TAGS = (CFG.token || CFG.endpoint) ? 'tags ' : '';
  var PRODUCTS = 'query ($after: String) { products(first: 60, after: $after, sortKey: CREATED_AT, reverse: true) { pageInfo { hasNextPage endCursor } nodes { ' +
    'handle title descriptionHtml productType ' + TAGS + 'createdAt availableForSale ' +
    'priceRange { minVariantPrice { amount } } compareAtPriceRange { minVariantPrice { amount } } ' +
    'collections(first: 20) { nodes { title } } images(first: 6) { nodes { url altText } } variants(first: 20) { nodes { id title availableForSale } } } } }';
  /* collection key -> the Shopify tags that put a product in it (capital letters do not matter) */
  var COLL = {
    valentines: ["valentine's", "valentine's day", 'valentines', 'valentines day'], 'mardi-gras': ['mardi gras'],
    'st-patricks': ["st patrick's day", "st. patrick's day", "st patrick's", 'st patricks day', 'st patricks'], easter: ['easter'],
    'mothers-day': ["mother's day", 'mothers day'], 'memorial-day': ['memorial day'], 'fathers-day': ["father's day", 'fathers day'],
    fourth: ['fourth of july', '4th of july', 'july 4th', 'july fourth'], halloween: ['halloween'], thanksgiving: ['thanksgiving'], christmas: ['christmas'],
    birthday: ['birthday', 'birthdays'], portraits: ['picture day', 'portraits'], everyday: ['every day sweet', 'everyday sweet', 'every day', 'everyday']
  };
  var SIZES = ['12M', '18M', '2T', '3T', '4T', '5T'];
  var BGS = ['petal', 'cream', 'sky', 'butter', 'mint', 'lav'];
  function fromShopify(n) {
    /* a product joins a collection two ways: by being added to the Shopify collection of that name, or by carrying that name as a tag */
    var tags = (n.tags || []).concat(((n.collections || {}).nodes || []).map(function (c) { return c.title; })).map(function (t) { return t.toLowerCase().replace(/\u2019/g, "'").trim(); });
    var has = function () { for (var i = 0; i < arguments.length; i++) if (tags.indexOf(arguments[i]) > -1) return true; return false; };
    /* the kind of product comes from its Product type, or failing that from its name: "... Brother Outfit", "... Bow" */
    var kind = (n.productType || '') + ' ' + n.title;
    var type = /\b(brother|boys?)\b/i.test(kind) ? 'brother' : /\bbows?\b/i.test(kind) ? 'bow' : 'dress';
    var occ = Object.keys(COLL).filter(function (k) { return has.apply(null, COLL[k]); });
    if (type !== 'dress') occ.push(type === 'bow' ? 'bows' : 'brother');
    /* description: the first short sentence is the line under the name, bullets are the details, the rest is the blurb */
    var doc = new DOMParser().parseFromString(n.descriptionHtml || '', 'text/html');
    var details = $$('li', doc).map(function (li) { return li.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    $$('ul, ol', doc).forEach(function (l) { l.remove(); });
    var text = doc.body.textContent.replace(/\s+/g, ' ').trim();
    var m = text.match(/^(.{1,90}?[.!?])(?:\s+|$)([\s\S]*)$/);
    var line = m ? m[1].replace(/\.$/, '') : (text.length <= 90 ? text : '');
    var blurb = m ? m[2] : (text.length > 90 ? text : '');
    var vs = n.variants.nodes, single = vs.length === 1 && /^default/i.test(vs[0].title), variants = {};
    /* A dress or brother outfit saved without sizes still gets the usual size buttons. The size picked rides along to Shopify as a note on the order line. */
    var noted = single && type !== 'bow';
    if (noted) SIZES.forEach(function (z) { variants[z] = { id: vs[0].id, ok: vs[0].availableForSale }; });
    else vs.forEach(function (v) { variants[single ? 'One size' : v.title] = { id: v.id, ok: v.availableForSale }; });
    var price = parseFloat(n.priceRange.minVariantPrice.amount) || 0, was = parseFloat(n.compareAtPriceRange.minVariantPrice.amount) || 0;
    var hash = 0; for (var i = 0; i < n.handle.length; i++) hash = (hash * 31 + n.handle.charCodeAt(i)) % 997;
    var soldOut = !n.availableForSale;
    var isNew = has('new') || (Date.now() - new Date(n.createdAt).getTime()) < 30 * 864e5;
    return {
      id: n.handle, name: n.title, fabric: line, blurb: blurb, details: details, price: price, was: was > price ? was : 0,
      tag: soldOut ? 'Sold out' : isNew ? 'New' : has('holiday') ? 'Holiday' : has('best loved', 'best seller', 'bestseller') ? 'Best loved' : '',
      isNew: isNew, soldOut: soldOut, occ: occ, type: type, bg: BGS[hash % BGS.length],
      sizes: noted ? SIZES : single ? [] : vs.map(function (v) { return v.title; }), variants: variants, noted: noted,
      photos: n.images.nodes.map(function (im) { return im.url; }), alts: n.images.nodes.map(function (im) { return im.altText || ''; })
    };
  }
  function loadShopify() {
    try { var c = JSON.parse(sessionStorage.getItem('tt-products') || 'null'); if (c && Date.now() - c.t < 60000) return Promise.resolve(c.list); } catch (e) { /* no cache, fetch fresh */ }
    var all = [];
    var next = function (after, pages) {
      return gql(PRODUCTS, { after: after }).then(function (d) {
        all = all.concat(d.products.nodes.filter(function (n) { return !/copy me/i.test(n.title); }).map(fromShopify));
        if (d.products.pageInfo.hasNextPage && pages < 5) return next(d.products.pageInfo.endCursor, pages + 1);
        try { sessionStorage.setItem('tt-products', JSON.stringify({ t: Date.now(), list: all })); } catch (e) { /* fine without the cache */ }
        return all;
      });
    };
    return next(null, 1);
  }

  function start(P) {
    var byId = function (id) { return P.filter(function (p) { return p.id === id; })[0]; };
    var oneSize = function (p) { return !p.sizes.length; };
    /* A brother outfit belongs to the dress it names. Samples say so with "match". With Shopify, the outfit's title starts with the dress title:
       "The Rosalie Brother Outfit" pairs with "The Rosalie". */
    var dresses = P.filter(function (p) { return p.type === 'dress'; });
    P.forEach(function (b) {
      if (b.type !== 'brother') return;
      var d = b.match ? byId(b.match) : dresses.filter(function (x) { return b.name.toLowerCase().indexOf(x.name.toLowerCase()) === 0; }).sort(function (x, y) { return y.name.length - x.name.length; })[0];
      b.match = d ? d.id : null; if (d) d.bro = b.id;
    });
    /* picture for a product: a Shopify photo when there is one, the illustrated sample otherwise */
    var pic = function (p, i, w) {
      if (p.photos) { var u = p.photos[i || 0] || p.photos[0]; return u ? u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=' + (w || 800) : 'assets/img/bow-blush.svg'; }
      return 'assets/img/products/' + p.id + (i === 1 && p.type === 'dress' ? '-detail' : '') + '.svg';
    };
    var cls = function (p) { return p.photos && p.photos.length ? 'photo' : (p.type === 'bow' ? 'bow' : ''); };
    var priceHtml = function (p) { return (p.was ? '<s>' + money(p.was) + '</s> ' : '') + money(p.price); };
    if (LIVE) document.body.classList.add('live');

    /* ---------- bag ---------- */
    var BAGKEY = LIVE ? 'tt-bag-live' : 'tt-bag';
    var bag = [];
    try { bag = JSON.parse(store(BAGKEY) || '[]') || []; } catch (e) { bag = []; }
    bag = bag.filter(function (l) { return byId(l.id); });
    function saveBag() { store(BAGKEY, JSON.stringify(bag)); }
    function bagCount() { return bag.reduce(function (n, l) { return n + l.qty; }, 0); }
    function addToBag(id, size, variant, note) {
      var line = bag.filter(function (l) { return l.id === id && l.size === size; })[0];
      if (line) line.qty += 1; else bag.push({ id: id, size: size, qty: 1, v: variant || '', a: note || '' });
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
        return '<li><div class="th" style="--bg:var(--bg-' + p.bg + ')"><img class="' + cls(p) + '" src="' + pic(p, 0, 200) + '" alt=""></div>' +
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
      if (a) {
        var ap = byId(a.dataset.add), av = ap && ap.variants ? ap.variants['One size'] : null;
        if (!ap) return;
        addToBag(ap.id, 'One size', av ? av.id : ''); confetti(a); a.textContent = 'Added'; setTimeout(function () { a.textContent = 'Add to bag'; }, 1400);
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openBag(false); });

    /* ---------- checkout ---------- */
    var co = $('#bag-checkout'), note = $('#bag-note');
    if (co) co.addEventListener('click', function () {
      if (!LIVE) { note.textContent = 'Checkout opens soon. This is a preview of the new shop.'; return; }
      var lines = bag.filter(function (l) { return l.v; }).map(function (l) { var o = { merchandiseId: l.v, quantity: l.qty }; if (l.a) o.attributes = [{ key: 'Size', value: l.a }]; return o; });
      if (!lines.length) return;
      co.disabled = true; note.textContent = 'Taking you to checkout.';
      gql('mutation ($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) { cart { id checkoutUrl } userErrors { message } } }', { lines: lines })
        .then(function (d) {
          var c = d.cartCreate.cart;
          if (!c || !c.checkoutUrl) throw new Error((d.cartCreate.userErrors[0] || {}).message || 'No checkout address came back');
          store('tt-cart', c.id); location.href = c.checkoutUrl;
        })
        .catch(function () {
          /* second route: Shopify's plain cart link, which needs no request first */
          if (CFG.domain) { location.href = 'https://' + CFG.domain + '/cart/' + lines.map(function (l) { return l.merchandiseId.split('/').pop() + ':' + l.quantity; }).join(','); return; }
          co.disabled = false; note.textContent = 'Checkout did not open. Please try again in a moment.';
        });
    });
    /* A cart that has been paid for no longer exists at Shopify. When that happens, empty the bag here too. */
    if (LIVE && store('tt-cart')) {
      gql('query ($id: ID!) { cart(id: $id) { id } }', { id: store('tt-cart') }).then(function (d) {
        if (!d.cart) { bag = []; saveBag(); store('tt-cart', null); renderBag(); }
      }).catch(function () { /* leave the bag alone if Shopify cannot be reached */ });
    }

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
      var tag = p.tag ? '<span class="tag' + (p.tag === 'Holiday' ? ' holiday' : p.tag === 'Sold out' ? ' sold' : '') + '">' + esc(p.tag) + '</span>' : '';
      var link = 'product?id=' + encodeURIComponent(p.id);
      var action = p.soldOut ? '<a class="btn small ghost" href="' + link + '">See it</a>'
        : oneSize(p) ? '<button type="button" class="btn small" data-add="' + esc(p.id) + '">Add to bag</button>'
        : '<a class="btn small ghost" href="' + link + '">Pick a size</a>';
      return '<li class="card">' + tag + '<a class="frame" href="' + link + '" tabindex="-1" aria-hidden="true" style="--bg:var(--bg-' + p.bg + ')">' +
        '<img class="' + cls(p) + '" src="' + pic(p, 0, 700) + '" alt=""' + (p.photos ? ' loading="lazy"' : '') + '></a>' +
        '<div class="info"><h3><a href="' + link + '">' + esc(p.name) + '</a></h3>' + (p.fabric ? '<p class="fabric">' + esc(p.fabric) + '</p>' : '') + (p.bro ? '<p class="bromatch">Brother outfit to match</p>' : '') +
        '<div class="row"><span class="price">' + priceHtml(p) + '</span>' + action + '</div></div></li>';
    }
    var sorry = '<li class="loadnote">The dresses are taking a moment to load. Please refresh the page.</li>';
    $$('[data-grid]').forEach(function (g) {
      /* sample mode lists the dresses by name; with Shopify the grid is the eight newest dresses */
      var list = LIVE ? dresses.slice(0, 8) : g.dataset.grid.split(',').map(byId).filter(Boolean);
      g.innerHTML = list.length ? list.map(card).join('') : (LIVE ? sorry : '');
    });
    if (LIVE) {
      /* the illustrated rail stays as decoration and leads to the shop */
      $$('.rail a').forEach(function (a) { a.href = 'shop'; });
      /* the bows band shows the real bows, or steps aside when there are none */
      var row = $('.bowrow');
      if (row) {
        var bows = P.filter(function (p) { return p.type === 'bow' && !p.soldOut; }).slice(0, 4);
        if (!bows.length) { var sec = row.closest('section'); if (sec) sec.hidden = true; }
        else row.innerHTML = bows.map(function (p) {
          return '<li><a class="bowlink" href="product?id=' + encodeURIComponent(p.id) + '"><span class="medal cream"><img class="' + cls(p) + '" src="' + pic(p, 0, 300) + '" alt=""></span><b>' + esc(p.name) + '</b><span>' + money(p.price) + '</span></a>' +
            (oneSize(p) ? '<button type="button" class="btn small light" data-add="' + esc(p.id) + '">Add to bag</button>' : '<a class="btn small light" href="product?id=' + encodeURIComponent(p.id) + '">Pick a size</a>') + '</li>';
        }).join('');
      }
    }

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

    /* ---------- newsletter (nothing is sent anywhere yet) ---------- */
    var nf = $('#news-form');
    if (nf) nf.addEventListener('submit', function (e) { e.preventDefault(); $('#news-msg').textContent = 'Thank you. Sign-ups open when the shop launches.'; nf.reset(); confetti(nf.querySelector('button')); });

    /* ---------- shop page ---------- */
    var shop = $('#shop-grid');
    if (shop) {
      var q = new URLSearchParams(location.search), current = q.get('collection') || q.get('occasion') || 'all';
      /* brother outfits live under their own chip and on the dress pages, so the other lists stay one card per dress */
      var show = function (p) { return current === 'all' ? p.type !== 'brother' : current === 'new' ? (p.isNew && p.type !== 'brother') : p.occ.indexOf(current) > -1; };
      var draw = function () {
        if (LIVE && !P.length) { shop.innerHTML = sorry; return; }
        var list = P.filter(show);
        shop.innerHTML = list.map(card).join('');
        $('#shop-empty').hidden = list.length > 0;
        $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.f === current ? 'true' : 'false'); });
        var on = $('.chip[aria-pressed="true"]'); if (on && on.scrollIntoView && window.innerWidth < 601) on.scrollIntoView({ block: 'nearest', inline: 'center' });
      };
      $$('.chip').forEach(function (c) { c.addEventListener('click', function () { current = c.dataset.f; history.replaceState(null, '', current === 'all' ? 'shop' : 'shop?collection=' + current); draw(); }); });
      draw();
    }

    /* ---------- product page ---------- */
    var pv = $('#product');
    if (pv && !P.length) pv.innerHTML = '<p class="loadnote">This dress is taking a moment to load. Please refresh the page.</p>';
    if (pv && P.length) {
      var p = byId(new URLSearchParams(location.search).get('id')) || P[0];
      var one = oneSize(p), size = one ? 'One size' : null, pc = cls(p), photo = pc === 'photo';
      var okSize = function (s) { return !p.variants || !p.variants[s] || p.variants[s].ok; };
      document.title = p.name + ' | Trendi Tots Boutique';
      $('#crumb-name').textContent = p.name;
      /* each view is [picture index, label, class]. Shopify products show their photos; samples show front, close up and back. */
      var views = photo ? p.photos.map(function (u, i) { return [i, 'Photo ' + (i + 1), 'photo']; })
        : p.type === 'bow' ? [[0, 'Front', 'bow']] : p.type === 'brother' ? [[0, 'Front', '']] : [[0, 'Front', ''], [1, 'Close up', 'detail'], [0, 'Back', 'back']];
      var alt = (photo && p.alts[0]) || (p.name + (p.fabric ? ', ' + p.fabric.toLowerCase() : ''));
      var made = p.type === 'bow' ? '' : '<p class="made"><img src="assets/img/step-sew.svg" alt="">' + (p.type === 'brother' ? 'Each outfit is custom made. Three weeks to ship.' : 'Each dress is custom made. Three weeks to ship.') + '</p>';
      /* the other half of a sister and brother pair */
      var mate = p.bro ? byId(p.bro) : (p.type === 'brother' && p.match ? byId(p.match) : null), mlink = mate ? 'product?id=' + encodeURIComponent(mate.id) : '', matchHtml = '';
      if (mate && !(p.type === 'dress' && mate.soldOut)) {
        var mimg = '<a class="mimg" href="' + mlink + '" tabindex="-1" aria-hidden="true" style="--bg:var(--bg-' + mate.bg + ')"><img class="' + cls(mate) + '" src="' + pic(mate, 0, 300) + '" alt=""></a>';
        matchHtml = p.type === 'dress'
          ? '<div class="match">' + mimg + '<div><div class="caps">Matching brother outfit</div><a class="mname" href="' + mlink + '">' + esc(mate.name) + '</a> <span class="mprice">' + priceHtml(mate) + '</span>' +
            '<div class="mrow">' + (oneSize(mate) ? '' : '<label class="skip" for="bro-size">His size</label><select id="bro-size"><option value="">His size</option>' + mate.sizes.map(function (z) { return '<option' + (!mate.variants || !mate.variants[z] || mate.variants[z].ok ? '' : ' disabled') + '>' + esc(z) + '</option>'; }).join('') + '</select>') +
            '<button type="button" class="btn small" id="bro-add">Add his outfit</button></div><p class="hint" id="bro-hint" role="status"></p></div></div>'
          : '<div class="match">' + mimg + '<div><div class="caps">Made to match</div><a class="mname" href="' + mlink + '">' + esc(mate.name) + '</a> <span class="mprice">' + priceHtml(mate) + '</span><div class="mrow"><a class="btn small ghost" href="' + mlink + '">See her dress</a></div></div></div>';
      }
      pv.innerHTML =
        '<div class="gallery" style="--bg:var(--bg-' + p.bg + ')"><div class="main"><img id="main-img" class="' + pc + '" src="' + pic(p, 0, 1200) + '" alt="' + esc(alt) + '"></div>' +
        (views.length > 1 ? '<div class="thumbs">' + views.map(function (v, i) { return '<button type="button" aria-pressed="' + (i === 0) + '" data-view="' + i + '" aria-label="' + v[1] + '"><img class="' + v[2] + '" src="' + pic(p, v[0], 200) + '" alt=""></button>'; }).join('') + '</div>' : '') + '</div>' +
        '<div class="pinfo"><h1>' + esc(p.name) + '</h1>' + (p.fabric ? '<p class="fabricline">' + esc(p.fabric) + '</p>' : '') + '<p class="price">' + priceHtml(p) + '</p>' + (p.blurb ? '<p class="lede">' + esc(p.blurb) + '</p>' : '') +
        (one ? '' : '<div class="caps">Size</div><div class="sizes">' + p.sizes.map(function (s) { return '<button type="button" aria-pressed="false" data-size="' + esc(s) + '"' + (okSize(s) ? '' : ' disabled title="Sold out"') + '>' + esc(s) + '</button>'; }).join('') + '</div>') +
        '<div class="buy"><button type="button" class="btn" id="add-btn"' + (p.soldOut ? ' disabled' : '') + '>' + (p.soldOut ? 'Sold out' : 'Add to bag') + '</button>' + (photo || p.type !== 'dress' ? '' : '<button type="button" class="btn ghost" id="spin-btn">Give it a twirl</button>') + '</div>' +
        '<p class="hint" id="add-hint" role="status"></p>' + made + matchHtml +
        (p.details.length ? '<details open><summary>The details</summary><ul>' + p.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></details>' : '') +
        '<details><summary>Sizing help</summary><p>Between sizes? Send us her height and weight and we will help you pick. A full size chart will be added here.</p></details>' +
        '<details><summary>Shipping and returns</summary><p>' + (p.type === 'bow' ? 'Shipping times' : 'Each dress is custom made. Please allow three weeks for it to ship. The return policy') + ' will be listed here when the shop opens.</p></details></div>';
      $$('.sizes button').forEach(function (b) { b.addEventListener('click', function () { size = b.dataset.size; $$('.sizes button').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); $('#add-hint').textContent = ''; }); });
      $('#add-btn').addEventListener('click', function () {
        if (!size) { $('#add-hint').textContent = 'Pick a size first.'; return; }
        var v = p.variants && p.variants[size];
        addToBag(p.id, one ? size : 'Size ' + size, v ? v.id : '', p.noted ? size : ''); confetti(this); $('#add-hint').textContent = 'Added to your bag.'; openBag(true);
      });
      var ba = $('#bro-add');
      if (ba) ba.addEventListener('click', function () {
        var sel = $('#bro-size'), z = sel ? sel.value : 'One size', hint = $('#bro-hint');
        if (!z) { hint.textContent = 'Pick his size first.'; sel.focus(); return; }
        var v = mate.variants && mate.variants[z];
        addToBag(mate.id, sel ? 'Size ' + z : z, v ? v.id : '', mate.noted && sel ? z : ''); confetti(ba); hint.textContent = 'His outfit is in your bag.'; openBag(true);
      });
      var sb = $('#spin-btn');
      if (sb) sb.addEventListener('click', function () { var m = $('#main-img'); m.classList.remove('spin'); void m.offsetWidth; m.classList.add('spin'); });
      $$('.thumbs button').forEach(function (b) { b.addEventListener('click', function () {
        var v = views[+b.dataset.view], m = $('#main-img'); m.className = v[2]; m.src = pic(p, v[0], 1200);
        $$('.thumbs button').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      }); });
      var more = $('#more-grid');
      if (more) {
        var same = P.filter(function (o) { return o.id !== p.id && o.type === p.type; }), rest = P.filter(function (o) { return o.id !== p.id && o.type !== p.type && o.type !== 'brother'; });
        more.innerHTML = same.concat(rest).slice(0, 4).map(card).join('');
      }
    }

    renderBag();
  }

  function useSamples() {
    var sample = window.TT_PRODUCTS || [];
    sample.forEach(function (p) { p.isNew = p.tag === 'New'; });
    start(sample);
  }
  if (!LIVE) useSamples();
  else {
    loadShopify().then(function (list) {
      /* A connected store with nothing in it yet: keep showing the sample dresses. The first product saved in Shopify replaces them. */
      if (!list.length) { LIVE = false; useSamples(); } else start(list);
    }, function () { start([]); });
  }
})();
