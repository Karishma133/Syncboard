import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CommandPalette from "./components/CommandPalette";
import ShortcutsModal from "./components/ShortcutsModal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import MyWork from "./pages/MyWork";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resetpassword/:token" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/boards" element={<Dashboard />} />
              <Route path="/boards/:boardId" element={<Board />} />
              <Route path="/my-work" element={<MyWork />} />
            </Route>

            <Route path="/" element={<Navigate to="/boards" replace />} />
            <Route path="*" element={<Navigate to="/boards" replace />} />
          </Routes>
          <CommandPalette />
          <ShortcutsModal />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
