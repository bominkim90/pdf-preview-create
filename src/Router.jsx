import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import App from './App.jsx';
import DocumentListPage from './pages/DocumentListPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import MyPage from './pages/MyPage.jsx';

export default function Router() {
  return (
    <AuthProvider>
      <TooltipProvider delay={300}>
        <Toaster />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/guest" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  );
}
