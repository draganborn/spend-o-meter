import { useState, useEffect, type FormEvent } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Payment, FinanceData } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const FinanceCalculator = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [allMoney, setAllMoney] = useState(0);
  const [nextPayDate, setNextPayDate] = useState('');
  const [payments, setPayments] = useState<Payment[]>([
    { name: '', value: 0 },
    { name: '', value: 0 },
    { name: '', value: 0 },
  ]);
  const [result, setResult] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('financeData');
    if (saved) {
      const data: FinanceData = JSON.parse(saved);
      setAllMoney(data.allMoney);
      setNextPayDate(data.nextPayDate);
      setPayments(data.payments);
    }
  }, []);

  const addPayment = () => {
    setPayments([...payments, { name: '', value: 0 }]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index: number, field: 'name' | 'value', value: string | number) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const today = new Date();
    const payDate = new Date(nextPayDate || new Date().setMonth(new Date().getMonth() + 1));
    const daysLeft = Math.max(1, Math.ceil((payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const total = payments.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
    const free = allMoney - total;
    const perDay = free > 0 ? Math.floor(free / daysLeft) : 0;

    let html = `<p>${t.financeResult.totalMoney}: <strong>${allMoney}</strong></p>
      <p>${t.financeResult.totalPayments}: <strong>${total}</strong></p>`;

    if (free < 0) {
      html += `<p style="color:red;">${t.financeResult.needReturn}: <strong>${-free}</strong></p>`;
    } else {
      html += `<p>${t.financeResult.freeMoney}: <strong>${free}</strong></p>
         <p>${t.financeResult.dailySpend}: <strong>${perDay}</strong> (${t.financeResult.untilDate} ${payDate.toLocaleDateString(
        language === 'ru' ? 'ru-RU' : 'en-US'
      )}, ${daysLeft} ${t.financeResult.daysLeft})</p>`;
    }

    setResult(html);

    const isDark = theme === 'dark';
    setChartData({
      labels: payments.map((p) => p.name || t.chart.unnamed),
      datasets: [
        {
          label: t.chart.label,
          data: payments.map((p) => p.value),
          backgroundColor: isDark ? '#0056b3' : '#007bff',
        },
      ],
    });

    localStorage.setItem(
      'financeData',
      JSON.stringify({ allMoney, nextPayDate, payments })
    );
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: theme === 'dark' ? '#f1f1f1' : '#333' },
      },
      x: {
        ticks: { color: theme === 'dark' ? '#f1f1f1' : '#333' },
      },
    },
    plugins: {
      legend: {
        labels: { color: theme === 'dark' ? '#f1f1f1' : '#333' },
      },
    },
  };

  return (
    <div className="moneyPerMonth-container">
      <h1 className="moneyPerMonth-h1">{t.moneyTitle}</h1>

      <form id="financeForm" className="moneyPerMonth-form" onSubmit={handleSubmit}>
        <label id="allMyMoneyLabel">
          {t.allMyMoneyLabel}:
          <input
            type="number"
            step="0.01"
            value={allMoney}
            onChange={(e) => setAllMoney(Number(e.target.value))}
          />
        </label>

        <h3 className="moneyPerMonth-h3">{t.paymentsTitle}</h3>

        <div id="paymentsContainer">
          {payments.map((payment, index) => (
            <div key={index} className="payment-entry">
              <input
                type="text"
                placeholder={t.paymentField.namePlaceholder}
                value={payment.name}
                onChange={(e) => updatePayment(index, 'name', e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder={t.paymentField.amountPlaceholder}
                value={payment.value || ''}
                onChange={(e) => updatePayment(index, 'value', Number(e.target.value))}
                required
              />
              <button
                type="button"
                title={t.paymentField.deleteTitle}
                onClick={() => removePayment(index)}
              >
                −
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="add-payment-btn" onClick={addPayment}>
          {t.addPayment}
        </button>

        <label id="nextDate">
          {t.nextDate}:
          <input
          className="nextDate-input"
            type="date"
            value={nextPayDate}
            onChange={(e) => setNextPayDate(e.target.value)}
          />
        </label>

        <button type="submit" className="calculate-btn">
          {t.submitCalc}
        </button>
      </form>

      {result && (
        <div
          id="moneyPerMonthResult"
          style={{ display: 'block' }}
          dangerouslySetInnerHTML={{ __html: result }}
        />
      )}

      {chartData && <Bar data={chartData} options={chartOptions} />}
    </div>
  );
};
