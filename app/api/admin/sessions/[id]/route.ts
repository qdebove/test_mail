import { getAdminUser } from "@/lib/adminAuth";
import { prisma } from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params; // await the promised params
    await prisma.session.delete({ where: { id } });
    return NextResponse.json({ message: "Session deleted." });
  } catch (error) {
    console.error("Session delete failed:", error);
    return NextResponse.json(
      { error: "Unable to delete session" },
      { status: 500 }
    );
  }
}
