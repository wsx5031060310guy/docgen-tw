import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  section: { margin: 10, padding: 10 },
  title: { fontSize: 24, marginBottom: 10 },
  text: { fontSize: 12, marginBottom: 5 }
});

export const FreelanceContract = ({ contractor, client, date }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>接案合約</Text>
        <Text style={styles.text}>承攬人: {contractor}</Text>
        <Text style={styles.text}>委任人: {client}</Text>
        <Text style={styles.text}>日期: {date}</Text>
      </View>
    </Page>
  </Document>
);
