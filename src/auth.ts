// Authentification par lien magique (NextAuth v5, sessions en base de données).
// Accès sur invitation : seul un compte déjà créé (seed ou administrateur) reçoit un lien.
import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 jours, cf. README
const LINK_MAX_AGE_SECONDS = 15 * 60;

const smtpPort = Number(process.env.EMAIL_SERVER_PORT ?? 587);
const smtpConfigured = Boolean(process.env.EMAIL_SERVER_HOST);

// Transport SMTP utilisé par sendVerificationRequest. Sans SMTP, on garde un transport « JSON »
// inoffensif : NextAuth exige une valeur, mais le code ci-dessous n'envoie rien dans ce cas.
const mailer = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: process.env.EMAIL_SERVER_USER
        ? { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD }
        : undefined,
    })
  : null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database', maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: '/login', verifyRequest: '/login/verifier' },
  providers: [
    Nodemailer({
      server: mailer ? undefined : { jsonTransport: true },
      from: process.env.EMAIL_FROM,
      maxAge: LINK_MAX_AGE_SECONDS,
      async sendVerificationRequest({ identifier: email, url }) {
        // Pour un e-mail inconnu, on ne envoie rien mais on répond comme si c'était le cas
        // (pas d'énumération des comptes).
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return;

        if (!mailer) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('SMTP non configuré (EMAIL_SERVER_HOST)');
          }
          // Développement local sans SMTP : le lien est affiché dans le terminal.
          console.info(`[auth] Lien de connexion pour ${email} : ${url}`);
          return;
        }

        await mailer.sendMail({
          to: email,
          from: process.env.EMAIL_FROM,
          subject: 'Connexion au CRM Ventes',
          text: `Cliquez sur ce lien pour vous connecter (valable 15 minutes) :\n\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
          html: `<p>Cliquez sur ce lien pour vous connecter (valable 15 minutes) :</p><p><a href="${url}">Se connecter au CRM</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
        });
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
});
