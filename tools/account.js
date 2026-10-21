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
  function post(path, body, h) {
    return fetch(API + path, { method: 'POST', credentials: 'omit', headers: Object.assign({ 'Content-Type': 'application/json' }, h || {}), body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; j._retry = r.headers.get('Retry-After'); return j; }); });
  }
  function set(j) {
    access = j.access_token || null; if (j.user) user = j.user;
    LS.set('zz-rt', j.refresh_token || null); if (!access) user = null;
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
    me: function () { return fetch(API + 'me', { headers: window.zzAuthHeaders(), credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }); },
    google: function (idToken) { return post('auth/google', { id_token: idToken, device_id: device() }).then(function (j) { if (j._status === 200) set(j); return j; }); },
    otpStart: function (phone) { return post('auth/otp/start', { phone: phone }); },
    otpVerify: function (phone, code) { return post('auth/otp/verify', { phone: phone, code: code, device_id: device() }).then(function (j) { if (j._status === 200) set(j); return j; }); },
    logout: function () { var h = window.zzAuthHeaders(); set({}); return post('auth/logout', {}, h).catch(function () {}); },
  };
  window.zzAuthReady = LS.get('zz-rt') ? refresh() : Promise.resolve(false);

  // ---- sign-in dialog ----
  var dlg;
  function el(tag, attrs, text) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; return e; }
  window.zzSignIn = function () {
    if (!dlg) {
      dlg = el('dialog', { id: 'zz-signin', 'aria-label': 'Sign in' });
      var g = el('div', { id: 'zz-g' }), msg = el('p', { id: 'zz-msg', role: 'status' });
      var ph = el('input', { id: 'zz-phone', type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '01XXXXXXXXX' });
      var code = el('input', { id: 'zz-code', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: 'Code', hidden: '' });
      var send = el('button', { type: 'button', id: 'zz-send' }, 'Send code'), ver = el('button', { type: 'button', id: 'zz-verify', hidden: '' }, 'Verify');
      var close = el('button', { type: 'button', id: 'zz-close' }, 'Close');
      dlg.append(el('h2', {}, 'Sign in'), g, el('p', {}, 'or with your phone'), ph, send, code, ver, msg, close);
      document.body.appendChild(dlg);
      var say = function (j, ok) { msg.textContent = j._status === 429 ? 'Too many tries. Wait ' + Math.ceil((j._retry || 60) / 60) + ' min.' : ok; };
      send.onclick = function () { zzAccount.otpStart(ph.value).then(function (j) { if (j._status === 200) { code.hidden = ver.hidden = false; code.focus(); say(j, 'Code sent.'); } else say(j, 'Check the number and try again.'); }); };
      ver.onclick = function () { zzAccount.otpVerify(ph.value, code.value.trim()).then(function (j) { if (j._status === 200) dlg.close(); else say(j, 'Wrong or expired code.'); }); };
      close.onclick = function () { dlg.close(); };
      fetch(API + 'config', { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (c) {
        if (!c.google_client_id) return;
        var s = el('script', { src: 'https://accounts.google.com/gsi/client', async: '' });
        s.onload = function () {
          google.accounts.id.initialize({ client_id: c.google_client_id, callback: function (r) { zzAccount.google(r.credential).then(function (j) { if (j._status === 200) dlg.close(); else msg.textContent = 'Google sign-in failed.'; }); } });
          google.accounts.id.renderButton(g, { theme: 'outline', size: 'large' });
        };
        document.head.appendChild(s);
      }).catch(function () {});
    }
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  };
})();
