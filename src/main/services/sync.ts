import { syncQueueGetPending, syncQueueRemove, syncQueueIncrementRetry } from './cache'

const API_BASE = 'http://localhost:3001/api'
const MAX_RETRIES = 3

export async function processSyncQueue(getToken: () => string | null): Promise<{
  processed: number
  failed: number
  remaining: number
}> {
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

  const remaining = syncQueueGetPending().length
  return { processed, failed, remaining }
}
