"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Category } from "./data"

export type Post = {
  id: string
  title: string
  author: string // 저자
  price: number
  condition: string
  category: Category
  department?: string // 전공일 때 학과
  liberalGroup?: string // 교양일 때 분류
  grade?: string
  description?: string
  image?: string // data URL
  school: string
  sellerId: string // 판매자 아이디(이메일)
  createdAt: number
}

type User = { id: string; email: string }

type StoreContextType = {
  ready: boolean
  school: string | null
  setSchool: (s: string) => void
  user: User | null
  login: (email: string) => void
  logout: () => void
  registerUser: (email: string) => void
  posts: Post[]
  addPost: (p: Omit<Post, "id" | "createdAt" | "sellerId">) => Post
  getPost: (id: string) => Post | undefined
  recentIds: string[]
  pushRecent: (id: string) => void
  removeRecent: (id: string) => void
}

const StoreContext = createContext<StoreContextType | null>(null)

const SCHOOL_KEY = "unibooks.school"
const POSTS_KEY = "unibooks.posts"
const RECENT_KEY = "unibooks.recent"
const USER_KEY = "unibooks.user"

function hashSchool(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function demoPosts(school: string): Post[] {
  const base = `s${hashSchool(school)}`
  return [
    {
      id: `demo-${base}-1`,
      title: "James Stewart 미분적분학 8판",
      author: "James Stewart",
      price: 18000,
      condition: "상",
      category: "전공",
      department: "수학과",
      grade: "1학년",
      description: "필기 거의 없고 깨끗합니다. 직거래 선호해요.",
      image: "/books/calculus.png",
      school,
      sellerId: `mathlover@unibooks.kr`,
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
      id: `demo-${base}-2`,
      title: "맨큐의 경제학 (Principles of Economics)",
      author: "N. Gregory Mankiw",
      price: 25000,
      condition: "중",
      category: "전공",
      department: "경제학과",
      grade: "2학년",
      description: "형광펜 필기 일부 있습니다.",
      image: "/books/econ.png",
      school,
      sellerId: `econ_master@unibooks.kr`,
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
    },
    {
      id: `demo-${base}-3`,
      title: "심리학개론 (Introduction to Psychology)",
      author: "James Kalat",
      price: 12000,
      condition: "상",
      category: "교양",
      liberalGroup: "인성·교양",
      grade: "1학년",
      description: "교양 수업 들으면서 본 책이에요.",
      image: "/books/psych.png",
      school,
      sellerId: `book_dealer@unibooks.kr`,
      createdAt: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
      id: `demo-${base}-4`,
      title: "College Writing 대학 영작문",
      author: "Susan Anker",
      price: 9000,
      condition: "하",
      category: "교양",
      liberalGroup: "필수교양",
      grade: "전체",
      description: "필수 교양 영어 교재입니다.",
      image: "/books/english.png",
      school,
      sellerId: `english99@unibooks.kr`,
      createdAt: Date.now() - 1000 * 60 * 60 * 30,
    },
  ]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [school, setSchoolState] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const s = localStorage.getItem(SCHOOL_KEY)
      if (s) setSchoolState(s)
      const p = localStorage.getItem(POSTS_KEY)
      if (p) setPosts(JSON.parse(p))
      const r = localStorage.getItem(RECENT_KEY)
      if (r) setRecentIds(JSON.parse(r))
      const u = localStorage.getItem(USER_KEY)
      if (u) setUser(JSON.parse(u))
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  const setSchool = useCallback((s: string) => {
    setSchoolState(s)
    localStorage.setItem(SCHOOL_KEY, s)
    setPosts((prev) => {
      if (prev.some((p) => p.school === s)) return prev
      const next = [...demoPosts(s), ...prev]
      localStorage.setItem(POSTS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const login = useCallback((email: string) => {
    const u = { id: email, email }
    setUser(u)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }, [])

  const registerUser = useCallback(
    (email: string) => {
      login(email)
    },
    [login],
  )

  const addPost = useCallback(
    (p: Omit<Post, "id" | "createdAt" | "sellerId">) => {
      const post: Post = {
        ...p,
        id: Math.random().toString(36).slice(2, 10),
        createdAt: Date.now(),
        sellerId: user?.email ?? "guest@unibooks.kr",
      }
      setPosts((prev) => {
        const next = [post, ...prev]
        localStorage.setItem(POSTS_KEY, JSON.stringify(next))
        return next
      })
      return post
    },
    [user],
  )

  const getPost = useCallback((id: string) => posts.find((p) => p.id === id), [posts])

  const pushRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = prev.filter((x) => x !== id)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      ready,
      school,
      setSchool,
      user,
      login,
      logout,
      registerUser,
      posts,
      addPost,
      getPost,
      recentIds,
      pushRecent,
      removeRecent,
    }),
    [
      ready,
      school,
      setSchool,
      user,
      login,
      logout,
      registerUser,
      posts,
      addPost,
      getPost,
      recentIds,
      pushRecent,
      removeRecent,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
