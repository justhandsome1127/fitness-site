// 簡易記憶體限速(固定視窗)。單一容器部署足夠;多實例需改用 Redis。
type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()

  // 偶爾清掉過期 entry,避免無限成長
  if (buckets.size > 5000) {
    buckets.forEach((v, k) => {
      if (now > v.resetAt) buckets.delete(k)
    })
  }

  const e = buckets.get(key)
  if (!e || now > e.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (e.count >= limit) return false
  e.count++
  return true
}

// 取真實來源 IP:站台在 Cloudflare 後面,優先用 CF-Connecting-IP
export function clientIp(req: Request): string {
  const h = req.headers
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}
