export interface Garment {
  id: string
  title: string
  description: string | null
  price: number
  discount_percent: number
  size: string | null
  brand: string | null
  condition: string
  tags: string[]
  image_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GarmentFormData {
  title: string
  description: string
  price: number
  discount_percent: number
  size: string
  brand: string
  condition: string
  tags: string[]
  image_url: string
}
