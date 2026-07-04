// components/Sidebar.jsx
// Left-hand navigation for the dashboard layout. Shows different links
// depending on the logged-in user's role.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, MessageSquare, BarChart3, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
  }`;

const Sidebar = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Bot size={20} />
        </div>
        <span className="text-lg font-bold text-gray-800">SupportAI</span>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink to="/dashboard" className={linkClasses}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/tickets" className={linkClasses}>
          <Ticket size={18} /> Tickets
        </NavLink>
        <NavLink to="/chat" className={linkClasses}>
          <MessageSquare size={18} /> Live Chat
        </NavLink>
        {isStaff && (
          <NavLink to="/analytics" className={linkClasses}>
            <BarChart3 size={18} /> Analytics
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
