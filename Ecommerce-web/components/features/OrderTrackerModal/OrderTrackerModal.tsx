'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  MessageCircle,
  Building2,
  Package,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useOrderStore, PlacedOrder } from '@/lib/store/orderStore';
import styles from './OrderTrackerModal.module.css';

export function OrderTrackerModal() {
  const { trackingOpen, closeTracking, trackingOrderNumber, myOrders } = useOrderStore();

  const [inputOrderNumber, setInputOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any | null>(null);

  useEffect(() => {
    if (trackingOpen) {
      setError(null);
      if (trackingOrderNumber) {
        setInputOrderNumber(trackingOrderNumber);
        fetchOrder(trackingOrderNumber);
      } else if (myOrders.length > 0) {
        setInputOrderNumber(myOrders[0].orderNumber);
        fetchOrder(myOrders[0].orderNumber);
      }
    }
  }, [trackingOpen, trackingOrderNumber]);

  if (!trackingOpen) return null;

  const fetchOrder = async (ordNum: string) => {
    if (!ordNum.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(ordNum.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Order could not be found in CRM records.');
      }
      setOrderData(json.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order information.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(inputOrderNumber);
  };

  const order = orderData?.order;
  const pipeline = orderData?.pipeline || [];

  return (
    <div className={styles.overlay} onClick={closeTracking}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <Package size={20} />
            </div>
            <div>
              <h2>Live Order & Milestone Tracker</h2>
              <p>Real-time synchronization with Saampark CRM project milestones</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={closeTracking}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Lookup Input */}
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <input
              type="text"
              placeholder="Enter Order No (e.g. ORD-STR-2026-1234)"
              value={inputOrderNumber}
              onChange={(e) => setInputOrderNumber(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Track
            </button>
          </form>

          {/* Recent Orders Chips */}
          {myOrders.length > 0 && (
            <div className={styles.recentWrap}>
              <div className={styles.recentLabel}>Recently Placed Orders:</div>
              <div className={styles.recentChips}>
                {myOrders.slice(0, 4).map((o) => (
                  <button
                    key={o.orderNumber}
                    type="button"
                    className={styles.recentChip}
                    onClick={() => {
                      setInputOrderNumber(o.orderNumber);
                      fetchOrder(o.orderNumber);
                    }}
                  >
                    {o.orderNumber} ({o.items[0]?.name?.slice(0, 15) || 'Order'})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Fetching live milestones from CRM...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {order && !loading && (
            <div>
              <div className={styles.orderCard}>
                <div className={styles.orderCardHeader}>
                  <div>
                    <div className={styles.orderNum}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Division:{' '}
                      <strong style={{ color: order.companyId === 'tech' ? '#2563eb' : '#ea580c' }}>
                        {order.companyId === 'tech'
                          ? 'SAAMPARK TECHNOLOGY & RESEARCH'
                          : 'SAAMPARK CONSULTANCY SERVICE'}
                      </strong>
                    </div>
                  </div>
                  <div
                    className={`${styles.statusPill} ${
                      order.status === 'Invoice Created'
                        ? styles.invoiced
                        : order.status === 'Order Processed'
                        ? styles.completed
                        : ''
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    {order.status}
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className={styles.stepper}>
                  <div className={styles.stepItem}>
                    <div className={`${styles.stepLine} ${styles.active}`} />
                    <div className={`${styles.stepIcon} ${styles.active}`}>✓</div>
                    <div className={styles.stepContent}>
                      <div className={styles.stepTitle}>1. Order Placed & Confirmed</div>
                      <div className={styles.stepDesc}>
                        Registered on {order.orderDate || 'Today'} with customer details & deliverables list.
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepItem}>
                    <div
                      className={`${styles.stepLine} ${
                        order.status === 'Invoice Created' || order.status === 'Order Processed'
                          ? styles.active
                          : ''
                      }`}
                    />
                    <div
                      className={`${styles.stepIcon} ${
                        order.status === 'Invoice Created' || order.status === 'Order Processed'
                          ? styles.active
                          : ''
                      }`}
                    >
                      {order.status === 'Invoice Created' || order.status === 'Order Processed' ? '✓' : '2'}
                    </div>
                    <div className={styles.stepContent}>
                      <div className={styles.stepTitle}>2. Official CRM Tax Invoice Generation</div>
                      <div className={styles.stepDesc}>
                        {order.status === 'Invoice Created' || order.status === 'Order Processed' ? (
                          <div>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                              Generated: {order.invoiceNumber || 'Official Invoice'}
                            </span>
                            {order.invoiceUrl && (
                              <div>
                                <a
                                  href={`https://crm2.saampark.com${order.invoiceUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.invoiceAction}
                                >
                                  <FileText size={14} /> View Official Invoice ↗
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          'Account manager is preparing the official GST invoice & SLA contract in CRM.'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepItem}>
                    <div className={`${styles.stepIcon} ${order.status === 'Order Processed' ? styles.active : ''}`}>
                      {order.status === 'Order Processed' ? '✓' : '3'}
                    </div>
                    <div className={styles.stepContent}>
                      <div className={styles.stepTitle}>3. Engineering & Live Deployment</div>
                      <div className={styles.stepDesc}>
                        {order.status === 'Order Processed'
                          ? 'Project completed and deliverables handed over to client.'
                          : 'Assigned tech and marketing team actively executing the package deliverables.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className={styles.itemsList}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Order Items:
                  </div>
                  {(order.items || []).map((it: any, i: number) => (
                    <div key={i} className={styles.itemRow}>
                      <span>{it.name} (Qty: {it.qty || 1})</span>
                      <strong style={{ color: '#2563eb' }}>
                        ₹{Number(it.price * (it.qty || 1)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))}
                  <div className={styles.itemRow} style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.4rem', marginTop: '0.4rem', fontWeight: 700 }}>
                    <span>Grand Total:</span>
                    <span>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <a
            href="https://crm2.saampark.com/login"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
          >
            <ExternalLink size={14} /> Open CRM Client Portal
          </a>
          <a
            href={`https://wa.me/919091518567?text=${encodeURIComponent(
              `Hello Saampark, I am checking the status of my order ${inputOrderNumber || ''}.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm"
          >
            <MessageCircle size={14} /> WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}
