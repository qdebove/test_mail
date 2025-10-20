import AccountManager from "@/components/admin/AccountManager";
import { prisma } from "@/prisma";

export default async function AdminAccountsPage() {
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

  return <AccountManager accounts={accounts} />;
}

