"use client"

import { useEffect, useState } from "react"

type Finding = {
  tag: string
  id: string
  className: string
  transform: string
  filter: string
  perspective: string
  overflow: string
  position: string
  zIndex: string
  path: string
}

function nodeLabel(el: Element) {
  const tag = el.tagName.toLowerCase()
  const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : ""
  const cls = (el as HTMLElement).className
    ? "." +
      String((el as HTMLElement).className)
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(".")
    : ""
  return `${tag}${id}${cls}`
}

function cssPath(el: Element) {
  const chain: string[] = []
  let cur: Element | null = el
  while (cur && chain.length < 8) {
    chain.unshift(nodeLabel(cur))
    cur = cur.parentElement
  }
  return chain.join(" > ")
}

function scanTransforms(): Finding[] {
  const out: Finding[] = []

  const pushFinding = (el: Element) => {
    const s = getComputedStyle(el as Element)
    out.push({
      tag: (el as Element).tagName,
      id: (el as HTMLElement).id || "",
      className: (el as HTMLElement).className?.toString() || "",
      transform: s.transform || "none",
      filter: s.filter || "none",
      perspective: s.perspective || "none",
      overflow: s.overflow || "visible",
      position: s.position || "static",
      zIndex: s.zIndex || "auto",
      path: cssPath(el),
    })
  }

  // Check HTML & BODY explicitly
  pushFinding(document.documentElement)
  pushFinding(document.body)

  // Check the rest
  document.querySelectorAll("*").forEach((el) => {
    const s = getComputedStyle(el as Element)
    const hasTransform =
      (s.transform && s.transform !== "none") ||
      (s.filter && s.filter !== "none") ||
      (s.perspective && s.perspective !== "none")
    if (hasTransform) pushFinding(el)
  })

  // De-dup & cap
  const seen = new Set<string>()
  const deduped = out.filter((f) => {
    const key = `${f.path}|${f.transform}|${f.filter}|${f.perspective}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return deduped.slice(0, 200)
}

export default function DiagnosticsPage() {
  const [findings, setFindings] = useState<Finding[]>([])

  const run = () => setFindings(scanTransforms())

  useEffect(() => {
    run()
  }, [])

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-2">
        <h1 className="text-2xl font-semibold">Modal Diagnostics</h1>
        <p className="opacity-80">
          This lists any elements applying <code>transform</code>, <code>filter</code>, or <code>perspective</code>,
          which can break <code>position: fixed</code> and push the RainbowKit modal off-center (common in zoomed
          canvases).
        </p>
        <div className="flex gap-3">
          <button onClick={run} className="rounded-md border px-3 py-2 text-sm hover:bg-black/5">
            Rescan
          </button>
          <a href="/" className="rounded-md border px-3 py-2 text-sm hover:bg-black/5">
            Open Landing Page
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {findings.length === 0 ? (
          <div className="opacity-70">No transform/filter/perspective detected.</div>
        ) : (
          <div className="overflow-auto rounded-lg border">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="text-left p-2">Path</th>
                  <th className="text-left p-2">Transform</th>
                  <th className="text-left p-2">Filter</th>
                  <th className="text-left p-2">Perspective</th>
                  <th className="text-left p-2">Overflow</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">z-index</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => (
                  <tr key={i} className="odd:bg-white even:bg-black/2">
                    <td className="p-2 font-mono">{f.path}</td>
                    <td className="p-2">{f.transform}</td>
                    <td className="p-2">{f.filter}</td>
                    <td className="p-2">{f.perspective}</td>
                    <td className="p-2">{f.overflow}</td>
                    <td className="p-2">{f.position}</td>
                    <td className="p-2">{f.zIndex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
