"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  AnimatePresence,
} from "framer-motion"
import { Heart, X, Tag, Ruler, Sparkles, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Garment } from "@/lib/types"

interface SwipeCardProps {
  garment: Garment
  onSwipeLeft: () => void
  onSwipeRight: () => void
  isTop: boolean
  custom?: "left" | "right" | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SwipeCard({ garment, onSwipeLeft, onSwipeRight, isTop, custom }: SwipeCardProps) {
  const { data: settings } = useSWR("/api/admin/settings", fetcher)

  const watermarkUrl = settings?.watermark_url
  const watermarkSize = settings?.watermark_size ? Number(settings.watermark_size) : 30
  const watermarkOpacity = settings?.watermark_opacity ? Number(settings.watermark_opacity) : 0.5
  const watermarkPosition = settings?.watermark_position || "center"

  const getWatermarkPositionClasses = () => {
    switch (watermarkPosition) {
      case 'top-left': return 'top-4 left-4'
      case 'top-right': return 'top-4 right-4'
      case 'bottom-left': return 'bottom-4 left-4'
      case 'bottom-right': return 'bottom-4 right-4'
      case 'center':
      default: return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    }
  }
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  const finalPrice = garment.discount_percent > 0
    ? garment.price * (1 - garment.discount_percent / 100)
    : garment.price

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 120
      if (info.offset.x > threshold) {
        onSwipeRight()
      } else if (info.offset.x < -threshold) {
        onSwipeLeft()
      }
    },
    [onSwipeLeft, onSwipeRight]
  )

  const variants = {
    exit: (direction: "left" | "right" | null) => ({
      x: direction === "left" ? -500 : direction === "right" ? 500 : 0,
      opacity: 0,
      transition: { duration: 0.3 }
    })
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      custom={custom}
      variants={variants}
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
      exit="exit"
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Image */}
        <div className="relative h-[75%] w-full overflow-hidden">
          <img
            src={garment.image_url}
            alt={garment.title}
            className="h-full w-full object-cover"
          />
          {/* Watermark */}
          {watermarkUrl && (
            <img
              src={watermarkUrl}
              alt=""
              className={`absolute pointer-events-none ${getWatermarkPositionClasses()}`}
              style={{
                width: `${watermarkSize}%`,
                opacity: watermarkOpacity,
                zIndex: 1
              }}
            />
          )}
          {/* Swipe overlays */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-accent/30"
            style={{ opacity: likeOpacity }}
          >
            <div className="rounded-xl border-4 border-accent bg-accent/90 px-8 py-3 rotate-[-15deg]">
              <span className="text-3xl font-bold tracking-wide text-accent-foreground">ME GUSTA</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-destructive/20"
            style={{ opacity: nopeOpacity }}
          >
            <div className="rounded-xl border-4 border-destructive bg-destructive/90 px-8 py-3 rotate-[15deg]">
              <span className="text-3xl font-bold tracking-wide text-destructive-foreground">PASO</span>
            </div>
          </motion.div>
          {/* Discount badge */}
          {garment.discount_percent > 0 && (
            <div className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1.5">
              <span className="text-sm font-bold text-primary-foreground">
                -{garment.discount_percent}%
              </span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex h-[25%] flex-col justify-between p-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-xl font-semibold text-foreground leading-tight text-balance">
                {garment.title}
              </h3>
              <div className="flex flex-col items-end shrink-0">
                {garment.discount_percent > 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    ${garment.price.toLocaleString('es-AR')}
                  </span>
                )}
                <span className="text-lg font-bold text-primary">
                  ${finalPrice.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
            {garment.description && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {garment.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {garment.size && (
              <Badge variant="secondary" className="gap-1 bg-secondary text-secondary-foreground">
                <Ruler className="h-3 w-3" />
                {garment.size}
              </Badge>
            )}
            {garment.brand && (
              <Badge variant="secondary" className="gap-1 bg-secondary text-secondary-foreground">
                <Tag className="h-3 w-3" />
                {garment.brand}
              </Badge>
            )}
            {garment.condition && (
              <Badge variant="secondary" className="gap-1 bg-secondary text-secondary-foreground">
                <Sparkles className="h-3 w-3" />
                {garment.condition}
              </Badge>
            )}
            {garment.allows_offer && (
              <Badge className="bg-accent/20 text-accent-foreground border-0 gap-1">
                <DollarSign className="h-3 w-3" />
                Acepta ofertas
              </Badge>
            )}
            {garment.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="border-primary/30 text-primary text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface SwipeStackProps {
  garments: Garment[]
  onLike: (garment: Garment) => void
  onPass: (garment: Garment) => void
}

export function SwipeStack({ garments, onLike, onPass }: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)

  const currentGarment = garments[currentIndex]
  const nextGarment = garments[currentIndex + 1]

  const advance = useCallback(
    (direction: "left" | "right") => {
      if (!currentGarment) return
      setExitDirection(direction)
      if (direction === "right") {
        onLike(currentGarment)
      } else {
        onPass(currentGarment)
      }
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setExitDirection(null)
      }, 300)
    },
    [currentGarment, onLike, onPass]
  )

  if (currentIndex >= garments.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-secondary p-6">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-foreground">
          Ya viste todas las prendas
        </h3>
        <p className="text-muted-foreground">
          Volve pronto, siempre estamos sumando prendas nuevas.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center">
      <div className="relative flex-1 w-full max-w-[420px] mx-auto my-2 px-4">
        <AnimatePresence custom={exitDirection}>
          {nextGarment && (
            <SwipeCard
              key={nextGarment.id}
              garment={nextGarment}
              onSwipeLeft={() => { }}
              onSwipeRight={() => { }}
              isTop={false}
            />
          )}
          {currentGarment && !exitDirection && (
            <SwipeCard
              key={currentGarment.id}
              garment={currentGarment}
              onSwipeLeft={() => advance("left")}
              onSwipeRight={() => advance("right")}
              isTop
              custom={exitDirection}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Instructions text */}
      <div className="py-4 text-center">
        <p className="text-xs font-medium text-muted-foreground/60 tracking-wider uppercase">
          Desliza <span className="text-destructive mx-1">←</span> para pasar | Desliza <span className="text-accent mx-1">→</span> si te gusta
        </p>
      </div>
    </div>
  )
}
