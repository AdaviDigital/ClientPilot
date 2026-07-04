// components/ChatWidget.jsx
// The AI chatbot interface. Starts a conversation on mount, sends user messages
// to the backend (which calls OpenAI), and displays the bot's replies.
// If the AI decides the issue needs a human, it surfaces an escalation notice
// and the conversation is handed off to Live Chat automatically.

import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User as UserIcon, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

const ChatWidget = () => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [escalated, setEscalated] = useState(null);
  const scrollRef = useRef(null);

  // Start a fresh AI conversation when the widget first loads
  useEffect(() => {
    const start = async () => {
      const res = await api.post('/chat/start');
      setConversationId(res.data.data.conversation._id);
      setMessages(res.data.data.messages);
    };
    start();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || sending) return;

    const text = input;
    setInput('');
    setSending(true);

    // Optimistically show the user's message immediately
    setMessages((prev) => [...prev, { senderType: 'customer', content: text, _id: `temp-${Date.now()}` }]);

    try {
      const res = await api.post(`/chat/${conversationId}/message`, { content: text });
      const { botMessage, escalatedTicket } = res.data.data;
      if (botMessage) setMessages((prev) => [...prev, botMessage]);
      if (escalatedTicket) setEscalated(escalatedTicket);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { senderType: 'bot', content: 'Sorry, something went wrong. Please try again.', _id: `err-${Date.now()}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <Bot size={20} className="text-brand-600" />
        <h3 className="font-semibold text-gray-800">AI Support Assistant</h3>
      </div>

      <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m._id} className={`flex ${m.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`flex max-w-[75%] items-start gap-2 rounded-2xl px-4 py-2 text-sm ${
                m.senderType === 'customer' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.senderType !== 'customer' && <Bot size={16} className="mt-0.5 shrink-0" />}
              <span>{m.content}</span>
              {m.senderType === 'customer' && <UserIcon size={16} className="mt-0.5 shrink-0" />}
            </div>
          </div>
        ))}

        {escalated && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              This conversation has been escalated to a human agent (Ticket #{escalated._id.slice(-6)}). Head to
              Live Chat to continue.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
