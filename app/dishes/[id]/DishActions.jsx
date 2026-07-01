"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { hasAdminSecret } from "@/lib/admin-client";

// Dish-page actions: "Suggest an edit" is public; the direct "Edit recipe" link
// only appears for admins (admin secret stored locally). The PATCH endpoint is
// still gated server-side, so this is just hiding the link, not the security.
export function DishActions({ dishId }) {
  const [admin, setAdmin] = useState(false);
  useEffect(() => { setAdmin(hasAdminSecret()); }, []);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dishes/${dishId}/suggest`}
        className="rounded-lg border border-apb px-3 py-1.5 text-sm font-semibold text-apb transition hover:bg-apb hover:text-white"
      >
        Suggest an edit
      </Link>
      {admin ? (
        <Link
          href={`/dishes/${dishId}/edit`}
          className="rounded-lg bg-apb px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-apb-light"
        >
          Edit recipe
        </Link>
      ) : null}
    </div>
  );
}
