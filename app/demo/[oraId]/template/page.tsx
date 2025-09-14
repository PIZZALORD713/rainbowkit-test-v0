import { notFound } from "next/navigation"
import { MockMCPService } from "@/lib/demo/mcp"
import { getDemoOraIds } from "@/lib/demo/aim-seeds"
import { TemplateGeneration } from "@/components/demo/TemplateGeneration"

interface TemplatePageProps {
  params: {
    oraId: string
  }
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const oraId = Number.parseInt(params.oraId)

  // Check if this is a valid demo Ora
  const validOraIds = getDemoOraIds()
  if (!validOraIds.includes(oraId)) {
    notFound()
  }

  try {
    const aim = await MockMCPService.getAIM(oraId)
    if (!aim) {
      notFound()
    }

    return <TemplateGeneration oraId={oraId} aim={aim} />
  } catch (error) {
    console.error("Failed to load AIM:", error)
    notFound()
  }
}

export async function generateStaticParams() {
  const oraIds = getDemoOraIds()
  return oraIds.map((oraId) => ({
    oraId: oraId.toString(),
  }))
}
