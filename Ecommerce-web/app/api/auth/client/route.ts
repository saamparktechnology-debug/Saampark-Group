import { NextResponse } from 'next/server';

const CRM_PUBLIC_BASE = 'http://187.124.132.7:5005/api/v1/store/public';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || 'login';
    const targetUrl =
      action === 'otp'
        ? `${CRM_PUBLIC_BASE}/client-otp`
        : `${CRM_PUBLIC_BASE}/client-login`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
