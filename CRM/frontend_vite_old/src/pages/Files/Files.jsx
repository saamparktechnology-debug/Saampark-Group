import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_FILES = [
  { id: 1, name: 'Project_Brief.pdf', size: '2.4 MB', uploadedBy: 'Jane Doe', date: '2026-08-01' },
  { id: 2, name: 'Logo_Assets.zip', size: '15.1 MB', uploadedBy: 'John Smith', date: '2026-08-02' }
];

const Files = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'name', label: 'File Name', render: (val) => <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span> },
    { key: 'size', label: 'Size' },
    { key: 'uploadedBy', label: 'Uploaded By' },
    { key: 'date', label: 'Date' }
  ];

  const modalFields = [
    { name: 'file', label: 'Upload File', type: 'file' },
    { name: 'description', label: 'Description', type: 'text' }
  ];

  return (
    <div className="files-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Files" 
        columns={columns} 
        data={MOCK_FILES} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Upload File" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Files;
