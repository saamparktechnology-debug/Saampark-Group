import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { Clock, CheckSquare, Calendar, DollarSign, MoreHorizontal, Edit2, Plus } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const SummaryWidget = ({ title, value, icon, color, subtitle }) => (
  <div className="widget-card summary-widget">
    <div className="summary-icon" style={{ backgroundColor: `${color}20`, color: color }}>
      {icon}
    </div>
    <div className="summary-info">
      <div className="summary-value">{value}</div>
      <div className="summary-title">{title}</div>
      {subtitle && <div className="summary-subtitle">{subtitle}</div>}
    </div>
  </div>
);

export const ProjectsOverviewWidget = () => (
  <div className="widget-card">
    <div className="widget-header">
      <h4>Projects Overview</h4>
      <MoreHorizontal size={16} className="text-secondary" />
    </div>
    <div className="widget-body">
      <div className="projects-stats">
        <div className="stat-box">
          <span className="stat-num text-info">24</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-box">
          <span className="stat-num text-success">8</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-box">
          <span className="stat-num text-warning">0</span>
          <span className="stat-label">Hold</span>
        </div>
      </div>
      <div className="progress-section mt-4">
        <div className="progress-bar-container">
          <div className="progress-bar bg-success" style={{ width: '45%' }}></div>
        </div>
        <div className="progress-label text-center mt-2 text-sm">Progression 45%</div>
      </div>
    </div>
  </div>
);

export const InvoiceOverviewWidget = () => {
  const data = [
    { name: 'Jan', val: 4000 }, { name: 'Feb', val: 3000 }, { name: 'Mar', val: 2000 },
    { name: 'Apr', val: 2780 }, { name: 'May', val: 1890 }, { name: 'Jun', val: 2390 },
    { name: 'Jul', val: 3490 }
  ];
  return (
    <div className="widget-card">
      <div className="widget-header">
        <h4>Invoice Overview</h4>
        <MoreHorizontal size={16} className="text-secondary" />
      </div>
      <div className="widget-body flex-row">
        <div className="invoice-legend flex-1">
          <div className="legend-item"><span className="dot bg-info"></span> Total Invoiced <br/> $15,400</div>
          <div className="legend-item"><span className="dot bg-success"></span> Payments <br/> $12,200</div>
          <div className="legend-item"><span className="dot bg-danger"></span> Due <br/> $3,200</div>
        </div>
        <div className="chart-container flex-2" style={{ height: '150px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip cursor={{stroke: 'rgba(59, 130, 246, 0.2)'}} />
              <Area type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const IncomeExpensesWidget = () => {
  const data = [{ name: 'Income', value: 85 }, { name: 'Expenses', value: 15 }];
  return (
    <div className="widget-card">
      <div className="widget-header">
        <h4>Income vs expenses</h4>
        <MoreHorizontal size={16} className="text-secondary" />
      </div>
      <div className="widget-body flex-row align-center justify-center">
        <div className="chart-container" style={{ height: '140px', width: '140px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={60} outerRadius={65} dataKey="value" stroke="none">
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="income-stats ml-4">
          <div className="stat-row"><span className="dot bg-success"></span> Income: $15,000</div>
          <div className="stat-row"><span className="dot bg-danger"></span> Expenses: $2,500</div>
        </div>
      </div>
    </div>
  );
};

export const TasksOverviewWidget = () => {
  const data = [
    { name: 'To do', value: 20, color: '#F59E0B' },
    { name: 'In progress', value: 13, color: '#3B82F6' },
    { name: 'Review', value: 13, color: '#8B5CF6' },
    { name: 'Done', value: 45, color: '#10B981' },
    { name: 'Expired', value: 33, color: '#EF4444' },
  ];
  return (
    <div className="widget-card">
      <div className="widget-header">
        <h4>All Tasks Overview</h4>
        <MoreHorizontal size={16} className="text-secondary" />
      </div>
      <div className="widget-body flex-row align-center">
        <div className="chart-container flex-1" style={{ height: '160px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={65} outerRadius={70} dataKey="value" stroke="none">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="task-legend flex-1">
          {data.map(item => (
            <div key={item.name} className="legend-item flex-between">
              <span><span className="dot" style={{ backgroundColor: item.color }}></span> {item.name}</span>
              <span className="font-medium" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TeamMembersWidget = () => (
  <div className="widget-card">
    <div className="widget-header">
      <h4>Team Member's Overview</h4>
      <MoreHorizontal size={16} className="text-secondary" />
    </div>
    <div className="widget-body">
      <div className="team-stats-grid">
        <div className="stat-item text-center">
          <div className="stat-num text-primary">5</div>
          <div className="stat-label">Total members</div>
          <div className="stat-line bg-primary"></div>
        </div>
        <div className="stat-item text-center">
          <div className="stat-num text-warning">0</div>
          <div className="stat-label">On leave today</div>
          <div className="stat-line bg-warning"></div>
        </div>
        <div className="stat-item text-center mt-4">
          <div className="stat-num text-danger">3</div>
          <div className="stat-label">Members Clocked In</div>
          <div className="stat-line bg-danger"></div>
        </div>
        <div className="stat-item text-center mt-4">
          <div className="stat-num text-info">2</div>
          <div className="stat-label">Members Clocked Out</div>
          <div className="stat-line bg-info"></div>
        </div>
      </div>
    </div>
  </div>
);

export const TicketStatusWidget = () => {
  const data = [
    { name: '01', val: 12 }, { name: '02', val: 19 }, { name: '03', val: 15 },
    { name: '04', val: 22 }, { name: '05', val: 30 }, { name: '06', val: 25 },
    { name: '07', val: 18 }, { name: '08', val: 28 }, { name: '09', val: 35 },
  ];
  return (
    <div className="widget-card">
      <div className="widget-header">
        <h4>Ticket Status</h4>
        <MoreHorizontal size={16} className="text-secondary" />
      </div>
      <div className="widget-body flex-row">
        <div className="ticket-legend flex-1">
          <div className="legend-item"><span className="dot bg-warning"></span> New (21)</div>
          <div className="legend-item"><span className="dot bg-success"></span> Open (18)</div>
          <div className="legend-item"><span className="dot bg-primary"></span> Closed (62)</div>
        </div>
        <div className="chart-container flex-2" style={{ height: '140px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Bar dataKey="val" fill="#10B981" radius={[0, 0, 0, 0]} barSize={4} />
              <Tooltip cursor={{fill: 'transparent'}} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const ListWidget = ({ title, items, isSticky }) => (
  <div className={`widget-card ${isSticky ? 'sticky-note-widget' : ''}`}>
    <div className="widget-header">
      <h4>{title}</h4>
      <div className="header-actions">
        {!isSticky && <Plus size={16} className="text-secondary cursor-pointer" />}
        <MoreHorizontal size={16} className="text-secondary cursor-pointer ml-2" />
      </div>
    </div>
    <div className="widget-body no-padding scrollable-body">
      {isSticky ? (
        <div className="sticky-content p-4">My quick notes here...</div>
      ) : (
        <ul className="list-group">
          {items.map((item, i) => (
            <li key={i} className="list-group-item flex-between">
              <div className="list-item-content">
                <div className="list-item-title">{item.title}</div>
                {item.subtitle && <div className="list-item-subtitle text-xs text-secondary mt-1">{item.subtitle}</div>}
              </div>
              {item.status && <span className="badge-pill bg-gray text-xs">{item.status}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);
