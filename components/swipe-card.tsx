"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import useSWR from "swr"
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  AnimatePresence,
  useSpring,
} from "framer-motion"
import { Heart, X, Tag, Ruler, Sparkles, DollarSign, Maximize2, ChevronLeft, ChevronRight } from "lucide-react"
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

  const [showViewer, setShowViewer] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [scale, setScale] = useState(1)

  const allImages = garment.image_urls?.length ? garment.image_urls : [garment.image_url]
  const hasMultipleImages = allImages.length > 1

  // Ref for manual pinch tracking
  const pinchStartDist = useRef<number | null>(null)
  const baseScale = useRef(1)

  useEffect(() => {
    if (!showViewer) {
      setScale(1)
      setCurrentImageIndex(0)
      pinchStartDist.current = null
    }
  }, [showViewer])

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (currentImageIndex < allImages.length - 1) {
      setScale(1)
      setCurrentImageIndex(prev => prev + 1)
    }
  }

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (currentImageIndex > 0) {
      setScale(1)
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!showViewer) return
    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(1, scale + delta), 4)
    setScale(newScale)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showViewer) return
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      pinchStartDist.current = dist
      baseScale.current = scale
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!showViewer || !pinchStartDist.current || e.touches.length !== 2) return
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    const ratio = dist / pinchStartDist.current
    const newScale = Math.min(Math.max(1, baseScale.current * ratio), 4)
    setScale(newScale)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDist.current = null
    }
  }

  return (
    <>
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
          <motion.div
            className="relative h-[75%] w-full overflow-hidden cursor-zoom-in group"
            onTap={() => setShowViewer(true)}
          >
            <img
              src={garment.image_url}
              alt={garment.title}
              className="h-full w-full object-contain bg-muted/30"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 className="h-8 w-8 text-white" />
            </div>
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
              className="absolute inset-0 flex items-center justify-center bg-accent/30 pointer-events-none"
              style={{ opacity: likeOpacity }}
            >
              <div className="rounded-xl border-4 border-accent bg-accent/90 px-8 py-3 rotate-[-15deg]">
                <span className="text-3xl font-bold tracking-wide text-accent-foreground">ME GUSTA</span>
              </div>
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-destructive/20 pointer-events-none"
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
          </motion.div>
          {/* Info */}
          <div className="flex h-[25%] flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-2xl font-semibold text-foreground leading-tight text-balance">
                  {garment.title}
                </h3>
                <div className="flex flex-col items-end shrink-0">
                  {garment.discount_percent > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${garment.price.toLocaleString('es-AR')}
                    </span>
                  )}
                  <span className="text-xl font-bold text-primary">
                    ${finalPrice.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              {garment.description && (
                <p className="mt-2 text-base text-muted-foreground line-clamp-2">
                  {garment.description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {garment.size && (
                <Badge variant="secondary" className="gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5">
                  <Ruler className="h-3 w-3" />
                  {garment.size}
                </Badge>
              )}
              {garment.brand && (
                <Badge variant="secondary" className="gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5">
                  <Tag className="h-3 w-3" />
                  {garment.brand}
                </Badge>
              )}
              {garment.condition && (
                <Badge variant="secondary" className="gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5">
                  <Sparkles className="h-3 w-3" />
                  {garment.condition}
                </Badge>
              )}
              {garment.allows_offer && (
                <Badge className="bg-accent/20 text-accent-foreground border-0 gap-1 text-xs px-2 py-0.5">
                  <DollarSign className="h-3 w-3" />
                  Acepta ofertas
                </Badge>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm touch-none"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="flex h-16 items-center justify-between px-6 pt-4">
              <h4 className="font-serif text-xl text-white truncate max-w-[70%]">{garment.title}</h4>
              <button
                onClick={() => setShowViewer(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
              {hasMultipleImages && currentImageIndex > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 active:scale-90 transition-all"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}

              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                drag={scale > 1}
                dragConstraints={{ left: -300 * scale, right: 300 * scale, top: -400 * scale, bottom: 400 * scale }}
                dragElastic={0.1}
                style={{ scale }}
                className="w-full h-full relative touch-none pointer-events-auto flex items-center justify-center p-2 sm:p-4"
              >
                <img
                  src={allImages[currentImageIndex]}
                  alt={`${garment.title} - Imagen ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-2xl"
                  draggable={false}
                />
                {/* Watermark in Viewer */}
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
              </motion.div>

              {hasMultipleImages && currentImageIndex < allImages.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 active:scale-90 transition-all"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
            </div>

            <div className="p-6 pb-10 text-center bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center">
              {hasMultipleImages && (
                <div className="flex justify-center gap-2 mb-2">
                  {allImages.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
  const [showCatalog, setShowCatalog] = useState(false)
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  if (currentIndex >= garments.length && !showCatalog) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="rounded-full bg-secondary p-6">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-foreground">
          ¡Eso es todo por ahora!
        </h3>
        <p className="max-w-xs text-muted-foreground">
          Has recorrido todas las prendas destacadas. ¿Quieres ver el catálogo completo?
        </p>
        <button
          onClick={() => setShowCatalog(true)}
          className="mt-4 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          VER CATÁLOGO
        </button>
      </div>
    )
  }

  if (showCatalog) {
    return (
      <div className="h-full w-full overflow-y-auto px-4 py-6 pb-20 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-foreground">Catálogo completo</h2>
          <button
            onClick={() => setShowCatalog(false)}
            className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
          >
            ← Volver
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {garments.map((garment) => (
            <motion.div
              layoutId={garment.id}
              key={garment.id}
              onClick={() => {
                setSelectedGarment(garment)
                setCurrentImageIndex(0)
              }}
              className="flex flex-col bg-card rounded-xl overflow-hidden border border-border shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <img
                  src={garment.image_url}
                  alt={garment.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                />
                {garment.is_sold && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">Vendido</span>
                  </div>
                )}
                {garment.discount_percent > 0 && !garment.is_sold && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    -{garment.discount_percent}%
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-xs font-medium text-foreground truncate">{garment.title}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-primary">
                    ${(garment.discount_percent > 0 ? garment.price * (1 - garment.discount_percent / 100) : garment.price).toLocaleString('es-AR')}
                  </span>
                  {garment.size && (
                    <span className="text-[10px] text-muted-foreground">{garment.size}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Product Detail Modal */}
        <AnimatePresence>
          {selectedGarment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedGarment(null)
              }}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90dvh] flex flex-col"
              >
                {/* Image Gallery */}
                <div className="relative aspect-[3/4] w-full bg-muted">
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() => setSelectedGarment(null)}
                      className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-all hover:bg-black/40"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="h-full w-full relative">
                    {/* Navigation */}
                    {(selectedGarment.image_urls?.length || 1) > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentImageIndex === 0}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-0"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => Math.min((selectedGarment.image_urls?.length || 1) - 1, prev + 1))}
                          disabled={currentImageIndex === (selectedGarment.image_urls?.length || 1) - 1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-0"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    <img
                      src={selectedGarment.image_urls?.[currentImageIndex] || selectedGarment.image_url}
                      alt={selectedGarment.title}
                      className="h-full w-full object-cover"
                    />

                    {/* Watermark in Catalog Modal */}
                    {watermarkUrl && (
                      <img
                        src={watermarkUrl}
                        alt=""
                        className={`absolute pointer-events-none ${getWatermarkPositionClasses()}`}
                        style={{
                          width: `${watermarkSize}%`,
                          opacity: watermarkOpacity,
                          zIndex: 5
                        }}
                      />
                    )}

                    {/* Pagination Dots */}
                    {(selectedGarment.image_urls?.length || 1) > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-sm">
                        {selectedGarment.image_urls?.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info & Action */}
                <div className="p-6 overflow-y-auto">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-foreground leading-tight text-balance">
                        {selectedGarment.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedGarment.size && (
                          <Badge variant="secondary" className="px-2 py-0.5 text-[10px] bg-secondary text-secondary-foreground">
                            Talle: {selectedGarment.size}
                          </Badge>
                        )}
                        {selectedGarment.brand && (
                          <Badge variant="secondary" className="px-2 py-0.5 text-[10px] bg-secondary text-secondary-foreground">
                            {selectedGarment.brand}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-primary">
                        ${(selectedGarment.discount_percent > 0 ? selectedGarment.price * (1 - selectedGarment.discount_percent / 100) : selectedGarment.price).toLocaleString('es-AR')}
                      </span>
                      {selectedGarment.discount_percent > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          ${selectedGarment.price.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedGarment.description && (
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Detalles de la prenda</h4>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-secondary/30 p-4 rounded-2xl">
                        {selectedGarment.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedGarment.condition && (
                      <div className="bg-secondary/20 p-3 rounded-xl">
                        <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1">Estado</span>
                        <span className="text-sm font-medium">{selectedGarment.condition}</span>
                      </div>
                    )}
                    {selectedGarment.brand && (
                      <div className="bg-secondary/20 p-3 rounded-xl">
                        <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1">Marca</span>
                        <span className="text-sm font-medium">{selectedGarment.brand}</span>
                      </div>
                    )}
                  </div>

                  {selectedGarment.tags && selectedGarment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {selectedGarment.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-accent/10 text-accent-foreground px-2 py-1 rounded-full border border-accent/20">
                          #{tag.replace('#', '')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedGarment(null)}
                      className="flex-1 h-14 rounded-2xl border-2 border-destructive/20 text-destructive font-bold flex items-center justify-center gap-2 hover:bg-destructive/5 active:scale-[0.98] transition-all"
                    >
                      <X className="h-5 w-5" />
                      PASO
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedGarment.is_sold) {
                          onLike(selectedGarment)
                          setSelectedGarment(null)
                        }
                      }}
                      disabled={selectedGarment.is_sold}
                      className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none shadow-lg shadow-primary/20"
                    >
                      {selectedGarment.is_sold ? (
                        "VENDIDO"
                      ) : (
                        <>
                          <Heart className="h-5 w-5 fill-current" />
                          ME GUSTA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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

    </div>
  )
}
