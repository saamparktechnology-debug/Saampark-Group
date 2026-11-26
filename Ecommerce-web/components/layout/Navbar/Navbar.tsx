'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Globe, Smartphone, Layers, Database, ShoppingCart,
  Share2, Megaphone, Search, MapPin, Video, Briefcase,
  Sun, Moon, ShoppingBag, Bookmark, User, Sparkles, MessageCircle, PackageSearch,
  Package, Activity, FileText, ExternalLink, X, ArrowRight
} from 'lucide-react';
import {
  CONTACT,
  allServices,
  SERVICE_CATEGORIES,
  type Service,
  type CategoryMetadata,
} from '@/lib/data/services';
import { extractStorefrontOffers, type StorefrontOffer } from '@/lib/utils/offers';
import { buildLiveSearchResults, type SearchSuggestion } from '@/lib/utils/siteSearch';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useOrderStore } from '@/lib/store/orderStore';
import { GlassTrustMarquee } from '@/components/ui/GlassTrustMarquee/GlassTrustMarquee';
import styles from './Navbar.module.css';

// ── Nav Link Data ──────────────────────────────────
const techLinks = {
  website: [
    { href: '/technology/web-development/one-page-website',  label: 'One Page Website',  icon: Globe,         price: '₹1,999' },
    { href: '/technology/web-development/static-website',    label: 'Static Website',    icon: Globe,         price: '₹3,999' },
    { href: '/technology/web-development/dynamic-website',   label: 'Dynamic Website',   icon: Globe,         price: '₹11,999' },
    { href: '/technology/web-development/ecommerce-website', label: 'E-Commerce Website',icon: ShoppingCart,  price: '₹21,999' },
  ],
  app: [
    { href: '/technology/app-development/android', label: 'Android App',  icon: Smartphone, price: 'On Request' },
    { href: '/technology/app-development/ios',     label: 'iOS App',      icon: Smartphone, price: 'On Request' },
    { href: '/technology/app-development/hybrid',  label: 'Hybrid App',   icon: Layers,     price: 'On Request' },
  ],
  software: [
    { href: '/technology/software/erp',  label: 'ERP Software', icon: Database, price: 'On Request' },
    { href: '/technology/software/crm',  label: 'CRM Software', icon: Database, price: 'On Request' },
  ],
};

const scsLinks = {
  marketing: [
    { href: '/consultancy/digital-marketing/social-media',             label: 'Social Media Management', icon: Share2,  price: '₹499/mo' },
    { href: '/consultancy/digital-marketing/google-business-profile',  label: 'Google Business Profile', icon: MapPin,  price: '₹1,000/mo' },
  ],
  ads: [
    { href: '/consultancy/ads-management/meta-ads',   label: 'Meta Ads',   icon: Megaphone, price: '₹600/week' },
    { href: '/consultancy/ads-management/google-ads', label: 'Google Ads', icon: Search,    price: '₹1,000/week' },
  ],
  video: [
    { href: '/consultancy/video-ai/full-ai-video', label: 'Full AI Video',  icon: Sparkles, price: '₹1,499' },
    { href: '/consultancy/video-ai/4k-ai-video',   label: '4K AI Video',   icon: Video,    price: '₹1,999' },
  ],
  legal: [
    { href: '/consultancy/business-legal/pvt-ltd-registration', label: 'Pvt. Ltd. Registration', icon: Briefcase, price: 'On Request' },
    { href: '/consultancy/business-legal/gst-registration',     label: 'GST Registration',       icon: Briefcase, price: 'On Request' },
  ],
};

// ── Suspense Wrapper Component ────────────────────
export function Navbar() {
  return (
    <Suspense fallback={<div style={{ height: '72px' }} />}>
      <NavbarContent />
    </Suspense>
  );
}

// ── Main Navbar Content ───────────────────────────
function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [scrolled,    setScrolled]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark,      setIsDark]      = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [liveSearchServices, setLiveSearchServices] = useState<Service[]>(allServices);
  const [liveSearchCats, setLiveSearchCats] = useState<CategoryMetadata[]>(SERVICE_CATEGORIES);
  const [liveSearchOffers, setLiveSearchOffers] = useState<StorefrontOffer[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const { cart, wishlistIds } = useCommerceStore();
  const { openCart, openWishlist, openCompare } = useUIStore();
  const { user, logout, openAuthModal } = useAuthStore();
  const { openTracking, myOrders } = useOrderStore();

  // Hydrate live catalog, categories, and promo offers once so site-wide search stays in sync
  useEffect(() => {
    fetch('/api/storefront')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.success) return;
        const products = json.data?.products;
        if (products) {
          const crmTech = Array.isArray(products.tech) ? products.tech : [];
          const crmConsult = Array.isArray(products.consultancy) ? products.consultancy : [];
          const staticBySlug = new Map(allServices.map((s) => [s.slug, s]));
          const mapped: Service[] = [...crmTech, ...crmConsult].map((p: any) => {
            const fb = staticBySlug.get(p.slug);
            const grp = p.companyId === 'consultancy' || p.group === 'consultancy' ? 'consultancy' : 'technology';
            return {
              ...(fb || {}),
              id: p.id || fb?.id || p.slug,
              name: p.name || fb?.name || 'Service',
              shortName: p.shortName || fb?.shortName || p.name || 'Service',
              slug: p.slug || fb?.slug || p.id,
              group: grp,
              entity: (p.entity || fb?.entity || (grp === 'consultancy' ? 'scs' : 'str')) as any,
              primaryCategory: p.primaryCategory || fb?.primaryCategory || 'web-services',
              category: p.category || fb?.category || 'website',
              sector: p.sector || fb?.sector || 'web-development',
              startingPrice:
                typeof p.discountPrice === 'number' && p.discountPrice > 0
                  ? p.discountPrice
                  : (p.startingPrice ?? fb?.startingPrice ?? null),
              priceType: p.priceType || fb?.priceType || 'one-time',
              deliveryDays: typeof p.deliveryDays === 'number' ? p.deliveryDays : (fb?.deliveryDays ?? 5),
              badge: p.badge !== undefined ? p.badge : fb?.badge,
              isPopular: p.isPopular ?? fb?.isPopular ?? false,
              isFeatured: p.isFeatured ?? fb?.isFeatured ?? false,
              image: p.image || fb?.image || '/assets/images/website-dev.jpg',
              color: p.color || fb?.color || '#2563EB',
              icon: p.icon || fb?.icon || 'Globe',
              href: p.href || fb?.href || `/${grp}/${p.sector || 'solutions'}/${p.slug}`,
              description: p.description || fb?.description || '',
              features: Array.isArray(p.features) && p.features.length > 0 ? p.features : (fb?.features || []),
              technologiesUsed: Array.isArray(p.technologiesUsed) ? p.technologiesUsed : fb?.technologiesUsed,
            } as Service;
          });
          const seen = new Set(mapped.map((m) => m.slug));
          setLiveSearchServices([...mapped, ...allServices.filter((s) => !seen.has(s.slug))]);
        }

        const rawCats = Array.isArray(json.data?.categories) ? json.data.categories : [];
        const deletedMeta = rawCats.find((c: any) => c && c.id === '__deleted_ids__');
        const deletedSet = new Set<string>(
          Array.isArray(deletedMeta?.deletedIds) ? deletedMeta.deletedIds.map(String) : []
        );
        const catMap = new Map<string, CategoryMetadata>();
        SERVICE_CATEGORIES.forEach((c) => {
          if (!deletedSet.has(c.id)) catMap.set(c.id, c);
        });
        rawCats.forEach((c: any) => {
          if (c && c.id && c.id !== '__deleted_ids__' && c.name && !deletedSet.has(String(c.id))) {
            const grp = c.companyId === 'consultancy' || c.group === 'consultancy' ? 'consultancy' : 'technology';
            catMap.set(String(c.id), {
              id: String(c.id),
              group: grp,
              name: String(c.name),
              capacity: 'Expandable',
              icon: c.icon || 'Layers',
            });
          }
        });
        setLiveSearchCats(Array.from(catMap.values()));

        if (json.data?.storefront) {
          setLiveSearchOffers(extractStorefrontOffers(json.data.storefront));
        }
      })
      .catch(() => {});
  }, []);

  const searchSuggestions = React.useMemo(
    () =>
      buildLiveSearchResults(searchQuery, {
        services: liveSearchServices,
        categories: liveSearchCats,
        offers: liveSearchOffers,
      }),
    [searchQuery, liveSearchServices, liveSearchCats, liveSearchOffers]
  );

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync searchQuery with URL params in real-time
  useEffect(() => {
    const q = searchParams.get('search');
    setSearchQuery(q || '');
  }, [searchParams]);

  // Click outside to close profile & search dropdowns
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Theme init
  useEffect(() => {
    const saved = localStorage.getItem('saampark-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('saampark-theme', next ? 'dark' : 'light');
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => {
    setSearchFocused(false);
    setMobileSearchOpen(false);
    setHighlightIdx(-1);

    if (item.action === 'open-cart') {
      openCart();
      return;
    }
    if (item.action === 'open-wishlist') {
      openWishlist();
      return;
    }
    if (item.action === 'open-compare') {
      openCompare();
      return;
    }
    if (item.action === 'open-track') {
      openTracking();
      return;
    }
    if (item.promoCode && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(item.promoCode).catch(() => {});
    }
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightIdx >= 0 && searchSuggestions[highlightIdx]) {
      handleSelectSuggestion(searchSuggestions[highlightIdx]);
      return;
    }
    setSearchFocused(false);
    setMobileSearchOpen(false);
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}#marketplace-catalog`);
      setTimeout(() => {
        document.getElementById('marketplace-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      router.push('/');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchFocused(false);
      setMobileSearchOpen(false);
      setHighlightIdx(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchFocused(true);
      setHighlightIdx((prev) =>
        searchSuggestions.length > 0 ? (prev + 1) % searchSuggestions.length : -1
      );
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) =>
        searchSuggestions.length > 0
          ? (prev - 1 + searchSuggestions.length) % searchSuggestions.length
          : -1
      );
    }
  };

  const renderSuggestionsDropdown = () => (
    <div className={styles.searchDropdown} role="listbox" aria-label="Search suggestions">
      <div className={styles.searchDropHeader}>
        <span>
          {searchQuery.trim()
            ? `Search Results for "${searchQuery.trim()}"`
            : 'Quick Suggestions across Saampark'}
        </span>
        <span className={styles.searchDropHint}>{searchSuggestions.length} matches</span>
      </div>

      {searchSuggestions.length === 0 ? (
        <div className={styles.searchEmptyState}>
          <p>No direct match found for &ldquo;{searchQuery.trim()}&rdquo;.</p>
          <button
            type="button"
            className={styles.searchFilterAllBtn}
            onClick={() => {
              setSearchFocused(false);
              setMobileSearchOpen(false);
              router.push('/contact');
            }}
          >
            Request Custom Service Quote <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className={styles.searchResultsList}>
          {searchSuggestions.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={highlightIdx === idx}
              className={`${styles.searchResultRow} ${highlightIdx === idx ? styles.searchResultActive : ''}`}
              onClick={() => handleSelectSuggestion(item)}
            >
              <div className={styles.searchResultMain}>
                <div className={styles.searchResultTop}>
                  <span className={styles.searchTypeBadge}>{item.badge}</span>
                  <span className={styles.searchResultTitle}>{item.title}</span>
                </div>
                <span className={styles.searchResultSub}>{item.subtitle}</span>
              </div>
              {item.priceLabel ? (
                <span className={styles.searchResultPrice}>{item.priceLabel}</span>
              ) : (
                <ArrowRight size={13} className={styles.searchResultArrow} />
              )}
            </button>
          ))}
        </div>
      )}

      {searchQuery.trim() && (
        <button
          type="button"
          className={styles.searchFooterBtn}
          onClick={(e) => handleSearchSubmit(e as any)}
        >
          <Search size={13} />
          <span>Filter catalog for &ldquo;{searchQuery.trim()}&rdquo;</span>
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : styles.transparent}`}>
        <div className={styles.inner}>
          {/* Logo (Independent Floating Card) */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/assets/logos/logo-main-v2.png"
              alt="Saampark Group"
              width={40}
              height={40}
              className={styles.logoImg}
              priority
            />
            <span className={styles.logoText}>SAAMPARK</span>
          </Link>

          {/* Center Slot: Inline Scrolling Marquee Pill (Fills Gap Between Logo & Actions) + Search */}
          <div className={styles.centerSlot}>
            <div className={styles.searchWrap} ref={searchWrapRef}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search services, offers, FAQs, pages..."
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                    setHighlightIdx(-1);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className={styles.searchInput}
                  aria-label="Global search"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.searchClearBtn}
                    onClick={() => {
                      setSearchQuery('');
                      setHighlightIdx(-1);
                      if (searchParams.get('search')) router.push('/');
                    }}
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </form>
              {searchFocused && renderSuggestionsDropdown()}
            </div>
            <div className={styles.navMarqueeSlot}>
              <GlassTrustMarquee inlineNav />
            </div>
          </div>

          {/* Right Side Actions (Independent Floating Card) */}
          <div className={styles.actions}>
            {/* Mobile Global Search Trigger */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className={`btn btn-icon btn-ghost ${styles.iconBtn} ${styles.mobileSearchBtn}`}
              aria-label="Search site"
            >
              <Search size={18} />
            </button>
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className={`btn btn-icon btn-ghost ${styles.iconBtn}`} aria-label="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Cart Button */}
            <button className={`btn btn-icon btn-ghost ${styles.iconBtn}`} onClick={openCart} aria-label="Cart">
              <ShoppingBag size={18} />
              {cart.length > 0 && <span className={styles.badge}>{cart.length}</span>}
            </button>

            {/* Track Order CTA */}
            <button 
              onClick={() => openTracking()} 
              className={`btn btn-ghost btn-sm ${styles.trackBtn}`} 
              aria-label="Track Order"
              title="Track live order status & invoices"
            >
              <PackageSearch size={16} />
              <span className={styles.trackText}>Track Order</span>
            </button>

            {/* Get Quote CTA */}
            <Link href="/contact" className={`btn btn-primary btn-sm ${styles.quoteCTA}`}>
              Get Quote
            </Link>

            {/* Profile Dropdown Trigger */}
            <div className={styles.profileWrapper} ref={profileRef}>
              <button 
                onClick={() => setProfileOpen(prev => !prev)} 
                className={`btn btn-icon btn-ghost ${styles.iconBtn} ${profileOpen ? styles.profileActive : ''}`} 
                aria-label="Account Menu"
              >
                <User size={18} />
              </button>

              {/* Profile Navigation Dropdown */}
              {profileOpen && (
                <div className={styles.profileDropdown}>
                  
                  {/* Dropdown Header */}
                  <div className={styles.dropdownHeader}>
                    <div className={styles.avatarBox}>
                      <Bookmark size={20} className={styles.avatarIcon} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.userTitle}>{user ? user.name : 'Guest Session'}</div>
                      <div className={styles.userRole}>{user ? user.email : 'Saampark Client'}</div>
                    </div>
                    {user ? (
                      <button 
                        onClick={() => { logout(); setProfileOpen(false); }} 
                        className={styles.logoutBtn}
                      >
                        Logout
                      </button>
                    ) : (
                      <button 
                        onClick={() => { openAuthModal(); setProfileOpen(false); }} 
                        className={styles.loginBtn}
                      >
                        Sign In
                      </button>
                    )}
                  </div>

                  {/* Dropdown Grid */}
                  <div className={styles.dropdownGrid}>
                    
                    {/* Left Column: E-Commerce Session */}
                    <div className={styles.dropdownCol}>
                      <div className={styles.colTitle}>Account &amp; Orders</div>
                      <Link
                        href="/account?tab=profile"
                        className={styles.dropLink}
                        onClick={() => setProfileOpen(false)}
                      >
                        <User size={14} /> My Profile &amp; Billing
                      </Link>
                      <Link
                        href="/account?tab=orders"
                        className={styles.dropLink}
                        onClick={() => setProfileOpen(false)}
                      >
                        <Package size={14} /> Order History ({myOrders?.length || 0})
                      </Link>
                      <button
                        className={styles.dropLinkBtn}
                        onClick={() => { setProfileOpen(false); openTracking(); }}
                      >
                        <Activity size={14} /> Live Order Status
                      </button>
                      <a
                        href="https://crm2.saampark.com/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.dropLink}
                        onClick={() => setProfileOpen(false)}
                        style={{ color: 'var(--color-brand)', fontWeight: 600 }}
                      >
                        <ExternalLink size={14} /> CRM Client Portal
                      </a>
                      <button
                        className={styles.dropLinkBtn}
                        onClick={() => { setProfileOpen(false); openWishlist(); }}
                      >
                        <Bookmark size={14} /> Saved Wishlist ({wishlistIds.length})
                      </button>

                      {myOrders && myOrders.length > 0 && (
                        <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Recent Order</div>
                          <button
                            onClick={() => { setProfileOpen(false); openTracking(myOrders[0].orderNumber); }}
                            style={{ background: 'none', border: 'none', padding: '2px 0 0', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column' }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand)' }}>{myOrders[0].orderNumber}</span>
                            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Status: <strong>{myOrders[0].status}</strong></span>
                          </button>
                        </div>
                      )}
                      
                      <div className={styles.colTitle} style={{ marginTop: 16 }}>Services Portal</div>
                      <Link href="/account?tab=status" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        <FileText size={14} /> Invoices &amp; Milestones
                      </Link>
                      <Link href="/contact" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        Custom Quote Request
                      </Link>
                    </div>

                    {/* Right Column: Corporate & Support */}
                    <div className={styles.dropdownCol} style={{ borderLeft: '1px solid var(--color-border-default)', paddingLeft: 'var(--size-4)' }}>
                      <div className={styles.colTitle}>Corporate Office</div>
                      <Link href="/about" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        About Saampark Group
                      </Link>
                      <Link href="/contact" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        Customer Helpdesk
                      </Link>
                      <Link href="/about" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        ISO Certification Info
                      </Link>

                      <div className={styles.waCard}>
                        <MessageCircle size={14} /> Quick WhatsApp support:
                        <a href={CONTACT.str.whatsapp1} target="_blank" rel="noopener noreferrer" className={styles.waLink}>
                          STR Tech: {CONTACT.str.phone1}
                        </a>
                        <a href={CONTACT.scs.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.waLink} style={{ color: '#4CAF50' }}>
                          SCS Consult: {CONTACT.scs.phone}
                        </a>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Expandable Search Panel */}
        {mobileSearchOpen && (
          <div className={styles.mobileSearchDrawer} ref={mobileSearchRef}>
            <form onSubmit={handleSearchSubmit} className={styles.mobileSearchForm}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                autoFocus
                placeholder="Search everything on Saampark..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightIdx(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.searchClearBtn}
                  onClick={() => {
                    setSearchQuery('');
                    if (searchParams.get('search')) router.push('/');
                  }}
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => setMobileSearchOpen(false)}
                aria-label="Close mobile search"
              >
                Close
              </button>
            </form>
            {renderSuggestionsDropdown()}
          </div>
        )}
      </nav>
    </>
  );
}
