"use client"

import { Heart, X, Trash2, ShoppingBag, Ruler, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Garment } from "@/lib/types"

interface PreCartProps {
  items: Garment[]
  onRemove: (id: string) => void
  count: number
}

export function PreCart({ items, onRemove, count }: PreCartProps) {
  const total = items.reduce((sum, item) => {
    const finalPrice = item.discount_percent > 0
      ? item.price * (1 - item.discount_percent / 100)
      : item.price
    return sum + finalPrice
  }, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label={`Pre carrito con ${count} prendas`}
        >
          <Heart className="h-5 w-5 fill-current" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col bg-card sm:max-w-md">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 font-serif text-xl text-foreground">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            Tus prendas elegidas
          </SheetTitle>
        </SheetHeader>
        <Separator className="bg-border" />
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-secondary p-5">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Desliza a la derecha las prendas que te gusten
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col gap-3 py-3">
                {items.map((item) => {
                  const finalPrice = item.discount_percent > 0
                    ? item.price * (1 - item.discount_percent / 100)
                    : item.price
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-xl border border-border bg-background p-3"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-medium text-sm text-foreground truncate">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.size && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Ruler className="h-3 w-3" />
                                {item.size}
                              </span>
                            )}
                            {item.brand && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Tag className="h-3 w-3" />
                                {item.brand}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="flex items-center gap-2">
                            {item.discount_percent > 0 && (
                              <span className="text-xs text-muted-foreground line-through">
                                ${item.price.toLocaleString('es-AR')}
                              </span>
                            )}
                            <span className="text-sm font-bold text-primary">
                              ${finalPrice.toLocaleString('es-AR')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Quitar ${item.title} del pre carrito`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <Separator className="bg-border" />
            <div className="flex flex-col gap-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{items.length} prenda{items.length !== 1 ? 's' : ''}</span>
                <span className="text-lg font-bold text-foreground">
                  ${total.toLocaleString('es-AR')}
                </span>
              </div>
              <Button
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                onClick={() => {
                  const message = items
                    .map((i) => {
                      const fp = i.discount_percent > 0
                        ? i.price * (1 - i.discount_percent / 100)
                        : i.price
                      return `- ${i.title} (${i.size || 'Talle unico'}) - $${fp.toLocaleString('es-AR')}`
                    })
                    .join('\n')
                  const text = encodeURIComponent(
                    `Hola! Me interesan estas prendas de SUELTA:\n\n${message}\n\nTotal: $${total.toLocaleString('es-AR')}`
                  )
                  window.open(`https://wa.me/?text=${text}`, '_blank')
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                Consultar por WhatsApp
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
