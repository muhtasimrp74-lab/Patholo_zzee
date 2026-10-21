# Admin commands (staging)

There are no admin web endpoints. Run these from a computer with Node, in `worker/`, with
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set. Replace the CAPITALISED placeholders.
Times are epoch milliseconds. Use `--local` instead of `--remote` to try them on a local copy.

1. Grant an entitlement (qna, mcq or textbook) for 365 days, or extend an existing one:

```
npx wrangler d1 execute patholo-zzee-staging --remote --command "INSERT INTO entitlements (user_id, entitlement, expires_at, source, note, created_at, updated_at) VALUES ('USER_ID', 'ENTITLEMENT', unixepoch()*1000 + 365*86400000, 'admin', 'NOTE', unixepoch()*1000, unixepoch()*1000) ON CONFLICT (user_id, entitlement) DO UPDATE SET expires_at = MAX(entitlements.expires_at, unixepoch()*1000) + 365*86400000, source = 'admin', note = excluded.note, updated_at = unixepoch()*1000"
```

2. Revoke entitlements (refund): ends access now and records why:

```
npx wrangler d1 execute patholo-zzee-staging --remote --command "UPDATE entitlements SET expires_at = unixepoch()*1000, source = 'admin', note = 'refund ORDER_ID', updated_at = unixepoch()*1000 WHERE user_id = 'USER_ID' AND entitlement IN ('ENTITLEMENT')"
```

3. Find a user by email or phone (phone in E.164, e.g. +8801712345678):

```
npx wrangler d1 execute patholo-zzee-staging --remote --command "SELECT id, display_name, email, phone, created_at FROM users WHERE email = lower('EMAIL') OR phone = 'PHONE'"
```

4. List recent orders:

```
npx wrangler d1 execute patholo-zzee-staging --remote --command "SELECT order_id, user_id, bundle, amount_minor, currency, status, created_at, paid_at FROM payment_orders ORDER BY created_at DESC LIMIT 20"
```
