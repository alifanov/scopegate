import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";

// Client plugins are registered unconditionally: they only add request
// builders, so in self-hosted mode (where the server plugin is absent) the
// call simply 404s. Keeping them static means the client's types are identical
// in both deployments and no NEXT_PUBLIC_ flag is needed to shape them.
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), polarClient()],
});
