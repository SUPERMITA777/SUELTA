import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Convert array to object for easier use
  const settings = data.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {})

  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { key, value } = body

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
