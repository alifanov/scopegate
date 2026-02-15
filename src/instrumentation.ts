export async function onRequestError() {
  // Required export for instrumentation file
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAdminUser } = await import("./lib/bootstrap");
    try {
      await ensureAdminUser();
    } catch (err) {
      console.error("[ScopeGate] Failed to bootstrap admin user:", err);
    }
  }
}
