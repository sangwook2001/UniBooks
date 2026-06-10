"use client"

import Link from "next/link"
import { Search, X, BookOpen } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatPrice } from "@/lib/format"

export function RecentlyViewed() {
  const { recentIds, getPost, removeRecent } = useStore()
  const items = recentIds.map((id) => getPost(id)).filter(Boolean)

  return (
    <aside className="sticky top-28 hidden h-fit w-56 shrink-0 rounded-xl border border-border bg-card p-4 lg:block">
      <h2 className="mb-3 text-sm font-semibold text-foreground">최근 본 상품</h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Search className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">최근 본 상품이 없습니다.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => (
            <li key={p!.id} className="group relative">
              <Link href={`/product/${p!.id}`} className="flex gap-2">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p!.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p!.image || "/placeholder.svg"} alt={p!.title} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <BookOpen className="size-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-4">
                  <p className="line-clamp-1 text-xs text-foreground">{p!.title}</p>
                  <p className="text-xs font-semibold text-foreground">{formatPrice(p!.price)}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => removeRecent(p!.id)}
                aria-label="최근 본 상품에서 삭제"
                className="absolute right-0 top-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
