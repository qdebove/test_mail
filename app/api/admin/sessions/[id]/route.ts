import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.session.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Session deleted." });
  } catch (error) {
    console.error("Session delete failed:", error);
    return NextResponse.json({ error: "Unable to delete session" }, { status: 500 });
  }
}

