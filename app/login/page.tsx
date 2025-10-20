"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"sent"|"error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const res = await signIn("email", { email, redirect: false, redirectTo: '/private' });
    if (!res?.error) {
      setStatus("sent");
      setMessage("Email envoyé ! Vérifie ta boîte mail ✉️");
    } else {
      setStatus("error");
      setMessage("Erreur : " + res.error);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-bold">Connexion par lien magique 🔮</h1>
          <p className="mb-6 text-center text-gray-600">
            Entrez votre email. Nous vous enverrons un lien de connexion.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Adresse email</span>
              <input
                type="email"
                required
                placeholder="vous@exemple.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {status === "loading" ? "Envoi..." : "Envoyer le lien magique"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 rounded-lg border p-3 text-sm ${
                status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Accès réservé —{" "}
            <Link href="/" className="underline hover:text-gray-700">
              retour à l’accueil
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
