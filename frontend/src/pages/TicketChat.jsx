import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios.js";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { WS_URL } from "../config.js";

const TicketChat = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const [ticketRes, messagesRes] = await Promise.all([
        API.get(`/tickets/${id}`),
        API.get(`/messages/${id}`),
      ]);
      setTicket(ticketRes.data);
      setMessages(messagesRes.data);
    };
    load();

    // WebSocket connection
    const wsUrl = `${WS_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/ws/${id}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    socketRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.ticketId === id) {
          setMessages((prev) => [...prev, msg]);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;

    const message = {
      ticketId: id,
      sender: "agent",
      senderName: user.name,
      content: text,
    };

    socketRef.current.send(JSON.stringify(message));
    setText("");
  };

  const updateStatus = async (status) => {
    const { data } = await API.put(`/tickets/${id}`, { status });
    setTicket(data);
  };

  const suggestReply = async () => {
    setSuggesting(true);
    try {
      const { data } = await API.post("/ai/suggest-reply", { ticketId: id });
      setText(data.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  if (!ticket) return null;

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 4 }}>{ticket.subject}</h2>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                {ticket.customerName} · {ticket.customerEmail}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
              <select
                value={ticket.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="input"
                style={{ width: "auto", padding: "6px 10px" }}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", height: 480 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", textAlign: "center", marginTop: 20 }}>
                No messages yet. Say hello to the customer.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m._id}
                style={{
                  alignSelf: m.sender === "agent" ? "flex-end" : "flex-start",
                  maxWidth: "70%",
                }}
              >
                <div
                  style={{
                    background:
                      m.sender === "agent" ? "var(--ink)" : m.sender === "ai" ? "#dcece7" : "#eceae4",
                    color: m.sender === "agent" ? "#fff" : m.sender === "ai" ? "var(--teal)" : "var(--ink)",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: "0.92rem",
                  }}
                >
                  {m.text}
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: 3 }}>
                  {m.senderName}
                </p>
              </div>
            ))}
            {typingUser && (
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontStyle: "italic" }}>
                {typingUser} is typing...
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            style={{ display: "flex", gap: 10, padding: 16, borderTop: "1px solid var(--line)" }}
          >
            <button
              type="button"
              onClick={suggestReply}
              disabled={suggesting || messages.length === 0}
              className="btn btn-ghost"
              style={{ whiteSpace: "nowrap", opacity: messages.length === 0 ? 0.5 : 1 }}
              title={messages.length === 0 ? "Wait for the customer's first message" : "Ask AI to draft a reply"}
            >
              {suggesting ? "Thinking..." : "✨ AI Suggest"}
            </button>
            <input
              className="input"
              placeholder="Type your reply..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Typing indicator removed for WebSocket implementation
                // Can be added back with WebSocket-based typing indicator
              }}
            />
            <button className="btn btn-primary">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketChat;
