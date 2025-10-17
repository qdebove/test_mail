export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">POC Magic Link</h1>
        <p className="mt-2 text-gray-600">
          Démo NextAuth + Resend + Tailwind
        </p>
        <div className="mt-6 flex gap-3">
          <a href="/login" className="rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-black/90">
            Se connecter
          </a>
          <a href="/private" className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-50">
            Zone privée
          </a>
        </div>
      </div>
    </main>
  );
}
