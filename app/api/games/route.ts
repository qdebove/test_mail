import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { GAME_CATEGORIES } from "@/lib/gameCategories";
import type { GameCategory } from "@/lib/gameCategories";

const VISIBILITY_VALUES = new Set(["PUBLIC", "FRIENDS", "LINK"]);
const CONTRIBUTION_VALUES = new Set(["NONE", "MONEY", "ITEMS"]);
const CATEGORY_VALUES = new Set<string>(GAME_CATEGORIES);

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInt(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return NaN;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}

async function resolveUser() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const sessionUser = session.user as { id?: string | null; email?: string | null };
  const userSelection = {
    id: true,
    email: true,
    zipCode: true,
    address: true,
    addressComplement: true,
  } satisfies Prisma.UserSelect;

  if (sessionUser?.id) {
    const byId = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: userSelection,
    });
    if (byId) {
      return byId;
    }
  }

  if (sessionUser?.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: userSelection,
    });
    if (byEmail) {
      return byEmail;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = sanitizeText(searchParams.get("q"));
  const categoryFilter = sanitizeText(searchParams.get("category"));
  const limitParam = parsePositiveInt(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 25;

  const filters: Prisma.GameWhereInput[] = [];

  if (query) {
    filters.push({
      name: {
        contains: query,
        mode: "insensitive",
      },
    });
  }

  if (categoryFilter && categoryFilter !== "all") {
    if (!CATEGORY_VALUES.has(categoryFilter.toUpperCase())) {
      return NextResponse.json(
        { error: "Unknown category filter" },
        { status: 400 },
      );
    }

    filters.push({
      category: {
        equals: categoryFilter.toUpperCase() as GameCategory,
      },
    });
  }

  const games = await prisma.game.findMany({
    where: filters.length ? { AND: filters } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
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

  return NextResponse.json({ games, categories: GAME_CATEGORIES });
}

export async function POST(request: NextRequest) {
  const user = await resolveUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.zipCode) {
    return NextResponse.json(
      { error: "Please add your zip code in your profile before posting a game" },
      { status: 400 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = sanitizeText(payload.name);
  const category = sanitizeText(payload.category).toUpperCase();
  const thumbnailUrl = sanitizeText(payload.thumbnailUrl);
  const contributionNote = sanitizeText(payload.contributionNote);
  const visibilityRaw = sanitizeText(payload.visibility).toUpperCase();
  const contributionRaw = sanitizeText(payload.contributionType).toUpperCase();
  const boardGameId = sanitizeText(payload.boardGameId);

  if (!name) {
    return NextResponse.json({ error: "Game name is required" }, { status: 400 });
  }

  if (!category) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  if (name.length > 160) {
    return NextResponse.json({ error: "Game name is too long" }, { status: 400 });
  }

  if (!CATEGORY_VALUES.has(category)) {
    return NextResponse.json(
      { error: "Unknown category value" },
      { status: 400 },
    );
  }

  if (thumbnailUrl && !/^https?:\/\//i.test(thumbnailUrl)) {
    return NextResponse.json(
      { error: "Thumbnail URL must start with http or https" },
      { status: 400 },
    );
  }

  const minPlayers = parsePositiveInt(payload.minPlayers);
  const maxPlayers = parsePositiveInt(payload.maxPlayers);
  const durationMin = parsePositiveInt(payload.durationMin);
  const bggIdValue = payload.bggId === "" ? null : payload.bggId;
  const bggId = bggIdValue === null || bggIdValue === undefined ? null : parsePositiveInt(bggIdValue);

  if (!Number.isFinite(minPlayers) || minPlayers < 1) {
    return NextResponse.json(
      { error: "Minimum players must be a positive number" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(maxPlayers) || maxPlayers < minPlayers) {
    return NextResponse.json(
      { error: "Maximum players must be greater or equal to minimum players" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(durationMin) || durationMin < 5) {
    return NextResponse.json(
      { error: "Duration must be at least 5 minutes" },
      { status: 400 },
    );
  }

  if (bggId !== null && (!Number.isFinite(bggId) || bggId <= 0)) {
    return NextResponse.json(
      { error: "BoardGameGeek ID must be a positive number" },
      { status: 400 },
    );
  }

  if (!VISIBILITY_VALUES.has(visibilityRaw)) {
    return NextResponse.json(
      { error: "Unknown visibility value" },
      { status: 400 },
    );
  }

  if (!CONTRIBUTION_VALUES.has(contributionRaw)) {
    return NextResponse.json(
      { error: "Unknown contribution type" },
      { status: 400 },
    );
  }

  if (contributionNote && contributionNote.length > 240) {
    return NextResponse.json(
      { error: "Contribution note must be shorter than 240 characters" },
      { status: 400 },
    );
  }

  try {
    let boardGameConnect: { connect: { id: string } } | undefined;

    if (boardGameId) {
      const boardGame = await prisma.boardGame.findUnique({
        where: { id: boardGameId },
        select: { id: true },
      });

      if (!boardGame) {
        return NextResponse.json(
          { error: "Board game not found" },
          { status: 400 },
        );
      }

      boardGameConnect = { connect: { id: boardGame.id } };
    }

    const duplicate = await prisma.game.findUnique({
      where: { name },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "A game with this name already exists" },
        { status: 400 },
      );
    }

    const created = await prisma.game.create({
      data: {
        name,
        category,
        minPlayers,
        maxPlayers,
        durationMin,
        thumbnailUrl: thumbnailUrl || null,
        bggId,
        ownerId: user.id,
        addressSnapshot: [user.address, user.addressComplement, user.zipCode]
          .filter((value) => value && value.length > 0)
          .join(", ") || null,
        visibility: visibilityRaw as Prisma.GameCreateInput["visibility"],
        contributionType: contributionRaw as Prisma.GameCreateInput["contributionType"],
        contributionNote: contributionNote || null,
        category: category as Prisma.GameCreateInput["category"],
        boardGame: boardGameConnect,
      },
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

    return NextResponse.json({
      game: created,
      message: "Game posted successfully.",
    });
  } catch (error) {
    console.error("Game creation failed:", error);
    return NextResponse.json(
      { error: "Unable to create the game" },
      { status: 500 },
    );
  }
}
