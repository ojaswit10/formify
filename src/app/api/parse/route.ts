import { NextRequest, NextResponse } from 'next/server'
import { parseQuestions } from '@/lib/llm'
import { rateLimit } from '@/lib/rateLimit'

const MAX_TEXT_LENGTH = 20000

export async function POST(req: NextRequest) {
  // ── Rate limit: 20 parses per IP per 10 minutes ───────────────────────
  // Uses x-forwarded-for (set by Vercel) falling back to a generic key
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(`parse:${ip}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes.' },
      { status: 429 }
    )
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { text } = body as Record<string, unknown>

  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text too long. Max ${MAX_TEXT_LENGTH.toLocaleString()} characters.` },
      { status: 400 }
    )
  }

  try {
    const questions = await parseQuestions(text)
    return NextResponse.json({ questions })
  } catch (err) {
    // Log the real error server-side, return a safe message to the client
    console.error('[/api/parse] Error:', err instanceof Error ? err.message : err)
    const userMessage = err instanceof Error ? err.message : 'Failed to parse questions.'
    return NextResponse.json({ error: userMessage }, { status: 500 })
  }
}