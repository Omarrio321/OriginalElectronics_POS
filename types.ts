
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

// We keep this for backward compatibility and defaults, but the interface uses string
export const DEFAULT_PRODUCT_CATEGORIES = [
  'Electronics',
  'Accessories',
  'Eyeglasses',
  'Hats',
  'Other'
];

export interface Product {
  id: string;
  name: string;
  category: string; // Changed from enum to string to support custom categories
  brand?: string;
  barcode: string;
  sku: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
  supplier?: string;
  imageUrl?: string;
}

export interface Discount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export interface CartItem extends Product {
  cartQuantity: number;
  discount?: Discount;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: Discount;
  subtotal: number; // Final subtotal after discount
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: SaleItem[];
  subtotal: number; // Before global discount
  discount?: Discount; // Global cart discount
  totalAmount: number; // Final paid amount
  paymentMethod: 'CASH' | 'ZAAD' | 'EDAHAB';
  cashierId: string;
  cashierName: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'LOGIN' | 'LOGOUT' | 'SALE' | 'INVENTORY_ADD' | 'INVENTORY_UPDATE' | 'INVENTORY_DELETE' | 'EXPENSE_ADD' | 'EXPENSE_DELETE' | 'USER_UPDATE' | 'USER_DELETE' | 'DATA_RESTORE';
  details: string;
  timestamp: string;
}
