// ── Question types ──────────────────────────────────────────────────────────
export type QuestionType = 'mcq' | 'short_answer' | 'paragraph'

export type AppState = 'idle' | 'analyzing' | 'ready' | 'creating' | 'done'

export interface Question {
  /** Local browser-only id for React keying and mutation targeting */
  id: string
  type: QuestionType
  question: string
  /** Option strings for MCQ, null for everything else */
  options: string[] | null
  /** Zero-based index of the correct option; null = no answer key */
  correctIndex: number | null
  /** True when the question may have had an equation silently dropped during extraction */
  hasEquationWarning: boolean
}

// ── Raw shape returned by /api/parse ───────────────────────────────────────
export interface RawQuestion {
  type: string
  question: string
  options: string[] | null
  correctIndex: number | null
}

// ── Converts a raw API question into a local Question with id + warning ─────
export function toQuestion(raw: RawQuestion, index: number): Question {
  const q: Omit<Question, 'hasEquationWarning'> = {
    id: `q-${index}-${Math.random().toString(36).slice(2, 7)}`,
    type: raw.type as QuestionType,
    question: raw.question,
    options: raw.options,
    correctIndex: raw.correctIndex,
  }
  return { ...q, hasEquationWarning: detectEquationWarning(q as Question) }
}

// ── Equation warning heuristic ─────────────────────────────────────────────
// Flags questions that contain math/solve trigger phrases but appear too short
// to actually contain an expression — a sign that an equation image was dropped.
export function detectEquationWarning(q: Pick<Question, 'question'>): boolean {
  const text = q.question
  const lower = text.toLowerCase().trim()

  const triggers = [
    'find the value',
    'find the',
    'solve',
    'evaluate',
    'calculate',
    'compute',
    'prove',
    'simplify',
    'differentiate',
    'integrate',
    'factorise',
    'factorize',
    'expand',
    'determine the',
  ]

  const hasTrigger = triggers.some(
    t => lower === t || lower.startsWith(t + ' ') || lower.includes(' ' + t + ' ') || lower.includes(t + ':')
  )
  if (!hasTrigger) return false

  // If the text already contains math symbols / numbers it's probably intact
  const hasMathContent = /[=×÷√∑∫∂π²³°]|[0-9]+[a-zA-Z]|[a-zA-Z]\s*=\s*[\d(]|\d+\s*[+\-*/]\s*\d+/.test(text)
  if (hasMathContent) return false

  // Suspicious: trigger phrase present but text is very short — expression likely dropped
  return text.trim().length < 40
}
