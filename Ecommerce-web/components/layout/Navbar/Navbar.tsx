'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Globe, Smartphone, Layers, Database, ShoppingCart,
  Share2, Megaphone, Search, MapPin, Video, Briefcase,
  Sun, Moon, ShoppingBag, Heart, User, Sparkles, MessageCircle
} from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
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
  const profileRef = useRef<HTMLDivElement>(null);

  const { cart, wishlistIds } = useCommerceStore();
  const { openCart, openWishlist } = useUIStore();
  const { user, logout, openAuthModal } = useAuthStore();

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

  // Click outside to close profile dropdown
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : styles.transparent}`}>
        <div className={styles.inner}>
          {/* Logo (Independent Floating Card) */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/assets/logos/logo-main.png"
              alt="Saampark Group"
              width={40}
              height={40}
              className={styles.logoImg}
              priority
            />
            <span className={styles.logoText}>SAAMPARK</span>
          </Link>

          {/* Centered Search Bar (Independent Floating Card) */}
          <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </form>

          {/* Right Side Actions (Independent Floating Card) */}
          <div className={styles.actions}>
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className={`btn btn-icon btn-ghost ${styles.iconBtn}`} aria-label="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Cart Button */}
            <button className={`btn btn-icon btn-ghost ${styles.iconBtn}`} onClick={openCart} aria-label="Cart">
              <ShoppingBag size={18} />
              {cart.length > 0 && <span className={styles.badge}>{cart.length}</span>}
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
                      <User size={20} className={styles.avatarIcon} />
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
                      <div className={styles.colTitle}>Account & Activity</div>
                      <Link href="/" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        🛍️ Active Orders
                      </Link>
                      <button 
                        className={styles.dropLinkBtn} 
                        onClick={() => { setProfileOpen(false); openWishlist(); }}
                      >
                        ❤️ Saved Wishlist ({wishlistIds.length})
                      </button>
                      <Link href="/" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        🔄 Compare History
                      </Link>
                      
                      <div className={styles.colTitle} style={{ marginTop: 16 }}>Services Portal</div>
                      <Link href="/" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        ⚡ Subscribed Plans
                      </Link>
                      <Link href="/contact" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        💰 Custom Quote Request
                      </Link>
                    </div>

                    {/* Right Column: Corporate & Support */}
                    <div className={styles.dropdownCol} style={{ borderLeft: '1px solid var(--color-border-default)', paddingLeft: 'var(--size-4)' }}>
                      <div className={styles.colTitle}>Corporate Office</div>
                      <Link href="/about" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        🏢 About Saampark Group
                      </Link>
                      <Link href="/contact" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        📞 Customer Helpdesk
                      </Link>
                      <Link href="/about" className={styles.dropLink} onClick={() => setProfileOpen(false)}>
                        🛡️ ISO Certification Info
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
      </nav>
    </>
  );
}
