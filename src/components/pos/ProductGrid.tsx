'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ScanBarcode, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { CartItem, Product } from '@/types';

interface ProductGridProps {
  branchId: string;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductGrid({ branchId, onAddToCart }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ branchId, pageSize: '50' });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (json.success) setProducts(json.data.items);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId, search, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const cats = new Map<string, string>();
    products.forEach((p: Product) => {
      if (p.categoryId && p.categoryName) cats.set(p.categoryId, p.categoryName);
    });
    setCategories(Array.from(cats.entries()).map(([id, name]) => ({ id, name })));
  }, [products]);

  const handleAddToCart = (product: Product) => {
    const inventory = product.inventory?.[0];
    onAddToCart({
      productId: product.id,
      name: product.name,
      barcode: product.barcode,
      price: Number(product.sellingPrice),
      quantity: 1,
      maxQuantity: inventory?.quantity ?? 999,
      imageUrl: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search or scan barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" size="icon"><ScanBarcode className="h-4 w-4" /></Button>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Button variant={categoryFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('')}>All</Button>
        {categories.map((cat) => (
          <Button key={cat.id} variant={categoryFilter === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter(cat.id)}>{cat.name}</Button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Package className="h-12 w-12 mb-2" /><p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => {
              const stock = product.inventory?.[0]?.quantity ?? 0;
              const isLowStock = stock <= product.reorderLevel;
              const isOutOfStock = stock === 0;
              return (
                <Card key={product.id} className={`p-3 cursor-pointer transition-all hover:shadow-md ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => !isOutOfStock && handleAddToCart(product)}>
                  <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                    {product.images?.[0] ? <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" /> : <Package className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(Number(product.sellingPrice))}</p>
                  <div className="mt-1">
                    {isOutOfStock ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Out of Stock</span> : isLowStock ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Low: {stock}</span> : <span className="text-xs text-muted-foreground">Stock: {stock}</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
