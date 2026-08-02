# 12 — Contact & Lead System

> Everything about how visitors contact Saampark, how leads are captured, and how inquiries are handled.

---

## Contact Channels

| Channel | STR | SCS |
|---------|-----|-----|
| WhatsApp | 9091518567 / 9091518569 | 8170082678 |
| Phone Call | 9091518567 / 9091518569 | 8170082678 |
| Landline | 03222464688 | 03222464688 |
| Email | saamparktechnologyresearch@gmail.com | saamparkconsultancyservice@gmail.com |
| Web Email | service@saamparktechnologyresearch.in | service@saamparkconsultancyservice.in |

---

## Contact Page Layout (`/contact`)

### Page Structure
```
[Hero] — "Let's Build Something Great Together"
[Contact Methods] — Phone, WhatsApp, Email cards (3 columns)
[Main Contact Form] — Full inquiry form
[Map] — Google Maps embed (Balichak, Debra)
[Address Block] — Full address details
[FAQs] — Common contact questions
```

### Contact Method Cards

**Card 1: WhatsApp (STR)**
- Icon: WhatsApp (green)
- Title: "WhatsApp STR"
- Number: 9091518567
- CTA: `[Chat on WhatsApp]` → `https://wa.me/919091518567`

**Card 2: WhatsApp (SCS)**
- Icon: WhatsApp (green)
- Title: "WhatsApp SCS"
- Number: 8170082678
- CTA: `[Chat on WhatsApp]` → `https://wa.me/918170082678`

**Card 3: Email**
- Icon: Mail (teal)
- Title: "Email Us"
- Addresses: both emails
- CTA: `[Send Email]`

---

## Contact Form — Full

### Fields

```tsx
interface ContactFormData {
  name: string;            // required, min 2 chars
  phone: string;           // required, 10-digit Indian mobile
  email: string;           // required, valid email
  businessName: string;    // optional
  entity: 'str' | 'scs' | 'not-sure';  // required
  serviceInterest: string; // dropdown, populated by entity choice
  budget: string;          // optional dropdown
  message: string;         // required, min 20 chars
  source: string;          // hidden, auto-populated (UTM / referrer)
}
```

### Form UI

```
[Full Name *]           [Phone Number *]
[Email Address *]       [Business Name]
[I'm interested in:    STR — Technology ◉  SCS — Consultancy ○  Not Sure ○]
[Service of Interest   ▼ (dropdown based on entity selection)]
[Budget Range          ▼]
[Your Message *                    ]
[          Submit — Get Free Quote  ]
Note: We respond within 24 hours.
```

### Service Interest Options

**If STR selected:**
- One Page Website
- Static Website
- Dynamic Website
- E-Commerce Website
- Android App
- iOS App
- Hybrid App
- Custom Software
- Other / Not Sure

**If SCS selected:**
- Social Media Management
- Meta Ads
- Google Ads
- Google Business Profile
- Video Creation
- Business Registration
- Other / Not Sure

### Budget Options
- Under ₹5,000
- ₹5,000 – ₹15,000
- ₹15,000 – ₹30,000
- ₹30,000 – ₹50,000
- ₹50,000+
- Flexible / Not Sure

---

## API Route — `/api/contact`

```ts
// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  businessName: z.string().optional(),
  entity: z.enum(['str', 'scs', 'not-sure']),
  serviceInterest: z.string(),
  budget: z.string().optional(),
  message: z.string().min(20),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const data = parsed.data;
  const resend = new Resend(process.env.RESEND_API_KEY);

  const toEmail = data.entity === 'scs'
    ? 'saamparkconsultancyservice@gmail.com'
    : 'saamparktechnologyresearch@gmail.com';

  await resend.emails.send({
    from: 'noreply@saampark.com',
    to: toEmail,
    subject: `New Inquiry — ${data.serviceInterest} — ${data.name}`,
    html: `
      <h2>New Website Inquiry</h2>
      <p><b>Name:</b> ${data.name}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Business:</b> ${data.businessName || 'Not provided'}</p>
      <p><b>Entity:</b> ${data.entity.toUpperCase()}</p>
      <p><b>Service:</b> ${data.serviceInterest}</p>
      <p><b>Budget:</b> ${data.budget || 'Not specified'}</p>
      <p><b>Message:</b> ${data.message}</p>
    `,
  });

  return NextResponse.json({ success: true });
}
```

---

## Lead Response SLA

| Inquiry Time | Target Response |
|-------------|----------------|
| 9am – 6pm (IST) | Within 2 hours |
| 6pm – 9pm (IST) | Within 4 hours |
| After 9pm | Next morning by 10am |
| Weekends | Within 6 hours |

---

## WhatsApp Quick Message Templates

For WhatsApp CTAs, pre-fill message:

**STR:**
```
https://wa.me/919091518567?text=Hi%20Saampark%2C%20I'm%20interested%20in%20[SERVICE].%20Please%20share%20more%20details.
```

**SCS:**
```
https://wa.me/918170082678?text=Hi%20SCS%2C%20I'm%20interested%20in%20[SERVICE].%20Please%20contact%20me.
```

---

## Google Maps

```html
<!-- Embed for contact page -->
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d..."
  width="100%"
  height="400"
  style="border:0;"
  allowfullscreen=""
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

**Address for Schema:**
```json
{
  "@type": "PostalAddress",
  "streetAddress": "Balichak (Station Road)",
  "addressLocality": "Debra",
  "addressRegion": "Paschim Medinipur, West Bengal",
  "postalCode": "721124",
  "addressCountry": "IN"
}
```
