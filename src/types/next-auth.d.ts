import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    access_token: string
    has_required_scopes: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token: string
    granted_scopes: string
  }
}