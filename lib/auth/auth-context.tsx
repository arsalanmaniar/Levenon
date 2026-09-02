"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Client-side auth (client brief, 2026-09-02) — no backend, deliberately:
 * accounts and the active session both live in `localStorage`, not a
 * database. This is the one deliberate exception to this project's
 * "nothing persists past the tab" rule that the cart and wishlist
 * providers both still hold to (see their own doc comments) — identity is
 * the one thing a "sign in" feature cannot be ephemeral about, or it
 * wouldn't be sign-in at all.
 *
 * TODO(real backend): this whole module is a placeholder, not a security
 * boundary. `hashPassword` is `btoa` — base64 *encoding*, trivially
 * reversible by anyone who opens devtools, not a hash. Every account,
 * every password, lives in plaintext-adjacent form in the browser's own
 * localStorage, readable by any script that runs on this origin. Replace
 * with a real auth provider (NextAuth, Clerk, a real API behind bcrypt/
 * argon2) before this is anything but a prototype.
 */

export type AuthUser = { name: string; email: string };

type StoredAccount = { name: string; email: string; passwordHash: string };

type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the mount-time localStorage read resolves — see the doc
   * comment on `AuthProvider` for why callers should wait on this rather
   * than trusting `user === null` immediately. */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => AuthResult;
  signup: (name: string, email: string, password: string) => AuthResult;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "levenon_user";
const ACCOUNTS_KEY = "levenon_accounts";

/** TODO(real backend): replace with a real server-side hash. `btoa` is encoding, not encryption — see the module doc comment. */
function hashPassword(password: string): string {
  return window.btoa(password);
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]): void {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/**
 * `isLoading` starts `true` and only resolves inside a mount effect — the
 * server (and the very first client render, before hydration) has no way
 * to read localStorage, so a page that gates on `user` alone would flash
 * "signed out" for a real returning customer on every load. Callers that
 * change what they render based on auth state (the nav, the wishlist page)
 * should hold their normal loading/skeleton state until this clears,
 * exactly the same "mounted gate" `ThemeToggle` already uses for the same
 * reason.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // Corrupt or foreign value under the same key — treat as signed out
      // rather than throwing during hydration.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((email: string, password: string): AuthResult => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = readAccounts().find((candidate) => candidate.email === normalizedEmail);
    if (!account || account.passwordHash !== hashPassword(password)) {
      return { ok: false, error: "Email or password incorrect" };
    }
    const nextUser: AuthUser = { name: account.name, email: account.email };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return { ok: true };
  }, []);

  const signup = useCallback((name: string, email: string, password: string): AuthResult => {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readAccounts();
    if (accounts.some((candidate) => candidate.email === normalizedEmail)) {
      return { ok: false, error: "An account with this email already exists" };
    }
    const account: StoredAccount = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    };
    writeAccounts([...accounts, account]);
    const nextUser: AuthUser = { name: account.name, email: account.email };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, signup, logout }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
