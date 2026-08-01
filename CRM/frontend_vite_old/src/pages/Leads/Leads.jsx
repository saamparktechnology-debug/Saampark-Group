import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import './Leads.css';

const COLUMNS = [
  { id: 'new', title: 'New', color: '#3B82F6' },
  { id: 'qualified', title: 'Qualified', color: '#10B981' },
  { id: 'discussion', title: 'Discussion', color: '#F59E0B' },
  { id: 'negotiation', title: 'Negotiation', color: '#8B5CF6' },
];

const MOCK_LEADS = [
  { id: 1, name: 'Tech Solutions Inc', column: 'new', contact: 'John Smith', value: '$15,000' },
  { id: 2, name: 'Alpha Retail', column: 'qualified', contact: 'Sarah Connor', value: '$25,000' },
  { id: 3, name: 'Omega Corp', column: 'discussion', contact: 'Bruce Wayne', value: '$100,000' },
  { id: 4, name: 'Local Startup', column: 'negotiation', contact: 'Clark Kent', value: '$5,000' },
  { id: 5, name: 'Beta Logistics', column: 'new', contact: 'Peter Parker', value: '$8,000' },
];

const Leads = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="leads-page">
      <div className="page-header">
        <h2 className="page-title">Leads Board</h2>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => (
          <div key={col.id} className="kanban-column">
            <div className="column-header" style={{ borderTopColor: col.color }}>
              <h3>{col.title} <span className="task-count">
                {MOCK_LEADS.filter(l => l.column === col.id).length}
              </span></h3>
              <button className="icon-btn"><MoreHorizontal size={18} /></button>
            </div>
            
            <div className="column-content">
              {MOCK_LEADS.filter(l => l.column === col.id).map(lead => (
                <div key={lead.id} className="task-card">
                  <h4 className="task-title">{lead.name}</h4>
                  <div className="task-footer mt-2">
                    <span className="text-sm text-secondary">{lead.contact}</span>
                    <span className="font-medium text-success">{lead.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Lead</h3>
              <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group row">
                <label className="col-form-label">Company name</label>
                <div className="form-input-container">
                  <input type="text" className="form-control" placeholder="Company name" autoFocus />
                </div>
              </div>
              <div className="form-group row">
                <label className="col-form-label">Lead Value</label>
                <div className="form-input-container">
                  <input type="text" className="form-control" placeholder="e.g. $10,000" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Close</button>
              <button className="btn-primary">Save Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
