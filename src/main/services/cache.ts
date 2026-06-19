import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'

let db: Database.Database | null = null

const CACHE_DIR = path.join(os.homedir(), '.taskflow')
const CACHE_DB_PATH = path.join(CACHE_DIR, 'cache.db')
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function initializeCache(): Promise<void> {
  const fs = await import('fs')
  fs.mkdirSync(CACHE_DIR, { recursive: true })

  db = new Database(CACHE_DB_PATH)
  db.pragma('journal_mode = WAL')

  db.exec(`
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

  console.log('[Cache] SQLite cache initialized at', CACHE_DB_PATH)
}

function getDb(): Database.Database {
  if (!db) throw new Error('Cache not initialized. Call initializeCache() first.')
  return db
}

// Generic cache operations
export function cacheGet<T>(table: string, id: string): T | null {
  const database = getDb()
  const row = database.prepare(`SELECT data, cached_at FROM ${table} WHERE id = ?`).get(id) as { data: string; cached_at: number } | undefined
  if (!row) return null

  const age = Date.now() - row.cached_at
  if (age > CACHE_TTL_MS) {
    database.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
    return null
  }

  return JSON.parse(row.data) as T
}

export function cacheSet<T>(table: string, id: string, data: T): void {
  const database = getDb()
  database.prepare(`
    INSERT INTO ${table} (id, data, cached_at) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at
  `).run(id, JSON.stringify(data), Date.now())
}

export function cacheGetList<T>(table: string): T[] {
  const database = getDb()
  const rows = database.prepare(`SELECT data, cached_at FROM ${table}`).all() as { data: string; cached_at: number }[]
  const now = Date.now()
  const valid: T[] = []

  for (const row of rows) {
    if (now - row.cached_at <= CACHE_TTL_MS) {
      valid.push(JSON.parse(row.data))
    } else {
      // Clean up expired
      database.prepare(`DELETE FROM ${table} WHERE cached_at < ?`).run(now - CACHE_TTL_MS)
    }
  }

  return valid
}

export function cacheSetList<T extends { id: string }>(table: string, items: T[]): void {
  const database = getDb()
  const now = Date.now()
  const insert = database.prepare(`
    INSERT INTO ${table} (id, data, cached_at) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at
  `)

  const tx = database.transaction(() => {
    for (const item of items) {
      insert.run(item.id, JSON.stringify(item), now)
    }
  })
  tx()
}

export function cacheInvalidate(table: string, id?: string): void {
  const database = getDb()
  if (id) {
    database.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
  } else {
    database.prepare(`DELETE FROM ${table}`).run()
  }
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
  database.prepare(`
    INSERT INTO cache_sync_queue (action, entity, payload, created_at, retry_count)
    VALUES (?, ?, ?, ?, 0)
  `).run(action, entity, JSON.stringify(payload), Date.now())
}

export function syncQueueGetPending(): SyncQueueItem[] {
  const database = getDb()
  return database.prepare(`
    SELECT id, action, entity, payload, created_at, retry_count
    FROM cache_sync_queue
    ORDER BY created_at ASC
  `).all() as SyncQueueItem[]
}

export function syncQueueRemove(id: number): void {
  const database = getDb()
  database.prepare(`DELETE FROM cache_sync_queue WHERE id = ?`).run(id)
}

export function syncQueueIncrementRetry(id: number): void {
  const database = getDb()
  database.prepare(`UPDATE cache_sync_queue SET retry_count = retry_count + 1 WHERE id = ?`).run(id)
}

// Metadata (for storing last sync time, etc.)
export function cacheMetaGet(key: string): string | null {
  const database = getDb()
  const row = database.prepare('SELECT value FROM cache_metadata WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value || null
}

export function cacheMetaSet(key: string, value: string): void {
  const database = getDb()
  database.prepare(`
    INSERT INTO cache_metadata (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value)
}
