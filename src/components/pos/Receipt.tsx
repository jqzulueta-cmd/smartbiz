'use client';

import { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Sale } from '@/types';

interface ReceiptProps {
  sale: Sale;
  branchName?: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ sale, branchName }, ref) => {
  return (
    <div ref={ref} className="p-6 max-w-xs mx-auto bg-white text-black font-mono text-xs">
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <h2 className="text-lg font-bold">SmartBiz</h2>
        <p className="text-gray-600">{branchName || 'Main Branch'}</p>
        <p className="text-gray-500 mt-1">INVOICE</p>
      </div>

      {/* Sale Info */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between">
          <span>Invoice #:</span>
          <span className="font-semibold">{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(sale.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{sale.cashier?.name || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment:</span>
          <span>{sale.paymentMethod}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
        <div className="flex justify-between font-semibold border-b border-gray-200 pb-1 mb-1">
          <span>ITEM</span>
          <span>TOTAL</span>
        </div>
        {sale.items.map((item) => (
          <div key={item.id} className="mb-2">
            <p className="font-medium">{item.productName}</p>
            <div className="flex justify-between text-gray-600">
              <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT (12%)</span>
          <span>{formatCurrency(sale.taxAmount)}</span>
        </div>
        {Number(sale.discountAmount) > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(sale.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
        {sale.paymentMethod === 'CASH' && (
          <>
            <div className="flex justify-between">
              <span>Cash Tendered</span>
              <span>{formatCurrency(sale.amountTendered || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatCurrency(sale.changeGiven || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center border-t border-dashed border-gray-400 pt-3 mt-3">
        <p>Thank you for your purchase!</p>
        <p className="text-gray-500 mt-1">Powered by SmartBiz</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
