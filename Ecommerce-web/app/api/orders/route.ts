import { NextResponse } from 'next/server';

const CRM_PUBLIC_BASE = 'http://187.124.132.7:5005/api/v1/store/public';
const CRM_API_ENDPOINT =
  process.env.CRM_INTERNAL_API ||
  process.env.NEXT_PUBLIC_CRM_API_URL ||
  `${CRM_PUBLIC_BASE}/orders`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email query parameter is required.' },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${CRM_PUBLIC_BASE}/client-orders?email=${encodeURIComponent(email.trim())}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch client orders.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.clientName || !body.email || !body.phone) {
      return NextResponse.json(
        { success: false, message: 'Client name, email, and phone number are required.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one priced service package is required to place an order.' },
        { status: 400 }
      );
    }

    const rawTotal = Number(body.totalAmount);
    if (!Number.isFinite(rawTotal) || rawTotal <= 0) {
      return NextResponse.json(
        { success: false, message: 'Order total must be greater than ₹0.' },
        { status: 400 }
      );
    }

    const response = await fetch(CRM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to submit order to CRM backend.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Order Submission Error:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Internal server error while processing order.',
      },
      { status: 500 }
    );
  }
}
