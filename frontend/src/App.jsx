import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
