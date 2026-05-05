import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 50 },
  title: { fontSize: 20, marginBottom: 20, textAlign: "center" },
  category: { fontSize: 10, marginBottom: 16, textAlign: "center", color: "#666" },
  clause: { fontSize: 12, marginBottom: 10, lineHeight: 1.5 },
  footer: { fontSize: 9, marginTop: 24, color: "#666" },
  legal: { fontSize: 8, marginTop: 12, color: "#999" },
});

interface ContractDoc {
  title: string;
  category: string;
  legalBasis: string[];
  clauses: string[];
  footer: string;
  disclaimer: string;
  generatedAt: string;
}

export const ContractTemplate = ({ document }: { document: ContractDoc }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{document.title}</Text>
      <Text style={styles.category}>{document.category}</Text>
      <View>
        {document.clauses.map((clause: string, i: number) => (
          <Text key={i} style={styles.clause}>
            {clause}
          </Text>
        ))}
      </View>
      <Text style={styles.footer}>{document.footer}</Text>
      <Text style={styles.legal}>
        法律依據：{document.legalBasis.join("、")}．Generated at {document.generatedAt}
      </Text>
      <Text style={styles.legal}>{document.disclaimer}</Text>
    </Page>
  </Document>
);
