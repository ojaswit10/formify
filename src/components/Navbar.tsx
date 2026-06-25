'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="navbar">
      <span className="navbar-logo">Formify</span>

      <div className="navbar-right">
        {status === 'loading' ? (
          <span className="navbar-email">Loading…</span>
        ) : session ? (
          <>
            <span className="navbar-email">
              {session.user?.name ?? session.user?.email}
            </span>
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
