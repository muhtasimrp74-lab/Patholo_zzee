/* Account screen (#/account): profile, entitlements, devices (remove), sign out. Device-limit handling at sign-in.
   Watermark: display name + short id, faint, over gated answers and textbook pages while signed in. */
(function () {
  var API = (window.ZZ_API || '') + 'api/', dlg, box;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function show(html) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'zz-acct'; box = document.createElement('div');
      var c = document.createElement('button'); c.type = 'button'; c.textContent = 'Close'; c.onclick = function () { dlg.close(); };
      dlg.append(box, c); document.body.appendChild(dlg);
    }
    box.innerHTML = html; if (!dlg.open) dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  }
  function del(id, token) {
    return fetch(API + 'devices/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'omit', headers: token ? { Authorization: 'Bearer ' + token } : window.zzAuthHeaders() });
  }
  function devList(list, token, after) {
    return '<ul id="zz-devs">' + list.map(function (d) {
      return '<li>' + esc(d.name || 'Device') + ' · last used ' + esc(new Date(d.last_seen_at).toLocaleDateString()) + ' <button type="button" data-d="' + esc(d.device_id) + '">Remove</button></li>';
    }).join('') + '</ul>';
  }
  function wire(token, after) {
    box.querySelectorAll('#zz-devs button[data-d]').forEach(function (b) {
      b.onclick = function () { b.disabled = true; del(b.dataset.d, token).then(function (r) { if (r.ok) after(); else b.disabled = false; }); };
    });
  }
  /** Called by the sign-in code with a 409 device_limit response. */
  window.zzDeviceLimit = function (j, retry) {
    show('<h2>Too many devices</h2><p>Your account can be used on ' + j.max + ' devices. Remove one to sign in here.</p>' + devList(j.devices));
    wire(j.removal_token, function () { show('<p>Removed. Signing in…</p>'); retry(); });
  };
  function account() {
    if (!window.zzAccount || !zzAccount.signedIn()) { if (window.zzSignIn) zzSignIn(); return; }
    show('<h2>Account</h2><p>Loading…</p>');
    Promise.all([zzAccount.me(), fetch(API + 'devices', { credentials: 'omit', headers: window.zzAuthHeaders() }).then(function (r) { return r.json(); })]).then(function (x) {
      var me = x[0] || {}, d = x[1] || {}, u = me.user || {};
      var ents = (me.entitlements || []).map(function (e) { return '<li>' + esc(e.entitlement) + ': ' + (e.expires_at > me.now ? 'until ' : 'expired ') + esc(new Date(e.expires_at).toLocaleDateString()) + '</li>'; }).join('') || '<li>Free sample only</li>';
      show('<h2>Account</h2><p>' + esc(u.display_name) + ' · ' + esc(u.email || u.phone) + '</p><h3>Access</h3><ul>' + ents +
        '</ul><p><button type="button" id="zz-up">Upgrade or renew</button></p><h3>Devices (' + (d.devices || []).length + ' of ' + esc(d.max) + ')</h3>' +
        devList(d.devices || []) + '<p><button type="button" id="zz-out">Sign out</button></p>');
      wire(null, account);
      box.querySelector('#zz-up').onclick = function () { dlg.close(); window.zzUpgrade && zzUpgrade(); };
      box.querySelector('#zz-out').onclick = function () { zzAccount.logout(); };
    });
  }
  window.zzAccountPage = account;
  addEventListener('hashchange', function () { if (location.hash === '#/account') account(); });

  // watermark
  var st = document.createElement('style');
  st.textContent = 'body.zz-wm .ans.zz-g,body.zz-wm #tbbody.zz-g{background-image:var(--zz-wm);background-repeat:repeat}';
  document.head.appendChild(st);
  function mark() {
    var u = window.zzAccount && zzAccount.signedIn() && zzAccount.uid();
    document.body.classList.toggle('zz-wm', !!u);
    if (!u) return;
    var name = (zzAccount.user() && zzAccount.user().display_name) || '';
    var label = (name + ' · ' + u.slice(0, 8)).replace(/[<>&"']/g, '');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160"><text x="10" y="90" transform="rotate(-20 160 80)" font-family="sans-serif" font-size="14" fill="rgba(128,128,128,0.13)">' + label + '</text></svg>';
    document.body.style.setProperty('--zz-wm', 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")');
  }
  function onAuth() {
    if (window.zzAccount && zzAccount.signedIn() && !zzAccount.user()) zzAccount.me().then(function (m) { if (m && m.user) zzAccount.setUser(m.user); mark(); });
    mark();
  }
  addEventListener('zz:auth', onAuth);
  (window.zzAuthReady || Promise.resolve()).then(onAuth);  // sign-in may finish before this script loads
  if (location.hash === '#/account') setTimeout(account, 0);
})();
