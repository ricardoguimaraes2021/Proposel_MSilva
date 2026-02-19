import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)

  const { data: assignments, error } = await supabase
    .from("service_staff_assignments")
    .select("id,staff_member_id,calendar_event_id,proposal_id")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const manualIds = (assignments ?? [])
    .map((a) => a.calendar_event_id)
    .filter(Boolean) as string[]
  const proposalIds = (assignments ?? [])
    .map((a) => a.proposal_id)
    .filter(Boolean) as string[]

  const [manualRes, proposalRes] = await Promise.all([
    manualIds.length
      ? supabase
          .from("calendar_events")
          .select("id,title,event_date,client_name")
          .gte("event_date", todayIso)
          .in("id", manualIds)
      : Promise.resolve({ data: [], error: null } as any),
    proposalIds.length
      ? supabase
          .from("proposals")
          .select("id,event_title,event_type,event_type_custom_pt,event_date,client_name")
          .gte("event_date", todayIso)
          .in("id", proposalIds)
      : Promise.resolve({ data: [], error: null } as any),
  ])

  if (manualRes.error) return NextResponse.json({ error: manualRes.error.message }, { status: 500 })
  if (proposalRes.error) return NextResponse.json({ error: proposalRes.error.message }, { status: 500 })

  const manualMap = new Map((manualRes.data ?? []).map((e: any) => [e.id, e]))
  const proposalMap = new Map((proposalRes.data ?? []).map((p: any) => [p.id, p]))

  const byStaff: Record<string, { id: string; title: string; eventDate: string; clientName: string | null }[]> = {}

  ;(assignments ?? []).forEach((a: any) => {
    let service: { id: string; title: string; eventDate: string; clientName: string | null } | null = null

    if (a.calendar_event_id) {
      const e = manualMap.get(a.calendar_event_id)
      if (e?.event_date) {
        service = {
          id: e.id,
          title: e.title,
          eventDate: e.event_date,
          clientName: e.client_name ?? null,
        }
      }
    } else if (a.proposal_id) {
      const p = proposalMap.get(a.proposal_id)
      if (p?.event_date) {
        service = {
          id: p.id,
          title: p.event_title || eventTypeLabel(p),
          eventDate: p.event_date,
          clientName: p.client_name ?? null,
        }
      }
    }

    if (!service) return
    if (!byStaff[a.staff_member_id]) byStaff[a.staff_member_id] = []
    byStaff[a.staff_member_id].push(service)
  })

  Object.values(byStaff).forEach((list) =>
    list.sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  )

  return NextResponse.json(byStaff)
}

function eventTypeLabel(p: { event_type: string; event_type_custom_pt?: string | null }) {
  if (p.event_type_custom_pt) return p.event_type_custom_pt
  switch (p.event_type) {
    case "wedding": return "Casamento"
    case "corporate": return "Evento Corporativo"
    case "private": return "Evento Privado"
    default: return "Evento"
  }
}
