import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Chat from "./pages/Chat";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, loading } = useAuth();
  if (loading === "page")
    return (
      <div className="flex items-center justify-center animate-zoom-out">
        Loading...
      </div>
    );

  return (
    <BrowserRouter>
      <Routes>
        {/* Protected Route: If no user, send to login. If user, show Chat */}
        <Route
          path="/"
          element={user ? <Chat /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
