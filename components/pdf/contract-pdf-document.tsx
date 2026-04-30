import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { ContractPdfData } from "@/lib/build-contract-pdf-data"

const colors = {
  brand: "#445044",
  text: "#111411",
  muted: "#5A605A",
  border: "#E6E8E6",
  surface: "#FFFFFF",
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.text,
    lineHeight: 1.45,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 12,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    color: colors.muted,
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  partyBlock: {
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: "#FAFAFA",
  },
  body: { fontSize: 9, marginBottom: 4, textAlign: "justify" },
  clauseTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginTop: 10,
    marginBottom: 4,
  },
  menuBlock: {
    marginVertical: 6,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.brand,
    backgroundColor: "#F9FAF9",
  },
  menuHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 4,
  },
  preformatted: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: "Helvetica",
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
  },
  signRow: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  dotted: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.text,
    marginTop: 20,
    minHeight: 12,
    width: "100%",
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

export function ContractPdfDocument({ data }: { data: ContractPdfData }) {
  const L = data.legal
  const partyALines = data.partyAText.split("\n").map((l) => l.trim()).filter(Boolean)
  const partyBLines = data.partyBText.split("\n").map((l) => l.trim()).filter(Boolean)

  return (
    <Document title={data.documentTitle}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{L.title}</Text>

        <Text style={styles.sectionLabel}>{L.betweenParties}</Text>

        <View style={styles.partyBlock}>
          <Paragraphs lines={partyALines} />
        </View>

        <Text style={{ ...styles.body, textAlign: "center", marginVertical: 6 }}>{L.and}</Text>

        <View style={styles.partyBlock}>
          <Paragraphs lines={partyBLines} />
        </View>

        <Text style={styles.body}>{L.preamble}</Text>

        <Text style={styles.clauseTitle}>{L.clause1Heading}</Text>
        <Text style={styles.body}>1. {data.clause1Objective}</Text>
        <Text style={styles.body}>2. {L.clause1SecondPoint}</Text>

        <Text style={styles.clauseTitle}>{L.clause2Heading}</Text>
        <Paragraphs lines={[data.clause2Introduction]} />

        {data.serviceBlocks.map((block, i) => (
          <View key={i} style={styles.menuBlock} wrap={false}>
            <Text style={styles.preformatted}>{block}</Text>
          </View>
        ))}

        {data.optionalBlocks.length > 0 ? (
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

        <Text style={{ ...styles.body, marginTop: 8, fontSize: 8, color: colors.muted }}>
          {data.quoteReferenceSummary}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.clauseTitle}>{L.clause3Heading}</Text>
        <Paragraphs lines={L.clause3Paragraphs} />

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

        <Text style={{ ...styles.body, marginTop: 16, fontFamily: "Helvetica-Oblique" }}>
          {L.clause9Closing}
        </Text>

        <View style={styles.signRow}>
          <Text style={styles.body}>{L.localDateLine}</Text>
          <View style={styles.dotted} />
          <Text style={{ ...styles.body, marginTop: 16 }}>{L.firstPartySigner}</Text>
          <View style={styles.dotted} />
          <Text style={{ ...styles.body, marginTop: 16 }}>{L.secondPartySigner}</Text>
          <View style={styles.dotted} />
        </View>
      </Page>
    </Document>
  )
}
