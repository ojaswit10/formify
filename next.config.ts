import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents the page from being embedded in an iframe (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stops browsers from MIME-sniffing the content type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Forces HTTPS for 1 year in production
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Restricts what the browser can load — tightened to only what Formify needs
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js needs unsafe-inline for its runtime styles; pdf.js worker needs blob:
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      // pdf.js worker loads as a blob URL
      "worker-src blob: https://cdnjs.cloudflare.com",
      // pdf.js and the Google APIs we call
      "connect-src 'self' https://api.groq.com https://forms.googleapis.com https://www.googleapis.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "frame-src 'none'",
    ].join('; '),
  },
  // Controls how much referrer info is sent
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restricts browser features Formify doesn't use
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig