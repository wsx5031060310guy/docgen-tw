export type ContractPlan = {
  code: string;
  name: string;
  amount: number;
  description: string;
};

export const CONTRACT_PLANS: Record<string, ContractPlan> = {
  single: {
    code: "single",
    name: "單份合約解鎖",
    amount: 99,
    description: "解鎖此份合約 PDF 下載 + 永久保存",
  },
  pack: {
    code: "pack",
    name: "模板包 (10 份)",
    amount: 499,
    description: "10 份合約解鎖額度 + 客製化條款編輯",
  },
  pro: {
    code: "pro",
    name: "Pro 月訂閱",
    amount: 299,
    description: "無限制下載 + 簽約存證 + 法律顧問問答",
  },
};

export function getPlan(code: string): ContractPlan | null {
  return CONTRACT_PLANS[code] ?? null;
}
