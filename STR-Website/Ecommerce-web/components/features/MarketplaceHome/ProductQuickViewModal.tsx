'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Check, Heart, ShoppingBag, MessageCircle, Maximize2, Shield, Clock, Star, ExternalLink } from 'lucide-react';
import { type Service } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
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
  const { cart, addToCart, wishlistIds, toggleWishlist } = useCommerceStore();
  const { openCart } = useUIStore();

  const screenshots = getPortfolioImages(service.category);
  const isWishlisted = wishlistIds.includes(service.id);
  const isInCart = cart.some(c => c.serviceId === service.id);

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
      quantity: 1
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
          {/* Left Column: Interactive 5-10 Screenshot Showcase */}
          <div className={styles.galleryCol}>
            <div className={styles.mainView}>
              <Image
                src={screenshots[activeImgIndex]?.url || service.image || '/assets/images/website-dev.jpg'}
                alt={screenshots[activeImgIndex]?.title || service.name}
                width={600}
                height={380}
                className={styles.mainImg}
                priority
                unoptimized
              />
              <span className={styles.ssBadge}>
                {screenshots[activeImgIndex]?.title || `Screenshot ${activeImgIndex + 1}`}
              </span>
            </div>

            <div className={styles.thumbGrid}>
              {screenshots.map((ss, idx) => (
                <button
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
              <div className={styles.featTitle}>Key Features & Deliverables:</div>
              {service.features.slice(0, 5).map((f, i) => (
                <div key={i} className={styles.featItem}>
                  <Check size={14} className={styles.checkIcon} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className={styles.actionRow}>
              <button className="btn btn-primary" onClick={handleAddToCart} style={{ flex: 1, justifyContent: 'center' }}>
                {isInCart ? 'In Cart' : 'Add to Cart'} <ShoppingBag size={16} />
              </button>
              
              <button className="btn btn-secondary" onClick={handleWA} style={{ flex: 1, justifyContent: 'center' }}>
                <MessageCircle size={16} /> WhatsApp
              </button>

              <button 
                className={`btn btn-icon btn-ghost ${isWishlisted ? styles.wishActive : ''}`} 
                onClick={() => toggleWishlist(service.id)}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <Link href={service.href} className={styles.fullPageLink} onClick={onClose}>
              View Full Product Page & All Specs <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
