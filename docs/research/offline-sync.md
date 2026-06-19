# Offline Sync Patterns

## Problem
Electron app needs to work offline. Users should be able to view cached data and queue writes when disconnected.

## Pattern: Write-Through Cache with Sync Queue

### Architecture
1. **Read path:** Check SQLite cache first → if miss or stale, fetch from API → update cache
2. **Write path:** Send to API → on success, update cache → on failure, queue in sync table
3. **Sync path:** On reconnect, process sync queue FIFO → retry failed writes

### SQLite Cache Schema
```sql
CREATE TABLE IF NOT EXISTS cache_projects (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,        -- JSON blob
  cached_at INTEGER NOT NULL -- unix timestamp
);

CREATE TABLE IF NOT EXISTS cache_tasks (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  cached_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,       -- 'create', 'update', 'delete'
  entity TEXT NOT NULL,       -- 'task', 'project', etc.
  payload TEXT NOT NULL,      -- JSON blob
  created_at INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0
);
```

### Cache Invalidation
- Time-based: cache entries expire after configurable TTL (default 5 minutes)
- Event-based: on successful write, update cache immediately
- Manual: pull-to-refresh or app foreground triggers re-fetch

### Conflict Resolution
- Server wins: Neon is source of truth
- Last-write-wins for non-critical fields
- Prompt user for critical conflicts (e.g., same task edited offline by two users)

## References
- [PouchDB/CouchDB sync](https://pouchdb.com/guides/replication.html) — battle-tested sync protocol
- [WatermelonDB](https://watermelondb.dev/) — SQLite sync for React Native (concepts apply)
- [Dexie.js](https://dexie.org/docs/Table/Table.get()) — IndexedDB wrapper with similar patterns
