export interface Payment {
  id?: string;
  name: string;
  value: number;
  startDate?: string; // ISO yyyy-mm-dd
  endDate?: string;   // ISO yyyy-mm-dd
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
  lastPaidAt?: string; // ISO
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

// Cashback types
export interface CashbackCategory {
  id: string;
  name: string;
  percentage: number;
}

export interface BankCashback {
  id: string;
  bankName: string;
  categories: CashbackCategory[];
}

export interface UserCashback {
  id: string;
  userName: string;
  banks: BankCashback[];
}

export interface CashbackData {
  month: string; // Format: YYYY-MM
  users: UserCashback[];
}
