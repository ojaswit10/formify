# Formify — Product & Technical Reference

> The complete build reference for a questions-to-Google-Form converter.
> Use this document to start a fresh coding chat with full context.

---

## The Idea in One Line

A free web tool that takes a list of questions (from plain text, PDF, or DOCX) and creates a real, ready-to-share Google Form in one click — no manual entry, no subscriptions for basic use.

---

## Why This Exists (The Gap)

Every existing solution has a critical last-mile problem:

- **Gemini / ChatGPT** — can format questions nicely but explicitly cannot create a Google Form. The user still has to manually enter everything.
- **Automagical Forms** — Google Workspace add-on, requires install, paid for serious use.
- **Doc2Form** — uses Gemini + Forms API (same approach we're taking), but 1 free trial then expensive credits.
- **Formswrite, Weavely, others** — paywalled almost immediately, $9–30/month for what is a simple conversion task.
- **Form Ranger** — only populates existing question choices, does not create the form itself.
- **Manual keyboard shortcuts** — the current "best free" method takes 3–4 minutes for 10 questions, scales badly.

**Our edge:** Genuinely free for the common case (typed questions, clean PDF), one-click form creation directly in the user's own Google Drive, editable preview before creating so users can catch parser mistakes. No install, no add-on, browser only.

---

## Validated Demand

Posted on r/Teachers (incognito, as a genuine user asking "does this tool exist") — confirmed signals:

- Multiple teachers described manually typing questions as a real, recurring pain
- One teacher noted "building tons of Google Forms and losing access when you move schools" — adjacent pain (form portability, worth noting for later)
- Workarounds suggested were all clunky: Python scripts, ChatGPT formatting + manual paste, Gemini with "a bit of fiddling," paid add-ons
- Nobody said "just use X, it's perfect" — the gap is real

**Strong signal: when the top Reddit reply (17 upvotes) pushes back with "why are you manually typing, just copy/paste," and the OP correctly responds "I can't copy/paste the options for MCQ questions though" — that's the exact gap being described.**

---

## Target Users (v1)

Primary: **Teachers** creating quizzes, assessments, feedback forms. Secondary: **HR professionals** building intake/screening forms. Tertiary: **researchers** converting paper surveys to digital.

The user persona: non-technical, time-poor, uses Google Forms regularly, has questions in a Word doc or PDF already, does not want to install anything or learn a tool.

---

## The Full Data Flow

```
User opens website
│
├── Input method (three options in v1):
│   ├── Plain text paste (textarea)
│   ├── PDF upload → pdf.js extracts text CLIENT-SIDE (no upload to server)
│   └── DOCX upload → mammoth.js extracts text CLIENT-SIDE (no upload to server)
│
▼
Raw text sent to /api/parse (Next.js API route)
│
▼
Groq API call (llama-3.3-70b-versatile, temperature: 0, response_format: json_object)
│
▼
Structured JSON array returned:
[
  {
    "type": "mcq" | "short_answer" | "paragraph",
    "question": "What is the capital of France?",
    "options": ["Berlin", "Madrid", "Paris", "Rome"],  // null for non-MCQ
    "correctIndex": 2  // null if no answer detected in source
  },
  ...
]
│
▼
Editable preview rendered in browser
User can:
  - Edit any question text
  - Change question type
  - Mark/unmark correct answers (per option radio button)
  - Reorder questions (drag handle)
  - Delete questions
│
▼
User clicks "Create Google Form"
│
├── If not signed in: Google OAuth popup
│   Scopes: forms.body + drive.file ONLY (minimum required)
│
▼
/api/create-form called with JSON + user's access token
│
▼
Google Forms API (batchUpdate):
  - Create form with title
  - Add all questions with correct types
  - Set correct answers if user marked them (quiz mode)
│
▼
Form created in user's Google Drive
Live form link returned
│
▼
User sees: copy link button + "Open Form" button
Done. Zero manual entry.
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | You know this cold from Haven + LeetFight |
| Styling | Tailwind CSS | Same as your other projects |
| PDF extraction | pdf.js | Client-side, no server cost, Chrome's own viewer uses it |
| DOCX extraction | mammoth.js | Client-side, reliable text + basic structure extraction |
| LLM | Groq API (llama-3.3-70b-versatile) | Free tier, no credit card, OpenAI-compatible SDK |
| Auth | NextAuth v5 (Google provider) | Same pattern as Haven, you already know it |
| Google Forms | Google Forms API v1 | Free, no per-request cost |
| Hosting | Vercel | Free tier, you've deployed before |
| Database | None for v1 | Nothing to persist yet |

---

## LLM Choice — Groq

**Model:** `llama-3.3-70b-versatile`
**Why not 8B:** JSON structure hallucinations on ambiguous input. The 70B model is much more reliable for structured extraction tasks.
**Why not Claude API:** Stingy free tier, you're already using it on Haven.
**Why not OpenAI:** No real free tier anymore ($5 credits that expire).
**Why not Gemini:** Groq is faster and the SDK is identical to OpenAI's (zero learning curve).

**Free tier limits (Groq, as of 2026):**
- 30 requests per minute
- ~6,000 tokens per minute
- 1,000–14,400 requests per day depending on model
- No credit card required

**When you outgrow free tier:**
1. Groq Developer plan — add credit card, 10x limits, 25% cheaper (~$5–20/month at early scale)
2. Google AI Studio (Gemini Flash) — 1,500 req/day free, swap two lines in `lib/llm.ts`
3. Scale: Llama 3.3 70B on Groq paid = $0.59/$0.79 per million tokens (4x cheaper than GPT-4o)

---

## Critical Architecture Decision — The Abstraction Layer

Create `lib/llm.ts` as a single file that owns all LLM interaction. Everything else in the codebase calls `parseQuestions(text)` and never touches the API directly. This means switching providers = changing two lines, not a rewrite.

```typescript
// lib/llm.ts
import OpenAI from 'openai'

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
})

export async function parseQuestions(rawText: string) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,              // non-negotiable — deterministic JSON
    max_tokens: 2000,
    response_format: { type: 'json_object' },  // forces JSON, no markdown wrapping
    messages: [
      { role: 'system', content: PARSE_SYSTEM_PROMPT },
      { role: 'user', content: rawText }
    ]
  })
  return JSON.parse(response.choices[0].message.content!)
}
```

---

## The System Prompt (Most Important Single Piece)

This determines whether the tool works or doesn't. Test this against 10+ real question formats before building any UI.

```
You are a question parser. Extract questions from the provided text and return a JSON object with a single key "questions" containing an array.

Each question object must have:
- "type": "mcq" if the question has lettered/numbered options, "short_answer" if it expects a brief response, "paragraph" if it expects a long response
- "question": the question text only, no numbering prefix
- "options": array of option strings for MCQ (strip the A) B) 1. 2. prefix), null for other types
- "correctIndex": zero-based index of the correct option if marked in the source (look for ✓, (correct), *, bold, "Ans:", "Answer:"), null if not marked

Rules:
- Strip question numbers from question text (remove "1.", "Q1:", "Question 1:" etc.)
- Strip option prefixes from options (remove "A)", "a.", "1.", "(a)" etc.)
- If uncertain about question type, default to "short_answer"
- Never invent options that aren't in the source text
- Never guess correct answers — only mark correctIndex if explicitly indicated in the source
- Return ONLY the JSON object, no explanation, no markdown

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
      "question": "Explain the water cycle.",
      "options": null,
      "correctIndex": null
    }
  ]
}
```

---

## Performance Architecture — How to Avoid the "3-Minute Dashboard" Problem

Your friend's dashboard takes 3 minutes because of sequential API waterfalls. Here's how this tool avoids that by design:

**1. File extraction is client-side.**
pdf.js and mammoth.js run in the browser. By the time the user clicks "Convert," the text is already extracted — no upload round-trip, no server processing. Removes a full network hop before any API call happens.

**2. One meaningful API call.**
The only slow operation is the Groq parse call. There is no chain of calls. Google Forms API call happens after the user manually clicks "Create Form" — it's a deliberate second step, not a background waterfall.

**3. Stream the LLM response.**
Instead of waiting for Groq to finish the entire JSON, stream the response and update the preview as questions appear. A 2–3 second AI call feels instant when the user sees questions populating one by one. Next.js 15 API routes support streaming natively.

**4. Single-purpose API routes.**
`/api/parse` — takes text, returns JSON. That's it.
`/api/create-form` — takes JSON + OAuth token, calls Forms API, returns link. That's it.
No middleware chains, no database writes, no background jobs in v1.

**5. OAuth token in session.**
NextAuth stores the Google access token in the session cookie. Users who've already connected Google don't re-auth on every conversion. Refresh token logic is built into NextAuth's Google provider — you don't implement it.

---

## API Routes

### POST /api/parse
Input: `{ text: string }`
Output: `{ questions: Question[] }`
Error states: `{ error: "PARSE_FAILED" | "RATE_LIMITED" | "TEXT_TOO_LONG" }`

### POST /api/create-form
Input: `{ questions: Question[], title: string, accessToken: string }`
Output: `{ formUrl: string, editUrl: string }`
Error states: `{ error: "AUTH_FAILED" | "FORMS_API_ERROR" }`

---

## Question Type (TypeScript)

```typescript
type QuestionType = 'mcq' | 'short_answer' | 'paragraph'

interface Question {
  type: QuestionType
  question: string
  options: string[] | null      // only for mcq
  correctIndex: number | null   // null = no answer key
}
```

---

## Google Forms API — What You Need to Know

**Cost:** Free. No per-request billing. Part of Google Workspace APIs.

**Auth scopes needed (minimum):**
- `https://www.googleapis.com/auth/forms.body` — create and edit forms
- `https://www.googleapis.com/auth/drive.file` — place form in user's Drive

**The batchUpdate call structure:**

```javascript
// 1. Create the form
POST https://forms.googleapis.com/v1/forms
Body: { info: { title: "My Quiz" } }
→ Returns { formId, responderUri, linkedSheetId }

// 2. Add questions (single batchUpdate call — not one call per question)
POST https://forms.googleapis.com/v1/forms/{formId}:batchUpdate
Body: {
  requests: [
    // One request per question
    {
      createItem: {
        item: {
          title: "What is the capital of France?",
          questionItem: {
            question: {
              choiceQuestion: {
                type: "RADIO",
                options: [
                  { value: "Berlin" },
                  { value: "Madrid" },
                  { value: "Paris" },
                  { value: "Rome" }
                ]
              }
            }
          }
        },
        location: { index: 0 }
      }
    }
  ]
}
```

**Question type mapping:**
| Your type | Forms API type |
|---|---|
| mcq | `choiceQuestion` with `type: "RADIO"` |
| short_answer | `textQuestion` with `paragraph: false` |
| paragraph | `textQuestion` with `paragraph: true` |

**Setting correct answers (quiz mode):**
Requires a separate `updateSettings` request first to enable quiz mode, then `createItem` requests include `grading.correctAnswers`.

---

## Answer Handling Logic

Three scenarios, handled differently:

**Scenario A — Answers in the document (e.g. "C) Paris ✓" or "Ans: B")**
Parser detects and auto-populates `correctIndex`. User sees it in preview, can change if wrong.

**Scenario B — No answers in the document**
`correctIndex: null` for all questions. Form is created without an answer key. User can still manually click correct answers in the preview before creating.

**Scenario C — User wants to add/fix answers in preview**
Each MCQ question in the preview has a small radio button or "★" per option. Click to mark correct. This covers Scenario B and lets users fix wrong auto-detections from Scenario A.

**Important:** Never generate answers from the LLM. A teacher's quiz already has correct answers. LLM-hallucinated answers on a real exam are a critical trust-breaking bug.

---

## Math & Equation Handling

This is a real concern for college professor users (DBMS, COA, math questions). Understand the distinction clearly before building.

### What works in v1 with zero extra effort

Any math that is typed as plain text or Unicode comes through perfectly:

- Inline text math: "Find the value of 2x + 3 = 11", "What is 5 × 6?"
- Unicode symbols typed directly: σ, π, ⋈ (relational algebra), ∧ ∨ ¬ (logic), ∑ ∫ (calculus notation)
- SQL and relational algebra questions — almost always plain text, no issues
- COA questions with binary/hex: "Convert 0xFF to decimal", "1010₂ + 0110₂"
- DBMS normalization, ER diagram questions — plain text, works fine

**DBMS and COA are the best-case subjects for this tool. Most of their question content is typed text, not rendered equations.**

### What breaks in v1 — the hard case

When a professor uses **Word's equation editor** or **renders equations as images** in a PDF, those equations are stored as embedded image objects, not text. `mammoth.js` and `pdf.js` extract the surrounding text but silently drop the equation. The question arrives looking like:

> "Find the value of &nbsp;&nbsp;&nbsp;&nbsp; when x = 5"

...with a blank where the equation was. The LLM sees the blank, produces a broken question, and the form is wrong with no indication to the user.

This affects: calculus (integration, derivatives), matrix algebra, complex formula-heavy physics. It does NOT commonly affect DBMS, COA, or SQL which are typically typed.

### The v1 mitigation — equation warning indicator

This costs ~30 minutes to build and is the right trade-off. In the preview step, after parsing, scan each question for signs of possible dropped equations:

- Question text is unusually short relative to surrounding context
- Question contains phrases like "find the value of", "solve:", "evaluate:" but no actual expression follows
- Question text ends abruptly mid-sentence

When detected, show a small ⚠️ icon next to the question with tooltip: "This question may contain an equation that couldn't be extracted. Check and edit if needed."

The user sees the warning in the preview, fixes the question manually before creating the form. Silent failure → visible, fixable failure. This is the correct v1 response to a hard problem.

### Why not solve it properly in v1

LaTeX/equation rendering has three sub-problems, each non-trivial:

1. Detecting LaTeX strings vs. plain math text
2. Rendering in preview (KaTeX — manageable, ~1 day)
3. Getting equations into Google Form (render to image → upload via Forms API — genuinely complex, 3–5 days)

That's up to 5 extra days on top of the 5-day v1 plan — doubling build time for a feature needed by a subset of users whose actual behaviour hasn't been validated yet.

**The right trigger for building this:** a named professor tells you "I tried it, the equation problem is blocking me." Build it then, not speculatively now.

### What to tell professors when sharing v1

Be upfront: "Works great for text-based questions including most DBMS, COA, and SQL content. If your equations are in Word's equation editor or rendered as images in the PDF, those specific questions will show a warning in the preview — you can fix them manually before creating the form."

Honest expectation-setting is better than silent failure.

---

## v1 Scope — Be Strict

### In v1:
- Plain text paste → Google Form
- PDF upload → client-side text extraction → Google Form
- DOCX upload → client-side text extraction → Google Form
- Question types: MCQ and short answer (covers 90%+ of real use cases)
- Editable preview before form creation
- Mark correct answers in preview
- Equation warning indicator (⚠️ on questions that may have dropped equations)
- Google OAuth (forms + drive.file scopes only)
- Form created in user's Google Drive, link returned
- Free tier: 5 conversions/day unauthenticated, 20/day authenticated
- Basic rate limiting on API routes (simple in-memory or Upstash Redis)

### Explicitly out of v1:
- OCR / scanned PDFs / handwriting
- LaTeX / equation rendering (KaTeX preview + image upload to Forms)
- Paragraph question type (add in v1.1 — trivial once mcq works)
- Bulk upload (multiple files at once)
- Form templates or branding
- Chrome/Firefox extension
- Saving conversion history
- Answer key auto-generation by AI
- Image questions

---

## Version Roadmap

```
v1 — ship it, validate it (5 days)
  Plain text + PDF + DOCX → Google Form
  MCQ + short answer
  Editable preview
  Answer key marking
  Equation warning indicator (⚠️ for dropped equations)
  That's it.

v1.1 — first real feedback round (1–2 weeks post launch)
  Paragraph question type (trivial, one afternoon)
  Bug fixes from real usage
  LaTeX preview rendering (KaTeX) IF professors specifically asked for it

v2 — optimization + reach
  Algorithmic fast path (no LLM for clean structured input)
  OCR for scanned PDFs
  LaTeX → image → Forms API (full equation support, if v1.1 confirmed demand)
  Form portability / backup

v3 — if this has real traction
  Chrome/Firefox extension
  C++/WASM parser
  Multi-language support (Hindi, Odia, Tamil — no competitor does this)
  API access tier
```

**The rule:** every version is triggered by confirmed real user need, not pre-built speculation. v1 stays 5 days. Real usage tells you what v2 needs to be.

---

## v2 Features (After Real Users)

**Algorithmic fast path (most impactful v2 feature):**
Build a pattern detector that runs before the LLM call. If the text matches a high-confidence pattern (consistent numbering, lettered options, standard format), parse it deterministically — zero API cost, sub-100ms response. Fall back to Groq only for ambiguous input. This is a finite state machine / pattern scorer problem, not an ML problem.

```
receive text
→ run pattern detector (fast, free)
  → confidence > 90%: parse directly, skip LLM, return in <100ms
  → confidence < 90%: send to Groq, stream response
```

**LaTeX / equation rendering (full solution):**
Triggered only after professors confirm the v1 warning indicator isn't enough. Two-step implementation: (1) KaTeX rendering in the preview UI so professors see equations rendered correctly before creating the form — about 1 day of work. (2) Render equations to images client-side via canvas, upload to Google, attach to form questions via Forms API — 3–5 days, genuinely complex. Do not build step 2 speculatively. Build step 1 first (KaTeX preview), see if that alone satisfies the use case.

**OCR for scanned PDFs:**
Tesseract.js (free, runs in browser, less accurate) or Google Cloud Vision / AWS Textract (paid, better on phone-camera photos). Scope out of v1 because accuracy on real-world scans varies a lot — don't promise this until you can deliver it reliably. Label it clearly as "beta" when you add it.

**Chrome + Firefox extension (same codebase — WebExtensions API):**
The extension use case is different from the web app: user is already looking at a page with questions (a PDF open in Chrome, a Google Doc, a website) and wants to convert without switching tabs. Build the extension after the parsing logic is stable from production web app usage.

**Form portability / backup:**
One Reddit teacher mentioned "building forms in a school account and losing them when changing schools." Export forms as JSON, re-import to a new account. Real pain, no tool solves it.

**Paragraph question type:**
Trivial to add — same flow, different `textQuestion.paragraph: true`. Skipped in v1 only to reduce scope.

---

## v3 — If This Gets Real Traffic

**C++/WebAssembly parser for the clean-input fast path:**
The algorithmic parser from v2, rewritten in C++ and compiled to WASM. Runs entirely in the browser, zero server cost, sub-10ms parse time for clean structured input. Real performance differentiator vs. competitors who LLM-call everything. Good resume signal too — not just "I used a library," but "I understood the problem well enough to write a deterministic solution."

**Multi-language support:**
Indian regional languages (Hindi, Telugu, Odia, Tamil) for question parsing. No competitor does this. Groq's Llama models handle multilingual reasonably well — it's a prompt engineering problem, not a new model problem.

**API access tier:**
Let power users (teachers, school IT admins) call your conversion endpoint programmatically. Paid tier. This is the B2B monetisation path if the tool grows.

---

## Monetisation Path

**v1: Fully free** (validate that people actually use it)

**v1.5: Soft limits**
- Unauthenticated: 3 conversions/day
- Free account (Google sign-in): 20 conversions/day
- No hard paywall for basic use — generous free tier is the product differentiator

**v2: Paid tier**
- Unlimited conversions
- OCR for scanned PDFs
- Bulk upload
- API access
- Price: ₹199–399/month or $3–5/month (significantly below competitors' $9–30/month)

**Cost structure reality check:**
Each Groq call for a 10-question quiz uses roughly 500–800 input tokens + 400–600 output tokens. At paid Groq rates ($0.59/$0.79 per million tokens), that's less than $0.001 per conversion. You can offer a very generous free tier without losing money once you're on paid Groq.

---

## Domain Options

Pick something that describes the action, not just the category. When a teacher tells a colleague "just use X," the name should tell the colleague what X does.

**Top picks:**
- `formify.app` — clean, action verb
- `pastetoform.com` — literally describes the action
- `instiform.app` — instant + form
- `formflow.app` — flow implies automation

**Avoid:** Generic names like `formgen.dev` that don't communicate the specific value (converting *existing questions*, not generating new ones).

Check availability on Porkbun or Namecheap. `.app` and `.dev` domains are ~₹1,200–1,500/year. You already know custom DNS setup from `tryhaven.me`.

---

## Day-by-Day Build Order

**Day 1 — Validate the parser before building anything else**
Wire up `lib/llm.ts` + `/api/parse`. Build a dead-simple HTML textarea + fetch call. Throw 10 real question PDFs at it. Confirm the JSON output is reliable. Do NOT build UI yet. If the parser is unreliable, nothing else matters.

**Day 2 — Google OAuth + Forms API**
Get NextAuth working with Google, minimum scopes. Take the JSON from Day 1 and actually create a form. The "holy shit it works" moment. Verify the form appears in your own Google Drive.

**Day 3 — File upload (PDF + DOCX)**
Add mammoth.js and pdf.js, wire them to extract text client-side. Pass extracted text to the same `/api/parse` route. Test on 5 real uploaded files.

**Day 4 — Editable preview UI**
Render the question array as an editable list. Question text editable, type changeable, correct answer selectable, delete button per question. This is the feature that differentiates you from competitors who go parse → create with no review step.

**Day 5 — Rate limiting, polish, deploy**
Add per-IP rate limiting (Upstash Redis or simple in-memory for v1). Handle error states gracefully (parse failed, rate limited, Google auth expired). Deploy to Vercel. Test on mobile (teachers use phones). Go live.

---

## Key Differentiators vs Competitors

| Feature | Us | Doc2Form | Automagical | Gemini |
|---|---|---|---|---|
| Free for basic use | ✅ Genuinely | ❌ 1 trial | ❌ Limited | ✅ But no form creation |
| No install required | ✅ | ✅ | ❌ Needs add-on | ✅ |
| Editable preview | ✅ | ❌ | ✅ | ❌ |
| Creates real Google Form | ✅ | ✅ | ✅ | ❌ |
| Works on plain text paste | ✅ | Unclear | ✅ | ✅ |
| Answer key detection | ✅ | Unclear | ✅ paid | N/A |
| Equation warning indicator | ✅ v1 | ❌ | ❌ | ❌ |
| Full LaTeX rendering | 🔜 v2 | ❌ | ❌ | ❌ |

---

## What NOT to Build in v1

- Do not add OCR. It's a separate, harder, less reliable problem. State clearly "works on text-based PDFs, not scanned images."
- Do not add "generate questions from content." That's a different product (Automagical's "Unicorn AI" mode). Stay focused.
- Do not add user accounts/history. Nothing to persist yet.
- Do not build the Chrome extension first. Build the web app, validate the parsing, then extend.
- Do not try to handle every edge case. Ship something that handles single-column text PDFs well and be honest about limitations.

---

## Environment Variables Needed

```
GROQ_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

## Competitive Watch

- **Doc2Form** is open source — worth reading their codebase before building
- **Automagical** is the biggest player — watch their pricing changes, they're your indirect benchmark
- **Google themselves** could add this to Forms natively — this is the "Google kills us" risk, same risk every Google-adjacent tool has. Mitigation: move fast, get users, build switching costs via saved templates and form history (v2+)

---

## Notes for the Coding Chat

1. Start with `lib/llm.ts` and test the system prompt before any UI work
2. The Google Forms API `batchUpdate` should be a single call with all questions — not one call per question (you will hit rate limits and it will be slow)
3. `temperature: 0` on the Groq call is non-negotiable — you need deterministic JSON
4. `response_format: { type: 'json_object' }` is supported by Groq on llama-3.3-70b — use it, it eliminates an entire class of bugs
5. Client-side file extraction (pdf.js, mammoth.js) is the key performance decision — files never hit your server in v1
6. OAuth scopes: `forms.body` + `drive.file` only — do not request broader scopes, users (especially teachers with school accounts) will reject the auth if it looks greedy
7. Test on real teacher/exam PDFs, not synthetic ones you made yourself — real documents are messier than you expect
