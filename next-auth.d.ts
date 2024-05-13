import NextAuth, { type DefaultSession } from "next-auth";
import { UserRole } from "./types";

export type ExtendedUser = DefaultSession["user"] & {
  id: String;
  role: UserRole;
  emailVerified: Date | String | null;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
    accessToken: String;
  }
}
