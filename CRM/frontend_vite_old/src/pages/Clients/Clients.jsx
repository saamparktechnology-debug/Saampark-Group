import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_CLIENTS = [
  { id: 1, name: 'Acme Corp', primaryContact: 'Jane Doe', email: 'jane@acme.com', phone: '555-0101', groups: ['VIP'] },
  { id: 2, name: 'TechNova', primaryContact: 'John Smith', email: 'john@technova.io', phone: '555-0102', groups: ['Standard'] },
];

const Clients = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span className="text-secondary">{val}</span> },
    { key: 'name', label: 'Name', render: (val) => <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span> },
    { key: 'primaryContact', label: 'Primary Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'groups', label: 'Groups', render: (val) => (
      <span className={`badge-pill ${val[0] === 'VIP' ? 'bg-primary' : 'bg-secondary'}`}>
        {val[0]}
      </span>
    )}
  ];

  const modalFields = [
    { name: 'name', label: 'Client Name', type: 'text' },
    { name: 'contact', label: 'Primary Contact', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'text' }
  ];

  return (
    <div className="clients-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Clients" 
        columns={columns} 
        data={MOCK_CLIENTS} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Client" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Clients;
