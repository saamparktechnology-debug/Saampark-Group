import React from 'react';
import './Sales.css';

const Sales = () => {
  return (
    <div className="sales-page">
      <div className="page-header">
        <h2 className="page-title">Sales Overview</h2>
        <button className="btn-primary">Create Invoice</button>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">💰</div>
        <h3>No Invoices Yet</h3>
        <p>Create your first invoice to get paid by your clients.</p>
        <button className="btn-primary mt-2">Create Invoice</button>
      </div>
    </div>
  );
};

export default Sales;
