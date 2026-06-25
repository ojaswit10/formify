import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { rateLimit } from '@/lib/rateLimit'

// ── Types ──────────────────────────────────────────────────────────────────

interface ValidQuestion {
  type: 'mcq' | 'short_answer' | 'paragraph'
  question: string
  options: string[] | null
  correctIndex: number | null
}

// ── Constants ──────────────────────────────────────────────────────────────

const VALID_TYPES = new Set(['mcq', 'short_answer', 'paragraph'])
const MAX_QUESTIONS = 100
const MAX_TITLE_LENGTH = 500
const MAX_QUESTION_LENGTH = 2000
const MAX_OPTION_LENGTH = 500
const MAX_OPTIONS = 10

// ── Input validation ───────────────────────────────────────────────────────
// Never trust client-sent question data — re-validate server side
// A malicious user can POST arbitrary JSON to this endpoint directly

function validateBody(body: unknown): { title: string; questions: ValidQuestion[] } | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: 'Invalid request body' }

  const b = body as Record<string, unknown>

  if (typeof b.title !== 'string' || b.title.trim().length === 0) {
    return { error: 'Title is required' }
  }
  const title = b.title.trim().slice(0, MAX_TITLE_LENGTH)

  if (!Array.isArray(b.questions) || b.questions.length === 0) {
    return { error: 'Questions array is required' }
  }
  if (b.questions.length > MAX_QUESTIONS) {
    return { error: `Too many questions (max ${MAX_QUESTIONS})` }
  }

  const questions: ValidQuestion[] = []

  for (let i = 0; i < b.questions.length; i++) {
    const q = b.questions[i]
    if (typeof q !== 'object' || q === null) return { error: `Question ${i} is invalid` }

    const { type, question, options, correctIndex } = q as Record<string, unknown>

    if (!VALID_TYPES.has(type as string)) return { error: `Question ${i} has invalid type` }
    if (typeof question !== 'string' || question.trim().length === 0) return { error: `Question ${i} text is empty` }

    const cleanQuestion = (question as string).trim().slice(0, MAX_QUESTION_LENGTH)
    let cleanOptions: string[] | null = null
    let cleanCorrectIndex: number | null = null

    if (type === 'mcq') {
      if (!Array.isArray(options) || options.length < 2 || options.length > MAX_OPTIONS) {
        return { error: `Question ${i} must have 2–${MAX_OPTIONS} options` }
      }
      cleanOptions = options.map((o: unknown, oi: number) => {
        if (typeof o !== 'string') return { error: `Question ${i} option ${oi} is not a string` }
        return (o as string).trim().slice(0, MAX_OPTION_LENGTH)
      }) as string[]

      if (correctIndex !== null && correctIndex !== undefined) {
        const ci = Number(correctIndex)
        if (Number.isInteger(ci) && ci >= 0 && ci < cleanOptions.length) {
          cleanCorrectIndex = ci
        }
        // Out-of-bounds index → silently drop rather than crash
      }
    }

    questions.push({
      type: type as ValidQuestion['type'],
      question: cleanQuestion,
      options: cleanOptions,
      correctIndex: cleanCorrectIndex,
    })
  }

  return { title, questions }
}

// ── Form item builder ──────────────────────────────────────────────────────

function buildFormItem(q: ValidQuestion, index: number) {
  if (q.type === 'mcq') {
    return {
      createItem: {
        item: {
          title: q.question,
          questionItem: {
            question: {
              required: false,
              choiceQuestion: {
                type: 'RADIO',
                options: q.options!.map((opt) => ({ value: opt })),
                shuffle: false,
              },
            },
          },
        },
        location: { index },
      },
    }
  }

  if (q.type === 'short_answer') {
    return {
      createItem: {
        item: {
          title: q.question,
          questionItem: {
            question: { required: false, textQuestion: { paragraph: false } },
          },
        },
        location: { index },
      },
    }
  }

  return {
    createItem: {
      item: {
        title: q.question,
        questionItem: {
          question: { required: false, textQuestion: { paragraph: true } },
        },
      },
      location: { index },
    },
  }
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────
  const session = await auth()
  if (!session || !session.access_token) {
    return NextResponse.json(
      { error: 'Not authenticated. Please sign in with Google.' },
      { status: 401 }
    )
  }

  // ── Rate limit: 10 forms per user per 10 minutes ──────────────────────
  const userId = session.user?.email ?? 'anonymous'
  if (!rateLimit(`create-form:${userId}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes.' },
      { status: 429 }
    )
  }

  // ── Parse + validate body ─────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validated = validateBody(rawBody)
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { title, questions } = validated
  const accessToken = session.access_token

  try {
    // ── Step 1: Create blank form ───────────────────────────────────────
    const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ info: { title } }),
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      console.error('[create-form] Form creation failed:', err)
      return NextResponse.json({ error: 'Failed to create Google Form.' }, { status: 502 })
    }

    const form = await createRes.json()
    const formId = form?.formId
    if (!formId || typeof formId !== 'string') {
      return NextResponse.json({ error: 'Unexpected response from Google Forms API.' }, { status: 502 })
    }

    // ── Step 2: Add all questions ───────────────────────────────────────
    const createRequests = questions.map((q, i) => buildFormItem(q, i))

    const createItemsRes = await fetch(
      `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: createRequests }),
      }
    )

    if (!createItemsRes.ok) {
      const err = await createItemsRes.json().catch(() => ({}))
      console.error('[create-form] batchUpdate failed:', err)
      return NextResponse.json(
        { error: 'Form was created but questions could not be added.' },
        { status: 502 }
      )
    }

    // ── Step 3: Patch grading for MCQs with answer keys ─────────────────
    const questionsWithAnswers = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.type === 'mcq' && q.correctIndex !== null)

    if (questionsWithAnswers.length > 0) {
      const formRes = await fetch(
        `https://forms.googleapis.com/v1/forms/${formId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (formRes.ok) {
        const formData = await formRes.json().catch(() => null)
        const items = formData?.items as Array<{ itemId: string }> | undefined

        if (Array.isArray(items)) {
          const gradingRequests = [
            {
              updateSettings: {
                settings: { quizSettings: { isQuiz: true } },
                updateMask: 'quizSettings.isQuiz',
              },
            },
            ...questionsWithAnswers
              .filter(({ i }) => items[i]?.itemId)
              .map(({ q, i }) => ({
                updateItem: {
                  item: {
                    itemId: items[i].itemId,
                    title: q.question,
                    questionItem: {
                      question: {
                        required: false,
                        choiceQuestion: {
                          type: 'RADIO',
                          options: q.options!.map((opt) => ({ value: opt })),
                          shuffle: false,
                        },
                        grading: {
                          pointValue: 1,
                          correctAnswers: {
                            answers: [{ value: q.options![q.correctIndex!] }],
                          },
                        },
                      },
                    },
                  },
                  updateMask: 'questionItem.question.grading,questionItem.question.choiceQuestion',
                  location: { index: i },
                },
              })),
          ]

          const gradingRes = await fetch(
            `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ requests: gradingRequests }),
            }
          )

          if (!gradingRes.ok) {
            // Non-fatal — form exists with questions, grading just won't be set
            const err = await gradingRes.json().catch(() => ({}))
            console.error('[create-form] grading batchUpdate failed:', err)
          }
        }
      }
    }

    const formUrl = `https://docs.google.com/forms/d/${formId}/edit`
    return NextResponse.json({ formUrl, formId })

  } catch (err) {
    console.error('[create-form] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}