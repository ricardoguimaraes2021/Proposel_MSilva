import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Link,
} from "@react-pdf/renderer"
import type { ContractPdfData } from "@/lib/build-contract-pdf-data"

const colors = {
  brand: "#445044",
  brandSoft: "#808780",
  text: "#111411",
  muted: "#5A605A",
  border: "#E6E8E6",
  surface: "#FFFFFF",
  link: "#1155CC",
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.text,
    lineHeight: 1.45,
    backgroundColor: colors.surface,
  },
  /** Cabeçalho interior (páginas após a 1.ª) — estilo Prestígio */
  innerPageTop: {
    marginBottom: 14,
  },
  innerPageBrand: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: colors.text,
    marginBottom: 6,
  },
  ruleH: {
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
    width: "100%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  logo: {
    width: 72,
    height: 56,
    objectFit: "contain",
  },
  logoSpacer: {
    width: 72,
  },
  titleCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.1,
    color: colors.brandSoft,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  mainTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    textDecoration: "underline",
    textDecorationColor: colors.text,
  },
  partySection: {
    marginBottom: 10,
  },
  partyHeading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  partyBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#FAFAFA",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 10,
  },
  rowLabel: {
    color: colors.muted,
    width: "28%",
    paddingRight: 6,
  },
  rowValue: {
    flex: 1,
    textAlign: "left",
  },
  body: {
    fontSize: 10,
    marginBottom: 5,
    textAlign: "justify",
  },
  bodySmall: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 4,
    textAlign: "justify",
  },
  clauseTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    marginTop: 12,
    marginBottom: 5,
  },
  menuBlock: {
    marginVertical: 5,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
    backgroundColor: "#F9FAF9",
  },
  preformatted: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: "Helvetica",
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
  },
  manualLine: {
    borderBottomWidth: 0.6,
    borderBottomColor: colors.muted,
    minHeight: 14,
    marginTop: 2,
    marginBottom: 6,
    width: "100%",
  },
  manualHint: {
    fontSize: 7,
    color: colors.muted,
    fontFamily: "Helvetica-Oblique",
    marginBottom: 8,
  },
  footnote: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 4,
  },
  quoteRef: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 10,
  },
  signSection: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 8,
  },
  signLabel: {
    fontSize: 9,
    marginBottom: 4,
    color: colors.muted,
  },
  signLine: {
    borderBottomWidth: 0.6,
    borderBottomColor: colors.text,
    minHeight: 18,
    marginBottom: 4,
    width: "100%",
  },
  providerNameUnderSign: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  pageNo: {
    position: "absolute",
    bottom: 22,
    right: 40,
    fontSize: 9,
    color: colors.muted,
  },
})

function Paragraphs({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((p, i) => (
        <Text key={i} style={styles.body}>
          {p}
        </Text>
      ))}
    </>
  )
}

const labelsPt = {
  kind: "Tipo de evento",
  title: "Título",
  location: "Local",
  date: "Data",
  guests: "N.º estimado de convidados",
  name: "Nome",
  email: "Email",
  phone: "Telefone",
  company: "Empresa",
  nif: "NIF",
  address: "Morada",
  website: "Website",
}

const labelsEn = {
  kind: "Event type",
  title: "Title",
  location: "Venue",
  date: "Date",
  guests: "Estimated guest count",
  name: "Name",
  email: "Email",
  phone: "Phone",
  company: "Company",
  nif: "Tax ID",
  address: "Address",
  website: "Website",
}

export function ContractPdfDocument({ data }: { data: ContractPdfData }) {
  const L = data.legal
  const isPt = data.lang === "pt"
  const lab = isPt ? labelsPt : labelsEn

  const innerTop = (
    <View style={styles.innerPageTop}>
      <Text style={styles.innerPageBrand}>{data.companyName}</Text>
      <View style={styles.ruleH} />
    </View>
  )

  const providerRows: { label: string; value: string }[] = [
    { label: lab.company, value: data.companyName },
  ]
  if (data.companyTagline) {
    providerRows.push({
      label: isPt ? "Designação" : "Trading name",
      value: data.companyTagline,
    })
  }
  const c = data.companyContact
  if (c?.phone) providerRows.push({ label: lab.phone, value: c.phone })
  if (c?.website) providerRows.push({ label: lab.website, value: c.website })
  if (c?.address) providerRows.push({ label: lab.address, value: c.address })

  const clientRows: { label: string; value: string }[] = []
  const clientName =
    [data.clientName, data.clientCompany ? `(${data.clientCompany})` : ""].filter(Boolean).join(" ") ||
    "—"
  clientRows.push({ label: lab.name, value: clientName })
  if (data.clientNif) clientRows.push({ label: lab.nif, value: data.clientNif })
  if (data.clientPhone) clientRows.push({ label: lab.phone, value: data.clientPhone })
  if (data.clientEmail) clientRows.push({ label: lab.email, value: data.clientEmail })

  return (
    <Document title={data.documentTitle}>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleRow} wrap={false}>
          {data.companyLogoUrl ? (
            <Image src={data.companyLogoUrl} style={styles.logo} />
          ) : (
            <View style={styles.logoSpacer} />
          )}
          <View style={styles.titleCenter}>
            <Text style={styles.eyebrow}>{data.eyebrow}</Text>
            <Text style={styles.mainTitle}>{L.title}</Text>
          </View>
          {data.companyLogoUrl ? <View style={styles.logoSpacer} /> : <View style={styles.logoSpacer} />}
        </View>

        <View style={styles.partySection} wrap={false}>
          <Text style={styles.partyHeading}>{L.providerLabel}</Text>
          <View style={styles.partyBox}>
            {providerRows.map((r, i) => (
              <View key={i} style={styles.row} wrap={false}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowValue}>{r.value}</Text>
              </View>
            ))}
            {c?.email ? (
              <View style={styles.row} wrap={false}>
                <Text style={styles.rowLabel}>{lab.email}</Text>
                <View style={styles.rowValue}>
                  <Link src={`mailto:${c.email}`}>
                    <Text style={{ color: colors.link }}>{c.email}</Text>
                  </Link>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.partySection} wrap={false}>
          <Text style={styles.partyHeading}>{L.clientLabel}</Text>
          <View style={styles.partyBox}>
            {clientRows.map((r, i) => (
              <View key={i} style={styles.row} wrap={false}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowValue}>{r.value}</Text>
              </View>
            ))}
            <Text style={{ ...styles.body, marginTop: 6 }}>{data.clientAddressPlaceholder}</Text>
          </View>
        </View>

        <View style={styles.ruleH} />

        <Text style={{ ...styles.body, marginTop: 10 }}>{L.preamble}</Text>

        <Text style={styles.clauseTitle}>{L.clause1Heading}</Text>
        <Text style={styles.body}>1.1 {data.clause1Objective}</Text>
        <Text style={styles.manualHint}>{L.manualCorrectionHint}</Text>
        <View style={{ marginTop: 8 }}>
          <View style={styles.row} wrap={false}>
            <Text style={styles.rowLabel}>{lab.location}</Text>
            <Text style={styles.rowValue}>{data.eventLocationDisplay}</Text>
          </View>
          <View style={styles.manualLine} />

          <View style={styles.row} wrap={false}>
            <Text style={styles.rowLabel}>{lab.date}</Text>
            <Text style={styles.rowValue}>{data.eventDateDisplay}</Text>
          </View>
          <View style={styles.manualLine} />

          <View style={styles.row} wrap={false}>
            <Text style={styles.rowLabel}>{lab.guests}</Text>
            <Text style={styles.rowValue}>{data.guestCountDisplay}</Text>
          </View>
          <View style={styles.manualLine} />
          <Text style={styles.footnote}>{data.clause1GuestFootnote}</Text>
        </View>

        <View style={{ marginTop: 6 }}>
          <View style={styles.row} wrap={false}>
            <Text style={styles.rowLabel}>{lab.kind}</Text>
            <Text style={styles.rowValue}>{data.eventTypeLabel}</Text>
          </View>
          {data.eventTitle ? (
            <View style={styles.row} wrap={false}>
              <Text style={styles.rowLabel}>{lab.title}</Text>
              <Text style={styles.rowValue}>{data.eventTitle}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.body}>1.2 {L.clause1SecondPoint}</Text>

        <Text style={styles.clauseTitle}>{L.clause2Heading}</Text>
        <Paragraphs lines={[data.clause2Introduction]} />

        {data.serviceBlocks.map((block, i) => (
          <View key={i} style={styles.menuBlock} wrap={false}>
            <Text style={styles.preformatted}>{block}</Text>
          </View>
        ))}

        {data.optionalBlocks.length ? (
          <>
            <Text style={{ ...styles.clauseTitle, fontSize: 9, marginTop: 8 }}>
              {L.extrasOutsideQuoteHeading}
            </Text>
            {data.optionalBlocks.map((block, i) => (
              <View key={`opt-${i}`} style={[styles.menuBlock, { backgroundColor: "#FFFEF7" }]} wrap={false}>
                <Text style={styles.preformatted}>{block}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.clauseTitle}>{L.clause3Heading}</Text>
        <Paragraphs lines={data.clause3ValueParagraphs} />
        <View style={styles.manualLine} />

        <Text style={styles.quoteRef}>{data.quoteReferenceSummary}</Text>

        <Text style={styles.pageNo} fixed render={({ pageNumber }) => `${pageNumber}`} />
      </Page>

      <Page size="A4" style={styles.page}>
        {innerTop}

        <Text style={styles.clauseTitle}>{L.clause4Heading}</Text>
        <Paragraphs lines={L.clause4Paragraphs} />

        <Text style={styles.clauseTitle}>{L.clause5Heading}</Text>
        <Paragraphs lines={L.clause5Paragraphs} />

        <Text style={styles.clauseTitle}>{L.clause6Heading}</Text>
        <Paragraphs lines={L.clause6Paragraphs} />

        <Text style={styles.clauseTitle}>{L.clause7Heading}</Text>
        <Paragraphs lines={L.clause7Paragraphs} />

        <Text style={styles.clauseTitle}>{L.clause8Heading}</Text>
        <Paragraphs lines={L.clause8Paragraphs} />

        <Text style={styles.clauseTitle}>{L.clause9Heading}</Text>
        <Paragraphs lines={L.clause9Paragraphs} />

        <Text style={{ ...styles.body, marginTop: 14, fontFamily: "Helvetica-Oblique" }}>
          {L.clause10Closing}
        </Text>

        <View style={styles.signSection} wrap={false}>
          <Text style={styles.signTitle}>{L.acceptanceTitle}</Text>
          <Text style={styles.body}>{L.acceptanceDeclaration}</Text>

          <Text style={{ ...styles.signLabel, marginTop: 14 }}>{L.signerPlaceDate}</Text>
          <View style={styles.signLine} />

          <Text style={{ ...styles.signLabel, marginTop: 12 }}>{L.signerClient}</Text>
          <View style={styles.signLine} />

          <Text style={{ ...styles.providerNameUnderSign, marginTop: 12 }}>{data.companyName}</Text>
          <View style={styles.signLine} />
          <Text style={styles.signLabel}>{L.signerManagement}</Text>
        </View>
      </Page>
    </Document>
  )
}
