import { SpiralGallery } from "@/components/spiral-gallery"
import { getProjects } from "@/lib/projects"

export const dynamic = "force-dynamic"

export default async function Page() {
  const projects = await getProjects()
  return <SpiralGallery projects={projects} />
}
