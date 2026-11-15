// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { build, resolveConfig } from 'vite'
import { createServiceAdapter } from './src/services/create-service-adapter'
import { HttpServiceAdapter } from './src/services/http-service-adapter'
import { MockServiceAdapter } from './src/services/mock-service-adapter'
import packageJson from './package.json'

const directories: string[] = []
afterEach(async () => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

async function launchConfig(mode: 'dev' | 'demo', opposite: 'mock' | 'http', apiUrl?: string) {
  const root = await mkdtemp(join(tmpdir(), 'gdes-vite-'))
  directories.push(root)
  await Promise.all(['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`].map((file) =>
    writeFile(join(root, file), `VITE_SERVICE_MODE=${opposite}\n${apiUrl ? `VITE_API_BASE_URL=${apiUrl}\n` : ''}`),
  ))
  vi.stubEnv('VITE_SERVICE_MODE', opposite)
  vi.stubEnv('VITE_API_BASE_URL', '')
  // Vite gives existing shell variables precedence; remove the empty URL to test file/default loading.
  delete process.env.VITE_API_BASE_URL
  return resolveConfig({ root, configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)), mode }, 'serve')
}

function effectiveEnvironment(config: Awaited<ReturnType<typeof resolveConfig>>) {
  return {
    VITE_SERVICE_MODE: JSON.parse(config.define?.['import.meta.env.VITE_SERVICE_MODE'] ?? 'null'),
    VITE_API_BASE_URL: JSON.parse(config.define?.['import.meta.env.VITE_API_BASE_URL'] ?? 'null'),
  }
}

describe('explicit DEV and DEMO launches', () => {
  it('selects explicit modes in the npm commands', () => {
    expect(packageJson.scripts.dev).toBe('vite --mode dev')
    expect(packageJson.scripts).toHaveProperty('demo', 'vite --mode demo')
  })

  it('forces HTTP and localhost:5173 despite inherited mock mode, with a default API', async () => {
    const config = await launchConfig('dev', 'mock')
    expect(config.server).toMatchObject({ host: 'localhost', port: 5173, strictPort: true })
    expect(effectiveEnvironment(config)).toEqual({ VITE_SERVICE_MODE: 'http', VITE_API_BASE_URL: 'http://localhost:3000/api/v1' })
    expect(createServiceAdapter(effectiveEnvironment(config))).toBeInstanceOf(HttpServiceAdapter)
  })

  it('preserves a custom DEV API URL from env files', async () => {
    const config = await launchConfig('dev', 'mock', 'http://localhost:4000/api/v1')
    expect(effectiveEnvironment(config).VITE_API_BASE_URL).toBe('http://localhost:4000/api/v1')
  })

  it('preserves a custom shell DEV API URL ahead of files', async () => {
    await launchConfig('dev', 'mock', 'http://localhost:4000/api/v1')
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:5000/api/v1')
    const config = await resolveConfig({ root: directories[0], configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)), mode: 'dev' }, 'serve')
    expect(effectiveEnvironment(config).VITE_API_BASE_URL).toBe('http://localhost:5000/api/v1')
  })

  it('forces mocks and localhost:5174 despite inherited HTTP mode and performs no fetch', async () => {
    const config = await launchConfig('demo', 'http', 'http://unavailable.invalid/api/v1')
    expect(config.server).toMatchObject({ host: 'localhost', port: 5174, strictPort: true })
    const fetcher = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetcher)
    const adapter = createServiceAdapter(effectiveEnvironment(config))
    expect(adapter).toBeInstanceOf(MockServiceAdapter)
    const userPath = '/users/22000000-0000-4000-8000-000000000001'
    await expect(adapter.request({ path: userPath })).resolves.toMatchObject({ data: { accountStatus: 'ACTIVE' } })
    await adapter.request({ path: `${userPath}/account-status`, method: 'PATCH', body: { accountStatus: 'INACTIVE' } })
    await expect(adapter.request({ path: userPath })).resolves.toMatchObject({ data: { accountStatus: 'INACTIVE' } })
    // A fresh adapter (page reload) restarts fixtures; changes are only in this instance's memory.
    await expect(createServiceAdapter(effectiveEnvironment(config)).request({ path: userPath }))
      .resolves.toMatchObject({ data: { accountStatus: 'ACTIVE' } })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([
    ['dev', 'mock', 'http'],
    ['demo', 'http', 'mock'],
  ] as const)('injects the forced %s mode into the whole import.meta.env object', async (mode, opposite, expected) => {
    const config = await launchConfig(mode, opposite)
    const entry = join(config.root, 'environment.ts')
    // services.ts passes this entire object to the factory, not individual property accesses.
    await writeFile(entry, 'globalThis.__gdesEnvironment = import.meta.env')
    const result = await build({
      root: config.root,
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      mode,
      logLevel: 'silent',
      build: { write: false, minify: false, lib: { entry, name: 'EnvironmentFixture', formats: ['iife'] } },
    })
    const outputs = Array.isArray(result) ? result : [result]
    const context: { __gdesEnvironment?: Record<string, string> } = {}
    for (const output of outputs) {
      if (!('output' in output)) throw new Error('Expected an in-memory build')
      for (const chunk of output.output) {
        if (chunk.type === 'chunk') runInNewContext(chunk.code, context)
      }
    }
    expect(context.__gdesEnvironment).toMatchObject({
      VITE_SERVICE_MODE: expected,
      VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
    })
  })

  it('does not fall back to mocks when the DEV API is offline', async () => {
    const config = await launchConfig('dev', 'mock')
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'))
    vi.stubGlobal('fetch', fetcher)
    await expect(createServiceAdapter(effectiveEnvironment(config)).request({ path: '/users' }))
      .rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
