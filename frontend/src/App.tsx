import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { useAppStore } from './stores/app';
import { connectWebSocket, disconnectWebSocket } from './services/websocket';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import FamilyManagePage from './pages/FamilyManagePage';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ItemEditPage from './pages/ItemEditPage';
import ShoppingListPage from './pages/ShoppingListPage';
import PurchaseRecordsPage from './pages/PurchaseRecordsPage';
import ConsumptionTrendsPage from './pages/ConsumptionTrendsPage';
import DistributionPage from './pages/DistributionPage';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';

function App() {
  const { token, kickedMessage } = useAuthStore();
  const { setIsMobile } = useAppStore();
  const [showKicked, setShowKicked] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    if (token && !kickedMessage) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  }, [token, kickedMessage]);

  useEffect(() => {
    if (kickedMessage) {
      setShowKicked(true);
    }
  }, [kickedMessage]);

  return (
    <BrowserRouter>
      {showKicked && kickedMessage && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-3 z-[100]">
          {kickedMessage}
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            token ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/family" element={<FamilyManagePage />} />
                  <Route path="/items" element={<ItemsPage />} />
                  <Route path="/items/:itemId" element={<ItemDetailPage />} />
                  <Route path="/items/new" element={<ItemEditPage />} />
                  <Route path="/items/:itemId/edit" element={<ItemEditPage />} />
                  <Route path="/shopping-list" element={<ShoppingListPage />} />
                  <Route path="/purchase-records" element={<PurchaseRecordsPage />} />
                  <Route path="/consumption-trends" element={<ConsumptionTrendsPage />} />
                  <Route path="/distribution" element={<DistributionPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <OfflineIndicator />
    </BrowserRouter>
  );
}

export default App;
