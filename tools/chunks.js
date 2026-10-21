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
    return loadChunk('tb-' + id).then(function (c) { setTimeout(function () { var b = document.getElementById('tbbody'); if (b && b.dataset.ch === id) b.classList.add('zz-g'); }, 0); return c.html; }, function (e) {
      if (!e || (e.status !== 401 && e.status !== 403)) throw e;
      return '<div class="zz-lock zz-locked" role="status"><p>' + why(e, 'tb') + '</p><button type="button" class="zz-b zz-p" onclick="' + (e.status === 401 ? 'zzSignIn()' : '(window.zzUpgrade||zzSignIn)()') + '">' + (e.status === 401 ? 'Sign in' : 'Upgrade') + '</button></div>';
    });
  };
  var BUNDLE = { q: 'the Question bank', mcq: 'the MCQ bank', tb: 'the Textbook bundle' };
  var why = function (e, kind) {
    var b = BUNDLE[kind] || 'a paid bundle';
    return e && e.status === 401 ? 'Sign in to read this. It comes with ' + b + '.' : e && e.status === 403 ? 'This comes with ' + b + '.' : 'Could not load this. Check your connection and try again.';
  };
  function act(e, retry) {  // the one button an error state offers: Sign in, Upgrade or Try again
    var b = document.createElement('button'); b.type = 'button';
    var locked = e && (e.status === 401 || e.status === 403);
    b.className = locked ? 'zz-b zz-p' : 'zz-b';
    var f = e && e.status === 401 ? function () { window.zzSignIn && zzSignIn(); } : e && e.status === 403 ? function () { (window.zzUpgrade || window.zzSignIn || Object)(); } : retry;
    b.textContent = e && e.status === 401 ? 'Sign in' : e && e.status === 403 ? 'Upgrade' : 'Try again';
    b.onclick = function (ev) { ev.stopPropagation(); f(); };
    return b;
  }
  function lockBox(e, kind, retry) {
    var d = document.createElement('div'), p = document.createElement('p');
    d.className = 'zz-lock'; d.setAttribute('role', 'status'); p.textContent = why(e, kind);
    d.append(p, act(e, retry)); return d;
  }
  var mcq = 0;  // 0 idle, 1 loading, 2 loaded, 3 failed: the free chapter stays usable
  window.zzMcqReset = function () { if (mcq === 3) mcq = 0; };
  window.zzMcqLoad = function (Q, done, V, mount) {
    var ids = M ? M.gated.filter(function (x) { return x.indexOf('mcq-') === 0; }).sort() : [];
    if (!ids.length || mcq >= 2) return false;
    if (mcq === 1) return true;
    mcq = 1; V.dataset.zzSt = 'loading';
    var old = V.querySelector(':scope > .zz-banner'); if (old) old.remove();
    Promise.all(ids.map(loadChunk)).then(function (cs) {
      cs.forEach(function (c) { Array.prototype.push.apply(Q, c.q); }); mcq = 2; delete V.dataset.zzSt; done();
    }, function (e) {
      mcq = 3; delete V.dataset.zzSt;
      var p = lockBox(e, 'mcq', function () { p.remove(); mcq = 0; done(); });
      p.classList.add('zz-banner');
      if (e && (e.status === 401 || e.status === 403)) p.firstChild.textContent = 'Chapter 1 is free. ' + why(e, 'mcq').replace('Sign in to read this. It comes', 'Sign in for the rest: they come').replace('This comes', 'The rest come');
      (mount && mount.parentNode ? mount.parentNode : V).insertBefore(p, mount && mount.parentNode ? mount : V.firstChild); done();
    });
    return true;
  };
  if (!M) return;
  function need(root) {
    var ids = {};
    root.querySelectorAll('.ans[data-zz]').forEach(function (a) { ids[a.dataset.zz] = 1; if (a.dataset.zzSt !== 'error') a.dataset.zzSt = 'loading'; });
    Object.keys(ids).forEach(function (id) {
      loadChunk(id).then(function (c) {
        document.querySelectorAll('.ans[data-zz="' + id + '"]').forEach(function (a) {
          var k = a.closest('.card'), h = k && c.cards[k.id];
          if (h != null) { a.innerHTML = h; a.removeAttribute('data-zz'); delete a.dataset.zzSt; a.classList.add('zz-g'); }
        });
        dispatchEvent(new CustomEvent('zz:chunk', { detail: id }));
        document.querySelectorAll('.zz-vlock[data-c="' + id + '"]').forEach(function (x) { x.remove(); });
      }, function (e) {
        if (e && (e.status === 401 || e.status === 403)) {  // one notice above the questions, so the lock is visible before a card is opened
          var first = document.querySelector('.ans[data-zz="' + id + '"]'), v = first && first.closest('.view'), c = v && v.querySelector('.card');
          if (c && !v.querySelector('.zz-vlock[data-c="' + id + '"]')) {
            var box = lockBox(e, 'q'); box.classList.add('zz-vlock'); box.dataset.c = id;
            box.firstChild.textContent = e.status === 401 ? 'The questions are free to browse. Sign in to read the answers: they come with the Question bank.' : 'The questions are free to browse. The answers come with the Question bank.';
            c.parentNode.insertBefore(box, c);
          }
        }
        document.querySelectorAll('.ans[data-zz="' + id + '"]').forEach(function (a) {
          a.dataset.zzSt = 'error'; a.innerHTML = '';
          if (e && (e.status === 401 || e.status === 403)) a.classList.add('zz-locked');
          a.appendChild(lockBox(e, 'q', function () { need(a.closest('.card') || a); }));
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
