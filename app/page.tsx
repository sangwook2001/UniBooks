"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus } from "lucide-react"
import { useStore } from "@/lib/store"
import { Header } from "@/components/header"
import { SchoolSelectModal } from "@/components/school-select-modal"
import { FilterBar, type Filters } from "@/components/filter-bar"
import { ProductCard } from "@/components/product-card"
import { RecentlyViewed } from "@/components/recently-viewed"

export default function HomePage() {
  const { ready, school, setSchool, posts, user } = useStore()
  const router = useRouter()
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({
    category: "전체",
    sub: "전체",
    grade: "전체",
  })

  const needsSchool = ready && !school

  function handleAddClick() {
    if (!user) {
      window.alert("게시글을 등록하려면 로그인이 필요합니다.")
      router.push("/login")
      return
    }
    router.push("/add")
  }

  const visible = useMemo(() => {
    return posts.filter((p) => {
      if (school && p.school !== school) return false
      if (filters.category !== "전체" && p.category !== filters.category) return false
      if (filters.category === "전공" && filters.sub !== "전체" && p.department !== filters.sub)
        return false
      if (filters.category === "교양" && filters.sub !== "전체" && p.liberalGroup !== filters.sub)
        return false
      if (
        (filters.category === "전공" || filters.category === "교양") &&
        filters.grade !== "전체" &&
        p.grade !== filters.grade
      )
        return false
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const hay = `${p.title} ${p.author} ${p.department ?? ""} ${p.liberalGroup ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [posts, school, filters, query])

  return (
    <div className="min-h-screen bg-background">
      {needsSchool ? (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <Image src="/unibooks-logo.png" alt="UniBooks 로고" width={72} height={72} className="size-16" />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">UniBooks</h1>
          <p className="mt-3 text-base text-muted-foreground">학교를 선택해주세요</p>
          <button
            type="button"
            onClick={() => setSchoolOpen(true)}
            className="mt-6 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            선택하기
          </button>
          <SchoolSelectModal
            open={schoolOpen}
            dismissible
            current={school}
            onClose={() => setSchoolOpen(false)}
            onConfirm={(s) => {
              setSchool(s)
              setSchoolOpen(false)
            }}
          />
        </div>
      ) : (
        <>
          <Header
            query={query}
            onQueryChange={setQuery}
            onOpenAuth={() => router.push("/login")}
            onOpenSchool={() => setSchoolOpen(true)}
          />

          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
            <div className="flex gap-6">
              <div className="min-w-0 flex-1">
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
                    <p className="text-sm text-muted-foreground">게시글이 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-5">
                    {visible.map((p) => (
                      <ProductCard key={p.id} post={p} />
                    ))}
                  </div>
                )}
              </div>

              <RecentlyViewed />
            </div>
          </main>

          {/* 추가하기 버튼 */}
          <button
            type="button"
            onClick={handleAddClick}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
          >
            <Plus className="size-5" />
            추가하기
          </button>

          <SchoolSelectModal
            open={schoolOpen}
            dismissible
            current={school}
            onClose={() => setSchoolOpen(false)}
            onConfirm={(s) => {
              setSchool(s)
              setSchoolOpen(false)
            }}
          />
        </>
      )}
    </div>
  )
}
