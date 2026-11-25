'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Trash2, ShoppingBag, Bookmark, ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useOrderStore } from '@/lib/store/orderStore';
import { useAuthStore } from '@/lib/store/authStore';
import { allServices, getServiceById } from '@/lib/data/services';
import styles from './CommerceDrawers.module.css';

export function CommerceDrawers() {
  const {
    cart, removeFromCart, clearCart,
    wishlistIds, toggleWishlist,
    compareIds, toggleCompare, clearCompare
  } = useCommerceStore();
  
  const {
    cartOpen, closeCart,
    wishlistOpen, closeWishlist,
    compareOpen, closeCompare,
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

  const cartTotal = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const cartHasQuote = cart.some(item => !item.price);

  const resolveService = (id: string) => getServiceById(id) || crmServiceMap[id] || null;
  const wishlistServices = wishlistIds.map(resolveService).filter(Boolean);
  const compareServices = compareIds.map(resolveService).filter(Boolean);

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
                    <div className={styles.itemMeta}>Qty: {item.quantity}</div>
                    <div className={styles.itemPrice}>
                      {item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'Custom Quote'}
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Subtotal:</span>
              <span className={styles.totalPrice}>
                {cartTotal > 0 ? `₹${cartTotal.toLocaleString('en-IN')}` : ''}
                {cartHasQuote && (cartTotal > 0 ? ' + Quotes' : 'To be quoted')}
              </span>
            </div>

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

      {/* ── Compare Drawer (Bottom Sheet) ── */}
      <div className={`${styles.compareDrawer} ${compareOpen ? styles.compareOpen : ''}`}>
        <div className={styles.compareHeader}>
          <h3>Compare Solutions ({compareServices.length}/3)</h3>
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
              Select up to 3 services using the Compare toggle on any card to compare pricing, delivery SLA, and features side-by-side.
            </div>
          ) : (
            <div className={styles.compareGrid}>
              {compareServices.map((svc: any) => (
                <div key={svc.id} className={styles.compareCard}>
                  <button
                    type="button"
                    className={styles.compareRemove}
                    onClick={() => toggleCompare(svc.id)}
                    aria-label={`Remove ${svc.name} from compare`}
                  >
                    <X size={13} />
                  </button>
                  <div className={styles.compareName}>{svc.name}</div>
                  <div className={styles.comparePrice}>
                    {svc.startingPrice
                      ? `₹${svc.startingPrice.toLocaleString('en-IN')}${svc.priceType === 'monthly' ? '/mo' : svc.priceType === 'weekly' ? '/wk' : ''}`
                      : 'Custom Quote'}
                  </div>
                  <div className={styles.compareMeta}>
                    <span>{svc.deliveryDays ? `${svc.deliveryDays} Days SLA` : 'Flexible SLA'}</span>
                    <span>&bull;</span>
                    <span style={{ textTransform: 'capitalize' }}>
                      {String(svc.group || 'service').replace('-', ' ')}
                    </span>
                  </div>
                  {Array.isArray(svc.features) && svc.features.length > 0 && (
                    <ul className={styles.compareFeatures}>
                      {svc.features.slice(0, 3).map((feat: string, fIdx: number) => (
                        <li key={fIdx}>{feat}</li>
                      ))}
                    </ul>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                    <Link
                      href={svc.href || '/'}
                      onClick={closeCompare}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    >
                      View Details <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - compareServices.length) }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className={styles.compareCardEmpty}>
                  <span className={styles.compareEmptyPlus}>+</span>
                  <span>Select another service to compare</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
