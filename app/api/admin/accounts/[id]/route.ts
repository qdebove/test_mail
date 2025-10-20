import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.account.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Account deleted." });
  } catch (error) {
    console.error("Account delete failed:", error);
    return NextResponse.json({ error: "Unable to delete account" }, { status: 500 });
  }
}

