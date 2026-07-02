"use client";

/**
 * components/AuthProvider.tsx
 *
 * React context wrapping the Nhost browser client. Exposes the current session
 * plus sign in / sign up / sign out actions. The SDK persists the session and
 * refreshes JWTs automatically; we subscribe to its session-change events so
 * the whole app re-renders on login/logout.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { StoredSession } from "@nhost/nhost-js/session";
import { FetchError } from "@nhost/nhost-js/fetch";
import { getNhost } from "@/lib/nhost/client";
import {
  type Role,
  type UserType,
  userTypeForRole,
} from "@/lib/nhost/roles";

export interface SignUpParams {
  email: string;
  password: string;
  role: Role;
  zipCode?: string;
}

interface AuthContextValue {
  session: StoredSession | null;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  /** Gravatar URL Nhost derives from the email (may resolve to a blank image). */
  avatarUrl: string | null;
  emailVerified: boolean;
  zipCode: string | null;
  role: Role | null;
  userType: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Signs in. Throws with a friendly message on failure. */
  signIn: (email: string, password: string) => Promise<void>;
  /**
   * Registers a new account. Returns whether email verification is required
   * before the user can sign in (true on Nhost projects with verification on).
   */
  signUp: (params: SignUpParams) => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  /** Re-sends the verification email for an address that hasn't verified yet. */
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** True when the SDK error is Nhost's "email not verified yet" rejection. */
export function isUnverifiedError(err: unknown): boolean {
  if (err instanceof FetchError) {
    const body = err.body as { error?: string } | undefined;
    return body?.error === "unverified-user";
  }
  return false;
}

/** Pulls a human-readable message out of whatever the SDK threw. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof FetchError) {
    const body = err.body as { message?: string; error?: string } | undefined;
    return body?.message || body?.error || err.message || "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

/** Where Nhost should redirect after the user clicks the email verification link. */
function verifyRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/verify`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const nhost = getNhost();
    // Seed from any persisted session, then track changes.
    setSession(nhost.getUserSession());
    setIsLoading(false);
    const unsubscribe = nhost.sessionStorage.onChange((next) => {
      setSession(next);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const nhost = getNhost();
    await nhost.auth.signInEmailPassword({ email, password });
    // onChange updates state; also set eagerly for immediate consumers.
    setSession(nhost.getUserSession());
  }, []);

  const signUp = useCallback(
    async ({ email, password, role, zipCode }: SignUpParams) => {
      const nhost = getNhost();
      const res = await nhost.auth.signUpEmailPassword({
        email,
        password,
        options: {
          redirectTo: verifyRedirectUrl(),
          metadata: {
            user_type: userTypeForRole(role),
            role,
            zip_code: zipCode || null,
          },
        },
      });
      // With email verification on, no session is returned until verified.
      const needsVerification = !res.body?.session;
      if (!needsVerification) {
        setSession(nhost.getUserSession());
      }
      return { needsVerification };
    },
    []
  );

  const resendVerification = useCallback(async (email: string) => {
    const nhost = getNhost();
    await nhost.auth.sendVerificationEmail({
      email,
      options: { redirectTo: verifyRedirectUrl() },
    });
  }, []);

  const signOut = useCallback(async () => {
    const nhost = getNhost();
    const current = nhost.getUserSession();
    try {
      if (current?.refreshToken) {
        await nhost.auth.signOut({ refreshToken: current.refreshToken });
      }
    } finally {
      nhost.clearSession();
      setSession(null);
    }
  }, []);

  const user = session?.user;
  const value: AuthContextValue = {
    session,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    displayName: user?.displayName || null,
    avatarUrl: user?.avatarUrl || null,
    emailVerified: user?.emailVerified ?? false,
    zipCode: metaString(user?.metadata, "zip_code"),
    role: metaString(user?.metadata, "role") as Role | null,
    userType: metaString(user?.metadata, "user_type") as UserType | null,
    isAuthenticated: !!session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
