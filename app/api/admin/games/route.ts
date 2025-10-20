import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      visibility: true,
      contributionType: true,
      ownerId: true,
      createdAt: true,
      boardGame: {
        select: {
          id: true,
          name: true,
        },
      },
      owner: {
        select: {
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ games });
}

