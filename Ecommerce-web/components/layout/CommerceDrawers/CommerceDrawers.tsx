'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X, Trash2, ShoppingBag, Bookmark, ArrowRight, MessageCircle,
  Check, Clock, Award, Layers, Minus, Plus
} from 'lucide-react';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useOrderStore } from '@/lib/store/orderStore';
import { useAuthStore } from '@/lib/store/authStore';
import { getServiceById } from '@/lib/data/services';
import { calculateOrderTotals } from '@/lib/utils/pricing';
import styles from './CommerceDrawers.module.css';

export function CommerceDrawers() {
  const {
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    wishlistIds, toggleWishlist,
    compareIds, toggleCompare, clearCompare
  } = useCommerceStore();
  
  const {
    cartOpen, closeCart, openCart,
    wishlistOpen, closeWishlist,
    compareOpen, closeCompare, openCompare,
    closeAll
  } = useUIStore();

  const { openCheckout } = useOrderStore();
  const { requireAuth } = useAuthStore();

  const [crmServiceMap, setCrmServiceMap] = React.useState<Record<string, any>>({});

  useEffect(() => {
    if (!wishlistOpen && !compareOpen) return;
    fetch('/api/storefront')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.success || !json?.data?.products) return;
        const map: Record<string, any> = {};
        const allCrm = [
          ...(Array.isArray(json.data.products.tech) ? json.data.products.tech : []),
          ...(Array.isArray(json.data.products.consultancy) ? json.data.products.consultancy : []),
        ];
        allCrm.forEach((p: any) => {
          if (p?.id) map[p.id] = p;
        });
        setCrmServiceMap(map);
      })
      .catch(() => {});
  }, [wishlistOpen, compareOpen]);

  const anyOpen = cartOpen || wishlistOpen || compareOpen;

  useEffect(() => {
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyOpen]);

  const cartTotals = calculateOrderTotals({
    items: cart.map((c) => ({
      serviceId: c.serviceId,
      name: c.serviceName,
      price: c.price,
      qty: c.quantity,
      priceType: c.priceType,
      deliveryDays: c.deliveryDays,
    })),
    state: 'West Bengal',
    urgency: 'Standard',
  });
  const cartTotal = cartTotals.baseSubtotal;
  const cartHasQuote = cartTotals.quoteOnlyCount > 0;
  const cartCanCheckout = cartTotals.billableItems.length > 0 && cartTotals.totalAmount > 0;

  const resolveService = (id: string) => {
    const staticSvc = getServiceById(id);
    const crmSvc = crmServiceMap[id];
    if (crmSvc && staticSvc) return { ...staticSvc, ...crmSvc };
    return crmSvc || staticSvc || null;
  };
  const wishlistServices = wishlistIds.map(resolveService).filter(Boolean);
  const compareServices = compareIds.map(resolveService).filter(Boolean);

  // Best price & fastest SLA detection across compared packages
  const pricedValues = compareServices
    .map((s: any) => (typeof s?.startingPrice === 'number' && s.startingPrice > 0 ? s.startingPrice : null))
    .filter((v): v is number => v !== null);
  const lowestPrice = pricedValues.length > 1 ? Math.min(...pricedValues) : null;

  const slaValues = compareServices
    .map((s: any) => {
      const n = parseInt(String(s?.deliveryDays || ''), 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    })
    .filter((v): v is number => v !== null);
  const fastestSla = slaValues.length > 1 ? Math.min(...slaValues) : null;

  const handleCompareAddToCart = (svc: any) => {
    const inCart = useCommerceStore.getState().cart.some((c) => c.serviceId === svc.id);
    if (inCart) {
      closeCompare();
      openCart();
      return;
    }
    addToCart({
      serviceId: svc.id,
      serviceName: svc.name,
      price: svc.startingPrice ?? null,
      quantity: 1,
      group: svc.group,
      entity: svc.entity,
      priceType: svc.priceType,
      deliveryDays: svc.deliveryDays ?? '3-5 Days',
      image: svc.image,
    });
    closeCompare();
    openCart();
  };

  const handleCheckoutWA = () => {
    let msg = `Hello Saampark, I would like to request services:\n\n`;
    cart.forEach(item => {
      msg += `- ${item.serviceName} (Qty: ${item.quantity})\n`;
    });
    if (cartTotal > 0) {
      msg += `\nEstimated Total: ₹${cartTotal.toLocaleString('en-IN')}\n`;
    }
    msg += `\nPlease guide me on the next steps.`;
    window.open(`https://wa.me/919091518567?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      {anyOpen && (
        <div className={styles.overlay} onClick={closeAll} />
      )}

      {/* ── Cart Drawer ── */}
      <div className={`${styles.drawer} ${cartOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h3><ShoppingBag size={18} /> Cart ({cart.length})</h3>
          <button className="btn btn-icon btn-ghost" onClick={closeCart}><X size={20} /></button>
        </div>
        
        <div className={styles.body}>
          {cart.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={40} className={styles.emptyIcon} />
              <p>Your cart is empty.</p>
              <button className="btn btn-primary btn-sm" onClick={() => { closeCart(); window.location.href = '/marketplace'; }}>
                Browse Services
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {cart.map(item => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.serviceName}</div>
                    <div className={styles.itemMeta}>
                      {item.price && item.price > 0
                        ? `₹${item.price.toLocaleString('en-IN')} × ${item.quantity}`
                        : 'Custom Quote Package'}
                    </div>
                    <div className={styles.itemPrice}>
                      {item.price && item.price > 0
                        ? `₹${(item.price * item.quantity).toLocaleString('en-IN')}`
                        : 'Custom Quote'}
                    </div>
                  </div>
                  <div className={styles.cartItemRight}>
                    <div className={styles.cartQtyBox}>
                      <button
                        type="button"
                        className={styles.cartQtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease ${item.serviceName} quantity`}
                      >
                        <Minus size={12} />
                      </button>
                      <span className={styles.cartQtyNum}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.cartQtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase ${item.serviceName} quantity`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.serviceName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.calcSummaryList}>
              <div className={styles.calcSummaryRow}>
                <span>Services Subtotal:</span>
                <span>
                  {cartTotal > 0 ? `₹${cartTotal.toLocaleString('en-IN')}` : 'Custom Quote'}
                </span>
              </div>
              {cartCanCheckout && (
                <div className={styles.calcSummaryRow}>
                  <span>Estimated GST (18%):</span>
                  <span>+₹{cartTotals.gstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className={styles.totalRow} style={{ marginTop: 6, marginBottom: 'var(--size-3)' }}>
                <span>Estimated Total:</span>
                <span className={styles.totalPrice}>
                  {cartCanCheckout
                    ? `₹${cartTotals.totalAmount.toLocaleString('en-IN')}`
                    : 'To be quoted'}
                  {cartCanCheckout && cartHasQuote ? ' + Quotes' : ''}
                </span>
              </div>
            </div>

            {cartCanCheckout ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  requireAuth(() => {
                    closeCart();
                    openCheckout();
                  }, 'Please sign in or create an account before proceeding to checkout.');
                }}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 8, gap: 6, fontWeight: 700 }}
              >
                <ShoppingBag size={18} /> Proceed to Official Checkout
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeCart();
                  window.location.href = '/contact';
                }}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 8, gap: 6, fontWeight: 700 }}
              >
                Request Custom Quote Consultation <ArrowRight size={16} />
              </button>
            )}

            <button
              className="btn btn-outline btn-sm"
              onClick={handleCheckoutWA}
              style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
            >
              <MessageCircle size={16} /> Fast Booking via WhatsApp
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={clearCart}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* ── Wishlist Drawer ── */}
      <div className={`${styles.drawer} ${wishlistOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h3><Bookmark size={18} /> Saved Items ({wishlistIds.length})</h3>
          <button className="btn btn-icon btn-ghost" onClick={closeWishlist}><X size={20} /></button>
        </div>
        
        <div className={styles.body}>
          {wishlistServices.length === 0 ? (
            <div className={styles.empty}>
              <Bookmark size={40} className={styles.emptyIcon} />
              <p>Your wishlist is empty.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {wishlistServices.map(svc => svc && (
                <div key={svc.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{svc.name}</div>
                    <div className={styles.itemPrice}>
                      {svc.startingPrice ? `Starting at ₹${svc.startingPrice.toLocaleString('en-IN')}` : 'Custom Quote'}
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => toggleWishlist(svc.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Compare Dock Pill (when items selected & drawer closed) ── */}
      {compareServices.length > 0 && !compareOpen && !cartOpen && !wishlistOpen && (
        <div className={styles.compareFloatingDock}>
          <button
            type="button"
            className={styles.compareDockBtn}
            onClick={openCompare}
          >
            <Layers size={15} />
            <span>Compare Services ({compareServices.length}/3)</span>
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            className={styles.compareDockClear}
            onClick={clearCompare}
            aria-label="Clear compare list"
            title="Clear compare list"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Compare Drawer (Bottom Sheet) ── */}
      <div className={`${styles.compareDrawer} ${compareOpen ? styles.compareOpen : ''}`}>
        <div className={styles.compareHeader}>
          <div className={styles.compareTitleWrap}>
            <h3>Side-by-Side Comparison ({compareServices.length}/3)</h3>
            <span className={styles.compareHint}>Compare price, delivery SLA, tech & deliverables</span>
          </div>
          <div className={styles.compareHeaderActions}>
            {compareServices.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clearCompare}
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              className="btn btn-icon btn-ghost"
              onClick={closeCompare}
              aria-label="Close compare"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.compareBody}>
          {compareServices.length === 0 ? (
            <div className={styles.compareEmptyMsg}>
              Select up to 3 services using the Compare toggle on any card to compare pricing, delivery SLA, tech stack, and deliverables side-by-side.
            </div>
          ) : (
            <div className={styles.compareGrid}>
              {compareServices.map((svc: any) => {
                const isBestPrice = lowestPrice !== null && svc.startingPrice === lowestPrice;
                const slaDays = parseInt(String(svc.deliveryDays || ''), 10);
                const isFastestSla = fastestSla !== null && Number.isFinite(slaDays) && slaDays === fastestSla;
                const inCart = cart.some((c) => c.serviceId === svc.id);
                return (
                  <div key={svc.id} className={styles.compareCard}>
                    <button
                      type="button"
                      className={styles.compareRemove}
                      onClick={() => toggleCompare(svc.id)}
                      aria-label={`Remove ${svc.name} from compare`}
                    >
                      <X size={13} />
                    </button>

                    <div className={styles.compareTopMedia}>
                      <Image
                        src={svc.image || '/assets/images/website-dev.jpg'}
                        alt={svc.name}
                        width={64}
                        height={48}
                        className={styles.compareThumb}
                        unoptimized
                      />
                      <div className={styles.compareTopText}>
                        <span className={styles.compareGroupBadge}>
                          {String(svc.group || 'service').replace('-', ' ')}
                        </span>
                        <div className={styles.compareName}>{svc.name}</div>
                      </div>
                    </div>

                    <div className={styles.comparePriceRow}>
                      <div className={styles.comparePrice}>
                        {svc.startingPrice
                          ? `₹${svc.startingPrice.toLocaleString('en-IN')}${svc.priceType === 'monthly' ? '/mo' : svc.priceType === 'weekly' ? '/wk' : ''}`
                          : 'Custom Quote'}
                      </div>
                      <div className={styles.compareWinnerBadges}>
                        {isBestPrice && (
                          <span className={styles.winnerPill}>
                            <Award size={11} /> Best Price
                          </span>
                        )}
                        {isFastestSla && (
                          <span className={styles.winnerPillBlue}>
                            <Clock size={11} /> Fastest
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.compareMeta}>
                      <span><Clock size={12} /> {svc.deliveryDays ? `${svc.deliveryDays} Days SLA` : 'Flexible SLA'}</span>
                      <span>&bull;</span>
                      <span>ISO 9001:2015 Verified</span>
                    </div>

                    {Array.isArray(svc.technologiesUsed) && svc.technologiesUsed.length > 0 && (
                      <div className={styles.compareTechRow}>
                        {svc.technologiesUsed.slice(0, 4).map((tech: string, tIdx: number) => (
                          <span key={tIdx} className={styles.compareTechTag}>{tech}</span>
                        ))}
                      </div>
                    )}

                    {Array.isArray(svc.features) && svc.features.length > 0 && (
                      <ul className={styles.compareFeatures}>
                        {svc.features.slice(0, 5).map((feat: string, fIdx: number) => (
                          <li key={fIdx}>
                            <Check size={12} className={styles.compareFeatIcon} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {Array.isArray(svc.notIncluded) && svc.notIncluded.length > 0 && (
                      <div className={styles.compareExcluded}>
                        Excludes: {svc.notIncluded.slice(0, 2).join(', ')}
                      </div>
                    )}

                    <div className={styles.compareActionRow}>
                      <button
                        type="button"
                        onClick={() => handleCompareAddToCart(svc)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 11.5 }}
                      >
                        <ShoppingBag size={13} />
                        {inCart ? 'View Cart' : 'Add to Cart'}
                      </button>
                      <Link
                        href={svc.href || '/'}
                        onClick={closeCompare}
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'center', fontSize: 11.5 }}
                      >
                        Details <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 3 - compareServices.length) }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className={styles.compareCardEmpty}>
                  <span className={styles.compareEmptyPlus}>+</span>
                  <span>Select another service from catalog to compare specs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
