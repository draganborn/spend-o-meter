import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { safeStorage } from '../../hooks/useSafeLocalStorage';
import { useLanguage } from '../../context/AppProviders';
import { useSheetSync } from '../../hooks/useSheetSync';
import { objectsToRows, rowsToObjects } from '../../services/googleSheets';

const STORAGE_KEY = 'cashbackBanks';
const CASHBACK_RANGE = 'Cashback!A:E';
const CASHBACK_HEADERS = [
  'ID_cashback_element',
  'cashbackUserName',
  'bankName',
  'categoryCashBack',
  'percentCashback',
];

const createId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const slugify = value => (value ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');

const normalizeBanks = stored =>
  Array.isArray(stored)
    ? stored.map(bank => ({
        id: bank.id || createId(),
        name: bank.name || '',
        categories: Array.isArray(bank.categories)
          ? bank.categories.map(category => ({
              id: category.id || createId(),
              name: category.name || '',
              percent: Number.isFinite(category.percent) ? category.percent : '',
            }))
          : [],
      }))
    : [];

const cashbackFromSheet = values => {
  const rows = rowsToObjects(values, CASHBACK_HEADERS);
  if (!rows.length) return [];

  const banksMap = new Map();

  rows.forEach(row => {
    const bankName = row.bankName?.trim() || '';
    const bankId = row.cashbackUserName?.trim() || '';
    const bankKey = bankId || slugify(bankName) || `bank-${row.ID_cashback_element || createId()}`;

    if (!banksMap.has(bankKey)) {
      banksMap.set(bankKey, {
        id: bankKey,
        name: bankName,
        categories: [],
      });
    }

    const percent = Number(row.percentCashback);
    const hasCategoryData = row.categoryCashBack || Number.isFinite(percent);

    if (hasCategoryData) {
      banksMap.get(bankKey).categories.push({
        id: row.ID_cashback_element || createId(),
        name: row.categoryCashBack || '',
        percent: Number.isFinite(percent) ? percent : '',
      });
    }
  });

  return normalizeBanks(Array.from(banksMap.values()));
};

const cashbackToSheet = banks => {
  const rows = [];

  banks.forEach(bank => {
    if (!bank.categories.length) {
      rows.push({
        ID_cashback_element: createId(),
        cashbackUserName: bank.id || createId(),
        bankName: bank.name || '',
        categoryCashBack: '',
        percentCashback: '',
      });
      return;
    }

    bank.categories.forEach(category => {
      rows.push({
        ID_cashback_element: category.id || createId(),
        cashbackUserName: bank.id || createId(),
        bankName: bank.name || '',
        categoryCashBack: category.name || '',
        percentCashback: category.percent === '' ? '' : category.percent ?? 0,
      });
    });
  });

  return [CASHBACK_HEADERS, ...objectsToRows(rows, CASHBACK_HEADERS)];
};

export function CashbackPlanner() {
  const { t } = useLanguage();
  const [banks, setBanks] = useState(() => normalizeBanks(safeStorage.getJSON(STORAGE_KEY) || []));
  const [pendingSyncData, setPendingSyncData] = useState(null);
  const syncTimeoutRef = useRef();
  const {
    canSync,
    pull: pullCashback,
    push: pushCashback,
    isSyncing,
    syncError,
    hydratedRef,
  } = useSheetSync({
    range: CASHBACK_RANGE,
    mapFromSheet: cashbackFromSheet,
    mapToSheet: cashbackToSheet,
  });

  const updateBanks = useCallback(
    (updater, { sync = true } = {}) => {
      setBanks(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        safeStorage.setJSON(STORAGE_KEY, next);
        if (sync && canSync) {
          setPendingSyncData(next);
        }
        return next;
      });
    },
    [canSync],
  );

  useEffect(() => {
    if (!canSync || !pendingSyncData) return undefined;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      pushCashback(pendingSyncData)
        .catch(error => console.warn('Failed to sync cashback planner to Google Sheets', error))
        .finally(() => {
          syncTimeoutRef.current = null;
          setPendingSyncData(null);
        });
    }, 1200);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [canSync, pendingSyncData, pushCashback]);

  useEffect(() => () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!canSync || hydratedRef.current) return;
    let cancelled = false;
    pullCashback()
      .then(remoteBanks => {
        if (!remoteBanks || cancelled) return;
        updateBanks(normalizeBanks(remoteBanks), { sync: false });
      })
      .catch(error => {
        console.warn('Failed to load cashback planner from Google Sheets', error);
      });

    return () => {
      cancelled = true;
    };
  }, [canSync, pullCashback, hydratedRef, updateBanks]);

  const addBank = () => {
    updateBanks(prev => [
      ...prev,
      {
        id: createId(),
        name: '',
        categories: [],
      },
    ]);
  };

  const removeBank = id =>
    updateBanks(prev => prev.filter(bank => bank.id !== id));

  const updateBankName = (id, name) =>
    updateBanks(prev => prev.map(bank => (bank.id === id ? { ...bank, name } : bank)));

  const addCategory = bankId =>
    updateBanks(prev =>
      prev.map(bank =>
        bank.id === bankId
          ? {
              ...bank,
              categories: [
                ...bank.categories,
                {
                  id: createId(),
                  name: '',
                  percent: '',
                },
              ],
            }
          : bank,
      ),
    );

  const updateCategory = (bankId, categoryId, field, value) =>
    updateBanks(prev =>
      prev.map(bank =>
        bank.id === bankId
          ? {
              ...bank,
              categories: bank.categories.map(category =>
                category.id === categoryId
                  ? {
                      ...category,
                      [field]:
                        field === 'percent'
                          ? value === ''
                            ? ''
                            : Number(value) || ''
                          : value,
                    }
                  : category,
              ),
            }
          : bank,
      ),
    );

  const removeCategory = (bankId, categoryId) =>
    updateBanks(prev =>
      prev.map(bank =>
        bank.id === bankId
          ? {
              ...bank,
              categories: bank.categories.filter(category => category.id !== categoryId),
            }
          : bank,
      ),
    );

  const cashback = useMemo(() => t('cashback'), [t]);
  const isEmpty = banks.length === 0;

  return (
    <section className="card">
      <header className="section-header">
        <div>
          <h3>{cashback.title}</h3>
          <p>{cashback.empty}</p>
        </div>
        <div className="stack horizontal gap-sm">
          <button
            type="button"
            className="btn secondary"
            disabled={!canSync || isSyncing}
            onClick={async () => {
              try {
                const remoteBanks = await pullCashback();
                if (remoteBanks) {
                  updateBanks(normalizeBanks(remoteBanks), { sync: false });
                }
              } catch (error) {
                console.error('Failed to pull cashback', error);
              }
            }}
          >
            {cashback.sync}
          </button>
          {syncError && (
            <small className="warning" role="alert">
              Google Sheets: {syncError}
            </small>
          )}
          {isSyncing && <small>{t('user.signingIn') ? 'Syncing…' : 'Syncing…'}</small>}
        </div>
      </header>

      {isEmpty ? (
        <p className="empty-state">{cashback.empty}</p>
      ) : (
        <div className="stack gap-md">
          {banks.map(bank => (
            <div className="cashback-bank card" key={bank.id}>
              <div className="bank-header">
                <input
                  type="text"
                  value={bank.name}
                  placeholder={cashback.bankPlaceholder}
                  onChange={e => updateBankName(bank.id, e.target.value)}
                />
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => removeBank(bank.id)}
                >
                  {cashback.deleteBank}
                </button>
              </div>

              <div className="categories-list">
                {bank.categories.map(category => (
                  <div className="category-row" key={category.id}>
                    <input
                      type="text"
                      value={category.name}
                      placeholder={cashback.categoryPlaceholder}
                      onChange={e => updateCategory(bank.id, category.id, 'name', e.target.value)}
                    />
                    <div className="percent-input">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={category.percent}
                        onChange={e =>
                          updateCategory(bank.id, category.id, 'percent', e.target.value)
                        }
                        placeholder={cashback.percentPlaceholder}
                      />
                      <span>{cashback.percentSymbol}</span>
                    </div>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => removeCategory(bank.id, category.id)}
                    >
                      {cashback.deleteCategory}
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={() => addCategory(bank.id)}
              >
                {cashback.addCategory}
              </button>
            </div>
          ))}
        </div>
      )}
              <button type="button" className="btn secondary" onClick={addBank}>
          {cashback.addBank}
        </button>
    </section>
  );
}
