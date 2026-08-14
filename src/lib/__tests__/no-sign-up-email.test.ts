import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// `disableSignUp: true` in auth.ts permanently closes `auth.api.signUpEmail`,
// so any call to it throws EMAIL_PASSWORD_SIGN_UP_DISABLED at runtime. Task #229
// found exactly that: admin bootstrap on a fresh self-host silently failed and
// left a database with zero users — a UI nobody could log into. Credential users
// must be created via `createCredentialUser` / `acceptInvite` instead.
const SRC = path.join(__dirname, "..", "..");

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return tsFiles(full);
    return /\.tsx?$/.test(entry) && entry !== "no-sign-up-email.test.ts"
      ? [full]
      : [];
  });
}

describe("signUpEmail is never called", () => {
  it("no source file calls auth.api.signUpEmail", () => {
    const offenders = tsFiles(SRC).filter((file) =>
      readFileSync(file, "utf8").includes("signUpEmail(")
    );

    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
