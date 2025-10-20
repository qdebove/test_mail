"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GameCategory } from "@/lib/gameCategories";
import { formatCategoryLabel } from "@/lib/gameCategories";

type GameRecord = {
  id: string;
  name: string;
  category: GameCategory;
  visibility: "PUBLIC" | "FRIENDS" | "LINK";
  contributionType: "NONE" | "MONEY" | "ITEMS";
  createdAt: string;
  owner: {
    email: string | null;
  } | null;
  boardGame: {
    id: string;
    name: string;
  } | null;
};

type Feedback = { type: "success" | "error"; message: string };

const VISIBILITY_OPTIONS: GameRecord["visibility"][] = ["PUBLIC", "FRIENDS", "LINK"];
const CONTRIBUTION_OPTIONS: GameRecord["contributionType"][] = ["NONE", "MONEY", "ITEMS"];

type GameManagerProps = {
  games: GameRecord[];
};

export default function GameManager({ games }: GameManagerProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateGame(id: string, updates: Partial<GameRecord> & { boardGameId?: string | null }) {
    setPendingId(id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: data?.error ?? "Unable to update game." });
        return;
      }
      setFeedback({ type: "success", message: data?.message ?? "Game updated." });
      router.refresh();
    } catch (error) {
      console.error("Update game failed:", error);
      setFeedback({ type: "error", message: "Unexpected error while updating game." });
    } finally {
      setPendingId(null);
    }
  }

  async function deleteGame(id: string) {
    if (!window.confirm("Delete this game permanently?")) {
      return;
    }

    setPendingId(id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/games/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: data?.error ?? "Unable to delete game." });
        return;
      }
      setFeedback({ type: "success", message: data?.message ?? "Game deleted." });
      router.refresh();
    } catch (error) {
      console.error("Delete game failed:", error);
      setFeedback({ type: "error", message: "Unexpected error while deleting game." });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">User-submitted games</h2>
      <p className="text-sm text-gray-600">
        Moderate community submissions, adjust visibility, or connect them to curated board games.
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
              <th className="px-4 py-2 font-semibold">Game</th>
              <th className="px-4 py-2 font-semibold">Category</th>
              <th className="px-4 py-2 font-semibold">Owner</th>
              <th className="px-4 py-2 font-semibold">Visibility</th>
              <th className="px-4 py-2 font-semibold">Contribution</th>
              <th className="px-4 py-2 font-semibold">Board game link</th>
              <th className="px-4 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {games.map((game) => (
              <tr key={game.id} className="bg-white">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{game.name}</div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(game.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3">{formatCategoryLabel(game.category)}</td>
                <td className="px-4 py-3">{game.owner?.email ?? "Unknown"}</td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={game.visibility}
                    onChange={(event) => updateGame(game.id, { visibility: event.target.value })}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    disabled={pendingId === game.id}
                  >
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={game.contributionType}
                    onChange={(event) => updateGame(game.id, { contributionType: event.target.value })}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    disabled={pendingId === game.id}
                  >
                    {CONTRIBUTION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={game.boardGame?.id ?? ""}
                      placeholder="BoardGame ID"
                      onBlur={(event) =>
                        updateGame(game.id, {
                          boardGameId: event.currentTarget.value.length
                            ? event.currentTarget.value
                            : null,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none"
                      disabled={pendingId === game.id}
                    />
                    {game.boardGame?.name && (
                      <span className="text-xs text-gray-500">{game.boardGame.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => deleteGame(game.id)}
                    className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    disabled={pendingId === game.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No games have been posted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

