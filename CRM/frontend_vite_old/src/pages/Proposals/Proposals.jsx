import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_PROPOSALS = [
  { id: 'PRO-001', subject: 'Website Redesign', client: 'Acme Corp', date: '2026-08-01', status: 'Sent' },
  { id: 'PRO-002', subject: 'SEO Optimization', client: 'GlobalTech', date: '2026-08-03', status: 'Draft' }
];

const Proposals = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'Proposal ID', render: (val) => <span className="text-secondary">{val}</span> },
    { key: 'subject', label: 'Subject', render: (val) => <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span> },
    { key: 'client', label: 'Client' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (val) => (
      <span className={`badge-pill ${val === 'Sent' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
        {val}
      </span>
    )}
  ];

  const modalFields = [
    { name: 'subject', label: 'Subject', type: 'text' },
    { name: 'client', label: 'Client', type: 'select', options: ['Acme Corp', 'TechNova', 'GlobalTech'] },
    { name: 'date', label: 'Date', type: 'date' }
  ];

  return (
    <div className="proposals-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Proposals" 
        columns={columns} 
        data={MOCK_PROPOSALS} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Create Proposal" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Proposals;
