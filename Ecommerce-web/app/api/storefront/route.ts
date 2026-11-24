import { NextResponse } from 'next/server';

const CRM_CATALOG_ENDPOINT =
  process.env.CRM_CATALOG_API ||
  'http://187.124.132.7:5005/api/v1/store/public/catalog';

export async function GET() {
  try {
    const res = await fetch(CRM_CATALOG_ENDPOINT, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: 'CRM catalog sync unavailable' },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Catalog fetch failed' },
      { status: 500 }
    );
  }
}
