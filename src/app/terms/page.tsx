import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the Formify terms of service. Learn about acceptable use, uploaded content, disclaimers, and how the free AI-powered question paper to Google Form converter works.',
  alternates: {
    canonical: 'https://formif.me/terms',
  },
  openGraph: {
    title: 'Terms of Service | Formify',
    description:
      'Read the Formify terms of service covering acceptable use, content rights, disclaimers, and more.',
    url: 'https://formif.me/terms',
  },
}

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2.5rem' }}>
        Last updated: {lastUpdated}
      </p>

      <Section title="1. Acceptance of terms">
        <p>
          By accessing or using Formify (&quot;the Service&quot;), you agree to be bound by these
          Terms of Service. If you do not agree to these terms, do not use the Service.
        </p>
      </Section>

      <Section title="2. Description of the Service">
        <p>
          Formify is a tool that converts question papers (PDF or DOCX files) into Google Forms.
          You upload a document, we extract the questions using AI, and create a Google Form in
          your Google Drive on your behalf. The Service is provided free of charge.
        </p>
      </Section>

      <Section title="3. Google account and authentication">
        <p>
          To use Formify, you must sign in with a Google account. By signing in, you authorise
          Formify to:
        </p>
        <ul>
          <li>Access your basic profile information (name and email) for session identification.</li>
          <li>
            <strong><code>forms.body</code></strong> — &quot;The app creates Google Forms on behalf of the user by converting uploaded question papers. This scope is required to create and populate form items.&quot;
          </li>
          <li>
            <strong><code>drive.file</code></strong> — &quot;The app saves created Google Forms to the user&apos;s Google Drive. This scope is limited to files created by the app and does not access any existing Drive files.&quot;
          </li>
        </ul>
        <p>
          You may revoke access at any time via{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
            myaccount.google.com/permissions
          </a>.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Upload files that contain malware, malicious code, or content designed to exploit the Service.</li>
          <li>Attempt to reverse-engineer, decompile, or otherwise access the source code of the Service beyond what is publicly available.</li>
          <li>Use the Service to violate any applicable laws, regulations, or third-party rights (including intellectual property and privacy rights).</li>
          <li>Use automated scripts or bots to access the Service in a manner that exceeds reasonable use.</li>
          <li>Misrepresent your identity or impersonate another person when using the Service.</li>
        </ul>
      </Section>

      <Section title="5. Uploaded content">
        <p>
          You retain all rights to the documents you upload. By uploading a file, you grant
          Formify a temporary, limited licence to process the file&apos;s content solely for the
          purpose of extracting questions and creating a Google Form. This content is sent to
          our AI provider (Groq) for processing and is not stored after the request completes.
        </p>
        <p>
          You are responsible for ensuring you have the right to upload and process any content
          you submit to the Service.
        </p>
      </Section>

      <Section title="6. Intellectual property">
        <p>
          The Formify name, logo, user interface, and underlying code are the property of
          Formify&apos;s creators. These terms do not grant you any right to use the Formify
          brand or marks without prior written permission.
        </p>
        <p>
          Google Forms and Google Drive are trademarks of Google LLC. Formify is not affiliated
          with, endorsed by, or sponsored by Google.
        </p>
      </Section>

      <Section title="7. Disclaimer of warranties">
        <p>
          The Service is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong> without
          warranties of any kind, either express or implied, including but not limited to implied
          warranties of merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p>
          We do not guarantee that:
        </p>
        <ul>
          <li>The Service will be uninterrupted, secure, or error-free.</li>
          <li>AI-generated question parsing will be 100% accurate. You should always review the generated Google Form before distributing it.</li>
          <li>The Service will be compatible with all document formats or layouts.</li>
        </ul>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, Formify and its creators shall not
          be liable for any indirect, incidental, special, consequential, or punitive damages, or
          any loss of data, opportunities, reputation, or profits, arising out of or related to
          your use of the Service — regardless of whether such damages were foreseeable and whether
          Formify was advised of the possibility of such damages.
        </p>
      </Section>

      <Section title="9. Service availability and changes">
        <p>
          We reserve the right to modify, suspend, or discontinue the Service (or any part of it)
          at any time, with or without notice. We are not liable to you or any third party for any
          modification, suspension, or discontinuation of the Service.
        </p>
      </Section>

      <Section title="10. Third-party services">
        <p>
          Formify relies on the following third-party services. Your use of Formify is also subject
          to the terms of these providers:
        </p>
        <ul>
          <li>
            <strong>Google</strong> —{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
              Google Terms of Service
            </a>
          </li>
          <li>
            <strong>Groq</strong> —{' '}
            <a href="https://groq.com/terms-of-use" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
              Groq Terms of Use
            </a>
          </li>
          <li>
            <strong>Vercel</strong> —{' '}
            <a href="https://vercel.com/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
              Vercel Terms of Service
            </a>
          </li>
        </ul>
      </Section>

      <Section title="11. Termination">
        <p>
          We may restrict or terminate your access to the Service at our discretion if we believe
          you have violated these terms. You may stop using the Service at any time by revoking
          Formify&apos;s access to your Google account.
        </p>
      </Section>

      <Section title="12. Changes to these terms">
        <p>
          We may update these Terms of Service from time to time. When we do, we will update the
          &quot;Last updated&quot; date at the top of this page. Continued use of the Service after
          changes are posted constitutes your acceptance of the revised terms.
        </p>
      </Section>

      <Section title="13. Governing law">
        <p>
          These terms shall be governed by and construed in accordance with applicable laws,
          without regard to conflict-of-law principles. Any disputes arising from these terms
          or your use of the Service shall be resolved through good-faith negotiation first.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          If you have questions about these terms, contact us at:{' '}
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
