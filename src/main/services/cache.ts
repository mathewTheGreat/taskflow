import path from 'path'
import os from 'os'

let db: unknown = null
let cacheAvailable = false

const CACHE_DIR = path.join(os.homedir(), '.taskflow')
const CACHE_DB_PATH = path.join(CACHE_DIR, 'cache.db')
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function initializeCache(): Promise<void> {
  try {
    const Database = (await import('better-sqlite3')).default
    const fs = await import('fs')
    fs.mkdirSync(CACHE_DIR, { recursive: true })

    db = new Database(CACHE_DB_PATH)
    ;(db as { pragma: (s: string) => void }).pragma('journal_mode = WAL')

    ;(db as { exec: (s: string) => void }).exec(`
      CREATE TABLE IF NOT EXISTS cache_projects (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cache_tasks (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cache_teams (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cache_sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS cache_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)

    cacheAvailable = true
    console.log('[Cache] SQLite cache initialized at', CACHE_DB_PATH)
  } catch (err) {
    console.warn('[Cache] better-sqlite3 not available, running without local cache:', (err as Error).message)
    console.debug('[Cache] cache initialization error details', err)
    cacheAvailable = false
  }
}

function getDb() {
  if (!cacheAvailable || !db) return null
  return db as {
    prepare: (sql: string) => { get: (id: string) => unknown; all: () => unknown[]; run: (...args: unknown[]) => void }
    exec: (sql: string) => void
    transaction: (fn: () => void) => void
  }
}

// Generic cache operations
export function cacheGet<T>(table: string, id: string): T | null {
  const database = getDb()
  if (!database) return null
  try {
    const row = database.prepare(`SELECT data, cached_at FROM ${table} WHERE id = ?`).get(id) as { data: string; cached_at: number } | undefined
    if (!row) return null
    const age = Date.now() - row.cached_at
    if (age > CACHE_TTL_MS) {
      database.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
      return null
    }
    return JSON.parse(row.data) as T
  } catch { return null }
}

export function cacheSet<T>(table: string, id: string, data: T): void {
  const database = getDb()
  if (!database) return
  try {
    database.prepare(`
      INSERT INTO ${table} (id, data, cached_at) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at
    `).run(id, JSON.stringify(data), Date.now())
  } catch { /* ignore */ }
}

export function cacheGetList<T>(table: string): T[] {
  const database = getDb()
  if (!database) return []
  try {
    const rows = database.prepare(`SELECT data, cached_at FROM ${table}`).all() as { data: string; cached_at: number }[]
    const now = Date.now()
    const valid: T[] = []
    for (const row of rows) {
      if (now - row.cached_at <= CACHE_TTL_MS) {
        valid.push(JSON.parse(row.data))
      }
    }
    return valid
  } catch { return [] }
}

export function cacheSetList<T extends { id: string }>(table: string, items: T[]): void {
  const database = getDb()
  if (!database) return
  try {
    const now = Date.now()
    const insert = database.prepare(`
      INSERT INTO ${table} (id, data, cached_at) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at
    `)
    database.transaction(() => {
      for (const item of items) {
        insert.run(item.id, JSON.stringify(item), now)
      }
    })
  } catch { /* ignore */ }
}

export function cacheInvalidate(table: string, id?: string): void {
  const database = getDb()
  if (!database) return
  try {
    if (id) {
      database.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
    } else {
      database.exec(`DELETE FROM ${table}`)
    }
  } catch { /* ignore */ }
}

// Sync queue operations
export interface SyncQueueItem {
  id?: number
  action: 'create' | 'update' | 'delete'
  entity: string
  payload: string
  created_at: number
  retry_count: number
}

export function syncQueuePush(action: 'create' | 'update' | 'delete', entity: string, payload: unknown): void {
  const database = getDb()
  if (!database) return
  try {
    database.prepare(`
      INSERT INTO cache_sync_queue (action, entity, payload, created_at, retry_count)
      VALUES (?, ?, ?, ?, 0)
    `).run(action, entity, JSON.stringify(payload), Date.now())
  } catch { /* ignore */ }
}

export function syncQueueGetPending(): SyncQueueItem[] {
  const database = getDb()
  if (!database) return []
  try {
    return database.prepare(`
      SELECT id, action, entity, payload, created_at, retry_count
      FROM cache_sync_queue
      ORDER BY created_at ASC
    `).all() as SyncQueueItem[]
  } catch { return [] }
}

export function syncQueueRemove(id: number): void {
  const database = getDb()
  if (!database) return
  try {
    database.prepare(`DELETE FROM cache_sync_queue WHERE id = ?`).run(id)
  } catch { /* ignore */ }
}

export function syncQueueIncrementRetry(id: number): void {
  const database = getDb()
  if (!database) return
  try {
    database.prepare(`UPDATE cache_sync_queue SET retry_count = retry_count + 1 WHERE id = ?`).run(id)
  } catch { /* ignore */ }
}

// Metadata
export function cacheMetaGet(key: string): string | null {
  const database = getDb()
  if (!database) return null
  try {
    const row = database.prepare('SELECT value FROM cache_metadata WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value || null
  } catch { return null }
}

export function cacheMetaSet(key: string, value: string): void {
  const database = getDb()
  if (!database) return
  try {
    database.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value)
  } catch { /* ignore */ }
}
