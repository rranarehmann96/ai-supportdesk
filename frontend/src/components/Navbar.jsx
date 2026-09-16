import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, workspace, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        borderBottom: "1px solid var(--line)",
        background: "var(--paper-raised)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--ink)",
              color: "var(--amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-head)",
              fontWeight: 700,
            }}
          >
            S
          </div>
          <h3 style={{ fontSize: "1.05rem" }}>AI SupportDesk</h3>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/dashboard" style={{ fontSize: "0.92rem", color: "var(--ink-soft)" }}>
            Tickets
          </Link>
          <Link to="/knowledge-base" style={{ fontSize: "0.92rem", color: "var(--ink-soft)" }}>
            Knowledge Base
          </Link>
          <Link to="/analytics" style={{ fontSize: "0.92rem", color: "var(--ink-soft)" }}>
            Analytics
          </Link>
          {user?.role === "owner" && (
            <Link to="/team" style={{ fontSize: "0.92rem", color: "var(--ink-soft)" }}>
              Team
            </Link>
          )}
          {workspace && (
            <span
              className="badge"
              style={{ background: "#eee6d6", color: "var(--amber-deep)" }}
            >
              {workspace.name}
            </span>
          )}
          <span style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
            {user?.name}
          </span>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "7px 14px" }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
