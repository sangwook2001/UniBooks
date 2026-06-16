// 로그인/회원가입을 별도의 새 창으로 엽니다.
// 팝업이 차단된 경우에는 현재 창에서 해당 페이지로 이동합니다.
export function openAuthWindow(path: "/login" | "/signup" = "/login") {
  if (typeof window === "undefined") return
  const w = 460
  const h = 760
  const left = Math.max(0, (window.screen.width - w) / 2)
  const top = Math.max(0, (window.screen.height - h) / 2)
  const win = window.open(
    path,
    "unibooks-auth",
    `width=${w},height=${h},left=${left},top=${top}`,
  )
  if (!win) {
    window.location.href = path
  } else {
    win.focus()
  }
}
