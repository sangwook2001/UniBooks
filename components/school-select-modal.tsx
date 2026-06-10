"use client"

import { useMemo, useState } from "react"
import { Search, X, Check } from "lucide-react"
import { UNIVERSITIES } from "@/lib/data"
import { cn } from "@/lib/utils"

export function SchoolSelectModal({
  open,
  onClose,
  onConfirm,
  current,
  dismissible = true,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (school: string) => void
  current: string | null
  dismissible?: boolean
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(current)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return UNIVERSITIES
    return UNIVERSITIES.filter((u) => u.toLowerCase().includes(q))
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="닫기"
        onClick={() => dismissible && onClose()}
        className="absolute inset-0 bg-foreground/40"
      />
      {/* Mobile: bottom sheet / Desktop: centered popup */}
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full flex-col bg-card shadow-xl",
          "mt-auto h-[78vh] rounded-t-2xl", // mobile bottom sheet
          "sm:my-auto sm:h-[70vh] sm:max-w-md sm:rounded-2xl", // desktop centered
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
          <h2 className="text-lg font-semibold text-foreground">학교 선택</h2>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        <div className="px-5 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="학교 이름을 검색하세요"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((u) => {
                const isSel = selected === u
                return (
                  <li key={u}>
                    <button
                      type="button"
                      onClick={() => setSelected(u)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm",
                        isSel
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <span>{u}</span>
                      {isSel && <Check className="size-4 text-primary" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-4">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
