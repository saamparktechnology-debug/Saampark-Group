'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrderStore } from '@/lib/store/orderStore';
import { OrderTrackerModal } from '@/components/features/OrderTrackerModal/OrderTrackerModal';

function TrackContent() {
  const searchParams = useSearchParams();
  const { openTracking } = useOrderStore();

  useEffect(() => {
    const orderNo = searchParams.get('order') || searchParams.get('id') || '';
    openTracking(orderNo);
  }, [searchParams, openTracking]);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' }}>
      <OrderTrackerModal />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <TrackContent />
    </Suspense>
  );
}
