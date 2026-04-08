import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  ...authOptions,
  providers: authOptions.providers.map(p => {
    if (p.type === 'credentials') {
      return {
        ...p,
        authorize: async (credentials) => {
          if (!credentials?.email || !credentials?.password) return null
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })
          
          if (!user || !user.passwordHash) return null
          
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) return null
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }
      }
    }
    return p
  })
})

export { handler as GET, handler as POST }
