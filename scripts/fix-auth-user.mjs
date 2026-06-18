import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { Client } = require(process.cwd() + "/node_modules/pg")

const password = process.env.POSTGRES_PASSWORD
if (!password) {
  console.error("no POSTGRES_PASSWORD")
  process.exit(1)
}

// IPv4 풀러 호스트 사용 (직접 호스트는 IPv6 전용이라 샌드박스에서 닿지 않음)
const client = new Client({
  host: "aws-1-ap-northeast-2.pooler.supabase.com",
  port: 5432,
  user: "postgres.cnsskpxugogvjzukzvkf",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
})

const fixSql = `
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where email = 'test@unibooks.kr'
returning id, email;
`

try {
  await client.connect()
  const res = await client.query(fixSql)
  console.log("FIXED rows:", res.rowCount, JSON.stringify(res.rows))
} catch (e) {
  console.error("ERROR:", e.message)
  process.exit(1)
} finally {
  await client.end()
}
