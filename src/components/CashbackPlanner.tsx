import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserCashback, BankCashback, CashbackCategory, CashbackData } from '../types';

export const CashbackPlanner = () => {
  const { t } = useLanguage();
  const [cashbackData, setCashbackData] = useState<CashbackData>(() => {
    const saved = localStorage.getItem('cashbackData');
    if (saved) {
      return JSON.parse(saved);
    }
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    
    return {
      month: monthStr,
      users: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('cashbackData', JSON.stringify(cashbackData));
  }, [cashbackData]);

  const addUser = () => {
    const newUser: UserCashback = {
      id: crypto.randomUUID(),
      userName: '',
      banks: [],
    };
    setCashbackData({
      ...cashbackData,
      users: [...cashbackData.users, newUser],
    });
  };

  const removeUser = (userId: string) => {
    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.filter(u => u.id !== userId),
    });
  };

  const updateUserName = (userId: string, name: string) => {
    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.map(u =>
        u.id === userId ? { ...u, userName: name } : u
      ),
    });
  };

  const addBank = (userId: string) => {
    const newBank: BankCashback = {
      id: crypto.randomUUID(),
      bankName: '',
      categories: [],
    };
    
    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.map(u =>
        u.id === userId
          ? { ...u, banks: [...u.banks, newBank] }
          : u
      ),
    });
  };

  const removeBank = (userId: string, bankId: string) => {
    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.map(u =>
        u.id === userId
          ? { ...u, banks: u.banks.filter(b => b.id !== bankId) }
          : u
      ),
    });
  };

  const updateBankName = (userId: string, bankId: string, name: string) => {
    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.map(u =>
        u.id === userId
          ? {
              ...u,
              banks: u.banks.map(b =>
                b.id === bankId ? { ...b, bankName: name } : b
              ),
            }
          : u
      ),
    });
  };

  const addCategory = (userId: string, bankId: string) => {
    const newCategory: CashbackCategory = {
      id: crypto.randomUUID(),
      name: '',
      percentage: 0,
    };

    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.map(u =>
        u.id === userId
          ? {
              ...u,
              banks: u.banks.map(b =>
                b.id === bankId
                  ? { ...b, categories: [...b.categories, newCategory] }
                  : b
              ),
            }
          : u
      ),
    });
  };

  const removeCategory = (userId: string, bankId: string, categoryId: string) => {
    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.map(u =>
        u.id === userId
          ? {
              ...u,
              banks: u.banks.map(b =>
                b.id === bankId
                  ? { ...b, categories: b.categories.filter(c => c.id !== categoryId) }
                  : b
              ),
            }
          : u
      ),
    });
  };

  const updateCategory = (
    userId: string,
    bankId: string,
    categoryId: string,
    field: 'name' | 'percentage',
    value: string | number
  ) => {
    setCashbackData({
      ...cashbackData,
      users: cashbackData.users.map(u =>
        u.id === userId
          ? {
              ...u,
              banks: u.banks.map(b =>
                b.id === bankId
                  ? {
                      ...b,
                      categories: b.categories.map(c =>
                        c.id === categoryId ? { ...c, [field]: value } : c
                      ),
                    }
                  : b
              ),
            }
          : u
      ),
    });
  };

  const updateMonth = (newMonth: string) => {
    setCashbackData({
      ...cashbackData,
      month: newMonth,
    });
  };

  return (
    <div className="cashback-planner-container">
      <h1 className="cashback-planner-title">{t.cashbackPlanner.title}</h1>

      <div className="month-selector">
        <label>
          Месяц:
          <input
            type="month"
            value={cashbackData.month}
            onChange={(e) => updateMonth(e.target.value)}
          />
        </label>
      </div>

      <div className="users-container">
        {cashbackData.users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-header">
              <input
                type="text"
                className="user-name-input"
                placeholder={t.cashbackPlanner.userPlaceholder}
                value={user.userName}
                onChange={(e) => updateUserName(user.id, e.target.value)}
              />
              <button
                type="button"
                className="delete-btn"
                onClick={() => removeUser(user.id)}
                title="Удалить пользователя"
              >
                ×
              </button>
            </div>

            <div className="banks-container">
              {user.banks.map((bank) => (
                <div key={bank.id} className="bank-card">
                  <div className="bank-header">
                    <input
                      type="text"
                      className="bank-name-input"
                      placeholder={t.cashbackPlanner.bankPlaceholder}
                      value={bank.bankName}
                      onChange={(e) => updateBankName(user.id, bank.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="delete-btn-small"
                      onClick={() => removeBank(user.id, bank.id)}
                      title="Удалить банк"
                    >
                      ×
                    </button>
                  </div>

                  <div className="categories-container">
                    {bank.categories.map((category) => (
                      <div key={category.id} className="category-row">
                        <input
                          type="text"
                          className="category-name-input"
                          placeholder={t.cashbackPlanner.categoryPlaceholder}
                          value={category.name}
                          onChange={(e) =>
                            updateCategory(user.id, bank.id, category.id, 'name', e.target.value)
                          }
                        />
                        <div className="percentage-input-wrapper">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="category-percentage-input"
                            placeholder="0"
                            value={category.percentage || ''}
                            onChange={(e) =>
                              updateCategory(
                                user.id,
                                bank.id,
                                category.id,
                                'percentage',
                                Number(e.target.value)
                              )
                            }
                          />
                          <span className="percentage-symbol">%</span>
                        </div>
                        <button
                          type="button"
                          className="delete-btn-tiny"
                          onClick={() => removeCategory(user.id, bank.id, category.id)}
                          title="Удалить категорию"
                        >
                          −
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="add-category-btn"
                    onClick={() => addCategory(user.id, bank.id)}
                  >
                    {t.cashbackPlanner.addCategory}
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="add-bank-btn"
                onClick={() => addBank(user.id)}
              >
                {t.cashbackPlanner.addBank}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="add-user-btn" onClick={addUser}>
        {t.cashbackPlanner.addUser}
      </button>
    </div>
  );
};
