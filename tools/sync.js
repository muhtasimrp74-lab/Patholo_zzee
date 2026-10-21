/* First-login migration (Stage 7). Uploads this device's progress (zzStore keys), notes (pathviva-annot/docs) and
   annotations (pathviva-annot/meta) in batches of 20 with stable upload ids, so a retry is idempotent. Local copies are
   replaced by the server's merged copy only after every batch is confirmed. Policy: progress and annotations last write
   wins per key; notes keep both (the cloud copy is renamed and flagged as a conflict copy on the server). */
(function () {
  var API = (window.ZZ_API || '') + 'api/', KEYS = ['vivaQuiz', 'tbLast', 'tbDone', 'tbPos', 'tbSet', 'zz-fs', 'zz-flat'], running = false;
  var LS = window.localStorage, S = window.zzStore || LS;
  var ts = function (r) { var t = r && (r.t || r.ts || r.updated || r.u); return typeof t === 'number' && t > 0 ? Math.floor(t) : Date.now(); };
  function idb(name, store, mode, fn) {
    var have = indexedDB.databases ? indexedDB.databases().then(function (l) { return l.some(function (d) { return d.name === name; }); }) : Promise.resolve(true);
    return have.then(function (ok) {
      if (!ok) return null;
      return new Promise(function (res, rej) {
        var q = indexedDB.open(name);
        q.onerror = function () { rej(q.error); };
        q.onsuccess = function () {
          var db = q.result;
          if (!db.objectStoreNames.contains(store)) { db.close(); return res(null); }
          var tx = db.transaction(store, mode), out = fn(tx.objectStore(store));
          tx.oncomplete = function () { db.close(); res(out && out.result !== undefined ? out.result : out); };
          tx.onerror = function () { db.close(); rej(tx.error); };
        };
      });
    });
  }
  function collect() {
    var items = [], now = Date.now();
    try { var v = JSON.parse(S.getItem('vivaState') || 'null'); if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { items.push({ kind: 'progress', key: 'vivaState/' + k, value: JSON.stringify(v[k]), updated_at: now }); }); } catch (e) {}
    KEYS.forEach(function (k) { var x = S.getItem(k); if (x != null) items.push({ kind: 'progress', key: k, value: x, updated_at: now }); });
    return Promise.all([['docs', 'note'], ['meta', 'annotation']].map(function (p) {
      return idb('pathviva-annot', p[0], 'readonly', function (st) { return st.getAll(); }).then(function (rs) {
        (rs || []).forEach(function (r) { items.push({ kind: p[1], key: p[0] + '/' + r.k, value: JSON.stringify(r), updated_at: ts(r) }); });
      });
    })).then(function () { return items; });
  }
  function call(path, body) {
    return fetch(API + path, { method: body ? 'POST' : 'GET', credentials: 'omit', body: body ? JSON.stringify(body) : undefined,
      headers: Object.assign({ 'Content-Type': 'application/json' }, window.zzAuthHeaders()) }).then(function (r) { if (!r.ok) throw new Error('sync ' + r.status); return r.json(); });
  }
  function apply(items, uploaded) {
    var mine = {}; uploaded.forEach(function (i) { mine[i.key] = 1; });
    var main = items.filter(function (i) { return mine[i.key] && !i.deleted && !i.conflict; });
    var viva = {}, hasViva = false;
    main.forEach(function (i) {
      if (i.key.indexOf('vivaState/') === 0) { viva[i.key.slice(10)] = JSON.parse(i.value); hasViva = true; }
      else if (i.kind === 'progress') { S.removeItem(i.key); S.setItem(i.key, i.value); }
    });
    if (hasViva) { S.removeItem('vivaState'); S.setItem('vivaState', JSON.stringify(viva)); }
    return Promise.all([['docs', 'note'], ['meta', 'annotation']].map(function (p) {
      var recs = main.filter(function (i) { return i.kind === p[1]; }).map(function (i) { return JSON.parse(i.value); });
      return recs.length ? idb('pathviva-annot', p[0], 'readwrite', function (st) { recs.forEach(function (r) { st.delete(r.k); st.put(r); }); }) : null;
    }));
  }
  window.zzMigrate = function () {
    var uid = window.zzAccount && zzAccount.signedIn() && zzAccount.uid();
    if (!uid || running || LS.getItem('zz-migrated:' + uid)) return Promise.resolve(false);
    running = true;
    var base = LS.getItem('zz-mig-id') || ('m-' + uid.slice(0, 20) + '-' + Date.now().toString(36));
    LS.setItem('zz-mig-id', base);
    var items;
    return collect().then(function (all) {
      items = all.sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });
      var chain = Promise.resolve();
      for (var i = 0; i < items.length; i += 20) (function (n) { chain = chain.then(function () { return call('sync/upload', { upload_id: base + '-' + n / 20, items: items.slice(n, n + 20) }); }); })(i);
      return chain;
    }).then(function () { return call('sync'); })
      .then(function (j) { return apply(j.items || [], items); })
      .then(function () { LS.setItem('zz-migrated:' + uid, String(Date.now())); LS.removeItem('zz-mig-id'); running = false; return true; },
        function () { running = false; return false; });  // nothing local was touched; retried on the next sign-in or page load
  };
  addEventListener('zz:auth', function (e) { if (e.detail && e.detail.signedIn) window.zzMigrate(); });
  (window.zzAuthReady || Promise.resolve()).then(function () { window.zzMigrate(); });  // sign-in may finish before this script loads
})();
