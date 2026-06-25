# Recent Project Changes

## Overview
These are the project updates currently present in the working tree.
The app has been converted from the default Next.js starter into a Google Forms generation tool with:
- document upload support for PDF and DOCX
- text extraction on the client
- question parsing via Groq / Claude-style prompt logic
- Google OAuth sign-in using `next-auth`
- Google Forms creation through the Forms API
- a new UI layout, components, and styling

## New / Added Files
The following files are untracked and appear to be newly added:

- `FORMIFY_PRODUCT_DOC(1).md`
- `src/auth.ts`
- `src/app/providers.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/create-form/route.ts`
- `src/app/api/parse/route.ts`
- `src/components/Navbar.tsx`
- `src/components/QuestionEditor.tsx`
- `src/components/SignInModal.tsx`
- `src/components/SuccessState.tsx`
- `src/components/UploadZone.tsx`
- `src/lib/extract.ts`
- `src/lib/llm.ts`
- `src/types/formify.ts`
- `src/types/next-auth.d.ts`

## Modified Files
The following tracked files have been changed:

- `package.json`
- `package-lock.json`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`

## What Changed

### `package.json`
- Added dependencies:
  - `mammoth` for DOCX extraction
  - `next-auth` for authentication
  - `openai` for Groq-compatible LLM requests
- Kept core Next.js and React dependencies at current versions.

### `package-lock.json`
- Updated automatically to reflect the new dependency additions and their resolved versions.

### `src/app/layout.tsx`
- Replaced the default starter layout with a custom root layout.
- Added Google font loading via `next/font/google` for `Geist`, `Geist_Mono`, and `Inter`.
- Wrapped children with a `Providers` component for global auth/session handling.

### `src/app/providers.tsx`
- Added a NextAuth `SessionProvider` wrapper to enable auth state in client components.

### `src/app/page.tsx`
- Replaced the default Next.js starter home page.
- Introduced a state machine using `AppState` values: `idle`, `analyzing`, `ready`, `creating`, `done`.
- Added document upload flow supporting `.docx` and `.pdf` files.
- Added question extraction and parsing via `src/lib/extract.ts` and `/api/parse`.
- Added Google Form creation flow via `/api/create-form`.
- Added a sign-in modal and persisted pending upload state across OAuth redirects.
- Added component composition with:
  - `Navbar`
  - `UploadZone`
  - `QuestionEditor`
  - `SignInModal`
  - `SuccessState`

### `src/app/globals.css`
- Replaced default Tailwind starter styles with new UI styling tokens and layout rules.
- Added custom classes for navbar, hero, upload zone, editor, modal, buttons, and success state.
- Introduced custom design variables such as `--bg`, `--surface`, `--text-primary`, `--indigo`, and more.
- Added animations for loading and transitions.

### `src/auth.ts`
- Configured `next-auth` with Google OAuth provider.
- Added Google Forms and Drive scopes:
  - `https://www.googleapis.com/auth/forms.body`
  - `https://www.googleapis.com/auth/drive.file`
- Persisted `access_token` in the JWT/session for API route use.

### `src/app/api/auth/[...nextauth]/route.ts`
- Added route exports for NextAuth auth callback handling.

### `src/app/api/parse/route.ts`
- Added a new API route to receive extracted raw text and return structured questions.
- Validates input text length and returns JSON errors on failure.
- Delegates parsing to `src/lib/llm.ts`.

### `src/app/api/create-form/route.ts`
- Added a new API route to create a Google Form using the Forms API.
- Authenticates using the Google access token from the user session.
- Creates the form, adds questions, and optionally patches grading for MCQ correct answers.
- Returns the edit URL for the created form.

### `src/lib/extract.ts`
- Added client-side extraction helpers for DOCX and PDF.
- Uses `mammoth` for DOCX extraction.
- Loads `pdf.js` dynamically from CDN for PDF extraction in the browser.
- Provides `extractFromDocx(file)` and `extractFromPdf(file)`.

### `src/lib/llm.ts`
- Added an LLM integration layer for Groq chat completions.
- Uses `process.env.GROQ_API_KEY` and `https://api.groq.com/openai/v1`.
- Defines a strict prompt that returns only JSON with question objects.
- Exposes `parseQuestions(rawText)`.

### `src/types/formify.ts`
- Added typed models for the app:
  - `QuestionType`
  - `AppState`
  - `Question`
  - `RawQuestion`
- Added helper functions:
  - `toQuestion(raw, index)`
  - `detectEquationWarning(q)`
- Added equation-warning heuristics for math-style questions.

### `src/types/next-auth.d.ts`
- Extended NextAuth types to include `access_token` on `Session` and `JWT`.

### `src/components/Navbar.tsx`
- Added a top navigation bar.
- Shows sign-in / sign-out state.
- Displays the signed-in user's name or email.

### `src/components/UploadZone.tsx`
- Added a drag-and-drop / click-to-upload file input UI.
- Supports idle, analyzing, and ready states.
- Shows file name and replace action after upload.
- Uses accessible keyboard behavior.

### `src/components/QuestionEditor.tsx`
- Added an editable question review UI.
- Supports question type switching between `mcq`, `short_answer`, and `paragraph`.
- Supports MCQ option editing, adding/removing options, and marking the correct answer.
- Recomputes equation warnings when text or question type changes.

### `src/components/SignInModal.tsx`
- Added a modal prompting the user to sign in with Google.
- Uses `next-auth` `signIn('google')` to trigger auth.
- Includes a Google-branded button UI.

### `src/components/SuccessState.tsx`
- Added a final success screen after form creation.
- Shows the created form link, copy-to-clipboard, and restart action.

## Coding Nomenclature Changes
- Introduced explicit typed unions and domain-specific state names:
  - `AppState` = `idle`, `analyzing`, `ready`, `creating`, `done`
  - `QuestionType` = `mcq`, `short_answer`, `paragraph`
- Introduced `Question` / `RawQuestion` separation for parsed backend output vs local UI state.
- Added clear helper naming for extraction and parsing functions:
  - `extractFromDocx`
  - `extractFromPdf`
  - `parseQuestions`
  - `handleCreateForm`
  - `processFile`
- Added `SessionProvider` and `auth` naming for authentication flow.

## Notes
- The current diff does not show an explicit dependency named `google-stitch`; the UI work appears to be implemented with React, Next.js, custom components, and Tailwind-style CSS.
- The new UI is now structured around custom React components and app state, replacing the default Next.js starter page.
- If you want, I can also generate a clean git `CHANGELOG` entry or move this summary into `CHANGELOG.md` instead.