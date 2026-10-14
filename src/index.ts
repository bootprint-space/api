import { Hono } from 'hono'
import { cors } from 'hono/cors'

const OBJECTS = ['earth', 'jupiter', 'mars', 'mercury', 'moon', 'saturn', 'sun', 'uranus', 'venus']
const RATE_LIMIT_MAX_REQUESTS = 60
const RATE_LIMIT_WINDOW_MS = 60_000
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

function getClientIdentity(c: { req: { header(name: string): string | undefined } }): string {
  const identityParts = CLIENT_IDENTITY_HEADERS.flatMap((headerName) => {
    const value = c.req.header(headerName)?.trim()
    return value ? [`${headerName}=${value}`] : []
  })

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
  '*',
  cors({
    origin: [
      'https://1511117190450122883.discordsays.com',
      'http://localhost:3000'
    ],
    allowHeaders: [...CLIENT_IDENTITY_HEADERS],
    exposeHeaders: [
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    allowMethods: ['GET', 'OPTIONS'],
  })
)

app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return next()
  }

  const clientIdentifier = getClientIdentity(c)
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

app.get('/', (c) => {
  return c.json({
    status: 'API is online.',
    rate_limit: '60 requests per minute.',
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

app.notFound((c) => c.json({ error: 'Not found.' }, 404))

export default app