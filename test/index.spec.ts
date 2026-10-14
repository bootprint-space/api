import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'
import worker, { buildRateLimitBucketKey } from '../src/index'

function createRequest(
  path: string,
  ip: string,
  clientIdentity?: {
    id?: string
    name?: string
    type?: string
    version?: string
  }
) {
  const headers: Record<string, string> = {
    'cf-connecting-ip': ip,
  }

  if (clientIdentity?.id) {
    headers['x-client-id'] = clientIdentity.id
  }

  if (clientIdentity?.name) {
    headers['x-client-name'] = clientIdentity.name
  }

  if (clientIdentity?.type) {
    headers['x-client-type'] = clientIdentity.type
  }

  if (clientIdentity?.version) {
    headers['x-client-version'] = clientIdentity.version
  }

  return new Request(`http://localhost${path}`, {
    headers,
  })
}

describe('Bootprint API', () => {
  it('hashes fallback IP rate-limit buckets before storing or logging them', async () => {
    const headers = new Map<string, string>([['cf-connecting-ip', '203.0.113.42']])
    const key = await buildRateLimitBucketKey({
      req: {
        header: (name: string) => headers.get(name),
      },
    })

    expect(key).toBe(`ip:${await crypto.subtle.digest('SHA-256', new TextEncoder().encode('203.0.113.42')).then((hash) => Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join(''))}`)
    expect(key).not.toContain('203.0.113.42')
  })

  it('rejects unsupported HTTP methods', async () => {
    const request = new Request('http://localhost/', {
      method: 'POST',
      headers: {
        'cf-connecting-ip': '203.0.113.1',
      },
    })

    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(405)
  })

  it('rejects unexpected content types on read-only requests', async () => {
    const request = new Request('http://localhost/', {
      method: 'GET',
      headers: {
        'cf-connecting-ip': '203.0.113.11',
        'content-type': 'application/xml',
      },
    })

    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(415)
  })

  it('GET / returns online status', async () => {
    const request = createRequest('/', '203.0.113.1')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)
    expect(response.status).toBe(200)
    const json = (await response.json()) as { status: string }
    expect(json.status).toBe('API is online.')
    expect(json).not.toHaveProperty('rate_limit')
    expect(response.headers.get('x-ratelimit-limit')).toBe('60')
  })

  it('GET /all/:object returns 400 for invalid object', async () => {
    const request = createRequest('/all/pluto', '203.0.113.2')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)
    expect(response.status).toBe(400)
  })

  it('GET /fact/invalid returns 400', async () => {
    const request = createRequest('/fact/notaplanet', '203.0.113.3')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)
    expect(response.status).toBe(400)
  })

  it('limits repeated requests from the same client', async () => {
    const ip = '203.0.113.4'

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const ctx = createExecutionContext()
      const response = await worker.fetch(createRequest('/', ip), env, ctx)
      await waitOnExecutionContext(ctx)
      expect(response.status).toBe(200)
    }

    const finalContext = createExecutionContext()
    const finalResponse = await worker.fetch(createRequest('/', ip), env, finalContext)
    await waitOnExecutionContext(finalContext)

    expect(finalResponse.status).toBe(429)
    const body = (await finalResponse.json()) as { error: string }
    expect(body.error).toMatch(/^Rate limit exceeded\. Please wait \d+ (second|seconds|minute|minutes) before trying again\.$/)
  })

  it('treats different x-client-id values on the same IP as separate buckets', async () => {
    const ip = '203.0.113.5'

    const firstContext = createExecutionContext()
    const firstResponse = await worker.fetch(createRequest('/', ip, { id: 'client-a' }), env, firstContext)
    await waitOnExecutionContext(firstContext)
    expect(firstResponse.status).toBe(200)

    const secondContext = createExecutionContext()
    const secondResponse = await worker.fetch(createRequest('/', ip, { id: 'client-b' }), env, secondContext)
    await waitOnExecutionContext(secondContext)
    expect(secondResponse.status).toBe(200)
  })

  it('uses the same client metadata across different IPs for the same limit bucket', async () => {
    const clientIdentity = {
      id: 'client-shared',
      name: 'bootprint-web',
      type: 'browser',
      version: '1.0.0',
    }

    for (const ip of ['203.0.113.6', '203.0.113.7']) {
      const ctx = createExecutionContext()
      const response = await worker.fetch(createRequest('/', ip, clientIdentity), env, ctx)
      await waitOnExecutionContext(ctx)
      expect(response.status).toBe(200)
    }

    for (let attempt = 0; attempt < 58; attempt += 1) {
      const ctx = createExecutionContext()
      const response = await worker.fetch(createRequest('/', '203.0.113.8', clientIdentity), env, ctx)
      await waitOnExecutionContext(ctx)
      expect(response.status).toBe(200)
    }

    const finalContext = createExecutionContext()
    const finalResponse = await worker.fetch(createRequest('/', '203.0.113.9', clientIdentity), env, finalContext)
    await waitOnExecutionContext(finalContext)

    expect(finalResponse.status).toBe(429)
  })

  it('GET /health returns 404 because the health endpoint is intentionally not public', async () => {
    const request = createRequest('/health', '203.0.113.10')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(404)
  })

  it('does not use Authorization headers in the rate-limit identity bucket', async () => {
    const clientIdentity = {
      id: 'client-auth-separate',
      name: 'bootprint-web',
      type: 'browser',
      version: '1.0.0',
    }

    const requestA = createRequest('/', '203.0.113.20', clientIdentity)
    requestA.headers.set('Authorization', 'Bearer token-a')

    const ctxA = createExecutionContext()
    const responseA = await worker.fetch(requestA, env, ctxA)
    await waitOnExecutionContext(ctxA)
    expect(responseA.status).toBe(200)

    const requestB = createRequest('/', '203.0.113.20', clientIdentity)
    requestB.headers.set('Authorization', 'Bearer token-b')

    const ctxB = createExecutionContext()
    const responseB = await worker.fetch(requestB, env, ctxB)
    await waitOnExecutionContext(ctxB)
    expect(responseB.status).toBe(200)
  })

  it('allows client identity headers in CORS preflight and exposes rate limit headers', async () => {
    const request = new Request('http://localhost/', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'x-client-id, x-client-name, x-client-type, x-client-version',
      },
    })

    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-headers')).toContain('x-client-id')
    expect(response.headers.get('access-control-allow-headers')).toContain('x-client-name')
    expect(response.headers.get('access-control-allow-headers')).toContain('x-client-type')
    expect(response.headers.get('access-control-allow-headers')).toContain('x-client-version')
    expect(response.headers.get('access-control-expose-headers')).toContain('X-RateLimit-Limit')
    expect(response.headers.get('access-control-expose-headers')).toContain('Retry-After')
  })
})