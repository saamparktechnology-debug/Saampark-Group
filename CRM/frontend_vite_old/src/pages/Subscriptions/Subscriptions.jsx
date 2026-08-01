import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_SUBSCRIPTIONS = [
  { id: 'SUB-001', client: 'Acme Corp', plan: 'Premium Yearly', nextBilling: '2027-01-01', status: 'Active' },
  { id: 'SUB-002', client: 'TechNova', plan: 'Basic Monthly', nextBilling: '2026-09-01', status: 'Past Due' }
];

const Subscriptions = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span className="text-secondary">{val}</span> },
    { key: 'client', label: 'Client', render: (val) => <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span> },
    { key: 'plan', label: 'Plan' },
    { key: 'nextBilling', label: 'Next Billing' },
    { key: 'status', label: 'Status', render: (val) => (
      <span className={`badge-pill ${val === 'Active' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
        {val}
      </span>
    )}
  ];

  const modalFields = [
    { name: 'client', label: 'Client', type: 'select', options: ['Acme Corp', 'TechNova'] },
    { name: 'plan', label: 'Plan', type: 'select', options: ['Basic Monthly', 'Premium Yearly'] },
    { name: 'nextBilling', label: 'Next Billing', type: 'date' }
  ];

  return (
    <div className="subscriptions-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Subscriptions" 
        columns={columns} 
        data={MOCK_SUBSCRIPTIONS} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Subscription" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Subscriptions;
