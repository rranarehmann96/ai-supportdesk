import { useEffect, useState } from "react";
import API from "../api/axios.js";
import Navbar from "../components/Navbar.jsx";

const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "" });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [lastInvite, setLastInvite] = useState(null);

  const fetchMembers = async () => {
    try {
      const { data } = await API.get("/agents");
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setInviting(true);
    setLastInvite(null);
    try {
      const { data } = await API.post("/agents", form);
      setLastInvite(data);
      setForm({ name: "", email: "" });
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add agent");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("Remove this agent from the workspace?")) return;
    await API.delete(`/agents/${id}`);
    fetchMembers();
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Team</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: 24 }}>
          Add agents to help handle tickets. They'll get an email with a temporary password
          (or you can share it directly if email isn't set up yet).
        </p>

        <form onSubmit={handleInvite} className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: 14 }}>Add an agent</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              className="input"
              name="name"
              placeholder="Agent's name"
              value={form.name}
              onChange={handleChange}
              required
              style={{ flex: 1, minWidth: 180 }}
            />
            <input
              className="input"
              type="email"
              name="email"
              placeholder="Agent's email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ flex: 1, minWidth: 180 }}
            />
            <button className="btn btn-primary" disabled={inviting}>
              {inviting ? "Adding..." : "Add agent"}
            </button>
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: 10 }}>{error}</p>}
          {lastInvite && (
            <div style={{ marginTop: 14, padding: 14, background: "#fde9c8", borderRadius: 8 }}>
              <p style={{ fontSize: "0.85rem", color: "var(--amber-deep)", fontWeight: 600 }}>
                Agent added! If email isn't configured yet, share these credentials manually:
              </p>
              <p style={{ fontSize: "0.85rem", marginTop: 4 }}>
                Email: <b>{lastInvite.agent.email}</b> · Temp password: <b>{lastInvite.tempPassword}</b>
              </p>
            </div>
          )}
        </form>

        {loading ? (
          <p style={{ color: "var(--ink-soft)" }}>Loading team...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map((m) => (
              <div
                key={m._id}
                className="card"
                style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <p style={{ fontWeight: 600 }}>{m.name}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{m.email}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    className="badge"
                    style={{ background: m.role === "owner" ? "#dce6f5" : "#eceae4", color: m.role === "owner" ? "#2a4d8f" : "var(--ink-soft)" }}
                  >
                    {m.role}
                  </span>
                  {m.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(m._id)}
                      className="btn btn-ghost"
                      style={{ padding: "6px 12px", fontSize: "0.82rem", color: "var(--danger)" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;
