import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import FloatingActionButton from './FloatingActionButton';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/items', label: '物品', icon: '📦' },
  { path: '/purchase-records', label: '采购历史', icon: '📝' },
  { path: '/consumption-trends', label: '消耗趋势', icon: '📊' },
  { path: '/distribution', label: '物品分布', icon: '📍' },
  { path: '/family', label: '家庭', icon: '👨‍👩‍👧' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isMobile } = useAppStore();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#FBF7F2' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-56 lg:w-64 bg-white min-h-screen flex flex-col fixed md:sticky top-0 left-0 h-screen" style={{ boxShadow: '2px 0 12px rgba(224, 123, 57, 0.15)' }}>
          <div className="p-4 border-b" style={{ borderColor: '#FFECD4' }}>
            <Link to="/" className="block">
              <h1 className="text-lg lg:text-xl font-bold" style={{ color: '#E07B39' }}>HomeKeep</h1>
              <p className="text-xs lg:text-sm" style={{ color: '#C4622A' }}>家庭物品管理助手</p>
            </Link>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1 lg:space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-[10px] transition-all duration-200 text-sm lg:text-base ${
                      location.pathname === item.path
                        ? 'text-white'
                        : 'hover:bg-[#FFF5EB]'
                    }`}
                    style={location.pathname === item.path ? { backgroundColor: '#E07B39', boxShadow: '0 2px 8px rgba(224, 123, 57, 0.2)' } : { color: '#9E4C21' }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t" style={{ borderColor: '#FFECD4' }}>
            <div className="flex items-center gap-2 lg:gap-3 mb-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-medium text-sm lg:text-base" style={{ backgroundColor: '#FFECD4', color: '#E07B39' }}>
                {user?.nickname?.charAt(0) || user?.phone?.charAt(7) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium truncate" style={{ color: '#9E4C21' }}>{user?.nickname || '用户'}</p>
                <p className="text-xs truncate hidden sm:block" style={{ color: '#C4622A' }}>{user?.phone}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full btn-secondary text-xs lg:text-sm"
            >
              退出登录
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-16 md:pb-0">
        {/* Top Header */}
        <header className="bg-white sticky top-0 z-10" style={{ boxShadow: '0 2px 12px rgba(224, 123, 57, 0.15)' }}>
          <div className="px-3 lg:px-4 py-2 lg:py-3 flex items-center gap-2 lg:gap-4 max-w-6xl mx-auto">
            {isMobile && (
              <Link to="/" className="text-base font-bold" style={{ color: '#E07B39' }}>
                HomeKeep
              </Link>
            )}
            <div className="flex-1" />
            {isMobile && (
              <Link to="/family" className="p-2 text-lg">
                👨‍👩‍👧
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 lg:p-4 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white flex justify-around py-2 z-20" style={{ borderTop: '1px solid #FFECD4', boxShadow: '0 -2px 12px rgba(224, 123, 57, 0.1)' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                location.pathname === item.path ? '' : ''
              }`}
              style={{ color: location.pathname === item.path ? '#E07B39' : '#C4622A' }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}