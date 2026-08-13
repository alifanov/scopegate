# Bring your own OAuth credentials

A shared application is the wrong unit of trust. Some providers make that
explicit — Google's restricted scopes (`gmail.modify`, `drive`) require an
annual CASA security assessment, Meta requires App Review plus business
verification, LinkedIn's posting scope is gated behind its partner programme,
and until those are granted a shared app is capped at 100 users with refresh
tokens that expire weekly. The rest are merely quieter about it: one app means
one pooled rate limit and one consent screen whose revocation takes every
customer down together.

So on the cloud, ScopeGate lends nobody its own access — **every** OAuth
provider uses the project's own application. On a self-hosted instance it stays
optional: the operator's environment variables keep working exactly as before.

## Which providers need it

Every provider connected over OAuth. API-key providers (Ahrefs, Semrush,
OpenRouter, …) have no OAuth app and are unaffected.

| Credential group | Covers | Verification wall |
|---|---|---|
| `google` | Gmail, Calendar, Drive, Google Ads, Search Console, YouTube, Tag Manager | CASA audit |
| `meta` | Meta Ads | App Review + business verification |
| `instagram` | Instagram | App Review |
| `threads` | Threads | App Review |
| `linkedin` | LinkedIn | partner programme |
| `twitter` | X/Twitter, X/Twitter Ads | paid API tier |
| `github`, `slack`, `notion`, `hubspot`, `jira`, `salesforce` | one each | none — self-serve to register |

One application covers a whole group. A Google client entered once serves all
seven Google services.

## Where to enter them

Project → **Connections** → **Connect Service** → pick a provider from a group
that needs its own app. The dialog asks for a client ID and secret, shows the
redirect URI to whitelist, and sends you straight to the provider's consent
screen after saving.

The client secret is encrypted at rest with AES-256-GCM — the same treatment
access tokens get — and is never returned by the API.

## The redirect URI

Copy it from the dialog and add it to your application **before** saving.
Nearly every failed first attempt is a `redirect_uri_mismatch` caused by
skipping this step. It has the form:

```
https://<your ScopeGate host>/api/oauth/<group>/callback
```

## Google: the Internal shortcut

If you have a Google Workspace organisation, create the OAuth client with user
type **Internal** rather than External. An Internal app is exempt from
verification entirely — no CASA assessment, no demo video, no 100-user cap, and
its refresh tokens do not expire after seven days. The only restriction is that
it can only be used by accounts in the same organisation, which is normally
exactly what a business needs.

1. Google Cloud Console → APIs & Services → **OAuth consent screen** → user
   type **Internal**.
2. Enable the APIs you plan to use (Gmail API, Google Calendar API, Google Ads
   API, Search Console API, YouTube Data API v3, Tag Manager API).
3. Credentials → Create credentials → **OAuth client ID** → Web application.
4. Add the redirect URI from the ScopeGate dialog.
5. Paste the client ID and secret into ScopeGate.

Google Ads additionally needs a developer token from your own Google Ads
account (API Center → apply for Basic access); it is separate from OAuth.

## Meta, Instagram, Threads

Three separate apps — Meta Ads, Instagram and Threads each get their own App ID
and secret at [developers.facebook.com](https://developers.facebook.com).

While an app is in **Development** mode it works fully for accounts with a role
in that app (admin, developer, tester), which covers using it for your own
business assets. App Review and business verification only become necessary
when you let unrelated people log in.

Add the redirect URI under Products → Facebook Login → Settings → Valid OAuth
Redirect URIs.

## LinkedIn

Create an app at [linkedin.com/developers](https://www.linkedin.com/developers/).
Sign In with LinkedIn (OpenID Connect) is self-serve; posting (`w_member_social`)
requires requesting the Share on LinkedIn product and, for organisation-level
posting, the Community Management API — the hardest approval of the set.

## X / Twitter

Create a project and app in the
[X Developer Portal](https://developer.x.com/), enable OAuth 2.0 with PKCE, set
the app to *Web App / Automated App or Bot*, and add the redirect URI. Note
that write access requires a paid API tier.

## Self-hosted

Nothing changes. Set the operator-level environment variables
(`GOOGLE_CLIENT_ID`, `META_APP_ID`, …) as before and every provider connects
through them. Per-project credentials still work if you want to override one —
a stored row always wins over the environment.
