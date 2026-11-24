'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Check,
  X,
  ArrowLeft,
  Bookmark,
  ShoppingBag,
  Shield,
  Clock,
  MessageCircle,
  Star,
  Maximize2,
  Layers,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Award,
  Zap,
  CheckCircle,
  Code,
  Database,
  Smartphone,
} from 'lucide-react';
import { type Service, CONTACT } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useOrderStore } from '@/lib/store/orderStore';
import { useAuthStore } from '@/lib/store/authStore';
import styles from './ServiceDetail.module.css';

const getPortfolioImages = (category: string) => {
  const webPics = [
    { title: 'Responsive Hero Showcase', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80' },
    { title: 'Interactive Analytics View', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80' },
    { title: 'Content & Admin Dashboard', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=900&auto=format&fit=crop&q=80' },
    { title: 'Mobile Responsive Layout', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900&auto=format&fit=crop&q=80' },
  ];

  const appPics = [
    { title: 'Native iOS & Android Screens', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900&auto=format&fit=crop&q=80' },
    { title: 'Onboarding & User Flows', url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=900&auto=format&fit=crop&q=80' },
    { title: 'Real-Time Notification System', url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=900&auto=format&fit=crop&q=80' },
    { title: 'Cross-Platform Architecture', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=80' },
  ];

  const softPics = [
    { title: 'Enterprise Dashboard & BI', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80' },
    { title: 'Billing & Inventory Module', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80' },
    { title: 'CRM & Lead Pipeline', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&auto=format&fit=crop&q=80' },
    { title: 'Automated Tax Invoices', url: 'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=900&auto=format&fit=crop&q=80' },
  ];

  const adsPics = [
    { title: 'Campaign Performance Suite', url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=900&auto=format&fit=crop&q=80' },
    { title: 'Targeted Audience Analytics', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80' },
    { title: 'Search Bidding Strategy', url: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=900&auto=format&fit=crop&q=80' },
    { title: 'Local Maps Verification', url: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=900&auto=format&fit=crop&q=80' },
  ];

  const videoPics = [
    { title: 'Studio AI Voice & Script', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=900&auto=format&fit=crop&q=80' },
    { title: '4K Motion Reel Render', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&auto=format&fit=crop&q=80' },
    { title: 'Character Animation Scene', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80' },
  ];

  const legalPics = [
    { title: 'MCA Incorporation Certificate', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80' },
    { title: 'Official GSTIN Filing', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=900&auto=format&fit=crop&q=80' },
    { title: 'MSME Udyam Certification', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80' },
  ];

  if (category === 'app') return appPics;
  if (category === 'software') return softPics;
  if (['social-media', 'meta-ads', 'google-ads', 'google-business'].includes(category)) return adsPics;
  if (category === 'video-ai') return videoPics;
  if (category === 'business-legal') return legalPics;
  return webPics;
};

const DEFAULT_FAQS = [
  {
    question: 'How does ordering and onboarding work?',
    answer: 'Click Instant Order & GST Invoice to complete your billing details. Our team confirms requirements within 2 business hours and issues your CRM Client Portal login automatically.',
  },
  {
    question: 'Do I receive an official GST Tax Invoice?',
    answer: 'Yes. Every order generates a compliant GST invoice directly in Saampark CRM, viewable and downloadable anytime from your Client Account Hub.',
  },
  {
    question: 'Are there any hidden charges after purchase?',
    answer: 'None. Transparent upfront pricing applies to all deliverables listed in the package. Optional add-ons are always quoted and approved in advance.',
  },
  {
    question: 'What post-delivery support is included?',
    answer: 'Every package includes 30 days of complimentary technical support, bug fixes, and handover guidance.',
  },
];

interface Props {
  service: Service;
}

export function ServiceDetail({ service }: Props) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'specs' | 'roadmap' | 'gallery' | 'faqs'>('overview');
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);

  const { cart, addToCart, wishlistIds, toggleWishlist } = useCommerceStore();
  const { openCart } = useUIStore();
  const { openCheckout } = useOrderStore();
  const { requireAuth } = useAuthStore();

  // Merge primary uploaded image + up to 5 CRM galleryImages + curated fallbacks
  const screenshots = useMemo(() => {
    const customList: { title: string; url: string }[] = [];
    if (service.image && service.image.trim()) {
      customList.push({ title: `${service.name} — Primary Preview`, url: service.image.trim() });
    }
    if (Array.isArray(service.galleryImages)) {
      service.galleryImages.forEach((url, i) => {
        const clean = String(url || '').trim();
        if (clean && !customList.some((x) => x.url === clean)) {
          customList.push({ title: `${service.shortName || service.name} — View ${i + 2}`, url: clean });
        }
      });
    }

    const fallbacks = getPortfolioImages(service.category);
    for (const fb of fallbacks) {
      if (customList.length >= 5) break;
      if (!customList.some((x) => x.url === fb.url)) {
        customList.push(fb);
      }
    }
    return customList;
  }, [service]);

  const faqsList =
    Array.isArray(service.faqs) && service.faqs.length > 0 ? service.faqs : DEFAULT_FAQS;

  const isWishlisted = wishlistIds.includes(service.id);
  const isInCart = cart.some((c) => c.serviceId === service.id);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 360);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    requireAuth(() => {
      if (useCommerceStore.getState().cart.some((c) => c.serviceId === service.id)) {
        openCart();
        return;
      }
      addToCart({
        serviceId: service.id,
        serviceName: service.name,
        price: service.startingPrice,
        quantity: 1,
      });
      openCart();
    }, `Sign in or register with your email to add "${service.name}" to your cart.`);
  };

  const handleInstantOrder = () => {
    requireAuth(
      () => openCheckout(service),
      `Please sign in or register with your email before ordering "${service.name}".`
    );
  };

  const handleWA = () => {
    const msg = `Hello Saampark,\n\nI want to order: *${service.name}*\nPrice: ${
      service.startingPrice ? '₹' + service.startingPrice : 'Custom Quote'
    }\n\nPlease share details and start my project.`;
    const phone = service.entity === 'str' ? '919091518567' : '918170082678';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Custom Quote';
    const num = `₹${price.toLocaleString('en-IN')}`;
    return service.priceType === 'monthly'
      ? `${num} / mo`
      : service.priceType === 'weekly'
      ? `${num} / wk`
      : num;
  };

  const discountPct =
    service.originalPrice && service.startingPrice && service.originalPrice > service.startingPrice
      ? Math.round(((service.originalPrice - service.startingPrice) / service.originalPrice) * 100)
      : null;

  const prevImg = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const nextImg = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % screenshots.length);
  };

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumb Bar */}
      <div className="container" style={{ paddingTop: 14, paddingBottom: 6 }}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={15} /> Back to All Solutions
        </Link>
      </div>

      {/* Main Product Hero */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroGrid}>
            {/* Left Column: Multi-Image Glass Showcase */}
            <div className={styles.galleryWrap}>
              <div className={styles.mainViewer}>
                <Image
                  src={screenshots[activeImgIndex]?.url || '/assets/images/website-dev.jpg'}
                  alt={screenshots[activeImgIndex]?.title || service.name}
                  width={900}
                  height={560}
                  className={styles.mainImage}
                  priority
                  unoptimized
                />

                {screenshots.length > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${styles.navImgBtn} ${styles.navPrev}`}
                      onClick={prevImg}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.navImgBtn} ${styles.navNext}`}
                      onClick={nextImg}
                      aria-label="Next image"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className={styles.lightboxTrigger}
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Zoom preview"
                >
                  <Maximize2 size={14} /> Expand
                </button>

                <div className={styles.imgBadge}>
                  <span>{screenshots[activeImgIndex]?.title || `Preview ${activeImgIndex + 1}`}</span>
                  <span className={styles.imgCounter}>
                    {activeImgIndex + 1} / {screenshots.length}
                  </span>
                </div>
              </div>

              {/* Thumbnails Strip */}
              <div className={styles.thumbScroll}>
                {screenshots.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.thumbBtn} ${activeImgIndex === idx ? styles.activeThumb : ''}`}
                    onClick={() => setActiveImgIndex(idx)}
                  >
                    <Image
                      src={item.url}
                      alt={item.title}
                      width={110}
                      height={70}
                      className={styles.thumbImg}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Frosted 3D Glass Purchase Card */}
            <div className={styles.buyCard}>
              <div className={styles.badgeRow}>
                <span className={`badge ${service.entity === 'str' ? 'badge-str' : 'badge-scs'}`}>
                  {service.entity === 'str' || service.group === 'technology'
                    ? 'Saampark Technology (STR)'
                    : 'Saampark Consultancy (SCS)'}
                </span>
                {service.badge && <span className={styles.offerPill}>{service.badge}</span>}
              </div>

              <h1 className={styles.productTitle}>{service.name}</h1>
              <p className={styles.productDesc}>{service.description}</p>

              {/* Trust Signals */}
              <div className={styles.trustGrid}>
                <div className={styles.trustItem}>
                  <Star size={15} className={styles.starIcon} fill="currentColor" />
                  <span>
                    <strong>4.9 / 5.0</strong> Verified Client Rating
                  </span>
                </div>
                <div className={styles.trustItem}>
                  <Award size={15} className={styles.awardIcon} />
                  <span>ISO 9001:2015 Certified Execution</span>
                </div>
                {service.deliveryDays && (
                  <div className={styles.trustItem}>
                    <Clock size={15} className={styles.clockIcon} />
                    <span>
                      <strong>{service.deliveryDays} Days</strong> Delivery SLA &bull; Instant GST Invoice
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Box */}
              <div className={styles.priceContainer}>
                <div className={styles.priceHead}>Standard Package Investment</div>
                <div className={styles.priceDisplayRow}>
                  <div className={styles.priceVal}>{formatPrice(service.startingPrice)}</div>
                  {service.originalPrice && discountPct && (
                    <div className={styles.discountWrap}>
                      <span className={styles.oldPrice}>
                        ₹{service.originalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className={styles.saveTag}>SAVE {discountPct}%</span>
                    </div>
                  )}
                </div>
                <div className={styles.priceSub}>
                  Upfront fixed billing &bull; +18% GST Tax Invoice &bull; Zero hidden charges
                </div>
              </div>

              {/* Primary + Secondary Glass Actions */}
              <div className={styles.actionStack}>
                <button
                  type="button"
                  className={`btn btn-primary btn-lg ${styles.instantBtn}`}
                  onClick={handleInstantOrder}
                >
                  <Zap size={18} fill="#fff" /> Instant Order &amp; GST Invoice
                </button>

                <div className={styles.secondaryActionRow}>
                  <button
                    type="button"
                    className={`btn btn-secondary ${styles.cartBtn}`}
                    onClick={handleAddToCart}
                  >
                    <ShoppingBag size={16} />
                    {isInCart ? 'View in Cart' : 'Add to Cart'}
                  </button>

                  <button
                    type="button"
                    className={`btn btn-secondary ${styles.waBtn}`}
                    onClick={handleWA}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </button>

                  <button
                    type="button"
                    className={`btn btn-secondary btn-icon ${isWishlisted ? styles.wishActive : ''}`}
                    onClick={() => toggleWishlist(service.id)}
                    title="Save to Wishlist"
                    aria-label="Save to Wishlist"
                  >
                    <Bookmark size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <div className={styles.guaranteeNote}>
                100% Satisfaction Guarantee &bull; Direct CRM Portal Tracking Included
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Glass Tab Navigation */}
      <section className={styles.tabSection}>
        <div className="container">
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${selectedTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('overview')}
            >
              <Zap size={14} /> Overview &amp; Deliverables
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${selectedTab === 'specs' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('specs')}
            >
              <FileText size={14} /> Architecture &amp; Stack
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${selectedTab === 'roadmap' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('roadmap')}
            >
              <CheckCircle size={14} /> Delivery Roadmap
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${selectedTab === 'gallery' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('gallery')}
            >
              <Layers size={14} /> Showcase Gallery ({screenshots.length})
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${selectedTab === 'faqs' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('faqs')}
            >
              <HelpCircle size={14} /> FAQs &amp; Support
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className={styles.tabContentSection}>
        <div className="container">
          {selectedTab === 'overview' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Included Deliverables &amp; Specifications</h2>
                <p>Everything covered in your order with guaranteed milestone tracking in Saampark CRM.</p>
              </div>

              <div className={styles.featureGrid}>
                {service.features.map((feat, i) => (
                  <div key={i} className={styles.featureCard}>
                    <div className={styles.featIcon}>
                      <Check size={16} />
                    </div>
                    <div className={styles.featText}>
                      <h4>{feat}</h4>
                      <p>Delivered under ISO 9001:2015 verified quality and engineering standards.</p>
                    </div>
                  </div>
                ))}
              </div>

              {service.notIncluded && service.notIncluded.length > 0 && (
                <div className={styles.notIncludedBlock}>
                  <h3>Optional Add-Ons (Not Included by Default)</h3>
                  <div className={styles.notIncludedGrid}>
                    {service.notIncluded.map((item, i) => (
                      <div key={i} className={styles.notIncItem}>
                        <X size={14} className={styles.notIncIcon} /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'gallery' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Visual Showcase &amp; UI Previews</h2>
                <p>Click any image to view in fullscreen high resolution.</p>
              </div>

              <div className={styles.galleryGrid}>
                {screenshots.map((ss, idx) => (
                  <div
                    key={idx}
                    className={styles.galleryCard}
                    onClick={() => {
                      setActiveImgIndex(idx);
                      setLightboxOpen(true);
                    }}
                  >
                    <div className={styles.galleryImgWrap}>
                      <Image
                        src={ss.url}
                        alt={ss.title}
                        width={460}
                        height={290}
                        className={styles.galleryImg}
                        unoptimized
                      />
                      <div className={styles.galleryOverlay}>
                        <Maximize2 size={22} color="#FFF" />
                        <span>Expand View</span>
                      </div>
                    </div>
                    <div className={styles.galleryMeta}>
                      <span className={styles.ssIndex}>Image #{idx + 1}</span>
                      <h4 className={styles.ssTitle}>{ss.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'specs' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Technical Architecture &amp; Compliance</h2>
                <p>Production stack, security protocols, and infrastructure guarantees.</p>
              </div>

              {service.technologiesUsed && service.technologiesUsed.length > 0 && (
                <div className={styles.techChipRow}>
                  {service.technologiesUsed.map((tech, idx) => (
                    <span key={idx} className={styles.techChip}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.specsGrid}>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}>
                    <Code size={20} />
                  </div>
                  <h4>Core Execution Stack</h4>
                  <p>
                    {service.technologiesUsed && service.technologiesUsed.length > 0
                      ? service.technologiesUsed.join(' • ')
                      : service.entity === 'str'
                      ? 'Next.js 16 + React 19 + TypeScript + Cloud APIs'
                      : 'Meta Ads Graph API + Google Ads + Verified MCA Filings'}
                  </p>
                </div>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}>
                    <Shield size={20} />
                  </div>
                  <h4>Security &amp; Compliance</h4>
                  <p>256-Bit SSL/TLS Encryption, ISO 9001:2015 Audited Delivery &amp; Confidentiality NDA</p>
                </div>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}>
                    <Database size={20} />
                  </div>
                  <h4>Cloud &amp; Reliability</h4>
                  <p>Automated backups, scalable server infrastructure, and 99.98% uptime guarantee</p>
                </div>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}>
                    <Smartphone size={20} />
                  </div>
                  <h4>Mobile-First Engineering</h4>
                  <p>Tested across iOS, Android, Tablet, and Desktop viewports from 320px to 4K</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'roadmap' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Project Roadmap &amp; Execution Milestones</h2>
                <p>Transparent step-by-step delivery synchronized with your CRM Client Portal.</p>
              </div>

              <div className={styles.timelineGrid}>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>1</div>
                  <h4>Requirement Sign-Off</h4>
                  <p>Briefing call, asset collection, scope alignment, and GST invoice confirmation.</p>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>2</div>
                  <h4>Design &amp; Blueprint</h4>
                  <p>Interactive UI/UX layout or strategic execution blueprint submitted for approval.</p>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>3</div>
                  <h4>Core Execution</h4>
                  <p>Full-stack implementation, integrations, or regulatory/marketing campaign launch.</p>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>4</div>
                  <h4>QA &amp; Live Handover</h4>
                  <p>ISO quality audit, production launch, training, and 30 days dedicated support.</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'faqs' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Frequently Asked Questions</h2>
                <p>Clear answers regarding billing, timelines, and post-launch support.</p>
              </div>

              <div className={styles.faqList}>
                {faqsList.map((faq, i) => (
                  <div key={i} className={styles.faqCard}>
                    <button
                      type="button"
                      className={styles.faqHead}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span>{faq.question}</span>
                      {openFaq === i ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {openFaq === i && <div className={styles.faqBody}>{faq.answer}</div>}
                  </div>
                ))}
              </div>

              <div className={styles.hotlineBox}>
                <h3>Need Custom Enterprise Scope or Clarification?</h3>
                <p>Connect directly with our engineering &amp; advisory leads for tailored guidance.</p>
                <div className={styles.hotlineBtns}>
                  <button type="button" className="btn btn-primary" onClick={handleWA}>
                    Chat on WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Fullscreen Modal */}
      {lightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeLightbox} onClick={() => setLightboxOpen(false)}>
              <X size={22} />
            </button>

            {screenshots.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.navImgBtn} ${styles.navPrev}`}
                  onClick={prevImg}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className={`${styles.navImgBtn} ${styles.navNext}`}
                  onClick={nextImg}
                  aria-label="Next screenshot"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <Image
              src={screenshots[activeImgIndex]?.url || '/assets/images/website-dev.jpg'}
              alt={screenshots[activeImgIndex]?.title || service.name}
              width={1200}
              height={800}
              className={styles.lightboxImg}
              unoptimized
            />
            <div className={styles.lightboxCaption}>
              <h3>{screenshots[activeImgIndex]?.title || `Preview #${activeImgIndex + 1}`}</h3>
              <p>
                Image {activeImgIndex + 1} of {screenshots.length} &bull; {service.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar (Mobile & Scroll) */}
      <div className={`${styles.stickyPanel} ${scrolled ? styles.stickyVisible : ''}`}>
        <div className={`container ${styles.stickyInner}`}>
          <div className={styles.stickyInfo}>
            <div className={styles.stickyTitle}>{service.name}</div>
            <div className={styles.stickyPrice}>{formatPrice(service.startingPrice)}</div>
          </div>
          <div className={styles.stickyActions}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleInstantOrder}
            >
              <Zap size={14} fill="#fff" /> Instant Order
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddToCart}>
              {isInCart ? 'In Cart' : 'Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
