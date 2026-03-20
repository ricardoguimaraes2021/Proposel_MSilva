import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const supabase = await createClient()
  const body = await request.json()

  const { service_included_items_payload, ...serviceData } = body

  const { data, error } = await supabase
    .from("services")
    .update(serviceData)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (service_included_items_payload && Array.isArray(service_included_items_payload)) {
      await supabase.from("service_included_items").delete().eq("service_id", params.id)
      if (service_included_items_payload.length > 0) {
          const itemsToInsert = service_included_items_payload.map((item: any, index: number) => ({
              service_id: params.id,
              catalog_item_id: item.catalog_item_id ? Number(item.catalog_item_id) : null,
              text_pt: item.text_pt || null,
              text_en: item.text_en || null,
              sort_order: index + 1
          }))
          await supabase.from("service_included_items").insert(itemsToInsert)
      }
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const supabase = await createClient()
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
