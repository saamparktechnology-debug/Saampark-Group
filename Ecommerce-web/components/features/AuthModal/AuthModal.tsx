'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import styles from './AuthModal.module.css';

export function AuthModal() {
  const { authModalOpen, closeAuthModal, login } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!authModalOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate database trip
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        login(
          formData.email,
          tab === 'signup' ? formData.name : undefined,
          tab === 'signup' ? formData.phone : undefined
        );
        setSuccess(false);
        setFormData({ name: '', email: '', phone: '', password: '' });
      }, 800);
    }, 1000);
  };

  return (
    <div className={styles.overlay} onClick={closeAuthModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close modal">
          <X size={20} />
        </button>

        {success ? (
          <div className={styles.successScreen}>
            <CheckCircle size={48} className={styles.successIcon} />
            <h3>{tab === 'login' ? 'Welcome Back!' : 'Account Created!'}</h3>
            <p>Directing you to your dashboard session...</p>
          </div>
        ) : (
          <>
            {/* Header Tabs */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabBtn} ${tab === 'login' ? styles.activeTab : ''}`}
                onClick={() => setTab('login')}
              >
                Sign In
              </button>
              <button 
                className={`${styles.tabBtn} ${tab === 'signup' ? styles.activeTab : ''}`}
                onClick={() => setTab('signup')}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <h2 className={styles.title}>
                {tab === 'login' ? 'Access Client Portal' : 'Register with Saampark'}
              </h2>
              <p className={styles.subtitle}>
                {tab === 'login' ? 'Manage your active web and marketing subscriptions' : 'Start ordering development & digital consultant plans'}
              </p>

              {/* Form Fields */}
              <div className={styles.fields}>
                {tab === 'signup' && (
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.fieldIcon} />
                    <input
                      required
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.fieldIcon} />
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                {tab === 'signup' && (
                  <div className={styles.inputWrap}>
                    <Phone size={16} className={styles.fieldIcon} />
                    <input
                      required
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>
                )}

                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.fieldIcon} />
                  <input
                    required
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>

              {tab === 'login' && (
                <div className={styles.forgotRow}>
                  <button type="button" className={styles.forgotBtn}>Forgot Password?</button>
                </div>
              )}

              {/* Submit CTA */}
              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? 'Processing...' : (
                  <>
                    <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
