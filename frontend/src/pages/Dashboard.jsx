import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios.js";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { workspace } = useAuth();

  const publicLink = workspace
    ? `${window.location.origin}/support/${workspace.slug}`
    : "";

  const fetchTickets = async () => {
    try {
      const { data } = await API.get("/tickets");
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--amber-deep)", marginBottom: 4 }}>
              YOUR CUSTOMER SUPPORT LINK
            </p>
            <p style={{ fontSize: "0.92rem", color: "var(--ink-soft)" }}>{publicLink}</p>
          </div>
          <button onClick={copyLink} className="btn btn-amber">
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontSize: "1.3rem" }}>Tickets</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="btn btn-ghost"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  background: filter === s ? "var(--ink)" : "transparent",
                  color: filter === s ? "#fff" : "var(--ink)",
                }}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--ink-soft)" }}>Loading tickets...</p>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--ink-soft)" }}>
              No tickets yet. Share your support link with customers to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((t) => (
              <Link key={t._id} to={`/tickets/${t._id}`}>
                <div
                  className="card"
                  style={{
                    padding: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{t.subject}</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                      {t.customerName} · {t.customerEmail}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-${t.status}`}>{t.status.replace("_", " ")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
