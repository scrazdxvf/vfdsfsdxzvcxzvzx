
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginIcon, UserPlusIcon } from '../components/icons/HeroIcons';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // For signup
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSigningUp) {
        if (!username.trim()) {
            setError("Пожалуйста, введите имя пользователя.");
            setLoading(false);
            return;
        }
        await auth.signup(email, password, username);
      } else {
        await auth.login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка входа/регистрации.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8 bg-lightCard dark:bg-darkCard p-8 sm:p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary dark:text-primary-light">
            {isSigningUp ? 'Создать аккаунт' : 'Войти в аккаунт'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {isSigningUp && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Имя пользователя
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-800"
                  placeholder="Username"
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email адрес
            </label>
            <div className="mt-1">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-800"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Пароль
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSigningUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-800"
                placeholder="********"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-3 rounded-md text-center">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isSigningUp ? 
                    <UserPlusIcon className="h-5 w-5 text-primary-light group-hover:text-primary-dark" aria-hidden="true" />
                    :
                    <LoginIcon className="h-5 w-5 text-primary-light group-hover:text-primary-dark" aria-hidden="true" />
                }
              </span>
              {loading ? 'Обработка...' : (isSigningUp ? 'Зарегистрироваться' : 'Войти')}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <button
            onClick={() => {
                setIsSigningUp(!isSigningUp);
                setError(null); // Clear error on mode switch
            }}
            className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-darker transition-colors"
          >
            {isSigningUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            (Логин: user@example.com или admin@example.com, пароль: любой)
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
    