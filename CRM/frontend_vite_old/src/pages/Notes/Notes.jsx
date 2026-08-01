import React from 'react';
import { Plus } from 'lucide-react';
import './Notes.css';

const Notes = () => (
  <div className="notes-page">
    <div className="page-header">
      <h2 className="page-title">Notes</h2>
      <button className="btn-primary"><Plus size={16} /> Add Note</button>
    </div>
    <div className="notes-grid">
      <div className="note-card bg-yellow">
        <h4>Client Meeting</h4>
        <p>Discussed the new requirements for Q3 marketing materials. Need to follow up with John.</p>
        <div className="note-meta">Added: Today</div>
      </div>
      <div className="note-card bg-blue">
        <h4>Server Passwords</h4>
        <p>Dev DB: admin / pass123<br/>Staging: stage / demo22</p>
        <div className="note-meta">Added: Yesterday</div>
      </div>
    </div>
  </div>
);

export default Notes;
