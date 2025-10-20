import { auth } from "@/auth";
import { encodeGeohash, geocodeAddress } from "@/lib/location";
import { prisma } from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }
  return fallback;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseCapacity(value: unknown) {
  const asNumber = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(asNumber)) {
    return null;
  }

  return asNumber;
}

async function resolveCurrentUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const sessionUser = session.user as { id?: string | null; email?: string | null };

  if (sessionUser?.id) {
    const byId = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        address: true,
        addressComplement: true,
        zipCode: true,
        latitude: true,
        longitude: true,
      },
    });

    if (byId) {
      return byId;
    }
  }

  if (sessionUser?.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: {
        id: true,
        address: true,
        addressComplement: true,
        zipCode: true,
        latitude: true,
        longitude: true,
      },
    });

    if (byEmail) {
      return byEmail;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const user = await resolveCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = sanitizeText(payload.title);
  const description = sanitizeText(payload.description);
  const startsAt = parseDate(payload.startsAt);
  const endsAt = parseDate(payload.endsAt);
  const capacity = parseCapacity(payload.capacity);
  const useProfileAddress = parseBoolean(payload.useProfileAddress, true);
  const manualAddress = sanitizeText(payload.manualAddress);

  if (!title) {
    return NextResponse.json({ error: "Session title is required" }, { status: 400 });
  }

  if (title.length > 140) {
    return NextResponse.json({ error: "Title must be shorter than 140 characters" }, { status: 400 });
  }

  if (description.length > 600) {
    return NextResponse.json(
      { error: "Description must be shorter than 600 characters" },
      { status: 400 },
    );
  }

  if (!startsAt) {
    return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  }

  if (!endsAt) {
    return NextResponse.json({ error: "End date is required" }, { status: 400 });
  }

  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: "End date must be after the start date" },
      { status: 400 },
    );
  }

  if (capacity === null || capacity < 2 || capacity > 48) {
    return NextResponse.json(
      { error: "Capacity must be a number between 2 and 48" },
      { status: 400 },
    );
  }

  let addressApprox: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (useProfileAddress) {
    if (!user.address) {
      return NextResponse.json(
        { error: "Add a street address to your profile first" },
        { status: 400 },
      );
    }

    addressApprox = [user.address, user.addressComplement, user.zipCode]
      .map((value) => (value ? value.trim() : ""))
      .filter((value) => value.length > 0)
      .join(", ") || user.address.trim();

    if (typeof user.latitude === "number" && typeof user.longitude === "number") {
      latitude = user.latitude;
      longitude = user.longitude;
    } else {
      const geocoded = await geocodeAddress({
        address: user.address,
        addressComplement: user.addressComplement,
        zipCode: user.zipCode,
      });

      if (!geocoded) {
        return NextResponse.json(
          { error: "Unable to calculate coordinates for your profile address" },
          { status: 400 },
        );
      }

      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
      addressApprox = geocoded.normalizedAddress;
    }
  } else {
    if (!manualAddress) {
      return NextResponse.json(
        { error: "Provide an address for the session" },
        { status: 400 },
      );
    }

    const geocoded = await geocodeAddress({ address: manualAddress });

    if (!geocoded) {
      return NextResponse.json(
        { error: "Unable to calculate coordinates for this session address" },
        { status: 400 },
      );
    }

    addressApprox = geocoded.normalizedAddress;
    latitude = geocoded.latitude;
    longitude = geocoded.longitude;
  }

  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { error: "Coordinates are required to publish a session" },
      { status: 400 },
    );
  }

  const geohash = encodeGeohash(latitude, longitude, 9);

  try {
    const session = await prisma.gameSession.create({
      data: {
        hostId: user.id,
        title,
        description: description || null,
        addressApprox,
        latitude,
        longitude,
        geohash,
        startsAt,
        endsAt,
        capacity,
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        addressApprox: true,
      },
    });

    return NextResponse.json({
      session,
      message: "Session created successfully.",
    });
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json(
      { error: "Unable to create the session" },
      { status: 500 },
    );
  }
}
