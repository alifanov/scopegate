export function isAdmin(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}
