import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveUserId() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const sessionUser = session.user as { id?: string | null; email?: string | null };

  if (sessionUser?.id) {
    const byId = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true },
    });
    if (byId) {
      return byId.id;
    }
  }

  if (sessionUser?.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { id: true },
    });
    if (byEmail) {
      return byEmail.id;
    }
  }

  return null;
}

export async function PATCH(request: NextRequest) {
  const userId = await resolveUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = sanitizeText(payload.name);
  const imageInput = sanitizeText(payload.image);
  const address = sanitizeText(payload.address);
  const addressComplement = sanitizeText(payload.addressComplement);
  const rawZipCode = sanitizeText(payload.zipCode);
  const zipCode = rawZipCode.toUpperCase();

  if (name.length > 120) {
    return NextResponse.json(
      { error: "Display name cannot exceed 120 characters" },
      { status: 400 },
    );
  }

  if (imageInput && !/^https?:\/\//i.test(imageInput)) {
    return NextResponse.json(
      { error: "Profile photo URL must start with http or https" },
      { status: 400 },
    );
  }

  if (address && address.length > 240) {
    return NextResponse.json(
      { error: "Address must be shorter than 240 characters" },
      { status: 400 },
    );
  }

  if (addressComplement && addressComplement.length > 160) {
    return NextResponse.json(
      { error: "Address complement must be shorter than 160 characters" },
      { status: 400 },
    );
  }

  if (zipCode && !/^[A-Z0-9\- ]{3,12}$/.test(zipCode)) {
    return NextResponse.json(
      { error: "Zip code must use 3-12 letters, numbers, spaces or dashes" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        image: imageInput || null,
        address: address || null,
        addressComplement: addressComplement || null,
        zipCode: zipCode || null,
      },
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

    return NextResponse.json({
      user: updated,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json(
      { error: "Unable to save your profile" },
      { status: 500 },
    );
  }
}
