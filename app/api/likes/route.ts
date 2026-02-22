import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Use rpc for atomic increment if available, else fetch and update
    // For simplicity here, we fetch and update, but rpc would be better
    const { data: garment, error: fetchError } = await supabase
        .from('garments')
        .select('likes_count')
        .eq('id', id)
        .single()

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const { error: updateError } = await supabase
        .from('garments')
        .update({ likes_count: (garment.likes_count || 0) + 1 })
        .eq('id', id)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
