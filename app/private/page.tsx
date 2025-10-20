import PrivateDashboard from "@/components/private/PrivateDashboard";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import { prisma } from "@/prisma";
import { GAME_CATEGORIES } from "@/lib/gameCategories";

export default async function PrivatePage() {
  const session = await auth();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Access denied</h1>
          <p className="mt-3 text-gray-600">
            You must be signed in to view this page.
          </p>
          <a
            className="mt-6 inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
            href="/login"
          >
            Go to login
          </a>
        </div>
      </main>
    );
  }

  const sessionUser = session.user as {
    id?: string | null;
    email?: string | null;
    name?: string | null;
  };

  let userRecord =
    sessionUser?.id
      ? await prisma.user.findUnique({
          where: { id: sessionUser.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            address: true,
            addressComplement: true,
            zipCode: true,
            admin: true,
          },
        })
      : null;

  if (!userRecord && sessionUser?.email) {
    userRecord = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        address: true,
        addressComplement: true,
        zipCode: true,
        admin: true,
      },
    });
  }

  if (!userRecord) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Account not found</h1>
          <p className="mt-3 text-gray-600">
            We were not able to locate your user record. Please sign out and try again.
          </p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }

  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      boardGame: {
        select: {
          id: true,
          name: true,
          category: true,
          thumbnailUrl: true,
          bggId: true,
        },
      },
    },
  });

  const initialGames = games.map((game) => ({
    id: game.id,
    name: game.name,
    category: game.category,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    durationMin: game.durationMin,
    thumbnailUrl: game.thumbnailUrl,
    bggId: game.bggId,
    createdAt: game.createdAt.toISOString(),
    addressSnapshot: game.addressSnapshot,
    visibility: game.visibility,
    contributionType: game.contributionType,
    contributionNote: game.contributionNote,
    boardGame: game.boardGame
      ? {
          id: game.boardGame.id,
          name: game.boardGame.name,
          category: game.boardGame.category,
          thumbnailUrl: game.boardGame.thumbnailUrl,
          bggId: game.boardGame.bggId,
        }
      : null,
  }));

  return (
    <PrivateDashboard
      user={userRecord}
      initialGames={initialGames}
      categories={GAME_CATEGORIES}
    />
  );
}
