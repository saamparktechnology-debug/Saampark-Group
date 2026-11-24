'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useOrderStore } from '@/lib/store/orderStore';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const { authModalOpen, closeAuthModal, setAuthenticatedUser } = useAuthStore();
  const { mergeOrders } = useOrderStore();

  const [method, setMethod] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!authModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'otp', email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not send verification code.');
      }
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload =
        method === 'otp'
          ? { action: 'login', email: email.trim(), otp: otpCode.trim() }
          : { action: 'login', email: email.trim(), password };

      const res = await fetch('/api/auth/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Authentication failed.');
      }

      const userProfile = json.data?.user;
      const syncedOrders = json.data?.orders || [];

      if (Array.isArray(syncedOrders) && syncedOrders.length > 0) {
        mergeOrders(syncedOrders);
      }

      setSuccess(true);
      setTimeout(() => {
        setAuthenticatedUser(
          userProfile || {
            name: email.split('@')[0],
            email: email.trim(),
            phone: '',
          }
        );
        setSuccess(false);
        setOtpSent(false);
        setOtpCode('');
        setPassword('');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Sign-in failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={closeAuthModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {success ? (
          <div className={styles.successScreen}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h3>Authenticated Successfully</h3>
            <p>Syncing your orders, invoices, and billing profile...</p>
          </div>
        ) : (
          <>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${method === 'otp' ? styles.activeTab : ''}`}
                onClick={() => {
                  setMethod('otp');
                  setError(null);
                }}
              >
                Email Code (OTP)
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${method === 'password' ? styles.activeTab : ''}`}
                onClick={() => {
                  setMethod('password');
                  setError(null);
                }}
              >
                Email &amp; Password
              </button>
            </div>

            <form
              onSubmit={method === 'otp' && !otpSent ? handleSendOtp : handleLoginSubmit}
              className={styles.form}
            >
              <h2 className={styles.title}>Client Account &amp; Order Hub</h2>
              <p className={styles.subtitle}>
                {method === 'otp'
                  ? 'Sign in with a 6-digit verification code sent directly to your email.'
                  : 'Sign in with your CRM Client Portal email and password (default: Client@123).'}
              </p>

              {error && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.fields}>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.fieldIcon} />
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Client Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={method === 'otp' && otpSent}
                    className={styles.input}
                  />
                </div>

                {method === 'otp' && otpSent && (
                  <>
                    <div className={styles.inputWrap}>
                      <KeyRound size={16} className={styles.fieldIcon} />
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-Digit Email Code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      <span>Code sent to {email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Change Email
                      </button>
                    </div>
                  </>
                )}

                {method === 'password' && (
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.fieldIcon} />
                    <input
                      required
                      type="password"
                      name="password"
                      placeholder="Portal Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                )}
              </div>

              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : method === 'otp' && !otpSent ? (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={17} />
                  </>
                ) : (
                  <>
                    <span>Access My Orders &amp; Profile</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}
              >
                <ShieldCheck size={13} />
                <span>Synced with Saampark CRM Client Portal</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
