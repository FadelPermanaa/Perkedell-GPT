"use client";

import { useState, useEffect, useRef } from "react";

// ============================================================
// Percakapan disimpan di localStorage browser (bukan database
// server) — jadi paling simpel untuk deploy di Vercel tanpa
// perlu setup database terpisah. Cocok untuk pemakaian pribadi.
// Kalau mau riwayat bisa diakses dari device lain, itu butuh
// database beneran (lihat catatan di README).
// ============================================================

function loadConversations() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("conversations") || "[]");
  } catch {
    return [];
  }
}

function saveConversations(conversations) {
  localStorage.setItem("conversations", JSON.stringify(conversations));
}

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    if (loaded.length > 0) setCurrentId(loaded[0].id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, currentId]);

  const currentConv = conversations.find((c) => c.id === currentId);

  function newChat() {
    const conv = {
      id: crypto.randomUUID(),
      title: "Percakapan baru",
      messages: [],
    };
    const updated = [conv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setCurrentId(conv.id);
  }

  function deleteConv(id, e) {
    e.stopPropagation();
    if (!confirm("Hapus percakapan ini?")) return;
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (id === currentId) setCurrentId(updated[0]?.id || null);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    let convId = currentId;
    let convs = conversations;

    // Kalau belum ada percakapan aktif, buat dulu
    if (!convId) {
      const conv = { id: crypto.randomUUID(), title: text.slice(0, 40), messages: [] };
      convs = [conv, ...conversations];
      convId = conv.id;
      setCurrentId(convId);
    }

    const userMsg = { role: "user", content: text };

    convs = convs.map((c) =>
      c.id === convId
        ? {
            ...c,
            title: c.messages.length === 0 ? text.slice(0, 40) : c.title,
            messages: [...c.messages, userMsg],
          }
        : c
    );
    setConversations(convs);
    saveConversations(convs);
    setInput("");
    setLoading(true);

    const activeConv = convs.find((c) => c.id === convId);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: activeConv.messages }),
      });
      const data = await res.json();
      const replyText = data.reply || data.error || "Terjadi kesalahan.";

      convs = convs.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, { role: "assistant", content: replyText }] }
          : c
      );
      setConversations(convs);
      saveConversations(convs);
    } catch (err) {
      convs = convs.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { role: "assistant", content: "Error: gagal menghubungi server." },
              ],
            }
          : c
      );
      setConversations(convs);
      saveConversations(convs);
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="new-chat-btn" onClick={newChat}>
          + Percakapan baru
        </button>
        <div className="conversation-list">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={"conversation-item" + (c.id === currentId ? " active" : "")}
              onClick={() => setCurrentId(c.id)}
            >
              <span>{c.title}</span>
              <button className="delete-btn" onClick={(e) => deleteConv(c.id, e)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-area">
        <div className="messages">
          {!currentConv || currentConv.messages.length === 0 ? (
            <div className="empty-state">Mulai percakapan...</div>
          ) : (
            currentConv.messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                {m.role === "assistant" && <span className="role-label">Assistant</span>}
                <div className="bubble">{m.content}</div>
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant">
              <span className="role-label">Assistant</span>
              <div className="bubble">...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-bar">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            rows={1}
          />
          <button onClick={sendMessage} disabled={loading}>
            Kirim
          </button>
        </div>
      </main>
    </div>
  );
}
