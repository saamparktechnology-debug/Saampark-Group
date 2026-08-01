import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import './DataTable.css';

const DataTable = ({ title, columns, data, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="datatable-container">
      <div className="datatable-header">
        <h2 className="datatable-title">{title}</h2>
        <div className="datatable-actions">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn-secondary">
            <Filter size={16} /> Filter
          </button>
          {onAdd && (
            <button className="btn-primary" onClick={onAdd}>
              Add {title}
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="aurora-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.align === 'right' ? 'text-right' : ''}>
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={col.align === 'right' ? 'text-right' : ''}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="text-right">
                    {onEdit && (
                      <button className="icon-btn-action" onClick={() => onEdit(row)}>
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button className="icon-btn-action text-danger" onClick={() => onDelete(row)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="empty-state">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
