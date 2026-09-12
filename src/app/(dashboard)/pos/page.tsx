'use client';

import { useState, useCallback } from 'react';
import ProductGrid from '@/components/pos/ProductGrid';
import CartSidebar from '@/components/pos/CartSidebar';
import PaymentModal from '@/components/pos/PaymentModal';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import Receipt from '@/components/pos/Receipt';
import type { CartItem, Sale } from '@/types';

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const branchId = 'branch-001';
  const cashierId = 'user-001';

  const handleAddToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQuantity) }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.productId !== productId));
    } else {
      setCart(prev => prev.map(i =>
        i.productId === productId ? { ...i, quantity: Math.min(quantity, i.maxQuantity) } : i
      ));
    }
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.12;

  const handleCheckout = () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setCart([]);
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  return (
    <div className="h-[calc(100vh-3rem)] flex gap-4">
      {/* Product Grid */}
      <div className="flex-1 overflow-hidden">
        <ProductGrid branchId={branchId} onAddToCart={handleAddToCart} />
      </div>

      {/* Cart Sidebar */}
      <div className="w-full sm:w-96 flex-shrink-0">
        <CartSidebar
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        items={cart}
        total={total}
        branchId={branchId}
        cashierId={cashierId}
        onComplete={handlePaymentComplete}
      />

      {/* Hidden Receipt for Printing */}
      {lastSale && (
        <div className="hidden">
          <div ref={receiptRef}>
            <Receipt sale={lastSale} />
          </div>
        </div>
      )}
    </div>
  );
}
