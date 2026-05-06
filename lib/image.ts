// Resize and convert any image to JPEG client-side before upload.
// Solves: huge iPhone photos (4-8MB → ~400KB), HEIC compatibility,
// inconsistent format handling on mobile Safari.

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

export async function processImageForUpload(file: File): Promise<Blob> {
  const dataUrl = await readFileAsDataURL(file)
  const img = await loadImage(dataUrl)

  const { width, height } = scaleToFit(img.naturalWidth, img.naturalHeight, MAX_DIMENSION)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.drawImage(img, 0, 0, width, height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not convert image to JPEG'))
      },
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error('Could not decode image — unsupported format?'))
    img.src = src
  })
}

function scaleToFit(
  w: number,
  h: number,
  max: number
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h }
  const ratio = w > h ? max / w : max / h
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}