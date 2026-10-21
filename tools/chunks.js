/* Gated content loader. window.ZZ_MANIFEST is null in the full build and {free, gated} in the gated build.
   Base URL: window.ZZ_CHUNK_BASE (set before this script) or 'chunks/'. One in-memory cache per page. */
(function () {
  var M = window.ZZ_MANIFEST, cache = {};
  var gated = function (id) { return !!M && M.gated.indexOf(id) >= 0; };
  var CACHE = 'zz-chunks-';  // per-user Cache Storage of opened gated chunks (Stage 6); the service worker never caches /api/
  window.zzWipeChunks = function (keep) {
    if (!window.caches) return Promise.resolve();
    return caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf(CACHE) === 0 && k !== CACHE + keep; }).map(function (k) { return caches.delete(k); })); });
  };
  function loadChunk(id) {
    if (cache[id]) return cache[id];
    var url, name;
    var p = cache[id] = (window.zzAuthReady || Promise.resolve()).then(function () {
      url = (window.ZZ_CHUNK_BASE || (window.ZZ_API || '') + 'api/chunks/') + encodeURIComponent(id) + '.json';
      var u = window.zzAccount && window.zzAccount.uid(); name = gated(id) && u && window.caches ? CACHE + u : null;
      return fetch(url, { headers: (window.zzAuthHeaders && window.zzAuthHeaders()) || {}, credentials: 'omit', cache: 'no-store' }).then(function (r) {
        if (!r.ok) { var e = new Error('chunk ' + r.status); e.status = r.status; if (r.status === 403 && name) caches.delete(name); throw e; }
        if (name) { var c = r.clone(); caches.open(name).then(function (k) { return k.put(url, c); }).catch(function () {}); }
        return r.json();
      }, function (err) {  // offline: only this user's own copy of a chunk they opened before
        if (!name) throw err;
        return caches.open(name).then(function (k) { return k.match(url); }).then(function (m) { if (!m) throw err; return m.json(); });
      });
    });
    p.catch(function () { delete cache[id]; });
    return p;
  }
  window.loadChunk = loadChunk;
  window.zzChapter = function (id) {
    if (!gated('tb-' + id)) return fetch('textbook/' + id + '.html').then(function (r) { if (!r.ok) throw 0; return r.text(); });
    return loadChunk('tb-' + id).then(function (c) { return c.html; }, function (e) {
      if (!e || (e.status !== 401 && e.status !== 403)) throw e;
      return '<div class="mempty zz-locked"><b>' + why(e) + '</b><button type="button" onclick="' + (e.status === 401 ? 'zzSignIn()' : '(window.zzUpgrade||zzSignIn)()') + '">' + (e.status === 401 ? 'Sign in' : 'Upgrade') + '</button></div>';
    });
  };
  var why = function (e) { return e && e.status === 401 ? 'Sign in to open this topic.' : e && e.status === 403 ? 'This topic is part of a paid bundle.' : 'Could not load this topic. Check your connection.'; };
  function act(e, retry) {  // the one button an error state offers: Sign in, Upgrade or Retry
    var b = document.createElement('button'); b.type = 'button';
    var f = e && e.status === 401 ? function () { window.zzSignIn && zzSignIn(); } : e && e.status === 403 ? function () { (window.zzUpgrade || window.zzSignIn || Object)(); } : retry;
    b.textContent = e && e.status === 401 ? 'Sign in' : e && e.status === 403 ? 'Upgrade' : 'Retry';
    b.onclick = function (ev) { ev.stopPropagation(); f(); };
    return b;
  }
  var mcq = 0;  // 0 idle, 1 loading, 2 loaded, 3 failed: the free chapter stays usable
  window.zzMcqReset = function () { if (mcq === 3) mcq = 0; };
  window.zzMcqLoad = function (Q, done, V) {
    var ids = M ? M.gated.filter(function (x) { return x.indexOf('mcq-') === 0; }).sort() : [];
    if (!ids.length || mcq >= 2) return false;
    if (mcq === 1) return true;
    mcq = 1; V.dataset.zzSt = 'loading';
    var old = V.querySelector(':scope > .zz-banner'); if (old) old.remove();
    Promise.all(ids.map(loadChunk)).then(function (cs) {
      cs.forEach(function (c) { Array.prototype.push.apply(Q, c.q); }); mcq = 2; delete V.dataset.zzSt; done();
    }, function (e) {
      mcq = 3; delete V.dataset.zzSt;
      var p = document.createElement('p'); p.className = 'zz-msg zz-banner'; p.setAttribute('role', 'status');
      p.textContent = (e && (e.status === 401 || e.status === 403) ? 'Only the free chapter is open. ' : 'Could not load all chapters. ') + ' ';
      p.appendChild(act(e, function () { p.remove(); mcq = 0; done(); })); V.insertBefore(p, V.firstChild); done();
    });
    return true;
  };
  if (!M) return;
  var st = document.createElement('style');
  st.textContent = '.ans[data-zz-st=loading]::before{content:"Loading\u2026";opacity:.7}.view[data-zz-st=loading]::before{content:"Loading questions\u2026";display:block;padding:1em}.view[data-zz-st=error]::before{content:attr(data-zz-msg);display:block;padding:1em}';
  document.head.appendChild(st);
  function need(root) {
    var ids = {};
    root.querySelectorAll('.ans[data-zz]').forEach(function (a) { ids[a.dataset.zz] = 1; if (a.dataset.zzSt !== 'error') a.dataset.zzSt = 'loading'; });
    Object.keys(ids).forEach(function (id) {
      loadChunk(id).then(function (c) {
        document.querySelectorAll('.ans[data-zz="' + id + '"]').forEach(function (a) {
          var k = a.closest('.card'), h = k && c.cards[k.id];
          if (h != null) { a.innerHTML = h; a.removeAttribute('data-zz'); delete a.dataset.zzSt; }
        });
        dispatchEvent(new CustomEvent('zz:chunk', { detail: id }));
      }, function (e) {
        document.querySelectorAll('.ans[data-zz="' + id + '"]').forEach(function (a) {
          a.dataset.zzSt = 'error'; a.innerHTML = '';
          var p = document.createElement('p');
          p.className = 'zz-msg'; p.setAttribute('role', 'alert'); p.textContent = why(e) + ' ';
          if (e && (e.status === 401 || e.status === 403)) a.classList.add('zz-locked');
          p.appendChild(act(e, function () { need(a.closest('.card') || a); })); a.appendChild(p);
        });
      });
    });
  }
  window.zzNeed = need;
  function onRoute() { document.querySelectorAll('.view:not([hidden])').forEach(need); }
  addEventListener('hashchange', function () { setTimeout(onRoute, 0); });
  addEventListener('zz:auth', function () {
    cache = {}; window.zzMcqReset();
    document.querySelectorAll('.ans.zz-locked').forEach(function (a) { a.classList.remove('zz-locked'); });
    if (/^#\/(textbook|mcqs)/.test(location.hash)) dispatchEvent(new HashChangeEvent('hashchange')); else onRoute();
  });
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.card');
    if (c && c.querySelector('.ans[data-zz]:not([data-zz-st=loading])')) need(c);
  }, true);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', onRoute); else onRoute();
})();
