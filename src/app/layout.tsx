import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const BASE_URL = "https://formif.me";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Formify — Turn Question Papers into Google Forms with AI",
    template: "%s | Formify",
  },
  description:
    "Formify is a free AI tool that converts PDF or DOCX question papers into Google Forms instantly. Upload your file, review the extracted questions, and create a form in your Google Drive with one click.",
  keywords: [
    "convert PDF to Google Form",
    "convert DOCX to Google Form",
    "question paper to Google Form",
    "AI Google Form generator",
    "PDF to quiz",
    "exam paper converter",
    "Google Forms automation",
    "Formify",
    "free AI tool",
  ],
  authors: [{ name: "Formify" }],
  creator: "Formify",
  publisher: "Formify",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Formify",
    title: "Formify — Turn Question Papers into Google Forms with AI",
    description:
      "Free AI tool that converts PDF or DOCX question papers into Google Forms instantly. No manual entry. Upload, review, and create.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Formify — Turn any question paper into a Google Form",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Formify — Turn Question Papers into Google Forms with AI",
    description:
      "Free AI tool that converts PDF or DOCX question papers into Google Forms instantly. Upload, review, and create in seconds.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@OjaswitSingh",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Formify",
  url: BASE_URL,
  description:
    "Formify is a free AI-powered tool that converts PDF or DOCX question papers into Google Forms instantly.",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Convert PDF to Google Form",
    "Convert DOCX to Google Form",
    "AI-powered question extraction",
    "Google Drive integration",
    "Instant form creation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <link rel="canonical" href={BASE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics/>
      </body>
    </html>
  );
}