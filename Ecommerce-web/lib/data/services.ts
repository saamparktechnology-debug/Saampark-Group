// ============================================================
// SAAMPARK GROUP — COMPLETE SERVICE DATA
// Extracted from official brochures (STR flyer + SCS flyer)
// Source of truth: /docs/07-technology-intelligence.md
//                  /docs/08-business-intelligence.md
// ============================================================

export type Entity = 'str' | 'scs' | 'research' | 'consultancy';
export type Sector = 
  | 'web-development' 
  | 'web-design' 
  | 'app-development' 
  | 'ai-integration' 
  | 'software-erp'
  | 'digital-marketing'
  | 'ads-management'
  | 'video-animation'
  | 'seo-local'
  | 'market-research'
  | 'financial-research'
  | 'ux-research'
  | 'business-legal'
  | 'financial-tax'
  | 'hr-operations';
export type PriceType = 'one-time' | 'monthly' | 'weekly' | 'on-request';
export type ServiceCategory =
  | 'website'
  | 'app'
  | 'software'
  | 'specialized-website'
  | 'social-media'
  | 'meta-ads'
  | 'google-ads'
  | 'google-business'
  | 'video-ai'
  | 'business-legal';

// ─────────────────────────────────────────
// AUTHORITATIVE HIERARCHY DEFINITIONS
// ─────────────────────────────────────────
export type ServiceGroup = 'technology' | 'research' | 'consultancy';

export type PrimaryCategory =
  // Technology
  | 'web-services'
  | 'application-services'
  | 'software-services'
  | 'ai-services'
  | 'maintenance-services'
  | 'hosting-services'
  // Research
  | 'online-related-services'
  | 'trading-related-services'
  | 'management-related-services'
  | 'stock-market'
  // Consultancy
  | 'graphic-design'
  | 'ai-video'
  | 'digital-marketing'
  | 'loan'
  | 'insurance'
  | 'education'
  | 'legal';

export interface GroupMetadata {
  id: ServiceGroup;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
}

export interface CategoryMetadata {
  id: PrimaryCategory;
  group: ServiceGroup;
  name: string;
  capacity: string;
  icon: string;
}

export const SERVICE_GROUPS: GroupMetadata[] = [
  {
    id: 'technology',
    name: 'Saampark Technology',
    shortName: 'Technology',
    description: 'Web development, mobile apps, custom software systems, AI automation, maintenance, and hosting',
    icon: 'Globe',
    color: '#00B4A6',
  },
  {
    id: 'research',
    name: 'Saampark Research',
    shortName: 'Research',
    description: 'Online related services, trading, management research, and stock market analysis',
    icon: 'LineChart',
    color: '#8B5CF6',
  },
  {
    id: 'consultancy',
    name: 'Saampark Consultancy',
    shortName: 'Consultancy',
    description: 'Graphic design, AI video, digital marketing, loans, insurance, education, and legal',
    icon: 'Briefcase',
    color: '#4CAF50',
  },
];

export const SERVICE_CATEGORIES: CategoryMetadata[] = [
  // ── Technology ──
  { id: 'web-services', group: 'technology', name: 'Web Services', capacity: '10+', icon: 'Globe' },
  { id: 'application-services', group: 'technology', name: 'Application Services', capacity: '10+', icon: 'Smartphone' },
  { id: 'software-services', group: 'technology', name: 'Software Services', capacity: '10+', icon: 'Cpu' },
  { id: 'ai-services', group: 'technology', name: 'AI Services', capacity: '5+', icon: 'Bot' },
  { id: 'maintenance-services', group: 'technology', name: 'Maintenance Services', capacity: '10+', icon: 'Wrench' },
  { id: 'hosting-services', group: 'technology', name: 'Hosting & Server Services', capacity: '10+', icon: 'Server' },

  // ── Research ──
  { id: 'online-related-services', group: 'research', name: 'Online Related Services', capacity: '10+', icon: 'Search' },
  { id: 'trading-related-services', group: 'research', name: 'Trading Related Services', capacity: '10+', icon: 'TrendingUp' },
  { id: 'management-related-services', group: 'research', name: 'Management Related Services', capacity: '10+', icon: 'PieChart' },
  { id: 'stock-market', group: 'research', name: 'Stock Market', capacity: 'Expandable', icon: 'BarChart3' },

  // ── Consultancy ──
  { id: 'graphic-design', group: 'consultancy', name: 'Graphic Design', capacity: 'Expandable', icon: 'Palette' },
  { id: 'ai-video', group: 'consultancy', name: 'AI Video', capacity: 'Expandable', icon: 'Video' },
  { id: 'digital-marketing', group: 'consultancy', name: 'Digital Marketing', capacity: 'Expandable', icon: 'Megaphone' },
  { id: 'loan', group: 'consultancy', name: 'Loan', capacity: 'Expandable', icon: 'Coins' },
  { id: 'insurance', group: 'consultancy', name: 'Insurance', capacity: 'Expandable', icon: 'ShieldCheck' },
  { id: 'education', group: 'consultancy', name: 'Education', capacity: 'Expandable', icon: 'GraduationCap' },
  { id: 'legal', group: 'consultancy', name: 'Legal', capacity: 'Expandable', icon: 'Scale' },
];

export interface Service {
  id: string;
  group: ServiceGroup;
  primaryCategory: PrimaryCategory;
  entity: Entity;
  category: ServiceCategory;
  sector: Sector;
  name: string;
  shortName: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  startingPrice: number | null;
  priceType: PriceType;
  deliveryDays: number | null;
  isPopular: boolean;
  isFeatured: boolean;
  badge?: string;
  color: string;
  slug: string;
  href: string;
  icon: string; // lucide icon name
  image?: string;
}

// ─────────────────────────────────────────
// STR — SAAMPARK TECHNOLOGY SERVICES
// ─────────────────────────────────────────

export const strServices: Service[] = [
  // ── Web Services (4) ──────────────────
  {
    id: 'str-web-onepage',
    group: 'technology', primaryCategory: 'web-services',
    entity: 'str',
    category: 'website', sector: 'web-development',
    name: 'One Page Website',
    shortName: 'One Page',
    description: 'Perfect for personal brands, portfolios, and small businesses. Everything on a single, beautiful scrolling page.',
    features: [
      'Personal / Portfolio / Small Business',
      'Mobile Responsive Design',
      'Basic SEO Setup',
      'Contact Form',
      'Hosting Setup Guidance',
      'Social Media Integration',
      'Google Maps Integration',
    ],
    notIncluded: ['Admin Panel', 'Database'],
    startingPrice: 1999,
    priceType: 'one-time',
    deliveryDays: 5,
    isPopular: false,
    isFeatured: true,
    badge: '⚡ Special Offer',
    color: '#00B4A6',
    slug: 'one-page-website',
    href: '/technology/web-development/one-page-website',
    icon: 'Globe', image: '/assets/images/services/str_web_onepage.png',
  },
  {
    id: 'str-web-static',
    group: 'technology', primaryCategory: 'web-services',
    entity: 'str',
    category: 'website', sector: 'web-development',
    name: 'Static Website',
    shortName: 'Static',
    description: 'A professional multi-page website to establish your online presence with a company profile.',
    features: [
      'Company Profile / Portfolio / Business Info',
      'Up to 5 Pages',
      'Custom Design',
      'Mobile Responsive',
      'Google Analytics Integration',
      'Basic On-Page SEO',
      'Sitemap & robots.txt',
    ],
    startingPrice: 3999,
    priceType: 'one-time',
    deliveryDays: 7,
    isPopular: true,
    isFeatured: true,
    color: '#1E90FF',
    slug: 'static-website',
    href: '/technology/web-development/static-website',
    icon: 'Layout', image: '/assets/images/services/str_web_dynamic.png',
  },
  {
    id: 'str-web-dynamic',
    group: 'technology', primaryCategory: 'web-services',
    entity: 'str',
    category: 'website', sector: 'web-development',
    name: 'Dynamic Website',
    shortName: 'Dynamic',
    description: 'Full-featured website with admin panel, database, and complete management system.',
    features: [
      'Admin Panel (CMS)',
      'Database Integration (MySQL)',
      'Complete Management System',
      'User Login System',
      'Dynamic Content Pages',
      'Search Functionality',
      'Contact & Inquiry Management',
      'Newsletter Integration',
      'Advanced SEO Setup',
    ],
    notIncluded: ['Payment Gateway (add-on)', 'Mobile App (separate)'],
    startingPrice: 11999,
    priceType: 'one-time',
    deliveryDays: 15,
    isPopular: true,
    isFeatured: true,
    badge: '🔥 Most Popular',
    color: '#F4511E',
    slug: 'dynamic-website',
    href: '/technology/web-development/dynamic-website',
    icon: 'Zap', image: '/assets/images/services/str_web_dynamic.png',
  },
  {
    id: 'str-web-ecommerce',
    group: 'technology', primaryCategory: 'web-services',
    entity: 'str',
    category: 'website', sector: 'web-development',
    name: 'E-Commerce Website',
    shortName: 'E-Commerce',
    description: 'Complete online store with payment gateway, inventory, and order management.',
    features: [
      'Online Store with Product Catalog',
      'Customer Login & Account',
      'Payment Gateway (Razorpay / PayU)',
      'Order Management System',
      'Product Management',
      'Inventory Tracking',
      'Invoice Generation',
      'Cart & Wishlist',
      'Product Search & Filter',
      'Admin Dashboard & Analytics',
    ],
    startingPrice: 21999,
    priceType: 'one-time',
    deliveryDays: 25,
    isPopular: false,
    isFeatured: true,
    badge: '💎 Enterprise',
    color: '#4CAF50',
    slug: 'ecommerce-website',
    href: '/technology/web-development/ecommerce-website',
    icon: 'ShoppingCart', image: '/assets/images/services/str_web_ecommerce.png',
  },

  // ── Application Services (3) ──────────────────────
  {
    id: 'str-app-android',
    group: 'technology', primaryCategory: 'application-services',
    entity: 'str',
    category: 'app', sector: 'app-development',
    name: 'Android App Development',
    shortName: 'Android App',
    description: 'Native Android application built with Kotlin for your business needs.',
    features: [
      'Native Android (Kotlin/Java)',
      'Custom UI/UX Design',
      'API Integration',
      'Push Notifications',
      'Google Play Store Publishing',
      '30-Day Post-Launch Support',
    ],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    color: '#3DDC84',
    slug: 'android-app',
    href: '/technology/app-development/android',
    icon: 'Smartphone', image: '/assets/images/services/str_app_android.png',
  },
  {
    id: 'str-app-ios',
    group: 'technology', primaryCategory: 'application-services',
    entity: 'str',
    category: 'app', sector: 'app-development',
    name: 'iOS App Development',
    shortName: 'iOS App',
    description: 'Native iOS application built with Swift for iPhone and iPad users.',
    features: [
      'Native iOS (Swift)',
      'Custom UI/UX Design',
      'API Integration',
      'Push Notifications',
      'App Store Publishing',
      '30-Day Post-Launch Support',
    ],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: null,
    isPopular: false,
    isFeatured: false,
    color: '#1C1C1E',
    slug: 'ios-app',
    href: '/technology/app-development/ios',
    icon: 'Smartphone',
  },
  {
    id: 'str-app-hybrid',
    group: 'technology', primaryCategory: 'application-services',
    entity: 'str',
    category: 'app', sector: 'app-development',
    name: 'Hybrid Mobile App',
    shortName: 'Hybrid App',
    description: 'Cross-platform app (Flutter) for Android & iOS from a single, cost-effective codebase.',
    features: [
      'Android + iOS (Flutter)',
      'Single Codebase',
      'Custom UI/UX Design',
      'API Integration',
      'Both Store Publishing',
      'Cost Effective vs. 2 Native Apps',
    ],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    badge: '⚡ Best Value',
    color: '#54C5F8',
    slug: 'hybrid-app',
    href: '/technology/app-development/hybrid',
    icon: 'Layers', image: '/assets/images/services/str_app_android.png',
  },

  // ── Software Services (8) ──────────────────
  {
    id: 'str-spec-hotel',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'specialized-website', sector: 'software-erp',
    name: 'Hotel Management Website', shortName: 'Hotel',
    description: 'Complete hotel and hospitality management system with booking.',
    features: ['Room Management', 'Online Booking', 'Guest Portal', 'Invoice', 'Housekeeping'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: false, isFeatured: false,
    color: '#F5A623', slug: 'hotel-management', href: '/technology/specialized/hotel-management', icon: 'Building2',
  },
  {
    id: 'str-spec-hospital',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'specialized-website', sector: 'software-erp',
    name: 'Hospital Management System', shortName: 'Hospital',
    description: 'Comprehensive healthcare management for hospitals and clinics.',
    features: ['Patient Records', 'Doctor Schedule', 'Appointment Booking', 'Billing', 'Lab Reports'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: true, isFeatured: false,
    color: '#EF4444', slug: 'hospital-management', href: '/technology/specialized/hospital-management', icon: 'Heart',
  },
  {
    id: 'str-spec-school',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'specialized-website', sector: 'software-erp',
    name: 'School Management System', shortName: 'School',
    description: 'End-to-end school management with student portal, fees, attendance.',
    features: ['Student Portal', 'Fee Management', 'Attendance', 'Timetable', 'Result Management'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: true, isFeatured: false,
    color: '#8B5CF6', slug: 'school-management', href: '/technology/specialized/school-management', icon: 'GraduationCap',
  },
  {
    id: 'str-spec-elearning',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'specialized-website', sector: 'software-erp',
    name: 'E-Learning Platform', shortName: 'E-Learning',
    description: 'Online education platform with courses, quizzes, and certificates.',
    features: ['Course Management', 'Video Streaming', 'Quiz System', 'Certificate', 'Payment'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: false, isFeatured: false,
    color: '#EC4899', slug: 'elearning-platform', href: '/technology/specialized/elearning', icon: 'BookOpen',
  },
  {
    id: 'str-spec-realestate',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'specialized-website', sector: 'software-erp',
    name: 'Real Estate Website', shortName: 'Real Estate',
    description: 'Property listing portal with search, filters, and agent management.',
    features: ['Property Listings', 'Advanced Search', 'Agent Portal', 'Inquiry Management', 'Virtual Tours'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: false, isFeatured: false,
    color: '#F59E0B', slug: 'real-estate', href: '/technology/specialized/real-estate', icon: 'Home',
  },
  {
    id: 'str-spec-restaurant',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'specialized-website', sector: 'software-erp',
    name: 'Restaurant & Food Ordering', shortName: 'Restaurant',
    description: 'Online food ordering system with menu, cart, and delivery management.',
    features: ['Online Menu', 'Order Management', 'Table Booking', 'Delivery Tracking', 'Payment Gateway'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: false, isFeatured: false,
    color: '#EF4444', slug: 'restaurant', href: '/technology/specialized/restaurant', icon: 'Utensils',
  },
  {
    id: 'str-spec-erp',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'software', sector: 'software-erp',
    name: 'ERP Software', shortName: 'ERP',
    description: 'Enterprise Resource Planning for complete business operations management.',
    features: ['Finance', 'HR & Payroll', 'Inventory', 'Sales & CRM', 'Reporting', 'Multi-Branch'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: true, isFeatured: true,
    badge: '🏢 Enterprise',
    color: '#1E90FF', slug: 'erp-software', href: '/technology/software/erp', icon: 'Database',
  },
  {
    id: 'str-spec-crm',
    group: 'technology', primaryCategory: 'software-services',
    entity: 'str', category: 'software', sector: 'software-erp',
    name: 'CRM Software', shortName: 'CRM',
    description: 'Customer Relationship Management system to grow and retain your client base.',
    features: ['Lead Management', 'Client Tracking', 'Follow-up Reminders', 'Sales Pipeline', 'Analytics'],
    startingPrice: null, priceType: 'on-request', deliveryDays: null,
    isPopular: false, isFeatured: false,
    color: '#00B4A6', slug: 'crm-software', href: '/technology/software/crm', icon: 'Users',
  },

  // ── Maintenance Services (2) ──────────────────
  {
    id: 'str-maint-website',
    group: 'technology', primaryCategory: 'maintenance-services',
    entity: 'str', category: 'website', sector: 'web-development',
    name: 'Website Maintenance & AMC', shortName: 'Web AMC',
    description: 'Complete annual website maintenance, daily backups, speed optimization, and security monitoring.',
    features: ['Regular Backups', 'Security Patching', 'Uptime Monitoring', 'Content Updates', 'Bug Fixing', 'Speed Optimization'],
    startingPrice: 999, priceType: 'monthly', deliveryDays: null,
    isPopular: true, isFeatured: true, badge: '🛠️ AMC Managed',
    color: '#00B4A6', slug: 'website-maintenance', href: '/technology/web-development/one-page-website', icon: 'Wrench',
  },
  {
    id: 'str-maint-app',
    group: 'technology', primaryCategory: 'maintenance-services',
    entity: 'str', category: 'app', sector: 'app-development',
    name: 'Mobile App Support & AMC', shortName: 'App AMC',
    description: 'Ongoing Android and iOS mobile application support, API maintenance, and OS compatibility updates.',
    features: ['API Maintenance', 'OS Compatibility Updates', 'Crash Reporting & Fixes', 'Store Compliance', 'Performance Monitoring'],
    startingPrice: 2499, priceType: 'monthly', deliveryDays: null,
    isPopular: false, isFeatured: false,
    color: '#3DDC84', slug: 'app-maintenance', href: '/technology/app-development/android', icon: 'Wrench',
  },

  // ── Hosting & Server Services (2) ──────────────────
  {
    id: 'str-host-cloud',
    group: 'technology', primaryCategory: 'hosting-services',
    entity: 'str', category: 'website', sector: 'web-development',
    name: 'High Performance NVMe Cloud Hosting', shortName: 'Cloud Host',
    description: 'Lightning-fast LiteSpeed NVMe SSD cloud web hosting with free SSL, CDN, and automatic daily backups.',
    features: ['NVMe SSD Storage', 'Free SSL Certificate', 'Global CDN Integration', '99.9% Uptime Guarantee', 'Unmetered Bandwidth', 'cPanel / Control Panel'],
    startingPrice: 1499, priceType: 'monthly', deliveryDays: 1,
    isPopular: true, isFeatured: true, badge: '🚀 99.9% Uptime',
    color: '#1E90FF', slug: 'cloud-hosting', href: '/technology/web-development/static-website', icon: 'Server',
  },
  {
    id: 'str-host-domain',
    group: 'technology', primaryCategory: 'hosting-services',
    entity: 'str', category: 'website', sector: 'web-development',
    name: 'Domain Registration & Managed DNS', shortName: 'Domain & DNS',
    description: 'Secure domain name registration (.com, .in, .co.in, .org) with DNSSEC protection and free privacy lock.',
    features: ['.com / .in / .org Extensions', 'Managed DNS Records', 'DNSSEC Protection', 'Domain Theft Protection', 'Auto-Renewal Support'],
    startingPrice: 799, priceType: 'one-time', deliveryDays: 1,
    isPopular: false, isFeatured: false,
    color: '#F4511E', slug: 'domain-registration', href: '/technology/web-development/static-website', icon: 'Globe',
  },
];

// ─────────────────────────────────────────
// SCS — SAAMPARK CONSULTANCY & RESEARCH SERVICES
// ─────────────────────────────────────────

export const scsServices: Service[] = [
  // ── Digital Marketing (7) ──────────────────────────
  {
    id: 'scs-social-standard',
    group: 'consultancy', primaryCategory: 'digital-marketing',
    entity: 'scs',
    category: 'social-media', sector: 'digital-marketing',
    name: 'Social Media Page Control',
    shortName: 'Social Media',
    description: 'Professional management of your social media presence across Facebook, Instagram and WhatsApp.',
    features: [
      '4 Business Posters / Month',
      'Wish Day Poster — FREE',
      'Facebook & Instagram Management',
      'Content Scheduling',
      'Audience Engagement',
      'Page Performance Monitoring',
    ],
    startingPrice: 499,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    badge: '🔥 Most Affordable',
    color: '#1877F2',
    slug: 'social-media-management',
    href: '/consultancy/digital-marketing/social-media',
    icon: 'Share2', image: '/assets/images/services/scs_social_standard.png',
  },
  {
    id: 'scs-meta-weekly',
    group: 'consultancy', primaryCategory: 'digital-marketing',
    entity: 'scs',
    category: 'meta-ads', sector: 'ads-management',
    name: 'Meta Ads — Weekly',
    shortName: 'Meta Weekly',
    description: 'Short-burst Facebook & Instagram advertising campaign with Wish Day poster.',
    features: [
      'Wish Day Poster Included',
      'Facebook + Instagram Ads',
      'Audience Targeting',
      'Campaign Report',
      'Professional Setup',
    ],
    startingPrice: 600,
    priceType: 'weekly',
    deliveryDays: 7,
    isPopular: false,
    isFeatured: false,
    color: '#0866FF',
    slug: 'meta-ads-weekly',
    href: '/consultancy/ads-management/meta-ads',
    icon: 'Megaphone',
  },
  {
    id: 'scs-meta-monthly',
    group: 'consultancy', primaryCategory: 'digital-marketing',
    entity: 'scs',
    category: 'meta-ads', sector: 'ads-management',
    name: 'Meta Ads — Monthly',
    shortName: 'Meta Monthly',
    description: 'Full-month managed Meta advertising with Wish Day poster and optimization.',
    features: [
      'Wish Day Poster Included',
      'Facebook + Instagram Ads',
      'Monthly Optimization',
      'A/B Testing',
      'Retargeting',
      'Monthly Performance Report',
    ],
    startingPrice: 2000,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true, badge: '⚡ SPECIAL DEAL',
    color: '#0866FF',
    slug: 'meta-ads-monthly',
    href: '/consultancy/ads-management/meta-ads',
    icon: 'Megaphone', image: '/assets/images/services/scs_meta_monthly.png',
  },
  {
    id: 'scs-meta-premium',
    group: 'consultancy', primaryCategory: 'digital-marketing',
    entity: 'scs',
    category: 'meta-ads', sector: 'ads-management',
    name: 'Meta Ads — Premium',
    shortName: 'Meta Premium',
    description: 'The ultimate Meta advertising package with AI videos, reels, and 1M impressions.',
    features: [
      '2 AI Videos / Normal Videos',
      '4 Reels Videos / Offer ⭐',
      '1 Ads Poster',
      '20 Business Posters',
      'Wish Day Poster — FREE',
      'Professional Fees Included',
      'Meta Ads Cost (1M) Included',
    ],
    startingPrice: 9499,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    badge: '⭐ Best Value',
    color: '#0866FF',
    slug: 'meta-ads-premium',
    href: '/consultancy/ads-management/meta-ads',
    icon: 'Megaphone',
  },
  {
    id: 'scs-google-weekly',
    group: 'consultancy', primaryCategory: 'digital-marketing',
    entity: 'scs',
    category: 'google-ads', sector: 'ads-management',
    name: 'Google Ads — Weekly',
    shortName: 'Google Weekly',
    description: 'Quick Google Search campaign to capture immediate, high-intent leads.',
    features: [
      'Google Search Ads',
      'Keyword Targeting',
      'Basic Campaign Setup',
      'Campaign Report',
    ],
    startingPrice: 1000,
    priceType: 'weekly',
    deliveryDays: 7,
    isPopular: false,
    isFeatured: false,
    color: '#4285F4',
    slug: 'google-ads-weekly',
    href: '/consultancy/ads-management/google-ads',
    icon: 'Search',
  },
  {
    id: 'scs-google-monthly',
    group: 'consultancy', primaryCategory: 'digital-marketing',
    entity: 'scs',
    category: 'google-ads', sector: 'ads-management',
    name: 'Google Ads — Monthly',
    shortName: 'Google Monthly',
    description: 'Full-month managed Google advertising with Search, Display, and conversion tracking.',
    features: [
      'Google Search + Display Ads',
      'Monthly Campaign Optimization',
      'Conversion Tracking Setup',
      'Negative Keywords Management',
      'Monthly Performance Report',
    ],
    startingPrice: 3500,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    color: '#4285F4',
    slug: 'google-ads-monthly',
    href: '/consultancy/ads-management/google-ads',
    icon: 'Search', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
  },
  {
    id: 'scs-google-premium',
    group: 'consultancy', primaryCategory: 'digital-marketing',
    entity: 'scs',
    category: 'google-ads', sector: 'ads-management',
    name: 'Google Ads — Premium',
    shortName: 'Google Premium',
    description: 'Maximum Google impact — AI videos, content, and 1M Google Ad impressions.',
    features: [
      '2 AI Videos / Normal Videos',
      '4 Reels Videos / Offer ⭐',
      '1 Ads Poster',
      'Professional Fees Included',
      'Google Ads Cost (1M) Included',
      'YouTube Ads Included',
    ],
    startingPrice: 19999,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: false,
    isFeatured: true,
    badge: '💎 Premium',
    color: '#4285F4',
    slug: 'google-ads-premium',
    href: '/consultancy/ads-management/google-ads',
    icon: 'Search',
  },

  // ── Online Related Services (3 under Saampark Research) ───────────────
  {
    id: 'scs-gbp-basic',
    group: 'research', primaryCategory: 'online-related-services',
    entity: 'scs',
    category: 'google-business', sector: 'seo-local',
    name: 'GBP — Basic Management',
    shortName: 'GBP Basic',
    description: 'Setup and basic management of your Google Business Profile for local visibility.',
    features: [
      'Google Business Profile Setup',
      'Business Verification Support',
      'Product & Service Listing',
      'Weekly Business Updates',
    ],
    startingPrice: 1000,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: false,
    isFeatured: false,
    color: '#34A853',
    slug: 'gbp-basic',
    href: '/consultancy/digital-marketing/google-business-profile',
    icon: 'MapPin',
  },
  {
    id: 'scs-gbp-regular',
    group: 'research', primaryCategory: 'online-related-services',
    entity: 'scs',
    category: 'google-business', sector: 'seo-local',
    name: 'GBP — Regular & SEO',
    shortName: 'GBP Regular',
    description: 'Active management plus local SEO optimization for higher Google Maps rankings.',
    features: [
      'Everything in Basic',
      'Local SEO Optimization',
      'Review & Reputation Management',
      'Q&A Management',
      'Photo & Video Uploads',
      'Regular Posts & Offers',
    ],
    startingPrice: 3000,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    badge: '📍 Local Domination',
    color: '#34A853',
    slug: 'gbp-regular',
    href: '/consultancy/digital-marketing/google-business-profile',
    icon: 'MapPin',
  },
  {
    id: 'scs-gbp-advanced',
    group: 'research', primaryCategory: 'online-related-services',
    entity: 'scs',
    category: 'google-business', sector: 'seo-local',
    name: 'GBP — Advanced Local SEO',
    shortName: 'GBP Advanced',
    description: 'Full GBP domination — advanced local SEO, reputation management, and brand authority.',
    features: [
      'Everything in Regular',
      'Advanced Local SEO Strategy',
      'Competitor Analysis',
      'Citation Building',
      'Negative Review Management',
      'Monthly Audit & Report',
    ],
    startingPrice: 8000,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: false,
    isFeatured: false, badge: '⭐ LIMITED TIME',
    color: '#34A853',
    slug: 'gbp-advanced',
    href: '/consultancy/digital-marketing/google-business-profile',
    icon: 'MapPin',
  },

  // ── AI Video (6 under Saampark Consultancy) ────────────────────────────
  {
    id: 'scs-video-simple',
    group: 'consultancy', primaryCategory: 'ai-video',
    entity: 'scs',
    category: 'video-ai', sector: 'video-animation',
    name: 'Simple Video',
    shortName: 'Simple Video',
    description: 'Clean, professional video for business announcements and social media posts.',
    features: ['Slideshow / Text Animation', 'Background Music', 'HD Quality', 'Fast 48h Delivery', 'AI Voice & Script'],
    startingPrice: 499,
    priceType: 'one-time',
    deliveryDays: 2,
    isPopular: false,
    isFeatured: false,
    color: '#8B5CF6',
    slug: 'simple-video',
    href: '/consultancy/video-ai/simple-video',
    icon: 'Video',
  },
  {
    id: 'scs-video-poster',
    group: 'consultancy', primaryCategory: 'ai-video',
    entity: 'scs',
    category: 'video-ai', sector: 'video-animation',
    name: 'Poster Video',
    shortName: 'Poster Video',
    description: 'Animated business poster video — perfect for WhatsApp status and stories.',
    features: ['Animated Poster', 'Business Branding', 'Background Music', 'HD Quality', 'Fast Delivery'],
    startingPrice: 599,
    priceType: 'one-time',
    deliveryDays: 2,
    isPopular: false,
    isFeatured: false,
    color: '#EC4899',
    slug: 'poster-video',
    href: '/consultancy/video-ai/poster-video',
    icon: 'Video',
  },
  {
    id: 'scs-video-cartoon',
    group: 'consultancy', primaryCategory: 'ai-video',
    entity: 'scs',
    category: 'video-ai', sector: 'video-animation',
    name: 'Cartoon Video',
    shortName: 'Cartoon Video',
    description: 'Engaging animated cartoon explainer video for your products and services.',
    features: ['Animated Characters', 'Custom Storyline', 'Voiceover', 'Background Music', 'HD Delivery'],
    startingPrice: 699,
    priceType: 'one-time',
    deliveryDays: 3,
    isPopular: false,
    isFeatured: false,
    color: '#F59E0B',
    slug: 'cartoon-video',
    href: '/consultancy/video-ai/cartoon-video',
    icon: 'Video',
  },
  {
    id: 'scs-video-motion-ai',
    group: 'consultancy', primaryCategory: 'ai-video',
    entity: 'scs',
    category: 'video-ai', sector: 'ai-integration',
    name: 'Motion AI Video',
    shortName: 'Motion AI',
    description: 'AI-enhanced motion graphics video with premium visual quality.',
    features: ['AI-Enhanced Motion Graphics', 'Professional Editing', 'AI Voice & Script', 'Background Music', 'Fast Delivery'],
    startingPrice: 799,
    priceType: 'one-time',
    deliveryDays: 3,
    isPopular: false,
    isFeatured: false,
    color: '#00B4A6',
    slug: 'motion-ai-video',
    href: '/consultancy/video-ai/motion-ai-video',
    icon: 'Sparkles',
  },
  {
    id: 'scs-video-full-ai',
    group: 'consultancy', primaryCategory: 'ai-video',
    entity: 'scs',
    category: 'video-ai', sector: 'ai-integration',
    name: 'Full AI Video',
    shortName: 'Full AI Video',
    description: 'Completely AI-generated video with voice, script, visuals, and professional editing.',
    features: ['AI Voice & Script', 'AI-Generated Visuals', 'Professional Editing', 'Background Music', 'HD Quality', 'Fast 72h Delivery'],
    startingPrice: 1499,
    priceType: 'one-time',
    deliveryDays: 3,
    isPopular: true,
    isFeatured: true,
    badge: '🤖 AI-Powered',
    color: '#8B5CF6',
    slug: 'full-ai-video',
    href: '/consultancy/video-ai/full-ai-video',
    icon: 'Sparkles',
  },
  {
    id: 'scs-video-4k',
    group: 'consultancy', primaryCategory: 'ai-video',
    entity: 'scs',
    category: 'video-ai', sector: 'video-animation',
    name: '4K High Quality AI Video',
    shortName: '4K AI Video',
    description: 'Premium 4K AI production — the highest quality AI video for maximum impact.',
    features: ['4K Ultra HD Quality', 'AI Voice & Script', 'AI-Generated Visuals', 'Professional Editing', 'Background Music', 'Fast Delivery'],
    startingPrice: 1999,
    priceType: 'one-time',
    deliveryDays: 4,
    isPopular: false,
    isFeatured: true,
    badge: '4K Ultra HD',
    color: '#F4511E',
    slug: '4k-ai-video',
    href: '/consultancy/video-ai/4k-ai-video',
    icon: 'Sparkles',
  },

  // ── Legal (4 under Saampark Consultancy) ──────────────────────
  {
    id: 'scs-legal-pvtltd',
    group: 'consultancy', primaryCategory: 'legal',
    entity: 'scs',
    category: 'business-legal', sector: 'business-legal',
    name: 'Pvt. Ltd. Company Registration',
    shortName: 'Pvt. Ltd.',
    description: '100% legal Pvt. Ltd. company registration with expert guidance and support.',
    features: ['DIN & DSC', 'MOA & AOA Drafting', 'MCA Filing', 'Certificate of Incorporation', 'PAN & TAN', 'Expert Support'],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: 15,
    isPopular: true,
    isFeatured: true,
    badge: '✅ 100% Legal',
    color: '#1E293B',
    slug: 'pvt-ltd-registration',
    href: '/consultancy/business-legal/pvt-ltd-registration',
    icon: 'Briefcase',
  },
  {
    id: 'scs-legal-gst',
    group: 'consultancy', primaryCategory: 'legal',
    entity: 'scs',
    category: 'business-legal', sector: 'financial-tax',
    name: 'GST Registration',
    shortName: 'GST',
    description: 'Hassle-free GST registration for your business — fast, legal, expert-handled.',
    features: ['Complete GST Setup', 'Document Filing', 'GSTIN Certificate', 'GST Portal Access', 'Expert Support'],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: 7,
    isPopular: true,
    isFeatured: true,
    color: '#EF4444',
    slug: 'gst-registration',
    href: '/consultancy/business-legal/gst-registration',
    icon: 'FileText',
  },
  {
    id: 'scs-legal-msme',
    group: 'consultancy', primaryCategory: 'legal',
    entity: 'scs',
    category: 'business-legal', sector: 'business-legal',
    name: 'MSME (Udyam) Registration',
    shortName: 'MSME',
    description: 'MSME Udyam registration to access government schemes and benefits.',
    features: ['Udyam Certificate', 'Government Benefits Access', 'Priority Lending Eligibility', 'Trademark Fee Concession', 'Expert Guidance'],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: 5,
    isPopular: false,
    isFeatured: false,
    color: '#F59E0B',
    slug: 'msme-registration',
    href: '/consultancy/business-legal/msme-registration',
    icon: 'FileText',
  },
  {
    id: 'scs-legal-itr',
    group: 'consultancy', primaryCategory: 'legal',
    entity: 'scs',
    category: 'business-legal', sector: 'financial-tax',
    name: 'Income Tax Returns',
    shortName: 'ITR Filing',
    description: 'Professional ITR filing for individuals and businesses — on time, every time.',
    features: ['All ITR Forms', 'Tax Planning Advice', 'Refund Tracking', 'Compliance Assured', 'Expert CA Support'],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: 7,
    isPopular: false,
    isFeatured: false,
    color: '#10B981',
    slug: 'income-tax-returns',
    href: '/consultancy/business-legal/income-tax-returns',
    icon: 'FileText',
  },
];

// ─────────────────────────────────────────
// ALL SERVICES COMBINED (with dynamically injected images)
// ─────────────────────────────────────────
const SERVICE_IMAGE_MAP: Record<string, string> = {
  'str-web-onepage':     '/assets/images/one-page-web.jpg',
  'str-web-static':      '/assets/images/static-web.jpg',
  'str-web-dynamic':     '/assets/images/dynamic-web.jpg',
  'str-web-ecommerce':   '/assets/images/ecommerce-web.jpg',
  'str-app-android':     '/assets/images/android-app.jpg',
  'str-app-ios':         '/assets/images/ios-app.jpg',
  'str-app-hybrid':      '/assets/images/hybrid-app.jpg',
  'str-spec-hotel':      '/assets/images/hotel-system.jpg',
  'str-spec-hospital':   '/assets/images/hospital-system.jpg',
  'str-spec-school':     '/assets/images/school-system.jpg',
  'str-spec-elearning':  '/assets/images/elearning-platform.jpg',
  'str-spec-realestate': '/assets/images/realestate-web.jpg',
  'str-spec-restaurant': '/assets/images/restaurant-system.jpg',
  'str-spec-erp':        '/assets/images/erp-software.jpg',
  'str-spec-crm':        '/assets/images/crm-software.jpg',
  'str-maint-website':   '/assets/images/static-web.jpg',
  'str-maint-app':       '/assets/images/android-app.jpg',
  'str-host-cloud':      '/assets/images/erp-software.jpg',
  'str-host-domain':     '/assets/images/one-page-web.jpg',
  'scs-social-standard': '/assets/images/social-media.jpg',
  'scs-meta-weekly':     '/assets/images/meta-ads-weekly.jpg',
  'scs-meta-monthly':    '/assets/images/meta-ads-monthly.jpg',
  'scs-meta-premium':    '/assets/images/meta-ads-premium.jpg',
  'scs-google-weekly':   '/assets/images/google-ads-weekly.jpg',
  'scs-google-monthly':  '/assets/images/google-ads-monthly.jpg',
  'scs-google-premium':  '/assets/images/google-ads-premium.jpg',
  'scs-gbp-basic':       '/assets/images/gbp-basic.jpg',
  'scs-gbp-regular':     '/assets/images/gbp-regular.jpg',
  'scs-gbp-advanced':    '/assets/images/gbp-advanced.jpg',
  'scs-video-simple':    '/assets/images/video-simple.jpg',
  'scs-video-poster':    '/assets/images/video-poster.jpg',
  'scs-video-cartoon':   '/assets/images/video-cartoon.jpg',
  'scs-video-motion-ai': '/assets/images/video-motion-ai.jpg',
  'scs-video-full-ai':   '/assets/images/video-full-ai.jpg',
  'scs-video-4k':        '/assets/images/video-4k-ai.jpg',
  'scs-legal-pvtltd':    '/assets/images/pvtltd-reg.jpg',
  'scs-legal-gst':       '/assets/images/gst-reg.jpg',
  'scs-legal-msme':      '/assets/images/msme-reg.jpg',
  'scs-legal-itr':       '/assets/images/itr-filing.jpg',
};

export const allServices: Service[] = [...strServices, ...scsServices].map(s => {
  const image = SERVICE_IMAGE_MAP[s.id] || '/assets/images/website-dev.jpg';
  return { ...s, image };
});

export const featuredServices = allServices.filter(s => s.isFeatured);
export const popularServices  = allServices.filter(s => s.isPopular);

export function getServicesByCategory(cat: ServiceCategory) {
  return allServices.filter(s => s.category === cat);
}
export function getServicesByEntity(entity: Entity) {
  return allServices.filter(s => s.entity === entity);
}
export function getServiceById(id: string) {
  return allServices.find(s => s.id === id);
}

// Dynamic Hierarchy Query Helpers
export function getGroupServices(group: ServiceGroup | 'all', services: Service[] = allServices): Service[] {
  if (group === 'all') return services;
  return services.filter(s => s.group === group);
}

export function getPrimaryCategoryServices(cat: PrimaryCategory | 'all', services: Service[] = allServices): Service[] {
  if (cat === 'all') return services;
  return services.filter(s => s.primaryCategory === cat);
}

export function getGroupCount(group: ServiceGroup | 'all', services: Service[] = allServices): number {
  return getGroupServices(group, services).length;
}

export function getPrimaryCategoryCount(cat: PrimaryCategory | 'all', services: Service[] = allServices): number {
  return getPrimaryCategoryServices(cat, services).length;
}

// ─────────────────────────────────────────
// COMPANY CONTACT INFO (Official)
// ─────────────────────────────────────────
export const CONTACT = {
  group: {
    address:   'Balichak (Station Road), Debra, Paschim Medinipur, West Bengal – 721124',
    website:   'www.saampark.com',
  },
  str: {
    name:      'Saampark Technology & Research Pvt. Ltd.',
    short:     'STR',
    tagline:   'Aspire For Optimum Excellence',
    phone1:    '9091518567',
    phone2:    '9091518569',
    landline:  '03222464688',
    email:     'saamparktechnologyresearch@gmail.com',
    webEmail:  'service@saamparktechnologyresearch.in',
    website:   'www.saamparktechnologyresearch.in',
    whatsapp1: 'https://wa.me/919091518567',
    whatsapp2: 'https://wa.me/919091518569',
    tel1:      'tel:9091518567',
    tel2:      'tel:9091518569',
    iso:       'ISO 9001:2015',
  },
  scs: {
    name:      'Saampark Consultancy Service',
    short:     'SCS',
    tagline:   'Grow Your Business with Digital Power',
    phone:     '8170082678',
    landline:  '03222464688',
    email:     'saamparkconsultancyservice@gmail.com',
    webEmail:  'service@saamparkconsultancyservice.in',
    website:   'www.saamparkconsultancyservice.in',
    whatsapp:  'https://wa.me/918170082678',
    tel:       'tel:8170082678',
    iso:       'ISO 9001:2015',
  },
} as const;

// ─────────────────────────────────────────
// PROMOTIONAL RIBBON ITEMS
// ─────────────────────────────────────────
export const PROMO_ITEMS = [
  { label: '⚡ One Page Website', value: 'Starting ₹1,999', href: '/technology/web-development/one-page-website', color: '#00B4A6' },
  { label: '🔥 Social Media Management', value: 'Just ₹499/month', href: '/consultancy/digital-marketing/social-media', color: '#1877F2' },
  { label: '📱 Dynamic Website', value: 'Starting ₹11,999', href: '/technology/web-development/dynamic-website', color: '#F4511E' },
  { label: '🤖 Full AI Video', value: 'Starting ₹1,499', href: '/consultancy/video-ai/full-ai-video', color: '#8B5CF6' },
  { label: '📢 Meta Ads Weekly', value: 'Starting ₹600', href: '/consultancy/ads-management/meta-ads', color: '#0866FF' },
  { label: '🛒 E-Commerce Website', value: 'Starting ₹21,999', href: '/technology/web-development/ecommerce-website', color: '#4CAF50' },
  { label: '🔍 Google Ads Monthly', value: 'Starting ₹3,500', href: '/consultancy/ads-management/google-ads', color: '#4285F4' },
  { label: '📍 Google Business Profile', value: 'Starting ₹1,000/mo', href: '/consultancy/digital-marketing/google-business-profile', color: '#34A853' },
  { label: '🏢 Pvt. Ltd. Registration', value: 'Expert Support', href: '/consultancy/business-legal/pvt-ltd-registration', color: '#1E293B' },
  { label: '📊 Static Website', value: 'Starting ₹3,999', href: '/technology/web-development/static-website', color: '#1E90FF' },
  { label: '📱 Hybrid App (Android+iOS)', value: 'Get a Quote', href: '/technology/app-development/hybrid', color: '#54C5F8' },
  { label: '🎯 Free Consultation', value: 'Book Now', href: '/contact', color: '#F5A623' },
];

// ─────────────────────────────────────────
// STATS
// ─────────────────────────────────────────
export const STATS = [
  { value: 500, suffix: '+', label: 'Projects Delivered', icon: 'CheckCircle' },
  { value: 300, suffix: '+', label: 'Happy Clients', icon: 'Users' },
  { value: 40,  suffix: '+', label: 'Service Categories', icon: 'Grid3x3' },
  { value: 5,   suffix: '+', label: 'Years of Excellence', icon: 'Award' },
] as const;

// ─────────────────────────────────────────
// LIVE ACTIVITY FEED (Simulated)
// ─────────────────────────────────────────
export const LIVE_ACTIVITIES = [
  { emoji: '🌐', text: 'New Dynamic Website delivered — Restaurant, Kolkata' },
  { emoji: '📱', text: 'Android App published — Delivery Business, Medinipur' },
  { emoji: '📢', text: 'Meta Ads campaign launched — Retail Brand' },
  { emoji: '🏢', text: 'Pvt. Ltd. Registration completed — Startup, West Bengal' },
  { emoji: '🔍', text: 'Google Ads campaign started — Healthcare Clinic' },
  { emoji: '🤖', text: '4K AI Video created — Festival Campaign' },
  { emoji: '🛒', text: 'E-Commerce Website live — Fashion Brand' },
  { emoji: '📍', text: 'Google Business Profile verified — Restaurant' },
  { emoji: '📊', text: 'GST Registration completed — Small Business' },
  { emoji: '🎯', text: 'Consultation booked — ERP Software Requirement' },
];

// ─────────────────────────────────────────
// TECH STACK (STR)
// ─────────────────────────────────────────
export const TECH_STACK = [
  { name: 'PHP',         color: '#777BB4', category: 'backend' },
  { name: 'JavaScript',  color: '#F7DF1E', category: 'frontend' },
  { name: 'React',       color: '#61DAFB', category: 'frontend' },
  { name: 'Next.js',     color: '#000000', category: 'frontend' },
  { name: 'MySQL',       color: '#4479A1', category: 'database' },
  { name: 'Firebase',    color: '#FFCA28', category: 'database' },
  { name: 'Flutter',     color: '#02569B', category: 'mobile' },
  { name: 'Android',     color: '#3DDC84', category: 'mobile' },
  { name: 'iOS (Swift)', color: '#F05138', category: 'mobile' },
  { name: 'Node.js',     color: '#339933', category: 'backend' },
  { name: 'WordPress',   color: '#21759B', category: 'cms' },
  { name: 'AWS',         color: '#FF9900', category: 'cloud' },
] as const;
