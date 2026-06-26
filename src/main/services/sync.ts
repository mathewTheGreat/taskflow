import { syncQueueGetPending, syncQueueRemove, syncQueueIncrementRetry, cacheSetList, cacheMetaSet } from './cache.js'

const API_BASE = 'http://localhost:3001/api'
const MAX_RETRIES = 3

const PULL_ENDPOINTS = [
  { cacheTable: 'cache_tasks', kvKey: 'pull', entity: 'tasks', cacheKeyPrefix: 'tasks' },
  { cacheTable: 'cache_projects', kvKey: 'pull', entity: 'projects', cacheKeyPrefix: 'projects' },
  { cacheTable: 'cache_teams', kvKey: 'pull', entity: 'teams', cacheKeyPrefix: 'teams' },
]

async function pushPhase(getToken: () => string | null): Promise<{ processed: number; failed: number }> {
  const pending = syncQueueGetPending()
  let processed = 0
  let failed = 0

  for (const item of pending) {
    if (item.retry_count >= MAX_RETRIES) {
      syncQueueRemove(item.id!)
      continue
    }

    try {
      const token = getToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      let url = `${API_BASE}/${item.entity}`
      let method = 'POST'

      if (item.action === 'update') {
        const payload = JSON.parse(item.payload)
        url += `/${payload.id}`
        method = 'PUT'
      } else if (item.action === 'delete') {
        const payload = JSON.parse(item.payload)
        url += `/${payload.id}`
        method = 'DELETE'
      }

      const body = item.action !== 'delete' ? item.payload : undefined

      const res = await fetch(url, { method, headers, body })
      if (res.ok || res.status === 204) {
        syncQueueRemove(item.id!)
        processed++
      } else {
        syncQueueIncrementRetry(item.id!)
        failed++
      }
    } catch {
      syncQueueIncrementRetry(item.id!)
      failed++
    }
  }

  return { processed, failed }
}

async function pullPhase(getToken: () => string | null): Promise<{ synced: number }> {
  const token = getToken()
  if (!token) return { synced: 0 }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  let synced = 0

  for (const endpoint of PULL_ENDPOINTS) {
    try {
      const res = await fetch(`${API_BASE}/${endpoint.entity}?limit=200`, { headers })
      if (!res.ok) continue

      const body = await res.json() as Record<string, unknown>
      const items = (body[endpoint.entity] || body.tasks || body.projects || body.teams || []) as { id: string }[]
      if (!Array.isArray(items) || items.length === 0) continue

      // Update entity cache (individual records)
      cacheSetList(endpoint.cacheTable, items)

      // Invalidate kv list caches so they re-populate on next request
      const prefix = `${endpoint.cacheKeyPrefix}:list:`
      cacheMetaSet(`${prefix}invalidated`, Date.now().toString())

      synced += items.length
    } catch {
      // Pull is best-effort
    }
  }

  return { synced }
}

export async function processSyncQueue(getToken: () => string | null): Promise<{
  processed: number
  failed: number
  remaining: number
  pulled: number
}> {
  const { processed, failed } = await pushPhase(getToken)

  // After pushing local changes, pull latest data from cloud
  const { synced } = await pullPhase(getToken)

  const remaining = syncQueueGetPending().length

  if (processed + synced > 0) {
    cacheMetaSet('last_synced_at', Date.now().toString())
  }

  return { processed, failed, remaining, pulled: synced }
}
