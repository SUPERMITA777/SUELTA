"use client"

import { Leaf } from "lucide-react"

export function SueltaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
        <Leaf className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-serif text-xl font-bold tracking-tight text-foreground">
          SUELTA
        </span>
        <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          moda circular
        </span>
      </div>
    </div>
  )
}
