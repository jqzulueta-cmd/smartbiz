import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import type { ApiResponse, KPIData, SalesTrendPoint, ProductForecast, ForecastPoint } from '@/types';

/**
 * GET /api/analytics/forecast
 * Returns KPI data, sales trends, and demand forecasts.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const days = parseInt(searchParams.get('days') || '30');

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 90);

    // Fetch sales data for the last 90 days
    const sales = await prisma.sale.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        createdAt: { gte: startDate },
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate KPIs
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalCost = sales.reduce((saleSum, s) =>
      saleSum + s.items.reduce((itemSum, item) => {
        return itemSum + (Number(item.unitPrice) * 0.6 * item.quantity); // estimated cost
      }, 0), 0);
    const grossProfit = totalRevenue - totalCost;

    // Total stock value
    const inventory = await prisma.inventory.findMany({
      where: branchId ? { branchId } : {},
      include: { product: true },
    });
    const totalStockValue = inventory.reduce((sum, inv) =>
      sum + (Number(inv.product.costPrice) * inv.quantity), 0);
    const stockoutAlerts = inventory.filter(inv =>
      inv.quantity <= inv.product.reorderLevel).length;

    const kpi: KPIData = {
      totalRevenue,
      grossProfit,
      totalStockValue,
      stockoutAlerts,
      revenueChange: 0,
      profitChange: 0,
    };

    // Sales trend (daily aggregation)
    const trendMap = new Map<string, { revenue: number; transactions: number }>();
    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      const existing = trendMap.get(dateKey) || { revenue: 0, transactions: 0 };
      existing.revenue += Number(sale.totalAmount);
      existing.transactions += 1;
      trendMap.set(dateKey, existing);
    }
    const salesTrend: SalesTrendPoint[] = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.transactions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Demand forecasting using Exponential Smoothing
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventory: branchId ? { where: { branchId } } : true,
      },
      take: 50,
    });

    const forecasts: ProductForecast[] = products.map(product => {
      // Get daily sales velocity for this product
      const productSalesMap = new Map<string, number>();
      for (const sale of sales) {
        for (const item of sale.items) {
          if (item.productId === product.id) {
            const dateKey = sale.createdAt.toISOString().split('T')[0];
            productSalesMap.set(dateKey, (productSalesMap.get(dateKey) || 0) + item.quantity);
          }
        }
      }

      // Build daily demand array (last 90 days)
      const dailyDemand: number[] = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyDemand.push(productSalesMap.get(key) || 0);
      }

      // Exponential Smoothing (alpha = 0.3)
      const alpha = 0.3;
      let smoothed = dailyDemand[0] || 0;
      const smoothedValues: number[] = [smoothed];
      for (let i = 1; i < dailyDemand.length; i++) {
        smoothed = alpha * dailyDemand[i] + (1 - alpha) * smoothed;
        smoothedValues.push(smoothed);
      }

      // Simple Moving Average (7-day)
      const sma7 = dailyDemand.slice(-7).reduce((a, b) => a + b, 0) / 7;

      // Forecast next 30 days
      const dailyForecast: ForecastPoint[] = [];
      const predictedDaily = Math.max(smoothed, sma7 * 0.5);
      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date(now);
        forecastDate.setDate(forecastDate.getDate() + i);
        dailyForecast.push({
          date: forecastDate.toISOString().split('T')[0],
          forecast: Math.round(predictedDaily * 100) / 100,
          lowerBound: Math.round(predictedDaily * 0.7 * 100) / 100,
          upperBound: Math.round(predictedDaily * 1.3 * 100) / 100,
        });
      }

      const currentStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const predictedDemand30d = Math.round(predictedDaily * days);

      return {
        productId: product.id,
        productName: product.name,
        currentStock,
        predictedDemand30d,
        recommendedOrder: Math.max(0, predictedDemand30d - currentStock),
        dailyForecast,
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        kpi,
        salesTrend,
        forecasts: forecasts.filter(f => f.predictedDemand30d > 0).slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch analytics data',
    }, { status: 500 });
  }
}
