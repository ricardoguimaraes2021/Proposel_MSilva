import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const momentId = Number(body?.moment_id)
  if (!momentId || Number.isNaN(momentId)) {
    return NextResponse.json({ error: "moment_id invalido" }, { status: 400 })
  }

  const items = Array.isArray(body?.items) ? body.items : []

  const { error: deleteError } = await supabase
    .from("moment_items")
    .delete()
    .eq("moment_id", momentId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (items.length === 0) {
    return NextResponse.json({ success: true })
  }

  const rows = items.map((item: { item_id: number; is_default?: boolean; sort_order?: number }, index: number) => ({
    moment_id: momentId,
    item_id: item.item_id,
    is_default: Boolean(item.is_default),
    sort_order: item.sort_order ?? index + 1,
  }))

  const { error: insertError } = await supabase
    .from("moment_items")
    .insert(rows)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
