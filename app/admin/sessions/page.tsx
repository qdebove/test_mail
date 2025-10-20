import SessionManager from "@/components/admin/SessionManager";
import { prisma } from "@/prisma";

export default async function AdminSessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { expires: "desc" },
    select: {
      id: true,
      sessionToken: true,
      expires: true,
      userId: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const formatted = sessions.map((session) => ({
    ...session,
    expires: session.expires.toISOString(),
  }));

  return <SessionManager sessions={formatted} />;
}

