'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { extractFromDocx, extractFromPdf } from '@/lib/extract'
import { Question, AppState, toQuestion, RawQuestion } from '@/types/formify'

import Navbar from '@/components/Navbar'
import UploadZone from '@/components/UploadZone'
import QuestionEditor from '@/components/QuestionEditor'
import SignInModal from '@/components/SignInModal'
import SuccessState from '@/components/SuccessState'

// ── Read + clear sessionStorage once on first render ──────────────────────
// Done outside the component so the object is read exactly once and shared
// across all useState initializers — no repeated reads, no double-clear
interface PendingState {
  questions: Question[]
  fileName: string | null
  formTitle: string
  text: string
}

function popPendingState(): PendingState | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem('formify_pending')
  if (!raw) return null
  sessionStorage.removeItem('formify_pending')
  try {
    return JSON.parse(raw) as PendingState
  } catch {
    return null
  }
}

// Called once at module evaluation time — safe because this file is client-only
const pending = typeof window !== 'undefined' ? popPendingState() : null

export default function Home() {
  const { data: session } = useSession()

  const [appState, setAppState]   = useState<AppState>(pending ? 'ready' : 'idle')
  const [fileName, setFileName]   = useState<string | null>(pending?.fileName ?? null)
  const [text, setText]           = useState<string>(pending?.text ?? '')
  const [questions, setQuestions] = useState<Question[]>(pending?.questions ?? [])
  const [formTitle, setFormTitle] = useState<string>(pending?.formTitle ?? '')
  const [formUrl, setFormUrl]     = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  function reset() {
    setAppState('idle')
    setFileName(null)
    setText('')
    setQuestions([])
    setFormTitle('')
    setFormUrl(null)
    setError(null)
  }

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
      setError('Unsupported file type. Please upload a .docx or .pdf file.')
      return
    }
    setError(null)
    setFileName(file.name)
    setAppState('analyzing')

    try {
      const extracted = file.name.endsWith('.docx')
        ? await extractFromDocx(file)
        : await extractFromPdf(file)

      setText(extracted)

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extracted }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setAppState('idle'); return }

      const parsed: Question[] = (data.questions as RawQuestion[]).map(toQuestion)
      setQuestions(parsed)
      setAppState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setAppState('idle')
    }
  }, [])

  async function handleCreateForm() {
    if (!session) {
      sessionStorage.setItem(
        'formify_pending',
        JSON.stringify({ questions, fileName, formTitle, text })
      )
      setShowModal(true)
      return
    }
    if (!formTitle.trim()) { setError('Please enter a form title.'); return }

    setError(null)
    setAppState('creating')

    try {
      const res = await fetch('/api/create-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, questions }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setAppState('ready'); return }

      setFormUrl(data.formUrl)
      setAppState('done')
    } catch {
      setError('Network error. Please try again.')
      setAppState('ready')
    }
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true) }
  function handleDragLeave() { setDragOver(false) }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  const isDone  = appState === 'done'
  const isReady = appState === 'ready' || appState === 'creating'

  return (
    <>
      <Navbar />

      {isDone && formUrl ? (
        <div className="page-wrapper">
          <SuccessState formUrl={formUrl} onStartOver={reset} />
        </div>
      ) : (
        <div className={isReady ? 'page-wrapper page-wrapper--top' : 'page-wrapper'}>
          <div className="hero">
            <img src="/logo.png" alt="Formify Logo" className="hero-logo" />
            <h1>Turn any question paper into a Google Form.</h1>
            <p>Upload a PDF or DOCX. We handle the rest.</p>
          </div>

          <div className="content-area">
            <UploadZone
              state={appState === 'done' ? 'idle' : appState}
              fileName={fileName}
              dragOver={dragOver}
              onFile={processFile}
              onReset={reset}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            {error && (
              <p className="error-msg">
                <span>⚠</span> {error}
              </p>
            )}

            {isReady && questions.length > 0 && (
              <div className="step2">
                <span className="questions-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  {questions.length} question{questions.length !== 1 ? 's' : ''} detected — review and edit below
                </span>

                <QuestionEditor questions={questions} onChange={setQuestions} />

                <div className="create-section">
                  <div>
                    <label className="form-label" htmlFor="form-title">Form title</label>
                    <input
                      id="form-title"
                      className="form-input"
                      type="text"
                      placeholder="e.g. Chapter 5 Quiz"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateForm()}
                      disabled={appState === 'creating'}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleCreateForm}
                    disabled={appState === 'creating' || questions.length === 0}
                  >
                    {appState === 'creating' ? (
                      <>
                        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        Creating form…
                      </>
                    ) : (
                      'Create Google Form →'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && <SignInModal onClose={() => setShowModal(false)} />}
        <footer style={{
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '0.75rem 1.5rem',
  display: 'flex',
  justifyContent: 'center',
  gap: '1.5rem',
  borderTop: '1px solid var(--border)',
  background: 'rgba(250,250,250,0.85)',
  backdropFilter: 'blur(12px)',
  fontSize: '0.8125rem',
  color: 'var(--text-subtle)',
}}>
  <a href="/privacy" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}
    onMouseOver={e => (e.currentTarget.style.color = 'var(--text-muted)')}
    onMouseOut={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
    Privacy Policy
  </a>
  <span>·</span>
  <a href="/terms" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}
    onMouseOver={e => (e.currentTarget.style.color = 'var(--text-muted)')}
    onMouseOut={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
    Terms of Service
  </a>
  <span>·</span>
  <span>© 2025 Formify</span>
</footer>
    </>
  )
}