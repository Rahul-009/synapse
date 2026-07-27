const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // Groq caps base64 images at ~4MB
const MAX_DOC_BYTES = 20 * 1024 * 1024 // agent service multer limit
const DOC_EXTENSIONS = ['.pdf', '.txt', '.md']

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export async function readImageAttachment(file) {
  if (!file.type.startsWith('image/')) throw new Error('Not an image file')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image is too large (max 4MB)')
  return { kind: 'image', name: file.name, dataUrl: await readAsDataUrl(file) }
}

// Documents are uploaded raw to the agent service, which parses, chunks,
// embeds and indexes them (RAG) — no client-side extraction needed
export async function readDocumentAttachment(file) {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!DOC_EXTENSIONS.includes(extension)) {
    throw new Error('Only .pdf, .txt and .md files are supported')
  }
  if (file.size > MAX_DOC_BYTES) throw new Error('File is too large (max 20MB)')
  return { kind: 'document', name: file.name, file }
}
