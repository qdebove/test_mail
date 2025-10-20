import { auth } from "@/auth";
import { prisma } from "@/prisma";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  admin: boolean;
};

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const sessionUser = session.user as { id?: string | null; email?: string | null };

  if (sessionUser?.id) {
    const userById = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, name: true, email: true, admin: true },
    });

    if (userById && userById.admin) {
      return userById;
    }
  }

  if (sessionUser?.email) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { id: true, name: true, email: true, admin: true },
    });

    if (userByEmail && userByEmail.admin) {
      return userByEmail;
    }
  }

  return null;
}
