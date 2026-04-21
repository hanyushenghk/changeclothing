/**
 * Row shape for public.users (application profile).
 * Passwords are stored only in Supabase Auth (auth.users), never in this table.
 */
export type UserProfileRow = {
  id: string;
  /** Public handle / login id chosen or generated at signup */
  userid: string;
  /** Display name */
  name: string | null;
  /** Denormalized from auth for convenience; source of truth is auth.users */
  email: string | null;
  created_at: string;
  updated_at: string;
};
