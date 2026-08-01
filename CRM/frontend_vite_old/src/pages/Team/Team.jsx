import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_TEAM = [
  { id: 1, name: 'John Doe', jobTitle: 'Admin', email: 'john@example.com', phone: '123-456-7890' },
  { id: 2, name: 'Jane Smith', jobTitle: 'Developer', email: 'jane@example.com', phone: '123-456-7891' }
];

const Team = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'name', label: 'Name', render: (val) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>
          {val.charAt(0)}
        </div>
        <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span>
      </div>
    )},
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' }
  ];

  const modalFields = [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'jobTitle', label: 'Job Title', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'text' }
  ];

  return (
    <div className="team-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Team Members" 
        columns={columns} 
        data={MOCK_TEAM} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Team Member" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Team;
