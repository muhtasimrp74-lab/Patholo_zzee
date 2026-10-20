/* Gated content loader. window.ZZ_MANIFEST is null in the full build and {free, gated} in the gated build.
   Base URL: window.ZZ_CHUNK_BASE (set before this script) or 'chunks/'. One in-memory cache per page. */
(function () {
  var M = window.ZZ_MANIFEST, cache = {};
  var gated = function (id) { return !!M && M.gated.indexOf(id) >= 0; };
  function loadChunk(id) {
    if (cache[id]) return cache[id];
    var h = (window.zzAuthHeaders && window.zzAuthHeaders()) || {};
    var p = cache[id] = fetch((window.ZZ_CHUNK_BASE || 'chunks/') + encodeURIComponent(id) + '.json', { headers: h, credentials: 'omit', cache: 'no-store' })
      .then(function (r) { if (!r.ok) { var e = new Error('chunk ' + r.status); e.status = r.status; throw e; } return r.json(); });
    p.catch(function () { delete cache[id]; });
    return p;
  }
  window.loadChunk = loadChunk;
  window.zzChapter = function (id) {
    if (!gated('tb-' + id)) return fetch('textbook/' + id + '.html').then(function (r) { if (!r.ok) throw 0; return r.text(); });
    return loadChunk('tb-' + id).then(function (c) { return c.html; });
  };
  var why = function (e) { return e && (e.status === 401 || e.status === 403) ? 'This topic is locked.' : 'Could not load this topic. Check your connection.'; };
  var mcq = 0;
  window.zzMcqLoad = function (Q, done, V) {
    var ids = M ? M.gated.filter(function (x) { return x.indexOf('mcq-') === 0; }).sort() : [];
    if (!ids.length || mcq === 2) return false;
    if (mcq === 1) return true;
    mcq = 1; V.dataset.zzSt = 'loading';
    Promise.all(ids.map(loadChunk)).then(function (cs) {
      cs.forEach(function (c) { Array.prototype.push.apply(Q, c.q); }); mcq = 2; delete V.dataset.zzSt; done();
    }, function (e) {
      mcq = 0; V.dataset.zzSt = 'error'; V.dataset.zzMsg = why(e);
      var b = V.querySelector('.zz-retry') || V.appendChild(document.createElement('button'));
      b.type = 'button'; b.className = 'zz-retry'; b.textContent = 'Retry'; b.onclick = function () { b.remove(); done(); };
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
          var p = document.createElement('p'), b = document.createElement('button');
          p.className = 'zz-msg'; p.setAttribute('role', 'alert'); p.textContent = why(e) + ' ';
          b.type = 'button'; b.textContent = 'Retry'; b.onclick = function (ev) { ev.stopPropagation(); need(a.closest('.card') || a); };
          p.appendChild(b); a.appendChild(p);
        });
      });
    });
  }
  window.zzNeed = need;
  function onRoute() { document.querySelectorAll('.view:not([hidden])').forEach(need); }
  addEventListener('hashchange', function () { setTimeout(onRoute, 0); });
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.card');
    if (c && c.querySelector('.ans[data-zz]:not([data-zz-st=loading])')) need(c);
  }, true);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', onRoute); else onRoute();
})();
