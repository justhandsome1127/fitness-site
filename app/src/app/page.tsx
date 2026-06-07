import { redirect } from 'next/navigation'

// Phase 1:首頁先導向 yen 的個人頁。
// Phase 2 會改成使用者列表 / 減脂比賽排行榜。
export default function HomePage() {
  redirect('/u/yen')
}
