'use client'

import { useState } from 'react'

interface Props {
  formUrl: string
  onStartOver: () => void
}

export default function SuccessState({ formUrl, onStartOver }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="success-wrapper">
      {/* Check icon */}
      <svg
        className="success-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>

      <p className="success-title">Form created!</p>
      <p className="success-sub">Your Google Form is ready for distribution.</p>

      <div className="success-actions">
        <button className="btn-outlined" onClick={handleCopy}>
          {copied ? '✓ Copied!' : 'Copy link'}
        </button>
        <a
          className="btn-filled"
          href={formUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Form →
        </a>
      </div>

      {copied && (
        <span className="copy-feedback">Link copied to clipboard</span>
      )}

      <button className="btn-start-over" onClick={onStartOver}>
        Start over
      </button>
    </div>
  )
}
