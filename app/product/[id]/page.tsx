"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen, Share2, Heart, MessageCircle, User, Eye, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatPrice, postTag } from "@/lib/format"
import { cn } from "@/lib/utils"

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금 전"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const { ready, getPost, pushRecent, incrementViews, toggleLike, likedIds, addComment, user } =
    useStore()
  const post = getPost(params.id)
  const [chatOpen, setChatOpen] = useState(false)
  const [comment, setComment] = useState("")
  const viewedRef = useRef(false)

  useEffect(() => {
    if (post && !viewedRef.current) {
      viewedRef.current = true
      pushRecent(post.id)
      incrementViews(post.id)
    }
  }, [post, pushRecent, incrementViews])

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

  function handleSubmitComment() {
    if (!post) return
    if (!user) {
      window.alert("댓글을 작성하려면 로그인이 필요합니다.")
      return
    }
    if (!comment.trim()) return
    addComment(post.id, comment.trim())
    setComment("")
  }

  const liked = post ? likedIds.includes(post.id) : false

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
            {/* 왼쪽: 큰 사진 */}
            <div className="w-full md:w-1/2">
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
              {/* 상단: 학과 · 학년 */}
              <span className="inline-block w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {postTag(post)}
                {post.grade ? ` · ${post.grade}` : ""}
              </span>

              {/* 제목 · 저자 (살짝 내려서) */}
              <h1 className="mt-4 text-2xl font-bold leading-snug text-foreground text-balance">
                {post.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                저자 {post.author} · 상태 {post.condition}
              </p>

              {/* 설명: 사진 가운데에 위치 (글이 길어지면 위아래로 늘어남) */}
              <div className="flex flex-1 items-center py-6">
                {post.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {post.description}
                  </p>
                ) : null}
              </div>

              {/* 하단: 가격 */}
              <p className="text-3xl font-bold text-foreground">{formatPrice(post.price)}</p>

              {/* 조회수 · 찜 · 댓글 수 */}
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="size-4" />
                  {post.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className={cn("size-4", liked && "fill-primary text-primary")} />
                  {post.likes.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-4" />
                  {post.comments.length.toLocaleString()}
                </span>
              </div>

              {/* 액션 */}
              <div className="mt-4 flex items-center gap-2">
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
                  onClick={() => toggleLike(post.id)}
                  aria-label="찜하기"
                  aria-pressed={liked}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl border",
                    liked
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-muted",
                  )}
                >
                  <Heart className={cn("size-5", liked && "fill-primary")} />
                </button>
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
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
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{post.sellerNickname}</p>
                  <p className="truncate text-xs text-muted-foreground">{post.sellerId}</p>
                </div>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{post.school}</span>
              </div>
            </div>
          </div>

          {/* 댓글 */}
          <section className="mt-10 border-t border-border pt-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              댓글 {post.comments.length}
            </h2>

            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitComment()
                }}
                placeholder={user ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleSubmitComment}
                className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                등록
              </button>
            </div>

            <ul className="mt-5 flex flex-col gap-4">
              {post.comments.length === 0 ? (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                </li>
              ) : (
                post.comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{c.author}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{c.text}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </main>
      )}

      {/* 오픈 채팅 팝업 */}
      {chatOpen && post && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setChatOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">판매자와 연락하기</h2>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="닫기"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              아래 오픈 채팅 링크로 판매자에게 바로 연락할 수 있습니다.
            </p>
            <div className="mt-3 rounded-lg border border-border bg-muted px-3 py-2.5">
              <p className="break-all text-xs text-foreground">{post.openChatUrl}</p>
            </div>
            <a
              href={post.openChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <MessageCircle className="size-5" />
              오픈 채팅 열기
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
