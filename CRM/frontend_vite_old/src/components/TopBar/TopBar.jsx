import React, { useState, useRef, useEffect } from 'react';
import { Search, PlusCircle, Globe, Clock, Bell, Mail, Settings, User, Key, LogOut, X, CheckCircle, Grid, Briefcase, Monitor } from 'lucide-react';
import './TopBar.css';

const THEME_COLORS = [
  '#F2F2F2', '#17a589', '#1E202D', '#1d2632', '#2471a3', '#2e4053',
  '#2e86c1', '#404040', '#555a61', '#557bbb', '#5d78ff', '#839192',
  '#83c340', '#884ea0', '#a6acaf', '#a93226', '#d68910', '#f2f4f6'
];

const TopBar = ({ onMenuToggle }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isDashOpen, setIsDashOpen] = useState(false);

  const profileRef = useRef(null);
  const plusRef = useRef(null);
  const bellRef = useRef(null);
  const todoRef = useRef(null);
  const dashRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (plusRef.current && !plusRef.current.contains(event.target)) setIsPlusOpen(false);
      if (bellRef.current && !bellRef.current.contains(event.target)) setIsBellOpen(false);
      if (todoRef.current && !todoRef.current.contains(event.target)) setIsTodoOpen(false);
      if (dashRef.current && !dashRef.current.contains(event.target)) setIsDashOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu-toggle" onClick={onMenuToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <div className="dropdown-container left-nav-dropdowns" ref={todoRef}>
           <button className="icon-button" onClick={() => setIsTodoOpen(!isTodoOpen)}><CheckCircle size={18} /></button>
           {isTodoOpen && (
             <div className="user-dropdown-menu left-dropdown">
               <div className="dropdown-header-small">My To Do</div>
               <ul className="dropdown-list">
                 <li><a href="#" className="dropdown-item">Buy coffee</a></li>
                 <li><a href="#" className="dropdown-item">Call Acme Corp</a></li>
               </ul>
             </div>
           )}
        </div>
        
        <button className="icon-button"><Grid size={18} /></button>
        <button className="icon-button"><Briefcase size={18} /></button>
        
        <div className="dropdown-container left-nav-dropdowns" ref={dashRef}>
          <button className="icon-button" onClick={() => setIsDashOpen(!isDashOpen)}><Monitor size={18} /></button>
           {isDashOpen && (
             <div className="user-dropdown-menu left-dropdown">
               <ul className="dropdown-list">
                 <li><a href="#" className="dropdown-item">Custom Dashboard</a></li>
                 <li><a href="#" className="dropdown-item">Sales Dashboard</a></li>
               </ul>
             </div>
           )}
        </div>
      </div>

      <div className="topbar-actions">
        {isSearchOpen && (
          <div className="search-overlay" onClick={() => setIsSearchOpen(false)}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>
              <select className="search-scope">
                <option>Task</option>
                <option>Project</option>
                <option>Client</option>
                <option>To do</option>
              </select>
              <input type="text" className="search-input" placeholder="Search" autoFocus />
              <button className="search-close-btn" onClick={() => setIsSearchOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <button className="icon-button" onClick={() => setIsSearchOpen(true)}><Search size={18} /></button>
        
        <div className="dropdown-container" ref={plusRef}>
          <button className="icon-button" onClick={() => setIsPlusOpen(!isPlusOpen)}><PlusCircle size={18} /></button>
          {isPlusOpen && (
            <div className="quick-add-menu user-dropdown-menu">
              <ul className="dropdown-list">
                <li><a href="#" className="dropdown-item">Add task</a></li>
                <li><a href="#" className="dropdown-item">Add multiple tasks</a></li>
                <li><a href="#" className="dropdown-item">Log time</a></li>
                <li><a href="#" className="dropdown-item">Add event</a></li>
                <li><a href="#" className="dropdown-item">Add note</a></li>
                <li><a href="#" className="dropdown-item">Add to do</a></li>
                <li><a href="#" className="dropdown-item">Add ticket</a></li>
              </ul>
            </div>
          )}
        </div>

        <button className="icon-button"><Globe size={18} /></button>
        <button className="icon-button"><Clock size={18} /></button>
        
        <div className="dropdown-container" ref={bellRef}>
          <button className="icon-button with-badge" onClick={() => setIsBellOpen(!isBellOpen)}>
            <Bell size={18} />
            <span className="badge">4</span>
          </button>
          {isBellOpen && (
            <div className="notifications-panel">
              <div className="notif-header">
                <strong>Notifications</strong>
                <div className="notif-actions">
                  <a href="#">Mark all as read</a> &middot; <a href="#">Settings</a>
                </div>
              </div>
              <div className="notif-body">
                {/* Mock Notification 1 */}
                <div className="notif-item">
                  <div className="notif-avatar"><img src="https://ui-avatars.com/api/?name=Emily+Smith&background=random" alt="Emily" /></div>
                  <div className="notif-content">
                    <div className="notif-title-row">
                      <strong>Emily Smith</strong>
                      <span className="notif-time">Today at 09:57:33 am</span>
                    </div>
                    <div className="notif-desc">Commented on a task.</div>
                    <div className="notif-meta">Task: #3425 - Implement product zoom and gallery<br/>Comment: We need to discuss about this.<br/>Project: Product Photography</div>
                  </div>
                </div>
                {/* Mock Notification 2 */}
                <div className="notif-item">
                  <div className="notif-avatar"><img src="https://ui-avatars.com/api/?name=Sara+Ann&background=random" alt="Sara" /></div>
                  <div className="notif-content">
                    <div className="notif-title-row">
                      <strong>Sara Ann</strong>
                      <span className="notif-time">Today at 01:12:36 pm</span>
                    </div>
                    <div className="notif-desc">Updated a task.</div>
                    <div className="notif-meta">Task: #3419 - Create product categories<br/>Priority: <del>High</del> <ins>Moved Down</ins><br/>Status: <del>To do</del> <ins style={{color: '#10B981'}}>In progress</ins></div>
                  </div>
                </div>
              </div>
              <a href="#" className="notif-footer">See All</a>
            </div>
          )}
        </div>

        <button className="icon-button"><Mail size={18} /></button>
        
        <div className="user-profile-container" ref={profileRef}>
          <div className="user-profile" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="avatar">
              <img src="https://ui-avatars.com/api/?name=John+Doe&background=4F46E5&color=fff" alt="User Avatar" />
            </div>
            <span className="user-name">John Doe</span>
          </div>

          {isProfileOpen && (
            <div className="user-dropdown-menu">
              <ul className="dropdown-list">
                <li>
                  <a href="#" className="dropdown-item">
                    <User size={16} className="dropdown-icon" /> My Profile
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item">
                    <Key size={16} className="dropdown-icon" /> Change Password
                  </a>
                </li>
                <li>
                  <a href="#" className="dropdown-item">
                    <Settings size={16} className="dropdown-icon" /> My preferences
                  </a>
                </li>
                
                <li className="dropdown-divider"></li>
                
                <li className="theme-changer-container">
                  <div className="theme-grid">
                    {THEME_COLORS.map(color => (
                      <span 
                        key={color} 
                        className="color-tag" 
                        style={{ backgroundColor: color }}
                        title={color}
                      ></span>
                    ))}
                  </div>
                </li>

                <li className="dropdown-divider"></li>
                
                <li>
                  <a href="#" className="dropdown-item text-danger">
                    <LogOut size={16} className="dropdown-icon" /> Sign Out
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
