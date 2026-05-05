import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function saveSignature(contractId: string, base64Image: string): Promise<string> {
  const sigDir = path.join(process.cwd(), 'public', 'signatures');
  if (!fs.existsSync(sigDir)) {
    fs.mkdirSync(sigDir, { recursive: true });
  }

  const filename = `sig_${contractId}_${Date.now()}.png`;
  const filepath = path.join(sigDir, filename);
  
  const base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(filepath, base64Data, 'base64');
  
  const url = `/signatures/${filename}`;
  
  await prisma.contract.update({
    where: { id: contractId },
    data: { 
      signatureUrl: url,
      signingStatus: 'SIGNED'
    }
  });

  return url;
}

export async function generateContractPdf(contractId: string, signatureUrl: string) {
    // PDF generation logic placeholder using libraries like pdf-lib or puppeteer
    // Integration would proceed here.
    return `/contracts/contract_${contractId}.pdf`;
}
