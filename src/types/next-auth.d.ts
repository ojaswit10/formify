import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    access_token: string
    has_required_scopes: boolean
    error: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string
    refresh_token?: string
    expires_at?: number
    granted_scopes?: string
    error?: string
  }
}

