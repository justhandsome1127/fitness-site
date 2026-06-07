import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      username: string
      role: string
      name?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: number
    username?: string
    role?: string
  }
}
