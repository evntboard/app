import type {NextAuthConfig} from "next-auth"
import Email from "next-auth/providers/email"
import {Resend} from "resend"

const resend = new Resend(process.env.RESEND_API_KEY);

export default {
  pages: {
    signIn: "/login"
  },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.EMAIL_FROM,

      sendVerificationRequest: async ({ identifier, url, provider }) => {
        try {
          const isDevOrStaging = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview"
          const emailAddress = isDevOrStaging ? "delivered@resend.dev" : identifier;


        //   const data = await resend.emails.send({
        //     from: "fill this in",
        //     to: [emailAddress],
        //     subject: `Your welcome email to ${siteConfig.name}`,
        //     react: NotionMagicLinkEmail({ loginUrl: url }),
        //     headers: {
        //     "X-Entity-Ref-ID": new Date().getTime() + "",
        //   }
        // });

          // console.log(data);
        } catch (error) {
          console.error(error);
        }
      },
    })
  ],
} satisfies NextAuthConfig