'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, ArrowRight, MessageCircle } from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import styles from './AIConsultant.module.css';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  cta?: { label: string; href: string };
}

const PRESETS = [
  { label: '🌐 Website Inquiry', query: 'I want to build a website' },
  { label: '📢 Run Ads / Marketing', query: 'How do you run Meta & Google ads?' },
  { label: '💼 Company Registration', query: 'I want to register a Pvt Ltd or GST' },
  { label: '📞 Talk to Support', query: 'What are your support numbers?' },
];

export function AIConsultant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your Saampark Group AI Consultant. How can I help you grow your business today? Choose a question below or type your inquiry.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getAIResponse = (text: string): Message => {
    const q = text.toLowerCase();
    
    if (q.includes('website') || q.includes('web') || q.includes('page') || q.includes('e-commerce') || q.includes('build')) {
      return {
        sender: 'ai',
        text: 'STR (Saampark Technology & Research) specializes in premium web engineering. We offer:\n\n• One Page Websites (₹1,499)\n• Static Company Profiles (₹3,999)\n• Dynamic Web Systems (₹11,999)\n• Full E-Commerce Stores (₹21,999)\n\nWe provide 100% responsive designs and hosting setup. Would you like to consult our lead tech expert on WhatsApp?',
        cta: { label: 'Connect with STR Tech', href: CONTACT.str.whatsapp1 },
      };
    }
    
    if (q.includes('ads') || q.includes('marketing') || q.includes('facebook') || q.includes('meta') || q.includes('google') || q.includes('promote')) {
      return {
        sender: 'ai',
        text: 'SCS (Saampark Consultancy Service) manages high-ROI digital campaigns starting at:\n\n• Social Media Page Control (₹499/mo)\n• Meta Ads Trial (₹499/wk)\n• Google Ads Trial (₹1,000/wk)\n• Google Business Profile local SEO (₹1,000/mo)\n\nWould you like to discuss ad budgets and target audience with our marketing team?',
        cta: { label: 'Connect with SCS Consultancy', href: CONTACT.scs.whatsapp },
      };
    }
    
    if (q.includes('registration') || q.includes('pvt') || q.includes('gst') || q.includes('msme') || q.includes('incorporation') || q.includes('legal') || q.includes('udyam')) {
      return {
        sender: 'ai',
        text: 'Our legal consultancy handles corporate incorporation and registrations:\n\n• Private Limited Registration (₹5,999)\n• GST Registration (CA-assisted)\n• MSME Udyam Certification & Tax Returns\n\nWould you like our CA assistant to help you prepare your document list?',
        cta: { label: 'Connect with CA Consultant', href: CONTACT.scs.whatsapp },
      };
    }

    if (q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('email') || q.includes('address') || q.includes('office') || q.includes('where')) {
      return {
        sender: 'ai',
        text: `Saampark Group Office details:\n\n📍 Address: ${CONTACT.group.address}\n\n📞 Tech Division (STR): ${CONTACT.str.phone1} / ${CONTACT.str.phone2}\n📞 Consultancy (SCS): ${CONTACT.scs.phone}\n\n📧 STR Email: ${CONTACT.str.email}\n📧 SCS Email: ${CONTACT.scs.email}`,
      };
    }

    return {
      sender: 'ai',
      text: 'I can guide you on choosing websites, mobile apps, marketing, or registrations. Tell me what service you are looking for, or write a direct question.',
    };
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
      const response = getAIResponse(text);
      setMessages(prev => [...prev, response]);
    }, 850);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button 
        className={styles.floatBtn} 
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <Bot size={24} className={styles.botIcon} />
        <span className={styles.glowingPulse} />
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <div className={styles.botHeaderIcon}>
                <Bot size={20} />
              </div>
              <div>
                <h4>Saampark Advisor</h4>
                <div className={styles.onlineBadge}>
                  <span className={styles.dot} />
                  <span>Online Assistant</span>
                </div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className={styles.messageArea}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.bubbleRow} ${msg.sender === 'user' ? styles.userRow : styles.aiRow}`}>
                <div className={styles.avatar}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={styles.bubble}>
                  <p className={styles.bubbleText}>{msg.text}</p>
                  
                  {msg.cta && (
                    <a 
                      href={msg.cta.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.ctaBtn}
                    >
                      <MessageCircle size={14} />
                      <span>{msg.cta.label}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className={`${styles.bubbleRow} ${styles.aiRow}`}>
                <div className={styles.avatar}>
                  <Bot size={14} />
                </div>
                <div className={styles.bubble}>
                  <div className={styles.typingIndicator}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Preset Buttons */}
          {messages.length === 1 && (
            <div className={styles.presets}>
              {PRESETS.map((preset, idx) => (
                <button 
                  key={idx} 
                  className={styles.presetBtn}
                  onClick={() => handleSend(preset.query)}
                >
                  <span>{preset.label}</span>
                  <ArrowRight size={12} />
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
            className={styles.inputForm}
          >
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.chatInput}
            />
            <button type="submit" className={styles.sendBtn} aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
