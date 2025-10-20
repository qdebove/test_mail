"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  admin: boolean;
  address: string | null;
  addressComplement: string | null;
  zipCode: string | null;
};

type Feedback = { type: "success" | "error"; message: string };

type UserManagerProps = {
  users: UserRecord[];
};

const EMPTY_FORM = {
  email: "",
  name: "",
  address: "",
  addressComplement: "",
  zipCode: "",
  admin: false,
};

export default function UserManager({ users }: UserManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingUser, setPendingUser] = useState<string | null>(null);

  async function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: data?.error ?? "Unable to create user." });
        return;
      }
      setFeedback({ type: "success", message: data?.message ?? "User created." });
      setFormState(EMPTY_FORM);
      router.refresh();
    } catch (error) {
      console.error("Create user failed:", error);
      setFeedback({ type: "error", message: "Unexpected error while creating user." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateUser(id: string, payload: Partial<UserRecord>) {
    setPendingUser(id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: data?.error ?? "Unable to update user." });
        return;
      }
      setFeedback({ type: "success", message: data?.message ?? "User updated." });
      router.refresh();
    } catch (error) {
      console.error("Update user failed:", error);
      setFeedback({ type: "error", message: "Unexpected error while updating user." });
    } finally {
      setPendingUser(null);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Delete this user account? This will remove all associated data.")) {
      return;
    }

    setPendingUser(id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: data?.error ?? "Unable to delete user." });
        return;
      }
      setFeedback({ type: "success", message: data?.message ?? "User deleted." });
      router.refresh();
    } catch (error) {
      console.error("Delete user failed:", error);
      setFeedback({ type: "error", message: "Unexpected error while deleting user." });
    } finally {
      setPendingUser(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Invite or create a user</h2>
        <p className="text-sm text-gray-600">
          Create placeholder accounts or promote teammates to administrators.
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

        <form onSubmit={submitUser} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Email
            <input
              type="email"
              required
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="person@example.com"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Name
            <input
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Optional display name"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Zip code
            <input
              value={formState.zipCode}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, zipCode: event.target.value.toUpperCase() }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 uppercase"
              placeholder="75010"
            />
          </label>

          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Street address
            <textarea
              value={formState.address}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, address: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="123 Rue de la République"
              rows={2}
            />
          </label>

          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Address complement
            <input
              value={formState.addressComplement}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, addressComplement: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Bâtiment B, étage 3"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={formState.admin}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, admin: event.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
            />
            Grant admin access
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Existing users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Address</th>
                <th className="px-4 py-2 font-semibold">Complement</th>
                <th className="px-4 py-2 font-semibold">Zip</th>
                <th className="px-4 py-2 font-semibold">Admin</th>
                <th className="px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="bg-white">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={user.name ?? ""}
                      onBlur={(event) =>
                        updateUser(user.id, { name: event.currentTarget.value || null })
                      }
                      className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      defaultValue={user.address ?? ""}
                      onBlur={(event) =>
                        updateUser(user.id, { address: event.currentTarget.value || null })
                      }
                      className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                      rows={2}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={user.addressComplement ?? ""}
                      onBlur={(event) =>
                        updateUser(user.id, { addressComplement: event.currentTarget.value || null })
                      }
                      className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={user.zipCode ?? ""}
                      onBlur={(event) =>
                        updateUser(user.id, {
                          zipCode: event.currentTarget.value ? event.currentTarget.value.toUpperCase() : null,
                        })
                      }
                      className="w-full rounded border border-gray-200 px-2 py-1 text-sm uppercase focus:border-gray-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        defaultChecked={user.admin}
                        onChange={(event) => updateUser(user.id, { admin: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      Admin
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteUser(user.id)}
                      className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      disabled={pendingUser === user.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
