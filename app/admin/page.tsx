"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { ProjectWithImages } from "@/lib/types"
import { Plus, Trash2, GripVertical, Upload, X, ArrowLeft, ImageIcon, LogOut, Star, Settings, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface AnimationSettings {
  animation_style: "spring" | "smooth" | "snappy" | "gentle"
  animation_speed: "slow" | "normal" | "fast"
  enable_hover_effects: boolean
}

const defaultSettings: AnimationSettings = {
  animation_style: "spring",
  animation_speed: "normal",
  enable_hover_effects: true,
}

export default function AdminPage() {
  const [projects, setProjects] = useState<ProjectWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithImages | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(defaultSettings)
  const [savingSettings, setSavingSettings] = useState(false)
  const router = useRouter()

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "animation_settings")
      .single()

    if (data?.value) {
      setAnimationSettings(data.value as AnimationSettings)
    }
  }

  const saveAnimationSettings = async (newSettings: AnimationSettings) => {
    setSavingSettings(true)
    setAnimationSettings(newSettings)

    const { error } = await supabase
      .from("settings")
      .upsert({
        key: "animation_settings",
        value: newSettings,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" })

    if (error) {
      console.error("Error saving settings:", error)
    }

    setSavingSettings(false)
  }

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check-auth")
      const data = await response.json()

      if (!data.authenticated) {
        router.push("/admin/login")
        return
      }

      setIsAuthenticated(true)
      fetchProjects()
    } catch {
      router.push("/admin/login")
    }
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })

    if (projectsError) {
      console.error("Error fetching projects:", projectsError)
      setLoading(false)
      return
    }

    if (!projectsData || projectsData.length === 0) {
      setProjects([])
      setLoading(false)
      return
    }

    const { data: imagesData } = await supabase
      .from("project_images")
      .select("*")
      .in(
        "project_id",
        projectsData.map((p) => p.id),
      )
      .order("sort_order", { ascending: true })

    const projectsWithImages: ProjectWithImages[] = projectsData.map((project) => ({
      ...project,
      images: (imagesData || []).filter((img) => img.project_id === project.id),
    }))

    setProjects(projectsWithImages)
    setLoading(false)
  }, [supabase])

  const handleCreateProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        title: "New Project",
        description: "",
        sort_order: projects.length,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating project:", error)
      return
    }

    const newProject: ProjectWithImages = { ...data, images: [] }
    setProjects([...projects, newProject])
    setEditingProject(newProject)
    setIsCreating(true)
  }

  const handleUpdateProject = async (project: ProjectWithImages) => {
    const { error } = await supabase
      .from("projects")
      .update({
        title: project.title,
        description: project.description,
        thumbnail_url: project.thumbnail_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id)

    if (error) {
      console.error("Error updating project:", error)
      return
    }

    setProjects(projects.map((p) => (p.id === project.id ? project : p)))
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    const project = projects.find((p) => p.id === projectId)
    if (project) {
      for (const image of project.images) {
        const path = image.image_url.split("/project-images/")[1]
        if (path) {
          await supabase.storage.from("project-images").remove([path])
        }
      }
    }

    const { error } = await supabase.from("projects").delete().eq("id", projectId)

    if (error) {
      console.error("Error deleting project:", error)
      return
    }

    setProjects(projects.filter((p) => p.id !== projectId))
    if (editingProject?.id === projectId) {
      setEditingProject(null)
      setIsCreating(false)
    }
  }

  const handleImageUpload = async (projectId: string, files: FileList) => {
    setUploading(true)

    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `${projectId}/${Date.now()}-${i}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("project-images").upload(fileName, file)

      if (uploadError) {
        console.error("Error uploading image:", uploadError)
        continue
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("project-images").getPublicUrl(fileName)

      const { data: imageData, error: insertError } = await supabase
        .from("project_images")
        .insert({
          project_id: projectId,
          image_url: publicUrl,
          sort_order: project.images.length + i,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error inserting image record:", insertError)
        continue
      }

      project.images.push(imageData)
    }

    setProjects([...projects])
    if (editingProject?.id === projectId) {
      setEditingProject({ ...project })
    }

    setUploading(false)
  }

  const handleDeleteImage = async (projectId: string, imageId: string, imageUrl: string) => {
    const path = imageUrl.split("/project-images/")[1]
    if (path) {
      await supabase.storage.from("project-images").remove([path])
    }

    const { error } = await supabase.from("project_images").delete().eq("id", imageId)

    if (error) {
      console.error("Error deleting image:", error)
      return
    }

    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, images: p.images.filter((img) => img.id !== imageId) }
      }
      return p
    })

    setProjects(updatedProjects)
    if (editingProject?.id === projectId) {
      setEditingProject(updatedProjects.find((p) => p.id === projectId) || null)
    }
  }

  const handleSetThumbnail = async (project: ProjectWithImages, imageUrl: string) => {
    const updatedProject = { ...project, thumbnail_url: imageUrl }
    setEditingProject(updatedProject)
    await handleUpdateProject(updatedProject)
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Gallery</span>
            </Link>
          </div>
          <h1
            className="text-lg font-light tracking-widest uppercase"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Admin Panel
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-sm transition-colors text-sm ${
                showSettings 
                  ? "border-white bg-white text-black" 
                  : "border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-sm hover:bg-neutral-200 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-700 rounded-sm hover:border-neutral-500 transition-colors text-sm text-neutral-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Animation Settings Panel */}
        {showSettings && (
          <div className="mb-8 border border-neutral-800 rounded-sm p-6 bg-neutral-900/50">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="text-sm font-medium tracking-widest uppercase text-neutral-300">
                Animation Settings
              </h2>
              {savingSettings && <span className="text-xs text-neutral-500">Saving...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Animation Style */}
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Animation Style</label>
                <div className="space-y-2">
                  {(["spring", "smooth", "snappy", "gentle"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => saveAnimationSettings({ ...animationSettings, animation_style: style })}
                      className={`w-full px-4 py-2.5 text-left text-sm rounded-sm border transition-colors ${
                        animationSettings.animation_style === style
                          ? "border-white bg-white/10 text-white"
                          : "border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-white"
                      }`}
                    >
                      <span className="capitalize font-medium">{style}</span>
                      <span className="block text-xs mt-0.5 opacity-60">
                        {style === "spring" && "Bouncy, natural feel"}
                        {style === "smooth" && "Fluid, elegant motion"}
                        {style === "snappy" && "Quick, responsive"}
                        {style === "gentle" && "Slow, relaxed pace"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Speed */}
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Animation Speed</label>
                <div className="space-y-2">
                  {(["slow", "normal", "fast"] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => saveAnimationSettings({ ...animationSettings, animation_speed: speed })}
                      className={`w-full px-4 py-2.5 text-left text-sm rounded-sm border transition-colors ${
                        animationSettings.animation_speed === speed
                          ? "border-white bg-white/10 text-white"
                          : "border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-white"
                      }`}
                    >
                      <span className="capitalize font-medium">{speed}</span>
                      <span className="block text-xs mt-0.5 opacity-60">
                        {speed === "slow" && "0.8s transitions"}
                        {speed === "normal" && "0.5s transitions"}
                        {speed === "fast" && "0.3s transitions"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hover Effects Toggle */}
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Effects</label>
                <button
                  onClick={() => saveAnimationSettings({ ...animationSettings, enable_hover_effects: !animationSettings.enable_hover_effects })}
                  className={`w-full px-4 py-3 text-left text-sm rounded-sm border transition-colors ${
                    animationSettings.enable_hover_effects
                      ? "border-white bg-white/10 text-white"
                      : "border-neutral-700 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Hover Effects</span>
                    <div className={`w-10 h-5 rounded-full transition-colors ${animationSettings.enable_hover_effects ? "bg-green-500" : "bg-neutral-700"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transform transition-transform mt-0.5 ${animationSettings.enable_hover_effects ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                  <span className="block text-xs mt-1 opacity-60">
                    Enable card hover animations
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects list */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-6">
              Projects ({projects.length})
            </h2>

            {projects.length === 0 ? (
              <div className="border border-dashed border-neutral-700 rounded-sm p-12 text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                <p className="text-neutral-400 mb-4">No projects yet</p>
                <button
                  onClick={handleCreateProject}
                  className="text-sm text-white underline underline-offset-4 hover:no-underline"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setEditingProject(project)
                      setIsCreating(false)
                    }}
                    className={`group flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${
                      editingProject?.id === project.id
                        ? "border-white bg-neutral-900"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-neutral-600 cursor-grab" />

                    {project.thumbnail_url || project.images[0] ? (
                      <img
                        src={project.thumbnail_url || project.images[0]?.image_url || "/placeholder.svg"}
                        alt={project.title}
                        className="w-16 h-12 object-cover rounded-sm"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-neutral-800 rounded-sm flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-neutral-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{project.title}</h3>
                      <p className="text-sm text-neutral-400">{project.images.length} image(s)</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                      className="p-2 text-neutral-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor panel */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {editingProject ? (
              <div className="border border-neutral-800 rounded-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium tracking-widest uppercase text-neutral-400">
                    {isCreating ? "New Project" : "Edit Project"}
                  </h2>
                  <button
                    onClick={() => {
                      setEditingProject(null)
                      setIsCreating(false)
                    }}
                    className="p-1 text-neutral-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Title</label>
                    <input
                      type="text"
                      value={editingProject.title}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      onBlur={() => handleUpdateProject(editingProject)}
                      className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-sm focus:border-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Description</label>
                    <textarea
                      value={editingProject.description || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      onBlur={() => handleUpdateProject(editingProject)}
                      rows={4}
                      className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-sm focus:border-white focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      Images ({editingProject.images.length}) - Click star to set as thumbnail
                    </label>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {editingProject.images.map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                          <img
                            src={image.image_url || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover rounded-sm"
                          />
                          {editingProject.thumbnail_url === image.image_url && (
                            <div className="absolute top-1 left-1 p-1 bg-yellow-500 rounded-sm">
                              <Star className="w-3 h-3 text-black fill-black" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSetThumbnail(editingProject, image.image_url)}
                              className={`p-1.5 rounded-sm transition-colors ${
                                editingProject.thumbnail_url === image.image_url
                                  ? "bg-yellow-500 text-black"
                                  : "bg-black/70 hover:bg-yellow-500 hover:text-black"
                              }`}
                              title="Set as thumbnail"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(editingProject.id, image.id, image.image_url)}
                              className="p-1.5 bg-black/70 rounded-sm hover:bg-red-500 transition-colors"
                              title="Delete image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="flex flex-col items-center gap-2 p-6 border border-dashed border-neutral-700 rounded-sm cursor-pointer hover:border-neutral-500 transition-colors">
                      <Upload className="w-6 h-6 text-neutral-500" />
                      <span className="text-sm text-neutral-400">
                        {uploading ? "Uploading..." : "Click to upload images"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            handleImageUpload(editingProject.id, e.target.files)
                          }
                        }}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-neutral-700 rounded-sm p-12 text-center">
                <p className="text-neutral-400">Select a project to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
