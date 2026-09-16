import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TicketChat from "./pages/TicketChat.jsx";
import PublicTicketForm from "./pages/PublicTicketForm.jsx";
import PublicTicketChat from "./pages/PublicTicketChat.jsx";
import KnowledgeBase from "./pages/KnowledgeBase.jsx";
import Analytics from "./pages/Analytics.jsx";
import Team from "./pages/Team.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge-base"
        element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <Team />
          </ProtectedRoute>
        }
      />

      {/* Public customer-facing routes, no login required */}
      <Route path="/support/:slug" element={<PublicTicketForm />} />
      <Route path="/support/:slug/ticket/:ticketId" element={<PublicTicketChat />} />
    </Routes>
  );
}

export default App;
