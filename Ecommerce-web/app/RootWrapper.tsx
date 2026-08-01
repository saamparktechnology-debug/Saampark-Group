'use client';

import React, { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/features/SplashScreen/SplashScreen';
import { CommerceDrawers } from '@/components/layout/CommerceDrawers/CommerceDrawers';

export function RootWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady,  setAppReady]   = useState(false);

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
      </div>
    </>
  );
}
