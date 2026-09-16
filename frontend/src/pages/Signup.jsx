import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/signup", form);
      login(data.token, data.user, data.workspace);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
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
      <div className="card" style={{ width: 420, padding: 36 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 6 }}>Create your workspace</h2>
        <p style={{ color: "var(--ink-soft)", marginBottom: 24, fontSize: "0.92rem" }}>
          Set up AI SupportDesk for your business in under a minute.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Business name</label>
            <input
              className="input"
              name="businessName"
              placeholder="Acme Inc."
              value={form.businessName}
              onChange={handleChange}
              required
              style={{ marginTop: 6 }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Your name</label>
            <input
              className="input"
              name="name"
              placeholder="Ali Khan"
              value={form.name}
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
              name="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              required
              style={{ marginTop: 6 }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Password</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              style={{ marginTop: 6 }}
            />
          </div>

          {error && (
            <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{error}</p>
          )}

          <button className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Creating..." : "Create workspace"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--ink)", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
