import express from 'express'
import session from 'express-session'
import connectPg from 'connect-pg-simple'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false })
const PgStore = connectPg(session)

app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '20kb' }))
app.use(express.urlencoded({ extended: false }))

app.use(session({
  store: new PgStore({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
}))

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
  `)
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ message: 'Unauthorized' })
  next()
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'UP', database: 'UP' })
  } catch {
    res.status(503).json({ status: 'DOWN' })
  }
})

app.post('/api/submissions', async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  if (!name || name.length > 150 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid name and email address.' })
  }
  try {
    await pool.query('INSERT INTO submissions(name,email) VALUES($1,$2)', [name, email])
    res.status(201).json({ message: 'Thank you. Your details were submitted successfully.' })
  } catch {
    res.status(500).json({ message: 'Unable to save your details right now.' })
  }
})

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const username = String(req.body.username || '')
  const password = String(req.body.password || '')
  if (username !== process.env.ADMIN_USERNAME) return res.status(401).json({ message: 'Invalid username or password.' })

  const valid = await bcrypt.compare(password, await bcrypt.hash(process.env.ADMIN_PASSWORD, 10))
  if (!valid) return res.status(401).json({ message: 'Invalid username or password.' })

  req.session.admin = true
  res.json({ message: 'Login successful.' })
})

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out.' }))
})

app.get('/api/admin/me', (req, res) => res.json({ authenticated: !!req.session.admin }))

app.get('/api/admin/submissions', requireAdmin, async (req, res) => {
  const search = String(req.query.search || '').trim()
  const result = await pool.query(
    `SELECT id,name,email,created_at FROM submissions
     WHERE name ILIKE $1 OR email ILIKE $1
     ORDER BY created_at DESC LIMIT 100`, [`%${search}%`])
  res.json(result.rows)
})

const frontend = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(frontend))
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(frontend, 'index.html')))

const port = Number(process.env.PORT || 10000)
initDb().then(() => app.listen(port, '0.0.0.0', () => console.log(`Server running on ${port}`)))
  .catch(err => { console.error(err); process.exit(1) })
