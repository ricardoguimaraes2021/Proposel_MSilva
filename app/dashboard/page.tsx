import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDateShort } from "@/lib/utils"

type ProposalMetricRow = {
  id: string
  status: string
  created_at: string | null
}

type ProposalEventRow = {
  id: string
  event_title: string | null
  event_type: string
  event_type_custom_pt: string | null
  event_date: string | null
  event_location: string | null
  guest_count: number | null
  client_name: string | null
}

type CalendarEventRow = {
  id: string
  title: string
  event_date: string
  event_location: string | null
  guest_count: number | null
  client_name: string
}

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  const [
    { data: proposals, error: proposalsError },
    { data: proposalEvents, error: eventsError },
    { data: calendarEvents, error: calendarEventsError },
  ] = await Promise.all([
    supabase
      .from("proposals")
      .select("id,status,created_at"),
    supabase
      .from("proposals")
      .select("id,event_title,event_type,event_type_custom_pt,event_date,event_location,guest_count,client_name")
      .eq("status", "accepted")
      .gte("event_date", todayIso)
      .order("event_date", { ascending: true }),
    supabase
      .from("calendar_events")
      .select("id,title,event_date,event_location,guest_count,client_name")
      .eq("status", "confirmed")
      .gte("event_date", todayIso)
      .order("event_date", { ascending: true }),
  ])

  if (proposalsError) {
    console.error("Error fetching proposals metrics:", proposalsError)
  }
  if (eventsError) {
    console.error("Error fetching upcoming events:", eventsError)
  }
  if (calendarEventsError) {
    console.error("Error fetching calendar events:", calendarEventsError)
  }

  const proposalRows = (proposals ?? []) as ProposalMetricRow[]
  const eventRows = (proposalEvents ?? []) as ProposalEventRow[]
  const manualRows = (calendarEvents ?? []) as CalendarEventRow[]

  const acceptedProposals = proposalRows.filter((row) => row.status === "accepted")
  const acceptedProposalsUpcoming = eventRows.length

  const eventTypeLabel = (event: ProposalEventRow) =>
    event.event_type_custom_pt ||
    (event.event_type === "wedding"
      ? "Casamento"
      : event.event_type === "corporate"
        ? "Empresa"
        : event.event_type === "private"
          ? "Privado"
          : "Evento")

  const combinedEvents = [
    ...eventRows.map((e) => ({
      key: `proposal:${e.id}`,
      title: e.event_title || eventTypeLabel(e),
      date: e.event_date,
      location: e.event_location,
      guestCount: e.guest_count,
      clientName: e.client_name,
      source: "proposal" as const,
    })),
    ...manualRows.map((e) => ({
      key: `manual:${e.id}`,
      title: e.title,
      date: e.event_date,
      location: e.event_location,
      guestCount: e.guest_count,
      clientName: e.client_name,
      source: "manual" as const,
    })),
  ].filter((e) => e.date)

  let assignedKeys = new Set<string>()
  const proposalIds = eventRows.map((e) => e.id)
  const manualIds = manualRows.map((e) => e.id)
  const assignments: { proposal_id?: string | null; calendar_event_id?: string | null }[] = []

  if (proposalIds.length) {
    const { data } = await supabase
      .from("service_staff_assignments")
      .select("proposal_id")
      .in("proposal_id", proposalIds)
    assignments.push(...(data ?? []))
  }
  if (manualIds.length) {
    const { data } = await supabase
      .from("service_staff_assignments")
      .select("calendar_event_id")
      .in("calendar_event_id", manualIds)
    assignments.push(...(data ?? []))
  }
  assignedKeys = new Set(
    assignments
      .map((a) => {
        if (a.proposal_id) return `proposal:${a.proposal_id}`
        if (a.calendar_event_id) return `manual:${a.calendar_event_id}`
        return null
      })
      .filter(Boolean) as string[],
  )

  const servicesWithoutStaff = combinedEvents.filter((e) => !assignedKeys.has(e.key))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Bem-vindo, {user.email}</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Serviços sem staff</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{servicesWithoutStaff.length}</p>
          <div className="mt-3">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/staff">Gerir Staff</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Próximos serviços</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{combinedEvents.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Propostas + serviços manuais futuros
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Propostas aceites (futuras)</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{acceptedProposalsUpcoming}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total aceites: {acceptedProposals.length}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Próximos serviços</h2>
        <p className="text-sm text-muted-foreground">Propostas aceites e serviços manuais com data futura.</p>

        <div className="mt-4 grid gap-3">
          {combinedEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem serviços futuros.</div>
          ) : (
            combinedEvents.map((event) => (
              <div
                key={event.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background/50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.location || "Local a definir"}
                  </p>
                  {event.clientName ? (
                    <p className="text-xs text-muted-foreground">{event.clientName}</p>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-foreground">{formatDateShort(event.date, "-")}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.guestCount ? `${event.guestCount} pessoas` : "Convidados a definir"}
                  </p>
                  {!assignedKeys.has(event.key) ? (
                    <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Sem staff atribuído
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Staff atribuído ✓
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
