import { useEffect, useState } from "react";
import API from "../api/axios.js";
import Navbar from "../components/Navbar.jsx";

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/analytics/summary")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusLabel = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };
  const priorityLabel = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };

  const maxDayCount = data ? Math.max(1, ...data.last7Days.map((d) => d.count)) : 1;

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 20 }}>Analytics</h2>

        {loading || !data ? (
          <p style={{ color: "var(--ink-soft)" }}>Loading analytics...</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
              <div className="card" style={{ padding: 20 }}>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: 6 }}>TOTAL TICKETS</p>
                <h3 style={{ fontSize: "1.8rem" }}>{data.totalTickets}</h3>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: 6 }}>AVG RESOLUTION TIME</p>
                <h3 style={{ fontSize: "1.8rem" }}>
                  {data.avgResolutionHours > 0 ? `${data.avgResolutionHours}h` : "—"}
                </h3>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: 6 }}>LAST 7 DAYS</p>
                <h3 style={{ fontSize: "1.8rem" }}>
                  {data.last7Days.reduce((sum, d) => sum + d.count, 0)}
                </h3>
              </div>
            </div>

            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: "1rem", marginBottom: 18 }}>Tickets created — last 7 days</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
                {data.last7Days.map((d) => (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(4, (d.count / maxDayCount) * 100)}px`,
                        background: "var(--amber)",
                        borderRadius: 4,
                      }}
                      title={`${d.count} ticket(s)`}
                    />
                    <p style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                      {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: "1rem", marginBottom: 14 }}>By status</h3>
                {data.statusBreakdown.length === 0 ? (
                  <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>No tickets yet.</p>
                ) : (
                  data.statusBreakdown.map((s) => (
                    <div key={s._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                      <span className={`badge badge-${s._id}`}>{statusLabel[s._id] || s._id}</span>
                      <span style={{ fontWeight: 600 }}>{s.count}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: "1rem", marginBottom: 14 }}>By priority</h3>
                {data.priorityBreakdown.length === 0 ? (
                  <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>No tickets yet.</p>
                ) : (
                  data.priorityBreakdown.map((p) => (
                    <div key={p._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                      <span className={`badge badge-${p._id}`}>{priorityLabel[p._id] || p._id}</span>
                      <span style={{ fontWeight: 600 }}>{p.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
