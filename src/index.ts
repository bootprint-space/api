import { Hono } from 'hono'
import { sentry } from '@sentry/hono/cloudflare'
import * as Sentry from '@sentry/cloudflare'

const OBJECTS = ['earth', 'jupiter', 'mars', 'mercury', 'moon', 'saturn', 'sun', 'uranus', 'venus']
const RATE_LIMIT_MAX_REQUESTS = 60
const RATE_LIMIT_WINDOW_MS = 60_000
const DEFAULT_ALLOWED_ORIGINS = [
  'https://1511117190450122883.discordsays.com',
  'http://localhost:3000',
]
const CLIENT_IDENTITY_HEADERS = [
  'x-client-id',
  'x-client-name',
  'x-client-type',
  'x-client-version',
] as const

const QUERIES: Record<string, string> = Object.fromEntries(
  OBJECTS.map(o => [o, `SELECT id, fact FROM \`${o}\` ORDER BY RANDOM() LIMIT 1`])
)

type Bindings = {
  DB: D1Database
  CDN: R2Bucket
  RATE_LIMITER: DurableObjectNamespace
  ALLOWED_ORIGINS?: string
  SENTRY_DSN?: string
  ENVIRONMENT?: string
}

type RateLimitState = {
  windowStart: number
  count: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

function formatRetryDelay(totalSeconds: number): string {
  if (totalSeconds >= 60) {
    const minutes = Math.ceil(totalSeconds / 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }

  return `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`
}

function getAllowedOrigins(bindings?: Pick<Bindings, 'ALLOWED_ORIGINS'>): string[] {
  const rawOrigins = bindings?.ALLOWED_ORIGINS?.trim()
  if (!rawOrigins) return DEFAULT_ALLOWED_ORIGINS

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function ensureSentryInitialized(bindings?: Pick<Bindings, 'SENTRY_DSN' | 'ENVIRONMENT'>): void {
  if (!bindings?.SENTRY_DSN || (globalThis as { __bootprint_sentry_initialized?: boolean }).__bootprint_sentry_initialized) {
    return
  }

  ;(globalThis as { __bootprint_sentry_initialized?: boolean }).__bootprint_sentry_initialized = true
}

function getAuthToken(c: { req: { header(name: string): string | undefined } }): string | null {
  const token = c.req.header('Authorization') ?? c.req.header('authorization')
  return token?.trim() ? token.trim() : null
}

function getRateLimitIdentity(c: { req: { header(name: string): string | undefined } }): string {
  const identityParts = CLIENT_IDENTITY_HEADERS.flatMap((headerName) => {
    const value = c.req.header(headerName)?.trim()
    return value ? [`${headerName}=${value}`] : []
  })

  // Authentication is intentionally kept separate from the rate-limit identity.
  // The Authorization header is never used to form the limiter bucket.
  return identityParts.join('|')
}

async function hashIdentifier(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export class RateLimiter implements DurableObject {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const now = Date.now()
    const current = (await this.state.storage.get<RateLimitState>('window')) ?? null

    let nextState: RateLimitState
    if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
      nextState = { windowStart: now, count: 1 }
    } else {
      nextState = { ...current, count: current.count + 1 }
    }

    const resetAt = nextState.windowStart + RATE_LIMIT_WINDOW_MS

    if (nextState.count > RATE_LIMIT_MAX_REQUESTS) {
      return Response.json(
        {
          allowed: false,
          remaining: 0,
          resetAt,
        },
        { status: 429 }
      )
    }

    await this.state.storage.put('window', nextState)

    return Response.json({
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - nextState.count,
      resetAt,
    })
  }
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  sentry(app, (env) => ({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT ?? 'production',
    tracesSampleRate: 1.0,
  }))
)

app.use('*', async (c, next) => {
  ensureSentryInitialized(c.env)

  const origin = c.req.header('Origin')
  const allowedOrigins = getAllowedOrigins(c.env)
  const isAllowedOrigin = origin
    ? allowedOrigins.some((allowedOrigin) => {
        try {
          return new URL(allowedOrigin).origin === origin
        } catch {
          return allowedOrigin === origin
        }
      })
    : false

  if (origin && isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', origin)
  }

  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', CLIENT_IDENTITY_HEADERS.join(', '))
  c.header(
    'Access-Control-Expose-Headers',
    ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'].join(', ')
  )

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
})

app.use('*', async (c, next) => {
  const authToken = getAuthToken(c)
  const clientIdentifier = getRateLimitIdentity(c)
  const fallbackAddress =
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  const clientAddress = clientIdentifier
    ? `client:${await hashIdentifier(clientIdentifier)}`
    : `ip:${fallbackAddress}`

  const limiter = c.env.RATE_LIMITER.getByName(clientAddress)
  const response = await limiter.fetch('https://rate-limiter/check', { method: 'POST' })
  const result = (await response.json()) as RateLimitResult

  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))

    Sentry.withScope((scope) => {
      scope.setTag('component', 'rate-limiter')
      scope.setExtra('route', c.req.path)
      scope.setExtra('client_address', clientAddress)
      scope.setExtra('auth_present', Boolean(authToken))
      scope.setExtra('retry_after_seconds', retryAfterSeconds)
      scope.setExtra('remaining', 0)
      scope.setLevel('warning')
      Sentry.captureMessage('Rate limit exceeded')
    })

    return c.json(
      { error: `Rate limit exceeded. Please wait ${formatRetryDelay(retryAfterSeconds)} before trying again.` },
      429,
      {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      }
    )
  }

  await next()
  c.res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS))
  c.res.headers.set('X-RateLimit-Remaining', String(result.remaining))
  c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))
  return c.res
})

function isValidObject(object: string): boolean {
  return OBJECTS.includes(object.toLowerCase())
}

async function getRandomImage(cdn: R2Bucket, object: string) {
  const list = await cdn.list({ prefix: `${object}/` })
  if (!list.objects.length) return null
  const random = list.objects[Math.floor(Math.random() * list.objects.length)]
  return {
    image: `https://cdn.bootprint.space/${random.key}`,
    image_id: random.etag,
  }
}

async function getRandomFact(db: D1Database, object: string) {
  const result = await db
    .prepare(QUERIES[object])
    .first<{ id: string; fact: string }>()
  if (!result) return null
  return { fact: result.fact, fact_id: result.id }
}

app.get('/health', async (c) => {
  ensureSentryInitialized(c.env)

  const checks = {
    api: 'ok',
    database: 'unknown',
    storage: 'unknown',
  }

  let isHealthy = true

  try {
    await c.env.DB.prepare('SELECT 1').first()
    checks.database = 'ok'
  } catch (error) {
    checks.database = 'error'
    isHealthy = false

    Sentry.withScope((scope) => {
      scope.setTag('component', 'database')
      scope.setLevel('error')
      Sentry.captureException(error)
    })
  }

  try {
    await c.env.CDN.list({ prefix: '', limit: 1 })
    checks.storage = 'ok'
  } catch (error) {
    checks.storage = 'error'
    isHealthy = false

    Sentry.withScope((scope) => {
      scope.setTag('component', 'storage')
      scope.setLevel('error')
      Sentry.captureException(error)
    })
  }

  return c.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    isHealthy ? 200 : 503
  )
})

app.get('/', (c) => {
  return c.json({
    status: 'API is online.',
  })
})

app.get('/all/:object', async (c) => {
  const object = c.req.param('object').toLowerCase()
  if (!isValidObject(object)) {
    return c.json({ error: 'Invalid object name. Please provide a valid celestial object.' }, 400)
  }
  const [img, fact] = await Promise.all([
    getRandomImage(c.env.CDN, object),
    getRandomFact(c.env.DB, object),
  ])
  if (!img || !fact) return c.json({ error: 'No data found for this object.' }, 404)
  return c.json({ object, ...img, ...fact })
})

app.get('/img/:object', async (c) => {
  const object = c.req.param('object').toLowerCase()
  if (!isValidObject(object)) {
    return c.json({ error: 'Invalid object name. Please provide a valid celestial object.' }, 400)
  }
  const img = await getRandomImage(c.env.CDN, object)
  if (!img) return c.json({ error: 'No images found for this object.' }, 404)
  return c.json({ object, ...img })
})

app.get('/fact/:object', async (c) => {
  const object = c.req.param('object').toLowerCase()
  if (!isValidObject(object)) {
    return c.json({ error: 'Invalid object name. Please provide a valid celestial object.' }, 400)
  }
  const fact = await getRandomFact(c.env.DB, object)
  if (!fact) return c.json({ error: 'No facts found for this object.' }, 404)
  return c.json({ object, ...fact })
})

app.onError((err, c) => {
  ensureSentryInitialized(c.env)

  Sentry.withScope((scope) => {
    scope.setTag('component', 'api')
    scope.setExtra('route', c.req.path)
    scope.setExtra('method', c.req.method)
    scope.setLevel('error')
    Sentry.captureException(err)
  })

  return c.json({ error: 'Internal server error.' }, 500)
})

app.notFound((c) => c.json({ error: 'Not found.' }, 404))

export default app