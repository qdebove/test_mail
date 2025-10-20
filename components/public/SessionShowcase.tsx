"use client";

import { useMemo, useState } from "react";

type SessionSummary = {
  id: string;
  title: string;
  startsAt: string;
  addressSummary: string | null;
  zipCode: string | null;
  hostName: string | null;
  capacity: number;
  acceptedCount: number;
  games: string[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type SessionShowcaseProps = {
  sessions: SessionSummary[];
};

function formatSessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date TBD";
  }

  return dateFormatter.format(date);
}

export default function SessionShowcase({ sessions }: SessionShowcaseProps) {
  const [zipFilter, setZipFilter] = useState("");

  const normalizedFilter = zipFilter.trim().toUpperCase();

  const filteredSessions = useMemo(() => {
    if (!normalizedFilter) {
      return sessions;
    }

    return sessions.filter((session) =>
      session.zipCode ? session.zipCode.toUpperCase().startsWith(normalizedFilter) : false,
    );
  }, [sessions, normalizedFilter]);

  const headline = normalizedFilter
    ? `Sessions near ${normalizedFilter}`
    : "Upcoming sessions waiting for players";

  return (
    <section id="sessions" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{headline}</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Tell us your zip code so we can automatically focus on nearby events. Sign in later to
              save it to your profile.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm font-medium text-gray-700">
              Zip code
              <input
                value={zipFilter}
                onChange={(event) => setZipFilter(event.target.value.toUpperCase())}
                placeholder="Enter your zip"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </label>
            {zipFilter && (
              <button
                type="button"
                onClick={() => setZipFilter("")}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {filteredSessions.length === 0 ? (
            <div className="lg:col-span-3">
              <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                No open sessions match this zip code yet. Create an account to start one!
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const accepted = session.acceptedCount;
              const spotsLeft = Math.max(session.capacity - accepted, 0);
              return (
                <article
                  key={session.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                      <span>{formatSessionDate(session.startsAt)}</span>
                      <span>{session.zipCode ?? "???"}</span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900">{session.title}</h3>
                    <p className="text-sm text-gray-600">
                      {session.addressSummary ?? "Location to be shared with attendees"}
                    </p>

                    {session.games.length > 0 && (
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Games:{" "}
                        <span className="text-sm normal-case text-gray-700">
                          {session.games.join(", ")}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                    <div>
                      Host:{" "}
                      <span className="font-medium text-gray-900">
                        {session.hostName ?? "Mystery organiser"}
                      </span>
                    </div>
                    <div className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                      {spotsLeft > 0 ? `${spotsLeft} seats left` : "Waitlist only"}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
