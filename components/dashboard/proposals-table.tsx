"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { formatDateShort } from "@/lib/utils"

type ProposalRow = {
  id: string
  reference_number: string | null
  status: string
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  event_title: string | null
  event_type: string
  event_type_custom_pt: string | null
  event_date: string | null
  event_location: string | null
  guest_count: number | null
  show_vat: boolean | null
  vat_rate: number | null
  subtotal: number | null
  total: number | null
  created_at: string | null
  language?: string | null
  custom_intro_pt?: string | null
  terms_pt?: string | null
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Concluida", variant: "outline" },
  accepted: { label: "Aceite", variant: "default" },
  rejected: { label: "Rejeitado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "secondary" },
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value)

const normalizeProposalId = (value?: string | null) => {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower === "undefined" || lower === "null") return null
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(trimmed) ? trimmed : null
}

type ProposalsTableProps = {
  proposals: ProposalRow[]
  companyName: string
  companyTagline?: string
  companyLogoUrl?: string
  companyContact?: {
    phone?: string
    email?: string
    website?: string
    instagram?: string
    facebook?: string
    address?: string
  }
}

export function ProposalsTable({
  proposals,
  companyName,
  companyTagline,
  companyLogoUrl,
  companyContact,
}: ProposalsTableProps) {
  const router = useRouter()
  const [errorId, setErrorId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const handleOpenPdf = (proposalId?: string | null, lang: "pt" | "en") => {
    const normalizedId = normalizeProposalId(proposalId)
    if (!normalizedId) {
      setErrorId("invalid-id")
      return
    }
    setErrorId(null)
    const pdfUrl = `/api/proposals/${normalizedId}/pdf?lang=${lang}`
    // Nota: window.open() pode devolver null em alguns browsers mesmo quando o PDF abre/descarrega
    // (ex.: quando o navegador trata como download). Evitamos mostrar "Erro ao gerar PDF" nesses casos.
    window.open(pdfUrl, "_blank", "noopener,noreferrer")
    // Atualiza o idioma guardado na proposta para refletir a última versão aberta
    fetch(`/api/proposals/${normalizedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang }),
    })
      .then(() => router.refresh())
      .catch(() => {})
  }

  const handleMarkAccepted = async (proposalId?: string | null) => {
    const normalizedId = normalizeProposalId(proposalId)
    if (!normalizedId) {
      setErrorId("invalid-id")
      return
    }
    setStatusUpdatingId(normalizedId)
    try {
      const response = await fetch(`/api/proposals/${normalizedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Nao foi possivel atualizar o estado.")
      }
      router.refresh()
    } catch (error) {
      console.error(error)
      setErrorId(normalizedId)
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Referencia</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>PDF</TableHead>
            <TableHead>Criado</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.length > 0 ? (
            proposals.map((proposal) => {
              const status = statusLabels[proposal.status] ?? {
                label: proposal.status,
                variant: "secondary",
              }
              const totalValue = Number(proposal.total ?? proposal.subtotal ?? 0)
              const createdAt = formatDateShort(proposal.created_at ?? null, "-")
              const eventDate = formatDateShort(proposal.event_date ?? null, "-")
              const proposalId = normalizeProposalId(proposal.id)
              const isUpdating = statusUpdatingId === proposalId
              const rowError = errorId === proposalId
              const hasId = Boolean(proposalId)
              const isLoading = false // PDF abre por URL, sem estado de loading

              return (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">{proposal.reference_number ?? "-"}</TableCell>
                  <TableCell>{proposal.client_name}</TableCell>
                  <TableCell>{proposal.event_title ?? proposal.event_type_custom_pt ?? proposal.event_type}</TableCell>
                  <TableCell>{eventDate}</TableCell>
                  <TableCell>{formatCurrency(totalValue)}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {(proposal.language ?? "pt") === "en" ? "EN" : "PT"}
                    </Badge>
                  </TableCell>
                  <TableCell>{createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {proposal.status !== "accepted" ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkAccepted(proposalId)}
                          disabled={isUpdating || !hasId}
                        >
                          {isUpdating ? "A atualizar..." : "Marcar Aceite"}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPdf(proposalId, "pt")}
                        disabled={isLoading || !hasId}
                      >
                        PDF (PT)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPdf(proposalId, "en")}
                        disabled={isLoading || !hasId}
                      >
                        PDF (EN)
                      </Button>
                    </div>
                    {rowError ? (
                      <div className="mt-2 text-xs text-destructive">Erro ao gerar PDF.</div>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                Ainda nao existem propostas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
