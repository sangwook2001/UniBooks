"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft,
  BookOpen,
  Share2,
  Heart,
  MessageCircle,
  User,
  Eye,
  X,
  Flag,
  Copy,
  Check,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useStore, type Comment as CommentType } from "@/lib/store"
import { formatPrice, formatDate, postTag } from "@/lib/format"
import { cn } from "@/lib/utils"

function timeAgoStr(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금 전"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

function CommentNode({
  comment,
  postId,
  sellerId,
  currentUserId,
  isReply = false,
}: {
  comment: CommentType
  postId: string
  sellerId: string
  currentUserId?: string
  isReply?: boolean
}) {
  const { user, addReply, editComment, deleteComment } = useStore()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState("")

  const isSeller = !!comment.authorId && comment.authorId === sellerId
  const isMine = !!comment.authorId && comment.authorId === currentUserId

  function saveEdit() {
    if (!editText.trim()) return
    editComment(postId, comment.id, editText.trim())
    setEditing(false)
  }

  function submitReply() {
    if (!user) {
      window.alert("답글을 작성하려면 로그인이 필요합니다.")
      return
    }
    if (!replyText.trim()) return
    addReply(postId, comment.id, replyText.trim())
    setReplyText("")
    setReplying(false)
  }

  return (
    <li className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <User className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{comment.author}</span>
          {isSeller && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              판매자
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgoStr(comment.createdAt)}</span>
        </div>

        {editing ? (
          <div className="mt-1 flex gap-2">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={saveEdit}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setEditText(comment.text)
              }}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-muted"
            >
              취소
            </button>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{comment.text}</p>
        )}

        {!editing && (
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {!isReply && (
              <button type="button" onClick={() => setReplying((v) => !v)} className="hover:text-foreground">
                답글
              </button>
            )}
            {isMine && (
              <>
                <button type="button" onClick={() => setEditing(true)} className="hover:text-foreground">
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("댓글을 삭제할까요?")) deleteComment(postId, comment.id)
                  }}
                  className="hover:text-destructive"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        )}

        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitReply()
              }}
              placeholder="답글을 입력하세요"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={submitReply}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              등록
            </button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <ul className="mt-3 flex flex-col gap-3 border-l border-border pl-4">
            {comment.replies.map((r) => (
              <CommentNode
                key={r.id}
                comment={r}
                postId={postId}
                sellerId={sellerId}
                currentUserId={currentUserId}
                isReply
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { ready, getPost, pushRecent, incrementViews, toggleLike, likedIds, addComment, user, deletePost, isAdmin, addReport, setStatus } =
    useStore()
  const post = getPost(params.id)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetail, setReportDetail] = useState("")
  const [comment, setComment] = useState("")
  const [activeImage, setActiveImage] = useState(0)
  const [fetchedImages, setFetchedImages] = useState<string[] | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const viewedRef = useRef(false)

  // 상세 페이지에서만 전체 사진(images 배열)을 불러온다(목록은 대표 이미지만 로드).
  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase
      .from("posts")
      .select("images")
      .eq("id", params.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.images && data.images.length > 0) {
          setFetchedImages(data.images as string[])
        }
      })
    return () => {
      active = false
    }
  }, [params.id])

  useEffect(() => {
    if (post && !viewedRef.current) {
      viewedRef.current = true
      pushRecent(post.id)
      incrementViews(post.id)
    }
  }, [post, pushRecent, incrementViews])

  // 우선순위: 상세에서 별도로 불러온 전체 사진 > 스토어의 images > 대표 이미지
  // (모든 훅은 조기 return 위에 두어야 한다. 아래에 두면 게시글 로딩 타이밍에 따라
  //  훅 개수가 달라져 "Rendered fewer hooks than expected" 크래시가 발생한다.)
  const gallery = useMemo(() => {
    if (fetchedImages && fetchedImages.length > 0) return fetchedImages
    if (!post) return []
    if (post.images && post.images.length > 0) return post.images
    return post.image ? [post.image] : []
  }, [fetchedImages, post])

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

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  function handleShare() {
    setCopied(false)
    setShareOpen(true)
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // 클립보드 접근이 막힌 환경(iframe 등) 대비 폴백
      const ta = document.createElement("textarea")
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand("copy")
      } catch {
        // ignore
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLike() {
    if (!post) return
    if (!user) {
      window.alert("찜하려면 로그인이 필요합니다.")
      router.push(`/login?from=${encodeURIComponent(`/product/${params.id}`)}`)
      return
    }
    toggleLike(post.id)
  }

  function handleReportClick() {
    if (!user) {
      window.alert("신고하려면 로그인이 필요합니다.")
      return
    }
    setReportReason("")
    setReportDetail("")
    setReportOpen(true)
  }

  function handleSubmitReport() {
    if (!reportReason || !post) return
    addReport({
      postId: post.id,
      postTitle: post.title,
      reason: reportReason,
      detail: reportDetail.trim() || undefined,
      reporterId: user?.email,
      reporterNickname: user?.nickname,
    })
    setReportOpen(false)
    window.alert("정상 접수되었습니다.")
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
  const isOwner =
    !!post && !!user && String(post.sellerId ?? "").trim() === String(user.id ?? "").trim()
  // 관리자는 모든 상품을 삭제할 수 있습니다.
  const canDelete = isOwner || isAdmin

  function handleEdit() {
    if (!post) return
    router.push(`/add?edit=${post.id}`)
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

  function handleContact() {
    if (!post) return
    if (!post.openChatUrl) {
      window.alert("등록된 오픈 채팅 링크가 없습니다.")
      return
    }
    // 연락하기를 누르면 오픈 채팅 페이지로 바로 이동
    window.open(post.openChatUrl, "_blank", "noopener,noreferrer")
  }

  function handleDelete() {
    if (!post) return
    if (window.confirm("이 상품을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")) {
      deletePost(post.id)
      window.alert("상품이 삭제되었습니다.")
      router.replace("/")
    }
  }

  const totalComments = post
    ? post.comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0)
    : 0

  // 스크롤 스냅 컨테이너를 부드럽게 이동시켜 한 장씩 넘긴다
  const scrollToIndex = (index: number) => {
    const el = scrollRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(index, gallery.length - 1))
    el.scrollTo({ left: el.clientWidth * clamped, behavior: "smooth" })
  }
  const goPrev = () => scrollToIndex(activeImage - 1)
  const goNext = () => scrollToIndex(activeImage + 1)

  // 스크롤(스와이프/드래그)이 멈춘 위치로 현재 사진 인덱스를 갱신
  function onGalleryScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (idx !== activeImage) setActiveImage(idx)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            aria-label="뒤로가기"
            className="rounded-md p-1 hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="text-lg font-semibold text-foreground">상품 정보</span>
        </div>
      </header>

      {post && (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            {/* 왼쪽: 큰 사진 */}
            <div className="flex w-full flex-col gap-3 md:w-1/2">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
                {gallery.length > 0 ? (
                  <div
                    ref={scrollRef}
                    onScroll={onGalleryScroll}
                    className="flex size-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {gallery.map((img, i) => (
                      <div key={i} className="relative size-full shrink-0 basis-full snap-center snap-always">
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`${post.title} 사진 ${i + 1}`}
                          fill
                          className="object-cover"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <BookOpen className="size-12" />
                  </div>
                )}

                {/* 좌우 화살표 (사진 2장 이상일 때) */}
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="이전 사진"
                      className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="다음 사진"
                      className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                    {/* 사진 번호 */}
                    <span className="absolute bottom-2 right-2 rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-background">
                      {activeImage + 1} / {gallery.length}
                    </span>
                    {/* 점 인디케이터 */}
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {gallery.map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "size-1.5 rounded-full",
                            i === activeImage ? "bg-background" : "bg-background/50",
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}

                {post.status !== "판매중" && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/45">
                    <span
                      className={cn(
                        "rounded-lg px-4 py-2 text-base font-bold text-background",
                        post.status === "예약중" ? "bg-primary" : "bg-foreground/80",
                      )}
                    >
                      {post.status}
                    </span>
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
              <div className="mt-4 flex items-start justify-between gap-3">
                <h1 className="min-w-0 text-2xl font-bold leading-snug text-foreground text-balance">
                  {post.title}
                </h1>
                <button
                  type="button"
                  onClick={handleReportClick}
                  className="mt-1 flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Flag className="size-3.5" />
                  신고하기
                </button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                저자 {post.author} · 상태 {post.condition.replace(/^상태\s*/, "")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(post.createdAt)} 등록</p>

              {(isOwner || canDelete) && (
                <div className="mt-3 flex items-center gap-2">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Pencil className="size-3.5" />
                      수정
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    {isAdmin && !isOwner ? "관리자 삭제" : "삭제"}
                  </button>
                </div>
              )}

              {/* 설명: 사진 가운데에 위치 (글이 길어지면 위아래로 늘어남) */}
              <div className="flex flex-1 items-center py-6">
                {post.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {post.description}
                  </p>
                ) : null}
              </div>

              {/* 가격 (살짝 위로) */}
              <p className="text-right text-3xl font-bold text-foreground">{formatPrice(post.price)}</p>

              {/* 조회수 · 찜 · 댓글 수 (공유 버튼 바로 위) */}
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
                  {totalComments.toLocaleString()}
                </span>
              </div>

              {/* 액션 */}
              <div className="mt-2 flex items-center gap-2">
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
                  onClick={handleLike}
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
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatus(post.id, post.status === "예약중" ? "판매중" : "예약중")}
                      aria-pressed={post.status === "예약중"}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold",
                        post.status === "예약중"
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "border border-primary text-primary hover:bg-primary/5",
                      )}
                    >
                      <Clock className="size-5" />
                      {post.status === "예약중" ? "예약중" : "예약"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(post.id, post.status === "판매완료" ? "판매중" : "판매완료")}
                      aria-pressed={post.status === "판매완료"}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold",
                        post.status === "판매완료"
                          ? "bg-foreground text-background hover:opacity-90"
                          : "border border-border text-foreground hover:bg-muted",
                      )}
                    >
                      <CheckCircle2 className="size-5" />
                      판매 완료
                    </button>
                  </>
                ) : post.status !== "판매중" ? (
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold",
                      post.status === "예약중"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {post.status === "예약중" ? <Clock className="size-5" /> : <CheckCircle2 className="size-5" />}
                    {post.status}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleContact}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <MessageCircle className="size-5" />
                    연락하기
                  </button>
                )}
              </div>

              {/* 판매자 */}
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{post.sellerNickname}</p>
                  <p className="truncate text-xs text-muted-foreground">판매자</p>
                </div>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{post.school}</span>
              </div>
            </div>
          </div>

          {/* 댓글 */}
          <section className="mt-10 border-t border-border pt-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">댓글 {totalComments}</h2>

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
                  <CommentNode
                    key={c.id}
                    comment={c}
                    postId={post.id}
                    sellerId={post.sellerId}
                    currentUserId={user?.id}
                  />
                ))
              )}
            </ul>
          </section>
        </main>
      )}

      {/* 공유하기 팝업 */}
      {shareOpen && post && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setShareOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">공유하기</h2>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="닫기"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">이 상품 링크를 복사해서 공유하세요.</p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2.5">
              <p className="min-w-0 flex-1 truncate text-xs text-foreground">{shareUrl}</p>
            </div>
            <button
              type="button"
              onClick={copyShareLink}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
              {copied ? "복사되었습니다" : "링크 복사하기"}
            </button>
          </div>
        </div>
      )}

      {/* 신고 설문 팝업 */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setReportOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">상품 신고하기</h2>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                aria-label="닫기"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">신고 사유를 선택해주세요.</p>

            <fieldset className="flex flex-col gap-2">
              {["허위 매물", "사기 의심", "부적절한 콘텐츠", "중복 게시글", "기타"].map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
                    reportReason === reason
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-foreground hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="accent-primary"
                  />
                  {reason}
                </label>
              ))}
            </fieldset>

            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="상세 내용 (선택)"
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />

            <button
              type="button"
              onClick={handleSubmitReport}
              disabled={!reportReason}
              className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              제출하기
            </button>
          </div>
        </div>
      )}

    </div>
  )
}