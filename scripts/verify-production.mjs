import process from 'node:process'
import { URL } from 'node:url'

const baseUrl = process.env.PRODUCTION_URL ?? 'https://alley-randevu.netlify.app'
const checks = [
  ['/', 'text/html'],
  ['/register', 'text/html'],
  ['/platform', 'text/html'],
  ['/manifest.webmanifest', 'application/manifest+json'],
  ['/sw.js', 'application/javascript']
]

let failed = false
for (const [path, expectedType] of checks) {
  const response = await globalThis.fetch(new URL(path, baseUrl), { redirect: 'manual' })
  const contentType = response.headers.get('content-type') ?? ''
  const passed = response.ok && contentType.includes(expectedType)
  globalThis.console.log(`${passed ? 'OK' : 'FAIL'} ${path} ${response.status} ${contentType}`)
  if (!passed) failed = true
}

if (failed) process.exitCode = 1
