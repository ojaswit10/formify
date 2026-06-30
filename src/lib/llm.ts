import OpenAI from 'openai'

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

const PARSE_SYSTEM_PROMPT = `You are a question parser. Your job is to extract questions from raw text and return structured JSON.

Return ONLY a JSON object with a single key "questions" containing an array. No markdown, no explanation, no extra text.

Each question object must have exactly these fields:
- "type": one of "mcq", "short_answer", or "paragraph"
  - "mcq" = multiple choice (has lettered or numbered options like A/B/C/D or 1/2/3/4)
  - "short_answer" = expects a brief answer (one line)
  - "paragraph" = expects a long written response
- "question": the question text, cleaned up (remove numbering like "1." or "Q1:")
- "options": array of option strings for mcq (strip the A./B. prefix), null for others
- "correctIndex": zero-based index of the correct option if an answer key is present, null otherwise

Rules:
- If options are labeled A/B/C/D, correctIndex 0 = A, 1 = B, 2 = C, 3 = D
- If no answer is marked, set correctIndex to null
- If a question has options, it is always "mcq" regardless of how it's phrased
- Ignore page numbers, headers, footers, and instructions that are not questions
- If the input contains only one question, still return an array with one item

Example output:
{
  "questions": [
    {
      "type": "mcq",
      "question": "What is the capital of France?",
      "options": ["Berlin", "Madrid", "Paris", "Rome"],
      "correctIndex": 2
    },
    {
      "type": "short_answer",
      "question": "Define photosynthesis.",
      "options": null,
      "correctIndex": null
    }
  ]
}`

export interface ParsedQuestion {
  type: 'mcq' | 'short_answer' | 'paragraph'
  question: string
  options: string[] | null
  correctIndex: number | null
}

const VALID_TYPES = new Set(['mcq', 'short_answer', 'paragraph'])
const MAX_QUESTION_LENGTH = 2000
const MAX_OPTION_LENGTH = 500
const MAX_OPTIONS_PER_QUESTION = 10
const MAX_QUESTIONS = 100

// Validates and sanitises a single question from the LLM response
// Throws if the shape is unrecoverable, strips/clamps values where possible
function validateQuestion(raw: unknown, index: number): ParsedQuestion {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Question ${index} is not an object`)
  }

  const q = raw as Record<string, unknown>

  // type
  if (!VALID_TYPES.has(q.type as string)) {
    throw new Error(`Question ${index} has invalid type: ${q.type}`)
  }
  const type = q.type as ParsedQuestion['type']

  // question text
  if (typeof q.question !== 'string' || q.question.trim().length === 0) {
    throw new Error(`Question ${index} has empty or missing question text`)
  }
  const question = q.question.trim().slice(0, MAX_QUESTION_LENGTH)

  // options — required for MCQ, must be null for others
  let options: string[] | null = null
  if (type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${index} is MCQ but has fewer than 2 options`)
    }
    if (q.options.length > MAX_OPTIONS_PER_QUESTION) {
      throw new Error(`Question ${index} has too many options (max ${MAX_OPTIONS_PER_QUESTION})`)
    }
    options = q.options.map((opt: unknown, oi: number) => {
      if (typeof opt !== 'string') throw new Error(`Question ${index} option ${oi} is not a string`)
      return opt.trim().slice(0, MAX_OPTION_LENGTH)
    })
  }

  // correctIndex — must be a valid index into options, or null
  let correctIndex: number | null = null
  if (q.correctIndex !== null && q.correctIndex !== undefined) {
    const ci = Number(q.correctIndex)
    if (!Number.isInteger(ci)) {
      throw new Error(`Question ${index} correctIndex is not an integer`)
    }
    if (type === 'mcq' && options !== null) {
      if (ci < 0 || ci >= options.length) {
        // Out-of-bounds correct index — treat as no answer key rather than crashing
        correctIndex = null
      } else {
        correctIndex = ci
      }
    }
    // Non-MCQ: ignore correctIndex even if LLM sent one
  }

  return { type, question, options, correctIndex }
}

export async function parseQuestions(rawText: string): Promise<ParsedQuestion[]> {
  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    temperature: 0,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: PARSE_SYSTEM_PROMPT },
      { role: 'user', content: rawText },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq')

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Groq returned invalid JSON')
  }

  if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as Record<string, unknown>).questions)) {
    throw new Error('Groq response missing questions array')
  }

  const raw = (parsed as Record<string, unknown>).questions as unknown[]

  if (raw.length === 0) {
    throw new Error('No questions found in the document')
  }

  if (raw.length > MAX_QUESTIONS) {
    throw new Error(`Too many questions (max ${MAX_QUESTIONS})`)
  }

  // Validate every question — fail fast on unrecoverable shape errors
  return raw.map((q, i) => validateQuestion(q, i))
}