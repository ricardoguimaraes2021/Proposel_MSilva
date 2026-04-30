import {
  buildProposalPreviewData,
  type ProposalApiPayload,
  type CompanyForPreview,
} from "@/lib/build-proposal-preview-data"
import type { ProposalPreviewService, ProposalPreviewOption } from "@/components/pdf/proposal-preview"

export type ContractLang = "pt" | "en"

/** Dados já formatados para o PDF do contrato */
export type ContractPdfData = {
  lang: ContractLang
  documentTitle: string
  referenceNumber: string
  /** Bloco texto identificação Parte A (Cliente) */
  partyAText: string
  /** Bloco texto Parte B (Empresa) */
  partyBText: string
  /** Data do contrato ou assinatura (placeholder quando vazio) */
  agreementDateFormatted: string
  /** Objeto cl. 1 */
  clause1Objective: string
  /** Pontos obrigação principal cl. 2.1 */
  clause2Introduction: string
  /** Serviços / menu do orçamento (HTML-like blocks → plain parágrafos) */
  serviceBlocks: string[]
  /** Lista simples opcionais (fora do total) — um parágrafo por extra */
  optionalBlocks: string[]
  /** Referência valores (subtotal da proposta) — só informação */
  quoteReferenceSummary: string
  /** Labels e corpo jurídico estático por idioma */
  legal: ContractLegalCopy
}

export type ContractLegalCopy = {
  title: string
  betweenParties: string
  and: string
  partyALabel: string
  partyBLabel: string
  preamble: string
  clause1Heading: string
  /** Frase 2 do objeto (integração da cl. 2) */
  clause1SecondPoint: string
  clause2Heading: string
  clause3Heading: string
  clause4Heading: string
  clause5Heading: string
  clause6Heading: string
  clause7Heading: string
  clause8Heading: string
  clause9Closing: string
  localDateLine: string
  firstPartySigner: string
  secondPartySigner: string
  extrasOutsideQuoteHeading: string
  clause3Paragraphs: string[]
  clause4Paragraphs: string[]
  clause5Paragraphs: string[]
  clause6Paragraphs: string[]
  clause7Paragraphs: string[]
  clause8Paragraphs: string[]
}

function formatMoney(value: number, lang: ContractLang): string {
  const locale = lang === "en" ? "en-GB" : "pt-PT"
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value)
}

function formatOptionPriceLine(
  option: ProposalPreviewOption,
  lang: ContractLang,
): string {
  if (option.priceNote) return option.priceNote
  if (option.pricingType === "on_request") {
    return option.unitPrice ? formatMoney(option.unitPrice, lang) : lang === "en" ? "On request" : "Sob consulta"
  }
  if ((option.unitPrice ?? 0) === 0) return lang === "en" ? "Included" : "Incluído"
  if (option.pricingType === "per_person") {
    return `${formatMoney(option.unitPrice, lang)} ${lang === "en" ? "/ person" : "/ pessoa"}`
  }
  return formatMoney(option.unitPrice ?? 0, lang)
}

function formatServiceSubtitle(
  service: ProposalPreviewService,
  eventDate: string,
  lang: ContractLang,
): string {
  const bits: string[] = [service.name]
  if (service.pricingType === "per_person" && service.quantity) {
    bits.push(
      lang === "en" ? `${service.quantity} guests` : `${service.quantity} pessoas`,
    )
  }
  if (eventDate && eventDate !== "-") bits.push(eventDate)
  return bits.join(" · ")
}

function formatServicePricesLine(
  service: ProposalPreviewService,
  lang: ContractLang,
): string {
  if (service.priceNote) return service.priceNote
  if (service.pricingType === "on_request") {
    return service.unitPrice ? formatMoney(service.unitPrice, lang) : lang === "en" ? "On request" : "Sob consulta"
  }
  if ((service.unitPrice ?? 0) === 0 && !service.isOptional) {
    return lang === "en" ? "Included" : "Incluído"
  }
  if (service.isOptional && (service.unitPrice ?? 0) === 0) {
    return lang === "en" ? "On request" : "Sob consulta"
  }
  if (service.pricingType === "per_person") {
    return `${formatMoney(service.unitPrice, lang)} ${lang === "en" ? "/ person × " : "/ pessoa × "} ${service.quantity} = ${formatMoney(service.totalPrice, lang)}`
  }
  return formatMoney(service.totalPrice ?? 0, lang)
}

function formatServiceBody(service: ProposalPreviewService, lang: ContractLang): string {
  const lines: string[] = []
  lines.push(`${lang === "en" ? "Price" : "Preço"}: ${formatServicePricesLine(service, lang)}`)

  const items = service.includedItems?.filter(Boolean) ?? []
  if (items.length) {
    lines.push("")
    lines.push(lang === "en" ? "Includes:" : "Inclui:")
    items.forEach((it) => lines.push(`• ${it}`))
  }

  const opts = service.options ?? []
  if (opts.length) {
    lines.push("")
    lines.push(lang === "en" ? "Options:" : "Opções:")
    opts.forEach((opt) => {
      const price = formatOptionPriceLine(opt, lang)
      lines.push(`• ${opt.name} (${price})`)
    })
  }

  return lines.join("\n")
}

function ptLegalCopy(): ContractLegalCopy {
  return {
    title: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
    betweenParties: "Entre os signatários:",
    and: "E",
    partyALabel: "(A)",
    partyBLabel: "(B)",
    preamble:
      "Tendo em conta o acordo estabelecido, é reduzido a escrito o presente contrato de prestação de serviços de catering, que se rege pelas cláusulas seguintes:",
    clause1Heading: "Cláusula 1ª (Objeto)",
    clause1SecondPoint:
      "Fazem parte integrantes do presente contrato a descrição dos serviços, menu e preços referidos na Cláusula 2ª.",
    clause2Heading: "Cláusula 2ª (Descrição dos serviços / Local)",
    clause3Heading: "Cláusula 3ª (Prazo de vigência)",
    clause4Heading: "Cláusula 4ª (Condições de pagamento)",
    clause5Heading: "Cláusula 5ª (Material)",
    clause6Heading: "Cláusula 6ª (Incumprimento)",
    clause7Heading: "Cláusula 7ª (Comunicação)",
    clause8Heading: "Cláusula 8ª (Condições climatéricas)",
    clause9Closing:
      "O presente contrato é assinado por ambas as partes, sendo entregue um exemplar a cada uma.",
    localDateLine: "Local e data:",
    firstPartySigner: "Primeiro Outorgante:",
    secondPartySigner: "Segundo Outorgante:",
    extrasOutsideQuoteHeading: "Extras – orçamento à parte:",
    clause3Paragraphs: [
      "O contrato tem início na data da assinatura e mantém-se em vigor até ao final dos serviços no dia acordado para o evento, sem prejuízo das obrigações acessórias que devam perdurar após a sua cessação.",
      "Datas específicas de montagem, armazenamento temporário no local ou levantamento do material poderão ser indicadas aqui ou preenchidas à mão:",
      "____________________________________________________________________________",
    ],
    clause4Paragraphs: [
      "Os valores efectivamente pagamentos e valores em falta fazem fé após confirmação pelas partes por escrito nesta cláusula (poderá usar linhas em branco e preenchimento à tinta ou caneta):",
      "Quantia já entregue: _________________ €, em ____/____/________",
      "Restante valor a pagar: _________________ €, até ____/____/________",
      "Outras parcelas ou condição especial: ________________________________________________________________",
      "Referência económica (conforme proposta aceite, sem prejuízo do preenchimento manual acima)",
    ],
    clause5Paragraphs: [
      "Todo o material necessário à realização do evento, pertencente ao Segundo Contratante ou por este colocado à disposição do Primeiro Outorgante para utilização durante o período dos serviços, é da sua responsabilidade custódia e utilização ordinária, sem prejuízo de obrigações de indemnização nos termos da lei aplicável caso de deterioração, extravio não imputável ou utilização contra-indicada pelo Segundo Contratante.",
      "Por eventuais danos graves, roubo ou destruição intencional poderá responder o Primeiro Contratante de acordo com o disposto no Código Civil e demais lei aplicável.",
    ],
    clause6Paragraphs: [
      "Em caso de incumprimento pela qualquer das partes, a parte prejudicada poderá reclamar indemnização nos termos legalmente aplicáveis, nomeadamente despesas de preparação já incorridas e demonstráveis relativamente aos serviços contratados.",
      "Para os serviços de natureza intuitu personæ, só se admite cessão mediante acordo prévio.",
      "Litígio: ficam competentes para dirimir quaisquer litígios os tribunais portugueses, com observância das normas aplicáveis no contrato.",
    ],
    clause7Paragraphs: [
      "Para efeitos de contacto relacionados com esta prestação, prevalecerão os contactos já indicados nos dados do Segundo Contratante ou os que forem comunicados por escrito por qualquer das partes.",
      "Alterações aos serviços essenciais (data, número de convidados acima de uma margem acordada, local) apenas produzem efeitos com acordo entre as Partes manifestado por escrito.",
    ],
    clause8Paragraphs: [
      "Caso não sejam possíveis determinadas formas de execução do serviço por condições meteorológicas relevantes não previsíveis no momento da assinatura, as Partes cooperarão de boa fé na definição de solução alternativa (incluindo infra-estrutura adicional mediante orçamento e acordo expresso quando existam custos adicionais materiais não previstos na proposta).",
      "Ausência deste acordo e impossibilitado absolutamente o serviço por força maior, aplicar-se-á o regime legal aplicável à resolução e restituição de quantias já entregues em proporção aos serviços efetivamente prestados ou preparados.",
    ],
  }
}

function enLegalCopy(): ContractLegalCopy {
  return {
    title: "SERVICES AGREEMENT (CATERING)",
    betweenParties: "Between the undersigned:",
    and: "And",
    partyALabel: "(A)",
    partyBLabel: "(B)",
    preamble:
      "Considering the mutual agreement reached, this catering services agreement is set forth in writing and governed by the following clauses:",
    clause1Heading: "Clause 1 (Subject)",
    clause1SecondPoint:
      "The service description, menus and commercial terms set out in Clause 2 form an integral part hereof.",
    clause2Heading: "Clause 2 (Description of services / Venue)",
    clause3Heading: "Clause 3 (Term)",
    clause4Heading: "Clause 4 (Payment terms)",
    clause5Heading: "Clause 5 (Equipment)",
    clause6Heading: "Clause 6 (Breach)",
    clause7Heading: "Clause 7 (Communications)",
    clause8Heading: "Clause 8 (Weather)",
    clause9Closing:
      "This agreement is signed by both parties, each keeping one counterpart.",
    localDateLine: "Place and date:",
    firstPartySigner: "First party:",
    secondPartySigner: "Second party:",
    extrasOutsideQuoteHeading: "Extras – separate quotation:",
    clause3Paragraphs: [
      "This agreement takes effect on signing and remains in force until completion of catering services on the agreed event date, without prejudice to obligations that survive termination.",
      "Dates for assembly, on-site storage, or pickup of equipment may be entered here or in handwriting:",
      "____________________________________________________________________________",
    ],
    clause4Paragraphs: [
      "Amounts paid and balance due shall prevail as handwritten and confirmed below (please complete in ink):",
      "Amount paid: _________________ €, on ____/____/________",
      "Balance payable: _________________ €, due by ____/____/________",
      "Further instalments or special terms: ________________________________________________________________",
      "Commercial reference under accepted proposal",
    ],
    clause5Paragraphs: [
      "Equipment and utensils supplied remains the Supplier’s property or is made available for the Client’s customary use during the event. Reasonable custody rules apply.",
      "The Client remains liable under applicable civil law for significant damage, intentional destruction, or theft where attributable.",
    ],
    clause6Paragraphs: [
      "In case of breach, the prejudiced Party may pursue damages permitted by law, including demonstrable preparation costs.",
      "Transfer of contractual position requires prior written consent.",
      "Disputes fall under Portuguese courts and substantive law.",
    ],
    clause7Paragraphs: [
      "Parties shall use contacts stated herein or duly notified substitutes for operational coordination.",
      "Material amendments (dates, materially higher guest counts, venues) require written agreement.",
    ],
    clause8Paragraphs: [
      "Should outdoor services prove impossible owing to objectively severe weather unforeseen at signing, Parties shall cooperate in good faith toward an indoor or covered arrangement; additional costs thereof require mutual written consent.",
      "Where lawful impossibility applies, Parties follow applicable statutory rules on avoidance and unjust enrichment concerning payments made.",
    ],
  }
}

function getLegal(lang: ContractLang): ContractLegalCopy {
  return lang === "en" ? enLegalCopy() : ptLegalCopy()
}

function buildPartyA(
  payload: ProposalApiPayload,
  lang: ContractLang,
): string {
  const lines: string[] = [`${lang === "en" ? "(A)" : "(A)"} `]
  const nameParts = [
    payload.client_name?.trim() || "",
    payload.client_company ? ` (${payload.client_company})` : "",
  ]
  lines.push(`${nameParts.join("")}.`)
  if (payload.client_nif?.trim()) {
    lines.push(
      `${lang === "en" ? "Tax ID:" : "NIF:"} ${payload.client_nif.trim()}`,
    )
  }
  if (payload.client_phone?.trim()) {
    lines.push(`${lang === "en" ? "Phone:" : "Telefone:"} ${payload.client_phone.trim()}`)
  }
  if (payload.client_email?.trim()) {
    lines.push(`${lang === "en" ? "Email:" : "Email:"} ${payload.client_email.trim()}`)
  }
  lines.push(
    lang === "en"
      ? "Full postal address / additional identification documents (when applicable): _______________________________________________________________"
      : "Morada completa / documentos adicionais (quando aplicável): ______________________________________________________________________",
  )
  lines.push("")
  lines.push(
    lang === "en"
      ? "hereinafter the “First Contracting Party” or “Client”;"
      : "doravante designado(a) pelo Primeiro Outorgante ou Primeiro Contratante;",
  )
  return lines.join("\n").trim()
}

function buildPartyB(
  company: CompanyForPreview,
  lang: ContractLang,
): string {
  const name = (company.name || "MS Catering").trim()
  const taglinePt = company.tagline_pt?.trim()
  const taglineEn = company.tagline_en?.trim()
  const tagline =
    lang === "en"
      ? (taglineEn || taglinePt || "Catering & Events")
      : (taglinePt || taglineEn || "Catering & Eventos")
  const addressParts = [
    company.address_street,
    [
      company.address_postal_code,
      company.address_city,
    ]
      .filter(Boolean)
      .join(" ")
      .trim(),
    company.address_country,
  ].filter(Boolean) as string[]
  const addr = addressParts.length ? addressParts.join(", ") : "______________________________"

  if (lang === "en") {
    return (
      `(B) ${name}, trading as "${tagline}", with registered office at ${addr}.\n` +
      `Tax identification number (NIF/VAT): _________________________________\n` +
      `hereinafter the “Second Contracting Party” or “Supplier”.`
    )
  }
  return (
    `(B) ${name}, com a designação comercial "${tagline}", com sede em ${addr}.\n` +
    `NIF: _________________________________\n` +
    `doravante designado(a) Segundo Outorgante ou Segundo Contratante / Contratado(a).`
  )
}

/**
 * Contrói dados para o PDF de contrato a partir da mesma carga útil dos orçamentos.
 */
export function buildContractPdfData(
  payload: ProposalApiPayload,
  company: CompanyForPreview,
  lang: ContractLang = "pt",
): ContractPdfData {
  const preview = buildProposalPreviewData(payload, company, lang)
  const agreementDateFormatted = preview.eventDate ?? "____/____/________"
  const eventTitle =
    preview.eventTitle?.trim() ||
    preview.eventType ||
    (lang === "en" ? "Event" : "Evento")
  const eventLocation = preview.eventLocation?.trim() ||
    (lang === "en" ? "Venue TBC" : "Local a indicar")

  const clause1Objective =
    lang === "en"
      ? `Supply of catering services related to "${eventTitle}" on ${preview.eventDate}, as quantified below in accordance with the accepted proposal.`
      : `O fornecimento de serviços de catering relacionados com "${eventTitle}", no dia ${preview.eventDate}, conforme especificado infra e de acordo com a proposta aceite.`

  const clause2Introduction =
    lang === "en"
      ? `The Second Party agrees to supply catering services for the above-mentioned event at ${eventLocation}${preview.guestCount ? ` (${preview.guestCount} guests contracted as per proposal)` : ""}. The detailed menu/services form an integral part of this agreement. Times of service shall be agreed between the Parties (not stipulated in this document unless completed manually).`
      : `O Segundo Contratante obriga-se ao fornecimento dos serviços de catering para a realização de "${eventTitle}" em ${eventLocation}${preview.guestCount ? ` (${preview.guestCount} convidados, conforme orçamento)` : ""}. A descrição do menu/serviços abaixo integra o presente contrato. Os horários de serviço acordam-se entre as partes (podem ser preenchidos à mão se necessário).`

  const services = preview.services ?? []
  const primary = services.filter((s) => !s.isOptional)
  const optionals = services.filter((s) => s.isOptional)
  const eventDateLabel = preview.eventDate ?? ""

  const serviceBlocks = primary.map((svc) => {
    const subtitle = formatServiceSubtitle(svc, eventDateLabel, lang)
    const menuHeader = `${lang === "en" ? "MENU / SERVICES" : "MENU / SERVIÇOS"} – ${subtitle}\n`
    const body = formatServiceBody(svc, lang)
    return menuHeader + body
  })

  const optionalBlocks = optionals.map((svc) => {
    const subtitle = formatServiceSubtitle(svc, eventDateLabel, lang)
    return `${subtitle}\n${formatServiceBody(svc, lang)}`
  })

  const subtotal = preview.subtotal
  const quoteRef = payload.reference_number || payload.id
  const quoteReferenceSummary =
    lang === "en"
      ? `Reference – Proposal no. ${quoteRef}: total agreed in quotation (EUR) ${formatMoney(subtotal, "en")} (VAT per proposal settings). Figures in Clause 4 may be handwritten to reflect actual payments and outstanding balance.`
      : `Referência – Proposta n.º ${quoteRef}: total acordado no orçamento (EUR) ${formatMoney(subtotal, "pt")} (IVA conforme definições da proposta). Os valores na Cláusula 4ª podem ser preenchidos à mão para reflexo dos efetivamente pagamentos e valores em falta.`

  const documentTitle =
    lang === "en"
      ? `Contract_${quoteRef}_${payload.event_date || ""}`
      : `Contrato_${quoteRef}_${payload.event_date || ""}`

  const legal = getLegal(lang)

  return {
    lang,
    documentTitle: documentTitle.replace(/[/\\]/g, "-"),
    referenceNumber: String(quoteRef),
    partyAText: buildPartyA(payload, lang),
    partyBText: buildPartyB(company, lang),
    agreementDateFormatted,
    clause1Objective,
    clause2Introduction,
    serviceBlocks,
    optionalBlocks,
    quoteReferenceSummary,
    legal,
  }
}
