import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { EAGenerator } from './pages/EAGenerator';
import { AnalysisHistory } from './pages/AnalysisHistory';
import { EAHistory } from './pages/EAHistory';
import { Profile } from './pages/Profile';
import { PurchaseHistory } from './pages/PurchaseHistory';
import { ChartImg } from './pages/ChartImg';
import AIAnalysisChat from "./pages/AIAnalysisChat";
import { MarketPage } from './pages/MarketPage';
import { Layout } from './components/Layout';
import { AuthGuard as ProtectedRoute } from './components/AuthGuard';
import { AnalysisProvider } from './context/AnalysisContext';
import { AdminTools } from './pages/AdminTools';
import { HomePage } from './pages/HomePage';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AnalysisProvider>
          <Routes>
            {/* Public routes without Layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public home page with Layout */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-history"
              element={
                <ProtectedRoute>
                  <Layout><PurchaseHistory /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout><AdminTools /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout><Navigate to="/ai-chat" replace /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ea-generator"
              element={
                <ProtectedRoute>
                  <Layout><EAGenerator /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <Layout><AIAnalysisChat /></Layout>
                </ProtectedRoute>
              }
            />
                        <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Layout><Navigate to="/analysis-history" replace /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis-history"
              element={
                <ProtectedRoute>
                  <Layout><AnalysisHistory /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ea-history"
              element={
                <ProtectedRoute>
                  <Layout><EAHistory /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chart-img"
              element={
                <ProtectedRoute>
                  <Layout><ChartImg /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/market/:category/:symbol"
              element={
                <ProtectedRoute>
                  <Layout><MarketPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnalysisProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;