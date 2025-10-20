import { prisma } from "@/prisma";

export default async function AdminOverviewPage() {
  const [boardGamesCount, gamesCount, usersCount, accountsCount, sessionsCount] = await Promise.all([
    prisma.boardGame.count(),
    prisma.game.count(),
    prisma.user.count(),
    prisma.account.count(),
    prisma.session.count(),
  ]);

  const stats = [
    { label: "Board games", value: boardGamesCount },
    { label: "User-submitted games", value: gamesCount },
    { label: "Users", value: usersCount },
    { label: "Accounts", value: accountsCount },
    { label: "Sessions", value: sessionsCount },
  ];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold text-gray-900">Quick stats</h2>
        <p className="mt-2 text-sm text-gray-600">
          A snapshot of the data you can manage from the admin area.
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-800 shadow-sm"
            >
              <dt className="text-sm text-gray-500">{item.label}</dt>
              <dd className="mt-2 text-3xl font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Getting started</h2>
        <p className="text-sm text-gray-600">
          Use the navigation above to curate the official board game catalog, maintain user accounts,
          and moderate active sessions.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
          <li>
            <strong>Board games</strong>: keep a high-quality reference catalog used by game creators.
          </li>
          <li>
            <strong>Users</strong>: promote community members to admins or update their profile data.
          </li>
          <li>
            <strong>Accounts & sessions</strong>: troubleshoot authentication issues quickly.
          </li>
          <li>
            <strong>Games</strong>: moderate user submissions that reference or diverge from the core catalog.
          </li>
        </ul>
      </section>
    </div>
  );
}

