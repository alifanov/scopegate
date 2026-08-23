import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "./db";
import { isCloud } from "./cloud";
import { isEmailConfigured, sendEmail } from "./email";
import { applyCustomerState } from "./billing";
import { checkoutSlug, getPolarProductId, publicPlans } from "./plans";

// Single source of truth for the minimum password length — reused by
// accept-invite.ts, which creates credentials directly and bypasses
// better-auth's own `signUpEmail` (and its built-in minPasswordLength check).
export const MIN_PASSWORD_LENGTH = 12;

const cloud = isCloud();

// Sign-in with Google deliberately uses its OWN OAuth client, not the
// GOOGLE_CLIENT_ID used for service connections. That one requests Google's
// restricted scopes (gmail.modify, drive) and carries the whole CASA
// verification burden; coupling the login button to it would make one review
// gate both. This client only ever needs `openid email profile`, and its only
// redirect URI is /api/auth/callback/google.
const googleSignIn =
  cloud && process.env.GOOGLE_SIGNIN_CLIENT_ID && process.env.GOOGLE_SIGNIN_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_SIGNIN_CLIENT_ID,
          clientSecret: process.env.GOOGLE_SIGNIN_CLIENT_SECRET,
        },
      }
    : undefined;

// Checkout products come from PLAN_REGISTRY via the env indirection, so the
// advertised plans and the purchasable ones cannot drift apart.
function polarPlugin() {
  if (!cloud || !process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_WEBHOOK_SECRET) {
    return [];
  }

  const products = publicPlans().flatMap((plan) => {
    const monthlyId = getPolarProductId(plan, "monthly");
    const yearlyId = getPolarProductId(plan, "annual");
    return [
      ...(monthlyId ? [{ productId: monthlyId, slug: checkoutSlug(plan, "monthly") }] : []),
      ...(yearlyId ? [{ productId: yearlyId, slug: checkoutSlug(plan, "annual") }] : []),
    ];
  });

  const client = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });

  return [
    polar({
      client,
      // Creates the Polar customer with externalId = user id, which is what
      // applyCustomerState uses to attribute webhooks back to an account.
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products,
          successUrl: "/billing?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET,
          onCustomerStateChanged: async (payload) => {
            await applyCustomerState(
              payload.data as unknown as Parameters<typeof applyCustomerState>[0],
            );
          },
        }),
      ],
    }),
  ];
}

function magicLinkUrl(token: string, callbackURL: string): string {
  // Point at our own page rather than better-auth's verify endpoint: email
  // scanners pre-fetch links and would burn the one-time token before the
  // user ever clicks. See src/app/magic-link/magic-link-client.tsx.
  const base = process.env.BETTER_AUTH_URL ?? "";
  const params = new URLSearchParams({ token, callbackURL });
  return `${base}/magic-link?${params.toString()}`;
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Stays true in BOTH modes. It only gates better-auth's `signUpEmail`;
    // Google sign-in and magic link create users through their own paths, so
    // the cloud gets self-serve signup without ever opening a password-signup
    // endpoint (which would be an open spam vector).
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    // Password hashing/verification uses better-auth's built-in scrypt.
    // A custom hasher would have to go under `emailAndPassword.password.hash`
    // / `.verify` — placing it elsewhere is silently ignored. Any code that
    // creates credentials directly (e.g. accept-invite) MUST hash via
    // `auth.$context.password.hash` so the stored hash matches this path.
  },
  ...(googleSignIn ? { socialProviders: googleSignIn } : {}),
  plugins: [
    ...(cloud && isEmailConfigured()
      ? [
          magicLink({
            // The plugin's own `url` is deliberately ignored — magicLinkUrl()
            // builds a scanner-safe one instead.
            sendMagicLink: async ({ email, token }) => {
              const link = magicLinkUrl(token, "/projects");
              await sendEmail({
                to: email,
                subject: "Your ScopeGate sign-in link",
                text: `Sign in to ScopeGate: ${link}\n\nThis link expires in 5 minutes and can only be used once. If you didn't request it, you can ignore this email.`,
                html: `<p>Sign in to ScopeGate:</p><p><a href="${link}">Sign in</a></p><p>This link expires in 5 minutes and can only be used once. If you didn't request it, you can ignore this email.</p>`,
              });
            },
          }),
        ]
      : []),
    ...polarPlugin(),
    // nextCookies() must stay last — it wraps the response of every preceding
    // plugin to forward Set-Cookie through Next's server actions.
    nextCookies(),
  ],
});
