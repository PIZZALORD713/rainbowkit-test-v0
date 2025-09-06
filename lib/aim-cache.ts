// Simple in-memory cache for AIM analysis results
// TODO: Replace with KV store for production persistence
const cache = new Map<string, any>()

export function getCache(key: string) {
  return cache.get(key)
}

export function setCache(key: string, value: any) {
  cache.set(key, value)
}

export function clearCache() {
  cache.clear()
}

// Optional: Add TTL support
const ttlCache = new Map<string, number>()

export function setCacheWithTTL(key: string, value: any, ttlSeconds = 3600) {
  setCache(key, value)
  ttlCache.set(key, Date.now() + ttlSeconds * 1000)
}

export function getCacheWithTTL(key: string) {
  const expiry = ttlCache.get(key)
  if (expiry && Date.now() > expiry) {
    cache.delete(key)
    ttlCache.delete(key)
    return undefined
  }
  return getCache(key)
}
