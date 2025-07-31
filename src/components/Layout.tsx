import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Coffee,
  ShoppingCart,
  Menu as MenuIcon,
  TrendingUp,
  Settings,
  Bell,
  LogOut,
  User,
  X,
  Volume2,
  VolumeX,
  Languages,
} from 'lucide-react';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { unreadCount, markAsRead, soundEnabled, toggleSound } = useNotifications();
  const location = useLocation();

  const navigation = [
    { name: t('nav.orders'), href: '/orders', icon: ShoppingCart },
    { name: t('nav.menu'), href: '/menu', icon: MenuIcon },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path || (path === '/' && location.pathname === '/');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <Link to="/" className="flex-shrink-0 flex items-center px-4 hover:opacity-80 transition-opacity">
              <Coffee className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Timing</span>
            </Link>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isCurrentPath(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-4 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <Link to="/" className="flex items-center flex-shrink-0 px-4 hover:opacity-80 transition-opacity">
                <Coffee className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Timing</span>
              </Link>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isCurrentPath(item.href)
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {t('header.dashboard')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Language toggle */}
              <button
                onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex items-center space-x-1"
                title="Switch language"
              >
                <Languages className="h-5 w-5" />
                <span className="text-sm font-medium">{language === 'th' ? 'TH' : 'EN'}</span>
              </button>

              {/* Sound toggle */}
              <button
                onClick={() => toggleSound(!soundEnabled)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                title={soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              <button
                onClick={markAsRead}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;