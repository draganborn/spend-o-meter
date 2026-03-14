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
import { useSheetSync } from '../../hooks/useSheetSync';
import { useAuth } from '../../context/AuthProvider';
import { objectsToRows, rowsToObjects, sheetsApi } from '../../services/googleSheets';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STORAGE_KEY = 'financeData';
const INITIAL_PAYMENTS = 3;
const PAYMENT_RANGE = 'Payments!A:H';
const PAYMENT_HEADERS = [
  'ID_required_pay',
  'name',
  'amount',
  'start_date',
  'end_date',
  'frequency',
  'last_paid_at',
  'is_active',
];
const ALL_MONEY_CELL = 'Payments!I1';
const NEXT_PAY_DATE_CELL = 'Payments!I2';

const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const defaultPayment = () => ({
  id: generateId(),
  name: '',
  amount: '',
  completed: false,
});

const normalizePayments = source => {
  if (Array.isArray(source) && source.length) {
    return source.map(p => ({
      id: p.id || generateId(),
      name: p.name || '',
      amount: p.amount ?? '',
      completed: Boolean(p.completed),
    }));
  }

  if (Array.isArray(source?.payments) && source.payments.length) {
    return source.payments.map(p => ({
      id: p.id || generateId(),
      name: p.name || '',
      amount: p.amount ?? '',
      completed: Boolean(p.completed),
    }));
  }

  return Array.from({ length: INITIAL_PAYMENTS }, defaultPayment);
};

const paymentsFromSheet = values => {
  const rows = rowsToObjects(values, PAYMENT_HEADERS);
  if (!rows.length) return [];
  return rows.map(row => ({
    id: row.ID_required_pay || generateId(),
    name: row.name || '',
    amount: row.amount ?? '',
    completed: `${row.is_active}`.toLowerCase() === 'true',
  }));
};

const paymentsToSheet = items => [
  PAYMENT_HEADERS,
  ...objectsToRows(
    items.map(item => ({
      ID_required_pay: item.id || generateId(),
      name: item.name || '',
      amount: item.amount ?? '',
      start_date: '',
      end_date: '',
      frequency: '',
      last_paid_at: '',
      is_active: item.completed ? 'TRUE' : 'FALSE',
    })),
    PAYMENT_HEADERS,
  ),
];

export function FinanceCalculator() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { accessToken, googleSub } = useAuth();
  const [allMoney, setAllMoney] = useState('');
  const [nextPayDate, setNextPayDate] = useState('');
  const [payments, setPayments] = useState(() => normalizePayments());
  const [result, setResult] = useState(null);
  const {
    canSync,
    pull: pullPayments,
    push: pushPayments,
    isSyncing,
    syncError,
    hydratedRef,
  } = useSheetSync({
    range: PAYMENT_RANGE,
    mapFromSheet: paymentsFromSheet,
    mapToSheet: paymentsToSheet,
  });
  const writeAllMoney = useCallback(
    async value => {
      if (!canSync) return;
      try {
        if (googleSub) {
          const response = await fetch('/.netlify/functions/sheets-write', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              google_sub: googleSub,
              range: ALL_MONEY_CELL,
              values: [[value ?? '']],
            }),
          });
          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Failed to sync total money via backend');
          }
        } else if (accessToken) {
          await sheetsApi.write(ALL_MONEY_CELL, [[value ?? '']], accessToken);
        }
      } catch (error) {
        console.warn('Failed to sync total money to Google Sheets', error);
        throw error;
      }
    },
    [accessToken, canSync, googleSub],
  );

  const writeNextPayDate = useCallback(
    async value => {
      if (!canSync) return;
      try {
        if (googleSub) {
          const response = await fetch('/.netlify/functions/sheets-write', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              google_sub: googleSub,
              range: NEXT_PAY_DATE_CELL,
              values: [[value ?? '']],
            }),
          });
          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Failed to sync next pay date via backend');
          }
        } else if (accessToken) {
          await sheetsApi.write(NEXT_PAY_DATE_CELL, [[value ?? '']], accessToken);
        }
      } catch (error) {
        console.warn('Failed to sync next pay date to Google Sheets', error);
        throw error;
      }
    },
    [accessToken, canSync, googleSub],
  );

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

  useEffect(() => {
    if (!canSync || hydratedRef.current) return;
    let cancelled = false;
    pullPayments()
      .then(remotePayments => {
        if (!remotePayments || !remotePayments.length || cancelled) return;
        setPayments(normalizePayments(remotePayments));
        safeStorage.setJSON(STORAGE_KEY, {
          allMoney,
          nextPayDate,
          payments: remotePayments,
        });
      })
      .catch(error => {
        console.warn('Failed to load payments from Google Sheets', error);
      });

    return () => {
      cancelled = true;
    };
  }, [canSync, pullPayments, hydratedRef, allMoney, nextPayDate]);

  useEffect(() => {
    if (!canSync) return;
    let cancelled = false;

    const fetchAllMoneyAndDate = async () => {
      try {
        if (googleSub) {
          const [moneyResponse, dateResponse] = await Promise.all([
            fetch('/.netlify/functions/sheets-read', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                google_sub: googleSub,
                range: ALL_MONEY_CELL,
              }),
            }),
            fetch('/.netlify/functions/sheets-read', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                google_sub: googleSub,
                range: NEXT_PAY_DATE_CELL,
              }),
            }),
          ]);

          if (cancelled) return;

          if (moneyResponse.ok) {
            const moneyJson = await moneyResponse.json();
            const moneyValue = moneyJson?.values?.[0]?.[0];
            if (moneyValue !== undefined) {
              setAllMoney(moneyValue);
              const cached = safeStorage.getJSON(STORAGE_KEY) || {};
              safeStorage.setJSON(STORAGE_KEY, { ...cached, allMoney: moneyValue });
            }
          }

          if (dateResponse.ok) {
            const dateJson = await dateResponse.json();
            const dateValue = dateJson?.values?.[0]?.[0];
            if (dateValue !== undefined) {
              setNextPayDate(dateValue);
              const cached = safeStorage.getJSON(STORAGE_KEY) || {};
              safeStorage.setJSON(STORAGE_KEY, { ...cached, nextPayDate: dateValue });
            }
          }
        } else if (accessToken) {
          const [moneyResponse, dateResponse] = await Promise.all([
            sheetsApi.read(ALL_MONEY_CELL, accessToken),
            sheetsApi.read(NEXT_PAY_DATE_CELL, accessToken),
          ]);

          if (cancelled) return;

          const moneyValue = moneyResponse?.values?.[0]?.[0];
          if (moneyValue !== undefined) {
            setAllMoney(moneyValue);
            const cached = safeStorage.getJSON(STORAGE_KEY) || {};
            safeStorage.setJSON(STORAGE_KEY, { ...cached, allMoney: moneyValue });
          }

          const dateValue = dateResponse?.values?.[0]?.[0];
          if (dateValue !== undefined) {
            setNextPayDate(dateValue);
            const cached = safeStorage.getJSON(STORAGE_KEY) || {};
            safeStorage.setJSON(STORAGE_KEY, { ...cached, nextPayDate: dateValue });
          }
        }
      } catch (error) {
        console.warn('Failed to load total money or next pay date from Google Sheets', error);
      }
    };

    fetchAllMoneyAndDate();

    return () => {
      cancelled = true;
    };
  }, [canSync, googleSub, accessToken]);

  const persist = useCallback(
    (next, { sync = false } = {}) => {
      const payload = {
        allMoney: next?.allMoney ?? allMoney,
        nextPayDate: next?.nextPayDate ?? nextPayDate,
        payments: next?.payments ?? payments,
      };
      safeStorage.setJSON(STORAGE_KEY, payload);
      if (sync && canSync) {
        pushPayments(payload.payments).catch(error =>
          console.warn('Failed to sync payments to Google Sheets', error),
        );
        writeAllMoney(payload.allMoney).catch(error =>
          console.warn('Failed to sync total money to Google Sheets', error),
        );
        writeNextPayDate(payload.nextPayDate).catch(error =>
          console.warn('Failed to sync next pay date to Google Sheets', error),
        );
      }
    },
    [allMoney, nextPayDate, payments, canSync, pushPayments, writeAllMoney, writeNextPayDate],
  );

  const handlePaymentChange = (id, field, value) => {
    setPayments(prev => {
      const updated = prev.map(payment =>
        payment.id === id ? { ...payment, [field]: value } : payment,
      );
      persist({ payments: updated }, { sync: true });
      return updated;
    });
  };

  const togglePaymentCompleted = id => {
    setPayments(prev => {
      const updated = prev.map(payment =>
        payment.id === id ? { ...payment, completed: !payment.completed } : payment,
      );
      persist({ payments: updated }, { sync: true });
      return updated;
    });
  };

  const addPayment = () => {
    setPayments(prev => {
      const updated = [...prev, defaultPayment()];
      persist({ payments: updated }, { sync: true });
      return updated;
    });
  };

  const removePayment = id => {
    setPayments(prev => {
      const updated = prev.filter(payment => payment.id !== id);
      persist({ payments: updated }, { sync: true });
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
              persist({ allMoney: e.target.value }, { sync: true });
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
              persist({ nextPayDate: e.target.value }, { sync: true });
            }}
          />
        </div>
      </header>

      <form onSubmit={calculate} className="stack gap-md">
        <div className="section-title">
          <h3>{finance?.paymentsTitle}</h3>
          <button
            type="button"
            className="btn secondary"
            disabled={!canSync || isSyncing}
            onClick={async () => {
              try {
                const remotePayments = await pullPayments();
                if (remotePayments && remotePayments.length) {
                  setPayments(normalizePayments(remotePayments));
                  safeStorage.setJSON(STORAGE_KEY, {
                    allMoney,
                    nextPayDate,
                    payments: remotePayments,
                  });
                }
                if (canSync) {
                  try {
                    if (googleSub) {
                      const [moneyResponse, dateResponse] = await Promise.all([
                        fetch('/.netlify/functions/sheets-read', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            google_sub: googleSub,
                            range: ALL_MONEY_CELL,
                          }),
                        }),
                        fetch('/.netlify/functions/sheets-read', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            google_sub: googleSub,
                            range: NEXT_PAY_DATE_CELL,
                          }),
                        }),
                      ]);

                      if (moneyResponse.ok) {
                        const moneyJson = await moneyResponse.json();
                        const moneyValue = moneyJson?.values?.[0]?.[0];
                        if (moneyValue !== undefined) {
                          setAllMoney(moneyValue);
                          const cached = safeStorage.getJSON(STORAGE_KEY) || {};
                          safeStorage.setJSON(STORAGE_KEY, { ...cached, allMoney: moneyValue });
                        }
                      }

                      if (dateResponse.ok) {
                        const dateJson = await dateResponse.json();
                        const dateValue = dateJson?.values?.[0]?.[0];
                        if (dateValue !== undefined) {
                          setNextPayDate(dateValue);
                          const cached = safeStorage.getJSON(STORAGE_KEY) || {};
                          safeStorage.setJSON(STORAGE_KEY, { ...cached, nextPayDate: dateValue });
                        }
                      }
                    } else if (accessToken) {
                      const [moneyResponse, dateResponse] = await Promise.all([
                        sheetsApi.read(ALL_MONEY_CELL, accessToken),
                        sheetsApi.read(NEXT_PAY_DATE_CELL, accessToken),
                      ]);

                      const moneyValue = moneyResponse?.values?.[0]?.[0];
                      if (moneyValue !== undefined) {
                        setAllMoney(moneyValue);
                        const cached = safeStorage.getJSON(STORAGE_KEY) || {};
                        safeStorage.setJSON(STORAGE_KEY, { ...cached, allMoney: moneyValue });
                      }

                      const dateValue = dateResponse?.values?.[0]?.[0];
                      if (dateValue !== undefined) {
                        setNextPayDate(dateValue);
                        const cached = safeStorage.getJSON(STORAGE_KEY) || {};
                        safeStorage.setJSON(STORAGE_KEY, { ...cached, nextPayDate: dateValue });
                      }
                    }
                  } catch (error) {
                    console.error('Manual sync (sheetsApi) failed', error);
                  }
                }
              } catch (error) {
                console.error('Manual sync (pullPayments) failed', error);
              }
            }}
          >
            {finance?.sync}
          </button>
          {syncError && (
            <small className="warning" role="alert">
              Google Sheets: {syncError}
            </small>
          )}
          {isSyncing && <small>{language === 'ru' ? 'Синхронизация…' : 'Syncing…'}</small>}

        </div>

        <div className="stack gap-sm">
          {payments.map(payment => (
            <div
              className={`payment-entry ${payment.completed ? 'completed' : ''}`}
              key={payment.id}
            >
             <button
                type="button"
                className="icon-btn danger"
                title={finance?.paymentField?.deleteTitle}
                onClick={() => removePayment(payment.id)}
              >
                ×
              </button>
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
 
            </div>
          ))}
                    <button type="button" className="btn secondary" onClick={addPayment}>
            {finance?.addPayment}
          </button>
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
