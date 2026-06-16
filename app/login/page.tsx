"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type View = "login" | "findId" | "findPw"

export default function LoginPage() {
  const { login } = useStore()
  const router = useRouter()
  const [view, setView] = useState<View>("login")
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [touched, setTouched] = useState(false)

  const emailInvalid = touched && email.length > 0 && !EMAIL_RE.test(email)

  function done() {
    router.push("/")
  }

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  function handleLogin() {
    setTouched(true)
    if (!EMAIL_RE.test(email)) return
    if (!pw) return
    const nick = email.toLowerCase() === "test@unibooks.kr" ? "테스터" : undefined
    login(email, nick)
    done()
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            aria-label="뒤로가기"
            className="rounded-md p-1 hover:bg-muted"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="text-lg font-semibold text-foreground">로그인</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-col px-5 py-8 sm:py-10">
        <Link href="/" className="mb-6 flex flex-col items-center gap-2 sm:mb-8 sm:gap-3">
          <Image
            src="/unibooks-logo.png"
            alt="UniBooks 로고"
            width={56}
            height={56}
            className="size-12 sm:size-14"
          />
          <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">UniBooks</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h1 className="mb-5 text-lg font-semibold text-foreground">
            {view === "login" && "로그인"}
            {view === "findId" && "아이디 찾기"}
            {view === "findPw" && "비밀번호 찾기"}
          </h1>

          {view === "login" && (
            <div className="flex flex-col gap-3">
              <div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="아이디 (이메일)"
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none",
                    emailInvalid ? "border-destructive" : "border-border focus:border-primary",
                  )}
                />
                {emailInvalid && (
                  <p className="mt-1 text-xs text-destructive">
                    이메일 형식으로 입력해주세요. (예: id@unibooks.kr)
                  </p>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin()
                  }}
                  placeholder="비밀번호"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label="비밀번호 표시"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                className="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                로그인
              </button>

              <div className="mt-1 flex items-stretch justify-center gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setView("findId")}
                  className="min-w-0 flex-1 break-keep text-center leading-tight hover:text-foreground"
                >
                  아이디 찾기
                </button>
                <span className="self-center text-border">|</span>
                <button
                  type="button"
                  onClick={() => setView("findPw")}
                  className="min-w-0 flex-1 break-keep text-center leading-tight hover:text-foreground"
                >
                  비밀번호 찾기
                </button>
                <span className="self-center text-border">|</span>
                <Link
                  href="/signup"
                  className="min-w-0 flex-1 break-keep text-center font-medium leading-tight text-primary hover:underline"
                >
                  회원가입
                </Link>
              </div>
            </div>
          )}

          {(view === "findId" || view === "findPw") && (
            <div className="flex flex-col gap-3">
              <input
                placeholder="가입한 이메일 주소"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => window.alert("가입된 정보가 있다면 안내 메일을 발송했습니다.")}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {view === "findId" ? "아이디 찾기" : "비밀번호 재설정 메일 받기"}
              </button>
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-center text-xs text-muted-foreground hover:text-foreground"
              >
                로그인으로 돌아가기
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
