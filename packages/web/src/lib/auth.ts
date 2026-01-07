import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile) {
        const githubProfile = profile as {
          id: number
          login: string
          name?: string
          avatar_url?: string
          email?: string
        }

        // Upsert user in database
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.githubId, String(githubProfile.id)))
          .limit(1)

        if (existingUser.length === 0) {
          await db.insert(users).values({
            githubId: String(githubProfile.id),
            username: githubProfile.login,
            name: githubProfile.name || null,
            avatarUrl: githubProfile.avatar_url || null,
            email: githubProfile.email || null,
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        // Fetch user from database
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.githubId, token.sub))
          .limit(1)

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.username = dbUser.username
        }
      }
      return session
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.sub = String((profile as { id: number }).id)
      }
      return token
    },
  },
}

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
