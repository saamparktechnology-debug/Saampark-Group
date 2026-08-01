'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageCircle, Shield, CheckCircle, Sparkles, Search, ChevronRight, Globe, Smartphone, Database, Megaphone, MapPin, FileText } from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import styles from './Hero.module.css';

function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    interface P {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      alpha: number;
      colorIndex: number;
    }

    const paletteLight = ['#00B4A6', '#1E90FF', '#4CAF50', '#8B5CF6', '#111827'];
    const paletteDark  = ['#00B4A6', '#33C9BF', '#1E90FF', '#4CAF50', '#FFFFFF'];
    
    const count   = Math.min(100, Math.floor(window.innerWidth / 15));
    const pts: P[]  = Array.from({ length: count }, () => ({
      x:          Math.random() * canvas.width,
      y:          Math.random() * canvas.height,
      vx:         (Math.random() - 0.5) * 0.3,
      vy:         (Math.random() - 0.5) * 0.3,
      size:       0.8 + Math.random() * 1.8,
      alpha:      0.15 + Math.random() * 0.4,
      colorIndex: Math.floor(Math.random() * 5),
    }));

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const onMouse = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouse);

    let rafId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const palette = isLight ? paletteLight : paletteDark;

      // Deep background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0,   isLight ? '#F8F7F4' : '#0D1B2A');
      bg.addColorStop(0.6, isLight ? '#FFFFFF' : '#162032');
      bg.addColorStop(1,   isLight ? '#F8F7F4' : '#0D1B2A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radial glows
      const g1 = ctx.createRadialGradient(canvas.width * 0.25, canvas.height * 0.4, 0, canvas.width * 0.25, canvas.height * 0.4, canvas.width * 0.4);
      g1.addColorStop(0, isLight ? 'rgba(0,180,166,0.06)' : 'rgba(0,180,166,0.10)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const g2 = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.6, 0, canvas.width * 0.8, canvas.height * 0.6, canvas.width * 0.3);
      g2.addColorStop(0, isLight ? 'rgba(30,144,255,0.04)' : 'rgba(30,144,255,0.07)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particles
      pts.forEach(p => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          p.vx += dx / dist * 0.008;
          p.vy += dy / dist * 0.008;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.6) { p.vx *= 0.95; p.vy *= 0.95; }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = palette[p.colorIndex];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.save();
            ctx.globalAlpha = (1 - dist / 100) * (isLight ? 0.08 : 0.12);
            ctx.strokeStyle = isLight ? '#007A74' : '#00B4A6';
            ctx.lineWidth   = 0.4;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

export function Hero() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const categories = [
    { label: 'Websites',     icon: Globe,       href: '/marketplace?category=website',      color: '#00B4A6' },
    { label: 'Mobile Apps',  icon: Smartphone,  href: '/marketplace?category=app',          color: '#1E90FF' },
    { label: 'Software/ERP', icon: Database,    href: '/marketplace?category=software',     color: '#8B5CF6' },
    { label: 'Digital Ads',  icon: Megaphone,   href: '/marketplace?category=meta-ads',     color: '#F4511E' },
    { label: 'Local SEO',    icon: MapPin,      href: '/marketplace?category=google-business', color: '#4CAF50' },
    { label: 'Company Registration', icon: FileText, href: '/marketplace?category=business-legal', color: '#EC4899' },
  ];

  return (
    <section className={styles.hero}>
      <CanvasBackground />

      {/* Floating background blobs */}
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />

      <div className={`container ${styles.content} ${mounted ? styles.contentVisible : ''}`}>
        
        {/* ISO Tag */}
        <div className={styles.badge}>
          <Shield size={14} />
          ISO 9001:2015 Certified Service Storefront
        </div>

        {/* E-Commerce Header */}
        <h1 className={styles.headline}>
          Explore Premium <br className={styles.mobileBr} />
          <span className={styles.gradientText}>Digital Products</span> &amp; Services
        </h1>

        <p className={styles.subheadline}>
          Order verified enterprise-grade technology packages and managed marketing campaigns with upfront pricing, fast timelines, and transparent execution.
        </p>

        {/* Storefront Search Bar */}
        <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search our catalog of 40+ premium business services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>
            Search Store
          </button>
        </form>

        {/* E-Commerce Trust Badges */}
        <div className={styles.trustPills}>
          <div className={styles.trustPill}><CheckCircle size={14} /> Direct WhatsApp Delivery Support</div>
          <div className={styles.trustPill}><CheckCircle size={14} /> Verified Professional Team</div>
          <div className={styles.trustPill}><CheckCircle size={14} /> Zero Hidden Setup Costs</div>
        </div>

        {/* Shop Category Grid */}
        <div className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>Browse Service Departments</h3>
          <div className={styles.categoryGrid}>
            {categories.map((cat, i) => (
              <Link key={i} href={cat.href} className={styles.categoryCard}>
                <div className={styles.catIconWrap} style={{ color: cat.color, background: `${cat.color}12` }}>
                  <cat.icon size={22} />
                </div>
                <span className={styles.catLabel}>{cat.label}</span>
                <ChevronRight size={14} className={styles.catArrow} />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
