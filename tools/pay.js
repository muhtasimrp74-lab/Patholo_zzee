/* Payments (client). Prices come from the server; the browser only names a bundle. After the gateway, the server
   redirects to #/account/order/<id>: this shows "pending", re-checks automatically, then the receipt. */
(function () {
  var API = (window.ZZ_API || '') + 'api/', dlg, body;
  var LEGAL = '<p class="zz-legal">By paying you agree to the <a href="terms.html">Terms</a> and <a href="refund.html">Refund policy</a>. <a href="privacy.html">Privacy</a></p>';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var money = function (minor, cur) { return esc(cur) + ' ' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }); };
  var NAMES = { QNA: 'Question bank', MCQ: 'MCQ bank', TEXTBOOK: 'Textbook', ALL: 'Everything' };
  function open(html) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'zz-pay'; dlg.className = 'zz-dlg'; dlg.setAttribute('aria-labelledby', 'zz-pay-h');
      var x = document.createElement('button'); x.type = 'button'; x.className = 'zz-x'; x.setAttribute('aria-label', 'Close'); x.innerHTML = '<svg class="zz-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      x.onclick = function () { dlg.close(); }; body = document.createElement('div'); dlg.append(x, body); document.body.appendChild(dlg);
    }
    body.innerHTML = html;
    if (!dlg.open) dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
    var h = body.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus(); }  // start at the title, not on the close button
  }
  function api(path, init) {
    init = init || {}; init.credentials = 'omit';
    init.headers = Object.assign({ 'Content-Type': 'application/json' }, window.zzAuthHeaders ? zzAuthHeaders() : {});
    return fetch(API + path, init).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }
  window.zzUpgrade = function () {
    if (!window.zzAccount || !zzAccount.signedIn()) return window.zzSignIn && zzSignIn();
    open('<h2 id="zz-pay-h">Choose a plan</h2><p class="zz-st" role="status">Loading prices\u2026</p>');
    api('bundles').then(function (j) {
      if (!j.bundles) { body.querySelector('.zz-st').textContent = 'Could not load prices. Check your connection and try again.'; return; }
      var cents = function (b) { return Math.round(Number(b.price) * 100); }, sum = 0, all = null;
      j.bundles.forEach(function (b) { if (b.id === 'ALL') all = b; else sum += cents(b); });
      var save = all && sum > cents(all) ? sum - cents(all) : 0;
      var WHAT = { QNA: 'Every viva and written answer', MCQ: 'All MCQ chapters with explanations', TEXTBOOK: 'Every Robbins chapter, offline too',
        ALL: 'Questions, MCQs and the textbook' + (save ? ' \u00b7 save ' + money(save, all.currency) : '') };
      var order = (all ? [all] : []).concat(j.bundles.filter(function (b) { return b.id !== 'ALL'; }));  // best value first
      body.innerHTML = '<h2 id="zz-pay-h">Choose a plan</h2><p>One year of access. Buying again adds another year.</p><ul class="zz-plans">' + order.map(function (b) {
        return '<li><button type="button" class="zz-plan' + (b.id === 'ALL' ? ' zz-best' : '') + '" data-b="' + esc(b.id) + '">' + (b.id === 'ALL' ? '<i class="zz-badge">Best value</i>' : '') +
          '<span class="zz-pt"><b>' + esc(NAMES[b.id] || b.name) + '</b><small>' + esc(WHAT[b.id] || '') + '</small></span><span class="zz-pr">' + money(cents(b), b.currency) + '</span></button></li>';
      }).join('') + '</ul><p id="zz-pay-msg" class="zz-st" role="status"></p>' + LEGAL;
      var h2 = body.querySelector('h2'); h2.tabIndex = -1; h2.focus();  // content was replaced: keep focus in the dialog
      body.querySelectorAll('button[data-b]').forEach(function (btn) {
        btn.onclick = function () {
          var msg = body.querySelector('#zz-pay-msg');
          body.querySelectorAll('button[data-b]').forEach(function (x) { x.disabled = true; });
          msg.classList.remove('zz-bad'); msg.textContent = 'Opening the secure payment page\u2026';
          api('pay/checkout', { method: 'POST', body: JSON.stringify({ bundle: btn.dataset.b }) }).then(function (r) {
            if (r.redirect_url) { location.href = r.redirect_url; return; }
            body.querySelectorAll('button[data-b]').forEach(function (x) { x.disabled = false; });
            msg.classList.add('zz-bad'); msg.textContent = 'The payment page did not open. Try again in a moment.';
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
      var st = j.order && j.order.status, r = j.receipt;
      if (st === 'paid' && r) {
        open('<span class="zz-done" aria-hidden="true"><svg class="zz-ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><h2 id="zz-pay-h">Payment received</h2><p>Your plan is active. The locked topics open now.</p><div id="zz-receipt" class="zz-receipt">' +
          '<p><span>Receipt</span><b>' + esc(r.receipt_no) + '</b></p><p><span>Plan</span>' + esc(NAMES[r.bundle] || r.bundle) + '</p>' +
          '<p><span>Paid</span>' + money(r.amount_minor, r.currency) + '</p><p><span>Date</span>' + esc(new Date(r.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })) + '</p></div>' +
          '<button type="button" class="zz-b zz-p zz-full" onclick="this.closest(\'dialog\').close()">Done</button>' + LEGAL);
        dispatchEvent(new CustomEvent('zz:auth'));
      } else if (st === 'pending' && tries < 40) {
        if (!tries) open('<h2 id="zz-pay-h">Confirming your payment</h2><p id="zz-pending" class="zz-st" role="status">Checking with the payment provider. This usually takes under a minute; you can keep this open.</p>' + LEGAL);
        setTimeout(function () { showOrder(id, tries + 1); }, Math.min(3000 + tries * 500, 15000));
      } else if (st === 'pending') {
        open('<h2 id="zz-pay-h">Still confirming</h2><p>The provider has not confirmed yet. Your plan starts as soon as it does; open Account later to check.</p>' + LEGAL);
      } else {
        open('<h2 id="zz-pay-h">Payment not completed</h2><p>' + (st ? 'The payment was ' + esc(st) + '. You were not charged.' : 'Sign in with the account you paid with to see this order.') + '</p>' +
          '<button type="button" class="zz-b zz-p zz-full" onclick="this.closest(\'dialog\').close();zzUpgrade()">Choose a plan</button>' + LEGAL);
      }
    });
  }
  function onHash() { var m = /^#\/account\/order\/([\w-]{1,64})$/.exec(location.hash); if (m && polling !== m[1]) showOrder(m[1], 0); }
  addEventListener('hashchange', onHash);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', onHash); else onHash();
})();
