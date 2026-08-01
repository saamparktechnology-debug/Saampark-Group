import React from 'react';
import { Calendar, Plus, MoreVertical } from 'lucide-react';
import './Events.css';

const MOCK_EVENTS = [
  { id: 1, title: 'Meeting with John', date: '2026-08-01 10:00 AM', color: '#10B981' },
  { id: 2, title: 'Project Kickoff', date: '2026-08-02 02:00 PM', color: '#3B82F6' },
  { id: 3, title: 'Company Anniversary', date: '2026-08-15 09:00 AM', color: '#F59E0B' },
];

const Events = () => {
  return (
    <div className="events-page">
      <div className="page-header">
        <h2 className="page-title">Events</h2>
        <button className="btn-primary">
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="calendar-container">
        <div className="calendar-header flex-between p-4 border-bottom">
          <h3>August 2026</h3>
          <div className="calendar-nav">
            <button className="btn-secondary">Today</button>
            <button className="icon-btn ml-2">{'<'}</button>
            <button className="icon-btn ml-2">{'>'}</button>
          </div>
        </div>
        
        <div className="events-list p-4">
          {MOCK_EVENTS.map(event => (
            <div key={event.id} className="event-item">
              <span className="event-color" style={{ backgroundColor: event.color }}></span>
              <div className="event-details">
                <h4>{event.title}</h4>
                <p className="text-secondary text-sm"><Calendar size={14} className="mr-1 inline"/> {event.date}</p>
              </div>
              <button className="icon-btn-small"><MoreVertical size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
