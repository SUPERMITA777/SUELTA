"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { SueltaLogo } from "@/components/suelta-logo"
import { SwipeStack } from "@/components/swipe-card"
import { PreCart } from "@/components/pre-cart"
import { Loader2, Instagram } from "lucide-react"
import type { Garment } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StorePage() {
  const { data: garments, isLoading } = useSWR<Garment[]>("/api/garments", fetcher)
  const [liked, setLiked] = useState<Garment[]>([])

  const handleLike = useCallback((garment: Garment) => {
    setLiked((prev) => {
      if (prev.some((g) => g.id === garment.id)) return prev
      return [...prev, garment]
    })
  }, [])

  const handlePass = useCallback(() => {
    // Intentionally empty - just advance to next card
  }, [])

  const handleRemoveFromCart = useCallback((id: string) => {
    setLiked((prev) => prev.filter((g) => g.id !== id))
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <SueltaLogo />
        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/suelta_sustentable/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
            aria-label="Instagram de SUELTA"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <PreCart items={liked} onRemove={handleRemoveFromCart} count={liked.length} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando prendas...</p>
            </div>
          </div>
        ) : !garments || garments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-secondary p-6">
              <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Muy pronto nuevas prendas
            </h2>
            <p className="max-w-xs text-muted-foreground">
              Estamos preparando una nueva seleccion de moda circular. Seguinos en Instagram para enterarte primero.
            </p>
            <a
              href="https://www.instagram.com/suelta_sustentable/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              <Instagram className="h-4 w-4" />
              @suelta_sustentable
            </a>
          </div>
        ) : (
          <SwipeStack garments={garments} onLike={handleLike} onPass={handlePass} />
        )}
      </main>

      {/* Footer hint */}
      <footer className="py-2 text-center">
        <p className="text-xs text-muted-foreground">
          {'Desliza'} <span className="text-destructive">{'<'}</span> {'para pasar'} {'|'} {'Desliza'} <span className="text-accent">{'>'}</span> {'si te gusta'}
        </p>
      </footer>
    </div>
  )
}
