import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

// ---------------------------------------------------------------------------
// Synchronous user cache
// Components like DashboardNavbar call getUser() synchronously during render.
// We warm this cache from the existing session on module load and keep it
// updated via onAuthStateChange so it's always current.
// ---------------------------------------------------------------------------
let _cachedUser: AuthUser | null = null;

function sessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.user_metadata?.name as string | undefined,
  };
}

// Warm cache immediately from the persisted Supabase session (IndexedDB/localStorage)
supabase.auth.getSession().then(({ data: { session } }) => {
  _cachedUser = sessionToUser(session);
});

// Keep cache in sync with any subsequent auth events (login, logout, token refresh)
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = sessionToUser(session);
});

// ---------------------------------------------------------------------------
// Public API — same signatures as the old auth.ts so no call sites change
// ---------------------------------------------------------------------------

export function getUser(): AuthUser | null {
  return _cachedUser;
}

/** @deprecated Use getUser() — kept so any stray getToken() calls don't crash */
export function getToken(): string | null {
  return null;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const user = sessionToUser(data.session);
  if (!user) throw new Error("Login failed — no session returned");
  _cachedUser = user;
  return user;
}

export async function signup(email: string, password: string, name?: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name ?? "" } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Signup failed — no user returned");

  // Create the profile row. upsert is safe on duplicate signups.
  await supabase.from("profiles").upsert({
    id: data.user.id,
    email,
    name: name ?? null,
  });

  const user: AuthUser = { id: data.user.id, email, name };
  _cachedUser = user;
  return user;
}

export function logout(): void {
  supabase.auth.signOut().then(() => {
    _cachedUser = null;
    window.location.href = "/login";
  });
}

/** Kept for any call sites that still reference clearSession() */
export function clearSession(): void {
  supabase.auth.signOut();
  _cachedUser = null;
}

// ---------------------------------------------------------------------------
// apiFetch — attaches the live Supabase session token as Bearer
// ---------------------------------------------------------------------------
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    await supabase.auth.signOut();
    _cachedUser = null;
    window.location.href = "/login";
  }

  return res;
}
