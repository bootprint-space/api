import { Hono } from 'hono'
import { cors } from 'hono/cors'

const OBJECTS = ['earth', 'jupiter', 'mars', 'mercury', 'moon', 'saturn', 'sun', 'uranus', 'venus']

type Bindings = {
  DB: D1Database
  CDN: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

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
    .prepare(`SELECT id, fact FROM \`${object}\` ORDER BY RANDOM() LIMIT 1`)
    .first<{ id: string; fact: string }>()
  if (!result) return null
  return { fact: result.fact, fact_id: result.id }
}

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

app.notFound((c) => c.json({ error: 'Not found.' }, 404))

export default app