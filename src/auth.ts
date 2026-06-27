import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

const REQUIRED_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive.file',
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: REQUIRED_SCOPES.join(' '),
          access_type: 'offline',
          prompt: 'consent',
          // Prevents Google showing individual scope checkboxes users can deselect
          // All scopes are granted together or the sign-in fails entirely
          include_granted_scopes: false,
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.access_token = account.access_token
        // Track which scopes were actually granted to detect partial consent
        token.granted_scopes = account.scope ?? ''
      }
      return token
    },

    async session({ session, token }) {
      session.access_token = token.access_token as string

      // Flag if the user somehow deselected required scopes
      // So the UI can show a clear error instead of a cryptic 403 from Google
      const granted = (token.granted_scopes as string) ?? ''
      session.has_required_scopes =
        granted.includes('forms.body') && granted.includes('drive.file')

      return session
    },
  },
})