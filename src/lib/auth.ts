/**
 * NextAuth Configuration - Robust with fallbacks
 */
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Generate a deterministic secret from environment or use fallback
const getSecret = () => {
  const envSecret = process.env.NEXTAUTH_SECRET
  if (envSecret) return envSecret
  // Fallback for development - NOT secure for production
  console.warn('NEXTAUTH_SECRET not set, using insecure fallback')
  return 'development-secret-do-not-use-in-production'
}

const getUrl = () => {
  return process.env.NEXTAUTH_URL || 
    process.env.NEXT_PUBLIC_APP_URL || 
    'https://rob-roi-sales-dashboard.vercel.app'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        
        // Demo mode: accept any email/password for testing
        // In production, validate against your database
        if (credentials.email && credentials.password) {
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
            role: 'SALES_TEAM', // Default role for demo
          }
        }
        return null
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role || 'SALES_TEAM'
        token.name = user.name
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id || token.email
        session.user.email = token.email
        session.user.role = token.role || 'SALES_TEAM'
        session.user.name = token.name
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
    maxAge: 30 * 24 * 60 * 60,
  },
  
  secret: getSecret(),
  useSecureCookies: process.env.NODE_ENV === 'production',
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
