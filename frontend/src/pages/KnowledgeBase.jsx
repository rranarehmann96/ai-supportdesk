import { useEffect, useState } from "react";
import API from "../api/axios.js";
import Navbar from "../components/Navbar.jsx";

const emptyForm = { title: "", content: "", tags: "" };

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchArticles = async () => {
    try {
      const { data } = await API.get("/kb");
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await API.put(`/kb/${editingId}`, payload);
      } else {
        await API.post("/kb", payload);
      }

      resetForm();
      fetchArticles();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article) => {
    setEditingId(article._id);
    setForm({
      title: article.title,
      content: article.content,
      tags: article.tags.join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this article?")) return;
    await API.delete(`/kb/${id}`);
    fetchArticles();
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Knowledge Base</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: 24 }}>
          Articles here are searchable by customers before they submit a ticket — great for
          answering common questions instantly.
        </p>

        <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 30 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: 14 }}>
            {editingId ? "Edit article" : "New article"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              className="input"
              name="title"
              placeholder="Title (e.g. How do I reset my password?)"
              value={form.title}
              onChange={handleChange}
              required
            />
            <textarea
              className="input"
              name="content"
              placeholder="Answer / content..."
              value={form.content}
              onChange={handleChange}
              required
              rows={5}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
            <input
              className="input"
              name="tags"
              placeholder="Tags, comma separated (e.g. password, login, account)"
              value={form.tags}
              onChange={handleChange}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update article" : "Add article"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-ghost">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {loading ? (
          <p style={{ color: "var(--ink-soft)" }}>Loading articles...</p>
        ) : articles.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--ink-soft)" }}>
              No articles yet. Add your first one above.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {articles.map((a) => (
              <div key={a._id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, marginBottom: 6 }}>{a.title}</p>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginBottom: 8 }}>
                      {a.content}
                    </p>
                    {a.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {a.tags.map((t) => (
                          <span
                            key={t}
                            className="badge"
                            style={{ background: "#eceae4", color: "var(--ink-soft)" }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleEdit(a)} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.82rem" }}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="btn btn-ghost"
                      style={{ padding: "6px 12px", fontSize: "0.82rem", color: "var(--danger)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
