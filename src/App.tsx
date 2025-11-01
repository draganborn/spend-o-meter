import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/Header';
import { FinanceCalculator } from './components/FinanceCalculator';
import { ProductComparison } from './components/ProductComparison';
import { FuelComparison } from './components/FuelComparison';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('money');

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        <div className={`tool-container ${activeTab === 'money' ? 'active' : ''}`}>
          <FinanceCalculator />
        </div>

        <div className={`tool-container ${activeTab === 'product' ? 'active' : ''}`}>
          <ProductComparison />
        </div>

        <div className={`tool-container ${activeTab === 'fuel' ? 'active' : ''}`}>
          <FuelComparison />
        </div>

        <footer className="footer">
          <div className="footer-elements">
            <a
              href="https://etherscan.io/address/0x2cC359a7f7e2a21047Ab3D6e20a6ECEF89D6E80d"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button style={{ backgroundColor: '#6a06a7' }}>donate ETH</button>
            </a>
            <p>© {new Date().getFullYear()} Spend-O-Meter</p>
          </div>
        </footer>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
