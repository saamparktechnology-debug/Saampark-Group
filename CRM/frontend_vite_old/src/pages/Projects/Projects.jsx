import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_PROJECTS = [
  { id: 'PRJ-001', name: 'Website Redesign', client: 'Acme Corp', deadline: '2026-09-15', status: 'In Progress', progress: 65 },
  { id: 'PRJ-002', name: 'Mobile App Dev', client: 'TechNova', deadline: '2026-10-01', status: 'Planning', progress: 15 },
  { id: 'PRJ-003', name: 'SEO Optimization', client: 'GlobalTech', deadline: '2026-08-30', status: 'Completed', progress: 100 },
];

const Projects = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span className="text-secondary">{val}</span> },
    { key: 'name', label: 'Project Name', render: (val) => <span className="font-medium text-primary cursor-pointer hover-underline">{val}</span> },
    { key: 'client', label: 'Client' },
    { key: 'deadline', label: 'Deadline' },
    { key: 'progress', label: 'Progress', render: (val) => (
      <div>
        <div style={{ width: '100px', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${val}%`, height: '100%', background: 'var(--color-primary)' }}></div>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>{val}%</span>
      </div>
    )},
    { key: 'status', label: 'Status', render: (val) => (
      <span className={`badge-pill ${val === 'Completed' ? 'bg-success text-white' : val === 'In Progress' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
        {val}
      </span>
    )}
  ];

  const modalFields = [
    { name: 'name', label: 'Project Name', type: 'text' },
    { name: 'client', label: 'Client', type: 'select', options: ['Acme Corp', 'TechNova', 'GlobalTech'] },
    { name: 'deadline', label: 'Deadline', type: 'date' }
  ];

  return (
    <div className="projects-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Projects" 
        columns={columns} 
        data={MOCK_PROJECTS} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Project" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Projects;
