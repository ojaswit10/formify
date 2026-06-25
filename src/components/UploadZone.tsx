'use client'

import { useRef } from 'react'

interface Props {
  state: 'idle' | 'analyzing' | 'ready' | 'creating'
  fileName: string | null
  dragOver: boolean
  onFile: (file: File) => void
  onReset: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

function UploadSVG() {
  return (
    <svg
      className="upload-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  )
}

function CheckSVG() {
  return (
    <svg
      style={{ width: 24, height: 24, color: 'var(--green)', flexShrink: 0 }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

export default function UploadZone({
  state,
  fileName,
  dragOver,
  onFile,
  onReset,
  onDragOver,
  onDragLeave,
  onDrop,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isIdle = state === 'idle'
  const isAnalyzing = state === 'analyzing'
  const isConfirmed = state === 'ready' || state === 'creating'

  const zoneClass = [
    'upload-zone',
    isAnalyzing ? 'analyzing' : '',
    isConfirmed ? 'done' : '',
    dragOver && isIdle ? 'drag-over' : '',
  ]
    .filter(Boolean)
    .join(' ')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    onFile(file)
  }

  return (
    <div
      className={zoneClass}
      onClick={() => isIdle && fileInputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role={isIdle ? 'button' : undefined}
      tabIndex={isIdle ? 0 : undefined}
      onKeyDown={(e) =>
        isIdle && e.key === 'Enter' && fileInputRef.current?.click()
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {isAnalyzing ? (
        <>
          <div className="spinner" />
          <span className="analyzing-text">Analyzing document…</span>
        </>
      ) : isConfirmed && fileName ? (
        <>
          <CheckSVG />
          <span className="upload-filename">{fileName}</span>
          <button
            className="upload-replace"
            onClick={(e) => {
              e.stopPropagation()
              onReset()
            }}
          >
            Replace file
          </button>
        </>
      ) : (
        <>
          <UploadSVG />
          <span className="upload-label">Drop your PDF or DOCX here</span>
          <span className="upload-sub">or click to browse</span>
        </>
      )}
    </div>
  )
}
