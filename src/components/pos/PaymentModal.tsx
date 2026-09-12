'use client';

import { useState } from 'react';
import { X, Banknote, Smartphone, CreditCard, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { CartItem, PaymentMethod } from '@/types';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  branchId: string;
  cashierId: string;
  onComplete: () => void;
}

export default function PaymentModal({ open, onClose, items, total, branchId, cashierId, onComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tendered = parseFloat(amountTendered) || 0;
  const change = tendered - total;

  const paymentMethods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'GCASH', label: 'GCash', icon: Smartphone },
    { value: 'PAYMAYA', label: 'PayMaya', icon: Smartphone },
    { value: 'CARD', label: 'Card', icon: CreditCard },
  ];

  const handlePayment = async () => {
    if (paymentMethod === 'CASH' && tendered < total) {
      setError('Insufficient amount tendered');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          paymentMethod,
          amountTendered: paymentMethod === 'CASH' ? tendered : undefined,
          branchId,
          cashierId,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Payment failed');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAmountTendered('');
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setSuccess(false);
      setError(null);
      setAmountTendered('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment</span>
            <Button variant="ghost" size="icon" onClick={handleClose} disabled={processing}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-xl font-semibold">Payment Successful!</p>
            {paymentMethod === 'CASH' && change > 0 && (
              <p className="text-lg text-muted-foreground mt-2">Change: {formatCurrency(change)}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Button key={method.value} variant={paymentMethod === method.value ? 'default' : 'outline'} className="h-16 flex-col gap-1" onClick={() => setPaymentMethod(method.value)}>
                    <Icon className="h-5 w-5" /><span className="text-xs">{method.label}</span>
                  </Button>
                );
              })}
            </div>
            {paymentMethod === 'CASH' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Tendered</label>
                <Input type="number" placeholder="Enter amount..." value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} className="text-lg" />
                {tendered > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change</span>
                    <span className={change >= 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>{formatCurrency(Math.max(0, change))}</span>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map((amt) => (
                    <Button key={amt} variant="outline" size="sm" onClick={() => setAmountTendered(amt.toString())}>₱{amt}</Button>
                  ))}
                </div>
              </div>
            )}
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
            <Button className="w-full h-12 text-lg" onClick={handlePayment} disabled={processing || (paymentMethod === 'CASH' && tendered < total)}>
              {processing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
