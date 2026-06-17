"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Category } from "./data"
import { createClient } from "./supabase/client"

export type Comment = {
  id: string
  authorId?: string // 작성자 아이디(판매자 여부 판별용)
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

type User = { id: string; email: string; nickname: string; school?: string; isAdmin?: boolean }

// 관리자 계정 (모든 상품 삭제 권한 + 신고 설문 취합)
export const ADMIN_EMAIL = "admin@unibooks.kr"

export type Report = {
  id: string
  postId: string
  postTitle: string
  reason: string
  detail?: string
  reporterId?: string
  reporterNickname?: string
  createdAt: number
}

export type AuthResult = { ok: boolean; error?: string; needsEmailConfirm?: boolean }

type StoreContextType = {
  ready: boolean
  school: string | null
  setSchool: (s: string) => void
  user: User | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  registerUser: (email: string, password: string, nickname: string, school: string) => Promise<AuthResult>
  isNicknameTaken: (nickname: string) => boolean
  posts: Post[]
  addPost: (
    p: Omit<Post, "id" | "createdAt" | "sellerId" | "sellerNickname" | "views" | "likes" | "comments">,
  ) => Promise<Post>
  updatePost: (id: string, patch: Partial<Omit<Post, "id" | "createdAt" | "sellerId">>) => void
  deletePost: (id: string) => void
  getPost: (id: string) => Post | undefined
  incrementViews: (id: string) => void
  toggleLike: (id: string) => void
  likedIds: string[]
  addComment: (id: string, text: string) => void
  addReply: (postId: string, commentId: string, text: string) => void
  editComment: (postId: string, commentId: string, text: string) => void
  deleteComment: (postId: string, commentId: string) => void
  reports: Report[]
  addReport: (r: Omit<Report, "id" | "createdAt">) => void
  deleteReport: (id: string) => void
  clearReports: () => void
  recentIds: string[]
  pushRecent: (id: string) => void
  removeRecent: (id: string) => void
}

const StoreContext = createContext<StoreContextType | null>(null)

const SCHOOL_KEY = "unibooks.school"
const RECENT_KEY = "unibooks.recent"

// ===== DB row 타입 & 매핑 =====
type PostRow = {
  id: string
  title: string
  author: string
  price: number
  condition: string
  category: string
  department: string | null
  liberal_group: string | null
  grade: string | null
  description: string | null
  image: string | null
  school: string
  seller_id: string
  seller_nickname: string
  open_chat_url: string
  views: number
  likes: number
  created_at: string
}

type CommentRow = {
  id: string
  post_id: string
  parent_id: string | null
  author_id: string | null
  author: string
  text: string
  created_at: string
}

type ReportRow = {
  id: string
  post_id: string | null
  post_title: string
  reason: string
  detail: string | null
  reporter_id: string | null
  reporter_nickname: string | null
  created_at: string
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    authorId: row.author_id ?? undefined,
    author: row.author,
    text: row.text,
    createdAt: Date.parse(row.created_at),
    replies: [],
  }
}

function buildComments(rows: CommentRow[]): Record<string, Comment[]> {
  // post_id -> 최상위 댓글(대댓글 nested) 목록
  const byId = new Map<string, Comment>()
  rows.forEach((r) => byId.set(r.id, mapComment(r)))
  const byPost: Record<string, Comment[]> = {}
  rows
    .slice()
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .forEach((r) => {
      const c = byId.get(r.id)!
      if (r.parent_id && byId.has(r.parent_id)) {
        const parent = byId.get(r.parent_id)!
        parent.replies = parent.replies ?? []
        parent.replies.push(c)
      } else {
        byPost[r.post_id] = byPost[r.post_id] ?? []
        byPost[r.post_id].push(c)
      }
    })
  return byPost
}

function mapPost(row: PostRow, comments: Comment[]): Post {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    price: row.price,
    condition: row.condition,
    category: row.category as Category,
    department: row.department ?? undefined,
    liberalGroup: row.liberal_group ?? undefined,
    grade: row.grade ?? undefined,
    description: row.description ?? undefined,
    image: row.image ?? undefined,
    school: row.school,
    sellerId: row.seller_id,
    sellerNickname: row.seller_nickname,
    openChatUrl: row.open_chat_url,
    views: row.views,
    likes: row.likes,
    comments,
    createdAt: Date.parse(row.created_at),
  }
}

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    postId: row.post_id ?? "",
    postTitle: row.post_title,
    reason: row.reason,
    detail: row.detail ?? undefined,
    reporterId: row.reporter_id ?? undefined,
    reporterNickname: row.reporter_nickname ?? undefined,
    createdAt: Date.parse(row.created_at),
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [ready, setReady] = useState(false)
  const [school, setSchoolState] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [nicknames, setNicknames] = useState<string[]>([])
  const [likedIds, setLikedIds] = useState<string[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const userRef = useRef<User | null>(null)
  userRef.current = user

  // 게시글 + 댓글 불러오기
  const loadPosts = useCallback(async () => {
    const [{ data: postRows }, { data: commentRows }] = await Promise.all([
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("comments").select("*"),
    ])
    const commentsByPost = buildComments((commentRows as CommentRow[]) ?? [])
    const mapped = ((postRows as PostRow[]) ?? []).map((r) => mapPost(r, commentsByPost[r.id] ?? []))
    setPosts(mapped)
  }, [supabase])

  // 닉네임 목록(중복 체크용)
  const loadNicknames = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("nickname")
    setNicknames(((data as { nickname: string }[]) ?? []).map((d) => d.nickname))
  }, [supabase])

  // 로그인 사용자 관련 데이터(프로필/찜/신고)
  const loadUserData = useCallback(
    async (authUser: { id: string; email?: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      const email = authUser.email ?? profile?.email ?? ""
      const isAdmin = !!profile?.is_admin || email.toLowerCase() === ADMIN_EMAIL
      const u: User = {
        id: authUser.id,
        email,
        nickname: profile?.nickname ?? email.split("@")[0],
        school: profile?.school ?? undefined,
        isAdmin,
      }
      setUser(u)
      if (u.school) {
        setSchoolState(u.school)
        try {
          localStorage.setItem(SCHOOL_KEY, u.school)
        } catch {
          // ignore
        }
      }

      // 찜 목록
      const { data: likes } = await supabase.from("likes").select("post_id").eq("user_id", authUser.id)
      setLikedIds(((likes as { post_id: string }[]) ?? []).map((l) => l.post_id))

      // 신고(관리자만 조회 가능)
      if (isAdmin) {
        const { data: reportRows } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false })
        setReports(((reportRows as ReportRow[]) ?? []).map(mapReport))
      } else {
        setReports([])
      }
    },
    [supabase],
  )

  // 최초 로드 + 인증 상태 변화 구독
  useEffect(() => {
    try {
      const s = localStorage.getItem(SCHOOL_KEY)
      if (s) setSchoolState(s)
      const r = localStorage.getItem(RECENT_KEY)
      if (r) setRecentIds(JSON.parse(r))
    } catch {
      // ignore
    }

    let active = true
    async function init() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!active) return
      await Promise.all([loadPosts(), loadNicknames()])
      if (authUser) {
        await loadUserData(authUser)
      }
      if (active) setReady(true)
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user
      if (authUser) {
        loadUserData(authUser)
      } else {
        setUser(null)
        setLikedIds([])
        setReports([])
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, loadPosts, loadNicknames, loadUserData])

  const setSchool = useCallback((s: string) => {
    setSchoolState(s)
    try {
      localStorage.setItem(SCHOOL_KEY, s)
    } catch {
      // ignore
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { ok: false, error: error.message }
      if (data.user) await loadUserData(data.user)
      return { ok: true }
    },
    [supabase, loadUserData],
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setLikedIds([])
    setReports([])
  }, [supabase])

  const registerUser = useCallback(
    async (email: string, password: string, nickname: string, userSchool: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined),
          data: { nickname, school: userSchool },
        },
      })
      if (error) return { ok: false, error: error.message }
      setSchool(userSchool)
      loadNicknames()
      // 세션이 바로 생기면(이메일 확인 비활성화) 로그인 처리
      if (data.session && data.user) {
        await loadUserData(data.user)
        return { ok: true }
      }
      return { ok: true, needsEmailConfirm: true }
    },
    [supabase, setSchool, loadNicknames, loadUserData],
  )

  const isNicknameTaken = useCallback(
    (nickname: string) => {
      const n = nickname.trim().toLowerCase()
      return nicknames.some((x) => x.toLowerCase() === n)
    },
    [nicknames],
  )

  const addPost = useCallback(
    async (
      p: Omit<Post, "id" | "createdAt" | "sellerId" | "sellerNickname" | "views" | "likes" | "comments">,
    ) => {
      const current = userRef.current
      const id = crypto.randomUUID()
      const createdAt = Date.now()
      const post: Post = {
        ...p,
        id,
        createdAt,
        sellerId: current?.id ?? "",
        sellerNickname: current?.nickname ?? "익명",
        views: 0,
        likes: 0,
        comments: [],
      }
      // 낙관적 업데이트
      setPosts((prev) => [post, ...prev])
      const { error } = await supabase.from("posts").insert({
        id,
        title: p.title,
        author: p.author,
        price: p.price,
        condition: p.condition,
        category: p.category,
        department: p.department ?? null,
        liberal_group: p.liberalGroup ?? null,
        grade: p.grade ?? null,
        description: p.description ?? null,
        image: p.image ?? null,
        school: p.school,
        seller_id: current?.id ?? "",
        seller_nickname: current?.nickname ?? "익명",
        open_chat_url: p.openChatUrl,
      })
      if (error) {
        console.log("[v0] addPost error:", error.message)
        setPosts((prev) => prev.filter((x) => x.id !== id))
      }
      return post
    },
    [supabase],
  )

  const getPost = useCallback((id: string) => posts.find((p) => p.id === id), [posts])

  const updatePost = useCallback(
    (id: string, patch: Partial<Omit<Post, "id" | "createdAt" | "sellerId">>) => {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      const dbPatch: Record<string, unknown> = {}
      if (patch.title !== undefined) dbPatch.title = patch.title
      if (patch.author !== undefined) dbPatch.author = patch.author
      if (patch.price !== undefined) dbPatch.price = patch.price
      if (patch.condition !== undefined) dbPatch.condition = patch.condition
      if (patch.category !== undefined) dbPatch.category = patch.category
      if (patch.department !== undefined) dbPatch.department = patch.department ?? null
      if (patch.liberalGroup !== undefined) dbPatch.liberal_group = patch.liberalGroup ?? null
      if (patch.grade !== undefined) dbPatch.grade = patch.grade ?? null
      if (patch.description !== undefined) dbPatch.description = patch.description ?? null
      if (patch.image !== undefined) dbPatch.image = patch.image ?? null
      if (patch.openChatUrl !== undefined) dbPatch.open_chat_url = patch.openChatUrl
      if (patch.school !== undefined) dbPatch.school = patch.school
      supabase
        .from("posts")
        .update(dbPatch)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.log("[v0] updatePost error:", error.message)
        })
    },
    [supabase],
  )

  const deletePost = useCallback(
    (id: string) => {
      setPosts((prev) => prev.filter((p) => p.id !== id))
      supabase
        .from("posts")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.log("[v0] deletePost error:", error.message)
        })
    },
    [supabase],
  )

  const addReport = useCallback(
    (r: Omit<Report, "id" | "createdAt">) => {
      const current = userRef.current
      supabase
        .from("reports")
        .insert({
          post_id: r.postId || null,
          post_title: r.postTitle,
          reason: r.reason,
          detail: r.detail ?? null,
          reporter_id: current?.id ?? null,
          reporter_nickname: r.reporterNickname ?? current?.nickname ?? null,
        })
        .then(({ error }) => {
          if (error) console.log("[v0] addReport error:", error.message)
        })
    },
    [supabase],
  )

  const deleteReport = useCallback(
    (id: string) => {
      setReports((prev) => prev.filter((r) => r.id !== id))
      supabase
        .from("reports")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.log("[v0] deleteReport error:", error.message)
        })
    },
    [supabase],
  )

  const clearReports = useCallback(() => {
    const ids = reports.map((r) => r.id)
    setReports([])
    if (ids.length) {
      supabase
        .from("reports")
        .delete()
        .in("id", ids)
        .then(({ error }) => {
          if (error) console.log("[v0] clearReports error:", error.message)
        })
    }
  }, [supabase, reports])

  const incrementViews = useCallback(
    (id: string) => {
      let nextViews = 0
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            nextViews = p.views + 1
            return { ...p, views: nextViews }
          }
          return p
        }),
      )
      supabase
        .from("posts")
        .update({ views: nextViews })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.log("[v0] incrementViews error:", error.message)
        })
    },
    [supabase],
  )

  const toggleLike = useCallback(
    (id: string) => {
      const current = userRef.current
      if (!current) return
      const liked = likedIds.includes(id)
      // 낙관적 업데이트
      setLikedIds((prev) => (liked ? prev.filter((x) => x !== id) : [...prev, id]))
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: Math.max(0, p.likes + (liked ? -1 : 1)) } : p)),
      )
      if (liked) {
        supabase
          .from("likes")
          .delete()
          .eq("user_id", current.id)
          .eq("post_id", id)
          .then(({ error }) => {
            if (error) console.log("[v0] unlike error:", error.message)
          })
      } else {
        supabase
          .from("likes")
          .insert({ user_id: current.id, post_id: id })
          .then(({ error }) => {
            if (error) console.log("[v0] like error:", error.message)
          })
      }
    },
    [supabase, likedIds],
  )

  const addComment = useCallback(
    (id: string, text: string) => {
      const current = userRef.current
      const commentId = crypto.randomUUID()
      const comment: Comment = {
        id: commentId,
        authorId: current?.id,
        author: current?.nickname ?? "익명",
        text,
        createdAt: Date.now(),
        replies: [],
      }
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, comments: [...p.comments, comment] } : p)))
      supabase
        .from("comments")
        .insert({
          id: commentId,
          post_id: id,
          parent_id: null,
          author_id: current?.id ?? null,
          author: comment.author,
          text,
        })
        .then(({ error }) => {
          if (error) console.log("[v0] addComment error:", error.message)
        })
    },
    [supabase],
  )

  const addReply = useCallback(
    (postId: string, commentId: string, text: string) => {
      const current = userRef.current
      const replyId = crypto.randomUUID()
      const reply: Comment = {
        id: replyId,
        authorId: current?.id,
        author: current?.nickname ?? "익명",
        text,
        createdAt: Date.now(),
        replies: [],
      }
      setPosts((prev) =>
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
      )
      supabase
        .from("comments")
        .insert({
          id: replyId,
          post_id: postId,
          parent_id: commentId,
          author_id: current?.id ?? null,
          author: reply.author,
          text,
        })
        .then(({ error }) => {
          if (error) console.log("[v0] addReply error:", error.message)
        })
    },
    [supabase],
  )

  const editComment = useCallback(
    (postId: string, commentId: string, text: string) => {
      const apply = (c: Comment): Comment =>
        c.id === commentId ? { ...c, text } : { ...c, replies: c.replies ? c.replies.map(apply) : c.replies }
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: p.comments.map(apply) } : p)),
      )
      supabase
        .from("comments")
        .update({ text })
        .eq("id", commentId)
        .then(({ error }) => {
          if (error) console.log("[v0] editComment error:", error.message)
        })
    },
    [supabase],
  )

  const deleteComment = useCallback(
    (postId: string, commentId: string) => {
      setPosts((prev) =>
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
      )
      // 대댓글까지 cascade 삭제됨 (parent_id on delete cascade)
      supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .then(({ error }) => {
          if (error) console.log("[v0] deleteComment error:", error.message)
        })
    },
    [supabase],
  )

  const pushRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const removeRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = prev.filter((x) => x !== id)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      ready,
      school,
      setSchool,
      user,
      isAdmin: !!user?.isAdmin,
      login,
      logout,
      registerUser,
      isNicknameTaken,
      posts,
      addPost,
      updatePost,
      deletePost,
      getPost,
      incrementViews,
      toggleLike,
      likedIds,
      addComment,
      addReply,
      editComment,
      deleteComment,
      reports,
      addReport,
      deleteReport,
      clearReports,
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
      updatePost,
      deletePost,
      getPost,
      incrementViews,
      toggleLike,
      likedIds,
      addComment,
      addReply,
      editComment,
      deleteComment,
      reports,
      addReport,
      deleteReport,
      clearReports,
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
