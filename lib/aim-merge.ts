import type { AIM, AIMDelta } from "@/types/aim"

export function mergeAIM(base: AIM, delta: AIMDelta, accept: Record<string, boolean>): AIM {
  const merged = { ...base }

  // Helper function to merge nested objects
  function mergeField(path: string, value: any) {
    if (!accept[path]) return

    const keys = path.split(".")
    let current = merged as any

    // Navigate to parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    const finalKey = keys[keys.length - 1]

    // Merge arrays or replace values
    if (Array.isArray(value) && Array.isArray(current[finalKey])) {
      current[finalKey] = [...new Set([...current[finalKey], ...value])]
    } else {
      current[finalKey] = value
    }
  }

  // Process each field in the delta patch
  Object.entries(delta.patch).forEach(([category, fields]) => {
    if (typeof fields === "object" && fields !== null) {
      Object.entries(fields).forEach(([field, value]) => {
        const path = `${category}.${field}`
        mergeField(path, value)
      })
    }
  })

  // Update metadata
  merged.meta = {
    ...merged.meta,
    source: "merged",
    updatedAt: new Date().toISOString(),
  }

  return merged
}
