// utils/openai.js
// Wraps the OpenAI SDK so the rest of the app can call a single, simple function
// to get an AI-generated support reply.

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt that defines the assistant's persona and behavior boundaries.
const SYSTEM_PROMPT = `You are a helpful, friendly customer support assistant for a software company.
- Answer clearly and concisely.
- If you do not know the answer, or the user explicitly asks for a human, or the issue involves
  billing disputes, account security, or anything you cannot resolve, respond with a message that
  includes the exact tag [ESCALATE] at the end so the system knows to create a support ticket.
- Never make up policy details you are not sure about.`;

/**
 * Sends the conversation history to OpenAI and returns the assistant's reply text.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history - prior turns
 * @returns {Promise<{reply: string, shouldEscalate: boolean}>}
 */
const getAIResponse = async (history) => {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
    temperature: 0.4,
    max_tokens: 500,
  });

  const rawReply = completion.choices[0].message.content || '';
  const shouldEscalate = rawReply.includes('[ESCALATE]');
  const reply = rawReply.replace('[ESCALATE]', '').trim();

  return { reply, shouldEscalate };
};

module.exports = { getAIResponse };
