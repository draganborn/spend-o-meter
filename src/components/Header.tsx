import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const { t, toggleLanguage } = useLanguage();
  const { toggleTheme } = useTheme();

  return (
    <div className="nav">
      <div>
        <button
          id="navMoneyPerMonth"
          className={activeTab === 'money' ? 'active' : ''}
          onClick={() => onTabChange('money')}
        >
          {t.navMoney}
        </button>
        <button
          id="navProductCompare"
          className={activeTab === 'product' ? 'active' : ''}
          onClick={() => onTabChange('product')}
        >
          {t.navProduct}
        </button>
        <button
          id="navFuelCompare"
          className={activeTab === 'fuel' ? 'active' : ''}
          onClick={() => onTabChange('fuel')}
        >
          {t.navFuel}
        </button>
      </div>
      <div>
        <button onClick={toggleTheme} className="moneyPerMonth-btn-theme">
          🌓
        </button>
        <button onClick={toggleLanguage} className="moneyPerMonth-btn-theme">
          🌐
        </button>
      </div>
    </div>
  );
};
