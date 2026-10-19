import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { set } from '@dotenvx/dotenvx'

import { loadEncryptedEnvironment } from './load-encrypted-env'

describe('loadEncryptedEnvironment', () => {
  let directory: string
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'load-env-'))
  })
  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  test('loads nothing without a private key', () => {
    const envFile = path.join(directory, '.env')
    writeFileSync(envFile, 'GITHUB_TOKEN=plain\n')
    const env: Record<string, string> = {}
    expect(loadEncryptedEnvironment({ envFile, env })).toBe(false)
    expect(env.GITHUB_TOKEN).toBeUndefined()
  })

  test('loads nothing when the file is missing', () => {
    const env: Record<string, string> = {
      DOTENV_PRIVATE_KEY: 'a'.repeat(64),
    }
    const envFile = path.join(directory, 'absent.env')
    expect(loadEncryptedEnvironment({ envFile, env })).toBe(false)
    expect(env.GITHUB_TOKEN).toBeUndefined()
  })

  test('does not throw on a wrong key', () => {
    const envFile = path.join(directory, '.env')
    writeFileSync(envFile, 'GITHUB_TOKEN=plain\n')
    const env: Record<string, string> = {
      DOTENV_PRIVATE_KEY: 'not-a-key',
    }
    expect(() => loadEncryptedEnvironment({ envFile, env })).not.toThrow()
  })

  test('decrypts the file when key and file are present', async () => {
    const envFile = path.join(directory, '.env')
    writeFileSync(envFile, '')
    await set('GITHUB_TOKEN', 'secret-value', {
      path: envFile,
      envKeysFile: path.join(directory, '.env.keys'),
    })
    expect(readFileSync(envFile, 'utf8')).not.toContain('secret-value')
    const keys = readFileSync(path.join(directory, '.env.keys'), 'utf8')
    const privateKey = /DOTENV_PRIVATE_KEY="?([0-9a-f]+)"?/.exec(keys)?.[1]
    const env: Record<string, string> = {
      DOTENV_PRIVATE_KEY: privateKey ?? '',
    }
    expect(loadEncryptedEnvironment({ envFile, env })).toBe(true)
    expect(env.GITHUB_TOKEN).toBe('secret-value')
  })
})
