'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Trash2, ShoppingBag, Bookmark, ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { useCommerceStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useOrderStore } from '@/lib/store/orderStore';
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

  const anyOpen = cartOpen || wishlistOpen || compareOpen;

  useEffect(() => {
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyOpen]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const cartHasQuote = cart.some(item => !item.price);

  const wishlistServices = wishlistIds.map(id => getServiceById(id)).filter(Boolean);
  const compareServices = compareIds.map(id => getServiceById(id)).filter(Boolean);

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
                closeCart();
                openCheckout();
              }}
              style={{ width: '100%', justifyContent: 'center', marginBottom: 8, gap: 6, fontWeight: 700 }}
            >
              <ShoppingBag size={18} /> Proceed to Official Checkout →
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
    </>
  );
}
