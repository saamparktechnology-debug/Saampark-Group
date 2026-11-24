'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
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
  const { authModalOpen, authPromptMessage, closeAuthModal, setAuthenticatedUser } = useAuthStore();
  const { mergeOrders } = useOrderStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!authModalOpen) return null;

  const resetOtp = () => {
    setOtpSent(false);
    setOtpCode('');
    setError(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'register' && (!name.trim() || !phone.trim())) {
      setError('Please enter your full name and phone number before requesting OTP.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'otp',
          purpose: mode,
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Could not send verification OTP.');
      }
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload =
        mode === 'register'
          ? {
              action: 'login',
              name: name.trim(),
              businessName: businessName.trim(),
              phone: phone.trim(),
              email: email.trim(),
              password: password || 'Client@123',
              otp: otpCode.trim(),
            }
          : loginMethod === 'otp'
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
            name: name.trim() || email.split('@')[0],
            businessName: businessName.trim(),
            email: email.trim(),
            phone: phone.trim(),
          }
        );
        setSuccess(false);
        setOtpSent(false);
        setOtpCode('');
        setPassword('');
      }, 650);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const needsOtpFirst = mode === 'register' || loginMethod === 'otp';

  return (
    <div className={styles.overlay} onClick={closeAuthModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {success ? (
          <div className={styles.successScreen}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h3>{mode === 'register' ? 'Account Verified & Created' : 'Signed In Successfully'}</h3>
            <p>Continuing to your cart and order details...</p>
          </div>
        ) : (
          <>
            {/* Top Mode Switcher: Sign In vs Create Account */}
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${mode === 'login' ? styles.activeTab : ''}`}
                onClick={() => {
                  setMode('login');
                  resetOtp();
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${mode === 'register' ? styles.activeTab : ''}`}
                onClick={() => {
                  setMode('register');
                  resetOtp();
                }}
              >
                Register Account
              </button>
            </div>

            {authPromptMessage && (
              <div className={styles.promptBanner}>
                <ShieldCheck size={15} style={{ flexShrink: 0 }} />
                <span>{authPromptMessage}</span>
              </div>
            )}

            <form
              onSubmit={needsOtpFirst && !otpSent ? handleSendOtp : handleAuthenticate}
              className={styles.form}
            >
              <h2 className={styles.title}>
                {mode === 'register' ? 'Create Your Client Account' : 'Access Saampark Client Portal'}
              </h2>
              <p className={styles.subtitle}>
                {mode === 'register'
                  ? 'Register once with Saampark Group email OTP verification to order services and manage GST invoices.'
                  : loginMethod === 'otp'
                  ? 'Enter your email to receive a 6-digit verification OTP from Saampark Group.'
                  : 'Sign in with your email and portal password.'}
              </p>

              {mode === 'login' && (
                <div className={styles.methodSwitchRow}>
                  <button
                    type="button"
                    className={`${styles.methodPill} ${loginMethod === 'otp' ? styles.methodPillActive : ''}`}
                    onClick={() => {
                      setLoginMethod('otp');
                      resetOtp();
                    }}
                  >
                    Email OTP (Recommended)
                  </button>
                  <button
                    type="button"
                    className={`${styles.methodPill} ${loginMethod === 'password' ? styles.methodPillActive : ''}`}
                    onClick={() => {
                      setLoginMethod('password');
                      resetOtp();
                    }}
                  >
                    Password
                  </button>
                </div>
              )}

              {error && (
                <div className={styles.errorBanner}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.fields}>
                {mode === 'register' && (
                  <>
                    <div className={styles.inputWrap}>
                      <User size={16} className={styles.fieldIcon} />
                      <input
                        required
                        type="text"
                        placeholder="Full Name *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={otpSent}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.inputWrap}>
                      <Building2 size={16} className={styles.fieldIcon} />
                      <input
                        type="text"
                        placeholder="Company / Brand Name (Optional)"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        disabled={otpSent}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.inputWrap}>
                      <Phone size={16} className={styles.fieldIcon} />
                      <input
                        required
                        type="tel"
                        placeholder="WhatsApp / Mobile Number *"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={otpSent}
                        className={styles.input}
                      />
                    </div>
                  </>
                )}

                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.fieldIcon} />
                  <input
                    required
                    type="email"
                    placeholder="Email Address *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={needsOtpFirst && otpSent}
                    className={styles.input}
                  />
                </div>

                {(mode === 'register' || loginMethod === 'password') && (
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.fieldIcon} />
                    <input
                      required={mode === 'login' && loginMethod === 'password'}
                      type="password"
                      placeholder={mode === 'register' ? 'Create Password (Optional)' : 'Account Password *'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={mode === 'register' && otpSent}
                      className={styles.input}
                    />
                  </div>
                )}

                {needsOtpFirst && otpSent && (
                  <>
                    <div className={styles.inputWrap}>
                      <KeyRound size={16} className={styles.fieldIcon} />
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-Digit Email OTP *"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.otpMetaRow}>
                      <span>Sent to {email}</span>
                      <button type="button" onClick={resetOtp} className={styles.changeEmailBtn}>
                        Change Email
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : needsOtpFirst && !otpSent ? (
                  <>
                    <span>Send OTP via Email</span>
                    <ArrowRight size={17} />
                  </>
                ) : (
                  <>
                    <span>{mode === 'register' ? 'Verify OTP & Register' : 'Verify & Sign In'}</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div className={styles.footerBadge}>
                <ShieldCheck size={13} />
                <span>Verified via Saampark Group Official Mail Server</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
