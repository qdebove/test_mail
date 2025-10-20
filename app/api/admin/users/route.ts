import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      admin: true,
      address: true,
      addressComplement: true,
      zipCode: true,
    },
  });

  return NextResponse.json({ users });
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

  const email = sanitizeText(payload.email).toLowerCase();
  const name = sanitizeText(payload.name);
  const address = sanitizeText(payload.address);
  const addressComplement = sanitizeText(payload.addressComplement);
  const rawZipCode = sanitizeText(payload.zipCode);
  const zipCode = rawZipCode.toUpperCase();
  const makeAdmin = Boolean(payload.admin);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (address.length > 240) {
    return NextResponse.json(
      { error: "Address must be shorter than 240 characters" },
      { status: 400 },
    );
  }

  if (addressComplement.length > 160) {
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
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        address: address || null,
        addressComplement: addressComplement || null,
        zipCode: zipCode || null,
        admin: makeAdmin,
      },
    });

    return NextResponse.json({ user, message: "User created." });
  } catch (error) {
    console.error("User creation failed:", error);
    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
