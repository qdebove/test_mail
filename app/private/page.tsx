import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function PrivatePage() {
  const session = await auth();

  if (!session) {
    // Sûreté côté serveur (redirigé aussi par le middleware)
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-gray-600">Veuillez vous connecter.</p>
          <a
            className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-black/90"
            href="/login"
          >
            Aller à la connexion
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Zone Privée 🔒</h1>
          <SignOutButton />
        </div>

        <div className="space-y-2 text-gray-700">
          <p>Bienvenue, <span className="font-semibold">{session.user?.email}</span></p>
          <p>Vous êtes connecté grâce à un lien magique ✨</p>
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p>
            Cette zone n’est **pas** accessible autrement que par authentification.
          </p>
        </div>
      </div>
    </main>
  );
}
