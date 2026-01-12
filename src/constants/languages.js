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
      remove: 'Убрать',
      clear: 'Очистить избранное',
      fill: 'Сначала укажите цену и вес',
      perUnit: '₽/ед.',
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
      perUnit: 'money/unit',
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
