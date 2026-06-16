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

export type Comment = {
  id: string
  authorId?: string // 작성자 이메일(판매자 여부 판별용)
  author: string // 닉네임
  text: string
  createdAt: number
  replies?: Comment[]
}

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
  sellerNickname: string // 판매자 닉네임
  openChatUrl: string // 오픈 채팅 링크
  views: number
  likes: number
  comments: Comment[]
  createdAt: number
}

type User = { id: string; email: string; nickname: string }

type StoreContextType = {
  ready: boolean
  school: string | null
  setSchool: (s: string) => void
  user: User | null
  login: (email: string, nickname?: string) => void
  logout: () => void
  registerUser: (email: string, nickname: string) => void
  isNicknameTaken: (nickname: string) => boolean
  posts: Post[]
  addPost: (p: Omit<Post, "id" | "createdAt" | "sellerId" | "sellerNickname" | "views" | "likes" | "comments">) => Post
  getPost: (id: string) => Post | undefined
  incrementViews: (id: string) => void
  toggleLike: (id: string) => void
  likedIds: string[]
  addComment: (id: string, text: string) => void
  addReply: (postId: string, commentId: string, text: string) => void
  editComment: (postId: string, commentId: string, text: string) => void
  deleteComment: (postId: string, commentId: string) => void
  recentIds: string[]
  pushRecent: (id: string) => void
  removeRecent: (id: string) => void
}

const StoreContext = createContext<StoreContextType | null>(null)

const SCHOOL_KEY = "unibooks.school"
const POSTS_KEY = "unibooks.posts"
const RECENT_KEY = "unibooks.recent"
const USER_KEY = "unibooks.user"
const NICK_KEY = "unibooks.nicknames"
const LIKED_KEY = "unibooks.liked"

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
      sellerNickname: "수학덕후",
      openChatUrl: "https://open.kakao.com/o/demo-math",
      views: 142,
      likes: 12,
      comments: [
        { id: "c1", author: "공대생", text: "혹시 판매 완료됐나요?", createdAt: Date.now() - 1000 * 60 * 40 },
      ],
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
      sellerNickname: "경제왕",
      openChatUrl: "https://open.kakao.com/o/demo-econ",
      views: 89,
      likes: 5,
      comments: [],
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
      sellerNickname: "책장수",
      openChatUrl: "https://open.kakao.com/o/demo-psych",
      views: 211,
      likes: 24,
      comments: [],
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
      sellerNickname: "영어달인",
      openChatUrl: "https://open.kakao.com/o/demo-eng",
      views: 67,
      likes: 3,
      comments: [],
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
  const [nicknames, setNicknames] = useState<string[]>([])
  const [likedIds, setLikedIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const s = localStorage.getItem(SCHOOL_KEY)
      if (s) setSchoolState(s)
      const p = localStorage.getItem(POSTS_KEY)
      if (p) {
        const parsed = JSON.parse(p) as Partial<Post>[]
        const migrated = parsed
          // 샘플 게시글은 가천대학교에만 남기고, 다른 학교의 옛 샘플은 제거합니다.
          .filter((x) => !(String(x.id ?? "").startsWith("demo-") && x.school !== "가천대학교"))
          .map((x) => ({
            views: 0,
            likes: 0,
            comments: [],
            sellerNickname: x.sellerId ? String(x.sellerId).split("@")[0] : "익명",
            openChatUrl: "",
            ...x,
          })) as Post[]
        setPosts(migrated)
        localStorage.setItem(POSTS_KEY, JSON.stringify(migrated))
      }
      const r = localStorage.getItem(RECENT_KEY)
      if (r) setRecentIds(JSON.parse(r))
      const u = localStorage.getItem(USER_KEY)
      if (u) setUser(JSON.parse(u))
      const n = localStorage.getItem(NICK_KEY)
      if (n) setNicknames(JSON.parse(n))
      const l = localStorage.getItem(LIKED_KEY)
      if (l) setLikedIds(JSON.parse(l))
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  const setSchool = useCallback((s: string) => {
    setSchoolState(s)
    localStorage.setItem(SCHOOL_KEY, s)
    // 샘플 게시글은 가천대학교에만 표시하고, 나머지 학교는 빈 저장소로 시작합니다.
    if (s !== "가천대학교") return
    setPosts((prev) => {
      if (prev.some((p) => p.school === s)) return prev
      const next = [...demoPosts(s), ...prev]
      localStorage.setItem(POSTS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const login = useCallback((email: string, nickname?: string) => {
    const u = { id: email, email, nickname: nickname ?? email.split("@")[0] }
    setUser(u)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }, [])

  const isNicknameTaken = useCallback(
    (nickname: string) => {
      const n = nickname.trim().toLowerCase()
      const reserved = ["수학덕후", "경제왕", "책장수", "영어달인", "admin", "운영자"]
      return reserved.includes(n) || nicknames.some((x) => x.toLowerCase() === n)
    },
    [nicknames],
  )

  const registerUser = useCallback(
    (email: string, nickname: string) => {
      setNicknames((prev) => {
        const next = [...prev, nickname]
        localStorage.setItem(NICK_KEY, JSON.stringify(next))
        return next
      })
      login(email, nickname)
    },
    [login],
  )

  const addPost = useCallback(
    (p: Omit<Post, "id" | "createdAt" | "sellerId" | "sellerNickname" | "views" | "likes" | "comments">) => {
      const post: Post = {
        ...p,
        id: Math.random().toString(36).slice(2, 10),
        createdAt: Date.now(),
        sellerId: user?.email ?? "guest@unibooks.kr",
        sellerNickname: user?.nickname ?? "익명",
        views: 0,
        likes: 0,
        comments: [],
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

  const persistPosts = useCallback((next: Post[]) => {
    localStorage.setItem(POSTS_KEY, JSON.stringify(next))
    return next
  }, [])

  const incrementViews = useCallback(
    (id: string) => {
      setPosts((prev) => persistPosts(prev.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p))))
    },
    [persistPosts],
  )

  const toggleLike = useCallback(
    (id: string) => {
      const liked = likedIds.includes(id)
      const nextLiked = liked ? likedIds.filter((x) => x !== id) : [...likedIds, id]
      setLikedIds(nextLiked)
      localStorage.setItem(LIKED_KEY, JSON.stringify(nextLiked))
      setPosts((prev) =>
        persistPosts(
          prev.map((p) => (p.id === id ? { ...p, likes: Math.max(0, p.likes + (liked ? -1 : 1)) } : p)),
        ),
      )
    },
    [likedIds, persistPosts],
  )

  const makeComment = useCallback(
    (text: string): Comment => ({
      id: Math.random().toString(36).slice(2, 10),
      authorId: user?.email,
      author: user?.nickname ?? "익명",
      text,
      createdAt: Date.now(),
      replies: [],
    }),
    [user],
  )

  const addComment = useCallback(
    (id: string, text: string) => {
      const comment = makeComment(text)
      setPosts((prev) =>
        persistPosts(prev.map((p) => (p.id === id ? { ...p, comments: [...p.comments, comment] } : p))),
      )
    },
    [makeComment, persistPosts],
  )

  const addReply = useCallback(
    (postId: string, commentId: string, text: string) => {
      const reply = makeComment(text)
      setPosts((prev) =>
        persistPosts(
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c,
                  ),
                }
              : p,
          ),
        ),
      )
    },
    [makeComment, persistPosts],
  )

  const editComment = useCallback(
    (postId: string, commentId: string, text: string) => {
      const apply = (c: Comment): Comment =>
        c.id === commentId
          ? { ...c, text }
          : { ...c, replies: c.replies ? c.replies.map(apply) : c.replies }
      setPosts((prev) =>
        persistPosts(prev.map((p) => (p.id === postId ? { ...p, comments: p.comments.map(apply) } : p))),
      )
    },
    [persistPosts],
  )

  const deleteComment = useCallback(
    (postId: string, commentId: string) => {
      setPosts((prev) =>
        persistPosts(
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments
                    .filter((c) => c.id !== commentId)
                    .map((c) => ({
                      ...c,
                      replies: c.replies ? c.replies.filter((r) => r.id !== commentId) : c.replies,
                    })),
                }
              : p,
          ),
        ),
      )
    },
    [persistPosts],
  )

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
      isNicknameTaken,
      posts,
      addPost,
      getPost,
      incrementViews,
      toggleLike,
      likedIds,
      addComment,
      addReply,
      editComment,
      deleteComment,
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
      isNicknameTaken,
      posts,
      addPost,
      getPost,
      incrementViews,
      toggleLike,
      likedIds,
      addComment,
      addReply,
      editComment,
      deleteComment,
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
