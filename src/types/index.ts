export interface Payment {
  name: string;
  value: number;
}

export interface Product {
  name: string;
  price: number;
  weight: number;
}

export interface FuelStation {
  name: string;
  price: number;
  discountType: 'none' | 'cashback' | 'fixed';
  cashback: number;
  fixed: number;
  finalPrice: number;
}

export interface FinanceData {
  allMoney: number;
  nextPayDate: string;
  payments: Payment[];
}

export type Language = 'ru' | 'en';
export type Theme = 'light' | 'dark';
