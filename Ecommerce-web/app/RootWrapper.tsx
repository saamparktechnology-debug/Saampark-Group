'use client';

import React, { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/features/SplashScreen/SplashScreen';
import { CommerceDrawers } from '@/components/layout/CommerceDrawers/CommerceDrawers';
import { CheckoutModal } from '@/components/features/CheckoutModal/CheckoutModal';
import { OrderTrackerModal } from '@/components/features/OrderTrackerModal/OrderTrackerModal';
import { AuthModal } from '@/components/features/AuthModal/AuthModal';

export function RootWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady,  setAppReady]   = useState(false);

  // Initialize Lenis Smooth 3D Scrolling
  useEffect(() => {
    let lenis: any;
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    }).catch(() => {
      // Fallback if dynamic import fails
    });

    return () => {
      lenis?.destroy();
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setAppReady(true);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div
        style={{
          opacity: appReady || !showSplash ? 1 : 0,
          transition: 'opacity 500ms ease',
          visibility: appReady || !showSplash ? 'visible' : 'hidden',
        }}
      >
        {children}
        <CommerceDrawers />
        <CheckoutModal />
        <OrderTrackerModal />
        <AuthModal />
      </div>
    </>
  );
}
