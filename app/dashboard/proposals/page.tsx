import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ProposalsTable } from "@/components/dashboard/proposals-table"
import Link from "next/link"

export default async function ProposalsPage() {
  const supabase = await createClient()
  const [{ data: proposals, error }, { data: companyProfile, error: companyError }] = await Promise.all([
    supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("company_profile")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1),
  ])

  if (error || companyError) {
    console.error("Error fetching proposals:", error)
    console.error("Error fetching company profile:", companyError)
    return <div>Erro ao carregar propostas.</div>
  }

  const company = companyProfile?.[0] as
    | {
        name?: string
        tagline_pt?: string | null
        logo_url?: string | null
        contact_phone?: string | null
        contact_email?: string | null
        contact_website?: string | null
        contact_instagram?: string | null
        contact_facebook?: string | null
        address_street?: string | null
        address_city?: string | null
        address_postal_code?: string | null
        address_country?: string | null
      }
    | undefined

  const addressParts = [
    company?.address_street,
    [
      company?.address_postal_code,
      company?.address_city,
    ]
      .filter(Boolean)
      .join(" "),
    company?.address_country,
  ].filter(Boolean)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Propostas</h1>
          <p className="text-muted-foreground">Historico de propostas geradas.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/proposals/new">Nova Proposta</Link>
        </Button>
      </div>

      <ProposalsTable
        proposals={proposals ?? []}
        companyName={company?.name || "MSilva"}
        companyTagline={company?.tagline_pt || undefined}
        companyLogoUrl={company?.logo_url || undefined}
        companyContact={{
          phone: company?.contact_phone || undefined,
          email: company?.contact_email || undefined,
          website: company?.contact_website || undefined,
          instagram: company?.contact_instagram || undefined,
          facebook: company?.contact_facebook || undefined,
          address: addressParts.length ? addressParts.join(", ") : undefined,
        }}
      />
    </div>
  )
}
