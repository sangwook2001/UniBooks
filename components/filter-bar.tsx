"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  CATEGORIES,
  type Category,
  LIBERAL_GROUPS,
  GRADES,
  COLLEGE_ORDER,
  DEPARTMENTS_BY_COLLEGE,
} from "@/lib/data"
import { cn } from "@/lib/utils"

export type Filters = {
  category: Category
  sub: string // 학과 또는 교양분류
  grade: string
}

function Dropdown({
  label,
  value,
  disabled,
  children,
}: {
  label: string
  value: string
  disabled?: boolean
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative min-w-0 flex-1 sm:flex-none">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm sm:min-w-32",
          disabled ? "cursor-not-allowed text-muted-foreground" : "text-foreground hover:bg-muted",
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label="닫기"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
            {children(() => setOpen(false))}
          </div>
        </>
      )}
    </div>
  )
}

function Item({
  active,
  onClick,
  children,
  indent,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  indent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full rounded-md px-3 py-2 text-left text-sm",
        indent && "pl-5",
        active ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const isAll = filters.category === "전체"
  const isEtc = filters.category === "기타"
  const subDisabled = isAll || isEtc

  const subLabel = filters.category === "교양" ? "교양 분류" : "학과"

  return (
    <div className="flex items-end gap-2 sm:flex-wrap sm:gap-3">
      {/* 분류 */}
      <Dropdown label="분류" value={filters.category}>
        {(close) =>
          CATEGORIES.map((c) => (
            <Item
              key={c}
              active={filters.category === c}
              onClick={() => {
                onChange({
                  category: c,
                  sub: c === "전체" || c === "기타" ? "전체" : "전체",
                  grade: c === "전체" || c === "기타" ? "전체" : filters.grade,
                })
                close()
              }}
            >
              {c}
            </Item>
          ))
        }
      </Dropdown>

      {/* 학과 / 교양분류 */}
      <Dropdown
        label={subDisabled ? "학과" : subLabel}
        value={subDisabled ? "-" : filters.sub}
        disabled={subDisabled}
      >
        {(close) => (
          <>
            <Item
              active={filters.sub === "전체"}
              onClick={() => {
                onChange({ ...filters, sub: "전체" })
                close()
              }}
            >
              전체
            </Item>
            {filters.category === "교양"
              ? LIBERAL_GROUPS.map((g) => (
                  <Item
                    key={g}
                    active={filters.sub === g}
                    onClick={() => {
                      onChange({ ...filters, sub: g })
                      close()
                    }}
                  >
                    {g}
                  </Item>
                ))
              : COLLEGE_ORDER.map((col) => (
                  <div key={col}>
                    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      {col}
                    </p>
                    {DEPARTMENTS_BY_COLLEGE[col].map((d) => (
                      <Item
                        key={d}
                        indent
                        active={filters.sub === d}
                        onClick={() => {
                          onChange({ ...filters, sub: d })
                          close()
                        }}
                      >
                        {d}
                      </Item>
                    ))}
                  </div>
                ))}
          </>
        )}
      </Dropdown>

      {/* 학년 */}
      <Dropdown
        label="학년"
        value={subDisabled ? "전체" : filters.grade}
        disabled={subDisabled}
      >
        {(close) => (
          <>
            <Item
              active={filters.grade === "전체"}
              onClick={() => {
                onChange({ ...filters, grade: "전체" })
                close()
              }}
            >
              전체
            </Item>
            {GRADES.map((g) => (
              <Item
                key={g}
                active={filters.grade === g}
                onClick={() => {
                  onChange({ ...filters, grade: g })
                  close()
                }}
              >
                {g}
              </Item>
            ))}
          </>
        )}
      </Dropdown>
    </div>
  )
}
