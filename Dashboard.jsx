// pages/Dashboard.jsx
// Landing page after login. Shows a quick summary of tickets/conversations
// (staff view) or the customer's own recent tickets + a shortcut to chat.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'agent' || user?.role === 'admin';
  const [summary, setSummary] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (isStaff) {
        const res = await api.get('/analytics/summary');
        setSummary(res.data.data);
      }
      const ticketsRes = await api.get('/tickets?limit=5');
      setRecentTickets(ticketsRes.data.data);
    };
    load();
  }, [isStaff]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">
          {isStaff ? 'Overview of support activity across the platform.' : 'A quick look at your support activity.'}
        </p>
      </div>

      {isStaff && summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Tickets" value={summary.totalTickets} icon={Ticket} accent="brand" />
          <StatCard label="Open Tickets" value={summary.openTickets} icon={Clock} accent="amber" />
          <StatCard label="Resolved Tickets" value={summary.resolvedTickets} icon={CheckCircle} accent="green" />
          <StatCard label="Active Conversations" value={summary.totalConversations} icon={MessageSquare} accent="brand" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
            <Link to="/tickets" className="text-sm font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentTickets.length === 0 && <p className="text-sm text-gray-500">No tickets yet.</p>}
            {recentTickets.map((t) => (
              <Link
                key={t._id}
                to={`/tickets/${t._id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.subject}</p>
                  <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-600">
                  {t.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-gray-800">Need help?</h3>
          <p className="mb-4 text-sm text-gray-500">
            Chat with our AI assistant for instant answers, 24/7. If it can't help, we'll connect you with a human.
          </p>
          <Link
            to="/chat"
            className="block w-full rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
          >
            Start a chat
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
