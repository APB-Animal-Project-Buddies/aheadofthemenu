"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";

/**
 * Auth controls for the landing header. The landing is a server component and
 * SiteNav is hidden there, so this client component reflects the session:
 * logged out → Log in / Sign up; logged in → avatar + name linking to /profile.
 */
export function LandingAuth() {
  const { isLoading, isAuthenticated, email, displayName, avatarUrl, handle } = useAuth();

  if (isLoading) return <span aria-hidden style={{ width: 80 }} />;

  if (!isAuthenticated) {
    return (
      <>
        <Link className="aotm-auth-login" href="/login">Log in</Link>
        <Link className="aotm-auth-signup" href="/register">Sign up</Link>
      </>
    );
  }

  const name = displayName || (handle ? `@${handle}` : email ?? "Account");
  return (
    <Link className="aotm-auth-account" href="/profile" title="Your profile">
      <Avatar email={email} displayName={displayName} avatarUrl={avatarUrl} size={30} />
      <span className="aotm-auth-name">{name}</span>
    </Link>
  );
}
