import mammoth from 'mammoth'

declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (options: { data: ArrayBuffer }) => {
        promise: Promise<{
          numPages: number
          getPage: (pageNum: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str: string }>
            }>
          }>
        }>
      }
      GlobalWorkerOptions: { workerSrc: string }
    }
  }
}

// Converts a File to ArrayBuffer — both extractors need binary format
function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

// DOCX extraction via mammoth
// Mammoth reads the binary and returns { value: plainText, messages: warnings[] }
export async function extractFromDocx(file: File): Promise<string> {
  const arrayBuffer = await readAsArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer })
  if (!result.value || result.value.trim().length === 0) {
    throw new Error('Could not extract text from this DOCX file.')
  }
  return result.value.trim()
}

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs'
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'

// Loads pdf.js from CDN via a <script type="module"> tag and waits for it to be ready
// Turbopack doesn't support dynamic URL imports so we inject a script tag instead
function loadPdfJs(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded from a previous upload, resolve immediately
    if (window.pdfjsLib) { resolve(); return }

    const script = document.createElement('script')
    script.type = 'module'

    // Import pdf.js and attach it to window so we can access it outside module scope
    script.textContent = `
      import * as pdfjsLib from '${PDFJS_CDN}';
      pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_WORKER}';
      window.pdfjsLib = pdfjsLib;
      window.dispatchEvent(new Event('pdfjsLoaded'));
    `

    window.addEventListener('pdfjsLoaded', () => resolve(), { once: true })
    script.onerror = () => reject(new Error('Failed to load pdf.js from CDN'))
    document.head.appendChild(script)
  })
}

// PDF extraction via pdf.js
// Iterates every page, extracts text chunks, joins them into a single string
export async function extractFromPdf(file: File): Promise<string> {
  await loadPdfJs()

  const pdfjsLib = window.pdfjsLib!

  const arrayBuffer = await readAsArrayBuffer(file)
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pageTexts: string[] = []

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const content = await page.getTextContent()

    // Each item in content.items is a text chunk — join with spaces
    const pageText = content.items
      .map((item: { str: string }) => item.str)
      .join(' ')

    pageTexts.push(pageText)
  }

  const fullText = pageTexts.join('\n').trim()

  if (!fullText) {
    throw new Error(
      'Could not extract text from this PDF. It may be a scanned image — try copy-pasting the text instead.'
    )
  }

  return fullText
}