/* Payments (client). Prices come from the server; the browser only names a bundle. After the gateway, the server
   redirects to #/account/order/<id>: this shows "pending", re-checks automatically, then the receipt. */
(function () {
  var API = (window.ZZ_API || '') + 'api/', dlg, body;
  var LEGAL = '<p class="zz-legal"><a href="terms.html">Terms</a> · <a href="refund.html">Refunds</a> · <a href="privacy.html">Privacy</a></p>';
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function open(html) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'zz-pay'; body = document.createElement('div');
      var c = document.createElement('button'); c.type = 'button'; c.textContent = 'Close'; c.onclick = function () { dlg.close(); };
      dlg.append(body, c); document.body.appendChild(dlg);
    }
    body.innerHTML = html + LEGAL;
    if (!dlg.open) dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  }
  function api(path, init) {
    init = init || {}; init.credentials = 'omit';
    init.headers = Object.assign({ 'Content-Type': 'application/json' }, window.zzAuthHeaders ? zzAuthHeaders() : {});
    return fetch(API + path, init).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }
  window.zzUpgrade = function () {
    if (!window.zzAccount || !zzAccount.signedIn()) return window.zzSignIn && zzSignIn();
    open('<h2>Upgrade</h2><p>Loading prices…</p>');
    api('bundles').then(function (j) {
      body.innerHTML = '<h2>Upgrade</h2><p>One year of access. Buying again extends it.</p>' + (j.bundles || []).map(function (b) {
        return '<p><button type="button" data-b="' + esc(b.id) + '">' + esc(b.name) + ' · ' + esc(b.price) + ' ' + esc(b.currency) + '</button></p>';
      }).join('') + '<p id="zz-pay-msg" role="status"></p>' + LEGAL;
      body.querySelectorAll('button[data-b]').forEach(function (btn) {
        btn.onclick = function () {
          btn.disabled = true;
          api('pay/checkout', { method: 'POST', body: JSON.stringify({ bundle: btn.dataset.b }) }).then(function (r) {
            if (r.redirect_url) location.href = r.redirect_url;
            else { btn.disabled = false; body.querySelector('#zz-pay-msg').textContent = 'Could not start the payment. Try again.'; }
          });
        };
      });
    });
  };
  var polling = '';
  function showOrder(id, tries) {
    polling = id;
    (window.zzAuthReady || Promise.resolve()).then(function () { return api('pay/orders/' + encodeURIComponent(id)); }).then(function (j) {
      if (polling !== id) return;
      var st = j.order && j.order.status;
      if (st === 'paid' && j.receipt) {
        var r = j.receipt;
        open('<h2>Payment received</h2><div id="zz-receipt"><p>Receipt <b>' + esc(r.receipt_no) + '</b></p><p>' + esc(r.bundle) + ' · ' +
          esc((r.amount_minor / 100).toFixed(2)) + ' ' + esc(r.currency) + '</p><p>' + esc(new Date(r.issued_at).toLocaleString()) + '</p></div>');
        dispatchEvent(new CustomEvent('zz:auth'));
      } else if (st === 'pending' && tries < 40) {
        open('<h2>Payment pending</h2><p id="zz-pending">Checking with the payment provider…</p>');
        setTimeout(function () { showOrder(id, tries + 1); }, Math.min(3000 + tries * 500, 15000));
      } else if (st === 'pending') {
        open('<h2>Payment pending</h2><p>Still waiting for the provider. Open this page again later; access starts as soon as it confirms.</p>');
      } else {
        open('<h2>Payment not completed</h2><p>' + (st ? 'Status: ' + esc(st) + '. You were not charged for a failed or cancelled payment.' : 'Sign in to see this order.') + '</p>');
      }
    });
  }
  function onHash() { var m = /^#\/account\/order\/([\w-]{1,64})$/.exec(location.hash); if (m && polling !== m[1]) showOrder(m[1], 0); }
  addEventListener('hashchange', onHash);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', onHash); else onHash();
})();
