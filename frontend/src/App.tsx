import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import Forensics from "./pages/Forensics";
import Compliance from "./pages/Compliance";
import Copilot from "./pages/Copilot";
import LocalLLM from "./pages/LocalLLM";
import Admin from "./pages/Admin";
import Team from "./pages/Team";
import FileLifecycle from "./pages/FileLifecycle";
import Analytics from "./pages/Analytics";
import ThreatTopology from "./pages/ThreatTopology";
import AgentSwarm from "./pages/AgentSwarm";
import ThreatOracle from "./pages/ThreatOracle";
import SharedInbox from "./pages/SharedInbox";
import { PublicShare } from "./pages/PublicShare";

const SecureRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/share/:token" element={<PublicShare />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10"><Team /></div>} />
          
          <Route path="/dashboard" element={<SecureRoute><Dashboard /></SecureRoute>} />
          <Route path="/vault" element={<SecureRoute><Vault /></SecureRoute>} />
          <Route path="/forensics" element={<SecureRoute><Forensics /></SecureRoute>} />
          <Route path="/compliance" element={<SecureRoute><Compliance /></SecureRoute>} />
          <Route path="/team" element={<SecureRoute><Team /></SecureRoute>} />
          <Route path="/copilot" element={<SecureRoute><Copilot /></SecureRoute>} />
          <Route path="/llm" element={<SecureRoute><LocalLLM /></SecureRoute>} />
          <Route path="/admin" element={<SecureRoute><Admin /></SecureRoute>} />
          <Route path="/analytics" element={<SecureRoute><Analytics /></SecureRoute>} />
          <Route path="/threats" element={<SecureRoute><ThreatTopology /></SecureRoute>} />
          <Route path="/swarm" element={<SecureRoute><AgentSwarm /></SecureRoute>} />
          <Route path="/oracle" element={<SecureRoute><ThreatOracle /></SecureRoute>} />
          <Route path="/inbox" element={<SecureRoute><SharedInbox /></SecureRoute>} />
          <Route path="/file/:fileId" element={<SecureRoute><FileLifecycle /></SecureRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
