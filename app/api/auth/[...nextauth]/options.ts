import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { User, UserRole } from "@/types";

export const options: NextAuthOptions = {
  callbacks: {
    //
    async signIn({ account, user }) {
      if (account?.provider !== "credentials") return true;

      //To prevent account firing endpoint during credential login
      if(account?.provider === "credentials") {
          const existingUser: User = await axios
            .get(`http://localhost:8000/api/users/${user.id}/no-auth`)
            .then((response) => {
              return response.data?.data;
            });
    
          // Prevent sign in without email verification
          if (!existingUser?.emailVerified) return false;
      }

      return true;
    },

    //JWT callback is used to add more information to token, and it is the first to fire before session callback;
    async jwt({ token, account, profile }) {
      if (!token.sub) return token;

      //To prevent account firing endpoint during credential login
      if (account && account?.provider !== "credentials") {

        let userId = "";

          const newUser = await axios.post("http://localhost:8000/api/auth/register", {
            name: profile?.name,
            email: profile?.email,
            password: "oauth1_passworD_placeholder##"
          });

        //  Debugging: console.log({ newUser });

          userId = newUser.data?.user?.id

          // Debugging: console.log("[userId]:", userId)

        //Debugging: console.log({ account });
        // Save the OAuth information to the database
        try {
          const accountData = {
            userId: userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          };

          const response = await axios.post(
            "http://localhost:8000/api/auth/accounts",
            accountData
          );

        //Debugging: console.log("[ACCOUNT_RES]:", response);
        } catch (error) {
          console.error("Error saving account data [Oauth]:", error);
        }

        token.role = "USER";
        token.id = profile?.sub;
        token.email = profile?.email;
        token.accessToken = account?.access_token;
      } 
      
      if(account?.provider === "credentials") {
        //For credential login
        const existingUser: User = await axios
          .get(`http://localhost:8000/api/users/${token.sub}/no-auth`)
          .then((response) => {
            return response.data?.data;
          });

        //Debugging: console.log({ existingUser });
        if (!existingUser) return token;

        //Set the new information to token object from the api call.
        token.id = existingUser.id;
        token.name = existingUser.name;
        token.email = existingUser.email;
        token.role = existingUser.role;
        token.accessToken = existingUser.access_token;
        token.emailVerified = existingUser.emailVerified;
      }

      return token;
    },

    //Session callback is used to then set the new token from JWT callback to session. (for types update, check next-auth.d.ts)
    session({ session, token }) {
      //Debugging: console.log("[SESSION] & [TOKEN]1:", { session, token });

      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken as String;
        session.user.emailVerified = token.emailVerified as
          | Date
          | String
          | null;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
      }

      //Debugging: console.log("[SESSION] & [TOKEN]2:", { session, token });

      return session;
    },
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENTID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const res = await axios.post(
          "http://localhost:8000/api/auth/signin",
          credentials
        );
        const user = res.data.data;

        if (res.status === 200 && user) {
          return user;
        }

        return null;
      },
    }),
  ],
  //   pages: {
  //     signIn: "/auth/signin",
  //     error: '/auth/error',
  //   },
};
