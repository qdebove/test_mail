"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountRecord = {
  id: string;
  userId: string;
  provider: string;
  type: string;
  providerAccountId: string;
  scope: string | null;
  user: {
    email: string | null;
  } | null;
};

type AccountManagerProps = {
  accounts: AccountRecord[];
};

type Feedback = { type: "success" | "error"; message: string };

export default function AccountManager({ accounts }: AccountManagerProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleDelete(accountId: string) {
    if (!window.confirm("Delete this account connection?")) {
      return;
    }

    setPendingId(accountId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/accounts/${accountId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: data?.error ?? "Unable to delete account." });
        return;
      }
      setFeedback({ type: "success", message: data?.message ?? "Account deleted." });
      router.refresh();
    } catch (error) {
      console.error("Delete account failed:", error);
      setFeedback({ type: "error", message: "Unexpected error while deleting account." });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Linked accounts</h2>
      <p className="text-sm text-gray-600">
        Remove stale OAuth connections to troubleshoot authentication problems.
      </p>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-700">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 font-semibold">Provider</th>
              <th className="px-4 py-2 font-semibold">Account ID</th>
              <th className="px-4 py-2 font-semibold">User</th>
              <th className="px-4 py-2 font-semibold">Scope</th>
              <th className="px-4 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.map((account) => (
              <tr key={account.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {account.provider} <span className="text-xs text-gray-500">({account.type})</span>
                </td>
                <td className="px-4 py-3">{account.providerAccountId}</td>
                <td className="px-4 py-3">{account.user?.email ?? account.userId}</td>
                <td className="px-4 py-3">{account.scope ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(account.id)}
                    className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    disabled={pendingId === account.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No linked accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

