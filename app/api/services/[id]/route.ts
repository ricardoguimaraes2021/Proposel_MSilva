import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("services")
    .update(body)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
