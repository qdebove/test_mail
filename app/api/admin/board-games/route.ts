import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { GAME_CATEGORIES } from "@/lib/gameCategories";
import { getAdminUser } from "@/lib/adminAuth";

const CATEGORY_VALUES = new Set<string>(GAME_CATEGORIES);

function ensureNumber(value: unknown, { min }: { min?: number } = {}) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (typeof min === "number" && parsed < min) return null;
  return parsed;
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const boardGames = await prisma.boardGame.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ boardGames });
}

export async function POST(request: NextRequest) {
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

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const categoryRaw = typeof payload.category === "string" ? payload.category.trim().toUpperCase() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!CATEGORY_VALUES.has(categoryRaw)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  const minPlayers = ensureNumber(payload.minPlayers, { min: 1 });
  const maxPlayers = ensureNumber(payload.maxPlayers, { min: 1 });
  const playTimeMin = ensureNumber(payload.playTimeMin, { min: 5 });

  if (minPlayers === null || maxPlayers === null || playTimeMin === null) {
    return NextResponse.json(
      { error: "Players and play time must be positive numbers" },
      { status: 400 },
    );
  }

  if (maxPlayers < minPlayers) {
    return NextResponse.json(
      { error: "Maximum players must be greater than or equal to minimum players" },
      { status: 400 },
    );
  }

  const yearPublished = ensureNumber(payload.yearPublished, { min: 1800 });
  const complexity = ensureNumber(payload.complexity, { min: 0 });
  const bggId = ensureNumber(payload.bggId, { min: 1 });

  const thumbnailUrl =
    typeof payload.thumbnailUrl === "string" && payload.thumbnailUrl.trim().length > 0
      ? payload.thumbnailUrl.trim()
      : null;

  if (thumbnailUrl && !/^https?:\/\//i.test(thumbnailUrl)) {
    return NextResponse.json(
      { error: "Thumbnail URL must start with http or https" },
      { status: 400 },
    );
  }

  try {
    const boardGame = await prisma.boardGame.create({
      data: {
        name,
        category: categoryRaw,
        description:
          typeof payload.description === "string" && payload.description.trim().length > 0
            ? payload.description.trim()
            : null,
        publisher:
          typeof payload.publisher === "string" && payload.publisher.trim().length > 0
            ? payload.publisher.trim()
            : null,
        yearPublished: yearPublished,
        minPlayers,
        maxPlayers,
        playTimeMin,
        complexity: complexity,
        thumbnailUrl,
        bggId: bggId,
        curatorId: admin.id,
      },
    });

    return NextResponse.json({ boardGame, message: "Board game created." });
  } catch (error) {
    console.error("Board game creation failed:", error);
    return NextResponse.json({ error: "Unable to create board game" }, { status: 500 });
  }
}

