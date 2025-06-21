
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../types';
import { SunIcon, MoonIcon, UserCircleIcon, CogIcon, PlusCircleIcon, LoginIcon, LogoutIcon } from './icons/HeroIcons';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-lightCard dark:bg-darkCard shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold flex items-end">
          <span className="text-primary animate-logo-skr text-3xl font-extrabold">СКР</span>
          <span className="ml-1 text-lightText dark:text-darkText">БАРАХОЛКА</span>
        </Link>
        <nav className="flex items-center space-x-3 md:space-x-4">
          <Link to="/post-ad" className="flex items-center text-lightText dark:text-darkText hover:text-primary dark:hover:text-primary-light transition-colors p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
            <PlusCircleIcon className="w-5 h-5 md:w-6 md:h-6 mr-1" />
            <span className="hidden sm:inline">Подать</span>
          </Link>
          
          {user ? (
            <>
              <Link to="/profile" className="flex items-center text-lightText dark:text-darkText hover:text-primary dark:hover:text-primary-light transition-colors p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                <UserCircleIcon className="w-5 h-5 md:w-6 md:h-6 mr-1" />
                 <span className="hidden sm:inline">Профиль</span>
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="flex items-center text-lightText dark:text-darkText hover:text-primary dark:hover:text-primary-light transition-colors p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                  <CogIcon className="w-5 h-5 md:w-6 md:h-6 mr-1" />
                   <span className="hidden sm:inline">Админ</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center text-lightText dark:text-darkText hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Выйти"
              >
                <LogoutIcon className="w-5 h-5 md:w-6 md:h-6 mr-1" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center text-lightText dark:text-darkText hover:text-primary dark:hover:text-primary-light transition-colors p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
              <LoginIcon className="w-5 h-5 md:w-6 md:h-6 mr-1" />
              <span className="hidden sm:inline">Войти</span>
            </Link>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-lightText dark:text-darkText hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            aria-label="Toggle theme"
          >
            {theme === Theme.LIGHT ? (
              <MoonIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            ) : (
              <SunIcon className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
    