import { revokeGoogleToken } from "@/lib/google-oauth";
import { revokeLinkedInToken } from "@/lib/linkedin-oauth";

const GOOGLE_PROVIDERS = new Set(["gmail", "calendar", "drive", "googleAds", "searchConsole"]);

type RevokeOptions = {
  revokeGoogle?: typeof revokeGoogleToken;
  revokeLinkedIn?: typeof revokeLinkedInToken;
};

/** Best-effort: revocation failures are logged by the caller, not thrown. */
export async function revokeProviderToken(
  provider: string,
  token: string,
  { revokeGoogle = revokeGoogleToken, revokeLinkedIn = revokeLinkedInToken }: RevokeOptions = {}
): Promise<void> {
  if (GOOGLE_PROVIDERS.has(provider)) {
    await revokeGoogle(token);
  } else if (provider === "linkedin") {
    await revokeLinkedIn(token);
  }
}
