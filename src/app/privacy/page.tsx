import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Privacy Policy — Formify',
  description: 'Privacy policy for Formify',
}

export default function PrivacyPage() {
  const lastUpdated = 'June 2025'

  return (
    <main style={{
      maxWidth: 680,
      margin: '0 auto',
      padding: '3rem 1.5rem 5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#111827',
      lineHeight: 1.7,
    }}>
      <Link href="/" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
        ← Back to Formify
      </Link>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2.5rem' }}>
        Last updated: {lastUpdated}
      </p>

      <Section title="1. What Formify does">
        <p>
          Formify is a tool that converts question papers (PDF or DOCX files) into Google Forms.
          You upload a file, we extract the questions using AI, and create a Google Form in your
          Google Drive on your behalf.
        </p>
      </Section>

      <Section title="2. What data we collect">
        <p>We collect the minimum data necessary to operate the service:</p>
        <ul>
          <li><strong>Google account information</strong> — your name and email address, obtained when you sign in with Google. We use this only to identify your session.</li>
          <li><strong>Google OAuth access token</strong> — a short-lived token that allows us to create Google Forms in your Drive on your behalf. This token is stored in your session cookie and is never written to a database.</li>
          <li><strong>Uploaded file content</strong> — the text extracted from your PDF or DOCX file is sent to our AI provider (Groq) to identify questions. We do not store this text after the request completes.</li>
        </ul>
      </Section>

      <Section title="3. What data we do NOT collect">
        <ul>
          <li>We do not store your uploaded files on our servers.</li>
          <li>We do not store the questions parsed from your documents.</li>
          <li>We do not store the Google Forms we create on your behalf — they go directly into your Google Drive.</li>
          <li>We do not sell, share, or monetise your data in any way.</li>
          <li>We do not use your data to train AI models.</li>
          <li>We do not use analytics trackers or advertising cookies.</li>
        </ul>
      </Section>

      <Section title="4. Google API usage">
        <p>
          Formify uses the following Google APIs on your behalf after you sign in:
        </p>
        <ul>
          <li>
            <strong><code>forms.body</code></strong> — &quot;The app creates Google Forms on behalf of the user by converting uploaded question papers. This scope is required to create and populate form items.&quot;
          </li>
          <li>
            <strong><code>drive.file</code></strong> — &quot;The app saves created Google Forms to the user&apos;s Google Drive. This scope is limited to files created by the app and does not access any existing Drive files.&quot;
          </li>
        </ul>
        <p>
          Formify&apos;s use of Google user data complies with the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>
          Google user data obtained through these APIs is never used to train, fine-tune, or improve any AI or machine learning model, including the AI models used by Formify for question extraction.
        </p>
      </Section>

      <Section title="5. Third-party services">
        <ul>
          <li>
            <strong>Groq</strong> — the extracted text from your document is sent to Groq&apos;s API
            to identify and structure questions. Groq&apos;s privacy policy is available at{' '}
            <a href="https://groq.com/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
              groq.com/privacy-policy
            </a>.
          </li>
          <li>
            <strong>Vercel</strong> — Formify is hosted on Vercel. Vercel may log standard
            HTTP request metadata (IP address, timestamp, route) for operational purposes.
            Vercel&apos;s privacy policy is at{' '}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
              vercel.com/legal/privacy-policy
            </a>.
          </li>
        </ul>
      </Section>

      <Section title="6. Cookies and session storage">
        <p>
          Formify uses a single session cookie managed by NextAuth to keep you signed in.
          This cookie contains your session token and expires when you sign out or after
          a standard session period. We do not use advertising cookies or third-party tracking cookies.
        </p>
        <p>
          We also use browser <code>sessionStorage</code> temporarily to preserve your work
          across the Google sign-in redirect. This data is cleared immediately after the
          redirect completes and never leaves your browser.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          We do not operate a database. No Google user data, uploaded documents, or parsed questions are persisted beyond the duration of your active session. Your Google access token is stored in an encrypted session cookie that expires when you sign out or after 30 days of inactivity. You can revoke Formify&apos;s access to your Google account at any time by visiting myaccount.google.com/permissions.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          Because we do not store personal data beyond your active session, there is nothing
          to delete or export. You can revoke Formify&apos;s access to your Google account at any
          time by visiting{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
            myaccount.google.com/permissions
          </a>{' '}
          and removing Formify from the list of connected apps.
        </p>
      </Section>

      <Section title="8a. Data protection and security">
        <p>
          We implement standard security measures to protect your sensitive data. All data transferred 
          between your browser and our servers, as well as between our servers and Google or Groq APIs, 
          is encrypted in transit using Transport Layer Security (TLS 1.2 or higher/HTTPS). 
          Furthermore, your Google OAuth access token is stored exclusively in your browser&apos;s 
          encrypted session cookie and is never written to disk or any database.
        </p>
      </Section>

      <Section title="9. Children's privacy">
        <p>
          Formify is not directed at children under 13. We do not knowingly collect personal
          information from children under 13.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          If we make material changes to this policy, we will update the &quot;Last updated&quot; date
          at the top of this page. Continued use of Formify after changes constitutes
          acceptance of the updated policy.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          If you have questions about this privacy policy or how your data is handled,
          contact us at:{' '}
          <a href="mailto:ojaswitsingh10@gmail.com" style={{ color: '#4f46e5' }}>
            ojaswitsingh10@gmail.com
          </a>
        </p>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontSize: '1.0625rem',
        fontWeight: 600,
        marginBottom: '0.625rem',
        color: '#111827',
      }}>
        {title}
      </h2>
      <div style={{ fontSize: '0.9375rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {children}
      </div>
    </section>
  )
}