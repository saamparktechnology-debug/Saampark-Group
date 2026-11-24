import React from 'react';
import { allServices } from '@/lib/data/services';

export function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Saampark Group',
    alternateName: ['STR', 'SCS', 'Saampark Technology', 'Saampark Consultancy', 'Saampark Group India'],
    url: 'https://www.saampark.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.saampark.com/?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Saampark Group',
    legalName: 'Saampark Technology & Research Private Limited',
    url: 'https://www.saampark.com',
    logo: 'https://www.saampark.com/assets/logos/logo-main-v2.png',
    image: 'https://www.saampark.com/assets/logos/logo-main-v2.png',
    description:
      'ISO 9001:2015 certified technology and consultancy group delivering website development, Android & iOS app development, custom ERP, Meta Ads, Google Ads, AI videos, and business legal registration.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Paschim Medinipur',
      addressRegion: 'West Bengal',
      addressCountry: 'IN',
      postalCode: '721101',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-7602058323',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Bengali', 'Hindi'],
      },
    ],
    sameAs: [
      'https://www.facebook.com/saamparkgroup',
      'https://www.linkedin.com/company/saamparkgroup',
      'https://www.instagram.com/saamparkgroup',
    ],
    subOrganization: [
      {
        '@type': 'Organization',
        name: 'Saampark Technology & Research Pvt. Ltd. (STR)',
        description: 'ISO 9001:2015 certified custom websites, native mobile applications, software ERPs, and AI systems.',
      },
      {
        '@type': 'Organization',
        name: 'Saampark Consultancy Service (SCS)',
        description: 'Certified digital marketing, Meta Ads, Google Ads management, creative AI videos, and legal business registration.',
      },
    ],
  };

  const professionalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Saampark Group — Web Development, App Development & Digital Marketing Agency',
    image: 'https://www.saampark.com/assets/logos/logo-main-v2.png',
    '@id': 'https://www.saampark.com/#organization',
    url: 'https://www.saampark.com',
    telephone: '+91-7602058323',
    priceRange: '₹499 - ₹250000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Paschim Medinipur',
      addressLocality: 'Medinipur',
      addressRegion: 'West Bengal',
      postalCode: '721101',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 22.4257,
      longitude: 87.3199,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '20:00',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1248',
      bestRating: '5',
      worstRating: '1',
    },
    knowsAbout: [
      'Full-Stack Website Development',
      'E-Commerce Web Portals',
      'React Native & Flutter Mobile Apps',
      'Custom ERP & Cloud Software',
      'Performance Meta Ads & Facebook Marketing',
      'Google Search & Display Ads Management',
      'Creative AI Video Production',
      'Pvt Ltd, GST & Trademark Legal Registration',
      'ISO 9001:2015 Quality Assurance',
    ],
  };

  // 39 Services ItemList & OfferCatalog for Google Search indexing
  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Saampark Group Digital Services Catalog',
    description: 'Complete catalog of 39 ISO 9001:2015 certified digital services starting at ₹499',
    numberOfItems: allServices.length,
    itemListElement: allServices.map((svc, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: svc.name,
        description: svc.description,
        url: `https://www.saampark.com${svc.href}`,
        image: svc.image ? `https://www.saampark.com${svc.image}` : 'https://www.saampark.com/assets/images/website-dev.jpg',
        provider: {
          '@type': 'Organization',
          name: svc.group === 'technology' ? 'Saampark Technology & Research Pvt. Ltd.' : 'Saampark Consultancy Service',
        },
        offers: {
          '@type': 'Offer',
          price: svc.startingPrice || 499,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          validFrom: '2026-01-01',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '86',
        },
      },
    })),
  };

  // Comprehensive FAQ Page Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does buying services through Saampark Group storefront work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can browse any of our 39 standardized digital services across Saampark Technology (STR) and Saampark Consultancy (SCS). Click "Add to Cart" or "Get a Quote", complete the checkout or consultation form, and our certified project team initiates kick-off within 24 hours with dedicated project milestone tracking.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I get 100% full source code and intellectual property (IP) rights?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, absolutely. Every custom website, mobile application, software ERP, and digital asset developed by Saampark Group is delivered with 100% intellectual property ownership and full commercial usage rights handed over to your company upon project sign-off. Zero vendor lock-in.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are Saampark Technology and Consultancy ISO 9001:2015 certified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Saampark Technology & Research Pvt. Ltd. (STR) and Saampark Consultancy Service (SCS) operate under internationally audited ISO 9001:2015 Quality Management Systems, ensuring institutional coding standards, stringent QA audits, and OWASP security compliance.',
        },
      },
      {
        '@type': 'Question',
        name: 'How fast can a website or mobile application be delivered?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Delivery timelines range from 3-5 days for Single-Page and Dynamic Business Sites, 7-12 days for E-Commerce portals and Hybrid Flutter Apps, to custom agile milestones for complex ERPs. You receive a staging server URL to preview live progress in real-time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I get customized features not listed in the standard packages?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! While our catalog standardizes the most popular corporate requirements starting from ₹499, we provide bespoke development for custom APIs, AI models, payment integrations, and ERP modules. You can use our interactive Cost Estimator or speak to our technical architect for a free scope blueprint.',
        },
      },
      {
        '@type': 'Question',
        name: 'What post-launch maintenance, hosting, and warranty support is provided?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All web and application projects include free warranty bug-fix support, SSL certification, server deployment assistance, and optional monthly maintenance plans covering 24/7 uptime monitoring, regular security patches, and database backups.',
        },
      },
    ],
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.saampark.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services Marketplace',
        item: 'https://www.saampark.com/#marketplace',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
