import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const sessions = await prisma.session.findMany({
    orderBy: { expires: "desc" },
    select: {
      id: true,
      userId: true,
      expires: true,
      sessionToken: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ sessions });
}

