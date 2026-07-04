"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { landingPathForUserType } from "@/lib/nhost/roles";

/**
 * On the landing page, a signed-in user is sent straight to their section:
 * businesses to /recipes, consumers to /dishes. Renders nothing.
 */
export function LandingRedirect() {
  const router = useRouter();
  const { isLoading, isAuthenticated, userType } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(landingPathForUserType(userType));
    }
  }, [isLoading, isAuthenticated, userType, router]);

  return null;
}
