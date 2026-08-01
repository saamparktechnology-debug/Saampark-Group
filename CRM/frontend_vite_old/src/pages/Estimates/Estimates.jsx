import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_ESTIMATES = [
  { id: 'EST-001', client: 'Acme Corp', date: '2026-08-01', amount: '$5,000.00', status: 'Sent' },
  { id: 'EST-002', client: 'TechNova', date: '2026-08-02', amount: '$12,500.00', status: 'Accepted' }
];

const Estimates = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'Estimate ID', render: (val) => <span className="text-secondary">{val}</span> },
    { key: 'client', label: 'Client', render: (val) => <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span> },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'status', label: 'Status', render: (val) => (
      <span className={`badge-pill ${val === 'Accepted' ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
        {val}
      </span>
    )}
  ];

  const modalFields = [
    { name: 'client', label: 'Client', type: 'select', options: ['Acme Corp', 'TechNova'] },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'amount', label: 'Amount', type: 'number' }
  ];

  return (
    <div className="estimates-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Estimates" 
        columns={columns} 
        data={MOCK_ESTIMATES} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Create Estimate" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Estimates;
