"use client"

import { useState, useRef, useCallback } from "react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { SueltaLogo } from "@/components/suelta-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ImageCropper } from "@/components/image-cropper"
import {
  Plus,
  Loader2,
  Upload,
  Trash2,
  Pencil,
  LogOut,
  ImageIcon,
  X,
  Eye,
  EyeOff,
  Tag,
  Settings,
  TrendingUp,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import type { Garment, GarmentFormData } from "@/lib/types"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (res.status === 401) throw new Error("unauthorized")
  return res.json()
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Talle unico"]
const CONDITIONS = ["Nuevo con etiqueta", "Como nuevo", "Muy buen estado", "Buen estado", "Usado"]
const TAG_SUGGESTIONS = [
  "Vintage", "Casual", "Formal", "Deportivo", "Bohemio", "Urbano",
  "Verano", "Invierno", "Otono", "Primavera", "Fiesta", "Oficina",
  "Denim", "Algodon", "Lino", "Seda", "Cuero",
]

const emptyForm: GarmentFormData = {
  title: "",
  description: "",
  price: 0,
  discount_percent: 0,
  size: "",
  brand: "",
  condition: "Buen estado",
  tags: [],
  image_url: "",
  image_urls: [],
  allows_offer: false,
}

export default function AdminDashboard() {
  const router = useRouter()
  const { data: garments, isLoading, error } = useSWR<Garment[]>("/api/admin/garments", fetcher, {
    onError: (err) => {
      if (err.message === "unauthorized") {
        router.push("/admin/login")
      }
    },
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingImageUrlIndex, setEditingImageUrlIndex] = useState<number | null>(null)
  const [form, setForm] = useState<GarmentFormData>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // New settings state
  const [logoUrl, setLogoUrl] = useState("")
  const [logoSize, setLogoSize] = useState(100)
  const [watermarkUrl, setWatermarkUrl] = useState("")
  const [watermarkSize, setWatermarkSize] = useState(30)
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5)
  const [watermarkPosition, setWatermarkPosition] = useState("center")
  const [cropTarget, setCropTarget] = useState<'garment' | 'logo' | 'watermark'>('garment')
  const [originalMimeType, setOriginalMimeType] = useState("image/jpeg")

  // Fetch settings
  const { isLoading: loadingSettings } = useSWR("/api/admin/settings", fetcher, {
    onSuccess: (data) => {
      if (data.whatsapp_number !== undefined) setWhatsappNumber(data.whatsapp_number || "")
      if (data.logo_url !== undefined) setLogoUrl(data.logo_url || "")
      if (data.logo_size !== undefined) setLogoSize(Number(data.logo_size) || 100)
      if (data.watermark_url !== undefined) setWatermarkUrl(data.watermark_url || "")
      if (data.watermark_size !== undefined) setWatermarkSize(Number(data.watermark_size) || 30)
      if (data.watermark_opacity !== undefined) setWatermarkOpacity(Number(data.watermark_opacity) || 0.5)
      if (data.watermark_position !== undefined) setWatermarkPosition(data.watermark_position || "center")
    }
  })

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
      setOriginalFileName(file.name)
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be selected again
    e.target.value = ""
  }, [])

  const handleCroppedImage = async (croppedBlob: Blob) => {
    setImageToCrop(null)
    setUploading(true)
    try {
      const file = new File([croppedBlob], originalFileName, { type: croppedBlob.type })
      const formData = new FormData()
      formData.append("file", file)

      console.log('Final Upload File:', {
        name: file.name,
        size: file.size,
        type: file.type,
        target: cropTarget
      })
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (data.url) {
        console.log('Upload successful:', data.url)
        if (cropTarget === 'garment') {
          setForm((prev) => {
            let newUrls = [...(prev.image_urls || [])]
            if (editingImageUrlIndex !== null) {
              newUrls[editingImageUrlIndex] = data.url
            } else {
              newUrls.push(data.url)
            }
            return {
              ...prev,
              image_urls: newUrls,
              image_url: newUrls[0] || data.url
            }
          })
          setEditingImageUrlIndex(null)
          toast.success("Imagen de prenda guardada")
        } else if (cropTarget === 'logo') {
          setLogoUrl(data.url)
          toast.success("Logo subido")
        } else if (cropTarget === 'watermark') {
          setWatermarkUrl(data.url)
          toast.success("Marca de agua subida")
        }
      } else {
        toast.error("Error al subir imagen")
      }
    } catch {
      toast.error("Error al subir imagen")
    } finally {
      setUploading(false)
    }
  }

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    setForm((prev) => {
      if (prev.tags.includes(trimmed)) return prev
      return { ...prev, tags: [...prev.tags, trimmed] }
    })
    setTagInput("")
  }, [])

  const removeTag = useCallback((tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }, [])

  const openNewDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (garment: Garment) => {
    setEditingId(garment.id)
    setForm({
      title: garment.title,
      description: garment.description || "",
      price: garment.price,
      discount_percent: garment.discount_percent,
      size: garment.size || "",
      brand: garment.brand || "",
      condition: garment.condition,
      tags: garment.tags || [],
      image_url: garment.image_url,
      image_urls: garment.image_urls || [garment.image_url],
      allows_offer: garment.allows_offer,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.image_url || form.price <= 0) {
      toast.error("Completa titulo, imagen y precio")
      return
    }
    setSaving(true)
    try {
      // Ensure image_url is the first from image_urls
      const updatedForm = { ...form }
      if (updatedForm.image_urls && updatedForm.image_urls.length > 0) {
        updatedForm.image_url = updatedForm.image_urls[0]
      }

      if (editingId) {
        await fetch("/api/admin/garments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...updatedForm }),
        })
        toast.success("Prenda actualizada")
      } else {
        await fetch("/api/admin/garments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedForm),
        })
        toast.success("Prenda creada")
      }
      mutate("/api/admin/garments")
      setDialogOpen(false)
      setForm(emptyForm)
      setEditingId(null)
    } catch (error: any) {
      console.error('Error saving garment:', error)
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (garment: Garment) => {
    await fetch("/api/admin/garments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: garment.id, is_active: !garment.is_active }),
    })
    mutate("/api/admin/garments")
    toast.success(garment.is_active ? "Prenda oculta" : "Prenda visible")
  }

  const handleToggleSold = async (garment: Garment) => {
    await fetch("/api/admin/garments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: garment.id, is_sold: !garment.is_sold }),
    })
    mutate("/api/admin/garments")
    toast.success(garment.is_sold ? "Prenda disponible" : "Prenda marcada como vendida")
  }

  const handleSaveSettings = async () => {
    const settingsToSave = [
      { key: "whatsapp_number", value: whatsappNumber },
      { key: "logo_url", value: logoUrl },
      { key: "logo_size", value: logoSize.toString() },
      { key: "watermark_url", value: watermarkUrl },
      { key: "watermark_size", value: watermarkSize.toString() },
      { key: "watermark_opacity", value: watermarkOpacity.toString() },
      { key: "watermark_position", value: watermarkPosition },
    ]

    for (const setting of settingsToSave) {
      // Only save if it's not the initial empty state and we have a key
      if (setting.key) {
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setting),
        })
      }
    }

    mutate("/api/admin/settings")
    toast.success("Configuracion guardada")
    setSettingsOpen(false)
  }

  const handleUploadSettingImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark') => {
    const file = e.target.files?.[0]
    if (!file) return

    setCropTarget(type)
    setOriginalFileName(file.name)
    setOriginalMimeType(file.type)
    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be selected again
    e.target.value = ""
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta prenda?")) return
    await fetch("/api/admin/garments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    mutate("/api/admin/garments")
    toast.success("Prenda eliminada")
  }

  if (error?.message === "unauthorized") return null

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
        <SueltaLogo />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            Admin
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStatsOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Estadisticas"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Configuracion"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar sesion"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Image Cropper Component */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          open={!!imageToCrop}
          onCropComplete={handleCroppedImage}
          onCancel={() => setImageToCrop(null)}
          initialAspect={cropTarget === 'garment' ? 3 / 4 : 1}
          allowDynamicAspect={cropTarget !== 'garment'}
          mimeType={originalMimeType}
        />
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Configuracion</DialogTitle>
            <DialogDescription>Ajusta el logo, la marca de agua y otros parámetros globales.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-4">
            {/* WhatsApp */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="wa">Numero de WhatsApp</Label>
              <Input
                id="wa"
                placeholder="Ej: 5491112345678"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">
                Incluye codigo de pais sin el signo +
              </p>
            </div>

            <Separator />

            {/* Logo Configuration */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Logo</h3>

              <div className="flex flex-col gap-2">
                <Label>Imagen del Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      <button
                        onClick={() => setLogoUrl("")}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => handleUploadSettingImage(e as any, 'logo')
                      input.click()
                    }}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir Logo"}
                  </Button>
                </div>
              </div>

              {logoUrl && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <Label>Tamaño del Logo ({logoSize}px)</Label>
                  </div>
                  <Input
                    type="number"
                    value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="bg-background border-border"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Watermark Configuration */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Marca de Agua</h3>

              <div className="flex flex-col gap-2">
                <Label>Imagen de la Marca de Agua</Label>
                <div className="flex items-center gap-4">
                  {watermarkUrl ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                      <img src={watermarkUrl} alt="Watermark" className="h-full w-full object-contain" />
                      <button
                        onClick={() => setWatermarkUrl("")}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => handleUploadSettingImage(e as any, 'watermark')
                      input.click()
                    }}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir Marca"}
                  </Button>
                </div>
              </div>

              {watermarkUrl && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Tamaño (% del ancho)</Label>
                    <Input
                      type="number"
                      value={watermarkSize}
                      onChange={(e) => setWatermarkSize(Number(e.target.value))}
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Transparencia ({Math.round(watermarkOpacity * 100)}%)</Label>
                    <Input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Ubicación</Label>
                    <Select value={watermarkPosition} onValueChange={setWatermarkPosition}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="top-left">Arriba Izquierda</SelectItem>
                        <SelectItem value="top-right">Arriba Derecha</SelectItem>
                        <SelectItem value="bottom-left">Abajo Izquierda</SelectItem>
                        <SelectItem value="bottom-right">Abajo Derecha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings} className="w-full" disabled={loadingSettings}>
              {loadingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loadingSettings ? "Cargando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground">Estadisticas</DialogTitle>
            <DialogDescription>Resumen de popularidad y ventas de tus prendas.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
                <span className="text-2xl font-bold text-foreground">
                  {garments?.length ?? 0}
                </span>
                <p className="text-xs text-muted-foreground">Total prendas</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
                <span className="text-2xl font-bold text-primary">
                  {garments?.filter(g => g.is_sold).length ?? 0}
                </span>
                <p className="text-xs text-muted-foreground">Vendidas</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-medium text-foreground">Mas gustadas</h4>
              {garments?.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 5).map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground pr-4">{g.title}</span>
                  <Badge variant="secondary" className="shrink-0 bg-secondary text-secondary-foreground">
                    {g.likes_count ?? 0} likes
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="font-serif text-lg font-semibold text-foreground">Prendas</h1>
          <p className="text-xs text-muted-foreground">
            {garments?.length ?? 0} prenda{(garments?.length ?? 0) !== 1 ? "s" : ""} cargadas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setCropTarget('garment')
                openNewDialog()
              }}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nueva prenda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto bg-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-foreground">
                {editingId ? "Editar prenda" : "Nueva prenda"}
              </DialogTitle>
              <DialogDescription>
                {editingId ? "Modifica los detalles de la prenda seleccionada." : "Ingresa los datos para cargar una nueva prenda al catálogo."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              {/* Image upload */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Fotos de la prenda (puedes subir varias)</Label>

                {form.image_urls && form.image_urls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {/* Uploaded Images Grid */}
                    {form.image_urls.map((url, index) => (
                      <div key={url} className="relative aspect-square w-full overflow-hidden rounded-xl border border-border">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCropTarget('garment')
                              setEditingImageUrlIndex(index)
                              setOriginalFileName(`edit-image-${index}.jpg`)
                              setOriginalMimeType('image/jpeg')
                              setImageToCrop(url)
                            }}
                            className="rounded-full bg-foreground/80 p-1.5 text-background transition-colors hover:bg-foreground"
                            aria-label="Editar imagen"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => {
                              const newUrls = prev.image_urls?.filter((_, i) => i !== index) || []
                              return {
                                ...prev,
                                image_urls: newUrls,
                                image_url: newUrls.length > 0 ? newUrls[0] : ""
                              }
                            })}
                            className="rounded-full bg-foreground/80 p-1.5 text-background transition-colors hover:bg-foreground"
                            aria-label="Quitar imagen"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add More Button */}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                          <span className="text-xs">Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground/60" />
                          <span className="text-xs font-medium">Agregar</span>
                        </>
                      )}
                      <input
                        type="file"
                        ref={fileRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                        <span className="text-sm">Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground/60" />
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-foreground/80">Subir primera foto</span>
                          <span className="text-[10px] text-muted-foreground">Puedes recortar y hacer zoom</span>
                        </div>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </button>
                )}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="title" className="text-foreground">Titulo</Label>
                <Input
                  id="title"
                  placeholder="Ej: Camisa de lino oversize"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="desc" className="text-foreground">Descripcion</Label>
                <textarea
                  id="desc"
                  placeholder="Describe la prenda, su estado, color, material..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Price & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price" className="text-foreground">Precio ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={100}
                    value={form.price || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="discount" className="text-foreground">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    max={100}
                    value={form.discount_percent || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, discount_percent: Number(e.target.value) }))}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              {/* Size & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Talle</Label>
                  <Select
                    value={form.size}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, size: val }))}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {SIZES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="brand" className="text-foreground">Marca</Label>
                  <Input
                    id="brand"
                    placeholder="Ej: Zara, H&M"
                    value={form.brand}
                    onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              {/* Condition */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Estado</Label>
                <Select
                  value={form.condition}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, condition: val }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-foreground">Permitir oferta</Label>
                  <span className="text-xs text-muted-foreground">Los clientes pueden proponer un precio</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.allows_offer}
                  onChange={(e) => setForm((prev) => ({ ...prev, allows_offer: e.target.checked }))}
                  className="h-5 w-5 accent-primary"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Etiquetas</Label>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 bg-secondary text-secondary-foreground"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-destructive"
                        aria-label={`Quitar etiqueta ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar etiqueta..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag(tagInput)
                      }
                    }}
                    className="bg-background border-border text-foreground"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(tagInput)}
                    className="shrink-0 border-border text-foreground"
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {TAG_SUGGESTIONS.filter((t) => !form.tags.includes(t))
                    .slice(0, 8)
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingId ? (
                  "Guardar cambios"
                ) : (
                  "Crear prenda"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Garments list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !garments || garments.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No hay prendas cargadas</p>
            <Button
              onClick={openNewDialog}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Cargar primera prenda
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {garments.map((garment) => {
              const finalPrice = garment.discount_percent > 0
                ? garment.price * (1 - garment.discount_percent / 100)
                : garment.price
              return (
                <div key={garment.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 sm:py-3">
                    <div className="flex flex-1 items-start gap-3 min-w-0">
                      {/* Thumbnail */}
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                        <img
                          src={garment.image_url}
                          alt={garment.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm text-foreground truncate">{garment.title}</h3>
                          {!garment.is_active && (
                            <Badge variant="outline" className="text-xs border-muted-foreground text-muted-foreground shrink-0">
                              Oculta
                            </Badge>
                          )}
                          {garment.is_sold && (
                            <Badge className="text-xs bg-primary text-primary-foreground shrink-0 border-0">
                              Vendido
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-primary">
                            ${finalPrice.toLocaleString("es-AR")}
                          </span>
                          {garment.discount_percent > 0 && (
                            <Badge className="bg-primary/10 text-primary text-xs border-0">
                              -{garment.discount_percent}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {garment.size && (
                            <span className="text-xs text-muted-foreground">{garment.size}</span>
                          )}
                          {garment.brand && (
                            <>
                              <span className="text-xs text-muted-foreground">{'|'}</span>
                              <span className="text-xs text-muted-foreground">{garment.brand}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50 mt-2 sm:mt-0 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSold(garment)}
                          className={`flex items-center gap-2 rounded-lg p-2.5 sm:p-2 transition-colors ${garment.is_sold ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"}`}
                          aria-label={garment.is_sold ? "Marcar como disponible" : "Marcar como vendido"}
                          title={garment.is_sold ? "Marcar como disponible" : "Marcar como vendido"}
                        >
                          <CheckCircle2 className="h-5 w-5 sm:h-4 sm:w-4" />
                          <span className="text-xs font-medium sm:hidden">{garment.is_sold ? "Vendido" : "Vender"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(garment)}
                          className="flex items-center gap-2 rounded-lg p-2.5 sm:p-2 text-muted-foreground transition-colors hover:bg-secondary"
                          aria-label={garment.is_active ? "Ocultar prenda" : "Mostrar prenda"}
                          title={garment.is_active ? "Ocultar prenda" : "Mostrar prenda"}
                        >
                          {garment.is_active ? <Eye className="h-5 w-5 sm:h-4 sm:w-4" /> : <EyeOff className="h-5 w-5 sm:h-4 sm:w-4" />}
                          <span className="text-xs font-medium sm:hidden">{garment.is_active ? "Visible" : "Oculta"}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => openEditDialog(garment)}
                          className="flex items-center gap-2 rounded-lg p-2.5 sm:p-2 text-muted-foreground transition-colors hover:bg-secondary"
                          aria-label="Editar prenda"
                          title="Editar prenda"
                        >
                          <Pencil className="h-5 w-5 sm:h-4 sm:w-4" />
                          <span className="text-xs font-medium sm:hidden">Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(garment.id)}
                          className="flex items-center gap-2 rounded-lg p-2.5 sm:p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Eliminar prenda"
                          title="Eliminar prenda"
                        >
                          <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                          <span className="text-xs font-medium sm:hidden">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-border" />
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
