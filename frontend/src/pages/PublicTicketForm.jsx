import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";

const PublicTicketForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "",
    customerName: "",
    customerEmail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Search the knowledge base as the customer types their issue
  useEffect(() => {
    if (!form.subject.trim() || form.subject.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await API.get(`/kb/public/${slug}`, {
          params: { query: form.subject },
        });
        setSuggestions(data);
      } catch (err) {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.subject, slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post(`/tickets/public/${slug}`, form);
      navigate(`/support/${slug}/ticket/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="card" style={{ width: 440, padding: 36 }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 6 }}>How can we help?</h2>
        <p style={{ color: "var(--ink-soft)", marginBottom: 24, fontSize: "0.92rem" }}>
          Tell us what's going on. Our AI will prioritize it and an agent will be right with you.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Your name</label>
            <input
              className="input"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              required
              style={{ marginTop: 6 }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Email</label>
            <input
              className="input"
              type="email"
              name="customerEmail"
              value={form.customerEmail}
              onChange={handleChange}
              required
              style={{ marginTop: 6 }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>What's the issue?</label>
            <input
              className="input"
              name="subject"
              placeholder="e.g. Can't reset my password"
              value={form.subject}
              onChange={handleChange}
              required
              style={{ marginTop: 6 }}
            />
          </div>

          {suggestions.length > 0 && (
            <div style={{ background: "#f6f7f5", border: "1px solid var(--line)", borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--teal)", marginBottom: 8 }}>
                💡 You might find your answer here first:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.map((s) => (
                  <div key={s._id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        fontSize: "0.86rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                        cursor: "pointer",
                      }}
                    >
                      {expandedId === s._id ? "▾" : "▸"} {s.title}
                    </button>
                    {expandedId === s._id && (
                      <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: 4, paddingLeft: 14 }}>
                        {s.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{error}</p>}

          <button className="btn btn-amber" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Submitting..." : "Submit ticket"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicTicketForm;
