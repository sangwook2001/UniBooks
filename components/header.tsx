"use client"

import { useState } from "react"
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

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

          {/* 데스크톱 검색창 */}
          {showSearch && (
            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 sm:flex">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => onQueryChange?.(e.target.value)}
                placeholder="교재명, 저자, 학과로 검색"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* 모바일: 검색 아이콘 + 로그인 아이콘 */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
            {showSearch && (
              <button
                type="button"
                onClick={() => setMobileSearchOpen((v) => !v)}
                aria-label="검색"
                className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted sm:hidden"
              >
                <Search className="size-5" />
              </button>
            )}

            {user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">{user.nickname}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="hidden rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-block"
                >
                  로그아웃
                </button>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="로그아웃"
                  className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted sm:hidden"
                >
                  <User className="size-5" />
                </button>
              </>
            ) : (
              <>
                {/* 데스크톱 로그인 버튼 */}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:flex"
                >
                  <User className="size-4" />
                  로그인/회원가입
                </button>
                {/* 모바일 로그인 아이콘 */}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  aria-label="로그인/회원가입"
                  className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-muted sm:hidden"
                >
                  <User className="size-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 모바일 검색창 (토글) */}
        {showSearch && mobileSearchOpen && (
          <div className="mb-3 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 sm:hidden">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              placeholder="교재명, 저자, 학과로 검색"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}

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
