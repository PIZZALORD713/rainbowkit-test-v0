export async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

  const text = await res.text() // always read text first

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Bad JSON: ${text.slice(0, 200)}`)
  }
}
