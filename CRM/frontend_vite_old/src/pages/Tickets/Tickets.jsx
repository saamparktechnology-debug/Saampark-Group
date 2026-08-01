import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_TICKETS = [
  { id: 'TKT-101', title: 'Server down', client: 'Acme Corp', status: 'New' },
  { id: 'TKT-102', title: 'Login issue', client: 'TechNova', status: 'In Progress' }
];

const Tickets = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'Ticket ID', render: (val) => <span className="text-secondary">{val}</span> },
    { key: 'title', label: 'Title', render: (val) => <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span> },
    { key: 'client', label: 'Client' },
    { key: 'status', label: 'Status', render: (val) => (
      <span className={`badge-pill ${val === 'New' ? 'bg-danger text-white' : 'bg-primary text-white'}`}>
        {val}
      </span>
    )}
  ];

  const modalFields = [
    { name: 'title', label: 'Ticket Title', type: 'text' },
    { name: 'client', label: 'Client', type: 'select', options: ['Acme Corp', 'TechNova'] },
    { name: 'status', label: 'Status', type: 'select', options: ['New', 'In Progress', 'Resolved'] }
  ];

  return (
    <div className="tickets-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Tickets" 
        columns={columns} 
        data={MOCK_TICKETS} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Ticket" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Tickets;
