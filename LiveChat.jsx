// pages/LiveChat.jsx
// Two things live on this page:
// 1. The AI Chatbot widget (always available to customers to start a bot conversation)
// 2. A live conversation list + real-time chat window using Socket.io, used once
//    a conversation has been escalated to (or an agent has joined) live mode.

import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Send, MessageCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';

const LiveChat = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  // Set up the Socket.io connection once, authenticated with the JWT.
  // In production, set VITE_SOCKET_URL to your deployed backend's origin
  // (e.g. https://ai-support-api.onrender.com). In dev, Vite proxies '/socket.io'.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
    socketRef.current = io(socketUrl, { auth: { token } });

    socketRef.current.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, []);

  // Load the list of live conversations relevant to this user
  const loadConversations = async () => {
    const res = await api.get('/chat');
    setConversations(res.data.data);
  };

  useEffect(() => {
    if (isStaff) loadConversations();
  }, [isStaff]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    const res = await api.get(`/chat/${conv._id}/messages`);
    setMessages(res.data.data);
    socketRef.current.emit('join_conversation', conv._id);
  };

  const joinAsAgent = async (conv) => {
    await api.put(`/chat/${conv._id}/join`);
    openConversation(conv);
    loadConversations();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    socketRef.current.emit('send_message', { conversationId: activeConv._id, content: input });
    setInput('');
  };

  // Customers just see the AI chat widget + their live chat once escalated
  if (!isStaff) {
    return (
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1">
        <ChatWidget />
      </div>
    );
  }

  // Staff view: conversation list on the left, active chat on the right
  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
          <MessageCircle size={18} /> Live Conversations
        </h3>
        <div className="space-y-2">
          {conversations.length === 0 && <p className="text-sm text-gray-500">No active conversations.</p>}
          {conversations.map((c) => (
            <button
              key={c._id}
              onClick={() => (c.agent ? openConversation(c) : joinAsAgent(c))}
              className={`w-full rounded-lg border p-3 text-left text-sm hover:bg-gray-50 ${
                activeConv?._id === c._id ? 'border-brand-500 bg-brand-50' : 'border-gray-100'
              }`}
            >
              <p className="font-medium text-gray-800">{c.customer?.name}</p>
              <p className="text-xs text-gray-500">{c.agent ? 'Joined' : 'Waiting for agent'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
        {!activeConv ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200 px-4 py-3">
              <p className="font-semibold text-gray-800">{activeConv.customer?.name}</p>
            </div>
            <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m._id} className={`flex ${m.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      m.senderType === 'agent' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
