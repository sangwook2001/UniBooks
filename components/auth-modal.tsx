"use client"

import { useMemo, useState } from "react"
import { X, Eye, EyeOff, Check } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type View = "login" | "signup" | "findId" | "findPw"

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

export function AuthModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { login, registerUser, isNicknameTaken } = useStore()
  const [view, setView] = useState<View>("login")

  // login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPw, setLoginPw] = useState("")
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [loginTouched, setLoginTouched] = useState(false)

  // signup state
  const [email, setEmail] = useState("")
  const [nickname, setNickname] = useState("")
  const [code, setCode] = useState("")
  const [sentCode, setSentCode] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [showPw, setShowPw] = useState(false)

  const checks = passwordChecks(pw)
  const strength = strengthOf(pw)
  const loginEmailInvalid = loginTouched && loginEmail.length > 0 && !EMAIL_RE.test(loginEmail)
  const emailValid = EMAIL_RE.test(email)
  const pwAllValid = checks.special && checks.number && checks.upper && pw.length >= 6
  const pwMismatch = pw2.length > 0 && pw !== pw2

  const nickTrim = nickname.trim()
  const nickTooShort = nickTrim.length > 0 && nickTrim.length < 2
  const nickTaken = nickTrim.length >= 2 && isNicknameTaken(nickTrim)
  const nickAvailable = nickTrim.length >= 2 && !nickTaken

  const signupValid = useMemo(
    () => verified && nickAvailable && pwAllValid && pw === pw2 && pw2.length > 0,
    [verified, nickAvailable, pwAllValid, pw, pw2],
  )

  if (!open) return null

  function reset() {
    setView("login")
    setLoginEmail("")
    setLoginPw("")
    setLoginTouched(false)
    setEmail("")
    setNickname("")
    setCode("")
    setSentCode(null)
    setVerified(false)
    setPw("")
    setPw2("")
  }

  function close() {
    reset()
    onClose()
  }

  function handleLogin() {
    setLoginTouched(true)
    if (!EMAIL_RE.test(loginEmail)) return
    if (!loginPw) return
    login(loginEmail)
    close()
  }

  function sendCode() {
    if (!emailValid) return
    // 데모용 본인확인: 6자리 코드를 생성해 화면에 표시
    const c = String(Math.floor(100000 + Math.random() * 900000))
    setSentCode(c)
    setVerified(false)
  }

  function verifyCode() {
    if (code && code === sentCode) setVerified(true)
  }

  function handleSignup() {
    if (!signupValid) return
    registerUser(email, nickTrim)
    window.alert("회원가입이 완료되었습니다.")
    close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        onClick={close}
        className="absolute inset-0 bg-foreground/40"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {view === "login" && "로그인"}
            {view === "signup" && "회원가입"}
            {view === "findId" && "아이디 찾기"}
            {view === "findPw" && "비밀번호 찾기"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {view === "login" && (
          <div className="flex flex-col gap-3">
            <div>
              <input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onBlur={() => setLoginTouched(true)}
                placeholder="아이디 (이메일)"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none",
                  loginEmailInvalid
                    ? "border-destructive"
                    : "border-border focus:border-primary",
                )}
              />
              {loginEmailInvalid && (
                <p className="mt-1 text-xs text-destructive">
                  이메일 형식으로 입력해주세요. (예: id@unibooks.kr)
                </p>
              )}
            </div>

            <div className="relative">
              <input
                type={showLoginPw ? "text" : "password"}
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                placeholder="비밀번호"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowLoginPw((v) => !v)}
                aria-label="비밀번호 표시"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showLoginPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              className="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              로그인
            </button>

            <div className="mt-1 flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <button type="button" onClick={() => setView("findId")} className="hover:text-foreground">
                아이디 찾기
              </button>
              <span className="text-border">|</span>
              <button type="button" onClick={() => setView("findPw")} className="hover:text-foreground">
                비밀번호 찾기
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={() => setView("signup")}
                className="font-medium text-primary hover:underline"
              >
                회원가입
              </button>
            </div>
          </div>
        )}

        {view === "signup" && (
          <div className="flex flex-col gap-3">
            {/* 아이디(이메일) + 본인확인 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                아이디 (이메일)
              </label>
              <div className="flex gap-2">
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setVerified(false)
                    setSentCode(null)
                  }}
                  placeholder="id@unibooks.kr"
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none",
                    email.length > 0 && !emailValid
                      ? "border-destructive"
                      : "border-border focus:border-primary",
                  )}
                />
                <button
                  type="button"
                  disabled={!emailValid || verified}
                  onClick={sendCode}
                  className="shrink-0 rounded-lg border border-primary px-3 text-xs font-medium text-primary disabled:opacity-40"
                >
                  {sentCode ? "재전송" : "인증요청"}
                </button>
              </div>
              {email.length > 0 && !emailValid && (
                <p className="mt-1 text-xs text-destructive">이메일 형식으로 입력해주세요.</p>
              )}
              {sentCode && !verified && (
                <p className="mt-1 text-xs text-primary">
                  데모 인증번호: <span className="font-semibold">{sentCode}</span> (실제 서비스에서는 메일로 발송됩니다)
                </p>
              )}
            </div>

            {sentCode && !verified && (
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="인증번호 6자리"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={verifyCode}
                  className="shrink-0 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
                >
                  확인
                </button>
              </div>
            )}
            {verified && (
              <p className="-mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                <Check className="size-3.5" /> 본인확인이 완료되었습니다.
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
              {nickTaken && (
                <p className="mt-1 text-xs text-destructive">이미 사용 중인 닉네임입니다.</p>
              )}
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
              {pwMismatch && (
                <p className="mt-1 text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>
              )}
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
              onClick={() => setView("login")}
              className="text-center text-xs text-muted-foreground hover:text-foreground"
            >
              이미 계정이 있으신가요? 로그인
            </button>
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
