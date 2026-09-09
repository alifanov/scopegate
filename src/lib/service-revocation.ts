import { revokeGoogleToken } from "@/lib/google-oauth";
import { revokeLinkedInToken } from "@/lib/linkedin-oauth";
import { getCredentialGroup } from "@/lib/provider-registry";

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
  const group = getCredentialGroup(provider);
  if (group === "google") {
    await revokeGoogle(token);
  } else if (group === "linkedin") {
    await revokeLinkedIn(token);
  }
}
