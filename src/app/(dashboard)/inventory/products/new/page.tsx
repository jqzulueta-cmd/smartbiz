'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface VariantInput {
  sku: string;
  size: string;
  color: string;
  material: string;
  additionalCost: string;
  stockQuantity: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ barcode: '', name: '', description: '', categoryId: '', costPrice: '', sellingPrice: '', reorderLevel: '10', initialStock: '' });
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  const addVariant = () => setVariants(prev => [...prev, { sku: '', size: '', color: '', material: '', additionalCost: '0', stockQuantity: '0' }]);
  const removeVariant = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index));
  const updateVariant = (index: number, field: keyof VariantInput, value: string) => setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          costPrice: parseFloat(form.costPrice),
          sellingPrice: parseFloat(form.sellingPrice),
          reorderLevel: parseInt(form.reorderLevel),
          initialStock: parseInt(form.initialStock) || 0,
          branchId: 'branch-001',
          variants: variants.filter(v => v.sku).map(v => ({ ...v, additionalCost: parseFloat(v.additionalCost) || 0, stockQuantity: parseInt(v.stockQuantity) || 0 })),
          images: imageUrl ? [{ url: imageUrl, isPrimary: true }] : [],
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create product');
      router.push('/inventory');
    } catch (err) {
        <Card>
          <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Cost Price *</label><Input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} required /></div>
              <div><label className="text-sm font-medium mb-1 block">Selling Price *</label><Input type="number" step="0.01" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Reorder Level</label><Input type="number" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">Initial Stock</label><Input type="number" value={form.initialStock} onChange={e => setForm({ ...form, initialStock: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Variants</CardTitle><Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus className="h-4 w-4 mr-1" /> Add Variant</Button></CardHeader>
          <CardContent className="space-y-4">
            {variants.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No variants. Click &quot;Add Variant&quot; for size/color options.</p> : variants.map((variant, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 items-end p-3 border rounded-lg">
                <div><label className="text-xs font-medium">SKU</label><Input value={variant.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} className="h-8" /></div>
                <div><label className="text-xs font-medium">Size</label><Input value={variant.size} onChange={e => updateVariant(idx, 'size', e.target.value)} className="h-8" placeholder="S/M/L" /></div>
                <div><label className="text-xs font-medium">Color</label><Input value={variant.color} onChange={e => updateVariant(idx, 'color', e.target.value)} className="h-8" /></div>
                <div><label className="text-xs font-medium">Material</label><Input value={variant.material} onChange={e => updateVariant(idx, 'material', e.target.value)} className="h-8" /></div>
                <div><label className="text-xs font-medium">Extra Cost</label><Input type="number" step="0.01" value={variant.additionalCost} onChange={e => updateVariant(idx, 'additionalCost', e.target.value)} className="h-8" /></div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-4"><Link href="/inventory"><Button variant="outline" type="button">Cancel</Button></Link><Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Product'}</Button></div>
      </form>
    </div>
  );
}

      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/inventory"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div><h1 className="text-3xl font-bold tracking-tight">Add Product</h1><p className="text-muted-foreground">Create a new product with variants</p></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Barcode *</label><Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} required /></div>
              <div><label className="text-sm font-medium mb-1 block">Product Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Description</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Image URL</label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
          </CardContent>
        </Card>
