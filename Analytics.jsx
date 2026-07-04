// pages/Analytics.jsx
// Visual analytics dashboard for agents/admins: ticket volume over time,
// breakdown by status/category, and key summary metrics.

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Ticket, Clock, CheckCircle, Users } from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#94a3b8'];

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [byStatus, setByStatus] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [byCategory, setByCategory] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [s, st, tl, cat] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/tickets-by-status'),
        api.get('/analytics/tickets-timeline'),
        api.get('/analytics/tickets-by-category'),
      ]);
      setSummary(s.data.data);
      setByStatus(st.data.data.map((d) => ({ name: d._id.replace('_', ' '), value: d.count })));
      setTimeline(tl.data.data.map((d) => ({ date: d._id, count: d.count })));
      setByCategory(cat.data.data.map((d) => ({ name: d._id, count: d.count })));
    };
    load();
  }, []);

  if (!summary) return <div className="text-gray-500">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
        <p className="text-sm text-gray-500">Insights into support performance and volume.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tickets" value={summary.totalTickets} icon={Ticket} accent="brand" />
        <StatCard label="Avg. Resolution (hrs)" value={summary.avgResolutionHours} icon={Clock} accent="amber" />
        <StatCard label="Resolved" value={summary.resolvedTickets} icon={CheckCircle} accent="green" />
        <StatCard label="Customers" value={summary.totalCustomers} icon={Users} accent="brand" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-800">Ticket Volume (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-800">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 font-semibold text-gray-800">Tickets by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
