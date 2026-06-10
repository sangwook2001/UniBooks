"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"
import type { Post } from "@/lib/store"
import { formatPrice, postTag } from "@/lib/format"

export function ProductCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/product/${post.id}`}
      className="group flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 transition hover:shadow-md sm:flex-col sm:p-0"
    >
      {/* 모바일: 왼쪽 이미지 / 데스크톱: 위쪽 이미지 */}
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-full sm:rounded-none">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            className="size-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <BookOpen className="size-8" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium text-background">
          {postTag(post)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between sm:p-3">
        <div>
          <h3 className="line-clamp-2 text-sm font-medium text-foreground">{post.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {post.author} · {post.condition}
          </p>
        </div>
        <p className="mt-2 text-base font-bold text-foreground">{formatPrice(post.price)}</p>
      </div>
    </Link>
  )
}
