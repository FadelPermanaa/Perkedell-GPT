"use client";

import { useState, useEffect, useRef } from "react";

// ============================================================
// Percakapan disimpan di localStorage browser. Setiap percakapan
// sekarang punya field tambahan `pinned` (boolean) supaya bisa
// dikelompokkan seperti di ChatGPT: "Disematkan" vs "Terkini".
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [menuOpenFor, setMenuOpenFor] = useState(null); // id percakapan yang menu titik-tiganya lagi kebuka
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    if (loaded.length > 0) setCurrentId(loaded[0].id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, currentId]);

  // Tutup menu titik-tiga kalau klik di luar
  useEffect(() => {
    function handleClickOutside() {
      setMenuOpenFor(null);
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const currentConv = conversations.find((c) => c.id === currentId);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter((c) => c.pinned);
  const recent = filtered.filter((c) => !c.pinned);

  function newChat() {
    const conv = {
      id: crypto.randomUUID(),
      title: "Percakapan baru",
      messages: [],
      pinned: false,
    };
    const updated = [conv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setCurrentId(conv.id);
  }

  function togglePin(id, e) {
    e.stopPropagation();
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    setConversations(updated);
    saveConversations(updated);
    setMenuOpenFor(null);
  }

  function deleteConv(id, e) {
    e.stopPropagation();
    if (!confirm("Hapus percakapan ini?")) return;
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (id === currentId) setCurrentId(updated[0]?.id || null);
    setMenuOpenFor(null);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    let convId = currentId;
    let convs = conversations;

    if (!convId) {
      const conv = {
        id: crypto.randomUUID(),
        title: text.slice(0, 40),
        messages: [],
        pinned: false,
      };
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

  function renderConvItem(c) {
    return (
      <div
        key={c.id}
        className={"conversation-item" + (c.id === currentId ? " active" : "")}
        onClick={() => setCurrentId(c.id)}
      >
        <span className="conv-title">{c.title}</span>
        <div className="conv-menu-wrapper">
          <button
            className="menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenFor(menuOpenFor === c.id ? null : c.id);
            }}
          >
            ⋯
          </button>
          {menuOpenFor === c.id && (
            <div className="conv-menu" onClick={(e) => e.stopPropagation()}>
              <button onClick={(e) => togglePin(c.id, e)}>
                {c.pinned ? "📌 Lepas sematan" : "📌 Sematkan"}
              </button>
              <button className="danger" onClick={(e) => deleteConv(c.id, e)}>
                🗑 Hapus
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {sidebarOpen && (
        <>
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand">
              <span className="brand-dot" /> MyChat
            </div>
            <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Sembunyikan sidebar">
              ⟨⟩
            </button>
          </div>

          <button className="new-chat-btn" onClick={newChat}>
            <span className="plus">+</span> Obrolan baru
          </button>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="conversation-list">
            {pinned.length > 0 && (
              <>
                <div className="list-label">Disematkan</div>
                {pinned.map(renderConvItem)}
              </>
            )}

            {recent.length > 0 && (
              <>
                <div className="list-label">Terkini</div>
                {recent.map(renderConvItem)}
              </>
            )}

            {filtered.length === 0 && (
              <div className="no-results">Tidak ada percakapan ditemukan</div>
            )}
          </div>

          <div className="sidebar-footer">
            <div className="avatar">F</div>
            <div className="user-info">
              <div className="user-name">Akun kamu</div>
              <div className="user-plan">Free</div>
            </div>
          </div>
        </aside>
        </>
      )}

      <main className="chat-area">
        <div className="top-bar">
          {!sidebarOpen && (
            <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Tampilkan sidebar">
              ⟨⟩
            </button>
          )}
          <span className="top-title">MyChat</span>
        </div>

        <div className="messages">
          {!currentConv || currentConv.messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <div>Sapaann aku selalu kangen sama kamu, sayang 💖<br/>Apa yang bisa aku temani hari ini, bebu?</div>
            </div>
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
              <div className="bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-bar-wrapper">
          <div className="input-bar">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan apa saja"
              rows={1}
            />
            <button onClick={sendMessage} disabled={loading}>
              ➤
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
