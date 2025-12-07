
import { Product, User, UserRole, DEFAULT_PRODUCT_CATEGORIES } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin User', role: UserRole.ADMIN, pin: '1234' },
  { id: 'u2', name: 'Cashier Ali', role: UserRole.EMPLOYEE, pin: '0000' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Wireless Headphones',
    category: 'Electronics',
    brand: 'Sony',
    barcode: '88001',
    sku: 'EL-001',
    buyingPrice: 80,
    sellingPrice: 120,
    quantity: 15,
    minStockLevel: 5,
    imageUrl: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: 'p2',
    name: 'USB-C Cable',
    category: 'Accessories',
    brand: 'Anker',
    barcode: '88002',
    sku: 'AC-002',
    buyingPrice: 5,
    sellingPrice: 15,
    quantity: 50,
    minStockLevel: 10,
    imageUrl: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: 'p3',
    name: 'Aviator Sunglasses',
    category: 'Eyeglasses',
    brand: 'RayBan',
    barcode: '88003',
    sku: 'GL-003',
    buyingPrice: 60,
    sellingPrice: 150,
    quantity: 8,
    minStockLevel: 3,
    imageUrl: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: 'p4',
    name: 'Fedora Hat',
    category: 'Hats',
    barcode: '',
    sku: 'HT-004',
    buyingPrice: 10,
    sellingPrice: 35,
    quantity: 12,
    minStockLevel: 4,
    imageUrl: 'https://picsum.photos/200/200?random=4'
  },
  {
    id: 'p5',
    name: 'Smart Watch',
    category: 'Electronics',
    brand: 'Samsung',
    barcode: '88005',
    sku: 'EL-005',
    buyingPrice: 150,
    sellingPrice: 250,
    quantity: 2,
    minStockLevel: 3,
    imageUrl: 'https://picsum.photos/200/200?random=5'
  }
];

export const APP_NAME = "Original Electronics";
export const DEFAULT_CATEGORIES = DEFAULT_PRODUCT_CATEGORIES;
