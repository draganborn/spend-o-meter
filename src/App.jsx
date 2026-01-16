import { useCallback, useMemo, useState } from 'react';
import { useLanguage, useTheme } from './context/AppProviders';
import { useAuth } from './context/AuthProvider';
import { FinanceCalculator } from './features/Finance/FinanceCalculator';
import { ProductComparator } from './features/Products/ProductComparator';
import { FuelComparator } from './features/Fuel/FuelComparator';
import { CashbackPlanner } from './features/Cashback/CashbackPlanner';

const DONATE_URL = 'https://etherscan.io/address/0x2cC359a7f7e2a21047Ab3D6e20a6ECEF89D6E80d';

function App() {
  const { t, toggleLanguage, language } = useLanguage();
  const { toggleTheme, theme } = useTheme();
  const { user, isAuthenticated, login, logout, isAuthLoading, error } = useAuth();
  const [activeSection, setActiveSection] = useState('finance');
  const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleLogin = useCallback(() => {
    if (!isGoogleConfigured || isAuthLoading) return;
    login();
  }, [isGoogleConfigured, isAuthLoading, login]);

  const sections = useMemo(
    () => [
      {
        id: 'finance',
        label: t('nav.money'),
        node: <FinanceCalculator />,
      },
      {
        id: 'product',
        label: t('nav.product'),
        node: <ProductComparator />,
      },
      {
        id: 'fuel',
        label: t('nav.fuel'),
        node: <FuelComparator />,
      },
      {
        id: 'cashback',
        label: t('nav.cashback'),
        node: <CashbackPlanner />,
      },
    ],
    [t],
  );

  const currentSection = sections.find(section => section.id === activeSection) || sections[0];

  return (
    <div className="app-shell">
      <section className="hero-card">
        <div className="hero-primary">
          <p>{t('nav.money')}</p>
          <h1>Spend-O-Meter</h1>
          <p>
            {language === 'ru'
              ? 'Управляйте личными финансами, сравнивайте цены и планируйте кэшбэк в одном современном приложении.'
              : 'Control your finances, compare deals, and plan cashback in a single, modern dashboard.'}
          </p>
          <div className="controls">
            <button type="button" className="btn secondary" onClick={toggleLanguage}>
              {language === 'ru' ? 'Switch to English' : 'Переключить на Русский'}
            </button>
            <button type="button" className="btn primary" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
            </button>
            <a href={DONATE_URL} target="_blank" rel="noreferrer" className="btn secondary">
              Donate ETH
            </a>
          </div>
        </div>
        <div className="auth-card">
          {isAuthenticated ? (
            <>
              <div className="user-meta">
                {user?.picture && <img src={user.picture} alt={user?.name} />}
                <div>
                  <p className="eyebrow">{t('user.welcome')}</p>
                  <strong>{user?.givenName || user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
              <button type="button" className="btn secondary" onClick={logout}>
                {t('user.signOut')}
              </button>
            </>
          ) : (
            <>
              <p>{t('user.prompt')}</p>
              {error && (
                <small className="warning" role="alert">
                  {t('user.error')}
                </small>
              )}
              {!isGoogleConfigured && (
                <small className="warning" role="alert">
                  {t('user.configMissing')}
                </small>
              )}
              <button
                type="button"
                className="btn primary"
                onClick={handleLogin}
                disabled={!isGoogleConfigured || isAuthLoading}
              >
                {isAuthLoading ? t('user.signingIn') : t('user.signIn')}
              </button>
            </>
          )}
        </div>
      </section>

      <nav className="nav">
        {sections.map(section => (
          <button
            key={section.id}
            type="button"
            className={section.id === currentSection.id ? 'active' : ''}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="grid-tabs">{currentSection.node}</div>

      <footer className="section-header" style={{ marginTop: '48px' }}>
        <div>
          <strong>© {new Date().getFullYear()} Spend-O-Meter</strong>
          <p style={{ opacity: 0.7, margin: '4px 0 0' }}>
            {language === 'ru'
              ? 'Создано для контроля расходов и осознанного управления бюджетом.'
              : 'Built for mindful budgeting and confident spending decisions.'}
          </p>
        </div>
        <small>{language === 'ru' ? 'Открытый исходный код' : 'Open-source project'}</small>
      </footer>
    </div>
  );
}

export default App;
