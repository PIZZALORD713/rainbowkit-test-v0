// Server component reads the value as the bundle knows it (compile-time inlining)
export default function EnvCheck() {
  const pid = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""
  const masked = pid ? `${pid.slice(0, 8)}… (${pid.length} chars)` : "MISSING"

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-lg w-full space-y-4">
        <h1 className="text-2xl font-semibold">Env Check</h1>
        <p className="opacity-80">
          This shows the value as it was seen at <b>build time</b> by Next.js (NEXT_PUBLIC vars are inlined).
        </p>
        <div className="rounded-lg border p-4 font-mono text-sm">
          <div>key: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</div>
          <div>value: {masked}</div>
        </div>
        <a href="/wallet-entry" className="underline text-blue-600">
          Go to /wallet-entry
        </a>
      </div>
    </main>
  )
}
