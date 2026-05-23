import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'
import worker from '../src/index'

describe('Bootprint API', () => {
  it('GET / returns online status', async () => {
    const request = new Request('http://localhost/')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)
    expect(response.status).toBe(200)
    const json = (await response.json()) as { status: string }
    expect(json.status).toBe('API is online.')
  })

  it('GET /all/:object returns 400 for invalid object', async () => {
    const request = new Request('http://localhost/all/pluto')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)
    expect(response.status).toBe(400)
  })

  it('GET /fact/invalid returns 400', async () => {
    const request = new Request('http://localhost/fact/notaplanet')
    const ctx = createExecutionContext()
    const response = await worker.fetch(request, env, ctx)
    await waitOnExecutionContext(ctx)
    expect(response.status).toBe(400)
  })
})