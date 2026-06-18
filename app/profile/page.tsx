"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, LogOut, GraduationCap, Mail, Package, Heart, AlertTriangle } from "lucide-react"
import { useStore } from "@/lib/store"
import { ProductCard } from "@/components/product-card"

export default function ProfilePage() {
  const router = useRouter()
  const { ready, user, logout, deleteAccount, posts, likedIds } = useStore()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (ready && !user) {
      router.replace("/")
    }
  }, [ready, user, router])

  const myPosts = useMemo(
    () => (user ? posts.filter((p) => p.sellerId === user.id) : []),
    [posts, user],
  )
  const likedPosts = useMemo(
    () => posts.filter((p) => likedIds.includes(p.id)),
    [posts, likedIds],
  )

  function handleLogout() {
    logout()
    router.replace("/")
  }

  // 뒤로가기: 히스토리를 새로 쌓지 않고 이전 페이지로 돌아간다.
  // 직접 진입 등으로 히스토리가 없으면 홈으로 대체 이동한다.
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.replace("/")
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError("")
    const res = await deleteAccount()
    if (res.ok) {
      router.replace("/")
    } else {
      setDeleteError(res.error ?? "탈퇴에 실패했습니다.")
      setDeleting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            aria-label="뒤로가기"
            className="rounded-md p-1 hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">마이페이지</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <LogOut className="size-4" />
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {/* 내 정보 */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-8" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-foreground">{user.nickname}</p>
              <div className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-3.5" />
                  {user.school ?? "학교 미설정"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{myPosts.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">내가 올린 상품</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{likedPosts.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">찜한 상품</p>
            </div>
          </div>
        </section>

        {/* 내가 올린 상품 */}
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Package className="size-5 text-primary" />
            내가 올린 상품
          </h2>
          {myPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              아직 올린 상품이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {myPosts.map((p) => (
                <ProductCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>

        {/* 찜한 상품 */}
        <section className="mt-8 pb-12">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Heart className="size-5 text-primary" />
            찜한 상품
          </h2>
          {likedPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              아직 찜한 상품이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {likedPosts.map((p) => (
                <ProductCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>

        {/* 계정 관리 */}
        <section className="flex justify-center border-t border-border pb-12 pt-6">
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium text-destructive hover:underline"
          >
            탈퇴하기
          </button>
        </section>
      </main>

      {/* 회원 탈퇴 확인 다이얼로그 */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <h3 className="text-base font-semibold">회원 탈퇴</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              탈퇴하면 내가 올린 상품, 찜 목록, 댓글 등 모든 데이터가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?
            </p>
            {deleteError && <p className="mt-3 text-sm text-destructive">{deleteError}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false)
                  setDeleteError("")
                }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
