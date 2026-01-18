"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { ImageDetailView } from "./image-detail-view"
import type { ProjectWithImages } from "@/lib/types"
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
    case "slow": return 0.8
    case "normal": return 0.5
    case "fast": return 0.3
    default: return 0.5
  }
}

const getConfig = (isMobile: boolean) => ({
  cardCount: 20,
  spiral: {
    radiusX: isMobile ? 180 : 420,
    radiusY: isMobile ? 140 : 280,
    centerX: isMobile ? 0 : -160,
    centerY: isMobile ? 0 : 150,
    angleStep: 0.35,
    depthScale: isMobile ? 400 : 800,
  },
  physics: {
    enabled: true,
    momentum: 0.98, // Increased from 0.96 for heavier feel
    maxVelocity: 12, // Reduced from 15 for more controlled movement
    bounceStrength: 0.3,
    tiltStrength: 0.1,
  },
  sineWave: {
    enabled: true,
    amplitudeX: isMobile ? 25 : 50,
    amplitudeY: isMobile ? 18 : 35,
    frequency: 0.5,
    velocityMultiplier: 10, // Reduced from 12 for subtler wave
    decay: 0.96, // Increased from 0.94 for longer wave
  },
  scrollSensitivity: 0.00018, // Reduced from 0.0003 for heavier feel
  touchSensitivity: isMobile ? 0.002 : 0.0006, // Reduced for heavier feel
  smoothing: 0.018, // Reduced from 0.035 for slower catchup (heavier momentum)
  focalEffect: {
    enabled: true,
    scaleBoost: 0.18,
    zPush: 80,
  },
})

const fallbackImageUrls = [
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=2400&h=3000&fit=crop&q=100",
  "https://images.unsplash.com/photo-1515886657613-e382a71b716b?w=2400&h=3000&fit=crop&q=100",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2400&h=3000&fit=crop&q=100",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=2400&h=3000&fit=crop&q=100",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=2400&h=3000&fit=crop&q=100",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=2400&h=3000&fit=crop&q=100",
]

interface CardData {
  index: number
  imageUrl: string
  title: string
  description: string
  images: string[]
  x: number
  y: number
  z: number
  scale: number
  opacity: number
  zIndex: number
  rotateY: number
}

interface SpiralGalleryProps {
  projects: ProjectWithImages[]
}

export function SpiralGallery({ projects }: SpiralGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cards, setCards] = useState<CardData[]>([])
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [selectedCard, setSelectedCard] = useState<{
    index: number
    imageUrl: string
    images: string[]
    title: string
    description: string
    rect: DOMRect
  } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [tappedCard, setTappedCard] = useState<number | null>(null)
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(defaultAnimationSettings)

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

  const stateRef = useRef({
    rotationAngle: 0,
    targetRotation: 0,
    velocity: 0,
    sineWave: { intensity: 0, phase: 0 },
    touch: { startY: 0, lastY: 0, isDragging: false, startTime: 0 },
    lastTime: 0,
    scrollAccumulator: 0,
  })

  const rafRef = useRef<number>()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const CONFIG = getConfig(isMobile)

  useEffect(() => {
    let cardData: CardData[]

    if (projects && projects.length > 0) {
      cardData = projects.map((project, i) => ({
        index: i,
        imageUrl:
          project.thumbnail_url || project.images[0]?.image_url || fallbackImageUrls[i % fallbackImageUrls.length],
        title: project.title,
        description: project.description || "",
        images: project.images.map((img) => img.image_url),
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        opacity: 1,
        zIndex: 0,
        rotateY: 0,
      }))
    } else {
      cardData = Array.from({ length: CONFIG.cardCount }, (_, i) => ({
        index: i,
        imageUrl: fallbackImageUrls[i % fallbackImageUrls.length],
        title: `Project ${i + 1}`,
        description: "Add projects from the admin panel",
        images: [fallbackImageUrls[i % fallbackImageUrls.length]],
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        opacity: 1,
        zIndex: 0,
        rotateY: 0,
      }))
    }

    setCards(cardData)
  }, [projects, CONFIG.cardCount])

  const updateCardPositions = useCallback(() => {
    const config = getConfig(isMobile)
    const { spiral, focalEffect, sineWave: sineWaveConfig } = config
    const { radiusX, radiusY, centerX, centerY, angleStep, depthScale } = spiral
    const state = stateRef.current

    const spiralCenterX =
      typeof window !== "undefined" ? (isMobile ? window.innerWidth * 0.5 : window.innerWidth * 0.375) : 500
    const viewportCenterY = typeof window !== "undefined" ? window.innerHeight / 2 : 400

    const waveIntensity = state.sineWave.intensity
    const wavePhase = state.sineWave.phase

    setCards((prevCards) =>
      prevCards.map((card, index) => {
        const baseAngle = index * angleStep
        const angle = baseAngle - state.rotationAngle

        let x = spiralCenterX + centerX + radiusX * Math.cos(angle)
        const ellipseY = radiusY * Math.sin(angle)
        let y = viewportCenterY + centerY + ellipseY * 0.6

        if (sineWaveConfig.enabled && waveIntensity > 0.005) {
          const cardPhase = index * sineWaveConfig.frequency + wavePhase
          const sineX = Math.sin(cardPhase) * sineWaveConfig.amplitudeX * waveIntensity
          const sineY = Math.cos(cardPhase * 1.3) * sineWaveConfig.amplitudeY * waveIntensity
          const depthInfluence = (1 - Math.sin(angle)) / 2
          x += sineX * (0.5 + depthInfluence * 0.5)
          y += sineY * (0.5 + depthInfluence * 0.5)
        }

        const z = depthScale * Math.sin(angle)
        const depthFactor = (1 - Math.sin(angle)) / 2
        let scale = isMobile ? 0.5 + depthFactor * 0.5 : 0.35 + depthFactor * 0.65

        if (focalEffect.enabled) {
          const frontness = Math.max(0, -Math.sin(angle))
          const focalBoost = frontness * frontness
          scale += focalEffect.scaleBoost * focalBoost
        }

        const opacity = 0.85 + depthFactor * 0.15
        const zIndex = Math.round(1000 - z)
        const rotateY = Math.cos(angle) * 8

        return { ...card, x, y, z, scale, opacity, zIndex, rotateY }
      }),
    )
  }, [isMobile])

  const animate = useCallback(
    (currentTime: number) => {
      const config = getConfig(isMobile)
      const state = stateRef.current
      const deltaTime = state.lastTime ? Math.min((currentTime - state.lastTime) / 16.67, 2) : 1
      state.lastTime = currentTime

      const smoothingPower = Math.pow(1 - config.smoothing, deltaTime)
      const diff = state.targetRotation - state.rotationAngle

      state.rotationAngle += diff * (1 - smoothingPower)
      state.velocity = (diff * (1 - smoothingPower)) / deltaTime

      const maxVel = config.physics.maxVelocity * 0.01
      state.velocity = Math.max(-maxVel, Math.min(maxVel, state.velocity))

      if (config.sineWave.enabled) {
        const velocityMagnitude = Math.abs(state.velocity)
        const targetIntensity = Math.min(velocityMagnitude * config.sineWave.velocityMultiplier, 1)
        const decayPower = Math.pow(config.sineWave.decay, deltaTime)
        state.sineWave.intensity = state.sineWave.intensity * decayPower + targetIntensity * (1 - decayPower) * 0.3
        state.sineWave.phase += state.velocity * 1.5 * deltaTime
      }

      updateCardPositions()
      rafRef.current = requestAnimationFrame(animate)
    },
    [updateCardPositions, isMobile],
  )

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [animate])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const config = getConfig(isMobile)

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const normalizedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 60)
      const delta = normalizedDelta * config.scrollSensitivity
      stateRef.current.targetRotation += delta
    }

    const handleTouchStart = (e: TouchEvent) => {
      stateRef.current.touch.startY = e.touches[0].clientY
      stateRef.current.touch.lastY = stateRef.current.touch.startY
      stateRef.current.touch.isDragging = true
      stateRef.current.touch.startTime = Date.now()
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.touch.isDragging) return
      e.preventDefault()
      const currentY = e.touches[0].clientY
      const deltaY = (stateRef.current.touch.lastY - currentY) * config.touchSensitivity
      stateRef.current.targetRotation += deltaY
      stateRef.current.touch.lastY = currentY
    }

    const handleTouchEnd = () => {
      stateRef.current.touch.isDragging = false
    }

    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.touch.startY = e.clientY
      stateRef.current.touch.lastY = stateRef.current.touch.startY
      stateRef.current.touch.isDragging = true
      container.style.cursor = "grabbing"
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      if (!stateRef.current.touch.isDragging) return
      const currentY = e.clientY
      const deltaY = (stateRef.current.touch.lastY - currentY) * config.touchSensitivity
      stateRef.current.targetRotation += deltaY
      stateRef.current.touch.lastY = currentY
    }

    const handleMouseUp = () => {
      stateRef.current.touch.isDragging = false
      container.style.cursor = "grab"
    }

    const handleKeyboard = (e: KeyboardEvent) => {
      const rotateAmount = 0.25
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        stateRef.current.targetRotation += rotateAmount
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault()
        stateRef.current.targetRotation -= rotateAmount
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false })
    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })
    container.addEventListener("mousedown", handleMouseDown)
    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseup", handleMouseUp)
    container.addEventListener("mouseleave", handleMouseUp)
    document.addEventListener("keydown", handleKeyboard)

    return () => {
      container.removeEventListener("wheel", handleWheel)
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
      container.removeEventListener("mousedown", handleMouseDown)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseup", handleMouseUp)
      container.removeEventListener("mouseleave", handleMouseUp)
      document.removeEventListener("keydown", handleKeyboard)
    }
  }, [isMobile])

  const handleCardClick = (card: CardData, e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setSelectedCard({
      index: card.index,
      imageUrl: card.imageUrl,
      images: card.images,
      title: card.title,
      description: card.description,
      rect,
    })
  }

  const handleCardTap = (card: CardData, e: React.TouchEvent<HTMLDivElement>) => {
    const touchDuration = Date.now() - stateRef.current.touch.startTime
    const touchDistance = Math.abs(e.changedTouches[0].clientY - stateRef.current.touch.startY)

    // Only handle as tap if it was quick and didn't move much
    if (touchDuration < 300 && touchDistance < 10) {
      if (tappedCard === card.index) {
        // Second tap - open detail view
        handleCardClick(card, e)
        setTappedCard(null)
      } else {
        // First tap - show info
        setTappedCard(card.index)
      }
    }
  }

  return (
    <>
      <main
        ref={containerRef}
        className="relative w-screen h-screen bg-black overflow-hidden touch-none cursor-grab select-none font-sans"
      >
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 40% 50%, rgba(80, 100, 200, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 80% 80%, rgba(60, 80, 160, 0.05) 0%, transparent 40%)
            `,
          }}
        />

        <div className="absolute inset-0 pointer-events-none z-[100]">
          <div className="absolute top-4 left-4 md:top-8 md:left-8 text-white">
            <div className="text-base md:text-[1.4rem] font-extralight tracking-[0.25em] leading-tight uppercase opacity-90 font-sans">
              Atulya
            </div>
          </div>
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0 text-[0.6rem] md:text-[0.7rem] font-normal tracking-[0.2em] uppercase text-white/50 font-mono"
            style={{
              animation: "pulse-subtle 3s ease-in-out infinite",
            }}
          >
            {isMobile ? "SWIPE TO SURF" : "SCROLL TO SURF"}
          </div>
        </div>

        <div
          className="absolute w-full md:w-3/4 h-full left-0"
          style={{
            perspective: isMobile ? "1200px" : "1800px",
            perspectiveOrigin: "50% 50%",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="absolute top-0 left-0 w-0 h-0" style={{ transformStyle: "preserve-3d" }}>
            {cards.map((card) => (
              <div
                key={card.index}
                className="absolute cursor-pointer"
                style={{
                  width: isMobile ? "200px" : "360px",
                  height: isMobile ? "260px" : "300px",
                  marginLeft: isMobile ? "-100px" : "-180px",
                  marginTop: isMobile ? "-130px" : "-150px",
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                  transform: `translate3d(${card.x}px, ${card.y}px, ${-card.z}px) scale(${card.scale}) rotateY(${card.rotateY}deg)`,
                  opacity: card.opacity,
                  zIndex: card.zIndex,
                  backfaceVisibility: "hidden",
                }}
                onClick={(e) => !isMobile && handleCardClick(card, e)}
                onTouchEnd={(e) => isMobile && handleCardTap(card, e)}
                onMouseEnter={() => !isMobile && setHoveredCard(card.index)}
                onMouseLeave={() => !isMobile && setHoveredCard(null)}
              >
                <div
                  className="relative w-full h-full rounded-sm overflow-hidden"
                  style={{
                    transformStyle: "preserve-3d",
                    transition: "box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    boxShadow:
                      hoveredCard === card.index || tappedCard === card.index
                        ? "0 40px 80px -20px rgba(0,0,0,0.9), 0 20px 40px -15px rgba(0,0,0,0.8), 0 0 60px rgba(80, 100, 200, 0.08)"
                        : "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 10px 20px -5px rgba(0,0,0,0.5)",
                  }}
                >
                  <img
                    src={card.imageUrl || "/placeholder.svg"}
                    alt={card.title}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: "center 20%",
                      transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.4s ease",
                      filter:
                        hoveredCard === card.index || tappedCard === card.index
                          ? "brightness(1.08) contrast(1.05)"
                          : "brightness(0.92) contrast(1.02)",
                      transform: hoveredCard === card.index || tappedCard === card.index ? "scale(1.03)" : "scale(1)",
                    }}
                  />
                  <span
                    className="absolute bottom-2 left-2 md:bottom-4 md:left-4 font-medium text-white/90 z-[5] font-mono"
                    style={{
                      fontSize: isMobile ? "0.65rem" : "0.75rem",
                      letterSpacing: "0.05em",
                      textShadow: "0 2px 12px rgba(0, 0, 0, 0.9)",
                    }}
                  >
                    {card.index.toString().padStart(2, "0")}
                  </span>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 40%),
                        linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, transparent 20%)
                      `,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isMobile && (
          <div
            className="fixed top-1/2 right-[5%] w-1/4 min-h-[300px] -translate-y-1/2 flex items-center justify-center pointer-events-none z-50"
            style={{
              opacity: hoveredCard !== null ? 1 : 0,
              transition: "opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {hoveredCard !== null && cards[hoveredCard] && (
              <div className="flex flex-col gap-8 p-8 w-full text-left">
                <div className="flex flex-col gap-2">
                  <span className="text-[0.6rem] font-normal tracking-[0.25em] uppercase text-white/40 font-sans">PROJECT</span>
                  <span className="text-white/80 font-mono text-[0.8rem] tracking-[0.12em]">
                    {cards[hoveredCard].title}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-white/50 font-mono text-[0.8rem] tracking-[0.12em]">
                    {cards[hoveredCard].description || `Project ${hoveredCard + 1}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {isMobile && tappedCard !== null && cards[tappedCard] && (
          <div
            className="fixed bottom-16 left-0 right-0 px-4 py-3 z-50 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
            }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[0.55rem] font-normal tracking-[0.25em] uppercase text-white/40 font-sans">PROJECT</span>
              <span className="text-white/90 text-sm font-mono tracking-[0.08em]">
                {cards[tappedCard].title}
              </span>
              <span className="text-white/50 text-xs mt-1 font-mono">
                Tap again to view
              </span>
            </div>
          </div>
        )}

        {/* Desktop tooltip - hidden on mobile */}
        {!isMobile && hoveredCard !== null && cards[hoveredCard] && (
          <div
            className="fixed flex-col gap-1 px-4 py-2.5 pointer-events-none z-[200] backdrop-blur-md rounded-sm hidden md:flex font-mono text-[0.65rem] tracking-[0.12em] text-white"
            style={{
              left: `${mousePos.x + 20}px`,
              top: `${mousePos.y + 20}px`,
              background: "rgba(0, 0, 0, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span className="opacity-80">{cards[hoveredCard].title}</span>
            <span className="opacity-50">{cards[hoveredCard].images.length} image(s)</span>
          </div>
        )}

        <style jsx global>{`
          @keyframes pulse-subtle {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 0.8;
            }
          }
        `}</style>
      </main>

      {selectedCard && (
        <ImageDetailView
          imageUrl={selectedCard.imageUrl}
          images={selectedCard.images}
          title={selectedCard.title}
          description={selectedCard.description}
          index={selectedCard.index}
          initialRect={selectedCard.rect}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  )
}
