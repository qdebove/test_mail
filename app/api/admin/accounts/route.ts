import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { getAdminUser } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const accounts = await prisma.account.findMany({
    orderBy: { provider: "asc" },
    select: {
      id: true,
      userId: true,
      provider: true,
      type: true,
      providerAccountId: true,
      scope: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ accounts });
}
