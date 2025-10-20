"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SessionRecord = {
  id: string;
  sessionToken: string;
  expires: string;
  userId: string;
  user: {
    email: string | null;
  } | null;
};

type Feedback = { type: "success" | "error"; message: string };

type SessionManagerProps = {
  sessions: SessionRecord[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function truncateToken(token: string, size = 12) {
  return token.length <= size ? token : `${token.slice(0, size)}…`;
}

export default function SessionManager({ sessions }: SessionManagerProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleDelete(id: string) {
    setPendingId(id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: data?.error ?? "Unable to delete session." });
        return;
      }
      setFeedback({ type: "success", message: data?.message ?? "Session deleted." });
      router.refresh();
    } catch (error) {
      console.error("Delete session failed:", error);
      setFeedback({ type: "error", message: "Unexpected error while deleting session." });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Active sessions</h2>
      <p className="text-sm text-gray-600">
        Revoke sessions to force a re-login when users encounter issues or lose their device.
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
              <th className="px-4 py-2 font-semibold">User</th>
              <th className="px-4 py-2 font-semibold">Token</th>
              <th className="px-4 py-2 font-semibold">Expires</th>
              <th className="px-4 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <tr key={session.id} className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {session.user?.email ?? session.userId}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {truncateToken(session.sessionToken)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(session.expires)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(session.id)}
                    className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    disabled={pendingId === session.id}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No active sessions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

