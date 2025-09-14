import { notFound } from "next/navigation"
import { MockMCPService } from "@/lib/demo/mcp"
import { getDemoOraIds } from "@/lib/demo/aim-seeds"
import { CustomPrompt } from "@/components/demo/CustomPrompt"

interface CustomPageProps {
  params: {
    oraId: string
  }
}

export default async function CustomPage({ params }: CustomPageProps) {
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

    return <CustomPrompt oraId={oraId} aim={aim} />
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
