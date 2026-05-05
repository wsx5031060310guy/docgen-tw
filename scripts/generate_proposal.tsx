import React from 'react';
import { Page, Text, View, Document, StyleSheet, renderToFile } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginTop: 15, marginBottom: 10 },
  text: { fontSize: 12, marginBottom: 5 }
});

const MyDocument = () => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.header}>DocGen TW 商業提案</Text>
      <Text style={styles.sectionTitle}>1. 產品概覽</Text>
      <Text style={styles.text}>- DocGen TW: 自動化文件生成與流程管理系統。</Text>
      <Text style={styles.text}>- TinyCRM: 輕量級客戶關係管理，專注於 SME 銷售管道。</Text>
      <Text style={styles.text}>- StayMini: 短租管理解決方案，整合訂房與房務。</Text>
      
      <Text style={styles.sectionTitle}>2. 收費模式</Text>
      <Text style={styles.text}>- DocGen TW: 基礎版 $999/月, 進階版 $2999/月。</Text>
      <Text style={styles.text}>- TinyCRM: 專業版 $499/月/用戶。</Text>
      <Text style={styles.text}>- StayMini: 抽成制 (每訂單 5%) 或 訂閱制 $1999/月。</Text>
      
      <Text style={styles.sectionTitle}>3. 支付架構</Text>
      <Text style={styles.text}>- 藍新金流 (國內): 提供信用卡、ATM、超商支付，符合台灣在地法規。</Text>
      <Text style={styles.text}>- Stripe (國際): 支援全球主流信用卡、多元幣別，無縫串接跨境收款。</Text>
      
      <Text style={styles.sectionTitle}>4. 預期效益</Text>
      <Text style={styles.text}>- 營運效率: 自動化工作流減少 60% 人工文書處理時間。</Text>
      <Text style={styles.text}>- 財務模型: SaaS 訂閱制創造高毛利、穩定現金流。</Text>
    </Page>
  </Document>
);

renderToFile(<MyDocument />, '/Users/mike-hermes-ai/projects/DocGen-TW/public/Proposal.pdf');
