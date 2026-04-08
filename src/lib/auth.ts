/**
 * NextAuth Configuration
 * Multi-user authentication with role-based access
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        (session.user as any).role = token.role
      }
      return session
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}

// Role-based access control helper
export function canAccess(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    EXECUTIVE: 4,
    SALES_LEAD: 3,
    SALES_TEAM: 2,
    PROJECT_MANAGER: 1,
  }
  
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0)
}

// Check if user can approve at a given stage
export function canApprove(userRole: string, stage: string): boolean {
  if (stage === 'REVIEW_BOARD_1' || stage === 'REVIEW_BOARD_2') {
    return userRole === 'EXECUTIVE' || userRole === 'SALES_LEAD'
  }
  if (stage === 'OFFER_APPROVAL') {
    return userRole === 'SALES_LEAD' || userRole === 'SALES_TEAM'
  }
  return userRole === 'EXECUTIVE'
}
