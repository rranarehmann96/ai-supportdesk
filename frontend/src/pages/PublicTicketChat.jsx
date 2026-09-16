import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios.js";
import { SOCKET_URL } from "../config.js";

const socket = io(SOCKET_URL);

const PublicTicketChat = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const [ticketRes, messagesRes] = await Promise.all([
        API.get(`/messages/public/${ticketId}/ticket`),
        API.get(`/messages/${ticketId}`),
      ]);
      setTicket(ticketRes.data);
      setMessages(messagesRes.data);
    };
    load();

    socket.emit("join_ticket", ticketId);

    socket.on("receive_message", (msg) => {
      if (msg.ticket === ticketId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("ai_thinking", (isThinking) => setAiThinking(isThinking));

    return () => {
      socket.off("receive_message");
      socket.off("ai_thinking");
    };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !ticket) return;
    socket.emit("send_message", {
      ticketId,
      sender: "customer",
      senderName: ticket.customerName,
      text,
    });
    setText("");
  };

  const askAI = () => {
    if (!text.trim() || !ticket) return;
    socket.emit("ask_ai", {
      ticketId,
      senderName: ticket.customerName,
      text,
    });
    setText("");
  };

  if (!ticket) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ width: 460, display: "flex", flexDirection: "column", height: 560 }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--line)" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--amber-deep)", fontWeight: 600 }}>
            TICKET #{ticket._id.slice(-6).toUpperCase()}
          </p>
          <h3 style={{ fontSize: "1.05rem", marginTop: 2 }}>{ticket.subject}</h3>
          <span className={`badge badge-${ticket.status}`} style={{ marginTop: 8 }}>
            {ticket.status.replace("_", " ")}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 && (
            <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", textAlign: "center", marginTop: 20 }}>
              Your message has been received. An agent will reply here shortly.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m._id}
              style={{
                alignSelf: m.sender === "customer" ? "flex-end" : "flex-start",
                maxWidth: "75%",
              }}
            >
              {m.sender === "ai" && (
                <p style={{ fontSize: "0.72rem", color: "var(--teal)", fontWeight: 600, marginBottom: 3 }}>
                  ✨ AI Assistant
                </p>
              )}
              <div
                style={{
                  background: m.sender === "customer" ? "var(--ink)" : m.sender === "ai" ? "#dcece7" : "#eceae4",
                  color: m.sender === "customer" ? "#fff" : m.sender === "ai" ? "var(--teal)" : "var(--ink)",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: "0.92rem",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {aiThinking && (
            <p style={{ fontSize: "0.8rem", color: "var(--teal)", fontStyle: "italic" }}>
              ✨ AI Assistant is thinking...
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={sendMessage}
          style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, borderTop: "1px solid var(--line)" }}
        >
          <input
            className="input"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={askAI}
              disabled={aiThinking}
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: "0.88rem" }}
            >
              ✨ Ask AI now
            </button>
            <button className="btn btn-amber" style={{ flex: 1 }}>
              Send to agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicTicketChat;
