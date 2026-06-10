import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GuestApp from "./pages/GuestApp";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin panel page */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Realtime couple dashboard page */}
        <Route path="/dashboard/:eventSlug" element={<Dashboard />} />
        
        {/* Fallback routing for dashboard without event slug */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/demo" replace />} />

        {/* Guest application page for specific event slug */}
        <Route path="/:eventSlug" element={<GuestApp />} />

        {/* Root URL routing fallback */}
        <Route path="/" element={<Navigate to="/demo" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
