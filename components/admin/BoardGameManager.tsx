"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GAME_CATEGORIES, formatCategoryLabel, type GameCategory } from "@/lib/gameCategories";

type BoardGameRecord = {
  id: string;
  name: string;
  category: GameCategory;
  description: string | null;
  publisher: string | null;
  yearPublished: number | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMin: number;
  complexity: number | null;
  thumbnailUrl: string | null;
  bggId: number | null;
};

type BoardGameManagerProps = {
  boardGames: BoardGameRecord[];
};

type Feedback = { type: "success" | "error"; message: string };

type BoardGameFormState = {
  name: string;
  category: GameCategory;
  description: string;
  publisher: string;
  yearPublished: string;
  minPlayers: string;
  maxPlayers: string;
  playTimeMin: string;
  complexity: string;
  thumbnailUrl: string;
  bggId: string;
};

const EMPTY_FORM: BoardGameFormState = {
  name: "",
  category: GAME_CATEGORIES[0],
  description: "",
  publisher: "",
  yearPublished: "",
  minPlayers: "2",
  maxPlayers: "4",
  playTimeMin: "60",
  complexity: "2.0",
  thumbnailUrl: "",
  bggId: "",
};

function parseInteger(value: string, options: { min?: number } = {}) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  if (options.min !== undefined && parsed < options.min) return null;
  return parsed;
}

function parseFloatValue(value: string, options: { min?: number } = {}) {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  if (options.min !== undefined && parsed < options.min) return null;
  return parsed;
}

export default function BoardGameManager({ boardGames }: BoardGameManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<BoardGameFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const sortedBoardGames = useMemo(
    () => [...boardGames].sort((a, b) => a.name.localeCompare(b.name)),
    [boardGames],
  );

  function resetForm() {
    setFormState(EMPTY_FORM);
    setEditingId(null);
  }

  function populateForm(record: BoardGameRecord) {
    setFormState({
      name: record.name,
      category: record.category,
      description: record.description ?? "",
      publisher: record.publisher ?? "",
      yearPublished: record.yearPublished ? String(record.yearPublished) : "",
      minPlayers: String(record.minPlayers),
      maxPlayers: String(record.maxPlayers),
      playTimeMin: String(record.playTimeMin),
      complexity: record.complexity ? String(record.complexity) : "",
      thumbnailUrl: record.thumbnailUrl ?? "",
      bggId: record.bggId ? String(record.bggId) : "",
    });
    setEditingId(record.id);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const minPlayers = parseInteger(formState.minPlayers, { min: 1 });
    const maxPlayers = parseInteger(formState.maxPlayers, { min: 1 });
    const playTimeMin = parseInteger(formState.playTimeMin, { min: 5 });

    if (minPlayers === null || maxPlayers === null || playTimeMin === null) {
      setFeedback({
        type: "error",
        message: "Players and play time must be valid positive numbers.",
      });
      setIsSubmitting(false);
      return;
    }

    if (maxPlayers < minPlayers) {
      setFeedback({
        type: "error",
        message: "Maximum players must be greater than or equal to minimum players.",
      });
      setIsSubmitting(false);
      return;
    }

    const yearPublished = parseInteger(formState.yearPublished, { min: 1800 });
    const complexity = parseFloatValue(formState.complexity, { min: 0 });
    const bggId = parseInteger(formState.bggId, { min: 1 });

    if (formState.thumbnailUrl && !/^https?:\/\//i.test(formState.thumbnailUrl)) {
      setFeedback({
        type: "error",
        message: "Thumbnail URL must start with http or https.",
      });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: formState.name.trim(),
      category: formState.category,
      description: formState.description.trim() || null,
      publisher: formState.publisher.trim() || null,
      yearPublished: yearPublished,
      minPlayers,
      maxPlayers,
      playTimeMin,
      complexity,
      thumbnailUrl: formState.thumbnailUrl.trim() || null,
      bggId,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/board-games/${editingId}` : "/api/admin/board-games",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data?.error ?? "Unable to save board game.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: data?.message ?? (editingId ? "Board game updated." : "Board game created."),
      });
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Board game save failed:", error);
      setFeedback({
        type: "error",
        message: "Unexpected error while saving board game.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this board game? This cannot be undone.")) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/board-games/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({
          type: "error",
          message: data?.error ?? "Unable to delete board game.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: data?.message ?? "Board game deleted.",
      });
      if (editingId === id) {
        resetForm();
      }
      router.refresh();
    } catch (error) {
      console.error("Board game delete failed:", error);
      setFeedback({
        type: "error",
        message: "Unexpected error while deleting board game.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingId ? "Update board game" : "Add a board game"}
        </h2>
        <p className="text-sm text-gray-600">
          Keep the master list of well-known titles up to date. Community submissions can reference
          these records.
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

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Name
            <input
              required
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Catan"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Category
            <select
              value={formState.category}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  category: event.target.value as GameCategory,
                }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {GAME_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatCategoryLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700 lg:col-span-2">
            Description
            <textarea
              rows={3}
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Short summary to help players understand the game."
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Publisher
            <input
              value={formState.publisher}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, publisher: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Kosmos"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Year published
            <input
              type="number"
              min={1800}
              value={formState.yearPublished}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, yearPublished: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="1995"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Min players
            <input
              type="number"
              min={1}
              value={formState.minPlayers}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, minPlayers: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Max players
            <input
              type="number"
              min={1}
              value={formState.maxPlayers}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, maxPlayers: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Play time (minutes)
            <input
              type="number"
              min={5}
              value={formState.playTimeMin}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, playTimeMin: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Complexity (1-5)
            <input
              type="number"
              min={1}
              max={5}
              step="0.1"
              value={formState.complexity}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, complexity: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Thumbnail URL
            <input
              value={formState.thumbnailUrl}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="https://..."
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            BoardGameGeek ID
            <input
              type="number"
              min={1}
              value={formState.bggId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, bggId: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="13"
            />
          </label>

          <div className="flex gap-3 pt-2 lg:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : editingId ? "Update board game" : "Add board game"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Catalog entries</h2>
        <p className="text-sm text-gray-600">
          {sortedBoardGames.length === 0
            ? "No board games recorded yet."
            : "Edit or delete existing entries. All changes take effect immediately."}
        </p>

        {sortedBoardGames.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-semibold">Name</th>
                  <th className="px-4 py-2 font-semibold">Category</th>
                  <th className="px-4 py-2 font-semibold">Players</th>
                  <th className="px-4 py-2 font-semibold">Play time</th>
                  <th className="px-4 py-2 font-semibold">BGG ID</th>
                  <th className="px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedBoardGames.map((game) => (
                  <tr key={game.id} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{game.name}</div>
                      {game.publisher && (
                        <div className="text-xs text-gray-500">Publisher: {game.publisher}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatCategoryLabel(game.category)}</td>
                    <td className="px-4 py-3">
                      {game.minPlayers === game.maxPlayers
                        ? game.minPlayers
                        : `${game.minPlayers}-${game.maxPlayers}`}
                    </td>
                    <td className="px-4 py-3">{game.playTimeMin} min</td>
                    <td className="px-4 py-3">{game.bggId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => populateForm(game)}
                          className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          disabled={isSubmitting && editingId !== game.id}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(game.id)}
                          className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          disabled={isSubmitting}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

