import React, { useState } from 'react';
import DataTable from '../../components/DataTable/DataTable';
import FormModal from '../../components/FormModal/FormModal';

const MOCK_TASKS = [
  { id: 1, title: 'Fix navigation bar responsiveness', project: 'Website Redesign', priority: 'High', status: 'To Do', dueDate: 'Today' },
  { id: 2, title: 'Database migration script', project: 'Backend API', priority: 'Critical', status: 'In Progress', dueDate: 'Tomorrow' },
  { id: 3, title: 'Update user avatars', project: 'Mobile App Dev', priority: 'Medium', status: 'Review', dueDate: '2026-08-10' },
  { id: 4, title: 'Write documentation', project: 'SEO Optimization', priority: 'Low', status: 'Done', dueDate: '2026-08-01' },
];

const getPriorityColor = (priority) => {
  switch(priority) {
    case 'Critical': return '#F43F5E';
    case 'High': return '#F59E0B';
    case 'Medium': return '#3B82F6';
    case 'Low': return '#10B981';
    default: return '#64748b';
  }
};

const Tasks = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columns = [
    { key: 'title', label: 'Task Title', render: (val, row) => (
      <span style={{ textDecoration: row.status === 'Done' ? 'line-through' : 'none', color: row.status === 'Done' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
        {val}
      </span>
    )},
    { key: 'project', label: 'Project', render: (val) => <span style={{ color: 'var(--color-primary)' }}>{val}</span> },
    { key: 'status', label: 'Status', render: (val) => (
      <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.8rem' }}>{val}</span>
    )},
    { key: 'priority', label: 'Priority', render: (val) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPriorityColor(val), boxShadow: `0 0 10px ${getPriorityColor(val)}` }}></div>
        {val}
      </div>
    )},
    { key: 'dueDate', label: 'Due Date', render: (val) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{val}</span> }
  ];

  const modalFields = [
    { name: 'title', label: 'Task Title', type: 'text' },
    { name: 'project', label: 'Project', type: 'select', options: ['Website Redesign', 'Backend API', 'Mobile App Dev'] },
    { name: 'priority', label: 'Priority', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
    { name: 'dueDate', label: 'Due Date', type: 'date' }
  ];

  return (
    <div className="tasks-page" style={{ animation: 'fadeIn var(--transition-normal)' }}>
      <DataTable 
        title="Tasks" 
        columns={columns} 
        data={MOCK_TASKS} 
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />

      <FormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Task" 
        fields={modalFields}
        onSubmit={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default Tasks;
