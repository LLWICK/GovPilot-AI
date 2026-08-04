import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

interface BackendAuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    nic?: string;
    isVerified?: boolean;
    authProvider?: string;
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "govpilot-dev-secret-key-331200",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const contentType = response.headers.get("content-type") || "";
          if (!response.ok || !contentType.includes("application/json")) {
            console.error("Backend login failed or returned non-JSON response:", response.status, contentType);
            return null;
          }

          const result = (await response.json()) as BackendAuthResponse;
          return {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            accessToken: result.accessToken,
            nic: result.user.nic ?? "",
          };
        } catch (err) {
          console.error("Backend connection failed during login:", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          const res = await fetch(`${BACKEND_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name || profile.email.split("@")[0],
              google_id: account.providerAccountId,
            }),
          });
          const contentType = res.headers.get("content-type") || "";
          if (res.ok && contentType.includes("application/json")) {
            const data = (await res.json()) as BackendAuthResponse;
            account.backendAccessToken = data.accessToken;
            account.backendUserId = data.user.id;
            account.backendNic = data.user.nic ?? "";
            return true;
          } else {
            console.error("Backend Google Auth failed or returned non-JSON:", res.status, contentType);
            return false;
          }
        } catch (err) {
          console.error("Failed to sync Google user with backend:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.nic = user.nic;
      }
      if (account?.provider === "google") {
        if (account.backendAccessToken) {
          token.accessToken = account.backendAccessToken as string;
        }
        if (account.backendUserId) {
          token.id = account.backendUserId as string;
        }
        if (account.backendNic) {
          token.nic = account.backendNic as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.nic = token.nic;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
