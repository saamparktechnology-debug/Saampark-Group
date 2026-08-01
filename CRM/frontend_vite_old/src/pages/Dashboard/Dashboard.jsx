import React, { useState } from 'react';
import { Plus, Clock, CheckSquare, Calendar, DollarSign, Zap } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import './Dashboard.css';

const REVENUE_DATA = [
  { name: 'Jan', revenue: 4000, expenses: 2400 },
  { name: 'Feb', revenue: 3000, expenses: 1398 },
  { name: 'Mar', revenue: 9000, expenses: 9800 },
  { name: 'Apr', revenue: 2780, expenses: 3908 },
  { name: 'May', revenue: 18900, expenses: 4800 },
  { name: 'Jun', revenue: 23900, expenses: 3800 },
  { name: 'Jul', revenue: 34900, expenses: 4300 },
];

const SummaryCard = ({ title, value, icon, color }) => (
  <div className="aurora-card summary-card">
    <div className="summary-icon-container" style={{ background: `rgba(${color}, 0.1)`, color: `rgb(${color})`, boxShadow: `0 0 15px rgba(${color}, 0.3)` }}>
      {icon}
    </div>
    <div className="summary-details">
      <h3 className="summary-value">{value}</h3>
      <p className="summary-title">{title}</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="dashboard-page aurora-dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-title text-gradient">Welcome back, Admin!</h2>
          <p className="text-secondary">Here's what's happening with your projects today.</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary">
            <Zap size={16} /> Generate Report
          </button>
        </div>
      </div>

      <div className="aurora-summary-grid">
        <SummaryCard title="Total Revenue" value="$84,200" icon={<DollarSign size={24}/>} color="139, 92, 246" />
        <SummaryCard title="Active Projects" value="12" icon={<Clock size={24}/>} color="59, 130, 246" />
        <SummaryCard title="Pending Tasks" value="48" icon={<CheckSquare size={24}/>} color="245, 158, 11" />
        <SummaryCard title="New Leads" value="156" icon={<Calendar size={24}/>} color="16, 185, 129" />
      </div>

      <div className="aurora-main-grid">
        <div className="aurora-card main-chart-card">
          <div className="card-header">
            <h3>Revenue Overview</h3>
            <select className="aurora-select">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div style={{ height: '350px', width: '100%', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="aurora-card side-list-card">
           <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {[
              { time: '10 mins ago', desc: 'New invoice generated for Acme Corp', color: 'bg-primary' },
              { time: '2 hours ago', desc: 'TechNova project moved to In Progress', color: 'bg-success' },
              { time: '5 hours ago', desc: 'Jane Doe added a comment on Task #42', color: 'bg-warning' },
              { time: '1 day ago', desc: 'Server down ticket created by GlobalTech', color: 'bg-danger' },
            ].map((act, i) => (
              <div className="activity-item" key={i}>
                <div className={`activity-dot ${act.color}`}></div>
                <div className="activity-content">
                  <p>{act.desc}</p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
