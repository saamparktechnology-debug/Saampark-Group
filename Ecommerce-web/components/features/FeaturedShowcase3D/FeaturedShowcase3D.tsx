'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  ShoppingBag, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  TrendingUp, 
  Scale, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Layers,
  Zap
} from 'lucide-react';
import { allServices, type Service } from '@/lib/data/services';
import { useCommerceStore } from '@/lib/store/cartStore';
import styles from './FeaturedShowcase3D.module.css';

interface FeaturedShowcase3DProps {
  onQuickView: (service: Service) => void;
}

// 5 Flagship Solutions Curated from allServices
const FEATURED_IDS = [
  'str-web-dynamic',
  'str-app-android',
  'res-stock-equity',
  'scs-social-standard',
  'con-pvt-ltd'
];

export function FeaturedShowcase3D({ onQuickView }: FeaturedShowcase3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { addToCart, cart = [] } = useCommerceStore();

  const featuredServices = FEATURED_IDS.map(id => allServices.find(s => s.id === id)).filter(Boolean) as Service[];

  if (featuredServices.length === 0) return null;

  const currentService = featuredServices[activeIndex];
  const isInCart = Array.isArray(cart) && cart.some(c => c.serviceId === currentService.id);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % featuredServices.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + featuredServices.length) % featuredServices.length);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      serviceId: currentService.id,
      serviceName: currentService.name,
      price: currentService.startingPrice,
      quantity: 1,
    });
  };

  const isSTR = currentService.group === 'technology';

  return (
    <div className={styles.showcaseSection} aria-label="3D Featured Solutions Spotlight">
      <div className={styles.showcaseHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.eyebrowBadge}>
            <Sparkles size={12} />
            <span>CINEMATIC 3D FLAGSHIP SPOTLIGHT</span>
          </span>
          <h2 className={styles.sectionTitle}>Engineered for Enterprise Impact</h2>
        </div>

        {/* Orbit Pagination Indicators */}
        <div className={styles.navControls}>
          <button 
            type="button" 
            onClick={handlePrev} 
            className={styles.orbitNavBtn} 
            aria-label="Previous Featured Service"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className={styles.orbitDots}>
            {featuredServices.map((svc, idx) => (
              <button
                key={svc.id}
                type="button"
                className={`${styles.orbitDot} ${idx === activeIndex ? styles.activeDot : ''}`}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Jump to ${svc.name}`}
              >
                <span className={styles.dotFill} />
              </button>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleNext} 
            className={styles.orbitNavBtn} 
            aria-label="Next Featured Service"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 3D Showcase Stage */}
      <div className={`${styles.stageContainer} ${isSTR ? styles.strTheme : styles.scsTheme}`}>
        <div className={styles.stageBackdropGlow} />
        <div className={styles.stagePerspectiveGrid} />

        <div className={styles.contentColumns}>
          {/* Column 1: Editorial Specs & Business Intelligence */}
          <div className={styles.specsColumn}>
            <div className={styles.divisionPill}>
              <span className={styles.pillDot} />
              <span>{isSTR ? 'STR // TECHNOLOGY & RESEARCH' : 'SCS // CONSULTANCY SERVICE'}</span>
            </div>

            <h3 className={styles.serviceName}>{currentService.name}</h3>
            <p className={styles.serviceDesc}>{currentService.description}</p>

            {/* Technical Highlights / Deliverables */}
            <div className={styles.deliverablesList}>
              {currentService.features?.slice(0, 3).map((feat, idx) => (
                <div key={idx} className={styles.deliverableItem}>
                  <Check size={14} className={styles.checkIcon} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Key Telemetry Badges */}
            <div className={styles.telemetryDeck}>
              <div className={styles.telemetryCard}>
                <span className={styles.telemetryVal}>{currentService.deliveryDays ? `${currentService.deliveryDays} Days` : 'Express'}</span>
                <span className={styles.telemetryKey}>Delivery SLA</span>
              </div>
              <div className={styles.telemetryCard}>
                <span className={styles.telemetryVal}>ISO 9001:2015</span>
                <span className={styles.telemetryKey}>Govt Certified</span>
              </div>
              <div className={styles.telemetryCard}>
                <span className={styles.telemetryVal}>99.98%</span>
                <span className={styles.telemetryKey}>Uptime Guarantee</span>
              </div>
            </div>

            {/* Price & Action Deck */}
            <div className={styles.priceActionDeck}>
              <div className={styles.priceWrap}>
                <span className={styles.pricePrefix}>Starting at</span>
                <span className={styles.priceAmount}>
                  ₹{currentService.startingPrice?.toLocaleString('en-IN') || 'Quote'}
                </span>
              </div>

              <div className={styles.actionButtonGroup}>
                <button
                  type="button"
                  className={`${styles.cartButton} ${isInCart ? styles.inCart : ''}`}
                  onClick={handleAddToCart}
                >
                  {isInCart ? <Check size={16} /> : <ShoppingBag size={16} />}
                  <span>{isInCart ? 'In Your Cart' : 'Instant Add to Cart'}</span>
                </button>

                <button
                  type="button"
                  className={styles.quickSpecsButton}
                  onClick={() => onQuickView(currentService)}
                >
                  <Eye size={15} />
                  <span>Specs</span>
                </button>

                <Link href={currentService.href} className={styles.exploreLink}>
                  <span>Details</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: 3D Holographic Visual Monolith */}
          <div className={styles.visualColumn}>
            <div className={styles.card3DWrapper}>
              <div className={styles.cardGroundReflection} />
              <div className={styles.hologramCard}>
                <div className={styles.holoLightSweep} />
                
                <div className={styles.thumbnailContainer}>
                  <Image
                    src={currentService.image || '/assets/images/website-dev.jpg'}
                    alt={currentService.name}
                    width={460}
                    height={280}
                    className={styles.holoImage}
                    unoptimized
                    priority
                  />
                  <div className={styles.holoScanlines} />
                </div>

                {/* Floating 3D Spec Pills */}
                <div className={styles.floatingTag}>
                  <Zap size={13} className={styles.zapIcon} />
                  <span>{isSTR ? 'Next.js 16 • Turbopack Core' : 'ROAS 4.8x • Meta Ads Engine'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}