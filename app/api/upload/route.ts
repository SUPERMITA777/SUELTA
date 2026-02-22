import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('Uploading file:', file.name, 'size:', file.size, 'type:', file.type)
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is missing!')
      return NextResponse.json({ error: 'Server configuration error', message: 'Token missing' }, { status: 500 })
    }

    const blob = await put(`suelta/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })
    console.log('Upload success:', blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: 'Upload failed',
      message: error.message
    }, { status: 500 })
  }
}
