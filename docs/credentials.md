# Credentials (never paste these in chat)

Add secrets in Chrome on the tablet: open
https://github.com/muhtasimrp74-lab/Patholo_zzee/settings/secrets/actions
then tap "New repository secret", type the Name exactly as below, paste the value, tap "Add secret".
For GOOGLE_CLIENT_ID use the "Variables" tab on the same page, then "New repository variable".

## 0. Your GitHub token (needed for Stage 1)
github.com/settings/personal-access-tokens, tap the token, "Edit", Repository permissions:
Secrets: Read and write (Stage 1 stores LEAK_KEY), Actions: Read and write (Stage 2B runs workflows),
Pull requests: Read and write (final PR). Keep Contents and Workflows at Read and write. Save.

## 1. Cloudflare (Stage 2B)
- CLOUDFLARE_API_TOKEN: dash.cloudflare.com, profile icon (top right), My Profile, API Tokens,
  Create Token, "Create Custom Token". Permissions (all "Account", all "Edit"):
  Workers Scripts, D1, Workers R2 Storage. Account Resources: Include, your account.
  Continue to summary, Create Token, Copy.
- CLOUDFLARE_ACCOUNT_ID: dash.cloudflare.com, open Workers & Pages. The ID is in the
  address bar (dash.cloudflare.com/<ACCOUNT_ID>/...) and under "Account ID" on the right.

## 2. Google sign-in (Stage 3, after 2B gives the staging URL)
- GOOGLE_CLIENT_ID (variable, not secret): console.cloud.google.com, create a project,
  APIs & Services, OAuth consent screen, External, fill app name and email, Save.
  Credentials, Create credentials, OAuth client ID, Web application.
  Authorized JavaScript origins: the staging URL from Stage 2B and https://muhtasimrp74-lab.github.io
  Create, copy the Client ID (ends in .apps.googleusercontent.com).

## 3. Phone OTP (Stage 3)
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN: twilio.com/try-twilio, sign up, Console home,
  "Account Info" box (tap the eye icon to reveal the Auth Token).
- TWILIO_VERIFY_SID: Console, Explore Products, Verify, Services, Create new, any name,
  copy the Service SID (starts with VA).
- Trial accounts only send to numbers you verify in the console; real users need a paid account.
- Bangladesh: Twilio SMS to +880 is costly and delivery can be patchy. For launch, a local
  gateway (for example SSL Wireless, same group as SSLCommerz) behind the same adapter is
  usually cheaper. Twilio stays the default for staging.

## 4. Payments (Stage 5)
- SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD: developer.sslcommerz.com/registration/,
  register a sandbox store. The Store ID and Store Password arrive by email.
  A live store later needs a merchant account (trade license etc.).

## Created by me, nothing for you to do
- LEAK_KEY (Stage 1): random, stored as a secret through the API (needs step 0).
- JWT_SECRET (Stage 2B): random, generated once by the staging workflow.
