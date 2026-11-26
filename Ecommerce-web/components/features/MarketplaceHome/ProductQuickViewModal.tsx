'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X, Check, Bookmark, ShoppingBag, MessageCircle, Shield, Clock,
  Star, ExternalLink, ChevronLeft, ChevronRight, Minus, Plus, Zap
} from 'lucide-react';
import { type Service } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useOrderStore } from '@/lib/store/orderStore';
import { useAuthStore } from '@/lib/store/authStore';
import styles from './ProductQuickViewModal.module.css';

// 5 to 10 screenshots per category
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
  ];

  const appPics = [
    { title: 'Native iOS & Android Screen Mockups', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80' },
    { title: 'User Onboarding & Profile Setup', url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=80' },
    { title: 'Real-time Push Notifications Interface', url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&auto=format&fit=crop&q=80' },
    { title: 'Dark Mode UI Experience', url: 'https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=800&auto=format&fit=crop&q=80' },
    { title: 'Cross-Platform Flutter Code Architecture', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80' },
  ];

  const softPics = [
    { title: 'Enterprise Dashboard & Analytics', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' },
    { title: 'Multi-Branch Inventory & Billing Engine', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' },
    { title: 'HR & Staff Payroll Module', url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80' },
    { title: 'CRM Client Lead Tracking Pipeline', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80' },
  ];

  const adsPics = [
    { title: 'Meta Ads Manager Campaign Setup', url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80' },
    { title: 'Targeted High-Converting Audience Split', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' },
    { title: 'Google Search Ads Top Keyword Bidding', url: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop&q=80' },
    { title: 'Google Maps Business Profile Top Ranking', url: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&auto=format&fit=crop&q=80' },
  ];

  const videoPics = [
    { title: 'AI Voiceover & Script Generation', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80' },
    { title: '4K Ultra HD Animated Reel Render', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80' },
    { title: 'Animated Cartoon Character Scene', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
  ];

  const legalPics = [
    { title: 'MCA Certificate of Incorporation', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' },
    { title: 'Official GSTIN Registration Document', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80' },
    { title: 'MSME Udyam Govt Certificate', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80' },
  ];

  if (category === 'app') return appPics;
  if (category === 'software') return softPics;
  if (['social-media', 'meta-ads', 'google-ads', 'google-business'].includes(category)) return adsPics;
  if (category === 'video-ai') return videoPics;
  if (category === 'business-legal') return legalPics;
  return webPics;
};

interface Props {
  service: Service;
  onClose: () => void;
}

export function ProductQuickViewModal({ service, onClose }: Props) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { cart, addToCart, updateQuantity, wishlistIds, toggleWishlist } = useCommerceStore();
  const { openCart } = useUIStore();
  const { openCheckout } = useOrderStore();
  const { requireAuth } = useAuthStore();

  const cartItem = cart.find(c => c.serviceId === service.id);
  const screenshots = useMemo(() => {
    const customList: { title: string; url: string }[] = [];
    if (service.image && service.image.trim()) {
      customList.push({ title: `${service.name} — Preview`, url: service.image.trim() });
    }
    if (Array.isArray(service.galleryImages)) {
      service.galleryImages.forEach((url, i) => {
        const clean = String(url || '').trim();
        if (clean && !customList.some((x) => x.url === clean)) {
          customList.push({ title: `${service.shortName || service.name} — View ${i + 2}`, url: clean });
        }
      });
    }
    // If product has multiple uploaded images use them directly; otherwise supplement up to 5 previews
    if (customList.length <= 1) {
      const fallbacks = getPortfolioImages(service.category);
      for (const fb of fallbacks) {
        if (customList.length >= 5) break;
        if (!customList.some((x) => x.url === fb.url)) {
          customList.push(fb);
        }
      }
    }
    return customList.length > 0 ? customList : getPortfolioImages(service.category);
  }, [service]);

  useEffect(() => {
    setActiveImgIndex(0);
  }, [service.id]);

  // Auto-cycle multiple product images one after another cleanly
  useEffect(() => {
    if (isHovered || screenshots.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % screenshots.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [isHovered, screenshots.length]);

  const isWishlisted = wishlistIds.includes(service.id);
  const isInCart = Boolean(cartItem);

  const handleInstantOrder = () => {
    if (!service.startingPrice || service.startingPrice <= 0) {
      onClose();
      window.location.href = `/contact?service=${encodeURIComponent(service.name)}`;
      return;
    }
    onClose();
    requireAuth(
      () => openCheckout(service),
      `Please sign in or register with your email before ordering "${service.name}".`
    );
  };

  const handleAddToCart = () => {
    if (isInCart) {
      onClose();
      openCart();
      return;
    }
    addToCart({
      serviceId: service.id,
      serviceName: service.name,
      price: service.startingPrice,
      quantity: 1,
      group: service.group,
      entity: service.entity,
      priceType: service.priceType,
      deliveryDays: service.deliveryDays ?? '3-5 Days',
      image: service.image,
    });
    onClose();
    openCart();
  };

  const handleWA = () => {
    const msg = `Hello Saampark,\n\nI am inquiring about *${service.name}*\nPrice: ${service.startingPrice ? '₹' + service.startingPrice : 'Custom Quote'}\n\nPlease help me start this project.`;
    const phone = service.entity === 'str' ? '919091518567' : '918170082678';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Get a Quote';
    return `₹${price.toLocaleString('en-IN')}${service.priceType === 'monthly' ? '/mo' : service.priceType === 'weekly' ? '/wk' : ''}`;
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className={styles.grid}>
          {/* Left Column: Multi-Image Glass Showcase (Auto-Cycling) */}
          <div
            className={styles.galleryCol}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={styles.mainView}>
              {screenshots.map((ss, idx) => (
                <Image
                  key={`${idx}-${ss.url}`}
                  src={ss.url}
                  alt={ss.title || service.name}
                  width={600}
                  height={380}
                  className={`${styles.mainImg} ${
                    activeImgIndex === idx ? styles.mainImgActive : styles.mainImgHidden
                  }`}
                  priority={idx === 0}
                  unoptimized
                />
              ))}

              {screenshots.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.navImgBtn} ${styles.navImgPrev}`}
                    onClick={() =>
                      setActiveImgIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
                    }
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.navImgBtn} ${styles.navImgNext}`}
                    onClick={() => setActiveImgIndex((prev) => (prev + 1) % screenshots.length)}
                    aria-label="Next image"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              <div className={styles.ssBadgeRow}>
                <span className={styles.ssBadge}>
                  {screenshots[activeImgIndex]?.title || `Preview ${activeImgIndex + 1}`}
                </span>
                {screenshots.length > 1 && (
                  <span className={styles.ssCounter}>
                    {activeImgIndex + 1} / {screenshots.length}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.thumbGrid}>
              {screenshots.map((ss, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={`${styles.thumbBtn} ${activeImgIndex === idx ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <Image
                    src={ss.url}
                    alt={ss.title}
                    width={80}
                    height={50}
                    className={styles.thumbImg}
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Details & Actions */}
          <div className={styles.detailsCol}>
            <div className={styles.entityTag}>
              <span className={`badge ${service.entity === 'str' ? 'badge-str' : 'badge-scs'}`}>
                {service.entity.toUpperCase()}
              </span>
              {service.badge && <span className="badge badge-warning">{service.badge}</span>}
            </div>

            <h2 className={styles.title}>{service.name}</h2>
            <p className={styles.desc}>{service.description}</p>

            <div className={styles.ratingRow}>
              <Star size={14} fill="#F5A623" color="#F5A623" />
              <span>4.9 (48+ Client Reviews)</span>
              <span>•</span>
              <Shield size={14} color="var(--color-brand)" />
              <span>ISO 9001:2015</span>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>{formatPrice(service.startingPrice)}</span>
              {service.deliveryDays && (
                <span className={styles.delivery}><Clock size={12} /> {service.deliveryDays}d delivery</span>
              )}
            </div>

            <div className={styles.featuresList}>
              <div className={styles.featTitle}>Key Features &amp; Deliverables:</div>
              {service.features.slice(0, 5).map((f, i) => (
                <div key={i} className={styles.featItem}>
                  <Check size={14} className={styles.checkIcon} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className={styles.actionStack}>
              <button
                type="button"
                className={`btn btn-primary ${styles.instantOrderBtn}`}
                onClick={handleInstantOrder}
              >
                <Zap size={15} fill="currentColor" /> Instant Order &amp; GST Invoice
              </button>

              <div className={styles.actionRow}>
                {isInCart && cartItem ? (
                  <div className={styles.qtyStepperPill}>
                    <button
                      type="button"
                      className={styles.qtyStepperBtn}
                      onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.qtyStepperText}
                      onClick={() => {
                        onClose();
                        openCart();
                      }}
                    >
                      <Check size={13} /> {cartItem.quantity} in Cart
                    </button>
                    <button
                      type="button"
                      className={styles.qtyStepperBtn}
                      onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`btn btn-secondary ${styles.actionFlexBtn}`}
                    onClick={handleAddToCart}
                  >
                    <ShoppingBag size={15} /> Add to Cart
                  </button>
                )}

                <button
                  type="button"
                  className={`btn btn-secondary ${styles.actionFlexBtn}`}
                  onClick={handleWA}
                >
                  <MessageCircle size={15} /> WhatsApp
                </button>

                <button
                  type="button"
                  className={`btn btn-secondary btn-icon ${styles.wishIconBtn} ${
                    isWishlisted ? styles.wishActive : ''
                  }`}
                  onClick={() => toggleWishlist(service.id)}
                  aria-label="Toggle Wishlist"
                >
                  <Bookmark size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            <Link href={service.href} className={styles.fullPageLink} onClick={onClose}>
              View Full Product Page &amp; All Specs <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
