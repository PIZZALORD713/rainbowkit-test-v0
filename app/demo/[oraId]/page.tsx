import { notFound } from "next/navigation"
import { MockMCPService } from "@/lib/demo/mcp"
import { getDemoOraIds } from "@/lib/demo/aim-seeds"
import { AimPreview } from "@/components/demo/AimPreview"

interface DemoOraPageProps {
  params: {
    oraId: string
  }
}

export default async function DemoOraPage({ params }: DemoOraPageProps) {
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

    return <AimPreview oraId={oraId} aim={aim} />
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
