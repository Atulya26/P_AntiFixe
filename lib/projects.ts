import { getSupabaseServerClient } from "./supabase/server"
import type { ProjectWithImages } from "./types"

// Fallback data for local development when Supabase is not configured
const fallbackProjects: ProjectWithImages[] = [
  {
    id: "1", title: "HR Dashboard", description: "Employee management system",
    thumbnail_url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop",
    sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "1a", project_id: "1", image_url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
      { id: "1b", project_id: "1", image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=900&fit=crop", sort_order: 1, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "2", title: "Fitness Tracker", description: "Workout monitoring app",
    thumbnail_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop",
    sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "2a", project_id: "2", image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
      { id: "2b", project_id: "2", image_url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&h=900&fit=crop", sort_order: 1, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "3", title: "Smart Car Dashboard", description: "EV control interface",
    thumbnail_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
    sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "3a", project_id: "3", image_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "4", title: "Calendar App", description: "Schedule management",
    thumbnail_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=600&fit=crop",
    sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "4a", project_id: "4", image_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "5", title: "E-commerce Platform", description: "Online shopping experience",
    thumbnail_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "5a", project_id: "5", image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "6", title: "Music Player", description: "Audio streaming interface",
    thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop",
    sort_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "6a", project_id: "6", image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "7", title: "Travel Booking", description: "Trip planning platform",
    thumbnail_url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
    sort_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "7a", project_id: "7", image_url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "8", title: "Finance Dashboard", description: "Investment tracking",
    thumbnail_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop",
    sort_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "8a", project_id: "8", image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "9", title: "Food Delivery", description: "Restaurant ordering app",
    thumbnail_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
    sort_order: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "9a", project_id: "9", image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "10", title: "Weather App", description: "Climate forecasting",
    thumbnail_url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&h=600&fit=crop",
    sort_order: 9, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "10a", project_id: "10", image_url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "11", title: "Social Network", description: "Community platform",
    thumbnail_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop",
    sort_order: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "11a", project_id: "11", image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "12", title: "Meditation App", description: "Mindfulness experience",
    thumbnail_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop",
    sort_order: 11, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "12a", project_id: "12", image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "13", title: "Task Manager", description: "Productivity tool",
    thumbnail_url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop",
    sort_order: 12, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "13a", project_id: "13", image_url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "14", title: "Portfolio Site", description: "Creative showcase",
    thumbnail_url: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&h=600&fit=crop",
    sort_order: 13, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "14a", project_id: "14", image_url: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "15", title: "News Reader", description: "Article aggregator",
    thumbnail_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop",
    sort_order: 14, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "15a", project_id: "15", image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "16", title: "Real Estate", description: "Property listings",
    thumbnail_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    sort_order: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "16a", project_id: "16", image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "17", title: "Gaming Platform", description: "Game discovery hub",
    thumbnail_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=600&fit=crop",
    sort_order: 16, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "17a", project_id: "17", image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "18", title: "Learning Platform", description: "Online education",
    thumbnail_url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=600&fit=crop",
    sort_order: 17, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "18a", project_id: "18", image_url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "19", title: "Crypto Wallet", description: "Digital asset manager",
    thumbnail_url: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
    sort_order: 18, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "19a", project_id: "19", image_url: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
  {
    id: "20", title: "Smart Home", description: "IoT control center",
    thumbnail_url: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop",
    sort_order: 19, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    images: [
      { id: "20a", project_id: "20", image_url: "https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&h=900&fit=crop", sort_order: 0, created_at: new Date().toISOString() },
    ],
  },
]

export async function getProjects(): Promise<ProjectWithImages[]> {
  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("Supabase not configured, using fallback data for local development")
    return fallbackProjects
  }

  try {
    const supabase = await getSupabaseServerClient()

    // If Supabase client is null (not configured), use fallback
    if (!supabase) {
      console.log("Supabase client not available, using fallback data")
      return fallbackProjects
    }

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })

    if (projectsError) {
      console.error("Error fetching projects:", projectsError)
      return fallbackProjects
    }

    if (!projects || projects.length === 0) {
      return fallbackProjects
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
  } catch (error) {
    console.error("Supabase connection error, using fallback:", error)
    return fallbackProjects
  }
}
