import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Analyzer } from './pages/Analyzer';
import { EAGenerator } from './pages/EAGenerator';
import { ComprehensiveAnalyzer } from './pages/ComprehensiveAnalyzer';
import { History } from './pages/History';
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
          <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<HomePage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-history"
              element={
                <ProtectedRoute>
                  <PurchaseHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminTools />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/ai-chat" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analyzer"
              element={
                <ProtectedRoute>
                  <Analyzer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ea-generator"
              element={
                <ProtectedRoute>
                  <EAGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <AIAnalysisChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comprehensive-analyzer"
              element={
                <ProtectedRoute>
                  <ComprehensiveAnalyzer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Navigate to="/analysis-history" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis-history"
              element={
                <ProtectedRoute>
                  <AnalysisHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ea-history"
              element={
                <ProtectedRoute>
                  <EAHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chart-img"
              element={
                <ProtectedRoute>
                  <ChartImg />
                </ProtectedRoute>
              }
            />
            <Route
              path="/market/:category/:symbol"
              element={
                <ProtectedRoute>
                  <MarketPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Layout>
        </AnalysisProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;