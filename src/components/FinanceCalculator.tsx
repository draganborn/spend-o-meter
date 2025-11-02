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
  const [isLoading, setIsLoading] = useState(false);
  const scriptUrl = (import.meta as any).env?.VITE_GSHEET_API_URL || '';
  const scriptKey = (import.meta as any).env?.VITE_GSHEET_API_KEY || '';

  useEffect(() => {
    const saved = localStorage.getItem('financeData');
    if (saved) {
      const data: FinanceData = JSON.parse(saved);
      setAllMoney(data.allMoney);
      setNextPayDate(data.nextPayDate);
      setPayments(data.payments);
    }
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!scriptUrl) return;
      try {
        setIsLoading(true);
        const url = new URL(scriptUrl);
        url.searchParams.set('action', 'list');
        if (scriptKey) url.searchParams.set('key', scriptKey);
        const res = await fetch(url.toString());
        const json = await res.json();
        if (Array.isArray(json.payments)) {
          const mapped = json.payments.map((p: any) => ({
            id: p.id ?? crypto.randomUUID(),
            name: (p.name ?? '').toString(),
            value: Number(p.amount) || 0,
            startDate: ((p.startDate ?? p.start_date ?? '') + '').trim().slice(0, 10),
            endDate: ((p.endDate ?? p.end_date ?? '') + '').trim().slice(0, 10),
            frequency: (p.frequency ?? 'monthly') as any,
            isActive: (p.isActive ?? p.is_active) as any,
            lastPaidAt: ((p.lastPaidAt ?? p.last_paid_at ?? '') + '').trim(),
          }));
          setPayments(mapped);
        }
      } catch (e) {
        console.error('fetch payments failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, [scriptUrl]);

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

  // const monthKey = () => {
  //   const d = new Date();
  //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // };

  const isPaidThisMonth = (p: Payment) => {
    if (!p.lastPaidAt) return false;
    const d = new Date(p.lastPaidAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const parseDate = (input?: string): Date | null => {
    const raw = (input || '').toString().trim();
    if (!raw) return null;
    // YYYY-MM or YYYY-MM-DD
    let m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (m) {
      const y = Number(m[1]);
      const mm = Number(m[2]);
      const dd = m[3] ? Number(m[3]) : 1;
      const d = new Date(Date.UTC(y, mm - 1, dd));
      return isNaN(d.getTime()) ? null : d;
    }
    // DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
    m = raw.match(/^(\d{2})[.\/-](\d{2})[.\/-](\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const y = Number(m[3]);
      const d = new Date(Date.UTC(y, mm - 1, dd));
      return isNaN(d.getTime()) ? null : d;
    }
    // Fallback native parsing
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const monthsRemaining = (end?: string) => {
    const e = parseDate(end);
    if (!e) return undefined;
    const today = new Date();
    const m = (e.getUTCFullYear() - today.getFullYear()) * 12 + (e.getUTCMonth() - today.getMonth());
    return m >= 0 ? m : 0;
  };

  const nextDueDate = (p: Payment) => {
    const start = parseDate(p.startDate);
    if (!start) return undefined;
    const now = new Date();
    const f = p.frequency || 'monthly';
    const d = new Date(start.getTime());
    // work in local months; result displayed as YYYY-MM
    while (d < now) {
      if (f === 'yearly') d.setMonth(d.getMonth() + 12);
      else if (f === 'quarterly') d.setMonth(d.getMonth() + 3);
      else d.setMonth(d.getMonth() + 1);
    }
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  };

  const formatYYYYMM = (dateStr?: string) => {
    const d = parseDate(dateStr);
    if (!d) return (dateStr || '').toString().trim().slice(0, 7);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  };

  const markAsPaid = async (p: Payment) => {
    const paidAt = new Date().toISOString();
    setPayments((prev) => prev.map((x) => (x.name === p.name && x.value === p.value ? { ...x, lastPaidAt: paidAt } : x)));
    if (!scriptUrl || !p.id) return;
    try {
      const url = new URL(scriptUrl);
      url.searchParams.set('action', 'markPaid');
      url.searchParams.set('id', String(p.id));
      url.searchParams.set('paidAt', paidAt);
      if (scriptKey) url.searchParams.set('key', scriptKey);
      await fetch(url.toString(), { method: 'GET' });
    } catch (e) {
      console.error('markPaid failed', e);
    }
  };

  const unmarkAsPaid = async (p: Payment) => {
    setPayments((prev) => prev.map((x) => (x.name === p.name && x.value === p.value ? { ...x, lastPaidAt: undefined } : x)));
    if (!scriptUrl || !p.id) return;
    try {
      const url = new URL(scriptUrl);
      url.searchParams.set('action', 'unmarkPaid');
      url.searchParams.set('id', String(p.id));
      if (scriptKey) url.searchParams.set('key', scriptKey);
      await fetch(url.toString(), { method: 'GET' });
    } catch (e) {
      console.error('unmarkPaid failed', e);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const today = new Date();
    const payDate = new Date(nextPayDate || new Date().setMonth(new Date().getMonth() + 1));
    const daysLeft = Math.max(1, Math.ceil((payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const unpaidPayments = payments.filter((p) => !isPaidThisMonth(p));
    const total = unpaidPayments.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
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
      labels: unpaidPayments.map((p) => p.name || t.chart.unnamed),
      datasets: [
        {
          label: t.chart.label,
          data: unpaidPayments.map((p) => p.value),
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
          {isLoading && (
            <div className="card" style={{ padding: 10, marginBottom: 10 }}>
              {language === 'ru' ? 'Загрузка платежей…' : 'Loading payments…'}
            </div>
          )}
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
              <input
              className='payingCheck'
                type="checkbox"
                checked={isPaidThisMonth(payment)}
                onChange={() => (isPaidThisMonth(payment) ? unmarkAsPaid(payment) : markAsPaid(payment))}
                title={language === 'ru' ? 'Оплачено в этом месяце' : 'Paid this month'}
              />
              <span className='monthsLeft' style={{ fontSize: 12, opacity: 0.8 }}>
                {monthsRemaining(payment.endDate) !== undefined
                  ? (language === 'ru' ? 'Осталось мес.: ' : 'Months left: ') + monthsRemaining(payment.endDate)
                  : payment.endDate
                  ? (language === 'ru' ? 'Окончание: ' : 'Ends: ') + formatYYYYMM(payment.endDate)
                  : nextDueDate(payment)
                  ? (language === 'ru' ? 'Следующий платёж: ' : 'Next due: ') + nextDueDate(payment)
                  : ''}
              </span>
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
