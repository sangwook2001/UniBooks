"use client"

import Link from "next/link"
import { BookOpen, Eye, Heart, MessageCircle } from "lucide-react"
import { useStore, type Post } from "@/lib/store"
import { formatPrice, postTag } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProductCard({ post }: { post: Post }) {
  const { likedIds } = useStore()
  const liked = likedIds.includes(post.id)
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
        <div className="mt-2 flex flex-col-reverse gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <p className="text-base font-bold text-foreground">{formatPrice(post.price)}</p>
          <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="size-3" />
              {post.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className={cn("size-3", liked && "fill-primary text-primary")} />
              {post.likes.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="size-3" />
              {post.comments.length.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
