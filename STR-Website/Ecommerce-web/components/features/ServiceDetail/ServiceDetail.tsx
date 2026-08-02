'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Check, X, ArrowLeft, Heart, ShoppingBag, Shield, Clock, 
  MessageCircle, Star, Maximize2, Sparkles, Layers, FileText, 
  HelpCircle, ChevronDown, ChevronRight, Award, Zap, CheckCircle, Code, Database, Smartphone
} from 'lucide-react';
import { type Service, CONTACT } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import styles from './ServiceDetail.module.css';

// 5 to 10 curated showcase screenshots/images per category
const getPortfolioImages = (category: string) => {
  const webPics = [
    { title: 'Responsive Hero Header', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' },
    { title: 'Interactive Dashboard View', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' },
    { title: 'Dynamic Content Management', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80' },
    { title: 'E-Commerce Product Showcase', url: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=800&auto=format&fit=crop&q=80' },
    { title: 'Mobile Responsive Layout', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80' },
    { title: 'SEO Optimized Page Structure', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop&q=80' },
    { title: 'Customer Contact & Inquiry Panel', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80' },
    { title: 'Razorpay Payment Gateway Modal', url: 'https://images.unsplash.com/photo-1556742049-0a67daf4005a?w=800&auto=format&fit=crop&q=80' },
    { title: 'Fast Loading Performance Audit', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80' },
    { title: 'SSL Security & Domain Setup', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80' },
  ];

  const appPics = [
    { title: 'Native iOS & Android Screen Mockups', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80' },
    { title: 'User Onboarding & Profile Setup', url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80' },
    { title: 'Real-time Push Notifications Interface', url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&auto=format&fit=crop&q=80' },
    { title: 'Dark Mode UI Experience', url: 'https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=800&auto=format&fit=crop&q=80' },
    { title: 'Cross-Platform Flutter Code Architecture', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80' },
    { title: 'REST API Integration & Data Sync', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80' },
    { title: 'Google Play & App Store Listing Preview', url: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&auto=format&fit=crop&q=80' },
    { title: 'In-App Payment Checkout Flow', url: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800&auto=format&fit=crop&q=80' },
  ];

  const softPics = [
    { title: 'Enterprise Dashboard & Analytics', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' },
    { title: 'Multi-Branch Inventory & Billing Engine', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' },
    { title: 'HR & Staff Payroll Module', url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80' },
    { title: 'CRM Client Lead Tracking Pipeline', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80' },
    { title: 'Automated Invoice Generation', url: 'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=800&auto=format&fit=crop&q=80' },
    { title: 'Role-Based Staff Access Control', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80' },
    { title: 'Data Export to Excel & PDF Reports', url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80' },
  ];

  const adsPics = [
    { title: 'Meta Ads Manager Campaign Setup', url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80' },
    { title: 'Targeted High-Converting Audience Split', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' },
    { title: 'Google Search Ads Top Keyword Bidding', url: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop&q=80' },
    { title: 'High-ROI Ad Creatives & Posters', url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=800&auto=format&fit=crop&q=80' },
    { title: 'Google Maps Business Profile Top Ranking', url: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&auto=format&fit=crop&q=80' },
    { title: 'Weekly & Monthly Performance Analytics', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80' },
  ];

  const videoPics = [
    { title: 'AI Voiceover & Script Generation', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80' },
    { title: '4K Ultra HD Animated Reel Render', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80' },
    { title: 'Animated Cartoon Character Scene', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
    { title: 'Product Showcase Motion Video', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80' },
    { title: 'Social Media Story Format Video', url: 'https://images.unsplash.com/photo-1598897689888-3485d46059c5?w=800&auto=format&fit=crop&q=80' },
  ];

  const legalPics = [
    { title: 'MCA Certificate of Incorporation', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' },
    { title: 'Official GSTIN Registration Document', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80' },
    { title: 'MSME Udyam Govt Certificate', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80' },
    { title: 'ITR Tax Filing CA Review Panel', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80' },
  ];

  if (category === 'app') return appPics;
  if (category === 'software') return softPics;
  if (['social-media', 'meta-ads', 'google-ads', 'google-business'].includes(category)) return adsPics;
  if (category === 'video-ai') return videoPics;
  if (category === 'business-legal') return legalPics;
  return webPics;
};

const FAQS_DATA = [
  { q: 'How does ordering this service work?', a: 'Add the package to your cart and proceed to checkout, or contact us directly on WhatsApp. Our expert team initiates requirement gathering within 2 hours.' },
  { q: 'Is ISO 9001:2015 certification valid for my business?', a: 'Yes! Both STR and SCS divisions operate strictly under ISO 9001:2015 standards, ensuring standardized quality, transparent SLA timelines, and clear deliverables.' },
  { q: 'Are there any hidden costs after purchase?', a: 'None! Upfront transparent pricing is our core policy. Any optional add-ons like custom domains or premium plugins will be discussed in advance.' },
  { q: 'What post-delivery support is included?', a: 'Every package includes 30 days of complimentary technical support, maintenance guidance, and bug fixes.' },
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

  const screenshots = getPortfolioImages(service.category);
  const isWishlisted = wishlistIds.includes(service.id);
  const isInCart = cart.some(c => c.serviceId === service.id);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 350);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (isInCart) {
      openCart();
      return;
    }
    addToCart({
      serviceId: service.id,
      serviceName: service.name,
      price: service.startingPrice,
      quantity: 1
    });
    openCart();
  };

  const handleWA = () => {
    const msg = `Hello Saampark,\n\nI want to order: *${service.name}*\nStarting Price: ${service.startingPrice ? '₹' + service.startingPrice : 'Custom Quote'}\n\nPlease share details and start my project.`;
    const phone = service.entity === 'str' ? '919091518567' : '918170082678';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Get a Custom Quote';
    const num = `₹${price.toLocaleString('en-IN')}`;
    return service.priceType === 'monthly' ? `${num} / month` : 
           service.priceType === 'weekly' ? `${num} / week` : num;
  };

  return (
    <div className={styles.wrapper}>
      {/* ── Breadcrumb Header ── */}
      <div className="container" style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>

      {/* ── Main Product Hero ── */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroGrid}>
            
            {/* Left Column: Interactive 5-10 Screenshot Gallery Viewer */}
            <div className={styles.galleryWrap}>
              <div className={styles.mainViewer}>
                <Image
                  src={screenshots[activeImgIndex]?.url || service.image || '/assets/images/website-dev.jpg'}
                  alt={screenshots[activeImgIndex]?.title || service.name}
                  width={800}
                  height={500}
                  className={styles.mainImage}
                  priority
                  unoptimized
                />
                
                <button 
                  className={styles.lightboxTrigger}
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Zoom screenshot"
                >
                  <Maximize2 size={16} /> Fullscreen Zoom
                </button>

                <div className={styles.imgBadge}>
                  {screenshots[activeImgIndex]?.title || `Screenshot ${activeImgIndex + 1}`}
                </div>
              </div>

              {/* Thumbnails Row (5 to 10 screenshots) */}
              <div className={styles.thumbScroll}>
                {screenshots.map((item, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumbBtn} ${activeImgIndex === idx ? styles.activeThumb : ''}`}
                    onClick={() => setActiveImgIndex(idx)}
                  >
                    <Image
                      src={item.url}
                      alt={item.title}
                      width={100}
                      height={65}
                      className={styles.thumbImg}
                    />
                    <span className={styles.thumbLabel}>SS {idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Key Details & Purchase Box */}
            <div className={styles.buyCard}>
              <div className={styles.badgeRow}>
                <span className={`badge ${service.entity === 'str' ? 'badge-str' : 'badge-scs'}`}>
                  {service.entity.toUpperCase()} • {service.entity === 'str' ? 'Technology Division' : 'Consultancy Service'}
                </span>
                {service.badge && <span className="badge badge-warning">{service.badge}</span>}
              </div>

              <h1 className={styles.productTitle}>{service.name}</h1>
              <p className={styles.productDesc}>{service.description}</p>

              {/* Trust signals */}
              <div className={styles.trustGrid}>
                <div className={styles.trustItem}>
                  <Star size={16} className={styles.starIcon} />
                  <span><strong>4.9 / 5.0</strong> Client Rating</span>
                </div>
                <div className={styles.trustItem}>
                  <Award size={16} className={styles.awardIcon} />
                  <span>ISO 9001:2015 Certified</span>
                </div>
                {service.deliveryDays && (
                  <div className={styles.trustItem}>
                    <Clock size={16} className={styles.clockIcon} />
                    <span><strong>{service.deliveryDays} Days</strong> Delivery SLA</span>
                  </div>
                )}
              </div>

              {/* Pricing Box */}
              <div className={styles.priceContainer}>
                <div className={styles.priceHead}>Standard Package Pricing</div>
                <div className={styles.priceVal}>{formatPrice(service.startingPrice)}</div>
                <div className={styles.priceSub}>Upfront billing • Zero hidden maintenance fees</div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionBtns}>
                <button 
                  className={`btn btn-primary btn-lg ${styles.cartBtn}`} 
                  onClick={handleAddToCart}
                >
                  {isInCart ? 'View in Cart' : 'Add to Cart'} <ShoppingBag size={18} />
                </button>
                
                <button 
                  className={`btn btn-secondary btn-lg ${styles.waBtn}`} 
                  onClick={handleWA}
                >
                  <MessageCircle size={18} /> WhatsApp Inquiry
                </button>

                <button 
                  className={`btn btn-icon btn-ghost ${isWishlisted ? styles.wishActive : ''}`} 
                  onClick={() => toggleWishlist(service.id)}
                  title="Add to Wishlist"
                >
                  <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className={styles.guaranteeNote}>
                🔒 100% Satisfaction Guarantee • Direct Engineer & Consultant Access
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5-Page Navigation Document Tabs ── */}
      <section className={styles.tabSection}>
        <div className="container">
          <div className={styles.tabBar}>
            <button 
              className={`${styles.tabBtn} ${selectedTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('overview')}
            >
              <span className={styles.pageBadge}>Page 1</span> <Zap size={15} /> Executive Overview
            </button>
            <button 
              className={`${styles.tabBtn} ${selectedTab === 'specs' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('specs')}
            >
              <span className={styles.pageBadge}>Page 2</span> <FileText size={15} /> Tech Specs & Architecture
            </button>
            <button 
              className={`${styles.tabBtn} ${selectedTab === 'roadmap' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('roadmap')}
            >
              <span className={styles.pageBadge}>Page 3</span> <CheckCircle size={15} /> 5-Phase Roadmap
            </button>
            <button 
              className={`${styles.tabBtn} ${selectedTab === 'gallery' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('gallery')}
            >
              <span className={styles.pageBadge}>Page 4</span> <Layers size={15} /> 5-10 Screenshots ({screenshots.length})
            </button>
            <button 
              className={`${styles.tabBtn} ${selectedTab === 'faqs' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('faqs')}
            >
              <span className={styles.pageBadge}>Page 5</span> <HelpCircle size={15} /> FAQs & Hotline
            </button>
          </div>
        </div>
      </section>

      {/* ── Tab Content ── */}
      <section className={styles.tabContentSection}>
        <div className="container">
          
          {/* TAB 1: OVERVIEW & DELIVERABLES */}
          {selectedTab === 'overview' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>Core Features & Included Deliverables</h2>
                <p>Comprehensive breakdown of everything provided with your order.</p>
              </div>

              <div className={styles.featureGrid}>
                {service.features.map((feat, i) => (
                  <div key={i} className={styles.featureCard}>
                    <div className={styles.featIcon}>
                      <Check size={18} />
                    </div>
                    <div className={styles.featText}>
                      <h4>{feat}</h4>
                      <p>Included in standard order specification with full ISO 9001:2015 quality check.</p>
                    </div>
                  </div>
                ))}
              </div>

              {service.notIncluded && service.notIncluded.length > 0 && (
                <div className={styles.notIncludedBlock}>
                  <h3>Not Included (Optional Add-ons Available)</h3>
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

          {/* TAB 2: 5-10 SCREENSHOTS GALLERY */}
          {selectedTab === 'gallery' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>📸 5-10 Live Screenshots & UI Template Showcase</h2>
                <p>Click any screenshot to zoom in full resolution.</p>
              </div>

              <div className={styles.galleryGrid}>
                {screenshots.map((ss, idx) => (
                  <div 
                    key={idx} 
                    className={styles.galleryCard}
                    onClick={() => { setActiveImgIndex(idx); setLightboxOpen(true); }}
                  >
                    <div className={styles.galleryImgWrap}>
                      <Image
                        src={ss.url}
                        alt={ss.title}
                        width={400}
                        height={260}
                        className={styles.galleryImg}
                      />
                      <div className={styles.galleryOverlay}>
                        <Maximize2 size={24} color="#FFF" />
                        <span>Click to Zoom</span>
                      </div>
                    </div>
                    <div className={styles.galleryMeta}>
                      <span className={styles.ssIndex}>Screenshot #{idx + 1}</span>
                      <h4 className={styles.ssTitle}>{ss.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 2: TECH SPECS & SYSTEM ARCHITECTURE */}
          {selectedTab === 'specs' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>⚙️ Page 2: Technical Specifications & System Architecture</h2>
                <p>Granular breakdown of frameworks, security protocols, API endpoints & database schemas.</p>
              </div>

              <div className={styles.specsGrid}>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}><Code size={20} /></div>
                  <h4>Technology Framework</h4>
                  <p>{service.entity === 'str' ? 'Next.js 16 + React 19 + TypeScript + Tailwind CSS / Vanilla CSS' : 'Meta Ads Graph API v19 + Google Ads API + Python Analytics Engine'}</p>
                </div>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}><Shield size={20} /></div>
                  <h4>Security & Encryption</h4>
                  <p>256-Bit SSL/TLS Encryption, ISO 9001:2015 Verified Security Code Audit & Automated OWASP Compliance</p>
                </div>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}><Database size={20} /></div>
                  <h4>Database & Infrastructure</h4>
                  <p>PostgreSQL / MySQL InnoDB Cluster with Daily Automated Offsite Backups & 99.9% Server Uptime SLA</p>
                </div>
                <div className={styles.specCard}>
                  <div className={styles.specIcon}><Smartphone size={20} /></div>
                  <h4>Mobile & Cross-Platform</h4>
                  <p>100% Mobile Responsive (320px to 4K resolution) + PWA Progressive Web App Support</p>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: 5-PHASE PROJECT ROADMAP */}
          {selectedTab === 'roadmap' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>🚀 Page 3: 5-Phase Project Roadmap & Delivery Milestones</h2>
                <p>Structured execution pipeline ensuring fast, transparent, zero-delay project delivery.</p>
              </div>

              <div className={styles.timelineGrid}>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>1</div>
                  <h4>Phase 1: Requirement Analysis & Sign-off</h4>
                  <p>In-depth discovery call, business goals mapping, brand assets collection & hosting config.</p>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>2</div>
                  <h4>Phase 2: UI/UX Design & Prototype</h4>
                  <p>Wireframing, modern desktop & mobile UI design, interactive color palette & client approval.</p>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>3</div>
                  <h4>Phase 3: Core Engineering & Backend</h4>
                  <p>Full-stack development, database schema build, API integration & payment gateway setup.</p>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>4</div>
                  <h4>Phase 4: ISO Security & QA Audit</h4>
                  <p>Penetration security check, mobile responsiveness testing & ISO 9001:2015 quality verification.</p>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.stepNum}>5</div>
                  <h4>Phase 5: Production Launch & 30-Day Support</h4>
                  <p>Live deployment, domain DNS mapping, admin panel walkthrough & 30 days dedicated helpline support.</p>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 5: FAQS & DIRECT HOTLINE */}
          {selectedTab === 'faqs' && (
            <div className={styles.tabPane}>
              <div className={styles.paneHeader}>
                <h2>💡 Page 5: FAQs & Direct Consultation Hotline</h2>
                <p>Got questions? Speak directly with our lead software engineers & marketing directors.</p>
              </div>

              <div className={styles.faqList}>
                {FAQS_DATA.map((faq, i) => (
                  <div key={i} className={styles.faqCard}>
                    <button 
                      className={styles.faqHead}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span>{faq.q}</span>
                      {openFaq === i ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {openFaq === i && (
                      <div className={styles.faqBody}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.hotlineBox}>
                <h3>Need Immediate Assistance or Custom Requirements?</h3>
                <p>Contact our direct ISO certified helpline for instant assistance.</p>
                <div className={styles.hotlineBtns}>
                  <button className="btn btn-primary" onClick={handleWA}>
                    Instant WhatsApp Chat →
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── Lightbox Fullscreen Modal ── */}
      {lightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeLightbox} onClick={() => setLightboxOpen(false)}>
              <X size={24} />
            </button>
            <Image
              src={screenshots[activeImgIndex]?.url || service.image || '/assets/images/website-dev.jpg'}
              alt={screenshots[activeImgIndex]?.title || service.name}
              width={1200}
              height={800}
              className={styles.lightboxImg}
            />
            <div className={styles.lightboxCaption}>
              <h3>{screenshots[activeImgIndex]?.title || `Screenshot #${activeImgIndex + 1}`}</h3>
              <p>Screenshot {activeImgIndex + 1} of {screenshots.length} • {service.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Bottom Mobile Action Bar ── */}
      <div className={`${styles.stickyPanel} ${scrolled ? styles.stickyVisible : ''}`}>
        <div className={`container ${styles.stickyInner}`}>
          <div className={styles.stickyInfo}>
            <div className={styles.stickyTitle}>{service.name}</div>
            <div className={styles.stickyPrice}>{formatPrice(service.startingPrice)}</div>
          </div>
          <div className={styles.stickyActions}>
            <button className="btn btn-primary btn-sm" onClick={handleAddToCart}>
              {isInCart ? 'View Cart' : 'Add to Cart'} <ShoppingBag size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
