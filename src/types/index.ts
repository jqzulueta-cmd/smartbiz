import type { Role, PaymentMethod, TransferStatus } from '@prisma/client';

// ==================== USER & AUTH ====================

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  branchName: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ==================== PRODUCT ====================

export interface Product {
  id: string;
  barcode: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  isActive: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  inventory?: InventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  material: string | null;
  additionalCost: number;
  stockQuantity: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

// ==================== INVENTORY ====================

export interface InventoryItem {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  productName?: string;
  branchName?: string;
}

export interface StockTransfer {
  id: string;
  sourceBranchId: string;
  targetBranchId: string;
  productId: string;
  quantity: number;
  status: TransferStatus;
  sourceBranchName?: string;
  targetBranchName?: string;
  productName?: string;
  requestedBy?: string;
  notes: string | null;
  createdAt: Date;
}

// ==================== SALES & POS ====================

export interface CartItem {
  productId: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  imageUrl?: string | null;
}

export interface CheckoutPayload {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  discountAmount?: number;
  branchId: string;
  cashierId: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  branchId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountTendered: number | null;
  changeGiven: number | null;
  items: SaleItem[];
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ==================== ANALYTICS ====================

export interface KPIData {
  totalRevenue: number;
  grossProfit: number;
  totalStockValue: number;
  stockoutAlerts: number;
  revenueChange: number;
  profitChange: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  transactions: number;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface ProductForecast {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand30d: number;
  recommendedOrder: number;
  dailyForecast: ForecastPoint[];
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
