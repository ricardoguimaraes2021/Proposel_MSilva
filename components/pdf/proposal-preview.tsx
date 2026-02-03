import type { PricingType } from "@/types"

export type ProposalPreviewOption = {
  name: string
  pricingType: PricingType
  quantity: number
  unitPrice: number
  totalPrice: number
  priceNote?: string
}

export type ProposalPreviewService = {
  name: string
  pricingType: PricingType
  quantity: number
  unitPrice: number
  totalPrice: number
  includedItems?: string[]
  options?: ProposalPreviewOption[]
  priceNote?: string
}

export type ProposalPreviewSection = {
  title: string
  body: string
}

export type ProposalPreviewData = {
  companyName: string
  companyTagline?: string
  companyLogoUrl?: string
  documentTitle?: string
  companyContact?: {
    phone?: string
    email?: string
    website?: string
    instagram?: string
    facebook?: string
    address?: string
  }
  title?: string
  vatNote?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientCompany?: string
  clientNif?: string
  eventTitle?: string
  eventType?: string
  eventDate?: string
  eventLocation?: string
  guestCount?: string
  guestBasis?: string
  services?: ProposalPreviewService[]
  optionalServices?: ProposalPreviewService[]
  subtotal: number
  sections: ProposalPreviewSection[]
  footerNotes?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")

const getPriceLabel = (pricingType: PricingType, unitPrice: number, priceNote?: string) => {
  if (priceNote) return priceNote
  if (pricingType === "per_person") return `${formatCurrency(unitPrice)} / pessoa`
  if (pricingType === "on_request") return unitPrice ? formatCurrency(unitPrice) : "Sob consulta"
  return formatCurrency(unitPrice)
}

const getQuantityLabel = (pricingType: PricingType, quantity: number) => {
  if (pricingType !== "per_person") return null
  return `${quantity} pessoas`
}

export function buildProposalPrintHtml(data: ProposalPreviewData) {
  const renderOptions = (options?: ProposalPreviewOption[]) => {
    if (!options?.length) return ""
    const items = options
      .map((option) => {
        const label = getPriceLabel(option.pricingType, option.unitPrice, option.priceNote)
        return `<li>${escapeHtml(option.name)} <span class="option-price">(${escapeHtml(label)})</span></li>`
      })
      .join("")
    return `
      <div class="service-section">
        <div class="section-title">Opcoes</div>
        <ul>${items}</ul>
      </div>
    `
  }

  const renderServiceBlock = (service: ProposalPreviewService) => {
    const priceLabel = getPriceLabel(service.pricingType, service.unitPrice, service.priceNote)
    const quantityLabel = getQuantityLabel(service.pricingType, service.quantity)
    const includedItems = service.includedItems?.length
      ? service.includedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : ""

    return `
      <div class="service-block">
        <div class="service-header">
          <div>
            <div class="service-name">${escapeHtml(service.name)}</div>
            ${quantityLabel ? `<div class="service-qty">${escapeHtml(quantityLabel)}</div>` : ""}
          </div>
          <div class="service-price">${escapeHtml(priceLabel)}</div>
        </div>
        <div class="service-section">
          <div class="section-title">Inclui</div>
          ${includedItems ? `<ul>${includedItems}</ul>` : `<p class="muted">-</p>`}
        </div>
        ${renderOptions(service.options)}
      </div>
    `
  }

  const servicesBlock = data.services?.length
    ? data.services.map(renderServiceBlock).join("")
    : `<p class="muted">Nenhum servico selecionado.</p>`

  const optionalBlock = data.optionalServices?.length
    ? `
    <section class="section">
      <h2>Opcoes Apresentadas</h2>
      ${data.optionalServices.map(renderServiceBlock).join("")}
    </section>
  `
    : ""

  const sectionBlocks = data.sections
    .map((section) => {
      const paragraphs = section.body
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("")

      return `
<section class="section">
  <h2>${escapeHtml(section.title)}</h2>
  ${paragraphs || `<p class="muted">-</p>`}
</section>`
    })
    .join("\n")

  const footerParagraphs = data.footerNotes
    ? data.footerNotes
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("")
    : ""

  const contactLines = []
  if (data.companyContact?.phone) {
    contactLines.push(`<div>Telefone: ${escapeHtml(data.companyContact.phone)}</div>`)
  }
  if (data.companyContact?.email) {
    contactLines.push(`<div>Email: ${escapeHtml(data.companyContact.email)}</div>`)
  }
  if (data.companyContact?.website) {
    contactLines.push(`<div>Website: ${escapeHtml(data.companyContact.website)}</div>`)
  }
  if (data.companyContact?.instagram) {
    contactLines.push(`<div>Instagram: ${escapeHtml(data.companyContact.instagram)}</div>`)
  }
  if (data.companyContact?.facebook) {
    contactLines.push(`<div>Facebook: ${escapeHtml(data.companyContact.facebook)}</div>`)
  }
  if (data.companyContact?.address) {
    contactLines.push(`<div>Morada: ${escapeHtml(data.companyContact.address)}</div>`)
  }

  const contactSection = contactLines.length
    ? `\n<section class="section">\n  <h2>Contacto</h2>\n  ${contactLines.join("")}\n</section>`
    : ""

  return `<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.documentTitle || "Proposta")}</title>
  <style>
    :root {
      --brand: #445044;
      --brand-soft: #808780;
      --brand-muted: #C6C9C6;
      --text: #111411;
      --text-muted: #5A605A;
      --border: #E6E8E6;
      --surface: #FFFFFF;
      --surface-alt: #F7F8F7;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: var(--text);
      padding: 40px 44px;
      background: var(--surface);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }
    .logo {
      max-width: 160px;
      flex: 0 0 auto;
      margin-left: auto;
      text-align: right;
    }
    .logo img {
      display: block;
      max-width: 160px;
      max-height: 80px;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .identity {
      flex: 1;
    }
    h1, h2 {
      font-family: "Cormorant Garamond", "Times New Roman", serif;
      color: var(--text);
    }
    h1 {
      font-size: 30px;
      margin: 0 0 6px 0;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .muted { color: var(--text-muted); }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 11px;
      font-weight: 600;
      color: var(--brand-soft);
    }
    .doc-title {
      margin-top: 6px;
      font-weight: 600;
      color: var(--brand);
      font-size: 14px;
      line-height: 1.3;
      word-break: break-word;
    }
    .section {
      margin-top: 18px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--surface);
    }
    .section h2 {
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin: 0 0 10px 0;
      color: var(--brand);
      font-weight: 600;
    }
    .section p {
      margin: 0 0 8px 0;
      font-size: 12.5px;
      line-height: 1.6;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12.5px;
    }
    .hero-meta {
      margin-top: 10px;
      display: grid;
      gap: 2px;
      font-size: 12.5px;
    }
    .service-block {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px 14px;
      margin-top: 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .service-name {
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
    }
    .service-qty {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .service-price {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--brand);
      white-space: nowrap;
    }
    .service-section {
      margin-top: 8px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--brand-soft);
      font-weight: 600;
      margin-bottom: 4px;
    }
    .service-section ul {
      margin: 0;
      padding-left: 16px;
      font-size: 12.5px;
      line-height: 1.6;
      color: var(--text-muted);
    }
    .option-price {
      color: var(--text-muted);
      font-weight: 500;
    }
    .totals {
      margin-top: 18px;
      display: flex;
      justify-content: flex-end;
    }
    .totals div {
      width: 220px;
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text);
    }
    .conditions {
      break-before: page;
      page-break-before: always;
    }
    @media print {
      .section,
      .service-block {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="identity">
      <div class="eyebrow">Proposta de Orçamento</div>
      <h1>${escapeHtml(data.companyName)}</h1>
      ${data.companyTagline ? `<div class="muted">${escapeHtml(data.companyTagline)}</div>` : ""}
      ${data.title ? `<div class="doc-title">${escapeHtml(data.title)}</div>` : ""}
      <div class="hero-meta muted">
        <div>${escapeHtml(data.eventType || "Evento")} | ${escapeHtml(data.eventDate || "-")}</div>
        <div>Local: ${escapeHtml(data.eventLocation || "-")}</div>
        ${data.guestBasis ? `<div>${escapeHtml(data.guestBasis)}</div>` : ""}
        ${data.vatNote ? `<div>${escapeHtml(data.vatNote)}</div>` : ""}
      </div>
    </div>
    ${data.companyLogoUrl ? `<div class="logo"><img src="${escapeHtml(data.companyLogoUrl)}" alt="Logo" /></div>` : ""}
  </header>

  <section class="section">
    <h2>Cliente</h2>
    <div class="row"><span>Nome</span><span>${escapeHtml(data.clientName || "-")}</span></div>
    <div class="row"><span>Email</span><span>${escapeHtml(data.clientEmail || "-")}</span></div>
    <div class="row"><span>Telefone</span><span>${escapeHtml(data.clientPhone || "-")}</span></div>
  </section>

  <section class="section">
    <h2>Evento</h2>
    <div class="row"><span>Titulo</span><span>${escapeHtml(data.eventTitle || "-")}</span></div>
    <div class="row"><span>Data</span><span>${escapeHtml(data.eventDate || "-")}</span></div>
    <div class="row"><span>Local</span><span>${escapeHtml(data.eventLocation || "-")}</span></div>
    <div class="row"><span>Convidados</span><span>${escapeHtml(data.guestCount || "-")}</span></div>
  </section>

  ${contactSection}

  <section class="section">
    <h2>Servicos Selecionados</h2>
    ${servicesBlock}
  </section>

  ${optionalBlock}

  ${sectionBlocks}

  <div class="totals">
    <div>
      <span class="muted">Subtotal</span>
      <span>${formatCurrency(data.subtotal)}</span>
    </div>
  </div>

  ${
    footerParagraphs
      ? `\n<section class="section conditions">\n  <h2>Condicoes Gerais</h2>\n  ${footerParagraphs}\n</section>`
      : ""
  }
</body>
</html>`
}

export function ProposalPreview({ data }: { data: ProposalPreviewData }) {
  const sections = (data.sections ?? []).map((section) => ({
    ...section,
    lines: section.body
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean),
  }))

  const contactRows = [
    data.companyContact?.phone ? { label: "Telefone", value: data.companyContact.phone } : null,
    data.companyContact?.email ? { label: "Email", value: data.companyContact.email } : null,
    data.companyContact?.website ? { label: "Website", value: data.companyContact.website } : null,
    data.companyContact?.instagram ? { label: "Instagram", value: data.companyContact.instagram } : null,
    data.companyContact?.facebook ? { label: "Facebook", value: data.companyContact.facebook } : null,
    data.companyContact?.address ? { label: "Morada", value: data.companyContact.address } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  const renderService = (service: ProposalPreviewService) => {
    const priceLabel = getPriceLabel(service.pricingType, service.unitPrice, service.priceNote)
    const quantityLabel = getQuantityLabel(service.pricingType, service.quantity)

    return (
      <div key={service.name} className="rounded-md border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{service.name}</p>
            {quantityLabel ? <p className="text-xs text-muted-foreground">{quantityLabel}</p> : null}
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{priceLabel}</p>
        </div>
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Inclui</p>
          {service.includedItems?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {service.includedItems.map((item, index) => (
                <li key={`${service.name}_${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">-</p>
          )}
        </div>
        {service.options?.length ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Opcoes</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {service.options.map((option) => (
                <li key={`${service.name}_${option.name}`}>
                  {option.name} ({getPriceLabel(option.pricingType, option.unitPrice, option.priceNote)})
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-6 text-sm text-foreground">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold">{data.companyName}</h3>
          {data.companyTagline ? (
            <p className="text-sm text-muted-foreground">{data.companyTagline}</p>
          ) : null}
          {data.title ? <p className="mt-2 text-sm font-medium">{data.title}</p> : null}
          <div className="mt-2 text-xs text-muted-foreground">
            <p>{data.eventType || "Evento"} | {data.eventDate || "-"}</p>
            <p>Local: {data.eventLocation || "-"}</p>
            {data.guestBasis ? <p>{data.guestBasis}</p> : null}
            {data.vatNote ? <p>{data.vatNote}</p> : null}
          </div>
        </div>
        {data.companyLogoUrl ? (
          <img
            src={data.companyLogoUrl}
            alt="Logo"
            className="max-h-16 w-auto max-w-[180px] object-contain"
          />
        ) : null}
      </div>

      <div className="grid gap-4">
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cliente</h4>
          <div className="mt-2 grid gap-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span>{data.clientName || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{data.clientEmail || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{data.clientPhone || "-"}</span></div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Evento</h4>
          <div className="mt-2 grid gap-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Titulo</span><span>{data.eventTitle || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span>{data.eventDate || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Local</span><span>{data.eventLocation || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Convidados</span><span>{data.guestCount || "-"}</span></div>
          </div>
        </section>

        {contactRows.length ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Contacto</h4>
            <div className="mt-2 grid gap-1 text-sm">
              {contactRows.map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Servicos Selecionados</h4>
          <div className="mt-3 grid gap-4">
            {data.services?.length ? (
              data.services.map(renderService)
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum servico selecionado.</p>
            )}
          </div>
        </section>

        {data.optionalServices?.length ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Opcoes Apresentadas</h4>
            <div className="mt-3 grid gap-4">
              {data.optionalServices.map(renderService)}
            </div>
          </section>
        ) : null}

        {sections.length ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Enquadramento</h4>
            <div className="mt-2 grid gap-2 text-sm">
              {sections.map((section) => (
                <div key={section.title}>
                  {section.lines.map((line, index) => (
                    <p key={`${section.title}_${index}`}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.footerNotes ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Condicoes Gerais</h4>
            <div className="mt-2 grid gap-2 text-sm">
              {data.footerNotes
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, index) => (
                  <p key={`terms_${index}`}>{line}</p>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
