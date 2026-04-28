"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnnouncementModalProps {
  imageUrl: string
  active: boolean
}

export function AnnouncementModal({ imageUrl, active }: AnnouncementModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (active && imageUrl) {
      // Check if it was already shown in this session
      const shown = sessionStorage.getItem("announcement_shown")
      if (!shown) {
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 800)
        return () => clearTimeout(timer)
      }
    }
  }, [active, imageUrl])

  const handleClose = () => {
    setIsOpen(false)
    sessionStorage.setItem("announcement_shown", "true")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Flyer Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-2xl border-4 border-white/10">
              <img
                src={imageUrl}
                alt="Novedades de SUELTA"
                className="h-full w-full object-cover"
              />
              <button
                onClick={handleClose}
                className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Button
              onClick={handleClose}
              className="group h-12 w-full gap-2 rounded-full bg-white text-black hover:bg-white/90 shadow-xl transition-all hover:scale-105 active:scale-95"
              size="lg"
            >
              IR A TIENDA
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
