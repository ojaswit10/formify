import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { JWT } from 'next-auth/jwt'

const REQUIRED_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive.file',
]

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token as string,
      }),
    })

    const refreshed = await res.json()

    if (!res.ok) {
      throw new Error(refreshed.error ?? 'Token refresh failed')
    }

    return {
      ...token,
      access_token: refreshed.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600),
      refresh_token: refreshed.refresh_token ?? token.refresh_token,
      granted_scopes: token.granted_scopes ?? '',
      error: undefined,
    } as JWT
  } catch (error) {
    console.error('[auth] Token refresh failed:', error)
    return { ...token, error: 'RefreshTokenError' } as JWT
  }
}

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
        return {
          ...token,
          access_token: account.access_token ?? token.access_token,
          refresh_token: account.refresh_token ?? token.refresh_token,
          expires_at: account.expires_at ?? token.expires_at,
          granted_scopes: account.scope ?? token.granted_scopes ?? '',
          error: undefined,
        } as JWT
      }

      const expiresAt = token.expires_at as number | undefined
      if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
        return token
      }

      if (!token.refresh_token) {
        return { ...token, error: 'RefreshTokenError' } as JWT
      }

      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      session.access_token = (token.access_token as string | undefined) ?? ''
      session.error = (token.error as string | undefined) ?? null

      // Flag if the user somehow deselected required scopes
      // So the UI can show a clear error instead of a cryptic 403 from Google
      const granted = (token.granted_scopes as string) ?? ''
      session.has_required_scopes =
        granted.includes('forms.body') && granted.includes('drive.file')

      return session
    },
  },
})