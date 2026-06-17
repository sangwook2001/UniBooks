# UniBooks

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_GQB4FmHTNeuWXPj2otYKxAaYzOSu)

## VS Code에서 실행하기 (한글 가이드)

### 1. 코드 내려받기

v0 화면 오른쪽 위의 점 3개 메뉴에서 **Download ZIP**을 누르거나, GitHub 저장소를 클론합니다.

```bash
git clone https://github.com/sangwook2001/UniBooks.git
cd UniBooks
```

그다음 VS Code에서 폴더를 엽니다. (`code .`)

### 2. 의존성 설치

이 프로젝트는 **pnpm**을 사용합니다. (pnpm이 없으면 `npm install -g pnpm`)

```bash
pnpm install
```

> npm을 쓰고 싶다면 `npm install` 도 가능합니다.

### 3. 환경 변수 설정

`.env.example` 파일을 복사해 `.env.local` 파일을 만듭니다.

```bash
cp .env.example .env.local
```

`.env.local` 안의 값을 본인의 Supabase 프로젝트 값으로 채웁니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

이 값들은 v0 프로젝트의 **Vars** 메뉴(오른쪽 위 설정 버튼) 또는 Supabase 대시보드의 **Project Settings → API**에서 확인할 수 있습니다.

### 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 결과를 확인할 수 있습니다.

`app/page.tsx` 파일을 수정하면 페이지가 자동으로 새로고침됩니다.

### 추천 VS Code 확장 프로그램

- **ESLint** (dbaeumer.vscode-eslint)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **Prettier** (esbenp.prettier-vscode)

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
