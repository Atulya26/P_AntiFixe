export interface Project {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProjectImage {
  id: string
  project_id: string
  image_url: string
  sort_order: number
  created_at: string
}

export interface ProjectWithImages extends Project {
  images: ProjectImage[]
}
