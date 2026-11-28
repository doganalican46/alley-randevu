import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import process from 'node:process'

const [encryptedPath, checksumPath] = process.argv.slice(2)

if (!encryptedPath || !checksumPath) {
  globalThis.console.error('Usage: node scripts/verify-backup.mjs <backup.enc> <backup.enc.sha256>')
  process.exitCode = 1
} else {
  const [encrypted, checksumText] = await Promise.all([
    readFile(encryptedPath),
    readFile(checksumPath, 'utf8')
  ])

  if (encrypted.length <= 16 || encrypted.subarray(0, 8).toString('ascii') !== 'Salted__') {
    globalThis.console.error(
      'Backup validation failed: file is not an OpenSSL salted encrypted payload.'
    )
    process.exitCode = 1
  } else {
    const expected = checksumText.trim().split(/\s+/u)[0]?.toLowerCase()
    const actual = createHash('sha256').update(encrypted).digest('hex')

    if (!expected || expected !== actual) {
      globalThis.console.error('Backup validation failed: SHA-256 checksum does not match.')
      process.exitCode = 1
    } else {
      globalThis.console.log(
        `Encrypted backup verified: ${basename(encryptedPath)} (${encrypted.length} bytes)`
      )
    }
  }
}
