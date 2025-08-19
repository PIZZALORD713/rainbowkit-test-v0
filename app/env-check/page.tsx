// Quick runtime check for required NEXT_PUBLIC_* variables on first deploy.
export default function EnvCheck() {
  const pid = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""
  const masked = pid ? `${pid.slice(0, 8)}… (${pid.length} chars)` : "MISSING"

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-lg w-full space-y-3">
        <h1 className="text-2xl font-semibold">Env Check</h1>
        <p className="opacity-80">NEXT_PUBLIC vars are inlined at build time.</p>
        <pre className="rounded-lg border p-3 font-mono text-sm">
          {`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: ${masked}`}
        </pre>
        <a href="/wallet-entry" className="underline">
          Go to /wallet-entry
        </a>
      </div>
    </main>
  )
}
