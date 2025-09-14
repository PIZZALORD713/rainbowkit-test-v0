import { getDemoOraIds } from "@/lib/demo/aim-seeds"
import { OraGrid } from "@/components/demo/OraGrid"

export default function DemoPage() {
  const demoOraIds = getDemoOraIds()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-slate-900/95 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance">Bring Your Ora to Life</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed text-balance">
              See how the MCP Server powers AIM profiles and creative prompts. No wallet required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                MCP Server Active
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                {demoOraIds.length} Demo Profiles Available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sample Ora Collection</h2>
          <p className="text-slate-600 leading-relaxed">
            Click on any Ora to explore their AI-generated profile and see how MCP powers creative content generation.
          </p>
        </div>

        <OraGrid oraIds={demoOraIds} />
      </div>
    </div>
  )
}
