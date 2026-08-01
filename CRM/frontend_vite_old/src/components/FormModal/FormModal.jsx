import React from 'react';
import { X } from 'lucide-react';
import './FormModal.css';

const FormModal = ({ isOpen, onClose, title, fields, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content aurora-modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="modal-body">
          {fields.map((field, idx) => (
            <div className="form-group row" key={idx}>
              <label className="col-form-label">{field.label}</label>
              <div className="form-input-container">
                {field.type === 'select' ? (
                  <select className="form-control aurora-input">
                    <option value="">Select {field.label}</option>
                    {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={field.type || 'text'} className="form-control aurora-input" placeholder={field.placeholder || field.label} />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default FormModal;
