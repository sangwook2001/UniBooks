"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ImagePlus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import {
  CATEGORIES,
  type Category,
  LIBERAL_GROUPS,
  GRADES,
  CONDITIONS,
  COLLEGE_ORDER,
  DEPARTMENTS_BY_COLLEGE,
} from "@/lib/data"
import { formatNumberInput, parseNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function AddPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const { school, addPost, updatePost, getPost, user, ready } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const editingPost = editId ? getPost(editId) : undefined
  const isEdit = !!editId

  // 게시글은 본인 계정에 등록된 학교(없으면 현재 선택된 학교)로만 등록됩니다.
  const postSchool = user?.school ?? school ?? ""

  useEffect(() => {
    if (ready && !user) {
      window.alert("게시글을 등록하려면 로그인이 필요합니다.")
      router.replace("/")
    }
  }, [ready, user, router])

  // 수정 모드: 본인 게시글이 아니면 차단
  useEffect(() => {
    if (ready && user && editId) {
      const p = getPost(editId)
      if (!p) {
        window.alert("게시글을 찾을 수 없습니다.")
        router.replace("/")
      } else if (p.sellerId !== user.email) {
        window.alert("본인이 등록한 상품만 수정할 수 있습니다.")
        router.replace(`/product/${editId}`)
      }
    }
  }, [ready, user, editId, getPost, router])

  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [priceStr, setPriceStr] = useState("")
  const [category, setCategory] = useState<Category>("전공")
  const [department, setDepartment] = useState("")
  const [liberalGroup, setLiberalGroup] = useState("")
  const [grade, setGrade] = useState("")
  const [condition, setCondition] = useState("")
  const [openChat, setOpenChat] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const prefilledRef = useRef(false)

  // 수정 모드일 때 폼을 한 번 채워줍니다.
  useEffect(() => {
    if (editingPost && !prefilledRef.current) {
      prefilledRef.current = true
      setTitle(editingPost.title)
      setAuthor(editingPost.author)
      setPriceStr(editingPost.price ? editingPost.price.toLocaleString("ko-KR") : "")
      setCategory(editingPost.category)
      setDepartment(editingPost.department ?? "")
      setLiberalGroup(editingPost.liberalGroup ?? "")
      setGrade(editingPost.grade ?? "")
      setCondition(editingPost.condition)
      setOpenChat(editingPost.openChatUrl)
      setDescription(editingPost.description ?? "")
      setImage(editingPost.image ?? null)
    }
  }, [editingPost])

  const showDeptGrade = category === "전공" || category === "교양"

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  // 필수: 사진, 제목, 저자, 가격, 분류, 상태, 오픈채팅 링크 + (전공/교양일 때 학과/교양분류·학년). 설명은 선택.
  const missing =
    !image ||
    !title.trim() ||
    !author.trim() ||
    !priceStr ||
    !condition ||
    !openChat.trim() ||
    (category === "전공" && !department) ||
    (category === "교양" && !liberalGroup) ||
    (showDeptGrade && !grade)

  async function handleSubmit() {
    setSubmitted(true)
    if (missing) return
    const data = {
      title: title.trim(),
      author: author.trim(),
      price: parseNumber(priceStr),
      condition,
      category,
      department: category === "전공" ? department : undefined,
      liberalGroup: category === "교양" ? liberalGroup : undefined,
      grade: showDeptGrade ? grade : undefined,
      openChatUrl: openChat.trim(),
      description: description.trim() || undefined,
      image: image ?? undefined,
      school: postSchool,
    }
    if (isEdit && editId) {
      updatePost(editId, data)
      router.push(`/product/${editId}`)
      return
    }
    const post = await addPost(data)
    router.push(`/product/${post.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="뒤로가기" className="rounded-md p-1 hover:bg-muted">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">{isEdit ? "상품 수정하기" : "중고책 등록하기"}</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* 등록 학교 (본인 학교 고정) */}
          <Field label="등록 학교">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2.5 text-sm">
              <span className="font-medium text-foreground">{postSchool || "학교 미설정"}</span>
              <span className="text-xs text-muted-foreground">본인 학교에만 등록됩니다</span>
            </div>
          </Field>

          {/* 사진 */}
          <Field label="사진" required error={submitted && !image ? "사진을 등록해주세요." : ""}>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
            {image ? (
              <div className="relative size-32 overflow-hidden rounded-lg border border-border">
                <Image src={image || "/placeholder.svg"} alt="미리보기" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background"
                  aria-label="사진 삭제"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex size-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted"
              >
                <ImagePlus className="size-6" />
                <span className="text-xs">사진 등록</span>
              </button>
            )}
          </Field>

          {/* 제목 */}
          <Field label="제목" required error={submitted && !title.trim() ? "제목을 입력해주세요." : ""}>
            <Input value={title} onChange={setTitle} placeholder="예: 미분적분학 7판" />
          </Field>

          {/* 저자 */}
          <Field label="저자" required error={submitted && !author.trim() ? "저자를 입력해주세요." : ""}>
            <Input value={author} onChange={setAuthor} placeholder="예: James Stewart" />
          </Field>

          {/* 가격 */}
          <Field label="가격" required error={submitted && !priceStr ? "가격을 입력해주세요." : ""}>
            <div className="relative">
              <input
                value={priceStr}
                onChange={(e) => setPriceStr(formatNumberInput(e.target.value))}
                placeholder="예: 15,000"
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-9 text-sm outline-none focus:border-primary"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                원
              </span>
            </div>
          </Field>

          {/* 분류 */}
          <Field label="분류" required>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c !== "전체").map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </Field>

          {/* 학과 (전공) */}
          {category === "전공" && (
            <Field
              label="학과"
              required
              error={submitted && !department ? "학과를 선택해주세요." : ""}
            >
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">학과를 선택하세요</option>
                {COLLEGE_ORDER.map((col) => (
                  <optgroup key={col} label={col}>
                    {DEPARTMENTS_BY_COLLEGE[col].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          )}

          {/* 교양 분류 */}
          {category === "교양" && (
            <Field
              label="교양 분류"
              required
              error={submitted && !liberalGroup ? "교양 분류를 선택해주세요." : ""}
            >
              <div className="flex flex-wrap gap-2">
                {LIBERAL_GROUPS.map((g) => (
                  <Chip key={g} active={liberalGroup === g} onClick={() => setLiberalGroup(g)}>
                    {g}
                  </Chip>
                ))}
              </div>
            </Field>
          )}

          {/* 학년 (전공/교양만) */}
          {showDeptGrade && (
            <Field label="학년" required error={submitted && !grade ? "학년을 선택해주세요." : ""}>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <Chip key={g} active={grade === g} onClick={() => setGrade(g)}>
                    {g}
                  </Chip>
                ))}
              </div>
            </Field>
          )}

          {/* 상태 */}
          <Field label="상태" required error={submitted && !condition ? "상태를 선택해주세요." : ""}>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </Field>

          {/* 오픈 채팅 링크 */}
          <Field
            label="오픈 채팅 링크"
            required
            error={submitted && !openChat.trim() ? "오픈 채팅 링크를 입력해주세요." : ""}
          >
            <Input
              value={openChat}
              onChange={setOpenChat}
              placeholder="예: https://open.kakao.com/o/..."
            />
          </Field>

          {/* 설명 (선택) */}
          <Field label="설명 (선택)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="책 상태, 필기 여부, 거래 방법 등을 자유롭게 작성해주세요."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </Field>

          {submitted && missing && (
            <p className="text-sm text-destructive">설명을 제외한 모든 항목을 입력해주세요.</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </main>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: "numeric" | "text"
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
    />
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm",
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
