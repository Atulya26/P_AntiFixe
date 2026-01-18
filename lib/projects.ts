import { getSupabaseServerClient } from "./supabase/server"
import type { ProjectWithImages } from "./types"

export async function getProjects(): Promise<ProjectWithImages[]> {
  const supabase = await getSupabaseServerClient()

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })

  if (projectsError) {
    console.error("Error fetching projects:", projectsError)
    return []
  }

  if (!projects || projects.length === 0) {
    return []
  }

  const { data: images, error: imagesError } = await supabase
    .from("project_images")
    .select("*")
    .in(
      "project_id",
      projects.map((p) => p.id),
    )
    .order("sort_order", { ascending: true })

  if (imagesError) {
    console.error("Error fetching images:", imagesError)
  }

  const projectsWithImages: ProjectWithImages[] = projects.map((project) => ({
    ...project,
    images: (images || []).filter((img) => img.project_id === project.id),
  }))

  return projectsWithImages
}
