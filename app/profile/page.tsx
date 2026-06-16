"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, LogOut, GraduationCap, Mail, Package, Heart } from "lucide-react"
import { useStore } from "@/lib/store"
import { ProductCard } from "@/components/product-card"

export default function ProfilePage() {
  const router = useRouter()
  const { ready, user, logout, posts, likedIds } = useStore()

  useEffect(() => {
    if (ready && !user) {
      router.replace("/")
    }
  }, [ready, user, router])

  const myPosts = useMemo(
    () => (user ? posts.filter((p) => p.sellerId === user.email) : []),
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

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="뒤로가기" className="rounded-md p-1 hover:bg-muted">
            <ArrowLeft className="size-5" />
          </Link>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              {likedPosts.map((p) => (
                <ProductCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
