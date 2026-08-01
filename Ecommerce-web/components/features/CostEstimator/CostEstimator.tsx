'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, MessageSquare, ChevronRight, MessageCircle, Info, Sparkles } from 'lucide-react';
import styles from './CostEstimator.module.css';

type ProjectType = 'web' | 'app' | 'ads' | 'legal';

export function CostEstimator() {
  const [projectType, setProjectType] = useState<ProjectType>('web');
  const [estimate, setEstimate] = useState({ price: 0, days: 0 });

  // Web States
  const [webPages, setWebPages] = useState(1);
  const [webAdmin, setWebAdmin] = useState(false);
  const [webPayment, setWebPayment] = useState(false);
  const [webDatabase, setWebDatabase] = useState(false);
  const [webSEO, setWebSEO] = useState(false);

  // App States
  const [appPlatform, setAppPlatform] = useState<'android' | 'ios' | 'hybrid'>('hybrid');
  const [appAuth, setAppAuth] = useState(false);
  const [appPayment, setAppPayment] = useState(false);
  const [appPush, setAppPush] = useState(false);

  // Ads States
  const [adsPlatform, setAdsPlatform] = useState<'meta' | 'google'>('meta');
  const [adsDuration, setAdsDuration] = useState<'weekly' | 'monthly'>('weekly');
  const [adsPremium, setAdsPremium] = useState(false);

  // Legal States
  const [legalSelection, setLegalSelection] = useState<'pvtltd' | 'gst' | 'msme'>('pvtltd');

  // Calculate Estimations
  useEffect(() => {
    let price = 0;
    let days = 0;

    if (projectType === 'web') {
      // Base pricing
      if (webPages === 1) {
        price = 1499; // discounted base
        days = 5;
      } else {
        price = 3999 + (webPages - 2) * 500; // static base + page cost
        days = 7 + Math.ceil(webPages / 2);
      }

      if (webAdmin) {
        price += 4000;
        days += 5;
      }
      if (webDatabase) {
        price += 3000;
        days += 4;
      }
      if (webPayment) {
        price += 2000;
        days += 3;
      }
      if (webSEO) {
        price += 1000;
      }
    } else if (projectType === 'app') {
      // Custom Apps
      price = appPlatform === 'hybrid' ? 35000 : 25000;
      days = appPlatform === 'hybrid' ? 35 : 25;

      if (appAuth) {
        price += 4500;
        days += 4;
      }
      if (appPayment) {
        price += 3500;
        days += 3;
      }
      if (appPush) {
        price += 2500;
        days += 2;
      }
    } else if (projectType === 'ads') {
      // Marketing
      if (adsPlatform === 'meta') {
        price = adsDuration === 'weekly' ? 499 : 1800; // weekly vs monthly
        days = adsDuration === 'weekly' ? 7 : 30;
        if (adsPremium) {
          price = 8999; // Premium Meta package
        }
      } else {
        price = adsDuration === 'weekly' ? 899 : 3200; // google ads pricing
        days = adsDuration === 'weekly' ? 7 : 30;
        if (adsPremium) {
          price = 18999; // Premium Google Package
        }
      }
    } else if (projectType === 'legal') {
      // Legal services
      if (legalSelection === 'pvtltd') {
        price = 5999;
        days = 15;
      } else if (legalSelection === 'gst') {
        price = 1499;
        days = 7;
      } else if (legalSelection === 'msme') {
        price = 799;
        days = 4;
      }
    }

    setEstimate({ price, days });
  }, [
    projectType,
    webPages, webAdmin, webPayment, webDatabase, webSEO,
    appPlatform, appAuth, appPayment, appPush,
    adsPlatform, adsDuration, adsPremium,
    legalSelection
  ]);

  const handleEstimateWA = () => {
    let msg = `Hello Saampark Group,\n\nI used your online calculator and want to order services:\n\n`;
    
    if (projectType === 'web') {
      msg += `💻 *Service:* Web Development\n`;
      msg += `📄 *Pages:* ${webPages}\n`;
      msg += `⚙️ *Features Selected:* \n`;
      if (webAdmin) msg += ` - Admin Panel / CMS\n`;
      if (webDatabase) msg += ` - Custom Database Management\n`;
      if (webPayment) msg += ` - Payment Gateway Integration\n`;
      if (webSEO) msg += ` - Advanced On-Page SEO Setup\n`;
    } else if (projectType === 'app') {
      msg += `📱 *Service:* Mobile App Development\n`;
      msg += `📱 *Platform:* ${appPlatform.toUpperCase()}\n`;
      msg += `⚙️ *Features Selected:* \n`;
      if (appAuth) msg += ` - User Authentication & Profiles\n`;
      if (appPayment) msg += ` - Payment Gateway Setup\n`;
      if (appPush) msg += ` - Dynamic Push Notifications\n`;
    } else if (projectType === 'ads') {
      msg += `📢 *Service:* Managed Ads Campaign\n`;
      msg += `🎯 *Platform:* ${adsPlatform === 'meta' ? 'Meta (FB & IG)' : 'Google Search & Display'}\n`;
      msg += `⏱️ *Duration:* ${adsDuration.toUpperCase()}\n`;
      msg += `💎 *Plan:* ${adsPremium ? 'Premium Tier Campaign' : 'Standard Tier Campaign'}\n`;
    } else if (projectType === 'legal') {
      msg += `💼 *Service:* Business Incorporation / Registration\n`;
      msg += `📋 *Selection:* ${
        legalSelection === 'pvtltd' ? 'Pvt. Ltd. Company Incorporation' : 
        legalSelection === 'gst' ? 'GST Tax Registration' : 'MSME (Udyam) Registration'
      }\n`;
    }

    msg += `\n*Estimated Project Cost:* ₹${estimate.price.toLocaleString('en-IN')}\n`;
    msg += `*Estimated Delivery Timeline:* ${estimate.days} Days\n\n`;
    msg += `Please guide me on how to proceed.`;

    const phone = projectType === 'web' || projectType === 'app' ? '919091518567' : '918170082678';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={styles.estimatorCard}>
      {/* Title */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Calculator size={20} className={styles.calcIcon} />
          <h3>Project Cost & Timeline Estimator</h3>
        </div>
        <p>Select your customized features to receive an instant direct agency quote estimate.</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${projectType === 'web' ? styles.activeTab : ''}`}
          onClick={() => setProjectType('web')}
        >
          🌐 Websites
        </button>
        <button 
          className={`${styles.tabBtn} ${projectType === 'app' ? styles.activeTab : ''}`}
          onClick={() => setProjectType('app')}
        >
          📱 Mobile Apps
        </button>
        <button 
          className={`${styles.tabBtn} ${projectType === 'ads' ? styles.activeTab : ''}`}
          onClick={() => setProjectType('ads')}
        >
          📢 Managed Ads
        </button>
        <button 
          className={`${styles.tabBtn} ${projectType === 'legal' ? styles.activeTab : ''}`}
          onClick={() => setProjectType('legal')}
        >
          💼 Business Registrations
        </button>
      </div>

      {/* Configurations panel */}
      <div className={styles.configArea}>
        {projectType === 'web' && (
          <div className={styles.configGroup}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabel}>
                <span>Number of Pages</span>
                <strong>{webPages} Page{webPages > 1 ? 's' : ''}</strong>
              </div>
              <input 
                type="range" 
                min="1" 
                max="15" 
                value={webPages} 
                onChange={(e) => setWebPages(Number(e.target.value))} 
                className={styles.slider}
              />
            </div>

            <div className={styles.checkboxes}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={webAdmin} onChange={(e) => setWebAdmin(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>Admin Dashboard / CMS CMS (STR Panel)</span>
                  <span className={styles.checkDesc}>Manage site text/media in one click</span>
                </div>
              </label>

              <label className={styles.checkLabel}>
                <input type="checkbox" checked={webDatabase} onChange={(e) => setWebDatabase(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>Database Integration (MySQL/Firestore)</span>
                  <span className={styles.checkDesc}>Store user accounts, inventory or submissions</span>
                </div>
              </label>

              <label className={styles.checkLabel}>
                <input type="checkbox" checked={webPayment} onChange={(e) => setWebPayment(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>Payment Gateway (Razorpay/PayU)</span>
                  <span className={styles.checkDesc}>Accept direct online transactions safely</span>
                </div>
              </label>

              <label className={styles.checkLabel}>
                <input type="checkbox" checked={webSEO} onChange={(e) => setWebSEO(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>Advanced On-Page SEO Optimization</span>
                  <span className={styles.checkDesc}>Sitemaps, meta schemas, Google analytics</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {projectType === 'app' && (
          <div className={styles.configGroup}>
            <div className={styles.radioGroup}>
              <span className={styles.radioTitle}>Target Platform</span>
              <div className={styles.radios}>
                <label className={styles.radioBtn}>
                  <input type="radio" name="appPlatform" checked={appPlatform === 'hybrid'} onChange={() => setAppPlatform('hybrid')} />
                  <span>Cross-Platform (Flutter Android + iOS)</span>
                </label>
                <label className={styles.radioBtn}>
                  <input type="radio" name="appPlatform" checked={appPlatform === 'android'} onChange={() => setAppPlatform('android')} />
                  <span>Native Android Only (Kotlin)</span>
                </label>
              </div>
            </div>

            <div className={styles.checkboxes}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={appAuth} onChange={(e) => setAppAuth(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>User Profiles & Auth (Firebase / OTP)</span>
                  <span className={styles.checkDesc}>Allow customer profile creations and OTP logins</span>
                </div>
              </label>

              <label className={styles.checkLabel}>
                <input type="checkbox" checked={appPayment} onChange={(e) => setAppPayment(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>Razorpay checkout integration</span>
                  <span className={styles.checkDesc}>Receive credit cards, UPI, wallets directly in-app</span>
                </div>
              </label>

              <label className={styles.checkLabel}>
                <input type="checkbox" checked={appPush} onChange={(e) => setAppPush(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>Dynamic Push Notification Service</span>
                  <span className={styles.checkDesc}>Deliver immediate promotional marketing alerts</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {projectType === 'ads' && (
          <div className={styles.configGroup}>
            <div className={styles.radioGroup}>
              <span className={styles.radioTitle}>Campaign Network</span>
              <div className={styles.radios}>
                <label className={styles.radioBtn}>
                  <input type="radio" name="adsPlatform" checked={adsPlatform === 'meta'} onChange={() => setAdsPlatform('meta')} />
                  <span>Meta (Facebook & Instagram Ads)</span>
                </label>
                <label className={styles.radioBtn}>
                  <input type="radio" name="adsPlatform" checked={adsPlatform === 'google'} onChange={() => setAdsPlatform('google')} />
                  <span>Google Ads (Search & Maps Keywords)</span>
                </label>
              </div>
            </div>

            <div className={styles.radioGroup}>
              <span className={styles.radioTitle}>Campaign Duration</span>
              <div className={styles.radios}>
                <label className={styles.radioBtn}>
                  <input type="radio" name="adsDuration" checked={adsDuration === 'weekly'} onChange={() => setAdsDuration('weekly')} />
                  <span>Weekly managed trial package</span>
                </label>
                <label className={styles.radioBtn}>
                  <input type="radio" name="adsDuration" checked={adsDuration === 'monthly'} onChange={() => setAdsDuration('monthly')} />
                  <span>Monthly optimized campaign</span>
                </label>
              </div>
            </div>

            <div className={styles.checkboxes}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={adsPremium} onChange={(e) => setAdsPremium(e.target.checked)} />
                <div className={styles.checkInfo}>
                  <span className={styles.checkName}>💎 Premium Tier Package Upgrade</span>
                  <span className={styles.checkDesc}>Includes custom AI promotional videos, reels & 1M guaranteed impressions</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {projectType === 'legal' && (
          <div className={styles.configGroup}>
            <div className={styles.radioGroup}>
              <span className={styles.radioTitle}>Business Registration Type</span>
              <div className={styles.radios}>
                <label className={styles.radioBtn}>
                  <input type="radio" name="legalSelection" checked={legalSelection === 'pvtltd'} onChange={() => setLegalSelection('pvtltd')} />
                  <span>Pvt. Ltd. Incorporation (Company registration + DIN + DSC)</span>
                </label>
                <label className={styles.radioBtn}>
                  <input type="radio" name="legalSelection" checked={legalSelection === 'gst'} onChange={() => setLegalSelection('gst')} />
                  <span>GST Tax Registration & portal setup</span>
                </label>
                <label className={styles.radioBtn}>
                  <input type="radio" name="legalSelection" checked={legalSelection === 'msme'} onChange={() => setLegalSelection('msme')} />
                  <span>MSME Udyam Certification (Govt subsidies access)</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estimations Result Display */}
      <div className={styles.resultBox}>
        <div className={styles.priceSection}>
          <div className={styles.resultLabel}>Estimated Project Cost:</div>
          <div className={styles.resultPrice}>
            ₹{estimate.price.toLocaleString('en-IN')}
          </div>
        </div>
        <div className={styles.timelineSection}>
          <div className={styles.resultLabel}>Delivery Timeline:</div>
          <div className={styles.resultDays}>
            {estimate.days} Days
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button 
        onClick={handleEstimateWA} 
        className={`btn btn-primary btn-lg ${styles.estimateCta}`}
      >
        <MessageCircle size={20} />
        <span>Request Customized Quote on WhatsApp</span>
      </button>

      <div className={styles.disclaimer}>
        <Info size={12} />
        <span>ISO 9001:2015 certified project processing. Direct developer connection, zero agency commissions.</span>
      </div>
    </div>
  );
}
