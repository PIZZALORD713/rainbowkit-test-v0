import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database, Shuffle, Zap, Shield, Globe, Code, Sparkles, CheckCircle, ArrowRight } from "lucide-react"

export default function MCPExplainerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/demo">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Demo
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Model Context Protocol</h1>
                <p className="text-slate-600 text-sm">Understanding MCP and AIM Integration</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold px-4 py-2">
              Technical Overview
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Database className="w-4 h-4" />
            Standardized Character Data Protocol
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 text-balance">
            What is the Model Context Protocol?
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed text-balance">
            MCP is an open standard that enables AI applications to access and share structured character data in a
            consistent, portable format across different platforms and tools.
          </p>
        </div>

        {/* Key Concepts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Structured Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-center">
                Character information is organized in a standardized schema that AI systems can easily understand and
                process.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shuffle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Interoperability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-center">
                Your character data works seamlessly across different AI tools, platforms, and applications without
                conversion.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Data Ownership</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-center">
                You maintain full control and ownership of your character data while enabling AI applications to access
                it.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AIM Integration */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 mb-16">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl text-indigo-900">How AIM Powers MCP</CardTitle>
            </div>
            <p className="text-indigo-700">
              AIM (Artificial Intelligence Model) profiles serve as the structured data layer that MCP uses to enable
              consistent AI interactions with your Ora characters.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Character Consistency
                </h4>
                <p className="text-indigo-700 text-sm leading-relaxed">
                  AIM profiles ensure your Ora's personality, abilities, and visual traits remain consistent across all
                  AI-generated content, from artwork to interactive experiences.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Rich Context
                </h4>
                <p className="text-indigo-700 text-sm leading-relaxed">
                  Detailed backstories, relationships, and behavioral patterns provide AI systems with the context
                  needed to create authentic, character-appropriate outputs.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Creative Constraints
                </h4>
                <p className="text-indigo-700 text-sm leading-relaxed">
                  "Do not change" rules preserve canonical character elements while allowing creative freedom in other
                  areas, maintaining character integrity.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Extensible Framework
                </h4>
                <p className="text-indigo-700 text-sm leading-relaxed">
                  The AIM schema can be extended with new fields and capabilities as AI technology evolves,
                  future-proofing your character investments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Portability Matters */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-slate-900 text-center mb-8">Why Portability Matters</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Platform Independence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  Your Ora characters aren't locked into a single platform or application. MCP enables seamless
                  migration between different AI tools and services.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Use the same character across multiple AI art generators
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Import/export character data without vendor lock-in
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Future-proof your character investments
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Code className="w-5 h-5 text-purple-600" />
                  Developer Ecosystem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">
                  MCP creates a standardized foundation that enables developers to build innovative applications without
                  reinventing character data management.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Faster development of character-aware AI tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Consistent API interfaces across applications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Community-driven improvements and extensions
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Benefits */}
        <Card className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white mb-16">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Technical Benefits</h3>
              <p className="text-white/90 max-w-2xl mx-auto">
                MCP provides concrete technical advantages for both users and developers working with AI character
                systems.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <h4 className="font-semibold mb-2">Performance</h4>
                <p className="text-white/80 text-sm">
                  Optimized data structures reduce processing time and improve AI response quality.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="font-semibold mb-2">Reliability</h4>
                <p className="text-white/80 text-sm">
                  Standardized schemas prevent data corruption and ensure consistent behavior.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-semibold mb-2">Scalability</h4>
                <p className="text-white/80 text-sm">
                  Designed to handle large character collections and complex relationship networks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-white text-center">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Experience MCP in Action</h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Try our interactive demo to see how MCP-powered AIM profiles enable consistent, high-quality AI generation
              across different creative modes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button className="bg-white text-indigo-600 hover:bg-white/90 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try the Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 bg-transparent"
                >
                  Connect Your Wallet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
