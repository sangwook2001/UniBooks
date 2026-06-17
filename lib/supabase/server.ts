import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Fluid compute 환경에서는 이 클라이언트를 전역 변수에 넣지 마세요.
 * 항상 함수 내부에서 새로 생성해야 합니다.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // 서버 컴포넌트에서 호출된 경우 무시합니다. (proxy가 세션을 갱신)
          }
        },
      },
    },
  )
}
