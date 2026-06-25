'use client'

import { signIn } from 'next-auth/react'

interface Props {
  onClose: () => void
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.93c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.1-10.36 7.1-17.14z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.49-1.47-.76-3.04-.76-4.59s.27-3.12.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z" />
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.55 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    </svg>
  )
}

export default function SignInModal({ onClose }: Props) {
  async function handleSignIn() {
    // page.tsx already saved state to sessionStorage before showing this modal
    onClose()
    await signIn('google')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Large Google G */}
        <svg width="44" height="44" viewBox="0 0 48 48" style={{ marginBottom: 4 }}>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.93c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.1-10.36 7.1-17.14z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.49-1.47-.76-3.04-.76-4.59s.27-3.12.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z" />
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.55 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        </svg>

        <p className="modal-title">Sign in to create your form</p>
        <p className="modal-sub">
          We need access to your Google account to save the form directly to your Drive.
        </p>

        <button className="btn-google" onClick={handleSignIn}>
          <GoogleLogo />
          Continue with Google
        </button>

        <button className="btn-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
