"use client"

import Link from "next/link"
import Image from "next/image"
import { Search, User, ChevronDown } from "lucide-react"
import { useStore } from "@/lib/store"

export function Header({
  query,
  onQueryChange,
  onOpenAuth,
  onOpenSchool,
  showSearch = true,
}: {
  query?: string
  onQueryChange?: (v: string) => void
  onOpenAuth: () => void
  onOpenSchool?: () => void
  showSearch?: boolean
}) {
  const { user, logout, school } = useStore()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3 py-3 sm:gap-6 sm:py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/unibooks-logo.png"
              alt="UniBooks 로고"
              width={44}
              height={44}
              className="size-9 sm:size-11"
            />
            <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              UniBooks
            </span>
          </Link>

          {showSearch && (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => onQueryChange?.(e.target.value)}
                placeholder="교재명, 저자, 학과로 검색"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:px-4"
              >
                <User className="size-4" />
                <span className="hidden sm:inline">로그인/회원가입</span>
                <span className="sm:hidden">로그인</span>
              </button>
            )}
          </div>
        </div>

        {onOpenSchool && (
          <button
            type="button"
            onClick={onOpenSchool}
            className="mb-3 flex items-center gap-1 text-sm font-semibold text-foreground"
          >
            {school ?? "학교를 선택해주세요"}
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </header>
  )
}
