"use client"

import { Leaf } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SueltaLogo({ className = "" }: { className?: string }) {
  const { data: settings } = useSWR("/api/admin/settings", fetcher)

  const logoUrl = settings?.logo_url
  const logoSize = settings?.logo_size ? Number(settings.logo_size) : null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="SUELTA"
          style={{ height: logoSize ? `${logoSize}px` : '36px', width: 'auto' }}
          className="object-contain"
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
