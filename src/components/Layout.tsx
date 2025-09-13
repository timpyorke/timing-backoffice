import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Coffee,
  ShoppingCart,
  Menu as MenuIcon,
  Settings,
  LogOut,
  User,
  X,
  BarChart3,
  Home,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar size: collapsed (icons only) vs extended (icon + text)
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('sidebar_expanded');
      if (stored !== null) return stored === 'true';
    } catch { }
    return true; // default to extended
  });
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: t('nav.orders'), href: '/orders', icon: ShoppingCart },
    { name: t('nav.menu'), href: '/menu', icon: MenuIcon },
    { name: 'Sales', href: '/sales', icon: BarChart3 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
    { name: 'Logout', href: '/logout', icon: LogOut },
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

  // Page titles are rendered inside each page now.

  const topBarDate = React.useMemo(
    () => new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }),
    [location.pathname]
  );

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_expanded', String(sidebarExpanded));
    } catch { }
  }, [sidebarExpanded]);

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
              {navigation.map((item) => {
                const isLogout = item.href === '/logout';
                const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
                  if (isLogout) {
                    e.preventDefault();
                    if (window.confirm('Log out of the app?')) {
                      handleLogout();
                      setSidebarOpen(false);
                    }
                    return;
                  }
                  setSidebarOpen(false);
                };
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isCurrentPath(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    onClick={handleClick}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        {/* Collapsed = icons only (w-20), Extended = icons + text (w-64) */}
        <div className={`flex flex-col ${sidebarExpanded ? 'md:w-64' : 'md:w-20'} transition-[width] duration-200`}>
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className={`flex items-center ${sidebarExpanded ? 'justify-start' : 'justify-between'} flex-shrink-0 px-4 gap-2`}>
                <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                  <Coffee className="h-8 w-8 text-primary-600" />
                  <span className={`ml-2 text-xl font-bold text-gray-900 ${sidebarExpanded ? 'inline' : 'hidden'}`}>Timing</span>
                </Link>
                <button
                  className="ml-auto text-gray-400 hover:text-gray-600 rounded p-1 transition-colors inline-flex"
                  title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
                  aria-label={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
                  onClick={() => setSidebarExpanded(v => !v)}
                >
                  {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isLogout = item.href === '/logout';
                  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
                    if (isLogout) {
                      e.preventDefault();
                      if (window.confirm('Log out of the app?')) {
                        handleLogout();
                      }
                    }
                  };
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={handleClick}
                      className={`group flex items-center ${sidebarExpanded ? 'justify-start' : 'justify-center'} px-2 py-2 text-sm font-medium rounded-md tap-target ${isCurrentPath(item.href)
                        ? 'bg-primary-600 text-primary-50'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <item.icon className={`h-5 w-5 ${sidebarExpanded ? 'mr-3' : 'mr-0'}`} />
                      <span className={`${sidebarExpanded ? 'inline' : 'hidden'}`}>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden tap-target"
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
                        {topBarDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">


              {/* Language toggle moved to Settings */}

              {/* Notifications removed */}

              {/* User info (logout moved to sidebar) */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name || user?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className={`mx-auto px-4 sm:px-6 md:px-8 ${sidebarExpanded ? 'max-w-7xl' : 'max-w-full'}`}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
