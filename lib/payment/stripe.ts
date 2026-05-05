import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  }
  return stripeClient;
}

export async function createCheckoutSession(input: {
  amountTwd: number;
  itemName: string;
  contractId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "twd",
          product_data: { name: input.itemName },
          unit_amount: input.amountTwd * 100,
        },
        quantity: 1,
      },
    ],
    metadata: input.contractId ? { contractId: input.contractId } : undefined,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}
