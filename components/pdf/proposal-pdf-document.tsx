import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import type { ProposalPreviewData, ProposalPreviewService, ProposalPreviewOption } from "./proposal-preview"
import type { PricingType } from "@/types"

// Cores inspiradas no v0 / proposta actual (brand, serif, elegante)
const colors = {
  brand: "#445044",
  brandSoft: "#808780",
  text: "#111411",
  textMuted: "#5A605A",
  border: "#E6E8E6",
  surface: "#FFFFFF",
  surfaceAlt: "#F7F8F7",
}

const formatCurrency = (value: number, locale: "pt-PT" | "en-GB") =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value)

const labelsPt = {
  eyebrow: "Proposta de Orçamento",
  client: "Cliente",
  name: "Nome",
  email: "Email",
  phone: "Telefone",
  company: "Empresa",
  nif: "NIF",
  event: "Evento",
  title: "Título",
  date: "Data",
  location: "Local",
  guests: "Convidados",
  contact: "Contacto",
  address: "Morada",
  servicesSelected: "Serviços Selecionados",
  noServices: "Nenhum serviço selecionado.",
  includes: "Inclui",
  options: "Opções",
  optionsPresented: "Opções Apresentadas",
  subtotal: "Subtotal",
  generalTerms: "Condições Gerais",
  perPerson: "pessoa",
  eventFallback: "Evento",
}

const labelsEn = {
  eyebrow: "Quote Proposal",
  client: "Client",
  name: "Name",
  email: "Email",
  phone: "Phone",
  company: "Company",
  nif: "VAT number",
  event: "Event",
  title: "Title",
  date: "Date",
  location: "Location",
  guests: "Guests",
  contact: "Contact",
  address: "Address",
  servicesSelected: "Selected Services",
  noServices: "No services selected.",
  includes: "Includes",
  options: "Options",
  optionsPresented: "Options Presented",
  subtotal: "Subtotal",
  generalTerms: "General Terms",
  perPerson: "person",
  eventFallback: "Event",
}

function getPriceLabel(
  pricingType: PricingType,
  unitPrice: number,
  priceNote: string | undefined,
  locale: "pt-PT" | "en-GB",
  labels: typeof labelsPt
): string {
  if (priceNote) return priceNote
  if (pricingType === "per_person") return `${formatCurrency(unitPrice, locale)} / ${labels.perPerson}`
  if (pricingType === "on_request") return unitPrice ? formatCurrency(unitPrice, locale) : (locale === "en-GB" ? "On request" : "Sob consulta")
  return formatCurrency(unitPrice, locale)
}

function getQuantityLabel(
  pricingType: PricingType,
  quantity: number,
  locale: "pt-PT" | "en-GB"
): string | null {
  if (pricingType !== "per_person") return null
  return locale === "en-GB" ? `${quantity} guests` : `${quantity} pessoas`
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: colors.text,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
    marginBottom: 18,
  },
  identity: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.brandSoft,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginTop: 4,
  },
  heroMeta: {
    marginTop: 8,
    fontSize: 10,
    color: colors.textMuted,
    gap: 2,
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: "contain",
  },
  section: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1,
    color: colors.brand,
    marginBottom: 8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 10,
  },
  rowLabel: {
    color: colors.textMuted,
  },
  serviceBlock: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
  },
  serviceQty: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
  },
  subsectionTitle: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.brandSoft,
    marginTop: 6,
    marginBottom: 4,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  listItem: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
    paddingLeft: 12,
  },
  optionPrice: {
    color: colors.textMuted,
    fontFamily: "Helvetica-Oblique",
  },
  totals: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 180,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  paragraph: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  conditionsPage: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: colors.text,
    backgroundColor: colors.surface,
  },
  conditionsTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    color: colors.brand,
  },
  numberedItem: {
    flexDirection: "row",
    marginBottom: 8,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 1.5,
  },
  contactLine: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
  },
})

function ServiceBlock({
  service,
  labels,
  locale,
}: {
  service: ProposalPreviewService
  labels: typeof labelsPt
  locale: "pt-PT" | "en-GB"
}) {
  const priceLabel = getPriceLabel(
    service.pricingType,
    service.unitPrice,
    service.priceNote,
    locale,
    labels
  )
  const quantityLabel = getQuantityLabel(service.pricingType, service.quantity, locale)

  return (
    <View style={styles.serviceBlock} wrap={false}>
      <View style={styles.serviceHeader}>
        <View>
          <Text style={styles.serviceName}>{service.name}</Text>
          {quantityLabel ? <Text style={styles.serviceQty}>{quantityLabel}</Text> : null}
        </View>
        <Text style={styles.servicePrice}>{priceLabel}</Text>
      </View>
      <Text style={styles.subsectionTitle}>{labels.includes}</Text>
      {service.includedItems?.length ? (
        service.includedItems.map((item, i) => (
          <Text key={i} style={styles.listItem}>• {item}</Text>
        ))
      ) : (
        <Text style={styles.listItem}>—</Text>
      )}
      {service.options?.length ? (
        <>
          <Text style={styles.subsectionTitle}>{labels.options}</Text>
          {service.options.map((opt: ProposalPreviewOption, i: number) => {
            const label = getPriceLabel(
              opt.pricingType,
              opt.unitPrice,
              opt.priceNote,
              locale,
              labels
            )
            return (
              <Text key={i} style={styles.listItem}>
                {opt.name} <Text style={styles.optionPrice}>({label})</Text>
              </Text>
            )
          })}
        </>
      ) : null}
    </View>
  )
}

export function ProposalPdfDocument({
  data,
  lang = "pt",
}: {
  data: ProposalPreviewData
  lang?: "pt" | "en"
}) {
  const labels = lang === "en" ? labelsEn : labelsPt
  const locale = lang === "en" ? "en-GB" : "pt-PT"

  const contact = data.companyContact
  const contactLines: string[] = []
  if (contact?.phone) contactLines.push(`${labels.phone}: ${contact.phone}`)
  if (contact?.email) contactLines.push(`${labels.email}: ${contact.email}`)
  if (contact?.website) contactLines.push(`Website: ${contact.website}`)
  if (contact?.instagram) contactLines.push(`Instagram: ${contact.instagram}`)
  if (contact?.facebook) contactLines.push(`Facebook: ${contact.facebook}`)
  if (contact?.address) contactLines.push(`${labels.address}: ${contact.address}`)

  const footerParagraphs = data.footerNotes
    ? data.footerNotes.split(/\n+/).map((l) => l.trim()).filter(Boolean)
    : []

  return (
    <Document title={data.documentTitle || (lang === "en" ? "Proposal" : "Proposta")}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <Text style={styles.eyebrow}>{labels.eyebrow}</Text>
            <Text style={styles.companyName}>{data.companyName}</Text>
            {data.companyTagline ? <Text style={styles.tagline}>{data.companyTagline}</Text> : null}
            {data.title ? <Text style={styles.docTitle}>{data.title}</Text> : null}
            <View style={styles.heroMeta}>
              <Text>{[data.eventType || labels.eventFallback, data.eventDate || "—"].join(" | ")}</Text>
              <Text>{labels.location}: {data.eventLocation || "—"}</Text>
              {data.guestBasis ? <Text>{data.guestBasis}</Text> : null}
              {data.vatNote ? <Text>{data.vatNote}</Text> : null}
            </View>
          </View>
          {data.companyLogoUrl ? (
            <Image src={data.companyLogoUrl} style={styles.logo} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.client}</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>{labels.name}</Text><Text>{data.clientName || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>{labels.email}</Text><Text>{data.clientEmail || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>{labels.phone}</Text><Text>{data.clientPhone || "—"}</Text></View>
          {(data.clientCompany ?? data.clientNif) ? (
            <>
              {data.clientCompany ? (
                <View style={styles.row}><Text style={styles.rowLabel}>{labels.company}</Text><Text>{data.clientCompany}</Text></View>
              ) : null}
              {data.clientNif ? (
                <View style={styles.row}><Text style={styles.rowLabel}>{labels.nif}</Text><Text>{data.clientNif}</Text></View>
              ) : null}
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.event}</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>{labels.title}</Text><Text>{data.eventTitle || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>{labels.date}</Text><Text>{data.eventDate || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>{labels.location}</Text><Text>{data.eventLocation || "—"}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>{labels.guests}</Text><Text>{data.guestCount || "—"}</Text></View>
        </View>

        {contactLines.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.contact}</Text>
            {contactLines.map((line, i) => (
              <Text key={i} style={styles.contactLine}>{line}</Text>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.servicesSelected}</Text>
          {data.services?.length
            ? data.services.map((s, i) => (
                <ServiceBlock key={i} service={s} labels={labels} locale={locale} />
              ))
            : <Text style={styles.listItem}>{labels.noServices}</Text>}
        </View>

        {data.optionalServices?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.optionsPresented}</Text>
            {data.optionalServices.map((s, i) => (
              <ServiceBlock key={i} service={s} labels={labels} locale={locale} />
            ))}
          </View>
        ) : null}

        {data.sections?.length
          ? data.sections.map((sec, i) => (
              <View key={i} style={styles.section}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                {sec.body.split(/\n+/).map((line, j) => (
                  <Text key={j} style={styles.paragraph}>{line.trim()}</Text>
                ))}
              </View>
            ))
          : null}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.rowLabel}>{labels.subtotal}</Text>
            <Text>{formatCurrency(data.subtotal, locale)}</Text>
          </View>
        </View>
      </Page>

      {footerParagraphs.length > 0 ? (
        <Page size="A4" style={styles.conditionsPage}>
          <Text style={styles.conditionsTitle}>{labels.generalTerms}</Text>
          {footerParagraphs.map((line, i) => (
            <View key={i} style={styles.numberedItem}>
              <Text>{i + 1}. {line}</Text>
            </View>
          ))}
        </Page>
      ) : null}
    </Document>
  )
}
