import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Target, 
  Repeat, 
  DollarSign, 
  FileText, 
  Send, 
  MessageSquare, 
  Users2, 
  LifeBuoy, 
  BookOpen, 
  Folder
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { name: 'Events', path: '/events', icon: <Calendar size={20} /> },
  { name: 'Clients', path: '/clients', icon: <Users size={20} /> },
  { name: 'Projects', path: '/projects', icon: <Briefcase size={20} /> },
  { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
  { name: 'Leads', path: '/leads', icon: <Target size={20} /> },
  { name: 'Subscriptions', path: '/subscriptions', icon: <Repeat size={20} /> },
  { name: 'Sales', path: '/sales', icon: <DollarSign size={20} /> },
  { name: 'Estimates', path: '/estimates', icon: <FileText size={20} /> },
  { name: 'Proposals', path: '/proposals', icon: <Send size={20} /> },
  { name: 'Notes', path: '/notes', icon: <FileText size={20} /> },
  { name: 'Messages', path: '/messages', icon: <MessageSquare size={20} /> },
  { name: 'Team', path: '/team', icon: <Users2 size={20} /> },
  { name: 'Tickets', path: '/tickets', icon: <LifeBuoy size={20} /> },
  { name: 'Knowledge base', path: '/knowledge-base', icon: <BookOpen size={20} /> },
  { name: 'Files', path: '/files', icon: <Folder size={20} /> },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon"></div>
          <h1 className="logo-text">SAAMPARK</h1>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
