import { NextResponse } from 'next/server';

const CRM_API_BASE =
  process.env.CRM_INTERNAL_API ||
  process.env.NEXT_PUBLIC_CRM_API_URL ||
  'http://187.124.132.7:5005/api/v1/store/public/orders';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'Order number is required.' },
        { status: 400 }
      );
    }

    const targetUrl = `${CRM_API_BASE}/${encodeURIComponent(orderNumber.trim())}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Order not found in CRM.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Order Query Error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to fetch order details.' },
      { status: 500 }
    );
  }
}
