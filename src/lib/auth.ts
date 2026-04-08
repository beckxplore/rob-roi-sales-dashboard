/**
 * NextAuth Configuration
 */
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Note: Prisma client will be imported in the route handler to avoid edge runtime issues
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'SALES_TEAM',
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  },
  
  pages: {
    signIn: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}

export function canAccess(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    EXECUTIVE: 4,
    SALES_LEAD: 3,
    SALES_TEAM: 2,
    PROJECT_MANAGER: 1,
  }
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0)
}

export function canApprove(userRole: string, stage: string): boolean {
  if (stage === 'REVIEW_BOARD_1' || stage === 'REVIEW_BOARD_2') {
    return userRole === 'EXECUTIVE' || userRole === 'SALES_LEAD'
  }
  if (stage === 'OFFER_APPROVAL') {
    return userRole === 'SALES_LEAD' || userRole === 'SALES_TEAM'
  }
  return userRole === 'EXECUTIVE'
}
