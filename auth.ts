import { prisma } from "@/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import ResendProvider from "next-auth/providers/resend";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const  { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" }, // peut être "jwt", mais "database" convient très bien ici
  
  providers: [
    ResendProvider({
      id: 'email',
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, expires }) {
        // Envoi via Resend (POC : domaine par défaut)
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: identifier,
          subject: "Votre lien magique ✨",
          html: `
            <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6">
              <h2>Connexion à l’application</h2>
              <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
              <p>
                <a href="${url}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none;">
                  Se connecter
                </a>
              </p>
              <p style="color:#6b7280">Si le bouton ne fonctionne pas, copiez-collez ce lien :</p>
              <p><a href="${url}">${url}</a></p>
              <p style="font-size:12px;color:#6b7280">Le lien expire le ${expires.toLocaleDateString()}</p>
            </div>
          `,
          text: `Connectez-vous avec ce lien : ${url}`,
        });
        if (error) throw new Error("Erreur d’envoi de l’email : " + String(error));
      },
      // Durée de validité du lien (ex: 10 min)
      maxAge: 10 * 60,
    }),
  ],
  pages: {
    signIn: "/login",
  },
});
