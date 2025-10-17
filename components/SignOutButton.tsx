"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
    >
      Se déconnecter
    </button>
  );
}
