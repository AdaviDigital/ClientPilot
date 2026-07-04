// pages/TicketDetail.jsx
// Detail view for a single ticket: shows the thread of replies, lets the
// customer/agent add new replies, and lets staff update status/priority.

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isStaff = user?.role === 'agent' || user?.role === 'admin';
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');

  const fetchTicket = async () => {
    const res = await api.get(`/tickets/${id}`);
    setTicket(res.data.data);
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await api.post(`/tickets/${id}/replies`, { message: reply });
    setReply('');
    fetchTicket();
  };

  const handleStatusChange = async (status) => {
    await api.put(`/tickets/${id}`, { status });
    fetchTicket();
  };

  if (!ticket) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <Link to="/tickets" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
        <ArrowLeft size={16} /> Back to tickets
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{ticket.subject}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Raised by {ticket.createdBy?.name} on {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
          {isStaff && (
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          )}
        </div>
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{ticket.description}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-800">Conversation</h3>
        <div className="space-y-3">
          {ticket.replies.length === 0 && <p className="text-sm text-gray-500">No replies yet.</p>}
          {ticket.replies.map((r, idx) => (
            <div key={idx} className="rounded-lg border border-gray-100 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{r.sender?.name}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600">{r.message}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="mt-4 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetail;
