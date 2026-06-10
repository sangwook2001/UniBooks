"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen, Share2, Heart, MessageCircle, User } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatPrice, postTag } from "@/lib/format"

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const { ready, getPost, pushRecent } = useStore()
  const post = getPost(params.id)

  useEffect(() => {
    if (post) pushRecent(post.id)
  }, [post, pushRecent])

  if (ready && !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">게시글이 없습니다.</p>
        <Link href="/" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
          홈으로
        </Link>
      </div>
    )
  }

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    if (navigator.share) {
      navigator.share({ title: post?.title, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url)
      window.alert("링크가 복사되었습니다.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="뒤로가기" className="rounded-md p-1 hover:bg-muted">
            <ArrowLeft className="size-5" />
          </Link>
          <span className="text-lg font-semibold text-foreground">상품 정보</span>
        </div>
      </header>

      {post && (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            {/* 왼쪽: 큰 사진 + 필터 라벨 */}
            <div className="w-full md:w-1/2">
              <span className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {postTag(post)}
                {post.grade ? ` · ${post.grade}` : ""}
              </span>
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
                {post.image ? (
                  <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <BookOpen className="size-12" />
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 정보 */}
            <div className="flex w-full flex-col md:w-1/2">
              <h1 className="text-2xl font-bold leading-snug text-foreground text-balance">
                {post.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                저자 {post.author} · 상태 {post.condition}
              </p>

              <p className="mt-5 text-3xl font-bold text-foreground">{formatPrice(post.price)}</p>

              {/* 액션 */}
              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="공유하기"
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted"
                >
                  <Share2 className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="찜하기"
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted"
                >
                  <Heart className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.alert("판매자에게 연락 요청을 보냈습니다.")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <MessageCircle className="size-5" />
                  연락하기
                </button>
              </div>

              {/* 판매자 */}
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">판매자</p>
                  <p className="text-sm font-medium text-foreground">{post.sellerId}</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground">{post.school}</span>
              </div>

              {post.description && (
                <div className="mt-6">
                  <h2 className="mb-2 text-sm font-semibold text-foreground">상품 설명</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {post.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
