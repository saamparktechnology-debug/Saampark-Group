'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import styles from './ContactForm.module.css';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'website',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', service: 'website', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (status === 'success') {
    return (
      <div className={styles.successState}>
        <CheckCircle size={48} className={styles.successIcon} />
        <h3>Message Sent Successfully!</h3>
        <p>Our experts will get back to you shortly.</p>
        <button className="btn btn-primary" onClick={() => setStatus('idle')}>
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label>Full Name *</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Email Address *</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@company.com" />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Phone Number *</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Interested In</label>
          <select name="service" value={formData.service} onChange={handleChange}>
            <option value="website">Website Development</option>
            <option value="app">Mobile App Development</option>
            <option value="software">Software & ERP</option>
            <option value="marketing">Digital Marketing & Ads</option>
            <option value="video">AI Video Creation</option>
            <option value="legal">Company & GST Registration</option>
            <option value="other">Other Inquiry</option>
          </select>
        </div>
      </div>
      
      <div className={styles.inputGroup}>
        <label>Message *</label>
        <textarea required name="message" value={formData.message} onChange={handleChange} rows={5} placeholder="Tell us about your project requirements..." />
      </div>
      
      {status === 'error' && (
        <div className={styles.errorMsg}>Failed to send message. Please try again or contact us via WhatsApp.</div>
      )}
      
      <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'loading'} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
        {status === 'loading' ? <Loader2 className="spinner" size={20} /> : <><Send size={20} /> Send Message</>}
      </button>
    </form>
  );
}
