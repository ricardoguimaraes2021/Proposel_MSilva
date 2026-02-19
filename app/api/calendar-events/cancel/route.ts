import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const source = body.source as "manual" | "proposal" | undefined
  const id = body.id as string | undefined

  if (!source || !id) {
    return NextResponse.json({ error: "source and id are required" }, { status: 400 })
  }

  if (source === "manual") {
    const { error: updateError } = await supabase
      .from("calendar_events")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const { error: deleteError } = await supabase
      .from("service_staff_assignments")
      .delete()
      .eq("calendar_event_id", id)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  }

  if (source === "proposal") {
    const { error: updateError } = await supabase
      .from("proposals")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const { error: deleteError } = await supabase
      .from("service_staff_assignments")
      .delete()
      .eq("proposal_id", id)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "invalid source" }, { status: 400 })
}
