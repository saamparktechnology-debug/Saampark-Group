import React from 'react';

const KnowledgeBase = () => (
  <div className="page-container">
    <div className="page-header">
      <h2 className="page-title">Knowledge Base</h2>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
      <div style={{ background: '#fff', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }}>
        <h3 style={{ color: 'var(--color-primary)' }}>Getting Started</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>5 Articles</p>
      </div>
      <div style={{ background: '#fff', padding: '20px', border: '1px solid var(--border-light)', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }}>
        <h3 style={{ color: 'var(--color-primary)' }}>Billing</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>2 Articles</p>
      </div>
    </div>
  </div>
);

export default KnowledgeBase;
