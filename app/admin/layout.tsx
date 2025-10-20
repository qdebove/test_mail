import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { getAdminUser } from "@/lib/adminAuth";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/board-games", label: "Board games" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/games", label: "Games" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/private?error=admin-only");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Admin control</p>
            <h1 className="mt-1 text-3xl font-semibold text-gray-900">
              Welcome, {adminUser.name || adminUser.email}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage catalog data, users, sessions, and other records for the platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Signed in as <span className="font-semibold text-gray-800">{adminUser.email}</span>
            </div>
            <SignOutButton />
          </div>
        </header>

        <nav className="overflow-x-auto">
          <ul className="flex w-full gap-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">{children}</section>
      </div>
    </div>
  );
}

