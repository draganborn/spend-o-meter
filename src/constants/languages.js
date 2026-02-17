export const LANGUAGES = {
  ru: {
    nav: {
      money: 'Калькулятор финансов',
      product: 'Сравнение товаров',
      fuel: 'Сравнение АЗС',
      favorites: 'Избранное',
      cashback: 'Планировщик кэшбэка',
    },
    finance: {
      title: 'Калькулятор финансов',
      allMoneyLabel: 'Все деньги на счете',
      nextDateLabel: 'Дата следующего поступления',
      paymentsTitle: 'Обязательные платежи',
      sync: 'Обновить из Google Sheets',
      addPayment: '+ Добавить платеж',
      submit: 'Рассчитать',
      paymentField: {
        namePlaceholder: 'Название',
        amountPlaceholder: 'Сумма',
        deleteTitle: 'Удалить платеж',
      },
      result: {
        totalMoney: 'На сегодняшний день все деньги',
        totalPayments: 'Общая сумма обязательных платежей',
        needReturn: 'Необходимо вернуть на счёт',
        freeMoney: 'Свободных денег',
        dailySpend: 'Можно тратить ежедневно',
        daysLeft: 'дн.',
        untilDate: 'до',
      },
    },
    product: {
      title: 'Сравнение товаров',
      addButton: '+ Товар',
      compareButton: 'Сравнить',
      field: {
        nameLabel: 'Название',
        namePlaceholder: 'Название',
        priceLabel: 'Цена (₽)',
        weightLabel: 'Вес/Количество',
      },
      result: {
        better: 'Выгоднее',
        moreExpensive: 'дороже на',
        perUnit: '₽/ед.',
      },
    },
    fuel: {
      title: 'Сравнение АЗС',
      addButton: '+ АЗС',
      compareButton: 'Сравнить',
      field: {
        typeLabel: 'Название АЗС',
        priceLabel: 'Цена за литр (₽)',
        discountLabel: 'Тип скидки',
        cashbackLabel: 'Процент кэшбэка',
        fixedLabel: 'Скидка в ₽',
        options: ['АИ-92', 'АИ-95', 'АИ-98', 'ДТ'],
        discounts: {
          none: 'Нет',
          cashback: 'Кэшбэк (%)',
          fixed: 'Фиксированная (₽)',
        },
      },
      result: {
        better: 'Выгоднее',
        moreExpensive: 'дороже на',
        perLiter: '₽/л',
      },
    },
    favorites: {
      title: 'Избранные товары',
      empty: 'Пока нет избранных товаров.',
      add: 'В избранное',
      added: 'В избранном',
      remove: 'Удалить',
      clear: 'Очистить избранное',
      fill: 'Введите цену и вес для сравнения',
      priceLabel: 'Цена',
      unitsLabel: 'Единицы',
      perUnit: 'за единицу',
      sync: 'Обновить из Google Sheets',
    },
    cashback: {
      title: 'Планировщик кэшбэка',
      addBank: '+ Банк',
      empty: 'Пока нет добавленных банков.',
      bankPlaceholder: 'Название банка',
      categoryPlaceholder: 'Категория расходов',
      percentPlaceholder: '% кэшбэка',
      addCategory: '+ Категорию',
      deleteBank: 'Удалить банк',
      deleteCategory: 'Удалить',
      percentSymbol: '%',
      sync: 'Обновить из Google Sheets',
    },
    user: {
      welcome: 'Добро пожаловать,',
      signIn: 'Войти через Google',
      signingIn: 'Входим...',
      signOut: 'Выйти',
      prompt: 'Войдите, чтобы синхронизировать настройки на всех устройствах.',
      error: 'Не удалось войти через Google. Попробуйте еще раз.',
      configMissing: 'Добавьте VITE_GOOGLE_CLIENT_ID в .env, чтобы включить вход.',
    },
    alerts: {
      notEnoughProducts: 'Добавьте минимум два товара.',
      notEnoughStations: 'Добавьте минимум две АЗС.',
    },
    chart: {
      label: 'Расходы',
      unnamed: 'Без названия',
    },
  },
  en: {
    nav: {
      money: 'Finance Calculator',
      product: 'Product Comparison',
      fuel: 'Gas Station Comparison',
      favorites: 'Favorites',
      cashback: 'Cashback Planner',
    },
    finance: {
      title: 'Finance Calculator',
      allMoneyLabel: 'All money on account',
      nextDateLabel: 'Next income date',
      paymentsTitle: 'Required payments',
      sync: 'Refresh from Google Sheets',
      addPayment: '+ Add Payment',
      submit: 'Calculate',
      paymentField: {
        namePlaceholder: 'Name',
        amountPlaceholder: 'Amount',
        deleteTitle: 'Delete payment',
      },
      result: {
        totalMoney: 'Total money on account',
        totalPayments: 'Total payments',
        needReturn: 'Need to return to account',
        freeMoney: 'Free money',
        dailySpend: 'Daily spend',
        daysLeft: 'days left',
        untilDate: 'until',
      },
    },
    product: {
      title: 'Product Comparison',
      addButton: '+ Product',
      compareButton: 'Compare',
      field: {
        nameLabel: 'Name',
        namePlaceholder: 'Name',
        priceLabel: 'Price',
        weightLabel: 'Weight/Quantity',
      },
      result: {
        better: 'Better',
        moreExpensive: 'more expensive by',
        perUnit: 'money/unit',
      },
    },
    fuel: {
      title: 'Fuel Station Comparison',
      addButton: '+ Station',
      compareButton: 'Compare',
      field: {
        typeLabel: 'Gas station name',
        priceLabel: 'Price per liter',
        discountLabel: 'Discount type',
        cashbackLabel: 'Cashback percentage',
        fixedLabel: 'Money',
        options: ['AI-92', 'AI-95', 'AI-98', 'DT'],
        discounts: {
          none: 'None',
          cashback: 'Cashback (%)',
          fixed: 'Fixed',
        },
      },
      result: {
        better: 'Better',
        moreExpensive: 'more expensive by',
        perLiter: 'money/liter',
      },
    },
    favorites: {
      title: 'Favorite deals',
      empty: 'No favorite products yet.',
      add: 'Add to favorites',
      added: 'In favorites',
      remove: 'Remove',
      clear: 'Clear favorites',
      fill: 'Please enter price and weight first',
      priceLabel: 'Price',
      unitsLabel: 'Units',
      perUnit: 'per unit',
      sync: 'Refresh from Google Sheets',
    },
    cashback: {
      title: 'Cashback planner',
      addBank: '+ Bank',
      empty: 'No banks yet.',
      bankPlaceholder: 'Bank name',
      categoryPlaceholder: 'Category',
      percentPlaceholder: 'Cashback %',
      addCategory: '+ Category',
      deleteBank: 'Delete bank',
      deleteCategory: 'Delete',
      percentSymbol: '%',
      sync: 'Refresh from Google Sheets',
    },
    user: {
      welcome: 'Welcome,',
      signIn: 'Sign in with Google',
      signingIn: 'Signing in...',
      signOut: 'Sign out',
      prompt: 'Sign in to sync settings across devices.',
      error: 'Google sign-in failed. Please try again.',
      configMissing: 'Add VITE_GOOGLE_CLIENT_ID to .env to enable sign-in.',
    },
    alerts: {
      notEnoughProducts: 'Add at least two products.',
      notEnoughStations: 'Add at least two gas stations.',
    },
    chart: {
      label: 'Expenses',
      unnamed: 'Untitled',
    },
  },
};

export const DEFAULT_LANG = 'ru';

export const getText = (path, lang = DEFAULT_LANG) => {
  const segments = path.split('.');
  let value = LANGUAGES[lang];
  for (const segment of segments) {
    if (value && Object.prototype.hasOwnProperty.call(value, segment)) {
      value = value[segment];
    } else {
      console.warn(`Missing translation for path "${path}" in ${lang}`);
      return path;
    }
  }
  return value;
};
