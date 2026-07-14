'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Navbar() {
  const { data: session, status } = useSession()

  // Show first name only if available, otherwise truncate email before the @
  // Keeps the navbar clean on both mobile and desktop
  const displayName = session?.user?.name
    ? session.user.name.split(' ')[0]
    : session?.user?.email?.split('@')[0] ?? ''

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo-container">
        <img src="/logo.png" alt="Formify Logo" className="navbar-logo-img" />
        <span className="navbar-logo">Formify</span>
      </Link>

      <div className="navbar-right">
        {status === 'loading' ? (
          <span className="navbar-email">Loading…</span>
        ) : session ? (
          <>
            <span className="navbar-email">{displayName}</span>
            <button className="btn-signout" onClick={() => signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <button className="btn-signin-nav" onClick={() => signIn('google')}>
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  )
}