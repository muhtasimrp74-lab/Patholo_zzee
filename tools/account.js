/* Accounts (client). Access token in memory only; refresh token in localStorage 'zz-rt' (trade-off: readable by
   any script on this origin; no custom domain for an HttpOnly cookie). API base: window.ZZ_API ('' = same origin). */
(function () {
  var API = (window.ZZ_API || '') + 'api/', access = null, user = null, timer = 0;
  var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
             set: function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  function device() {
    var d = LS.get('zz-device');
    if (!d) { d = 'd-' + Array.from(crypto.getRandomValues(new Uint8Array(12)), function (b) { return b.toString(16).padStart(2, '0'); }).join(''); LS.set('zz-device', d); }
    return d;
  }
  function dname() { var u = navigator.userAgent; return (/Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'Mac' : 'Browser') + ' ' + (/Firefox/.test(u) ? 'Firefox' : /Edg/.test(u) ? 'Edge' : /Chrome/.test(u) ? 'Chrome' : /Safari/.test(u) ? 'Safari' : ''); }
  function post(path, body, h) {
    return fetch(API + path, { method: 'POST', credentials: 'omit', headers: Object.assign({ 'Content-Type': 'application/json' }, h || {}), body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; j._retry = r.headers.get('Retry-After'); return j; }); });
  }
  function sub(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub; } catch (e) { return null; } }
  function set(j) {
    access = j.access_token || null; if (j.user) user = j.user;
    LS.set('zz-rt', j.refresh_token || null); if (!access) user = null;
    var u = access ? sub(access) : null;
    LS.set('zz-uid', u);  // last signed-in user: names the offline chunk cache; other users' caches are wiped
    if (window.zzWipeChunks) zzWipeChunks(u);
    clearTimeout(timer); if (access) timer = setTimeout(refresh, ((j.expires_in || 900) - 120) * 1000);
    dispatchEvent(new CustomEvent('zz:auth', { detail: { signedIn: !!access } }));
  }
  function doRefresh() {
    var rt = LS.get('zz-rt');
    if (!rt) return Promise.resolve(false);
    return post('auth/refresh', { refresh_token: rt }).then(function (j) {
      if (j._status === 200) { set(j); return true; }
      if (j._status === 401) set({});
      return false;
    }, function () { return false; });
  }
  // one refresh at a time across tabs, so two tabs never present the same refresh token (that would revoke the family)
  function refresh() {
    return navigator.locks ? navigator.locks.request('zz-refresh', doRefresh) : doRefresh();
  }
  window.zzAuthHeaders = function () { return access ? { Authorization: 'Bearer ' + access } : {}; };
  window.zzAccount = {
    user: function () { return user; }, signedIn: function () { return !!access; }, refresh: refresh, device: device,
    setUser: function (u) { user = u; },
    uid: function () { return (access && sub(access)) || LS.get('zz-uid'); },
    me: function () { return fetch(API + 'me', { headers: window.zzAuthHeaders(), credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }); },
    google: function g(idToken) { return post('auth/google', { id_token: idToken, device_id: device(), device_name: dname() }).then(function (j) {
      if (j._status === 200) set(j); else if (j._status === 409 && window.zzDeviceLimit) zzDeviceLimit(j, function () { g(idToken); }); return j; }); },
    password: function (login, pw, create) { return post(create ? 'auth/register' : 'auth/login', { login: login, password: pw, device_id: device(), device_name: dname() }).then(function (j) {
      if (j._status === 200) set(j); else if (j._status === 409 && j.error === 'device_limit' && window.zzDeviceLimit) zzDeviceLimit(j, function () { window.zzSignIn && zzSignIn(); }); return j; }); },
    otpStart: function (phone) { return post('auth/otp/start', { phone: phone }); },
    otpVerify: function (phone, code) { return post('auth/otp/verify', { phone: phone, code: code, device_id: device(), device_name: dname() }).then(function (j) {
      if (j._status === 200) set(j); else if (j._status === 409 && window.zzDeviceLimit) zzDeviceLimit(j, function () { window.zzSignIn && zzSignIn(); }); return j; }); },
    // reload afterwards so no unlocked content stays in the page
    logout: function () { var h = window.zzAuthHeaders(); set({}); return post('auth/logout', {}, h).catch(function () {}).then(function () { return window.zzWipeChunks && zzWipeChunks(null); }).then(function () { location.reload(); }); },
  };
  window.zzAuthReady = LS.get('zz-rt') ? refresh() : Promise.resolve(false);

  // ---- sign-in dialog ----
  var dlg;
  function el(tag, attrs, text) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; return e; }
  window.zzSignIn = function () {
    if (!dlg) {
      dlg = el('dialog', { id: 'zz-signin', class: 'zz-dlg', 'aria-labelledby': 'zz-si-h' });
      var x = el('button', { type: 'button', class: 'zz-x', 'aria-label': 'Close' }, '\u00d7');
      x.innerHTML = '<svg class="zz-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      var g = el('div', { id: 'zz-g' }), or = el('p', { class: 'zz-or', hidden: '' }, 'or');
      var ph = el('input', { id: 'zz-phone', type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '01XXXXXXXXX' });
      var code = el('input', { id: 'zz-code', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '8', placeholder: '6-digit code' });
      var send = el('button', { type: 'button', id: 'zz-send', class: 'zz-b zz-p zz-full' }, 'Send code');
      var ver = el('button', { type: 'button', id: 'zz-verify', class: 'zz-b zz-p zz-full' }, 'Sign in');
      var box = el('div', { hidden: '' }), msg = el('p', { id: 'zz-msg', class: 'zz-st', role: 'status' });
      box.append(el('label', { for: 'zz-code' }, 'Code from the SMS'), code, ver);
      var lg = el('input', { id: 'zz-login', autocomplete: 'username', inputmode: 'email', placeholder: '01XXXXXXXXX or you@example.com' });
      var pw = el('input', { id: 'zz-pass', type: 'password', autocomplete: 'current-password', placeholder: 'Password' });
      var pwrap = el('div', { class: 'zz-pwwrap' }), eye = el('button', { type: 'button', id: 'zz-eye', class: 'zz-eye', 'aria-label': 'Show password', 'aria-pressed': 'false', 'aria-controls': 'zz-pass' });
      eye.innerHTML = '<svg class="zz-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>'; pwrap.append(pw, eye);
      eye.onclick = function () {  // show or hide the password while typing; focus stays in the field
        var show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
        eye.setAttribute('aria-pressed', String(show)); eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        eye.innerHTML = show ? '<svg class="zz-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4M6.2 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>' : '<svg class="zz-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>'; pw.focus();
      };
      var go = el('button', { type: 'button', id: 'zz-pw', class: 'zz-b zz-p zz-full' }, 'Sign in');
      var mode = el('button', { type: 'button', id: 'zz-mode', class: 'zz-b zz-q zz-full' }, 'New here? Create an account');
      var hint = el('p', { class: 'zz-st', hidden: '' }, 'Use at least 8 characters. Keep it safe: there is no reset by SMS yet.');
      var otp = el('div', { id: 'zz-otp', hidden: '' }), or2 = el('p', { class: 'zz-or' }, 'or get a code by SMS');
      otp.append(or2, el('label', { for: 'zz-phone' }, 'Phone number'), ph, send, box);
      dlg.append(x, el('h2', { id: 'zz-si-h' }, 'Sign in'), el('p', {}, 'Open the answers, MCQs and chapters your plan includes. Progress on this device is kept.'),
        g, or, el('label', { for: 'zz-login' }, 'Phone number or email'), lg, el('label', { for: 'zz-pass' }, 'Password'), pwrap, hint, go, mode, otp, msg);
      var creating = false;
      mode.onclick = function () {
        creating = !creating; go.textContent = creating ? 'Create account' : 'Sign in'; mode.textContent = creating ? 'Have an account? Sign in' : 'New here? Create an account';
        pw.setAttribute('autocomplete', creating ? 'new-password' : 'current-password'); hint.hidden = !creating;
        dlg.querySelector('#zz-si-h').textContent = creating ? 'Create your account' : 'Sign in'; say('');
      };
      go.onclick = function () {
        go.disabled = true; say(creating ? 'Creating your account\u2026' : 'Signing in\u2026');
        zzAccount.password(lg.value, pw.value, creating).then(function (j) {
          go.disabled = false;
          if (j._status === 200 || j._status === 409 && j.error === 'device_limit') { say(''); pw.value = ''; if (pw.type !== 'password') eye.click(); dlg.close(); return; }
          say(j._status === 429 ? wait(j) : j.error === 'account_exists' ? 'An account with this phone or email already exists. Sign in instead.' :
            j.error === 'weak_password' ? 'Use at least 8 characters for the password.' : j.error === 'bad_login' ? 'Enter a mobile number like 01712345678 or an email address.' :
            creating ? 'Could not create the account. Try again.' : 'Wrong phone/email or password.', true);
        }, function () { go.disabled = false; say('No connection. Try again when you are online.', true); });
      };
      pw.onkeydown = function (e) { if (e.key === 'Enter') go.click(); };
      document.body.appendChild(dlg);
      var say = function (t, bad) { msg.textContent = t; msg.classList.toggle('zz-bad', !!bad); };
      var wait = function (j) { return 'Too many tries. Try again in ' + Math.max(1, Math.ceil((j._retry || 60) / 60)) + ' min.'; };
      send.onclick = function () {
        send.disabled = true; say('Sending\u2026');
        zzAccount.otpStart(ph.value).then(function (j) {
          send.disabled = false;
          if (j._status === 200) { box.hidden = false; send.textContent = 'Send a new code'; send.classList.remove('zz-p'); code.focus(); say('Code sent. It can take up to a minute.'); }
          else say(j._status === 429 ? wait(j) : j._status === 400 ? 'Enter a mobile number like 01712345678 or +8801712345678.' : 'Could not send the code. Try again shortly.', true);
        }, function () { send.disabled = false; say('No connection. Try again when you are online.', true); });
      };
      ver.onclick = function () {
        ver.disabled = true; say('Checking\u2026');
        zzAccount.otpVerify(ph.value, code.value.trim()).then(function (j) {
          ver.disabled = false;
          if (j._status === 200 || j._status === 409) { say(''); dlg.close(); }
          else say(j._status === 429 ? wait(j) : 'That code is wrong or has expired. Send a new code to try again.', true);
        }, function () { ver.disabled = false; say('No connection. Try again when you are online.', true); });
      };
      ph.onkeydown = function (e) { if (e.key === 'Enter') send.click(); };
      code.onkeydown = function (e) { if (e.key === 'Enter') ver.click(); };
      x.onclick = function () { dlg.close(); };
      fetch(API + 'config', { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (c) {
        if (c.otp) otp.hidden = false;
        if (!c.google_client_id) return;
        var s = el('script', { src: 'https://accounts.google.com/gsi/client', async: '' });
        s.onload = function () {
          google.accounts.id.initialize({ client_id: c.google_client_id, callback: function (r) { zzAccount.google(r.credential).then(function (j) { if (j._status === 200 || j._status === 409) dlg.close(); else say('Google sign-in did not work. Try again or use your phone.', true); }); } });
          google.accounts.id.renderButton(g, { theme: 'outline', size: 'large', width: 280, text: 'continue_with' }); or.hidden = false;
        };
        document.head.appendChild(s);
      }).catch(function () {});
    }
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    var f = dlg.querySelector('#zz-login'); if (f) f.focus();
  };
})();
