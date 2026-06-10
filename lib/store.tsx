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
