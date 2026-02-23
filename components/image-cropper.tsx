"use client"

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

interface ImageCropperProps {
    image: string
    onCropComplete: (croppedImage: Blob) => void
    onCancel: () => void
    open: boolean
    initialAspect?: number
    allowDynamicAspect?: boolean
    mimeType?: string
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
    image,
    onCropComplete,
    onCancel,
    open,
    initialAspect = 3 / 4,
    allowDynamicAspect = false,
    mimeType = 'image/jpeg'
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [aspect, setAspect] = useState(initialAspect)
    const [cropShape, setCropShape] = useState<'rect' | 'round'>('rect')

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteInternal = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', (error) => reject(error))
            image.setAttribute('crossOrigin', 'anonymous')
            image.src = url
        })

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any,
        mimeType: string
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) return null

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob)
            }, mimeType)
        })
    }

    const handleCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, mimeType)
            if (croppedImage) {
                onCropComplete(croppedImage)
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="max-w-xl bg-card">
                <DialogHeader>
                    <DialogTitle>Encuadrar imagen</DialogTitle>
                    <DialogDescription>
                        Ajusta el zoom y la posición para que la prenda se vea perfecta en la tienda.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative h-[400px] w-full bg-muted rounded-lg overflow-hidden">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={cropShape}
                        showGrid={cropShape === 'rect'}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                    />
                </div>

                {allowDynamicAspect && (
                    <div className="flex flex-col gap-2 pt-4">
                        <span className="text-sm font-medium">Formato de recorte</span>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={aspect === 1 && cropShape === 'rect' ? "default" : "outline"}
                                size="sm"
                                onClick={() => { setAspect(1); setCropShape('rect'); }}
                            >
                                Cuadrado
                            </Button>
                            <Button
                                variant={aspect === 16 / 9 ? "default" : "outline"}
                                size="sm"
                                onClick={() => { setAspect(16 / 9); setCropShape('rect'); }}
                            >
                                Rectangular
                            </Button>
                            <Button
                                variant={cropShape === 'round' ? "default" : "outline"}
                                size="sm"
                                onClick={() => { setAspect(1); setCropShape('round'); }}
                            >
                                Circular
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2 py-4">
                    <span className="text-sm font-medium">Zoom</span>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => setZoom(value[0])}
                    />
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onCancel} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={handleCrop} className="flex-1">
                        Recortar y usar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
