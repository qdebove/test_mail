import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

const VISIBILITY_VALUES = new Set(["PUBLIC", "FRIENDS", "LINK"]);
const CONTRIBUTION_VALUES = new Set(["NONE", "MONEY", "ITEMS"]);

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (payload.visibility !== undefined) {
    const visibility = String(payload.visibility).toUpperCase();
    if (!VISIBILITY_VALUES.has(visibility)) {
      return NextResponse.json({ error: "Unknown visibility value" }, { status: 400 });
    }
    updates.visibility = visibility;
  }

  if (payload.contributionType !== undefined) {
    const contribution = String(payload.contributionType).toUpperCase();
    if (!CONTRIBUTION_VALUES.has(contribution)) {
      return NextResponse.json({ error: "Unknown contribution type" }, { status: 400 });
    }
    updates.contributionType = contribution;
  }

  if (payload.boardGameId !== undefined) {
    const boardGameId = payload.boardGameId === null ? null : String(payload.boardGameId);
    if (boardGameId) {
      const exists = await prisma.boardGame.findUnique({
        where: { id: boardGameId },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.json({ error: "Board game not found" }, { status: 400 });
      }
      updates.boardGameId = boardGameId;
    } else {
      updates.boardGameId = null;
    }
  }

  try {
    const game = await prisma.game.update({
      where: { id: params.id },
      data: updates,
    });

    return NextResponse.json({ game, message: "Game updated." });
  } catch (error) {
    console.error("Game update failed:", error);
    return NextResponse.json({ error: "Unable to update game" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.game.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Game deleted." });
  } catch (error) {
    console.error("Game delete failed:", error);
    return NextResponse.json({ error: "Unable to delete game" }, { status: 500 });
  }
}

