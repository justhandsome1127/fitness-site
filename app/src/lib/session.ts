import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * 取得目前登入者 id。所有寫入型 API 都該用它,
 * userId 一律來自 session,絕不信任 request body(防 mass-assignment / IDOR)。
 * 傳入 request 時會額外做同源檢查(輔助 sameSite=lax 防 CSRF)。
 * 未授權回傳對應 response;呼叫端用 `if ('error' in r) return r.error` 短路。
 */
export async function requireUserId(
  request?: Request
): Promise<{ userId: number; role: string } | { error: NextResponse }> {
  // CSRF 輔助:跨站來源的寫入請求直接擋掉
  if (request) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return { error: NextResponse.json({ error: 'Bad origin' }, { status: 403 }) }
        }
      } catch {
        return { error: NextResponse.json({ error: 'Bad origin' }, { status: 403 }) }
      }
    }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { userId: session.user.id, role: session.user.role }
}
