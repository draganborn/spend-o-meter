import { useEffect, useMemo, useState } from 'react';
import { safeStorage } from '../../hooks/useSafeLocalStorage';
import { useLanguage } from '../../context/AppProviders';

const STORAGE_KEY = 'cashbackBanks';

const createId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const normalizeBanks = stored =>
  Array.isArray(stored)
    ? stored.map(bank => ({
        id: bank.id || createId(),
        name: bank.name || '',
        categories: Array.isArray(bank.categories)
          ? bank.categories.map(category => ({
              id: category.id || createId(),
              name: category.name || '',
              percent: Number.isFinite(category.percent) ? category.percent : 0,
            }))
          : [],
      }))
    : [];

export function CashbackPlanner() {
  const { t } = useLanguage();
  const [banks, setBanks] = useState(() =>
    normalizeBanks(safeStorage.getJSON(STORAGE_KEY) || []),
  );

  useEffect(() => {
    safeStorage.setJSON(STORAGE_KEY, banks);
  }, [banks]);

  const addBank = () => {
    setBanks(prev => [
      ...prev,
      {
        id: createId(),
        name: '',
        categories: [],
      },
    ]);
  };

  const removeBank = id => setBanks(prev => prev.filter(bank => bank.id !== id));

  const updateBankName = (id, name) =>
    setBanks(prev => prev.map(bank => (bank.id === id ? { ...bank, name } : bank)));

  const addCategory = bankId =>
    setBanks(prev =>
      prev.map(bank =>
        bank.id === bankId
          ? {
              ...bank,
              categories: [
                ...bank.categories,
                {
                  id: createId(),
                  name: '',
                  percent: 0,
                },
              ],
            }
          : bank,
      ),
    );

  const updateCategory = (bankId, categoryId, field, value) =>
    setBanks(prev =>
      prev.map(bank =>
        bank.id === bankId
          ? {
              ...bank,
              categories: bank.categories.map(category =>
                category.id === categoryId
                  ? {
                      ...category,
                      [field]: field === 'percent' ? Number(value) || 0 : value,
                    }
                  : category,
              ),
            }
          : bank,
      ),
    );

  const removeCategory = (bankId, categoryId) =>
    setBanks(prev =>
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
        <button type="button" className="btn secondary" onClick={addBank}>
          {cashback.addBank}
        </button>
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
    </section>
  );
}
