import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Email from 'next-auth/providers/nodemailer'
import { prisma } from './prisma'
import { z } from 'zod'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
  providers: [
    Credentials({
      name: 'OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), otp: z.string().length(6) })
          .safeParse(credentials)

        if (!parsed.success) return null

        const { email, otp } = parsed.data

        const verificationToken = await prisma.verificationToken.findFirst({
          where: {
            identifier: email,
            token: otp,
            expires: { gt: new Date() },
          },
        })

        if (!verificationToken) return null

        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: email, token: otp } },
        })

        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          user = await prisma.user.create({
            data: { email, emailVerified: new Date() },
          })
        } else if (!user.emailVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          })
        }

        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || 'BUYER'
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (dbUser) token.role = dbUser.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
