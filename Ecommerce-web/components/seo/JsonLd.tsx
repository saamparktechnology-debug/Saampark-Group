import React from 'react';

export function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Saampark Group',
    alternateName: ['STR', 'SCS', 'Saampark Technology', 'Saampark Consultancy', 'Saampark Group India'],
    url: 'https://www.saampark.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.saampark.com/marketplace?search={search_term_string}',
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
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-7602058323',
        contactType: 'customer support',
        areaServed: 'IN',
        availableLanguage: ['English', 'Bengali', 'Hindi'],
      },
    ],
    subOrganization: [
      {
        '@type': 'Organization',
        name: 'Saampark Technology & Research Pvt. Ltd. (STR)',
        description: 'Website development, native mobile applications, enterprise software, and custom AI systems.',
      },
      {
        '@type': 'Organization',
        name: 'Saampark Consultancy Service (SCS)',
        description: 'Digital marketing, Meta Ads, Google Ads management, AI video production, and company legal registration.',
      },
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Saampark Group — Web Development, App Development & Marketing Agency',
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
      opens: '10:00',
      closes: '19:00',
    },
    knowsAbout: [
      'Website Development',
      'Mobile App Development',
      'E-commerce Development',
      'React Native & Next.js',
      'Custom ERP & CRM',
      'Digital Marketing & SEO',
      'Meta Ads & Facebook Ads',
      'Google Search Ads',
      'AI Video Creation',
      'GST & Business Registration',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What services does Saampark Group offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Saampark Group operates two divisions: STR (Saampark Technology & Research) providing website development, Android/iOS app development, custom ERP software, and AI integration; and SCS (Saampark Consultancy Service) providing digital marketing, Meta Ads, Google Ads, AI video creation, and business legal registration.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does website development cost with Saampark?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Saampark offers website packages starting from ₹499 for single-page business sites, up to custom e-commerce and enterprise web portals with complete source code delivery and ISO 9001:2015 quality standards.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where is Saampark Group located?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Saampark Group is based in West Bengal, India, serving clients locally across Paschim Medinipur, Kolkata, and pan-India with dedicated online and on-site support.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are Saampark services ISO certified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Saampark Technology & Research Pvt. Ltd. is an ISO 9001:2015 certified company delivering high-standard software, web applications, and marketing solutions.',
        },
      },
    ],
  };

  const sitelinksSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SiteNavigationElement',
        '@id': 'https://www.saampark.com/#nav-marketplace',
        name: 'Web & App Storefront',
        url: 'https://www.saampark.com/marketplace',
        description: 'Browse packages for web development, app development, marketing & legal setup starting at ₹499.',
      },
      {
        '@type': 'SiteNavigationElement',
        '@id': 'https://www.saampark.com/#nav-str',
        name: 'Saampark Technology (STR)',
        url: 'https://www.saampark.com/str',
        description: 'Custom websites, native mobile applications, cloud infrastructure & enterprise ERP solutions.',
      },
      {
        '@type': 'SiteNavigationElement',
        '@id': 'https://www.saampark.com/#nav-scs',
        name: 'Saampark Consultancy (SCS)',
        url: 'https://www.saampark.com/scs',
        description: 'Digital marketing, Meta Ads campaigns, AI videos, and company GST legal registration.',
      },
      {
        '@type': 'SiteNavigationElement',
        '@id': 'https://www.saampark.com/#nav-about',
        name: 'About Saampark Group',
        url: 'https://www.saampark.com/about',
        description: 'ISO 9001:2015 corporate profile, team, certification, and business history.',
      },
      {
        '@type': 'SiteNavigationElement',
        '@id': 'https://www.saampark.com/#nav-contact',
        name: 'Contact & Free Consultation',
        url: 'https://www.saampark.com/contact',
        description: 'Talk with tech & business experts for free project estimation and advice.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sitelinksSchema) }}
      />
    </>
  );
}
