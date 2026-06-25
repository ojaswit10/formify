import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Minimum scopes — only what we need to create forms in the user's Drive
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/forms.body',
            'https://www.googleapis.com/auth/drive.file',
          ].join(' '),
          // Forces Google to return a refresh_token every time (needed if token expires)
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    // jwt callback runs when a token is created or refreshed
    // We attach the Google access_token here so it travels with the session
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.access_token = account.access_token
      }
      return token
    },

    // session callback runs when useSession() or auth() is called
    // We expose the access_token on the session object so API routes can read it
    async session({ session, token }) {
      session.access_token = token.access_token as string
      return session
    },
  },
})