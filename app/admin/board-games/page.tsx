import BoardGameManager from "@/components/admin/BoardGameManager";
import { prisma } from "@/prisma";

export default async function AdminBoardGamesPage() {
  const boardGames = await prisma.boardGame.findMany({
    orderBy: { name: "asc" },
  });

  return <BoardGameManager boardGames={boardGames} />;
}

