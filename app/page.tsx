import Link from "next/link";
import SessionShowcase from "@/components/public/SessionShowcase";
import SessionMap from "@/components/public/SessionMap";
import { prisma } from "@/prisma";

type SessionForDisplay = {
  id: string;
  title: string;
  startsAt: string;
  addressSummary: string | null;
  zipCode: string | null;
  hostName: string | null;
  capacity: number;
  acceptedCount: number;
  games: string[];
  latitude: number | null;
  longitude: number | null;
};

function formatAddress(address?: string | null, zipCode?: string | null) {
  return [address, zipCode].filter((value) => value && value.length > 0).join(", ") || null;
}

export default async function Home() {
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 12);

  const upcomingSessions = await prisma.gameSession.findMany({
    where: {
      status: "OPEN",
      startsAt: {
        gte: twelveHoursAgo,
      },
    },
    orderBy: { startsAt: "asc" },
    take: 12,
    include: {
      host: {
        select: {
          name: true,
          zipCode: true,
        },
      },
      games: {
        include: {
          game: {
            select: {
              name: true,
            },
          },
        },
      },
      rsvps: {
        select: {
          status: true,
        },
      },
    },
  });

  const sessionsForDisplay: SessionForDisplay[] = upcomingSessions.map((session) => {
    const acceptedCount = session.rsvps.reduce(
      (total, rsvp) => (rsvp.status === "ACCEPTED" ? total + 1 : total),
      0,
    );
    const games = session.games
      .map((entry) => entry.game?.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 3);

    return {
      id: session.id,
      title: session.title,
      startsAt: session.startsAt.toISOString(),
      addressSummary: formatAddress(session.addressApprox, session.host?.zipCode ?? null),
      zipCode: session.host?.zipCode ?? null,
      hostName: session.host?.name ?? null,
      capacity: session.capacity,
      acceptedCount,
      games,
      latitude: session.latitude,
      longitude: session.longitude,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-gray-900">
            GatherPlay
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#goal" className="hover:text-gray-900">
              Goal
            </a>
            <a href="#sessions" className="hover:text-gray-900">
              Sessions
            </a>
            <a href="#map" className="hover:text-gray-900">
              Map
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:border-gray-300 hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="goal" className="mx-auto mt-16 max-w-6xl scroll-mt-20 px-4">
          <div className="grid items-center gap-10 rounded-3xl border border-gray-200 bg-white p-10 shadow-sm md:grid-cols-2">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Board game nights, organised
              </span>
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Find your next table in minutes
              </h1>
              <p className="text-lg text-gray-600">
                GatherPlay&apos;s mission is to connect nearby board gamers. Share your zip code,
                host availability, and favourite titles so we can match players with the perfect
                sessions before seats run out.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
                >
                  Sign in to host
                </Link>
                <a
                  href="#sessions"
                  className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                >
                  See open sessions
                </a>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Why GatherPlay?
              </h2>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>
                  <span className="font-medium text-gray-900">Smart matching:</span> zip codes power
                  automatic suggestions for the closest tables.
                </li>
                <li>
                  <span className="font-medium text-gray-900">Live availability:</span> hosts see
                  remaining seats and waitlists at a glance.
                </li>
                <li>
                  <span className="font-medium text-gray-900">Community curated:</span> share your
                  collection and inspire new sessions together.
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                Ready to browse? Scroll down for a live snapshot of upcoming games near our community
                hubs.
              </p>
            </div>
          </div>
        </section>

        <SessionShowcase sessions={sessionsForDisplay} />
        <SessionMap sessions={sessionsForDisplay} />

        <section className="mx-auto mt-16 max-w-6xl px-4 pb-20">
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 p-10 text-white shadow-sm">
            <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold">
                  Ready to unlock automatic recommendations?
                </h2>
                <p className="text-sm text-gray-100/90">
                  Create a free account, share your address details once, and GatherPlay will keep
                  everyone in sync. Hosting or joining a board game night has never been easier.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
                >
                  Sign in or create an account
                </Link>
                <span className="text-xs uppercase tracking-wide text-gray-200/80">
                  No spam. Cancel anytime.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
