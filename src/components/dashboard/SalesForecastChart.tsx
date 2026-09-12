'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SalesTrendPoint, ProductForecast } from '@/types';

interface SalesTrendChartProps {
  data: SalesTrendPoint[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trend (Last 90 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const d = new Date(value);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₱${value}`} />
            <Tooltip
              formatter={(value: number) => [`₱${value.toFixed(2)}`, 'Revenue']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DemandForecastChartProps {
  forecasts: ProductForecast[];
}

export function DemandForecastChart({ forecasts }: DemandForecastChartProps) {
  // Combine all forecasts into a single chart dataset
  const allDates = new Set<string>();
  const productData: Record<string, Record<string, number>> = {};

  forecasts.forEach((f) => {
    productData[f.productName] = {};
    f.dailyForecast.forEach((point) => {
      allDates.add(point.date);
      productData[f.productName][point.date] = point.forecast;
    });
  });

  const chartData = Array.from(allDates)
    .sort()
    .map((date) => {
      const entry: Record<string, string | number> = { date };
      forecasts.forEach((f) => {
        entry[f.productName] = productData[f.productName][date] || 0;
      });
      return entry;
    });

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demand Forecast (Next 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const d = new Date(value);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: number, name: string) => [`${value.toFixed(1)} units`, name]}
            />
            <Legend />
            {forecasts.slice(0, 5).map((f, idx) => (
              <Line
                key={f.productId}
                type="monotone"
                dataKey={f.productName}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ForecastSummaryTableProps {
  forecasts: ProductForecast[];
}

export function ForecastSummaryTable({ forecasts }: ForecastSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Product</th>
                <th className="text-right py-3 px-2 font-medium">Current Stock</th>
                <th className="text-right py-3 px-2 font-medium">Predicted (30d)</th>
                <th className="text-right py-3 px-2 font-medium">Recommended Order</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f) => (
                <tr key={f.productId} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2 font-medium">{f.productName}</td>
                  <td className="py-3 px-2 text-right">{f.currentStock}</td>
                  <td className="py-3 px-2 text-right">{f.predictedDemand30d}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={f.recommendedOrder > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                      {f.recommendedOrder > 0 ? f.recommendedOrder : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
