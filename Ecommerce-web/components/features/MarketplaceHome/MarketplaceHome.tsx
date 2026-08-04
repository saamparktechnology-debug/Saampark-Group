'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, ShoppingBag, Check, Eye } from 'lucide-react';
import { allServices, type Service } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { PromoCarousel } from '../PromoCarousel/PromoCarousel';
import { CategoryCoverflow } from '../CategoryCoverflow/CategoryCoverflow';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader/SkeletonLoader';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import styles from './MarketplaceHome.module.css';

const SECTION_GROUPS = [
  // ── Technology (STR) ──
  {
    id: 'web-development',
    title: '🌐 Web Development',
    description: 'Static, dynamic, and full e-commerce websites engineered for high performance.',
    sector: 'web-development',
  },
  {
    id: 'web-design',
    title: '🎨 Web & UI/UX Design',
    description: 'High-converting landing pages and complete SaaS application interfaces.',
    sector: 'web-design',
  },
  {
    id: 'app-development',
    title: '📱 Mobile App Development',
    description: 'Native Android and cross-platform hybrid applications for iOS & Android.',
    sector: 'app-development',
  },
  {
    id: 'ai-integration',
    title: '🤖 AI & Automation Integration',
    description: 'Intelligent GPT chatbots and custom automated workflows to scale operations.',
    sector: 'ai-integration',
  },
  {
    id: 'software-erp',
    title: '⚙️ Enterprise Software & CRM',
    description: 'Comprehensive ERP portals and CRM systems to manage business at scale.',
    sector: 'software-erp',
  },
  // ── Marketing (SCS) ──
  {
    id: 'digital-marketing',
    title: '📢 Digital & Social Marketing',
    description: 'Professional social media management and content marketing strategies.',
    sector: 'digital-marketing',
  },
  {
    id: 'ads-management',
    title: '🎯 Ads Management (Meta & Google)',
    description: 'High-converting paid advertising campaigns across Facebook, Instagram, and Google.',
    sector: 'ads-management',
  },
  {
    id: 'video-animation',
    title: '🎬 Video & Animation Studio',
    description: 'Fully AI-generated marketing videos and engaging 2D cartoon explainers.',
    sector: 'video-animation',
  },
  {
    id: 'seo-local',
    title: '📍 SEO & Local Business Profiles',
    description: 'Advanced technical SEO and Google Business Profile domination.',
    sector: 'seo-local',
  },
  // ── Research ──
  {
    id: 'market-research',
    title: '🔬 Market & Consumer Research',
    description: 'In-depth competitor analysis, market sizing, and consumer sentiment surveys.',
    sector: 'market-research',
  },
  {
    id: 'financial-research',
    title: '📈 Financial & Stock Research',
    description: 'Equity market trends, stock fundamentals, and quantitative algorithmic strategies.',
    sector: 'financial-research',
  },
  {
    id: 'ux-research',
    title: '👁️ UX & Usability Research',
    description: 'Heuristic audits and user journey mapping for digital products.',
    sector: 'ux-research',
  },
  // ── Consultancy ──
  {
    id: 'business-legal',
    title: '⚖️ Business & Legal Setup',
    description: 'Hassle-free Private Limited company incorporation, GST, and MSME registrations.',
    sector: 'business-legal',
  },
  {
    id: 'financial-tax',
    title: '💰 Financial & Tax Consulting',
    description: 'Corporate tax optimization, financial auditing, and VC pitch preparation.',
    sector: 'financial-tax',
  },
  {
    id: 'hr-operations',
    title: '👥 HR & Operations Consulting',
    description: 'Scalable HR policies, payroll structuring, and employee compliance protocols.',
    sector: 'hr-operations',
  },
];

function ServiceThumbnail({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={340}
      height={200}
      className={className}
      priority
      unoptimized
      onError={() => setImgSrc('/assets/images/website-dev.jpg')}
    />
  );
}

export function MarketplaceHome() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-tertiary)' }}>Loading catalog...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | 'str' | 'scs'>('all');
  const [loading, setLoading] = useState(false);
  const [quickViewService, setQuickViewService] = useState<Service | null>(null);

  const { wishlistIds, toggleWishlist, compareIds, toggleCompare, addToCart, cart } = useCommerceStore();
  const { openCart, openCompare } = useUIStore();

  useEffect(() => {
    const querySearch = searchParams.get('search');
    setSearch(querySearch || '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [search, entityFilter]);

  const filteredServices = useMemo(() => {
    let result = allServices;
    
    if (entityFilter !== 'all') {
      result = result.filter(s => s.entity === entityFilter);
    }
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    
    return [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }, [search, entityFilter]);

  const getDeterministicRating = (id: string) => {
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rating = (4.6 + (sum % 4) * 0.1).toFixed(1);
    const reviews = 18 + (sum % 70);
    return { rating, reviews };
  };

  const getOriginalPrice = (price: number | null) => {
    if (!price) return null;
    return Math.round(price * 1.25);
  };

  const formatPrice = (price: number | null, type: string) => {
    if (!price) return 'Get a Quote';
    return `₹${price.toLocaleString('en-IN')}${type === 'monthly' ? '/mo' : type === 'weekly' ? '/wk' : ''}`;
  };

  const handleAddToCart = (e: React.MouseEvent, svc: any) => {
    e.preventDefault();
    e.stopPropagation();
    const isInCart = cart.some(c => c.serviceId === svc.id);
    if (isInCart) {
      openCart();
      return;
    }
    addToCart({
      serviceId: svc.id,
      serviceName: svc.name,
      price: svc.startingPrice,
      quantity: 1
    });
    openCart();
  };

  const handleClearFilters = () => {
    setSearch('');
    router.push('/');
  };

  const renderCard = (svc: any) => {
    const isWishlisted = wishlistIds.includes(svc.id);
    const isCompared = compareIds.includes(svc.id);
    const isInCart = cart.some(c => c.serviceId === svc.id);
    const { rating, reviews } = getDeterministicRating(svc.id);
    const originalPrice = getOriginalPrice(svc.startingPrice);

    return (
      <div key={svc.id} className={styles.card}>
        <div className={styles.imageWrap}>
          <ServiceThumbnail 
            src={svc.image || '/assets/images/website-dev.jpg'} 
            alt={svc.name} 
            className={styles.thumbnail}
          />

          {svc.badge && (
            <div className={styles.offerBadge}>
              {svc.badge}
            </div>
          )}
          
          <button 
            className={`${styles.wishBtn} ${isWishlisted ? styles.wishlisted : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(svc.id); }}
            aria-label="Wishlist"
          >
            <Bookmark size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          <button 
            className={styles.quickViewBtn}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewService(svc); }}
            title="Quick View Details & 5-10 Screenshots"
          >
            <Eye size={14} /> Quick View
          </button>

          <span className={`${styles.entityBadge} ${svc.entity === 'str' ? styles.badgeStr : styles.badgeScs}`}>
            {svc.entity.toUpperCase()}
          </span>
        </div>
        
        <Link href={svc.href} className={styles.cardLink}>
          <div className={styles.cardBody}>
            <div className={styles.ratingRow}>
              <span className={styles.stars}>★ {rating}</span>
              <span className={styles.reviews}>({reviews} reviews)</span>
            </div>

            <h3 className={styles.cardTitle}>{svc.name}</h3>
            <p className={styles.cardDesc}>{svc.description}</p>
            
            <div className={styles.priceRow}>
              <div className={styles.priceCol}>
                {originalPrice && (
                  <span className={styles.originalPrice}>
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className={styles.price}>{formatPrice(svc.startingPrice, svc.priceType)}</span>
              </div>
              {svc.deliveryDays && <span className={styles.delivery}>⚡ {svc.deliveryDays}d</span>}
            </div>
          </div>
        </Link>
        
        <div className={styles.cardActions}>
          <button 
            onClick={(e) => handleAddToCart(e, svc)}
            className={`btn btn-sm ${isInCart ? 'btn-secondary' : 'btn-primary'}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {isInCart ? <Check size={14} /> : <ShoppingBag size={14} />}
            {isInCart ? 'In Cart' : 'Add to Cart'}
          </button>
          
          <label className={styles.compareCheck} onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox" 
              checked={isCompared}
              onChange={() => { toggleCompare(svc.id); openCompare(); }} 
            />
            <span className={styles.compareLabel}>Compare</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.marketplace}>
      <div className={`container ${styles.layout}`}>
        <main className={styles.main}>
          <PromoCarousel />
          <CategoryCoverflow />

          <div className={styles.resultsHeader}>
            <p className={styles.resultsCount}>Showing <strong>{filteredServices.length}</strong> services</p>

            {/* Entity Filter Dropdown */}
            <div className={styles.filterDropdownContainer}>
              <select 
                className={styles.filterDropdown}
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value as any)}
              >
                <option value="all">All Group Services</option>
                <option value="str">🌐 Saampark Technology</option>
                <option value="research">🔬 Saampark Research</option>
                <option value="consultancy">💼 Saampark Consultancy</option>
              </select>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader count={10} />
          ) : search ? (
            <div className={styles.grid}>
              {filteredServices.map(svc => renderCard(svc))}
            </div>
          ) : (
            <div className={styles.sectionsContainer}>
              {SECTION_GROUPS.map(group => {
                const groupServices = filteredServices.filter(svc => svc.sector === group.sector);
                if (groupServices.length === 0) return null;

                return (
                  <section key={group.id} id={group.id} className={styles.catalogSection}>
                    <div className={styles.sectionHeadingWrap}>
                      <h2 className={styles.sectionHeading}>{group.title}</h2>
                      <p className={styles.sectionHeadingDesc}>{group.description}</p>
                    </div>
                    <div className={styles.grid}>
                      {groupServices.map(svc => renderCard(svc))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
          
          {!loading && filteredServices.length === 0 && (
            <div className={styles.emptyState}>
              <h3>No services found</h3>
              <p>Try adjusting your search query.</p>
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                Clear Search
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Instant Quick View Modal with 5-10 Screenshots */}
      {quickViewService && (
        <ProductQuickViewModal
          service={quickViewService}
          onClose={() => setQuickViewService(null)}
        />
      )}
    </div>
  );
}
