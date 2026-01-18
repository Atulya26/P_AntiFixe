"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface AnimationSettings {
  animation_style: "spring" | "smooth" | "snappy" | "gentle"
  animation_speed: "slow" | "normal" | "fast"
  enable_hover_effects: boolean
}

const defaultAnimationSettings: AnimationSettings = {
  animation_style: "spring",
  animation_speed: "normal",
  enable_hover_effects: true,
}

// Animation easing functions based on style
const getEasing = (style: AnimationSettings["animation_style"]) => {
  switch (style) {
    case "spring": return "cubic-bezier(0.34, 1.56, 0.64, 1)"
    case "smooth": return "cubic-bezier(0.25, 0.8, 0.25, 1)"
    case "snappy": return "cubic-bezier(0.2, 0, 0, 1)"
    case "gentle": return "cubic-bezier(0.4, 0, 0.2, 1)"
    default: return "cubic-bezier(0.34, 1.56, 0.64, 1)"
  }
}

const getDuration = (speed: AnimationSettings["animation_speed"]) => {
  switch (speed) {
    case "slow": return { enter: 0.8, exit: 0.6, transition: 0.6 }
    case "normal": return { enter: 0.6, exit: 0.45, transition: 0.5 }
    case "fast": return { enter: 0.4, exit: 0.3, transition: 0.3 }
    default: return { enter: 0.6, exit: 0.45, transition: 0.5 }
  }
}

interface ImageDetailViewProps {
  imageUrl: string
  images?: string[]
  title?: string
  description?: string
  index: number
  initialRect: DOMRect
  onClose: () => void
}

export function ImageDetailView({
  imageUrl,
  images = [imageUrl],
  title,
  description,
  index,
  initialRect,
  onClose,
}: ImageDetailViewProps) {
  const [phase, setPhase] = useState<"entering" | "active" | "scrollable" | "exiting">("entering")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [previousImageIndex, setPreviousImageIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [isLightImage, setIsLightImage] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(defaultAnimationSettings)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollAccumulatorRef = useRef(0)
  const scrollCooldownRef = useRef(false)
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0 })
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch animation settings
  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "animation_settings")
        .single()

      if (data?.value) {
        setAnimationSettings(data.value as AnimationSettings)
      }
    }
    fetchSettings()
  }, [])

  // Get dynamic animation values
  const easing = getEasing(animationSettings.animation_style)
  const durations = getDuration(animationSettings.animation_speed)

  const allImages = images.length > 0 ? images : [imageUrl]
  const currentImage = allImages[currentImageIndex] || imageUrl

  // Smooth image transition handler
  const changeImage = useCallback((newIndex: number) => {
    if (newIndex === currentImageIndex || isTransitioning) return

    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    setPreviousImageIndex(currentImageIndex)
    setIsTransitioning(true)
    setCurrentImageIndex(newIndex)

    // Clear transition state after animation completes
    transitionTimeoutRef.current = setTimeout(() => {
      setPreviousImageIndex(null)
      setIsTransitioning(false)
    }, Math.round(durations.transition * 1000) + 50)
  }, [currentImageIndex, isTransitioning, durations.transition])

  const handleClose = useCallback(() => {
    setPhase("exiting")
    // Use dynamic exit duration
    const exitTime = Math.round(durations.exit * 1000)
    setTimeout(onClose, exitTime)
  }, [onClose, durations.exit])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const analyzeImageBrightness = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const sampleWidth = 100
    const sampleHeight = 100
    canvas.width = sampleWidth
    canvas.height = sampleHeight

    try {
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight * 0.2, 0, 0, sampleWidth, sampleHeight)
      const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
      const data = imageData.data

      let totalBrightness = 0
      const pixelCount = data.length / 4

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
        totalBrightness += brightness
      }

      const avgBrightness = totalBrightness / pixelCount
      setIsLightImage(avgBrightness > 0.5)
    } catch {
      setIsLightImage(false)
    }
  }, [])

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })
      setImageLoaded(true)
      analyzeImageBrightness(imageRef.current)
    }
  }, [analyzeImageBrightness])

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("active"), 50)
    const scrollableTimer = setTimeout(() => setPhase("scrollable"), 700)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(scrollableTimer)
    }
  }, [])

  // Dynamic easing based on settings
  const springEasing = easing
  const exitSpringEasing = easing
  const smoothSpringEasing = getEasing("smooth")

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (scrollCooldownRef.current) return

      const delta = e.deltaY
      const threshold = 120

      scrollAccumulatorRef.current += delta

      if (Math.abs(scrollAccumulatorRef.current) > threshold) {
        const direction = scrollAccumulatorRef.current > 0 ? 1 : -1
        scrollAccumulatorRef.current = 0

        scrollCooldownRef.current = true
        setTimeout(() => {
          scrollCooldownRef.current = false
        }, 400)

        if (!showDetails && direction > 0) {
          // Scroll down - show details and go to next images
          setShowDetails(true)
        } else if (!showDetails && direction < 0) {
          // Scroll up on first image without details - close and go back to spiral
          handleClose()
        } else if (showDetails) {
          if (direction > 0) {
            // Scroll down - go to next image
            if (currentImageIndex < allImages.length - 1) {
              changeImage(currentImageIndex + 1)
            }
          } else {
            // Scroll up - go to previous image or hide details or close
            if (currentImageIndex > 0) {
              changeImage(currentImageIndex - 1)
            } else {
              // At first image, hide details first
              setShowDetails(false)
            }
          }
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel)
      }
    }
  }, [phase, showDetails, currentImageIndex, allImages.length])

  useEffect(() => {
    if (phase !== "scrollable" || !isMobile) return

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      touchRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTime: Date.now(),
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchRef.current.startX
      const deltaY = e.changedTouches[0].clientY - touchRef.current.startY
      const deltaTime = Date.now() - touchRef.current.startTime

      // Horizontal swipe - navigate images
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 500) {
        if (deltaX < 0 && currentImageIndex < allImages.length - 1) {
          changeImage(currentImageIndex + 1)
          if (!showDetails) setShowDetails(true)
        } else if (deltaX > 0 && currentImageIndex > 0) {
          changeImage(currentImageIndex - 1)
        }
      }

      // Vertical swipe up - show details
      if (deltaY < -50 && Math.abs(deltaY) > Math.abs(deltaX) && deltaTime < 500) {
        if (!showDetails) setShowDetails(true)
      }

      // Vertical swipe down - hide details or close
      if (deltaY > 50 && Math.abs(deltaY) > Math.abs(deltaX) && deltaTime < 500) {
        if (showDetails) {
          if (currentImageIndex > 0) {
            changeImage(currentImageIndex - 1)
          } else {
            setShowDetails(false)
          }
        } else {
          // Swipe down without details showing - close and go back to spiral
          handleClose()
        }
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [phase, isMobile, showDetails, currentImageIndex, allImages.length, handleClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
      if (e.key === "ArrowRight" && currentImageIndex < allImages.length - 1) {
        changeImage(currentImageIndex + 1)
        if (!showDetails) setShowDetails(true)
      }
      if (e.key === "ArrowLeft" && currentImageIndex > 0) {
        changeImage(currentImageIndex - 1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentImageIndex, allImages.length, showDetails, changeImage, handleClose])

  const getImageStyle = () => {
    if (phase === "entering") {
      return {
        position: "fixed" as const,
        top: `${initialRect.top}px`,
        left: `${initialRect.left}px`,
        width: `${initialRect.width}px`,
        height: `${initialRect.height}px`,
        borderRadius: "2px",
        objectFit: "cover" as const,
        objectPosition: "center center",
        transition: "none",
      }
    }

    if (phase === "active" || phase === "scrollable") {
      return {
        position: "fixed" as const,
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        borderRadius: "0",
        objectFit: "cover" as const,
        objectPosition: "center center",
        transition: phase === "active" ? `all ${durations.enter}s ${easing}` : "none",
      }
    }

    if (phase === "exiting") {
      return {
        position: "fixed" as const,
        top: `${initialRect.top}px`,
        left: `${initialRect.left}px`,
        width: `${initialRect.width}px`,
        height: `${initialRect.height}px`,
        borderRadius: "2px",
        objectFit: "cover" as const,
        objectPosition: "center center",
        transition: `all ${durations.exit}s ${easing}`,
      }
    }

    return {
      position: "fixed" as const,
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      objectFit: "cover" as const,
      objectPosition: "center center",
    }
  }

  const displayTitle = title || `Project ${index.toString().padStart(2, "0")}`
  const displayDescription =
    description ||
    "Exploration of form and texture through the lens of modern design. This piece represents the convergence of traditional craftsmanship and contemporary aesthetics."

  // Inverse color effect - text adapts to background brightness
  const textColorClass = isLightImage ? "text-black" : "text-white"
  const textMutedClass = isLightImage ? "text-black/60" : "text-white/60"
  const bgColorClass = isLightImage ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20"
  const borderColorClass = isLightImage ? "border-black/10" : "border-white/10"

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1000] overflow-hidden"
      style={{
        background: phase === "entering" || phase === "exiting" ? "transparent" : "black",
        transition: "background 0.4s ease",
      }}
    >
      <canvas ref={canvasRef} className="hidden" />

      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: phase === "entering" || phase === "exiting" ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      />

      {allImages.map((img, idx) => {
        const isCurrent = idx === currentImageIndex
        const isPrevious = idx === previousImageIndex

        // Only render current and previous images during transition, otherwise only current
        const shouldRender = isCurrent || (isPrevious && isTransitioning)
        if (!shouldRender && phase !== "entering" && phase !== "exiting") {
          return null
        }

        // During exit, only show the first image (the one that expands from card)
        if (phase === "exiting" && idx !== 0) {
          return null
        }

        // Simple opacity: current=1, previous during transition=0
        const opacity = isCurrent ? 1 : 0

        // Z-index: current always on top
        const zIndex = phase === "exiting" ? 10 : (isCurrent ? 10 : 5)

        return (
          <img
            key={idx}
            ref={isCurrent ? imageRef : undefined}
            src={img || "/placeholder.svg"}
            alt={`${displayTitle} - Image ${idx + 1}`}
            crossOrigin="anonymous"
            onLoad={isCurrent ? handleImageLoad : undefined}
            style={{
              ...getImageStyle(),
              opacity,
              zIndex,
              willChange: "opacity, transform",
              transition:
                phase === "active"
                  ? `all ${durations.enter}s ${easing}`
                  : phase === "exiting"
                    ? `all ${durations.exit}s ${easing}`
                    : `opacity ${durations.transition * 0.6}s ${smoothSpringEasing}`,
            }}
          />
        )
      })}

      <button
        onClick={handleClose}
        className={`fixed top-4 right-4 md:top-6 md:right-6 z-[1100] flex items-center gap-2 md:gap-2.5 px-4 py-2.5 md:px-5 md:py-3 rounded-full backdrop-blur-md ${bgColorClass} ${textColorClass} border ${borderColorClass} font-mono`}
        style={{
          fontSize: isMobile ? "0.7rem" : "0.75rem",
          letterSpacing: "0.15em",
          opacity: phase === "entering" ? 0 : 1,
          transform: phase === "entering" ? "translateY(-20px) scale(0.95)" : "translateY(0) scale(1)",
          transition: `all ${durations.transition}s ${easing} 0.15s, background 0.2s ease`,
          minHeight: isMobile ? "44px" : "auto",
        }}
      >
        <X className="w-4 h-4" strokeWidth={1.5} />
        <span className="uppercase font-medium hidden md:inline">Close</span>
      </button>

      {allImages.length > 1 && phase === "scrollable" && (
        <>
          <button
            onClick={() => {
              if (currentImageIndex > 0) changeImage(currentImageIndex - 1)
            }}
            className={`fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-[1100] p-3 md:p-3 rounded-full backdrop-blur-md ${bgColorClass} ${textColorClass} border ${borderColorClass}`}
            style={{
              opacity: currentImageIndex > 0 ? 1 : 0.3,
              pointerEvents: currentImageIndex > 0 ? "auto" : "none",
              minWidth: isMobile ? "44px" : "auto",
              minHeight: isMobile ? "44px" : "auto",
              transition: `all ${durations.transition}s ${easing}`,
            }}
          >
            <ChevronLeft className="w-5 h-5 md:w-5 md:h-5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => {
              if (currentImageIndex < allImages.length - 1) changeImage(currentImageIndex + 1)
            }}
            className={`fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-[1100] p-3 md:p-3 rounded-full backdrop-blur-md ${bgColorClass} ${textColorClass} border ${borderColorClass}`}
            style={{
              opacity: currentImageIndex < allImages.length - 1 ? 1 : 0.3,
              pointerEvents: currentImageIndex < allImages.length - 1 ? "auto" : "none",
              minWidth: isMobile ? "44px" : "auto",
              minHeight: isMobile ? "44px" : "auto",
              transition: `all ${durations.transition}s ${easing}`,
            }}
          >
            <ChevronRight className="w-5 h-5 md:w-5 md:h-5" strokeWidth={1.5} />
          </button>
        </>
      )}

      {phase === "scrollable" && !showDetails && (
        <div
          className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full backdrop-blur-md ${bgColorClass} ${textColorClass} font-mono`}
          style={{
            fontSize: isMobile ? "0.6rem" : "0.65rem",
            letterSpacing: "0.15em",
            transition: "opacity 0.4s ease",
          }}
        >
          <span className="uppercase">{isMobile ? "Swipe up for details" : "Scroll for details"}</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ animation: "float 2s ease-in-out infinite" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 p-6 md:p-12 z-[1050] ${textColorClass}`}
        style={{
          background: isLightImage
            ? "linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          opacity: showDetails ? 1 : 0,
          transform: showDetails ? "translateY(0)" : "translateY(30px)",
          transition: `all ${durations.transition}s ${easing}`,
          pointerEvents: showDetails ? "auto" : "none",
        }}
      >
        <div className="max-w-3xl">
          <h1 className="text-lg md:text-2xl font-light tracking-wide mb-3 md:mb-4 opacity-90 font-mono">
            {displayTitle}
          </h1>
          <p className={`text-xs md:text-base leading-relaxed max-w-2xl mb-3 md:mb-4 font-sans ${textMutedClass}`}>{displayDescription}</p>

          {allImages.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-50 uppercase font-mono tracking-[0.1em]">
                {currentImageIndex + 1} / {allImages.length}
              </span>
              <div className="flex gap-1.5">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => changeImage(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentImageIndex
                      ? isLightImage
                        ? "bg-black"
                        : "bg-white"
                      : isLightImage
                        ? "bg-black/30"
                        : "bg-white/30"
                      }`}
                    style={{
                      minWidth: isMobile ? "10px" : "8px",
                      minHeight: isMobile ? "10px" : "8px",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(4px);
          }
        }
      `}</style>
    </div>
  )
}
