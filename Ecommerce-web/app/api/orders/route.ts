import { NextResponse } from 'next/server';

const CRM_API_ENDPOINT =
  process.env.CRM_INTERNAL_API ||
  process.env.NEXT_PUBLIC_CRM_API_URL ||
  'http://187.124.132.7:5005/api/v1/store/public/orders';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.clientName || !body.email || !body.phone) {
      return NextResponse.json(
        { success: false, message: 'Client name, email, and phone number are required.' },
        { status: 400 }
      );
    }

    // Call CRM Backend API
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
