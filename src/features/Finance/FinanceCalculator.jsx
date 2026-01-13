import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { safeStorage } from '../../hooks/useSafeLocalStorage';
import { useLanguage, useTheme } from '../../context/AppProviders';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STORAGE_KEY = 'financeData';
const INITIAL_PAYMENTS = 3;

const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const defaultPayment = () => ({
  id: generateId(),
  name: '',
  amount: '',
  completed: false,
});

const normalizePayments = saved =>
  Array.isArray(saved?.payments) && saved.payments.length
    ? saved.payments.map(p => ({
        id: p.id || generateId(),
        name: p.name || '',
        amount: p.amount ?? '',
        completed: Boolean(p.completed),
      }))
    : Array.from({ length: INITIAL_PAYMENTS }, defaultPayment);

export function FinanceCalculator() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [allMoney, setAllMoney] = useState('');
  const [nextPayDate, setNextPayDate] = useState('');
  const [payments, setPayments] = useState(() => normalizePayments());
  const [result, setResult] = useState(null);

  useEffect(() => {
    const saved = safeStorage.getJSON(STORAGE_KEY);
    if (saved) {
      setAllMoney(saved.allMoney ?? '');
      setNextPayDate(saved.nextPayDate ?? '');
      setPayments(normalizePayments(saved));
    } else {
      setPayments(normalizePayments());
    }
  }, []);

  const persist = useCallback(
    next => {
      safeStorage.setJSON(STORAGE_KEY, {
        allMoney: next?.allMoney ?? allMoney,
        nextPayDate: next?.nextPayDate ?? nextPayDate,
        payments: next?.payments ?? payments,
      });
    },
    [allMoney, nextPayDate, payments],
  );

  const handlePaymentChange = (id, field, value) => {
    setPayments(prev => {
      const updated = prev.map(payment =>
        payment.id === id ? { ...payment, [field]: value } : payment,
      );
      persist({ payments: updated });
      return updated;
    });
  };

  const togglePaymentCompleted = id => {
    setPayments(prev => {
      const updated = prev.map(payment =>
        payment.id === id ? { ...payment, completed: !payment.completed } : payment,
      );
      persist({ payments: updated });
      return updated;
    });
  };

  const addPayment = () => {
    setPayments(prev => {
      const updated = [...prev, defaultPayment()];
      persist({ payments: updated });
      return updated;
    });
  };

  const removePayment = id => {
    setPayments(prev => {
      const updated = prev.filter(payment => payment.id !== id);
      persist({ payments: updated });
      return updated.length ? updated : [defaultPayment()];
    });
  };

  const calculate = useCallback(
    event => {
      event?.preventDefault();
      const totalMoney = parseFloat(allMoney) || 0;
      const parsedDate = nextPayDate ? new Date(nextPayDate) : null;
      const today = new Date();
      const fallbackDate = new Date();
      fallbackDate.setMonth(fallbackDate.getMonth() + 1);
      const targetDate = parsedDate && !Number.isNaN(parsedDate)
        ? parsedDate
        : fallbackDate;
      const daysLeft = Math.max(
        1,
        Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)),
      );

      const normalizedPayments = payments.map(payment => ({
        name: payment.name,
        value: parseFloat(payment.amount) || 0,
        completed: Boolean(payment.completed),
      }));

      const activePayments = normalizedPayments.filter(payment => !payment.completed);
      const totalPayments = activePayments.reduce((sum, p) => sum + p.value, 0);
      const freeMoney = totalMoney - totalPayments;
      const perDay = freeMoney > 0 ? Math.floor(freeMoney / daysLeft) : 0;

      setResult({
        totalMoney,
        totalPayments,
        freeMoney,
        perDay,
        daysLeft,
        targetDate,
        payments: activePayments,
      });

      persist();
    },
    [allMoney, nextPayDate, payments, persist],
  );

  useEffect(() => {
    calculate();
  }, [calculate]);

  const chartData = useMemo(() => {
    if (!result?.payments) return null;
    const isDark = theme === 'dark';
    return {
      labels: result.payments.map(p => p.name || t('chart.unnamed')),
      datasets: [
        {
          label: t('chart.label'),
          data: result.payments.map(p => p.value),
          backgroundColor: isDark ? '#2563eb' : '#3b82f6',
        },
      ],
    };
  }, [result, t, theme]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: theme === 'dark' ? '#f3f4f6' : '#111827',
          },
        },
      },
      scales: {
        x: {
          ticks: { color: theme === 'dark' ? '#d1d5db' : '#1f2937' },
        },
        y: {
          beginAtZero: true,
          ticks: { color: theme === 'dark' ? '#d1d5db' : '#1f2937' },
        },
      },
    }),
    [theme],
  );

  const finance = t('finance');

  return (
    <section className="card">
      <header className="section-header">
        <div>
          <p>{finance?.allMoneyLabel}</p>
          <input
            type="number"
            inputMode="decimal"
            value={allMoney}
            onChange={e => {
              setAllMoney(e.target.value);
              persist({ allMoney: e.target.value });
            }}
          />
        </div>
        <div>
          <p>{finance?.nextDateLabel}</p>
          <input
            type="date"
            value={nextPayDate}
            onChange={e => {
              setNextPayDate(e.target.value);
              persist({ nextPayDate: e.target.value });
            }}
          />
        </div>
      </header>

      <form onSubmit={calculate} className="stack gap-md">
        <div className="section-title">
          <h3>{finance?.paymentsTitle}</h3>
          <button type="button" className="btn secondary" onClick={addPayment}>
            {finance?.addPayment}
          </button>
        </div>

        <div className="stack gap-sm">
          {payments.map(payment => (
            <div
              className={`payment-entry ${payment.completed ? 'completed' : ''}`}
              key={payment.id}
            >
              <label className="payment-checkbox">
                <input
                  type="checkbox"
                  checked={payment.completed}
                  onChange={() => togglePaymentCompleted(payment.id)}
                  aria-label="Mark payment as done"
                />
                <span />
              </label>
              <input
                type="text"
                value={payment.name}
                placeholder={finance?.paymentField?.namePlaceholder}
                onChange={e => handlePaymentChange(payment.id, 'name', e.target.value)}
              />
              <input
                type="number"
                inputMode="decimal"
                value={payment.amount}
                placeholder={finance?.paymentField?.amountPlaceholder}
                onChange={e => handlePaymentChange(payment.id, 'amount', e.target.value)}
              />
              <button
                type="button"
                className="icon-btn danger"
                title={finance?.paymentField?.deleteTitle}
                onClick={() => removePayment(payment.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="btn primary">
          {finance?.submit}
        </button>
      </form>

      {result && (
        <div className="result-container">
          <p>
            {finance?.result?.totalMoney}:{' '}
            <strong>{result.totalMoney.toLocaleString(language)}</strong>
          </p>
          <p>
            {finance?.result?.totalPayments}:{' '}
            <strong>{result.totalPayments.toLocaleString(language)}</strong>
          </p>
          {result.freeMoney >= 0 ? (
            <>
              <p>
                {finance?.result?.freeMoney}:{' '}
                <strong>{result.freeMoney.toLocaleString(language)}</strong>
              </p>
              <p>
                {finance?.result?.dailySpend}:{' '}
                <strong>{result.perDay.toLocaleString(language)}</strong>
                {` (${finance?.result?.untilDate} ${result.targetDate.toLocaleDateString(
                  language === 'ru' ? 'ru-RU' : 'en-US',
                )}, ${result.daysLeft} ${finance?.result?.daysLeft})`}
              </p>
            </>
          ) : (
            <p className="warning">
              {finance?.result?.needReturn}:{' '}
              <strong>{Math.abs(result.freeMoney).toLocaleString(language)}</strong>
            </p>
          )}

          {chartData && <Bar data={chartData} options={chartOptions} />}
        </div>
      )}
    </section>
  );
}
