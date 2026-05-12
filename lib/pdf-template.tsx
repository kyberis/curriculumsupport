import ReactPDF, {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#0d1117",
  },
  contactLine: {
    fontSize: 9,
    color: "#555",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    color: "#0d1117",
    borderBottomWidth: 1,
    borderBottomColor: "#d0d0d0",
    paddingBottom: 3,
  },
  jobTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  jobDate: {
    fontSize: 9,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 3,
  },
  bullet: {
    fontSize: 10,
    marginLeft: 12,
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 4,
  },
  skillsText: {
    fontSize: 10,
    marginBottom: 2,
  },
});

interface CvSection {
  type: "name" | "contact" | "section" | "job" | "date" | "bullet" | "text";
  content: string;
}

function parseMarkdownToCvSections(markdown: string): CvSection[] {
  const lines = markdown.split("\n");
  const sections: CvSection[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      sections.push({ type: "name", content: trimmed.replace(/^#\s+/, "") });
    } else if (trimmed.startsWith("**") && trimmed.includes("|")) {
      sections.push({
        type: "contact",
        content: trimmed.replace(/\*\*/g, ""),
      });
    } else if (trimmed.startsWith("## ")) {
      sections.push({
        type: "section",
        content: trimmed.replace(/^##\s+/, ""),
      });
    } else if (trimmed.startsWith("### ")) {
      sections.push({
        type: "job",
        content: trimmed.replace(/^###\s+/, "").replace(/\*\*/g, ""),
      });
    } else if (trimmed.startsWith("*") && trimmed.endsWith("*") && trimmed.includes("–")) {
      sections.push({
        type: "date",
        content: trimmed.replace(/^\*+|\*+$/g, ""),
      });
    } else if (trimmed.startsWith("- ")) {
      sections.push({
        type: "bullet",
        content: trimmed.replace(/^-\s+/, ""),
      });
    } else {
      sections.push({ type: "text", content: trimmed });
    }
  }

  return sections;
}

function CvDocument({ markdown }: { markdown: string }) {
  const sections = parseMarkdownToCvSections(markdown);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {sections.map((section, i) => {
          switch (section.type) {
            case "name":
              return (
                <Text key={i} style={styles.name}>
                  {section.content}
                </Text>
              );
            case "contact":
              return (
                <Text key={i} style={styles.contactLine}>
                  {section.content}
                </Text>
              );
            case "section":
              return (
                <Text key={i} style={styles.sectionTitle}>
                  {section.content}
                </Text>
              );
            case "job":
              return (
                <Text key={i} style={styles.jobTitle}>
                  {section.content}
                </Text>
              );
            case "date":
              return (
                <Text key={i} style={styles.jobDate}>
                  {section.content}
                </Text>
              );
            case "bullet":
              return (
                <Text key={i} style={styles.bullet}>
                  •{"  "}
                  {section.content}
                </Text>
              );
            case "text":
              return (
                <Text key={i} style={styles.paragraph}>
                  {section.content}
                </Text>
              );
            default:
              return null;
          }
        })}
      </Page>
    </Document>
  );
}

export async function renderCvPdf(markdown: string): Promise<ArrayBuffer> {
  const stream = await ReactPDF.renderToStream(
    <CvDocument markdown={markdown} />
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const buf = Buffer.concat(chunks);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
