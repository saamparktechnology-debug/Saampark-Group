'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bookmark,
  ShoppingBag,
  Check,
  Eye,
  ChevronDown,
  X,
  Search,
  Grid,
  List,
  RotateCcw,
  Sparkles,
  Layers,
  Globe,
  LineChart,
  Briefcase,
  Smartphone,
  Cpu,
  Bot,
  TrendingUp,
  PieChart,
  BarChart3,
  Palette,
  Video,
  Megaphone,
  Coins,
  ShieldCheck,
  GraduationCap,
  Scale,
  SlidersHorizontal,
  Wrench,
  Server,
  Film,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  allServices,
  SERVICE_GROUPS,
  SERVICE_CATEGORIES,
  type Service,
  type ServiceGroup,
  type PrimaryCategory,
} from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { PromoCarousel } from '../PromoCarousel/PromoCarousel';
import { CategoryCoverflow } from '../CategoryCoverflow/CategoryCoverflow';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader/SkeletonLoader';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import { Interactive3DCanvas } from '@/components/ui/Interactive3DCanvas/Interactive3DCanvas';
import { GlassTrustMarquee } from '@/components/ui/GlassTrustMarquee/GlassTrustMarquee';
import { InteractiveTiltCard } from '@/components/ui/InteractiveTiltCard/InteractiveTiltCard';
import { CostEstimator } from '@/components/features/CostEstimator/CostEstimator';
import { InteractiveFAQ } from '@/components/features/InteractiveFAQ/InteractiveFAQ';
import styles from './MarketplaceHome.module.css';

// Dynamic Icon Map for Lucide Icons
const ICON_MAP: Record<string, React.ReactNode> = {
  Globe: <Globe size={16} />,
  LineChart: <LineChart size={16} />,
  Briefcase: <Briefcase size={16} />,
  Smartphone: <Smartphone size={16} />,
  Cpu: <Cpu size={16} />,
  Bot: <Bot size={16} />,
  Search: <Search size={16} />,
  TrendingUp: <TrendingUp size={16} />,
  PieChart: <PieChart size={16} />,
  BarChart3: <BarChart3 size={16} />,
  Palette: <Palette size={16} />,
  Video: <Video size={16} />,
  Megaphone: <Megaphone size={16} />,
  Coins: <Coins size={16} />,
  ShieldCheck: <ShieldCheck size={16} />,
  GraduationCap: <GraduationCap size={16} />,
  Scale: <Scale size={16} />,
  Wrench: <Wrench size={16} />,
  Server: <Server size={16} />,
};

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

function CategorySectionBlock({
  cat,
  group,
  catServices,
  viewMode,
  renderCard,
}: {
  cat: any;
  group: any;
  catServices: Service[];
  viewMode: 'grid' | 'list' | 'cinematic';
  renderCard: (svc: Service) => React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHorizontal = viewMode === 'grid' && catServices.length > 4;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section key={cat.id} id={cat.id} className={styles.categorySection}>
      <div className={styles.categorySectionHeader}>
        <div className={styles.catHeaderLeft}>
          <span
            className={styles.catGroupTag}
            style={{ color: group.id === 'technology' ? 'var(--palette-sage-green, #9CAF88)' : 'var(--palette-tomato-red, #EB412C)' }}
          >
            {group.name.toUpperCase()}
          </span>
          <h3 className={styles.catTitle}>
            {cat.name}{' '}
            <span className={styles.catLiveCountPill}>{catServices.length} Services</span>
          </h3>
        </div>

        {isHorizontal && (
          <div className={styles.horizontalNavControls}>
            <span className={styles.scrollHintBadge}>
              Scroll to explore all {catServices.length} →
            </span>
            <button
              type="button"
              className={styles.catNavBtn}
              onClick={() => scroll('left')}
              aria-label={`Scroll ${cat.name} left`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className={styles.catNavBtn}
              onClick={() => scroll('right')}
              aria-label={`Scroll ${cat.name} right`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {isHorizontal ? (
        <div className={styles.horizontalScrollTrack} ref={scrollRef}>
          {catServices.map(svc => (
            <div key={svc.id} className={styles.horizontalCardWrap}>
              {renderCard(svc)}
            </div>
          ))}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? styles.grid : viewMode === 'cinematic' ? styles.cinematicLayout : styles.listLayout}>
          {catServices.map(svc => renderCard(svc))}
        </div>
      )}
    </section>
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

  // Filters State
  const [liveServices, setLiveServices] = useState<Service[]>(allServices);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<ServiceGroup | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PrimaryCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price-low' | 'price-high' | 'newest'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'cinematic'>('grid');

  // Hydrate catalog dynamically from CRM2 Storefront API so Admin Panel edits reflect live
  useEffect(() => {
    fetch('/api/storefront', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json?.success || !json?.data?.products) return;
        const crmTech = Array.isArray(json.data.products.tech) ? json.data.products.tech : [];
        const crmConsult = Array.isArray(json.data.products.consultancy) ? json.data.products.consultancy : [];
        const combined = [...crmTech, ...crmConsult];
        if (combined.length === 0) return;

        // Map CRM2 products cleanly onto storefront Service shape while preserving static defaults as fallback
        const staticBySlug = new Map(allServices.map((s) => [s.slug, s]));
        const mapped: Service[] = combined.map((p: any) => {
          const fallback = staticBySlug.get(p.slug);
          const groupNorm: ServiceGroup =
            p.companyId === 'consultancy' || p.group === 'consultancy' ? 'consultancy' : 'technology';
          const entityNorm = groupNorm === 'consultancy' ? 'scs' : 'str';
          return {
            ...(fallback || {}),
            id: p.id || fallback?.id || p.slug,
            name: p.name || fallback?.name || 'Service Package',
            shortName: p.shortName || fallback?.shortName || p.name,
            slug: p.slug || fallback?.slug || p.id,
            group: groupNorm,
            entity: (p.entity || fallback?.entity || entityNorm) as any,
            primaryCategory: (p.primaryCategory || fallback?.primaryCategory || 'web-services') as PrimaryCategory,
            category: (p.category || fallback?.category || 'website') as any,
            sector: p.sector || fallback?.sector || 'web-development',
            startingPrice: typeof p.discountPrice === 'number' && p.discountPrice > 0 ? p.discountPrice : (p.startingPrice ?? fallback?.startingPrice ?? null),
            priceType: p.priceType || fallback?.priceType || 'one-time',
            deliveryDays: typeof p.deliveryDays === 'number'
              ? p.deliveryDays
              : parseInt(String(p.deliveryDays || fallback?.deliveryDays || '5'), 10) || 5,
            badge: p.badge !== undefined ? p.badge : fallback?.badge,
            isPopular: p.isPopular ?? fallback?.isPopular ?? false,
            isFeatured: p.isFeatured ?? fallback?.isFeatured ?? false,
            image: p.image || fallback?.image || '/assets/images/website-dev.jpg',
            color: p.color || fallback?.color || '#2563EB',
            icon: p.icon || fallback?.icon || 'Globe',
            href: p.href || fallback?.href || `/${groupNorm}/${p.sector || 'solutions'}/${p.slug}`,
            description: p.description || fallback?.description || '',
            features: Array.isArray(p.features) && p.features.length > 0 ? p.features : (fallback?.features || []),
            notIncluded: Array.isArray(p.notIncluded) ? p.notIncluded : fallback?.notIncluded,
          } as Service;
        });

        // Append any static services not overridden by CRM slugs so nothing disappears unexpectedly
        const seenSlugs = new Set(mapped.map((m) => m.slug));
        const merged = [...mapped, ...allServices.filter((s) => !seenSlugs.has(s.slug))];
        setLiveServices(merged);
      })
      .catch(() => {});
  }, []);

  // UI Dropdowns State
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [quickViewService, setQuickViewService] = useState<Service | null>(null);

  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);

  const { wishlistIds, toggleWishlist, compareIds, toggleCompare, addToCart, cart } = useCommerceStore();
  const { openCart, openCompare } = useUIStore();

  // Read search param from URL if available
  useEffect(() => {
    const querySearch = searchParams.get('search');
    const queryGroup = searchParams.get('group') as ServiceGroup;
    const queryCategory = searchParams.get('category') as PrimaryCategory;

    if (querySearch) setSearch(querySearch);
    if (queryGroup && ['technology', 'consultancy'].includes(queryGroup)) setGroupFilter(queryGroup);
    if (queryCategory) setCategoryFilter(queryCategory);
  }, [searchParams]);

  // Handle escape key to close dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGroupDropdownOpen(false);
        setExplorerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setGroupDropdownOpen(false);
      }
      if (explorerRef.current && !explorerRef.current.contains(e.target as Node)) {
        setExplorerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simulate loader on filter changes for smooth feel
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [search, groupFilter, categoryFilter, sortBy]);

  // Deterministic ratings generator
  const getDeterministicRating = (id: string) => {
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rating = (4.6 + (sum % 4) * 0.1).toFixed(1);
    const reviews = 18 + (sum % 70);
    return { rating, reviews };
  };

  // Dynamic Live Counts Calculations
  const totalServicesCount = useMemo(() => liveServices.length, [liveServices]);

  const groupCounts: Record<string, number> = useMemo(() => {
    return {
      technology: liveServices.filter(s => s.group === 'technology').length,
      consultancy: liveServices.filter(s => s.group === 'consultancy').length,
      research: liveServices.filter(s => s.group === 'research').length,
    };
  }, [liveServices]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SERVICE_CATEGORIES.forEach(cat => {
      counts[cat.id] = liveServices.filter(s => s.primaryCategory === cat.id).length;
    });
    return counts;
  }, [liveServices]);

  // Filtered Services Dataset
  const filteredServices = useMemo(() => {
    let result = liveServices;

    if (groupFilter !== 'all') {
      result = result.filter(s => s.group === groupFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(s => s.primaryCategory === categoryFilter);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.group.toLowerCase().includes(q) ||
          s.primaryCategory.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      if (sortBy === 'rating') return parseFloat(getDeterministicRating(b.id).rating) - parseFloat(getDeterministicRating(a.id).rating);
      if (sortBy === 'price-low') return (a.startingPrice || 999999) - (b.startingPrice || 999999);
      if (sortBy === 'price-high') return (b.startingPrice || 0) - (a.startingPrice || 0);
      if (sortBy === 'newest') return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      return 0;
    });
  }, [liveServices, groupFilter, categoryFilter, search, sortBy]);

  const liveGroupCount = useMemo(() => {
    if (groupFilter === 'all') return totalServicesCount;
    return (groupCounts as Record<string, number>)[groupFilter] || 0;
  }, [groupFilter, totalServicesCount, groupCounts]);

  const handleClearFilters = () => {
    setSearch('');
    setGroupFilter('all');
    setCategoryFilter('all');
    setSortBy('popular');
    router.push('/');
  };

  const handleAddToCart = (e: React.MouseEvent, svc: Service) => {
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
      quantity: 1,
    });
    openCart();
  };

  const handleHeroSelectDivision = (division: 'technology' | 'consultancy' | 'all') => {
    setGroupFilter(division);
    setCategoryFilter('all');
  };

  const getOriginalPrice = (price: number | null) => {
    if (!price) return null;
    return Math.round(price * 1.25);
  };

  const formatPrice = (price: number | null, type: string) => {
    if (!price) return 'Get a Quote';
    return `₹${price.toLocaleString('en-IN')}${type === 'monthly' ? '/mo' : type === 'weekly' ? '/wk' : ''}`;
  };

  // Render Service Card
  const renderCard = (svc: Service) => {
    const isWishlisted = wishlistIds.includes(svc.id);
    const isCompared = compareIds.includes(svc.id);
    const isInCart = cart.some(c => c.serviceId === svc.id);
    const { rating, reviews } = getDeterministicRating(svc.id);
    const originalPrice = getOriginalPrice(svc.startingPrice);
    const cardGlow =
      svc.group === 'technology'
        ? 'rgba(156, 175, 136, 0.45)'
        : 'rgba(235, 65, 44, 0.45)';

    const techBadge =
      svc.group === 'technology'
        ? svc.primaryCategory === 'web-services'
          ? 'Next.js 16 • TS'
          : svc.primaryCategory === 'application-services'
            ? 'Flutter • iOS/Android'
            : svc.primaryCategory === 'ai-services'
              ? 'GPT-4o • Agents'
              : svc.primaryCategory === 'software-services'
                ? 'Cloud ERP • SaaS'
                : 'Server SLA 99.9%'
        : svc.primaryCategory === 'digital-marketing'
          ? 'ROAS 4.8x • Meta Ads'
          : svc.primaryCategory === 'legal'
            ? 'MCA Govt • ISO'
            : svc.primaryCategory === 'ai-video'
              ? 'Studio 4K • AI Voice'
              : 'Enterprise Scale';

    const topFeatures = svc.features ? svc.features.slice(0, 2) : [];
    const discountPercent = originalPrice && svc.startingPrice
      ? Math.round(((originalPrice - svc.startingPrice) / originalPrice) * 100)
      : null;

    return (
      <InteractiveTiltCard key={svc.id} glowColor={cardGlow}>
        <div className={`${styles.card} ${viewMode === 'list' ? styles.listCard : ''} ${viewMode === 'cinematic' ? styles.cinematicCard : ''}`}>
          <div className={styles.liquidGlassSheen} />
          
          <div className={styles.imageWrap}>
            <ServiceThumbnail
              src={svc.image || '/assets/images/website-dev.jpg'}
              alt={svc.name}
              className={styles.thumbnail}
            />

            {svc.badge && <div className={styles.offerBadge}>{svc.badge}</div>}

            {/* Holographic Tech Stack Indicator */}
            <div className={styles.techPillOverlay}>
              <span className={styles.techPillDot}>●</span>
              <span>{techBadge}</span>
            </div>

            <button
              className={`${styles.wishBtn} ${isWishlisted ? styles.wishlisted : ''}`}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(svc.id);
              }}
              aria-label="Wishlist"
            >
              <Bookmark size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>

            <button
              className={styles.quickViewBtn}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewService(svc);
              }}
              title="Quick View Details"
            >
              <Eye size={13} /> Quick Specs
            </button>

            <span
              className={styles.entityBadge}
              style={{
                background:
                  svc.group === 'technology'
                    ? 'linear-gradient(135deg, #9CAF88 0%, #7E916C 100%)'
                    : 'linear-gradient(135deg, #EB412C 0%, #C22F1D 100%)',
              }}
            >
              {svc.group.toUpperCase()}
            </span>
          </div>

          <Link href={svc.href} className={styles.cardLink}>
            <div className={styles.cardBody}>
              <div className={styles.ratingRow}>
                <span className={styles.stars}>{rating}</span>
                <span className={styles.reviews}>({reviews} reviews)</span>
                <span className={styles.verifiedTag}>Verified ISO</span>
              </div>

              <h3 className={styles.cardTitle}>{svc.name}</h3>
              <p className={styles.cardDesc}>{svc.description}</p>

              {/* Top Deliverables Feature Pills */}
              {topFeatures.length > 0 && (
                <ul className={styles.cardFeaturePills}>
                  {topFeatures.map((feat, fIdx) => (
                    <li key={fIdx} className={styles.cardFeatureItem}>
                      <Check size={11} className={styles.cardFeatureIcon} />
                      <span className={styles.cardFeatureText}>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.priceRow}>
                <div className={styles.priceCol}>
                  {originalPrice && (
                    <div className={styles.priceOldRow}>
                      <span className={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>
                      {discountPercent && discountPercent > 0 && (
                        <span className={styles.discountBadge}>SAVE {discountPercent}%</span>
                      )}
                    </div>
                  )}
                  <span className={styles.price}>{formatPrice(svc.startingPrice, svc.priceType)}</span>
                </div>
                {svc.deliveryDays && <span className={styles.delivery}>{svc.deliveryDays}d Delivery SLA</span>}
              </div>
            </div>
          </Link>

          <div className={styles.cardActions}>
            <button
              onClick={e => handleAddToCart(e, svc)}
              style={{ flex: 1, justifyContent: 'center' }}
              className={`${styles.cartBtn} ${isInCart ? styles.inCartBtn : styles.addToCartBtn}`}
            >
              {isInCart ? <Check size={14} /> : <ShoppingBag size={14} />}
              {isInCart ? 'In Cart' : 'Add to Cart'}
            </button>

            <label className={styles.compareCheck} onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isCompared}
                onChange={() => {
                  toggleCompare(svc.id);
                  openCompare();
                }}
              />
              <span className={styles.compareLabel}>Compare</span>
            </label>
          </div>
        </div>
      </InteractiveTiltCard>
    );
  };

  // Group Display Label Helper
  const getGroupLabel = (groupKey: ServiceGroup | 'all') => {
    if (groupKey === 'all') return 'All Groups';
    const found = SERVICE_GROUPS.find(g => g.id === groupKey);
    return found ? found.name : groupKey;
  };

  // Category Display Label Helper
  const getCategoryLabel = (catKey: PrimaryCategory | 'all') => {
    if (catKey === 'all') return 'All Services';
    const found = SERVICE_CATEGORIES.find(c => c.id === catKey);
    return found ? found.name : catKey;
  };

  return (
    <div className={styles.marketplace}>
      <div className={`container ${styles.layout}`}>
        <main className={styles.main}>
          {/* ────────────────────────────────────────────────────────
              1. 3D FLOATING LIQUID GLASS TRUST MARQUEE RIBBON
             ──────────────────────────────────────────────────────── */}
          <GlassTrustMarquee />

          {/* ────────────────────────────────────────────────────────
              2. CAMPAIGN SHOWCASE (Flagship Deals Carousel)
             ──────────────────────────────────────────────────────── */}
          <div className={styles.heroLandingStage}>
            <div className={styles.ambientBlob1} />
            <div className={styles.ambientBlob2} />
            <div className={styles.ambientBlob3} />
            <div className={styles.lightBeam} />
            <div className={styles.gridOverlay} />
            <div className={styles.heroContentWrap}>
              <PromoCarousel />
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              3. DOMAIN CORE CAPABILITIES (3D Coverflow Experience)
             ──────────────────────────────────────────────────────── */}
          <div className={styles.domainCoverflowSection}>
            <CategoryCoverflow />
          </div>

          {/* ────────────────────────────────────────────────────────
              4. SECTION HEADER (Cinematic Technical Telemetry HUD)
             ──────────────────────────────────────────────────────── */}
          <div id="marketplace-catalog" className={styles.catalogSectionHeader}>
            <div className={styles.telemetryHUD}>
              <span className={styles.catalogBadge}>
                <Sparkles size={13} /> SAAMPARK OFFICIAL CATALOG
              </span>
              <div className={styles.telemetryStrip}>
                <span className={styles.telemetryItem}><span className={styles.telemetryDot} /> {totalServicesCount} Verified Services</span>
                <span className={styles.telemetryDivider}>|</span>
                <span className={styles.telemetryItem}>99.98% Delivery SLA</span>
                <span className={styles.telemetryDivider}>|</span>
                <span className={styles.telemetryItem}>ISO 9001:2015 Certified</span>
                <span className={styles.telemetryDivider}>|</span>
                <span className={styles.telemetryItem}>4.9 / 5.0 Client Rating</span>
              </div>
            </div>

            <h2 className={styles.catalogTitle}>Browse Solutions &amp; Services</h2>
            <p className={styles.catalogSubtitle}>
              ISO 9001:2015 verified software architecture, marketing operations &amp; business consulting.
            </p>
          </div>

          {/* ────────────────────────────────────────────────────────
              2. CENTERED CONTROLS BAR (All Group Services + All Services)
             ──────────────────────────────────────────────────────── */}
          <div className={styles.controlsSection}>
            <div className={styles.controlsCenteredWrapper}>
              
              {/* CONTROL 1: ALL GROUP SERVICES DROPDOWN */}
              <div className={styles.dropdownControlWrap} ref={groupDropdownRef}>
                <button
                  type="button"
                  className={`${styles.controlBtn} ${groupFilter !== 'all' ? styles.controlBtnActive : ''}`}
                  onClick={() => {
                    setGroupDropdownOpen(!groupDropdownOpen);
                    setExplorerOpen(false);
                  }}
                  aria-expanded={groupDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className={styles.controlBtnLeft}>
                    <div className={styles.controlGlassIconWrap}>
                      <Globe size={18} className={styles.controlGlassIcon} />
                    </div>
                    <div className={styles.controlBtnContent}>
                      <span className={styles.controlLabel}>
                        {groupFilter === 'all' ? 'ALL GROUP SERVICES' : getGroupLabel(groupFilter)}
                      </span>
                      <span className={styles.controlSubCount}>
                        <span className={styles.liveDot} /> {liveGroupCount} Services • LIVE
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`${styles.chevron} ${groupDropdownOpen ? styles.chevronRotated : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {groupDropdownOpen && (
                  <div className={styles.groupDropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <span>SELECT SERVICE GROUP</span>
                      <span className={styles.liveBadge}>LIVE COUNTS</span>
                    </div>

                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${groupFilter === 'all' ? styles.dropdownOptionActive : ''}`}
                      onClick={() => {
                        setGroupFilter('all');
                        setCategoryFilter('all');
                        setGroupDropdownOpen(false);
                      }}
                    >
                      <span className={styles.optionDotAll}>●</span>
                      <span className={styles.optionText}>All Groups</span>
                      <span className={styles.optionCountBadge}>{totalServicesCount}</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${groupFilter === 'technology' ? styles.dropdownOptionActive : ''}`}
                      onClick={() => {
                        setGroupFilter('technology');
                        setCategoryFilter('all');
                        setGroupDropdownOpen(false);
                      }}
                    >
                      <span className={styles.optionDotTech}></span>
                      <span className={styles.optionText}>Saampark Technology</span>
                      <span className={styles.optionCountBadge}>{groupCounts.technology}</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${groupFilter === 'consultancy' ? styles.dropdownOptionActive : ''}`}
                      onClick={() => {
                        setGroupFilter('consultancy');
                        setCategoryFilter('all');
                        setGroupDropdownOpen(false);
                      }}
                    >
                      <span className={styles.optionDotConsultancy}></span>
                      <span className={styles.optionText}>Saampark Consultancy</span>
                      <span className={styles.optionCountBadge}>{groupCounts.consultancy}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* CONTROL 2: ALL SERVICES MEGA-MENU EXPLORER */}
              <div className={styles.dropdownControlWrap} ref={explorerRef}>
                <button
                  type="button"
                  className={`${styles.controlBtn} ${categoryFilter !== 'all' ? styles.controlBtnActive : ''}`}
                  onClick={() => {
                    setExplorerOpen(!explorerOpen);
                    setGroupDropdownOpen(false);
                  }}
                  aria-expanded={explorerOpen}
                  aria-haspopup="true"
                >
                  <div className={styles.controlBtnLeft}>
                    <div className={styles.controlGlassIconWrap}>
                      <Layers size={18} className={styles.controlGlassIcon} />
                    </div>
                    <div className={styles.controlBtnContent}>
                      <span className={styles.controlLabel}>
                        {categoryFilter === 'all' ? 'ALL SERVICES' : getCategoryLabel(categoryFilter)}
                      </span>
                      <span className={styles.controlSubCount}>
                        <span className={styles.liveDot} /> {filteredServices.length} Services • LIVE
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`${styles.chevron} ${explorerOpen ? styles.chevronRotated : ''}`}
                  />
                </button>

                {/* Glass Mega-Menu Popover */}
                {explorerOpen && (
                  <div className={styles.megaExplorerPopover}>
                    {/* Explorer Top Bar with Integrated Search */}
                    <div className={styles.explorerTopBar}>
                      <div className={styles.explorerTitleGroup}>
                        <Layers size={18} className={styles.explorerTitleIcon} />
                        <div>
                          <h4 className={styles.explorerHeading}>SERVICE EXPLORER</h4>
                          <p className={styles.explorerSubheading}>
                            {groupFilter === 'all'
                              ? `Browse ${totalServicesCount} live services across 2 companies`
                              : `Browse ${liveGroupCount} live services in ${getGroupLabel(groupFilter)}`}
                          </p>
                        </div>
                      </div>

                      <div className={styles.explorerSearchBox}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                          type="text"
                          placeholder="Search services or categories..."
                          value={explorerSearch}
                          onChange={e => setExplorerSearch(e.target.value)}
                          className={styles.searchInput}
                        />
                        {explorerSearch && (
                          <button
                            type="button"
                            className={styles.clearSearchBtn}
                            onClick={() => setExplorerSearch('')}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className={styles.closeExplorerBtn}
                        onClick={() => setExplorerOpen(false)}
                        aria-label="Close Explorer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Explorer Columns Grid */}
                    <div
                      className={styles.explorerGrid}
                      style={{
                        gridTemplateColumns:
                          groupFilter !== 'all' ? 'repeat(auto-fit, minmax(220px, 1fr))' : undefined,
                      }}
                    >
                      {(groupFilter === 'all'
                        ? SERVICE_GROUPS
                        : SERVICE_GROUPS.filter(g => g.id === groupFilter)
                      ).map(group => {
                        const categoriesInGroup = SERVICE_CATEGORIES.filter(c => c.group === group.id);
                        const matchGroupSearch =
                          !explorerSearch ||
                          group.name.toLowerCase().includes(explorerSearch.toLowerCase()) ||
                          categoriesInGroup.some(c => c.name.toLowerCase().includes(explorerSearch.toLowerCase()));

                        if (!matchGroupSearch) return null;

                        return (
                          <div key={group.id} className={styles.explorerGroupCol}>
                            <div
                              className={styles.groupColHeader}
                              onClick={() => {
                                setGroupFilter(group.id);
                                setCategoryFilter('all');
                                setExplorerOpen(false);
                              }}
                            >
                              <span className={styles.groupColIcon} style={{ color: group.color }}>
                                {ICON_MAP[group.icon] || <Globe size={16} />}
                              </span>
                              <div className={styles.groupColTitleWrap}>
                                <h5 className={styles.groupColTitle}>{group.name.toUpperCase()}</h5>
                                <span className={styles.groupColBadge}>
                                  {groupCounts[group.id]} Services
                                </span>
                              </div>
                            </div>

                            <div
                              className={styles.categoryList}
                              style={{
                                display: groupFilter !== 'all' ? 'grid' : 'flex',
                                gridTemplateColumns:
                                  groupFilter !== 'all' ? 'repeat(2, 1fr)' : undefined,
                                gap: '8px',
                              }}
                            >
                              {categoriesInGroup.map(cat => {
                                const catCount = categoryCounts[cat.id] || 0;
                                const isCatActive = categoryFilter === cat.id;

                                const matchCatSearch =
                                  !explorerSearch ||
                                  cat.name.toLowerCase().includes(explorerSearch.toLowerCase()) ||
                                  group.name.toLowerCase().includes(explorerSearch.toLowerCase());

                                if (!matchCatSearch) return null;

                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    className={`${styles.catItemBtn} ${isCatActive ? styles.catItemActive : ''}`}
                                    onClick={() => {
                                      setGroupFilter(group.id);
                                      setCategoryFilter(cat.id);
                                      setExplorerOpen(false);
                                    }}
                                  >
                                    <span className={styles.catIcon}>
                                      {ICON_MAP[cat.icon] || <Globe size={14} />}
                                    </span>
                                    <span className={styles.catName}>{cat.name}</span>
                                    <span className={styles.catCountPill}>{catCount}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.explorerFooter}>
                      <span className={styles.footerInfo}>
                        Tip: Click any category to filter catalog immediately
                      </span>
                      <button
                        type="button"
                        className={styles.viewAllBtn}
                        onClick={() => {
                          setGroupFilter('all');
                          setCategoryFilter('all');
                          setExplorerOpen(false);
                        }}
                      >
                        Reset & View All {totalServicesCount} Services
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              QUICK CATEGORY FILTER CHIPS (Motion-Sites / Uber Style)
             ──────────────────────────────────────────────────────── */}
          <div className={styles.quickChipsBar} role="tablist" aria-label="Quick Category Filter">
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === 'all' && groupFilter === 'all'}
              className={`${styles.chipBtn} ${categoryFilter === 'all' && groupFilter === 'all' ? styles.chipActive : ''}`}
              onClick={() => {
                setGroupFilter('all');
                setCategoryFilter('all');
              }}
            >
              <Sparkles size={14} className={styles.chipIcon} />
              <span>All Solutions</span>
              <span className={styles.chipCount}>{totalServicesCount}</span>
            </button>
            {SERVICE_CATEGORIES.map(cat => {
              const isCatActive = categoryFilter === cat.id;
              const catCount = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isCatActive}
                  className={`${styles.chipBtn} ${isCatActive ? styles.chipActive : ''}`}
                  onClick={() => {
                    setGroupFilter(cat.group);
                    setCategoryFilter(cat.id);
                  }}
                >
                  <span className={styles.chipIcon}>{ICON_MAP[cat.icon] || <Globe size={14} />}</span>
                  <span>{cat.name}</span>
                  <span className={styles.chipCount}>{catCount}</span>
                </button>
              );
            })}
          </div>

          {/* ────────────────────────────────────────────────────────
              3. RESULTS BAR (Dynamic Showing Count, Active Pills, Sort & View Mode)
             ──────────────────────────────────────────────────────── */}
          <div className={styles.resultsBar}>
            <div className={styles.resultsCountGroup}>
              <h3 className={styles.resultsCountHeading}>
                Showing <span className={styles.countNumber}>{filteredServices.length}</span> Services
              </h3>

              {/* Active Filter Pills */}
              {(groupFilter !== 'all' || categoryFilter !== 'all' || search) && (
                <div className={styles.activePillsRow}>
                  {groupFilter !== 'all' && (
                    <span className={styles.filterPill}>
                      Group: {getGroupLabel(groupFilter)}
                      <X
                        size={12}
                        className={styles.pillRemove}
                        onClick={() => {
                          setGroupFilter('all');
                          setCategoryFilter('all');
                        }}
                      />
                    </span>
                  )}

                  {categoryFilter !== 'all' && (
                    <span className={styles.filterPill}>
                      Category: {getCategoryLabel(categoryFilter)}
                      <X size={12} className={styles.pillRemove} onClick={() => setCategoryFilter('all')} />
                    </span>
                  )}

                  {search && (
                    <span className={styles.filterPill}>
                      Search: &ldquo;{search}&rdquo;
                      <X size={12} className={styles.pillRemove} onClick={() => setSearch('')} />
                    </span>
                  )}

                  <button type="button" className={styles.clearFiltersBtn} onClick={handleClearFilters}>
                    <RotateCcw size={12} /> Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Controls Right: Sort dropdown & Grid/List/Cinematic view toggle */}
            <div className={styles.resultsRightTools}>
              <div className={styles.sortWrap}>
                <SlidersHorizontal size={14} className={styles.sortIcon} />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className={styles.sortSelect}
                >
                  <option value="popular">Popular First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Featured First</option>
                </select>
              </div>

              <div className={styles.viewToggleGroup}>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid size={16} />
                </button>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'cinematic' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('cinematic')}
                  title="Cinematic 3D View"
                >
                  <Film size={16} />
                </button>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              SERVICE CARD GRID & CATEGORY HEADINGS
             ──────────────────────────────────────────────────────── */}
          {loading ? (
            <SkeletonLoader count={8} />
          ) : filteredServices.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Search size={32} />
              </div>
              <h3>No Services Found</h3>
              <p>We couldn&apos;t find any services matching your active filters or search query.</p>
              <button type="button" className="btn btn-primary" onClick={handleClearFilters}>
                <RotateCcw size={14} /> Clear All Filters
              </button>
            </div>
          ) : (
            <div className={styles.catalogContentArea}>
              {/* Grouped view by Category */}
              {SERVICE_GROUPS.map(group => {
                // If group filter is active and doesn't match this group, skip
                if (groupFilter !== 'all' && groupFilter !== group.id) return null;

                const groupCategories = SERVICE_CATEGORIES.filter(c => c.group === group.id);

                return (
                  <div key={group.id} className={styles.groupBlock}>
                    {groupCategories.map(cat => {
                      // If category filter is active and doesn't match this category, skip
                      if (categoryFilter !== 'all' && categoryFilter !== cat.id) return null;

                      const catServices = filteredServices.filter(s => s.primaryCategory === cat.id);
                      if (catServices.length === 0) return null;

                      return (
                        <CategorySectionBlock
                          key={cat.id}
                          cat={cat}
                          group={group}
                          catServices={catServices}
                          viewMode={viewMode}
                          renderCard={renderCard}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              5. MOBILE-FIRST STACKED PHONE SLIDER (Kotak Neo Style Showcase)
             ──────────────────────────────────────────────────────── */}
          {/* MobileStackedPhoneSlider placeholder */}

          {/* ────────────────────────────────────────────────────────
              6. INTERACTIVE 3D COST ESTIMATOR (Real-Time Pricing Engine)
             ──────────────────────────────────────────────────────── */}
          <div id="instant-estimator" className={styles.estimatorSectionWrapper}>
            <div className={styles.estimatorHeader}>
              <span className={styles.estimatorBadge}>
                <Calculator size={13} /> INSTANT PROJECT ESTIMATOR
              </span>
              <h2 className={styles.estimatorHeading}>
                Calculate Your Custom Project Cost in Real-Time
              </h2>
              <p className={styles.estimatorSub}>
                Customize features, platforms, and sprint timelines to get transparent instant estimations with free architecture consult.
              </p>
            </div>
            <CostEstimator />
          </div>

          {/* ────────────────────────────────────────────────────────
              7. INTERACTIVE GLASS FAQ ACCORDION (SEO & Trust Conversion)
             ──────────────────────────────────────────────────────── */}
          <InteractiveFAQ />
        </main>
      </div>

      {/* Instant Quick View Modal */}
      {quickViewService && (
        <ProductQuickViewModal
          service={quickViewService}
          onClose={() => setQuickViewService(null)}
        />
      )}
    </div>
  );
}
