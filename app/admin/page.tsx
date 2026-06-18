"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Package,
  Flag,
  Trash2,
  BarChart3,
  ExternalLink,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { formatPrice, formatDate, postTag } from "@/lib/format"

type Tab = "products" | "reports"

export default function AdminPage() {
  const router = useRouter()
  const { ready, user, isAdmin, logout, posts, deletePost, reports, deleteReport, clearReports } = useStore()
  const [tab, setTab] = useState<Tab>("products")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (ready && !isAdmin) {
      router.replace("/")
    }
  }, [ready, isAdmin, router])

  // 신고 사유별 집계
  const reasonStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of reports) {
      map.set(r.reason, (map.get(r.reason) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [reports])

  // 신고가 많이 들어온 상품 집계
  const reportedPostStats = useMemo(() => {
    const map = new Map<string, { title: string; count: number; postId: string }>()
    for (const r of reports) {
      const prev = map.get(r.postId)
      map.set(r.postId, { title: r.postTitle, postId: r.postId, count: (prev?.count ?? 0) + 1 })
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [reports])

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.school.toLowerCase().includes(q) ||
        p.sellerNickname.toLowerCase().includes(q),
    )
  }, [posts, search])

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

  function handleDeletePost(id: string, title: string) {
    if (window.confirm(`"${title}" 상품을 삭제할까요? 되돌릴 수 없습니다.`)) {
      deletePost(id)
    }
  }

  if (!ready || !isAdmin) return null

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
          <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ShieldCheck className="size-5 text-primary" />
            관리자 대시보드
          </span>
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

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {/* 요약 통계 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="size-3.5" />
              전체 상품
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{posts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flag className="size-3.5" />
              누적 신고
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{reports.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BarChart3 className="size-3.5" />
              신고된 상품
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{reportedPostStats.length}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="mt-6 flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            상품 관리
          </button>
          <button
            type="button"
            onClick={() => setTab("reports")}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === "reports"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            신고 설문 ({reports.length})
          </button>
        </div>

        {/* 상품 관리 탭 */}
        {tab === "products" && (
          <section className="mt-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="교재명, 저자, 학교, 판매자로 검색"
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary sm:max-w-md"
            />
            {filteredPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                상품이 없습니다.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {filteredPosts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {p.image ? (
                        <Image src={p.image || "/placeholder.svg"} alt={p.title} fill className="object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          없음
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {postTag(p)} · {p.school} · {p.sellerNickname}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(p.price)} · {formatDate(p.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/product/${p.id}`}
                      aria-label="상품 보기"
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(p.id, p.title)}
                      className="flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 신고 설문 탭 */}
        {tab === "reports" && (
          <section className="mt-5">
            {reports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                접수된 신고가 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* 사유별 집계 */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BarChart3 className="size-4 text-primary" />
                    신고 사유별 집계
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {reasonStats.map(([reason, count]) => {
                      const pct = Math.round((count / reports.length) * 100)
                      return (
                        <li key={reason}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-foreground">{reason}</span>
                            <span className="text-muted-foreground">
                              {count}건 ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* 신고 많은 상품 */}
                {reportedPostStats.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Flag className="size-4 text-primary" />
                      신고 많은 상품
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {reportedPostStats.map((s) => (
                        <li key={s.postId} className="flex items-center justify-between gap-3 text-sm">
                          <Link href={`/product/${s.postId}`} className="min-w-0 truncate text-foreground hover:underline">
                            {s.title}
                          </Link>
                          <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            {s.count}건
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 개별 신고 내역 */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">개별 신고 내역</h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("모든 신고 내역을 삭제할까요?")) clearReports()
                      }}
                      className="text-xs font-medium text-destructive hover:underline"
                    >
                      전체 삭제
                    </button>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {reports.map((r) => (
                      <li key={r.id} className="rounded-xl border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {r.reason}
                              </span>
                              <Link
                                href={`/product/${r.postId}`}
                                className="truncate text-sm font-medium text-foreground hover:underline"
                              >
                                {r.postTitle}
                              </Link>
                            </div>
                            {r.detail && (
                              <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{r.detail}</p>
                            )}
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {r.reporterNickname ?? "익명"} · {formatDate(r.createdAt)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteReport(r.id)}
                            aria-label="신고 삭제"
                            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
