'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Building2,
  MapPin,
  Lock,
  MessageCircle,
  Copy,
  Check,
  Tag,
  Sparkles,
  FileCheck2,
  UserCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useOrderStore, PlacedOrder } from '@/lib/store/orderStore';
import { useAuthStore } from '@/lib/store/authStore';
import styles from './CheckoutModal.module.css';

const INDIAN_STATES = [
  'West Bengal',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'Gujarat',
  'Uttar Pradesh',
  'Rajasthan',
  'Haryana',
  'Punjab',
  'Kerala',
  'Odisha',
  'Bihar',
  'Jharkhand',
  'Assam',
  'Madhya Pradesh',
  'Other State',
];

const FALLBACK_COUPONS: Record<string, number> = {
  TECH20: 20,
  DIWALI25: 25,
  STARTUP30: 30,
  SAAMPARK10: 10,
};

export function CheckoutModal() {
  const { cart, clearCart } = useCommerceStore();
  const { user, setAuthenticatedUser } = useAuthStore();
  const {
    checkoutOpen,
    closeCheckout,
    activeDirectService,
    openTracking,
    savePlacedOrder,
    myOrders,
  } = useOrderStore();

  const [formData, setFormData] = useState({
    clientName: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    gstNumber: '',
    panNumber: '',
    urgency: 'Standard',
    notes: '',
  });

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [liveCoupons, setLiveCoupons] = useState<Record<string, number>>(FALLBACK_COUPONS);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync live coupon codes from CRM2 storefront config & prefill client profile
  useEffect(() => {
    if (!checkoutOpen) return;
    setPlacedOrder(null);

    const latestOrder = myOrders?.[0];
    setFormData((prev) => ({
      ...prev,
      clientName: user?.name || latestOrder?.clientName || prev.clientName,
      businessName: user?.businessName || latestOrder?.businessName || prev.businessName,
      email: user?.email || latestOrder?.email || prev.email,
      phone: user?.phone || latestOrder?.phone || prev.phone,
      address: user?.address || latestOrder?.address || prev.address,
      city: user?.city || latestOrder?.city || prev.city || 'Kolkata',
      state: user?.state || latestOrder?.state || prev.state || 'West Bengal',
      pincode: user?.pincode || latestOrder?.pincode || prev.pincode || '700001',
      gstNumber: user?.gstNumber || latestOrder?.gstNumber || prev.gstNumber,
      panNumber: user?.panNumber || latestOrder?.panNumber || prev.panNumber,
    }));

    fetch('/api/storefront')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data?.storefront) {
          const map: Record<string, number> = { ...FALLBACK_COUPONS };
          ['tech', 'consultancy'].forEach((scope) => {
            const banners = json.data.storefront?.[scope]?.discountBanners || [];
            banners.forEach((b: any) => {
              if (b?.isActive && b?.promoCode && b?.discountPercentage) {
                map[String(b.promoCode).toUpperCase().trim()] = Number(b.discountPercentage);
              }
            });
          });
          setLiveCoupons(map);
        }
      })
      .catch(() => {});
  }, [checkoutOpen, user, myOrders]);

  if (!checkoutOpen) return null;

  const orderItems = activeDirectService
    ? [
        {
          serviceId: activeDirectService.id,
          name: activeDirectService.name,
          price: activeDirectService.startingPrice || 4999,
          qty: 1,
          priceType: activeDirectService.priceType || 'one-time',
          deliveryDays: String(activeDirectService.deliveryDays || '3-5 Days'),
        },
      ]
    : cart.map((item) => ({
        serviceId: item.serviceId,
        name: item.serviceName,
        price: item.price || 4999,
        qty: item.quantity,
        priceType: 'one-time',
        deliveryDays: '3-5 Days',
      }));

  const subtotal = orderItems.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0);
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.percent) / 100) : 0;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round((taxableBase * 18) / 100);
  const isIntraState = formData.state.toLowerCase().includes('west bengal');
  const gstType = isIntraState ? 'CGST (9%) + SGST (9%)' : 'IGST (18%)';
  const totalAmount = taxableBase + gstAmount;

  const isConsultancy = activeDirectService
    ? activeDirectService.group === 'consultancy' || activeDirectService.entity === 'scs'
    : orderItems.some((it) => it.serviceId.includes('scs') || it.serviceId.includes('consult'));
  const companyScope: 'tech' | 'consultancy' = isConsultancy ? 'consultancy' : 'tech';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const formatted =
      name === 'gstNumber' || name === 'panNumber' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: formatted }));
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (liveCoupons[code]) {
      setAppliedCoupon({ code, percent: liveCoupons[code] });
      setCouponError(null);
    } else {
      setCouponError('Invalid or expired promo code.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Please fill in your full name, email address, and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        clientName: formData.clientName.trim(),
        businessName: formData.businessName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        gstNumber: formData.gstNumber.trim(),
        panNumber: formData.panNumber.trim(),
        urgency: formData.urgency,
        notes: formData.notes.trim(),
        companyId: companyScope,
        items: orderItems,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code || '',
        gstAmount,
        gstType,
        totalAmount,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit order');
      }

      const confirmedOrder: PlacedOrder = {
        id: json.data?.order?.id || `ord-${Date.now()}`,
        orderNumber: json.data?.order?.orderNumber || `ORD-${Date.now()}`,
        clientName: formData.clientName.trim(),
        businessName: formData.businessName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        gstNumber: formData.gstNumber.trim(),
        panNumber: formData.panNumber.trim(),
        items: orderItems,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code,
        gstAmount,
        gstType,
        urgency: formData.urgency,
        totalAmount,
        status: 'Order Pending',
        companyId: companyScope,
        orderDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        notes: formData.notes.trim(),
        clientPortal: json.data?.clientPortal || {
          loginUrl: 'https://crm2.saampark.com/login',
          email: formData.email.trim().toLowerCase(),
          defaultPassword: 'Client@123',
        },
      };

      savePlacedOrder(confirmedOrder);

      // Save client billing profile & keep session signed in seamlessly
      setAuthenticatedUser({
        name: confirmedOrder.clientName,
        email: confirmedOrder.email,
        phone: confirmedOrder.phone,
        businessName: confirmedOrder.businessName,
        address: confirmedOrder.address,
        city: confirmedOrder.city,
        state: confirmedOrder.state,
        pincode: confirmedOrder.pincode,
        gstNumber: confirmedOrder.gstNumber,
        panNumber: confirmedOrder.panNumber,
      });

      setPlacedOrder(confirmedOrder);

      if (!activeDirectService) {
        clearCart();
      }
    } catch (err: any) {
      alert(`Order notice: ${err.message || 'Network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLiveTracker = () => {
    if (placedOrder) {
      closeCheckout();
      openTracking(placedOrder.orderNumber);
    }
  };

  return (
    <div className={styles.overlay} onClick={closeCheckout}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2>{placedOrder ? 'Order Confirmed' : 'Official Service Booking & GST Checkout'}</h2>
              <p>
                {placedOrder
                  ? 'Order registered in CRM & Client Portal access is ready'
                  : 'Complete billing details for instant CRM tax invoice generation'}
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={closeCheckout}>
            <X size={20} />
          </button>
        </div>

        {placedOrder ? (
          <div className={styles.body}>
            <div className={styles.successWrap}>
              <div className={styles.successIconWrap}>
                <CheckCircle2 size={36} />
              </div>
              <h2>Thank You, {placedOrder.clientName}</h2>
              <p>Your order has been dispatched to our billing & engineering team.</p>

              <div className={styles.orderBadge}>
                <span>Order No: {placedOrder.orderNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(placedOrder.orderNumber)}
                  title="Copy Order ID"
                  className={styles.closeBtn}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className={styles.portalCard}>
                <h4>Official CRM Client Portal Account</h4>
                <p>
                  Sign in with your email anytime to check project status, milestones, and download GST invoices:
                </p>
                <div className={styles.credRow}>
                  <span>Portal Login URL:</span>
                  <a
                    href="https://crm2.saampark.com/login"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline"
                  >
                    crm2.saampark.com/login
                  </a>
                </div>
                <div className={styles.credRow}>
                  <span>Client Email:</span>
                  <strong>{placedOrder.email}</strong>
                </div>
                <div className={styles.credRow}>
                  <span>Portal Password:</span>
                  <strong>Client@123</strong>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button type="button" className="btn btn-primary" onClick={handleOpenLiveTracker}>
                  Track Live Status
                </button>
                <Link
                  href="/account"
                  onClick={closeCheckout}
                  className="btn btn-secondary"
                >
                  View My Order History
                </Link>
                <a
                  href={`https://wa.me/919091518567?text=${encodeURIComponent(
                    `Hello Saampark, I placed order #${placedOrder.orderNumber} for ${placedOrder.clientName}. Please confirm requirements.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className={styles.body}>
              <div className={styles.trustBadges}>
                <span>
                  <Lock size={12} style={{ display: 'inline', marginRight: 4 }} />
                  256-Bit Encrypted
                </span>
                <span>
                  <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
                  ISO 9001:2015 Certified
                </span>
                <span>
                  <FileCheck2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Fast GST Invoicing
                </span>
              </div>

              {user && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#10b981',
                    marginBottom: '12px',
                  }}
                >
                  <UserCheck size={15} />
                  <span>Auto-filled from your verified client profile ({user.email})</span>
                </div>
              )}

              {/* Order Summary & Promo Box */}
              <div className={styles.summaryBox}>
                <div className={styles.sectionTitle}>
                  <ShoppingBag size={14} /> Selected Packages ({orderItems.length})
                </div>
                {orderItems.map((item, idx) => (
                  <div key={idx} className={styles.summaryItem}>
                    <div>
                      <div className={styles.summaryItemName}>{item.name}</div>
                      <div className={styles.fieldHelp}>Delivery SLA: {item.deliveryDays}</div>
                    </div>
                    <div className={styles.summaryItemPrice}>
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}

                {/* Promo Code Bar */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', marginBottom: '6px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Have a Promo Code? (e.g. TECH20)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        border: '1px solid var(--color-border-default)',
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}
                  >
                    <Tag size={12} /> Apply
                  </button>
                </div>
                {couponError && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '4px' }}>
                    {couponError}
                  </div>
                )}
                {appliedCoupon && (
                  <div className={styles.summaryItem} style={{ borderBottom: 'none', paddingTop: '2px', color: '#10b981' }}>
                    <span className={styles.fieldHelp} style={{ color: '#10b981', fontWeight: 700 }}>
                      Promo Applied ({appliedCoupon.code} - {appliedCoupon.percent}% Off):
                    </span>
                    <span className={styles.fieldHelp} style={{ color: '#10b981', fontWeight: 700 }}>
                      -₹{discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className={styles.summaryItem} style={{ borderBottom: 'none', paddingTop: '4px' }}>
                  <span className={styles.fieldHelp}>Tax ({gstType}):</span>
                  <span className={styles.fieldHelp}>+₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Grand Total (Incl. GST):</span>
                  <span style={{ color: '#2563eb' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Client & Business Details */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <Building2 size={14} /> 1. Client &amp; Business Information
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Full Name *</label>
                    <input
                      required
                      type="text"
                      name="clientName"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.clientName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Company / Brand Name</label>
                    <input
                      type="text"
                      name="businessName"
                      placeholder="e.g. Sharma Enterprises Pvt Ltd"
                      value={formData.businessName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Email Address *</label>
                    <input
                      required
                      type="email"
                      name="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <span className={styles.fieldHelp}>
                      Tax invoice &amp; CRM Client Portal login link to this email.
                    </span>
                  </div>
                  <div className={styles.field}>
                    <label>WhatsApp / Phone Number *</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address Details */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <MapPin size={14} /> 2. Billing &amp; Tax Invoice Details
                </div>
                <div className={styles.field}>
                  <label>Full Street Address *</label>
                  <input
                    required
                    type="text"
                    name="address"
                    placeholder="Office / Premises address for official Tax Invoice"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.grid3}>
                  <div className={styles.field}>
                    <label>City / District *</label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Pincode *</label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>GSTIN (Optional - B2B Credit)</label>
                    <input
                      type="text"
                      name="gstNumber"
                      maxLength={15}
                      placeholder="e.g. 19AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>PAN Number (Optional)</label>
                    <input
                      type="text"
                      name="panNumber"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={formData.panNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Urgency & Project Scope */}
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>Delivery Priority</label>
                  <select name="urgency" value={formData.urgency} onChange={handleChange}>
                    <option value="Standard">Standard SLA Schedule</option>
                    <option value="Priority">Priority Express Kickoff</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Project Notes &amp; References</label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Brand preferences, timeline, links..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <div>
                <span className={styles.fieldHelp}>Operating Division:</span>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#2563eb' }}>
                  {companyScope === 'tech'
                    ? 'SAAMPARK TECHNOLOGY & RESEARCH'
                    : 'SAAMPARK CONSULTANCY SERVICE'}
                </strong>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Confirm Order &amp; Request Invoice
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
