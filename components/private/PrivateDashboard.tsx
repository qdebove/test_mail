"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import SignOutButton from "@/components/SignOutButton";
import Spinner from "@/components/ui/Spinner";
import { GAME_CATEGORIES, type GameCategory, formatCategoryLabel } from "@/lib/gameCategories";

type Feedback = {
  type: "success" | "error";
  message: string;
};

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  address: string | null;
  addressComplement: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  admin: boolean;
};

type GameItem = {
  id: string;
  name: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number;
  thumbnailUrl: string | null;
  bggId: number | null;
  createdAt: string;
  addressSnapshot: string | null;
  visibility: "PUBLIC" | "FRIENDS" | "LINK";
  contributionType: "NONE" | "MONEY" | "ITEMS";
  contributionNote: string | null;
  boardGame?: {
    id: string;
    name: string;
    category: GameCategory;
    thumbnailUrl: string | null;
    bggId: number | null;
  } | null;
};

type PrivateDashboardProps = {
  user: UserProfile;
  initialGames: GameItem[];
  categories: GameCategory[];
};

const VISIBILITY_OPTIONS: GameItem["visibility"][] = ["PUBLIC", "FRIENDS", "LINK"];
const CONTRIBUTION_OPTIONS: GameItem["contributionType"][] = ["NONE", "MONEY", "ITEMS"];

const FRIENDLY_VISIBILITY_LABEL: Record<GameItem["visibility"], string> = {
  PUBLIC: "Public",
  FRIENDS: "Friends only",
  LINK: "By link",
};

const FRIENDLY_CONTRIBUTION_LABEL: Record<GameItem["contributionType"], string> = {
  NONE: "No contribution",
  MONEY: "Money",
  ITEMS: "Items",
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildAddressSummary(
  address: string | null | undefined,
  addressComplement: string | null | undefined,
  zipCode: string | null | undefined,
) {
  return [address, addressComplement, zipCode]
    .map((value) => (value ? value.trim() : ""))
    .filter((value) => value.length > 0)
    .join(", ") || null;
}

function formatCoordinate(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }

  return value.toFixed(6);
}

type AccountSettingsFormProps = {
  user: UserProfile;
  onUpdated: (user: UserProfile) => void;
  onFeedback: (feedback: Feedback) => void;
};

function AccountSettingsForm({ user, onUpdated, onFeedback }: AccountSettingsFormProps) {
  const [displayName, setDisplayName] = useState(user.name ?? "");
  const [imageUrl, setImageUrl] = useState(user.image ?? "");
  const [streetAddress, setStreetAddress] = useState(user.address ?? "");
  const [addressComplement, setAddressComplement] = useState(user.addressComplement ?? "");
  const [zipCode, setZipCode] = useState(user.zipCode ?? "");
  const [isAddressLocked, setIsAddressLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user.name ?? "");
    setImageUrl(user.image ?? "");
    setStreetAddress(user.address ?? "");
    setAddressComplement(user.addressComplement ?? "");
    setZipCode(user.zipCode ?? "");
    setIsAddressLocked(true);
  }, [user]);

  function handleToggleAddressLock() {
    if (isAddressLocked) {
      const confirmed = window.confirm(
        "Updating your address will recalculate your GPS coordinates. Continue?",
      );

      if (!confirmed) {
        return;
      }
    }

    setIsAddressLocked((previous) => !previous);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          image: imageUrl,
          address: streetAddress,
          addressComplement,
          zipCode,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        onFeedback({
          type: "error",
          message: payload?.error ?? "Unable to save your profile.",
        });
        return;
      }

      onUpdated(payload.user as UserProfile);
      setIsAddressLocked(true);
      onFeedback({
        type: "success",
        message: payload?.message ?? "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Profile update failed:", error);
      onFeedback({
        type: "error",
        message: "Unexpected error while saving your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Account settings</h2>
      <p className="mt-2 text-sm text-gray-600">
        Share a short name and your address details so every game keeps the right location snapshot.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-gray-700">
          Display name
          <input
            type="text"
            name="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Jane Doe"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Profile photo URL
          <input
            type="url"
            name="image"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="profile-address" className="text-sm font-medium text-gray-700">
              Street address
            </label>
            <button
              type="button"
              onClick={handleToggleAddressLock}
              className="flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <svg
                aria-hidden
                className="h-4 w-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                {isAddressLocked ? (
                  <path d="M7 11V7a5 5 0 0 1 10 0v4m-9 3h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" />
                ) : (
                  <>
                    <path d="M7 11V9a5 5 0 0 1 9-3" />
                    <path d="M9 14h7a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z" />
                  </>
                )}
              </svg>
              <span>{isAddressLocked ? "Locked" : "Unlocked"}</span>
              <span className="sr-only">
                {isAddressLocked ? "Unlock address fields" : "Lock address fields"}
              </span>
            </button>
          </div>
          <textarea
            id="profile-address"
            name="address"
            value={streetAddress}
            onChange={(event) => setStreetAddress(event.target.value)}
            placeholder="123 Rue de la République"
            rows={2}
            disabled={isAddressLocked}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          />
          <span className="mt-1 block text-xs text-gray-500">
            We store this as a snapshot when you create games or sessions.
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Address complement
            <input
              name="addressComplement"
              value={addressComplement}
              onChange={(event) => setAddressComplement(event.target.value)}
              placeholder="Bâtiment B, étage 3"
              disabled={isAddressLocked}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Zip code
            <input
              name="zipCode"
              value={zipCode}
              onChange={(event) => setZipCode(event.target.value.toUpperCase())}
              placeholder="75010"
              disabled={isAddressLocked}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Required to match players with nearby sessions.
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Latitude
            <input
              value={formatCoordinate(user.latitude)}
              readOnly
              className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-700"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Longitude
            <input
              value={formatCoordinate(user.longitude)}
              readOnly
              className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-700"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Coordinates refresh automatically when you save a new address.
        </p>

        <label className="block text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            value={user.email ?? ""}
            disabled
            readOnly
            className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}

type GameComposerProps = {
  onCreated: () => void;
  onFeedback: (feedback: Feedback) => void;
  userAddressSummary: string | null;
  userZipCode: string | null;
  hasStreetAddress: boolean;
  categories: GameCategory[];
};

function GameComposer({
  onCreated,
  onFeedback,
  userAddressSummary,
  userZipCode,
  hasStreetAddress,
  categories,
}: GameComposerProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GameCategory>(categories[0] ?? GAME_CATEGORIES[0]);
  const [minPlayers, setMinPlayers] = useState("2");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [durationMin, setDurationMin] = useState("60");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [bggId, setBggId] = useState("");
  const [visibility, setVisibility] = useState<GameItem["visibility"]>("PUBLIC");
  const [contributionType, setContributionType] = useState<GameItem["contributionType"]>("NONE");
  const [contributionNote, setContributionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const missingZip = !userZipCode;
  const missingAddress = !hasStreetAddress;
  const isLocationIncomplete = missingZip || missingAddress;

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] ?? GAME_CATEGORIES[0]);
    }
  }, [categories, category]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          minPlayers,
          maxPlayers,
          durationMin,
          thumbnailUrl,
          bggId,
          visibility,
          contributionType,
          contributionNote,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        onFeedback({
          type: "error",
          message: payload?.error ?? "Unable to create the game.",
        });
        return;
      }

      setName("");
      setCategory(categories[0] ?? GAME_CATEGORIES[0]);
      setMinPlayers("2");
      setMaxPlayers("4");
      setDurationMin("60");
      setThumbnailUrl("");
      setBggId("");
      setVisibility("PUBLIC");
      setContributionType("NONE");
      setContributionNote("");

      onFeedback({
        type: "success",
        message: payload?.message ?? "Game posted successfully.",
      });
      onCreated();
    } catch (error) {
      console.error("Game creation failed:", error);
      onFeedback({
        type: "error",
        message: "Unexpected error while creating the game.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Post a new game</h2>
      <p className="mt-2 text-sm text-gray-600">
        Every game stores your address snapshot ({userAddressSummary ?? "no address yet"}) and zip code ({userZipCode ?? "missing"}). Update your profile if you need to change where people meet.
      </p>
      {isLocationIncomplete && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {missingAddress && "Add a street address in your profile. "}
          {missingZip && "Add your zip code so players can find nearby sessions."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <label className="block text-sm font-medium text-gray-700">
            Game name
            <input
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Catan"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Category
            <select
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value as GameCategory)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {formatCategoryLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Thumbnail URL
          <input
            type="url"
            name="thumbnailUrl"
            value={thumbnailUrl}
            onChange={(event) => setThumbnailUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          BoardGameGeek ID (optional)
          <input
            type="number"
            name="bggId"
            value={bggId}
            onChange={(event) => setBggId(event.target.value)}
            min={1}
            placeholder="1234"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Visibility
            <select
              name="visibility"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as GameItem["visibility"])}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {FRIENDLY_VISIBILITY_LABEL[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Contribution
            <select
              name="contributionType"
              value={contributionType}
              onChange={(event) => setContributionType(event.target.value as GameItem["contributionType"])}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {CONTRIBUTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {FRIENDLY_CONTRIBUTION_LABEL[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Contribution note
          <textarea
            name="contributionNote"
            value={contributionNote}
            onChange={(event) => setContributionNote(event.target.value)}
            placeholder="Optional details about what participants should bring."
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || isLocationIncomplete}
          className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
        >
          {isSubmitting ? "Publishing..." : "Publish game"}
        </button>
      </form>
    </section>
  );
}

type SessionComposerProps = {
  onCreated?: () => void;
  onFeedback: (feedback: Feedback) => void;
  user: UserProfile;
};

function SessionComposer({ onCreated, onFeedback, user }: SessionComposerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [manualAddress, setManualAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileAddressSummary = buildAddressSummary(
    user.address,
    user.addressComplement,
    user.zipCode,
  );
  const hasProfileCoordinates =
    Boolean(user.address && user.address.trim().length > 0) &&
    typeof user.latitude === "number" &&
    typeof user.longitude === "number";

  const profileCoordinatesLabel = hasProfileCoordinates
    ? `${formatCoordinate(user.latitude)}°, ${formatCoordinate(user.longitude)}°`
    : "coordinates unavailable";

  const addressIncomplete = useProfileAddress && !hasProfileCoordinates;
  const manualAddressMissing = !useProfileAddress && manualAddress.trim().length === 0;

  function handleToggleAddressSource(event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    setUseProfileAddress(checked);
    if (checked) {
      setManualAddress("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/game-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startsAt,
          endsAt,
          capacity,
          useProfileAddress,
          manualAddress,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        onFeedback({
          type: "error",
          message: payload?.error ?? "Unable to create the session.",
        });
        return;
      }

      setTitle("");
      setDescription("");
      setStartsAt("");
      setEndsAt("");
      setCapacity("4");
      setUseProfileAddress(true);
      setManualAddress("");

      onFeedback({
        type: "success",
        message: payload?.message ?? "Session created successfully.",
      });
      onCreated?.();
    } catch (error) {
      console.error("Session creation failed:", error);
      onFeedback({
        type: "error",
        message: "Unexpected error while creating the session.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Host a new session</h2>
      <p className="mt-2 text-sm text-gray-600">
        Reuse your profile address ({profileAddressSummary ?? "no address yet"}) or pick a custom
        spot for special meetups.
      </p>
      {addressIncomplete && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Add a full address to your profile so we can include coordinates on the map.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-gray-700">
          Session title
          <input
            type="text"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Game night at my place"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Description
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Optional details about the games you'll host."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Starts
            <input
              type="datetime-local"
              name="startsAt"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Ends
            <input
              type="datetime-local"
              name="endsAt"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Capacity
          <input
            type="number"
            name="capacity"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            min={2}
            max={24}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={useProfileAddress}
              onChange={handleToggleAddressSource}
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span>
              Use my profile address ({profileAddressSummary ?? "no address saved"}) — {profileCoordinatesLabel}
            </span>
          </label>

          {!useProfileAddress && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700" htmlFor="session-manual-address">
                Custom address
              </label>
              <textarea
                id="session-manual-address"
                name="manualAddress"
                value={manualAddress}
                onChange={(event) => setManualAddress(event.target.value)}
                rows={2}
                placeholder="Leaky Cauldron Bar, 15 Wizard Alley, 75000 Paris"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || addressIncomplete || manualAddressMissing}
          className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create session"}
        </button>
      </form>
    </section>
  );
}

type GamesSearchProps = {
  query: string;
  category: string;
  categories: GameCategory[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  isFetching: boolean;
  onClear: () => void;
};

function GamesSearch({
  query,
  category,
  categories,
  onQueryChange,
  onCategoryChange,
  isFetching,
  onClear,
}: GamesSearchProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Search games</h2>
          <p className="mt-2 text-sm text-gray-600">
            Filter the catalog by title or category. Results update automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:mt-0"
        >
          Reset filters
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr_auto]">
        <label className="block text-sm font-medium text-gray-700">
          Game name
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by title"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Category
          <select
            name="category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {formatCategoryLabel(item)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <div className="text-xs text-gray-500">
            {isFetching ? "Updating..." : "Results auto-refresh"}
          </div>
        </div>
      </div>
    </section>
  );
}

type GamesListProps = {
  games: GameItem[];
  isFetching: boolean;
};

function GamesList({ games, isFetching }: GamesListProps) {
  if (isFetching) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="py-16">
          <Spinner label="Searching games..." size="lg" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
          No games match your filters yet. Try adjusting the search terms.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {games.map((game) => (
            <li key={game.id} className="px-0 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{game.name}</h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600">
                      {formatCategoryLabel(game.category)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {game.minPlayers === game.maxPlayers
                      ? `${game.minPlayers} players`
                      : `${game.minPlayers}-${game.maxPlayers} players`}{" "}
                    - {game.durationMin} min - {FRIENDLY_VISIBILITY_LABEL[game.visibility]} visibility
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Contribution: {FRIENDLY_CONTRIBUTION_LABEL[game.contributionType]}
                    {game.contributionNote ? ` - ${game.contributionNote}` : ""}
                  </p>

                  {game.boardGame && (
                    <p className="mt-1 text-sm text-gray-600">
                      Linked board game:{" "}
                      <span className="font-medium text-gray-900">{game.boardGame.name}</span>
                    </p>
                  )}

                  <p className="mt-1 text-sm text-gray-600">
                    Address snapshot: {game.addressSnapshot ?? "No address stored"}
                  </p>

                  {game.thumbnailUrl && (
                    <p className="mt-2 text-xs text-gray-500">
                      Thumbnail:{" "}
                      <a
                        className="underline hover:text-gray-700"
                        href={game.thumbnailUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {game.thumbnailUrl}
                      </a>
                    </p>
                  )}

                  {typeof game.bggId === "number" && (
                    <p className="mt-1 text-xs text-gray-500">
                      BoardGameGeek ID: {game.bggId}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-gray-500">
                  Added {formatDate(game.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PrivateDashboard({
  user: initialUser,
  initialGames,
  categories: initialCategories,
}: PrivateDashboardProps) {
  const [user, setUser] = useState(initialUser);
  const [games, setGames] = useState(initialGames);
  const [categories, setCategories] = useState(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFetchingGames, setIsFetchingGames] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const isFirstSearch = useRef(true);

  const handleFeedback = useCallback((value: Feedback) => {
    setFeedback(value);
  }, []);

  const refreshGames = useCallback(
    async (params?: { query?: string; category?: string }) => {
      const query = params?.query ?? searchQuery;
      const category = params?.category ?? categoryFilter;
      const search = new URLSearchParams();

      if (query) {
        search.set("q", query);
      }

      if (category && category !== "all") {
        search.set("category", category);
      }

      setIsFetchingGames(true);

      const searchQueryString = search.toString();
      const endpoint = searchQueryString ? `/api/games?${searchQueryString}` : "/api/games";

      try {
        const response = await fetch(endpoint);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to fetch games");
        }

        setGames(payload.games as GameItem[]);
        setCategories(payload.categories as GameCategory[]);
      } catch (error) {
        console.error("Fetching games failed:", error);
        setFeedback({
          type: "error",
          message: "Unable to load games. Please try again.",
        });
      } finally {
        setIsFetchingGames(false);
      }
    },
    [categoryFilter, searchQuery],
  );

  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      refreshGames({ query: searchQuery, category: categoryFilter });
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchQuery, categoryFilter, refreshGames]);

  const feedbackContent = useMemo(() => {
    if (!feedback) {
      return null;
    }

    const styles =
      feedback.type === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-green-200 bg-green-50 text-green-700";

    return (
      <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${styles}`}>
        {feedback.message}
      </div>
    );
  }, [feedback]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Private dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Welcome back, {user.name || user.email}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Update your account details, post new games, and explore the catalog shared by the community.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Signed in as{" "}
            <span className="font-semibold text-gray-800">{user.email}</span>
          </div>
          {user.admin && (
            <a
              href="/admin"
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              Open admin
            </a>
          )}
          <SignOutButton />
        </div>
      </div>

      {feedbackContent}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-8">
          <AccountSettingsForm
            user={user}
            onUpdated={(updated) => {
              setUser(updated);
            }}
            onFeedback={handleFeedback}
          />

          <SessionComposer
            user={user}
            onFeedback={handleFeedback}
            onCreated={() => {
              refreshGames({ query: searchQuery, category: categoryFilter });
            }}
          />
        </div>

        <GameComposer
          userAddressSummary={buildAddressSummary(user.address, user.addressComplement, user.zipCode)}
          userZipCode={user.zipCode}
          hasStreetAddress={Boolean(user.address && user.address.trim().length > 0)}
          categories={categories}
          onCreated={() => {
            refreshGames({ query: searchQuery, category: categoryFilter });
          }}
          onFeedback={handleFeedback}
        />
      </div>

      <div className="mt-8 space-y-6">
        <GamesSearch
          query={searchQuery}
          category={categoryFilter}
          categories={categories}
          isFetching={isFetchingGames}
          onQueryChange={setSearchQuery}
          onCategoryChange={setCategoryFilter}
          onClear={() => {
            setSearchQuery("");
            setCategoryFilter("all");
            refreshGames({ query: "", category: "all" });
          }}
        />

        <GamesList games={games} isFetching={isFetchingGames} />
      </div>
    </main>
  );
}

