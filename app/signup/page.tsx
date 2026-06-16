"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Check, GraduationCap, ChevronDown, ArrowLeft } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { SchoolSelectModal } from "@/components/school-select-modal"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function passwordChecks(pw: string) {
  return {
    special: /[!@#$%^&*(),.?":{}|<>_\-[\]\\/+=;'`~]/.test(pw),
    number: /[0-9]/.test(pw),
    upper: /[A-Z]/.test(pw),
  }
}

function strengthOf(pw: string): { label: string; level: number } {
  if (pw.length >= 10) return { label: "안전", level: 3 }
  if (pw.length >= 8) return { label: "보통", level: 2 }
  if (pw.length >= 6) return { label: "주의", level: 1 }
  return { label: "", level: 0 }
}

export default function SignupPage() {
  const { registerUser, isNicknameTaken } = useStore()
  const router = useRouter()

  const [signupSchool, setSignupSchool] = useState<string | null>(null)
  const [schoolModalOpen, setSchoolModalOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [sentCode, setSentCode] = useState("")
  const [code, setCode] = useState("")
  const [verified, setVerified] = useState(false)
  const [nickname, setNickname] = useState("")
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [showPw, setShowPw] = useState(false)

  const checks = passwordChecks(pw)
  const strength = strengthOf(pw)
  const emailValid = EMAIL_RE.test(email)
  const pwAllValid = checks.special && checks.number && checks.upper && pw.length >= 6
  const pwMismatch = pw2.length > 0 && pw !== pw2

  const nickTrim = nickname.trim()
  const nickTooShort = nickTrim.length > 0 && nickTrim.length < 2
  const nickTaken = nickTrim.length >= 2 && isNicknameTaken(nickTrim)
  const nickAvailable = nickTrim.length >= 2 && !nickTaken

  const signupValid = useMemo(
    () => !!signupSchool && verified && nickAvailable && pwAllValid && pw === pw2 && pw2.length > 0,
    [signupSchool, verified, nickAvailable, pwAllValid, pw, pw2],
  )

  function getFrom() {
    if (typeof window === "undefined") return "/"
    const f = new URLSearchParams(window.location.search).get("from")
    return f && f.startsWith("/") ? f : "/"
  }

  function goBack() {
    router.push(getFrom())
  }

  function goLogin() {
    router.replace(`/login?from=${encodeURIComponent(getFrom())}`)
  }

  function resetVerification() {
    setCodeSent(false)
    setSentCode("")
    setCode("")
    setVerified(false)
  }

  function sendCode() {
    if (!signupSchool) {
      window.alert("먼저 학교를 선택해주세요.")
      return
    }
    if (!emailValid) {
      window.alert("학교 이메일을 올바르게 입력해주세요.")
      return
    }
    const c = String(Math.floor(100000 + Math.random() * 900000))
    setSentCode(c)
    setCodeSent(true)
    setVerified(false)
  }

  function verifyCode() {
    if (code.trim() === sentCode) {
      setVerified(true)
    } else {
      window.alert("인증번호가 일치하지 않습니다.")
    }
  }

  function handleSignup() {
    if (!signupValid || !signupSchool) return
    registerUser(email, nickTrim, signupSchool)
    window.alert("회원가입이 완료되었습니다.")
    router.push(getFrom())
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
          <span className="text-lg font-semibold text-foreground">회원가입</span>
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
          <h1 className="mb-5 text-lg font-semibold text-foreground">회원가입</h1>

          <div className="flex flex-col gap-3">
            {/* 내 대학교 선택 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">내 대학교</label>
              <button
                type="button"
                onClick={() => setSchoolModalOpen(true)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none",
                  signupSchool ? "border-border text-foreground" : "border-border text-muted-foreground",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{signupSchool ?? "대학교 선택하기"}</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </div>

            {/* 아이디(학교 이메일) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                아이디 (학교 이메일)
              </label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  resetVerification()
                }}
                placeholder="id@university.ac.kr"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none",
                  email.length > 0 && !emailValid
                    ? "border-destructive"
                    : "border-border focus:border-primary",
                )}
              />
              {email.length > 0 && !emailValid && (
                <p className="mt-1 text-xs text-destructive">이메일 형식으로 입력해주세요.</p>
              )}
            </div>

            {/* 인증하기 (메일 아래) */}
            {!verified && !codeSent && (
              <button
                type="button"
                onClick={sendCode}
                className="w-full rounded-lg border border-primary py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
              >
                인증하기
              </button>
            )}

            {/* 인증번호 입력 + 인증하기 (아래로 밀림) */}
            {codeSent && !verified && (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  데모 인증번호: <span className="font-semibold text-foreground">{sentCode}</span>{" "}
                  (실제 서비스에서는 학교 메일로 발송됩니다)
                </p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") verifyCode()
                  }}
                  placeholder="인증번호 6자리 입력"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={verifyCode}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  인증하기
                </button>
              </div>
            )}

            {verified && (
              <p className="flex items-center gap-1 text-xs font-medium text-primary">
                <Check className="size-3.5" /> 인증되었습니다.
              </p>
            )}

            {/* 닉네임 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">닉네임</label>
              <div className="relative">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="2자 이상 입력"
                  maxLength={16}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2.5 pr-20 text-sm outline-none",
                    nickTaken || nickTooShort
                      ? "border-destructive"
                      : nickAvailable
                        ? "border-primary"
                        : "border-border focus:border-primary",
                  )}
                />
                {nickTrim.length > 0 && (
                  <span
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium",
                      nickAvailable ? "text-primary" : "text-destructive",
                    )}
                  >
                    {nickTooShort ? "너무 짧음" : nickAvailable ? "사용 가능" : "사용 중"}
                  </span>
                )}
              </div>
              {nickTaken && <p className="mt-1 text-xs text-destructive">이미 사용 중인 닉네임입니다.</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
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
              <p className="mt-1.5 text-xs text-muted-foreground">
                특수기호 최소 1개, 숫자 1개, 대문자 1개를 포함해야 합니다.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <Req ok={checks.special} label="특수기호" />
                <Req ok={checks.number} label="숫자" />
                <Req ok={checks.upper} label="대문자" />
              </div>
              {strength.level > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i <= strength.level
                            ? strength.level === 1
                              ? "bg-destructive"
                              : strength.level === 2
                                ? "bg-yellow-500"
                                : "bg-primary"
                            : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      strength.level === 1
                        ? "text-destructive"
                        : strength.level === 2
                          ? "text-yellow-600"
                          : "text-primary",
                    )}
                  >
                    보안 수준: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <input
                type={showPw ? "text" : "password"}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="비밀번호 확인"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none",
                  pwMismatch ? "border-destructive" : "border-border focus:border-primary",
                )}
              />
              {pwMismatch && <p className="mt-1 text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>}
            </div>

            <button
              type="button"
              disabled={!signupValid}
              onClick={handleSignup}
              className="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              확인
            </button>

            <button
              type="button"
              onClick={goLogin}
              className="text-center text-xs text-muted-foreground hover:text-foreground"
            >
              이미 계정이 있으신가요? 로그인
            </button>
          </div>
        </div>
      </div>

      <SchoolSelectModal
        open={schoolModalOpen}
        current={signupSchool}
        onClose={() => setSchoolModalOpen(false)}
        onConfirm={(s) => {
          setSignupSchool(s)
          resetVerification()
          setSchoolModalOpen(false)
        }}
      />
    </main>
  )
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn("flex items-center gap-1", ok ? "text-primary" : "text-muted-foreground")}>
      <Check className={cn("size-3.5", ok ? "opacity-100" : "opacity-30")} />
      {label}
    </span>
  )
}
