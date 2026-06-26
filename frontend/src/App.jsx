import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import FeedPage from "./pages/feed/FeedPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ExplorePage from "./pages/explore/ExplorePage";
import MessagesPage from "./pages/messages/MessagesPage";
import JobsPage from "./pages/jobs/JobsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import NotFoundPage from "./pages/errors/NotFoundPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

function AuthenticatedApp({ children }) {
  return (
    <ProtectedRoute>
      <SocketProvider>{children}</SocketProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/feed" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/feed" replace /> : <RegisterPage />} />

      {/* Protected routes */}
      <Route path="/feed"            element={<AuthenticatedApp><FeedPage /></AuthenticatedApp>} />
      <Route path="/profile/:username" element={<AuthenticatedApp><ProfilePage /></AuthenticatedApp>} />
      <Route path="/explore"         element={<AuthenticatedApp><ExplorePage /></AuthenticatedApp>} />
      <Route path="/messages"        element={<AuthenticatedApp><MessagesPage /></AuthenticatedApp>} />
      <Route path="/jobs"            element={<AuthenticatedApp><JobsPage /></AuthenticatedApp>} />
      <Route path="/settings"        element={<AuthenticatedApp><SettingsPage /></AuthenticatedApp>} />

      {/* Default & 404 */}
      <Route path="/"   element={<Navigate to={isAuthenticated ? "/feed" : "/login"} replace />} />
      <Route path="*"   element={<NotFoundPage />} />
    </Routes>
  );
}
