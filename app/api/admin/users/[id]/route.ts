import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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

  const name = sanitizeText(payload.name);
  const address = sanitizeText(payload.address);
  const addressComplement = sanitizeText(payload.addressComplement);
  const rawZipCode = sanitizeText(payload.zipCode);
  const zipCode = rawZipCode.toUpperCase();
  const makeAdmin = payload.admin === undefined ? undefined : Boolean(payload.admin);

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

  if (params.id === admin.id && makeAdmin === false) {
    return NextResponse.json(
      { error: "You cannot revoke your own admin rights." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name || null,
        address: address || null,
        addressComplement: addressComplement || null,
        zipCode: zipCode || null,
        admin: makeAdmin,
      },
    });

    return NextResponse.json({ user, message: "User updated." });
  } catch (error) {
    console.error("User update failed:", error);
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (params.id === admin.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account while signed in." },
      { status: 400 },
    );
  }

  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "User deleted." });
  } catch (error) {
    console.error("User delete failed:", error);
    return NextResponse.json({ error: "Unable to delete user" }, { status: 500 });
  }
}
