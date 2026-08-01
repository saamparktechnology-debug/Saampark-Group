import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Clients from './pages/Clients/Clients';
import Leads from './pages/Leads/Leads';
import Sales from './pages/Sales/Sales';
import Projects from './pages/Projects/Projects';
import Tasks from './pages/Tasks/Tasks';
import Events from './pages/Events/Events';
import Subscriptions from './pages/Subscriptions/Subscriptions';
import Estimates from './pages/Estimates/Estimates';
import Proposals from './pages/Proposals/Proposals';
import Notes from './pages/Notes/Notes';
import Messages from './pages/Messages/Messages';
import Team from './pages/Team/Team';
import Tickets from './pages/Tickets/Tickets';
import KnowledgeBase from './pages/KnowledgeBase/KnowledgeBase';
import Files from './pages/Files/Files';
import './index.css';

// No placeholders needed anymore

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/team" element={<Team />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/files" element={<Files />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
