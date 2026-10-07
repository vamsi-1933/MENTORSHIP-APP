// client/components/AIChatModal.jsx
import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Loader2 } from "lucide-react";
import axios from "axios";

export default function AIChatModal({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Saathi AI Assistant. Ask me about mentors, sessions, or feedback." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

 useEffect(() => {
  if (endRef.current) {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "/api/ai/chat",
        { message: msg },
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessages((p) => [...p, { role: "assistant", content: data.response }]);
    } catch (err) {
      const e = err.response?.data?.message || err.response?.data?.error || "Something went wrong.";
      setMessages((p) => [...p, { role: "assistant", content: "Error: " + e, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex items-center gap-3">
            <Bot size={20} strokeWidth={1.75} />
            <div>
              <h3 className="font-semibold text-base">Saathi AI Assistant</h3>
              <p className="text-xs text-indigo-100 opacity-80">Database-powered insights</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                  (m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : m.isError
                    ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-md"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md")
                }
              >
                <pre className="whitespace-pre-wrap font-sans" style={{ fontFamily: "inherit" }}>
                  {m.content}
                </pre>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about meetings, mentors, or stats..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-2 shrink-0 transition-colors"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </div>
  );
}