'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Package,
  Activity,
  FileText,
  ExternalLink,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Mail,
  Save,
  Search,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useOrderStore, PlacedOrder } from '@/lib/store/orderStore';
import styles from './AccountPage.module.css';

function AccountHubContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'orders' | 'status' | 'profile') || 'orders';

  const { user, openAuthModal, updateProfile, logout } = useAuthStore();
  const { myOrders, mergeOrders, openTracking } = useOrderStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'status' | 'profile'>(initialTab);
  const [syncing, setSyncing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PlacedOrder | null>(null);
  const [statusSearch, setStatusSearch] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    gstNumber: '',
    panNumber: '',
  });

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'orders' || t === 'status' || t === 'profile') {
      setActiveTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        businessName: user.businessName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || 'Kolkata',
        state: user.state || 'West Bengal',
        pincode: user.pincode || '700001',
        gstNumber: user.gstNumber || '',
        panNumber: user.panNumber || '',
      });
      syncFromCRM(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!selectedOrder && myOrders.length > 0) {
      setSelectedOrder(myOrders[0]);
    }
  }, [myOrders, selectedOrder]);

  const syncFromCRM = async (email: string) => {
    if (!email) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (json?.success && Array.isArray(json.data?.orders)) {
        mergeOrders(json.data.orders);
      }
    } catch {
      // Fallback gracefully to cached local orders
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleLookupStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSearch.trim()) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(statusSearch.trim())}`);
      const json = await res.json();
      if (json?.success && json.data?.order) {
        setSelectedOrder(json.data.order);
      } else {
        openTracking(statusSearch.trim());
      }
    } catch {
      openTracking(statusSearch.trim());
    }
  };

  const totalSpend = myOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const invoicedCount = myOrders.filter(
    (o) => o.status === 'Invoice Created' || o.status === 'Order Processed'
  ).length;
  const completedCount = myOrders.filter((o) => o.status === 'Order Processed').length;

  if (!user) {
    return (
      <div className={styles.accountPage}>
        <div className="container">
          <div className={styles.gateCard}>
            <div className={styles.avatarSphere} style={{ margin: '0 auto 18px' }}>
              <Mail size={26} />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
              Client Account &amp; Order Hub
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Sign in using your email address (OTP or CRM Password) to view your complete order history, live project status, official GST invoices, and saved billing vault.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={() => openAuthModal()} className="btn btn-primary btn-lg">
                Sign In with Email
                <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => openTracking()} className="btn btn-secondary btn-lg">
                Track Order by ID
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.accountPage}>
      <div className="container">
        {/* Top Profile Glass Banner */}
        <div className={styles.heroBar}>
          <div className={styles.userIdentity}>
            <div className={styles.avatarSphere}>
              {(user.name || user.email || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={styles.userName}>{user.name || 'Saampark Client'}</h1>
              <div className={styles.userSub}>
                <span>{user.email}</span>
                {user.businessName && <span>&bull; {user.businessName}</span>}
                {user.gstNumber && <span>&bull; GSTIN: {user.gstNumber}</span>}
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => syncFromCRM(user.email)}
              className="btn btn-secondary btn-sm"
              disabled={syncing}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync CRM Orders'}
            </button>
            <a
              href="https://crm2.saampark.com/login"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
            >
              CRM Client Portal
              <ExternalLink size={14} />
            </a>
            <button type="button" onClick={logout} className="btn btn-ghost btn-sm">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Orders</div>
            <div className={styles.statVal}>{myOrders.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>GST Invoices Issued</div>
            <div className={styles.statVal} style={{ color: '#2563eb' }}>{invoicedCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Completed Projects</div>
            <div className={styles.statVal} style={{ color: '#10b981' }}>{completedCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Order Value</div>
            <div className={styles.statVal}>₹{totalSpend.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.tabBtnActive : ''}`}
          >
            <Package size={15} /> Order History ({myOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`${styles.tabBtn} ${activeTab === 'status' ? styles.tabBtnActive : ''}`}
          >
            <Activity size={15} /> Live Order Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
          >
            <User size={15} /> Profile &amp; Billing Vault
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className={styles.glassPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                  Order History &amp; Official Tax Invoices
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  All service packages booked under {user.email}
                </p>
              </div>
              <Link href="/" className="btn btn-secondary btn-sm">
                Explore More Services
              </Link>
            </div>

            {myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <Package size={42} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>No Orders Found Yet</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
                  Book any technology or consultancy service to track milestones and GST invoices here.
                </p>
                <Link href="/" className="btn btn-primary btn-sm">
                  Browse 39 Services
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myOrders.map((ord) => {
                  const statusClass =
                    ord.status === 'Order Processed'
                      ? styles.statusProcessed
                      : ord.status === 'Invoice Created'
                      ? styles.statusInvoiced
                      : styles.statusPending;

                  return (
                    <div key={ord.orderNumber} className={styles.orderCard}>
                      <div className={styles.orderTop}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span className={styles.orderNum}>{ord.orderNumber}</span>
                            <span className={`${styles.statusBadge} ${statusClass}`}>
                              {ord.status === 'Order Processed' ? (
                                <CheckCircle2 size={13} />
                              ) : ord.status === 'Invoice Created' ? (
                                <FileText size={13} />
                              ) : (
                                <Clock size={13} />
                              )}
                              {ord.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                            Ordered on {ord.orderDate} &bull;{' '}
                            {ord.companyId === 'consultancy'
                              ? 'Saampark Consultancy Service'
                              : 'Saampark Technology & Research'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                            ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                          </div>
                          {ord.invoiceNumber && (
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>
                              Invoice: {ord.invoiceNumber}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {ord.items.map((item, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '10px',
                              background: 'var(--color-bg-sunken)',
                              border: '1px solid var(--color-border-default)',
                            }}
                          >
                            {item.name} (x{item.qty || 1})
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border-default)', paddingTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setActiveTab('status');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <Activity size={14} /> View Live Pipeline
                        </button>
                        {ord.invoiceUrl && (
                          <a
                            href={ord.invoiceUrl.startsWith('http') ? ord.invoiceUrl : `https://crm2.saampark.com${ord.invoiceUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            <FileText size={14} /> View Official GST Invoice
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE ORDER STATUS */}
        {activeTab === 'status' && (
          <div className={styles.glassPanel}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Live Order Status &amp; Milestones</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Real-time execution progress synchronized with Saampark CRM
                </p>
              </div>
              <form onSubmit={handleLookupStatus} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search Order # (e.g. ORD-STR-...)"
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border-default)',
                    background: 'var(--color-bg-sunken)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Search size={14} /> Track
                </button>
              </form>
            </div>

            {selectedOrder ? (
              <div className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <div>
                    <div className={styles.orderNum}>{selectedOrder.orderNumber}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {selectedOrder.businessName || selectedOrder.clientName} &bull; Billing: {selectedOrder.city}, {selectedOrder.state}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTracking(selectedOrder.orderNumber)}
                    className="btn btn-secondary btn-sm"
                  >
                    Open Full Tracker View
                  </button>
                </div>

                {/* 3-Step Visual Glass Stepper */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginTop: '8px' }}>
                  {/* Step 1 */}
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#10b981' }}>
                      <Check size={16} /> 1. Order Received
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                      Confirmed on {selectedOrder.orderDate} with billing &amp; scope details.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background:
                        selectedOrder.status === 'Invoice Created' || selectedOrder.status === 'Order Processed'
                          ? 'rgba(37, 99, 235, 0.08)'
                          : 'var(--color-bg-sunken)',
                      border:
                        selectedOrder.status === 'Invoice Created' || selectedOrder.status === 'Order Processed'
                          ? '1px solid rgba(37, 99, 235, 0.3)'
                          : '1px solid var(--color-border-default)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        color:
                          selectedOrder.status === 'Invoice Created' || selectedOrder.status === 'Order Processed'
                            ? '#2563eb'
                            : 'var(--color-text-tertiary)',
                      }}
                    >
                      <FileText size={16} /> 2. CRM GST Invoice
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                      {selectedOrder.invoiceNumber
                        ? `Invoice #${selectedOrder.invoiceNumber} issued and ready.`
                        : 'Accounts team is preparing your official tax invoice.'}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background:
                        selectedOrder.status === 'Order Processed'
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'var(--color-bg-sunken)',
                      border:
                        selectedOrder.status === 'Order Processed'
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : '1px solid var(--color-border-default)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        color:
                          selectedOrder.status === 'Order Processed'
                            ? '#10b981'
                            : 'var(--color-text-tertiary)',
                      }}
                    >
                      <ShieldCheck size={16} /> 3. Execution &amp; Delivery
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                      {selectedOrder.status === 'Order Processed'
                        ? 'Deliverables completed and handed over.'
                        : 'Assigned team actively working on package deliverables.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Select an order from your Order History or search by Order Number above.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE & BILLING VAULT */}
        {activeTab === 'profile' && (
          <div className={styles.glassPanel}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Saved Profile &amp; Tax Billing Details
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Details saved here automatically pre-fill every future service booking for 1-click GST invoicing.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Company / Brand Name</label>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, businessName: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Email Address</label>
                  <input type="email" value={profileForm.email} disabled />
                </div>
                <div className={styles.field}>
                  <label>WhatsApp / Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                  <label>Full Billing Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>City / District</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>State</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={profileForm.pincode}
                    onChange={(e) => setProfileForm((p) => ({ ...p, pincode: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={profileForm.gstNumber}
                    onChange={(e) => setProfileForm((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>PAN Number (Optional)</label>
                  <input
                    type="text"
                    value={profileForm.panNumber}
                    onChange={(e) => setProfileForm((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save Billing Profile
                </button>
                {profileSaved && (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} /> Profile Saved
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '70vh' }} />}>
      <AccountHubContent />
    </Suspense>
  );
}
