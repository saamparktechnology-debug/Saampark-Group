import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In a real app, integrate with Resend, SendGrid, or store in DB here
    console.log('New Contact Submission:', body);

    return NextResponse.json({ success: true, message: 'Message sent successfully.' }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Failed to send message.' }, { status: 500 });
  }
}
