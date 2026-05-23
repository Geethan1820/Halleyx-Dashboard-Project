import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, LogOut, User as UserIcon, Settings } from 'lucide-react';
import OrdersPage from './pages/OrdersPage';
import DashboardViewPage from './pages/DashboardViewPage';
import DashboardConfigPage from './pages/DashboardConfigPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  if (!user && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    );
  }

  const activeTab = location.pathname.startsWith('/dashboard') 
    ? 'dashboard' 
    : location.pathname.startsWith('/configure') 
      ? 'configure' 
      : 'orders';

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 mr-4 cursor-pointer" onClick={() => navigate('/')}>
              <LayoutDashboard className="text-indigo-600" size={28} />
              <span className="text-xl font-bold tracking-tight text-gray-900">Dashboard Builder</span>
            </div>
            <nav className="flex gap-1">
              <button
                onClick={() => navigate('/orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'orders'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart size={16} />
                Orders
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={() => navigate('/configure')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'configure'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings size={16} />
                Build
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <UserIcon size={14} className="text-indigo-500" />
              {user?.name}
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/dashboard" element={<DashboardViewPage />} />
          <Route path="/configure" element={<DashboardConfigPage />} />
          <Route path="/shared/:id" element={<DashboardViewPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
