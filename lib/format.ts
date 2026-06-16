export function formatPrice(n: number): string {
  return n.toLocaleString("ko-KR") + "원"
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`
}

export function formatNumberInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "")
  if (!digits) return ""
  return Number(digits).toLocaleString("ko-KR")
}

export function parseNumber(formatted: string): number {
  return Number(formatted.replace(/[^0-9]/g, "")) || 0
}

import type { Post } from "./store"

export function postTag(p: Post): string {
  if (p.category === "전공") return p.department ?? "전공"
  if (p.category === "교양") return p.liberalGroup ?? "교양"
  if (p.category === "기타") return "기타"
  return "전체"
}
