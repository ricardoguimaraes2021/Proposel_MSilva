import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"

type ProposalMetricRow = {
  id: string
  status: string
  total: number | null
  subtotal: number | null
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
}

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthStartIso = monthStart.toISOString().slice(0, 10)

  const [
    { data: proposals, error: proposalsError },
    { data: events, error: eventsError },
  ] = await Promise.all([
    supabase
      .from("proposals")
      .select("id,status,total,subtotal,created_at"),
    supabase
      .from("proposals")
      .select("id,event_title,event_type,event_type_custom_pt,event_date,event_location,guest_count")
      .eq("status", "accepted")
      .gte("event_date", todayIso)
      .order("event_date", { ascending: true }),
  ])

  if (proposalsError) {
    console.error("Error fetching proposals metrics:", proposalsError)
  }
  if (eventsError) {
    console.error("Error fetching upcoming events:", eventsError)
  }

  const proposalRows = (proposals ?? []) as ProposalMetricRow[]
  const eventRows = (events ?? []) as ProposalEventRow[]

  const proposalsThisMonth = proposalRows.filter((row) => {
    if (!row.created_at) return false
    return row.created_at >= monthStartIso
  })

  const acceptedProposals = proposalRows.filter((row) => row.status === "accepted")

  const totalAcceptedValue = acceptedProposals.reduce((sum, row) => {
    const value = row.total ?? row.subtotal ?? 0
    return sum + Number(value)
  }, 0)

  const averageProposalValue = proposalRows.length
    ? proposalRows.reduce((sum, row) => sum + Number(row.total ?? row.subtotal ?? 0), 0) / proposalRows.length
    : 0

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value)

  const formatDate = (value: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("pt-PT")
  }

  const eventTypeLabel = (event: ProposalEventRow) =>
    event.event_type_custom_pt ||
    (event.event_type === "wedding"
      ? "Casamento"
      : event.event_type === "corporate"
        ? "Empresa"
        : event.event_type === "private"
          ? "Privado"
          : "Evento")

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Bem-vindo, {user.email}</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Propostas este mês</p>
          <p className="mt-2 text-2xl font-semibold">{proposalsThisMonth.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Desde {formatDate(monthStartIso)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Propostas aceites</p>
          <p className="mt-2 text-2xl font-semibold">{acceptedProposals.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total aceites</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valor total aceites</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalAcceptedValue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Somatório de propostas aceites</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valor médio</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(averageProposalValue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Todas as propostas</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Próximos eventos (aceites)</h2>
        <p className="text-sm text-muted-foreground">Mostra apenas propostas aceites com data futura.</p>

        <div className="mt-4 grid gap-3">
          {eventRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem eventos futuros aceites.</div>
          ) : (
            eventRows.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3">
                <div>
                  <p className="font-medium">
                    {event.event_title || eventTypeLabel(event)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.event_location || "Local a definir"}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{formatDate(event.event_date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.guest_count ? `${event.guest_count} pessoas` : "Convidados a definir"}
                  </p>
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
