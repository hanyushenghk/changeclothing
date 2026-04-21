/**
 * Supabase Auth uses email+password. We derive a deterministic synthetic email from
 * the user's chosen username so the UI can stay "username + password" only.
 * The address is not used for real mail.
 */
export async function usernameToAuthEmail(username: string): Promise<string> {
  const normalized = username.trim().toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex}@gmail.com`;
}
