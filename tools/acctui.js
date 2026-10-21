/* Account screen (#/account): profile, entitlements, devices (remove), sign out. Device-limit handling at sign-in.
   Watermark: display name + short id, faint, over gated answers and textbook pages while signed in. */
(function () {
  var API = (window.ZZ_API || '') + 'api/', dlg, box;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function show(html) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'zz-acct'; dlg.className = 'zz-dlg'; dlg.setAttribute('aria-labelledby', 'zz-acct-h'); box = document.createElement('div');
      var c = document.createElement('button'); c.type = 'button'; c.className = 'zz-x'; c.setAttribute('aria-label', 'Close'); c.innerHTML = '<svg class="zz-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'; c.onclick = function () { dlg.close(); };
      dlg.append(c, box); document.body.appendChild(dlg);
    }
    box.innerHTML = html; if (!dlg.open) dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); var h = box.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus(); }
  }
  function del(id, token) {
    return fetch(API + 'devices/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'omit', headers: token ? { Authorization: 'Bearer ' + token } : window.zzAuthHeaders() });
  }
  var NAMES = { qna: 'Question bank', mcq: 'MCQ bank', textbook: 'Textbook' };
  var PLAN = { QNA: 'Question bank', MCQ: 'MCQ bank', TEXTBOOK: 'Textbook', ALL: 'Everything' };
  var day = function (t) { return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  function devList(list, current) {
    return '<ul id="zz-devs" class="zz-devs">' + list.map(function (d) {
      var me = d.device_id === current;
      return '<li><span>' + esc(d.name || 'Device') + (me ? ' (this device)' : '') + '<small>Last used ' + esc(day(d.last_seen_at)) + '</small></span>' +
        (me ? '' : '<button type="button" class="zz-b" data-d="' + esc(d.device_id) + '">Remove</button>') + '</li>';
    }).join('') + '</ul>';
  }
  function wire(root, token, after) {
    root.querySelectorAll('#zz-devs button[data-d]').forEach(function (b) {
      b.onclick = function () { b.disabled = true; b.textContent = 'Removing\u2026'; del(b.dataset.d, token).then(function (r) { if (r.ok) after(); else { b.disabled = false; b.textContent = 'Remove'; } }); };
    });
  }
  /** Called by the sign-in code with a 409 device_limit response. */
  window.zzDeviceLimit = function (j, retry) {
    show('<h2 id="zz-acct-h">Too many devices</h2><p>Your account is already used on ' + esc(j.max) + ' devices. Remove one to sign in here.</p>' + devList(j.devices, null));
    box.querySelector('ul').classList.add('zz-acct');
    wire(box, j.removal_token, function () { box.innerHTML = '<p class="zz-st" role="status">Device removed. Signing you in\u2026</p>'; dlg.close(); retry(); });
  };
  var M = window.mkView ? mkView('account', 'Account', 'Account', 'Your plan, your devices and sign-in.') : null;
  if (M) {
    M.classList.add('zz-acct');
    var V = M.closest('.view');
    try { if (views.indexOf(V) < 0) views.push(V); } catch (e) {}  // the page's view list is built before this script runs
    if (location.hash === '#/account' && typeof route === 'function') route();  // the first route ran before this page existed
  }
  function account() {
    if (!M || location.hash !== '#/account') return;
    // Account lives under Menu: the app's own route mapping does not know this page, so mark the Menu tab here
    document.querySelectorAll('#bnav a,.nav .links a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#/menu'); });
    if (!window.zzAccount || !zzAccount.signedIn()) {
      M.innerHTML = '<section><h2>Not signed in</h2><p>Topic 01, MCQ chapter 1 and textbook chapter 1 are free. Sign in to open everything your plan includes.</p>' +
        '<div class="zz-row"><button type="button" class="zz-b zz-p" id="zz-a-in">Sign in</button></div></section>';
      M.querySelector('#zz-a-in').onclick = function () { zzSignIn(); };
      return;
    }
    M.innerHTML = '<p class="zz-st" role="status">Loading your account\u2026</p>';
    var get = function (p) { return fetch(API + p, { credentials: 'omit', headers: window.zzAuthHeaders() }).then(function (r) { return r.ok ? r.json() : {}; }, function () { return {}; }); };
    Promise.all([zzAccount.me(), get('devices'), get('pay/orders')]).then(function (x) {
      var me = x[0] || {}, d = x[1] || {}, ords = (x[2] || {}).orders || [], u = me.user || {}, now = me.now || Date.now(), ents = me.entitlements || [];
      var plan = ents.length ? ents.map(function (e) {
        var on = e.expires_at > now;
        return '<li><span>' + esc(NAMES[e.entitlement] || e.entitlement) + '</span><span class="' + (on ? 'zz-ok' : 'zz-gone') + '">' + (on ? 'Until ' : 'Ended ') + esc(day(e.expires_at)) + '</span></li>';
      }).join('') : '<li><span>Free sample</span><span class="zz-gone">No plan yet</span></li>';
      M.innerHTML = '<section><h2>' + esc(u.display_name || 'Your account') + '</h2><p>' + esc(u.email || u.phone || '') + '</p></section>' +
        '<section><h2>Plan</h2><ul>' + plan + '</ul><div class="zz-row"><button type="button" class="zz-b zz-p" id="zz-a-up">' + (ents.length ? 'Renew or add a plan' : 'Choose a plan') + '</button></div></section>' +
        (ords.length ? '<section><h2>Orders</h2><ul>' + ords.map(function (o) {
          var st = o.status === 'paid' ? ['Paid', 'zz-ok'] : o.status === 'pending' ? (o.submitted_at ? ['Being checked', 'zz-gone'] : ['Waiting for payment', 'zz-gone']) : o.status === 'failed' ? ['Not approved', 'zz-gone'] : ['Cancelled', 'zz-gone'];
          return '<li><span>' + esc(PLAN[o.bundle] || o.bundle) + '<small>BDT ' + esc((o.amount_minor / 100).toLocaleString('en-IN')) + ' \u00b7 ' + esc(day(o.created_at)) + '</small></span>' +
            '<span class="' + st[1] + '">' + st[0] + (o.status === 'pending' && !o.submitted_at || o.status === 'paid' ? ' <a class="zz-b" href="#/account/order/' + esc(o.order_id) + '">' + (o.status === 'paid' ? 'Receipt' : 'Pay') + '</a>' : '') + '</span></li>';
        }).join('') + '</ul></section>' : '') +
        '<section><h2>Devices</h2><p>Your account works on up to ' + esc(d.max || 3) + ' devices.</p>' + devList(d.devices || [], d.current) + '</section>' +
        '<section><div class="zz-row"><button type="button" class="zz-b" id="zz-a-out">Sign out</button></div>' +
        '<p class="zz-legal"><a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="refund.html">Refunds</a></p></section>';
      wire(M, null, account);
      M.querySelector('#zz-a-up').onclick = function () { window.zzUpgrade && zzUpgrade(); };
      M.querySelector('#zz-a-out').onclick = function () { this.disabled = true; zzAccount.logout(); };
    });
  }
  window.zzAccountPage = function () { if (location.hash === '#/account') account(); else location.hash = '#/account'; };
  addEventListener('hashchange', function () { setTimeout(account, 0); });

  // watermark
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
    account();
    if (window.zzAccount && zzAccount.signedIn() && !zzAccount.user()) zzAccount.me().then(function (m) { if (m && m.user) zzAccount.setUser(m.user); mark(); });
    mark();
  }
  addEventListener('zz:auth', onAuth);
  (window.zzAuthReady || Promise.resolve()).then(onAuth);  // sign-in may finish before this script loads
  setTimeout(account, 0);
})();
