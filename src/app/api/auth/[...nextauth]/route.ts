import { handlers } from '@/auth'

// GET handles the OAuth redirect callback from Google
// POST handles sign-in and sign-out form submissions
export const { GET, POST } = handlers