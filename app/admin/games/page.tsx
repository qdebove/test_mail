import GameManager from "@/components/admin/GameManager";
import { prisma } from "@/prisma";

export default async function AdminGamesPage() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      visibility: true,
      contributionType: true,
      createdAt: true,
      owner: {
        select: {
          email: true,
        },
      },
      boardGame: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const formatted = games.map((game) => ({
    ...game,
    createdAt: game.createdAt.toISOString(),
  }));

  return <GameManager games={formatted} />;
}

