export interface PricableLineItem {
  serviceId: string;
  name: string;
  unitPrice: number;
  qty: number;
  priceType?: string;
  deliveryDays?: string;
}

export interface OrderCalculation {
  billableItems: PricableLineItem[];
  quoteOnlyCount: number;
  baseSubtotal: number;
  urgencyFee: number;
  grossSubtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  isIntraState: boolean;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  gstType: string;
  totalAmount: number;
}

export function sanitizeUnitPrice(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

export function sanitizeQuantity(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? 1), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99, Math.round(n));
}

export function calculateOrderTotals(params: {
  items: Array<{
    serviceId: string;
    name: string;
    price: number | null | undefined;
    qty?: number;
    quantity?: number;
    priceType?: string;
    deliveryDays?: number | string;
  }>;
  couponPercent?: number;
  state?: string;
  urgency?: string;
}): OrderCalculation {
  const billableItems: PricableLineItem[] = [];
  let quoteOnlyCount = 0;

  for (const raw of params.items || []) {
    const unitPrice = sanitizeUnitPrice(raw.price);
    const qty = sanitizeQuantity(raw.qty ?? raw.quantity ?? 1);
    if (unitPrice <= 0) {
      quoteOnlyCount += 1;
      continue;
    }
    billableItems.push({
      serviceId: String(raw.serviceId || ''),
      name: String(raw.name || 'Service Package'),
      unitPrice,
      qty,
      priceType: raw.priceType || 'one-time',
      deliveryDays: raw.deliveryDays ? String(raw.deliveryDays) : '3-5 Days',
    });
  }

  const baseSubtotal = billableItems.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0
  );

  const isPriority = String(params.urgency || 'Standard').toLowerCase() === 'priority';
  const urgencyFee = isPriority && baseSubtotal > 0 ? Math.round(baseSubtotal * 0.1) : 0;
  const grossSubtotal = baseSubtotal + urgencyFee;

  const pct =
    typeof params.couponPercent === 'number' && Number.isFinite(params.couponPercent)
      ? Math.max(0, Math.min(90, params.couponPercent))
      : 0;
  const discountAmount = pct > 0 ? Math.min(grossSubtotal, Math.round((grossSubtotal * pct) / 100)) : 0;
  const taxableAmount = Math.max(0, grossSubtotal - discountAmount);

  const isIntraState = String(params.state || 'West Bengal')
    .toLowerCase()
    .includes('west bengal');

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let gstAmount = 0;
  let gstType = 'IGST (18%)';

  if (isIntraState) {
    cgstAmount = Math.round(taxableAmount * 0.09);
    sgstAmount = Math.round(taxableAmount * 0.09);
    gstAmount = cgstAmount + sgstAmount;
    gstType = 'CGST (9%) + SGST (9%)';
  } else {
    igstAmount = Math.round(taxableAmount * 0.18);
    gstAmount = igstAmount;
    gstType = 'IGST (18%)';
  }

  const totalAmount = taxableAmount + gstAmount;

  return {
    billableItems,
    quoteOnlyCount,
    baseSubtotal,
    urgencyFee,
    grossSubtotal,
    discountPercent: pct,
    discountAmount,
    taxableAmount,
    isIntraState,
    cgstAmount,
    sgstAmount,
    igstAmount,
    gstAmount,
    gstType,
    totalAmount,
  };
}
