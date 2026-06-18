import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // 현재 로그인한 사용자 확인 (쿠키 기반 세션)
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !url) {
      return NextResponse.json({ error: "서버 설정 오류로 탈퇴를 진행할 수 없습니다." }, { status: 500 })
    }

    // 서비스 롤 클라이언트로 관련 데이터와 계정 삭제
    const admin = createSupabaseClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 프로필 삭제(게시글/좋아요/댓글은 ON DELETE CASCADE로 함께 정리됨)
    await admin.from("profiles").delete().eq("id", user.id)
    // 혹시 남아있을 수 있는 데이터 방어적으로 정리
    await admin.from("posts").delete().eq("seller_id", user.id)

    // 인증 계정 삭제
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return NextResponse.json({ error: "계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 })
    }

    // 서버 세션 쿠키 정리
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 })
  }
}
