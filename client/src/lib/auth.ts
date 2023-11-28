import {AuthOptions} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";

import {PrismaAdapter} from "@auth/prisma-adapter";
import {db} from "@/lib/db";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      //maxAge: 2 * 60 * 60, // 2h
      // sendVerificationRequest: async ({identifier, url, provider}) => {
      //     const user = await db.user.findUnique({
      //         where: {
      //             email: identifier,
      //         },
      //         select: {
      //             emailVerified: true,
      //         },
      //     })
      //
      //     const template = user?.emailVerified ? "assets/user_signin.mjml" : "assets/user_signup.mjml"
      //
      //     const parsed = mjml2html(template)
      //
      //     if (parsed.errors.length > 0) {
      //         throw new Error(`Error when parsing "${template}" ...`)
      //     }
      //
      //     const transporter = nodemailer.createTransport(
      //         {
      //             host: process.env.EMAIL_SERVER_HOST,
      //             port: process.env.EMAIL_SERVER_PORT,
      //             secure: true,
      //             auth: {
      //                 user: process.env.EMAIL_SERVER_USER,
      //                 pass: process.env.EMAIL_SERVER_PASSWORD,
      //             },
      //         }, {
      //             from: '"Evntboard" <do-not-reply@evntboard.io>',
      //         }
      //     );
      //
      //     const info = await transporter.sendMail({
      //         to: identifier,
      //         subject: "Evntboard authentication",
      //         text: parsed.html,
      //         html: parsed.html,
      //     });
      //
      //     if (info.rejected) {
      //         throw new Error(info.response)
      //     }
      // },
    }),
    DiscordProvider({
      clientId: String(process.env.DISCORD_ID),
      clientSecret: String(process.env.DISCORD_SECRET),
    }),
    GithubProvider({
      clientId: String(process.env.GITHUB_ID),
      clientSecret: String(process.env.GITHUB_SECRET),
    }),
  ],
  callbacks: {
    async session({token, session}: any) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    },
    async jwt({token, user}: any) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      })

      if (!dbUser) {
        if (user) {
          token.id = user?.id
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }
    },
  },
}