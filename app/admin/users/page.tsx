import UserManager from "@/components/admin/UserManager";
import { prisma } from "@/prisma";

export default async function AdminUsersPage() {
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

  return <UserManager users={users} />;
}
