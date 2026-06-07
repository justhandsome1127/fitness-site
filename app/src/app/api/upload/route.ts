import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireUserId } from '@/lib/session'

const MAX_BYTES = 8 * 1024 * 1024 // 8MB

// 只接受影像。副檔名由 MIME 對應決定,不採信使用者檔名(杜絕路徑穿越/惡意副檔名)
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// 用檔頭 magic bytes 驗證真實型別,避免改副檔名/改 MIME 繞過
function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  )
    return 'image/webp'
  return null
}

export async function POST(request: NextRequest) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '檔案過大(上限 8MB)' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = sniffMime(buffer)
  if (!mime || !MIME_EXT[mime]) {
    return NextResponse.json({ error: '只接受 JPG/PNG/WebP/GIF 圖片' }, { status: 415 })
  }
  const ext = MIME_EXT[mime]

  // 每個使用者存到自己的子目錄,檔名隨機,完全不採用使用者輸入
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(auth.userId))
  const filename = `${randomUUID()}.${ext}`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${auth.userId}/${filename}` })
}
