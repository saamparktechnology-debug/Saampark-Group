'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Building2,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useOrderStore, PlacedOrder } from '@/lib/store/orderStore';
import styles from './CheckoutModal.module.css';

export function CheckoutModal() {
  const { cart, clearCart } = useCommerceStore();
  const {
    checkoutOpen,
    closeCheckout,
    activeDirectService,
    openTracking,
    savePlacedOrder
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
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [copied, setCopied] = useState(false);

  if (!checkoutOpen) return null;

  // Determine items to order: if direct service chosen, order just that, otherwise order cart
  const orderItems = activeDirectService
    ? [
        {
          serviceId: activeDirectService.id,
          name: activeDirectService.name,
          price: activeDirectService.startingPrice || 4999,
          qty: 1,
          priceType: activeDirectService.priceType || 'one-time',
          deliveryDays: String(activeDirectService.deliveryDays || '3-5 Days')
        }
      ]
    : cart.map((item) => ({
        serviceId: item.serviceId,
        name: item.serviceName,
        price: item.price || 4999,
        qty: item.quantity,
        priceType: 'one-time',
        deliveryDays: '3-5 Days'
      }));

  const subtotal = orderItems.reduce((acc, it) => acc + (it.price || 0) * it.qty, 0);
  const gstAmount = Math.round((subtotal * 18) / 100);
  const totalAmount = subtotal + gstAmount;

  // Company detection
  const isConsultancy = activeDirectService
    ? activeDirectService.group === 'consultancy' || activeDirectService.entity === 'scs'
    : orderItems.some((it) => it.serviceId.includes('scs') || it.serviceId.includes('consult'));
  const companyScope: 'tech' | 'consultancy' = isConsultancy ? 'consultancy' : 'tech';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Please fill in your name, email, and phone number.');
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
        notes: formData.notes.trim(),
        companyId: companyScope,
        items: orderItems,
        totalAmount
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to place order');
      }

      const confirmedOrder: PlacedOrder = {
        id: json.data?.order?.id || `ord-${Date.now()}`,
        orderNumber: json.data?.order?.orderNumber || `ORD-${Date.now()}`,
        clientName: formData.clientName,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        items: orderItems,
        totalAmount,
        status: 'Order Pending',
        companyId: companyScope,
        orderDate: new Date().toISOString().split('T')[0],
        clientPortal: json.data?.clientPortal || {
          loginUrl: 'https://crm2.saampark.com/login',
          email: formData.email,
          defaultPassword: 'Client@123'
        }
      };

      savePlacedOrder(confirmedOrder);
      setPlacedOrder(confirmedOrder);

      // If checking out from cart, clear cart
      if (!activeDirectService) {
        clearCart();
      }
    } catch (err: any) {
      alert(`Order placement notice: ${err.message || 'Network error'}`);
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
              <h2>{placedOrder ? 'Order Confirmed!' : 'Official Service Booking & Order'}</h2>
              <p>
                {placedOrder
                  ? 'Your order and CRM client account have been generated'
                  : 'Fast checkout with instant CRM client portal account generation'}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={closeCheckout}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {placedOrder ? (
          <div className={styles.body}>
            <div className={styles.successWrap}>
              <div className={styles.successIconWrap}>
                <CheckCircle2 size={36} />
              </div>
              <h2>Thank You, {placedOrder.clientName}!</h2>
              <p>Your order has been registered in the Saampark Group CRM system.</p>

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

              {/* Portal Card */}
              <div className={styles.portalCard}>
                <h4>Official CRM Client Portal Account</h4>
                <p>
                  You can log in to view project milestones, download GST invoices, and track work progress:
                </p>
                <div className={styles.credRow}>
                  <span>Portal Login URL:</span>
                  <a
                    href="https://crm2.saampark.com/login"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline"
                  >
                    https://crm2.saampark.com/login ↗
                  </a>
                </div>
                <div className={styles.credRow}>
                  <span>Username / Email:</span>
                  <strong>{placedOrder.email}</strong>
                </div>
                <div className={styles.credRow}>
                  <span>Initial Password:</span>
                  <strong>Client@123</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionsRow}>
                <button className="btn btn-primary" onClick={handleOpenLiveTracker}>
                  Track Order Status →
                </button>
                <a
                  href={`https://wa.me/919091518567?text=${encodeURIComponent(
                    `Hello Saampark, I placed order #${placedOrder.orderNumber} for ${placedOrder.clientName}. Please confirm requirements.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                >
                  <MessageCircle size={16} /> WhatsApp Team
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className={styles.body}>
              {/* Trust Badges */}
              <div className={styles.trustBadges}>
                <span>256-Bit SSL Secured</span>
                <span>ISO 9001:2015 SLA</span>
                <span>Automated GST Invoicing</span>
              </div>

              {/* Order Summary */}
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
                <div className={styles.summaryItem} style={{ borderBottom: 'none', paddingTop: '0.4rem' }}>
                  <span className={styles.fieldHelp}>GST (18% Invoicing):</span>
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
                  <Building2 size={14} /> 1. Client & Business Information
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
                      Official invoice & CRM login will be created with this email.
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
                  <MapPin size={14} /> 2. Official Billing & GST Address
                </div>
                <div className={styles.field}>
                  <label>Full Street Address *</label>
                  <input
                    required
                    type="text"
                    name="address"
                    placeholder="Office / Premises address for Tax Invoice"
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
                    <input
                      required
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Pincode *</label>
                    <input
                      required
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>GSTIN (Optional)</label>
                    <input
                      type="text"
                      name="gstNumber"
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
                      placeholder="e.g. ABCDE1234F"
                      value={formData.panNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className={styles.field}>
                <label>Project Scope & Specific Requirements</label>
                <textarea
                  rows={2}
                  name="notes"
                  placeholder="Tell us about your brand colors, reference websites, or special delivery instructions..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <div>
                <span className={styles.fieldHelp}>Operating Division:</span>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#2563eb' }}>
                  {companyScope === 'tech'
                    ? 'SAAMPARK TECHNOLOGY & RESEARCH'
                    : 'SAAMPARK CONSULTANCY SERVICE'}
                </strong>
              </div>
              <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                {isSubmitting ? 'Registering Order...' : 'Place Order & Generate Invoice →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
