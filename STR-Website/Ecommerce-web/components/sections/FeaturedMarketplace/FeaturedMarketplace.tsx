'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Heart, Eye, MessageCircle, ShoppingBag, Star, Check } from 'lucide-react';
import { featuredServices, type Service } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import styles from './FeaturedMarketplace.module.css';

function formatPrice(svc: Service) {
  if (!svc.startingPrice) return 'Get a Quote';
  const fmt = `₹${svc.startingPrice.toLocaleString('en-IN')}`;
  if (svc.priceType === 'monthly') return `${fmt}/mo`;
  if (svc.priceType === 'weekly')  return `${fmt}/week`;
  return fmt;
}

function waMessage(svc: Service) {
  const msg = encodeURIComponent(
    `Hello Saampark,\n\nI'm interested in the *${svc.name}* service.\n\nPlease share more details and pricing.\n\nThank you.`
  );
  const phone = svc.entity === 'str' ? '919091518567' : '918170082678';
  return `https://wa.me/${phone}?text=${msg}`;
}

function ServiceCard({ svc }: { svc: Service }) {
  const { wishlistIds, toggleWishlist, addToCart, cart } = useCommerceStore();
  const { openCart } = useUIStore();
  
  const isWishlisted = wishlistIds.includes(svc.id);
  const isInCart = cart.some(c => c.serviceId === svc.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <div className={`${styles.card} ${styles[svc.entity]}`}>
      {/* Product Image Section */}
      <div className={styles.imageWrap}>
        <Image
          src={svc.image || '/assets/images/website-dev.jpg'}
          alt={svc.name}
          width={300}
          height={180}
          className={styles.thumbnail}
        />
        
        {/* Wishlist Button over image */}
        <button
          className={`${styles.wishBtn} ${isWishlisted ? styles.wishlisted : ''}`}
          onClick={() => toggleWishlist(svc.id)}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        
        {/* Entity Badge */}
        <span className={`${styles.entityBadge} ${svc.entity === 'str' ? styles.badgeStr : styles.badgeScs}`}>
          {svc.entity.toUpperCase()}
        </span>
      </div>

      <div className={styles.cardContent}>
        {/* Info */}
        <div className={styles.categoryRow}>
          <span className={styles.categoryName}>{svc.category.replace('-', ' ')}</span>
          {svc.badge && (
            <span className={styles.hotBadge}>{svc.badge}</span>
          )}
        </div>
        
        <h3 className={styles.cardTitle}>{svc.name}</h3>
        <p className={styles.cardDesc}>{svc.description}</p>

        {/* Rating */}
        <div className={styles.rating}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={12} fill="#F5A623" color="#F5A623" />
          ))}
          <span>(5.0)</span>
        </div>

        {/* Price & Delivery */}
        <div className={styles.priceRow}>
          <div>
            <div className={styles.priceLabel}>Price Starting From</div>
            <div className={styles.price} style={{ color: svc.color }}>
              {formatPrice(svc)}
            </div>
          </div>
          {svc.deliveryDays && (
            <div className={styles.delivery}>
              <span>⚡</span> {svc.deliveryDays}d
            </div>
          )}
        </div>

        {/* Actions Grid */}
        <div className={styles.actions}>
          <button 
            onClick={handleAddToCart}
            className={`btn btn-sm ${isInCart ? 'btn-secondary' : 'btn-primary'}`} 
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {isInCart ? <Check size={14} /> : <ShoppingBag size={14} />}
            {isInCart ? 'In Cart' : 'Add to Cart'}
          </button>
          
          <Link href={svc.href} className="btn btn-sm btn-ghost" style={{ padding: 8 }} title="View details">
            <Eye size={16} />
          </Link>
          
          <a href={waMessage(svc)} className={`btn btn-sm ${styles.waBtn}`} title="Order on WhatsApp">
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'all',        label: 'All Products' },
  { id: 'str',        label: 'Technology Solutions' },
  { id: 'scs',        label: 'Consultancy Services' },
  { id: 'popular',    label: '🔥 Best Selling' },
];

export function FeaturedMarketplace() {
  const [activeTab, setActiveTab] = React.useState('all');

  const filtered = featuredServices.filter(s => {
    if (activeTab === 'all')     return true;
    if (activeTab === 'popular') return s.isPopular;
    return s.entity === activeTab;
  }).slice(0, 8);

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div className="section-label">
            <ShoppingBag size={14} />
            Service E-Commerce Storefront
          </div>
          <h2 className="text-display-lg">
            Featured Products &amp;<br />
            <span className="text-gradient-brand">Enterprise Solutions</span>
          </h2>
          <p className="text-body-lg" style={{ color: 'var(--color-text-secondary)', marginTop: 12 }}>
            Add standard digital services directly to your cart and checkout instantly. Zero contract friction.
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Store Grid */}
        <div className={styles.grid}>
          {filtered.map(svc => <ServiceCard key={svc.id} svc={svc} />)}
        </div>

        {/* CTA */}
        <div className={styles.bottomCTA}>
          <Link href="/marketplace" className="btn btn-primary btn-lg">
            Browse All Products <ArrowRight size={18} />
          </Link>
          <Link href="/contact" className="btn btn-ghost btn-lg">
            Request Custom Solution
          </Link>
        </div>
      </div>
    </section>
  );
}
